import { captions as config } from 'config';
import {
  isBlank,
  parseVTT,
  pickNext,
  tidyText,
} from 'utils/captions/vtt';
import {
  findProviders,
  getLanguage,
  getProviders,
  getTranslator,
} from 'utils/captions/translators';
import {
  readTranslation,
  writeTranslation,
} from 'utils/captions/cache';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';
import logger from 'utils/logger';

const getLanguageName = (locale, language) => {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(language);
    if (name && name !== language) return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch (error) {
    // Older browsers
  }

  return language.toUpperCase();
};

const getTargets = (locale, existing) => {
  const targets = [getLanguage(locale), ...(config.translate.languages || [])];

  return [...new Set(targets)].filter(language => language && !existing.has(language));
};

const loadSourceCues = (source) => {
  return fetch(buildFileURL(`caption_${source.locale}.vtt`)).then(response => {
    if (!response.ok) throw new Error(`captions ${response.status}`);

    return response.text();
  }).then(parseVTT);
};

// video.js tracks copy cues that are not its own VTTCue type, which would
// break replacing the text later; native tracks (Safari) need native cues
const createCue = (track, cue) => {
  const emulated = Array.isArray(track.cues_) && window.vttjs && window.vttjs.VTTCue;
  const Cue = emulated ? window.vttjs.VTTCue : window.VTTCue;

  return new Cue(cue.start, cue.end, cue.text);
};

const clearCues = (track) => {
  if (!track.cues) return;

  while (track.cues.length > 0) track.removeCue(track.cues[0]);
};

// Adds machine translated caption languages to the CC menu. A selected
// language shows the original lines right away and swaps each one for its
// translation as soon as it is ready, starting from where the viewer is.
// Resolves once the languages are in the menu
const setupCaptionTranslation = (videojsPlayer, {
  label,
  locale,
  onFailed,
  onHidden,
  onPreparing,
  onProgress,
  onReady,
  onStart,
}) => {
  const sources = storage.captions || [];
  if (sources.length === 0) return Promise.resolve();

  const providers = getProviders();
  if (providers.length === 0) return Promise.resolve();

  const source = sources[0];
  const sourceLanguage = getLanguage(source.locale);
  const existing = new Set(sources.map(caption => getLanguage(caption.locale)));
  const targets = getTargets(locale, existing);
  const started = new Set();
  // Lines translated so far, by language, so coming back to a language
  // picks up at once without waiting for the browser cache
  const memory = new Map();
  // The notice each language would show now (downloading, getting ready,
  // translating), shown again when the viewer comes back to it
  const status = new Map();
  // The language whose failure just turned captions back to the original,
  // so the notice saying so stays
  let failed = null;
  const recordId = storage.metadata ? storage.metadata.id : '';

  // Fetched right away so it is ready when a language is picked
  let sourceCues = null;
  const getSourceCues = () => {
    if (!sourceCues) {
      sourceCues = loadSourceCues(source).catch(error => {
        sourceCues = null;
        throw error;
      });
    }

    return sourceCues;
  };
  getSourceCues().catch(() => {});

  // Paused players do not redraw captions until the next time update
  const refreshDisplay = () => {
    const display = videojsPlayer.getChild('textTrackDisplay');
    if (display && typeof display.updateDisplay === 'function') display.updateDisplay();
  };

  const showSourceTrack = () => {
    const tracks = videojsPlayer.textTracks();
    for (let index = 0; index < tracks.length; index++) {
      if (tracks[index].language === source.locale) {
        tracks[index].mode = 'showing';
        return;
      }
    }
  };

  // Tries each provider in turn (see getProviders): if one stalls or fails,
  // the next takes over from the lines still left. Switching to another
  // language pauses this one; picking it again resumes where it stopped
  const translateTrack = async (track, option) => {
    const { language, name, providers: candidates } = option;
    started.add(language);
    const cacheKey = `${recordId}|${source.locale}|${language}`;
    let results = null;
    let count = 0;

    // Notices only while the viewer still has this language on. Lasting
    // ones are kept to show again when the viewer comes back to it
    const tell = (notice, lasting = false) => {
      if (lasting) {
        status.set(language, notice);
      } else {
        status.delete(language);
      }
      if (track.mode === 'showing') notice(name);
    };

    // Download progress, then a notice while the model gets ready, which
    // can take a minute or two in Safari
    let lastPercent = -1;
    let preparing = false;
    const handleProgress = (loaded) => {
      if (loaded >= 1) {
        if (!preparing) tell(onPreparing, true);
        preparing = true;
        return;
      }

      const percent = Math.floor((loaded || 0) * 10) * 10;
      if (percent === lastPercent || preparing) return;

      lastPercent = percent;
      tell((language) => onProgress(language, percent), true);
    };
    // Told once, when the first translated line is on screen
    let announced = false;

    const save = () => writeTranslation(cacheKey, { count, texts: results });

    try {
      const remembered = memory.get(language);
      const [cues, cached] = await Promise.all([
        getSourceCues(),
        remembered ? Promise.resolve(remembered) : readTranslation(cacheKey),
      ]);
      const saved = cached && cached.count === cues.length && Array.isArray(cached.texts)
        ? cached.texts
        : [];
      count = cues.length;
      results = cues.map((cue, index) => (typeof saved[index] === 'string' && !isBlank(saved[index])
        ? tidyText(saved[index])
        : null));
      memory.set(language, { count, texts: results });

      // Saved lines show translated at once, the rest show the original
      clearCues(track);
      let pending = [];
      cues.forEach((cue, index) => {
        const vttCue = createCue(track, { ...cue, text: results[index] ?? cue.text });
        track.addCue(vttCue);
        if (results[index] === null) pending.push({ cue, index, vttCue });
      });
      refreshDisplay();

      if (pending.length === 0) {
        status.delete(language);
        return;
      }

      tell(onStart, true);

      const translateWith = async (provider) => {
        // Set when this run fails so every worker stops at once
        const run = { failed: false };
        const translator = await getTranslator(provider, sourceLanguage, language, handleProgress);

        // Batches start with the line on screen and grow (1, 2, 4… up to the
        // provider's size), so it shows translated in about a second; seeking
        // starts over from the new position
        const maxSize = provider.batchSize || 1;
        let size = 1;
        const restart = () => {
          size = 1;
        };
        videojsPlayer.on('seeking', restart);
        let sinceSave = 0;

        // A few workers, each taking the lines closest to where the viewer is
        const worker = async () => {
          while (pending.length > 0 && !run.failed && track.mode === 'showing') {
            if (videojsPlayer.isDisposed()) return;

            const batch = pickNext(pending, videojsPlayer.currentTime(), size);
            pending = pending.filter(item => !batch.includes(item));
            size = Math.min(size * 2, maxSize);

            let texts;
            try {
              texts = await translator.translate(batch.map(item => item.cue.text));
            } catch (error) {
              // Left for the next provider
              pending = pending.concat(batch);
              run.failed = true;
              throw error;
            }
            if (videojsPlayer.isDisposed()) return;

            // A line that comes back empty keeps the original
            batch.forEach((item, index) => {
              const text = isBlank(texts[index]) ? item.cue.text : tidyText(texts[index]);
              item.vttCue.text = text;
              results[item.index] = text;
            });
            refreshDisplay();
            if (!announced) {
              announced = true;
              tell(onReady);
            }

            sinceSave += batch.length;
            if (sinceSave >= 40) {
              sinceSave = 0;
              save();
            }
          }
        };

        const workers = Array.from({ length: provider.concurrency || 1 }, worker);
        // Every worker settles before the next provider starts
        const outcomes = await Promise.allSettled(workers);
        if (!videojsPlayer.isDisposed()) videojsPlayer.off('seeking', restart);
        const failure = outcomes.find(outcome => outcome.status === 'rejected');
        if (failure) throw failure.reason;
      };

      let lastError = null;
      for (const provider of candidates) {
        if (videojsPlayer.isDisposed() || pending.length === 0 || track.mode !== 'showing') break;

        try {
          await translateWith(provider);
          lastError = null;
        } catch (error) {
          logger.warn('captions', 'translate', language, provider.name, error);
          lastError = error;
        }
      }

      if (videojsPlayer.isDisposed()) return;
      save();
      if (lastError) throw lastError;
      if (pending.length === 0) status.delete(language);
      // Paused: the lines done so far are saved for when it comes back,
      // which may already be now
      if (pending.length > 0) {
        started.delete(language);
        if (track.mode === 'showing') translateTrack(track, option);
      }
    } catch (error) {
      if (videojsPlayer.isDisposed()) return;

      // Lines already translated are kept for the next attempt
      if (results && results.some(text => text !== null)) save();

      logger.warn('captions', 'translate', language, error);
      started.delete(language);
      status.delete(language);

      // The viewer has moved on to another language: this one tries again
      // when picked again, without disturbing the one on screen
      if (track.mode !== 'showing') return;

      memory.delete(language);
      failed = track;
      clearCues(track);
      track.mode = 'disabled';
      showSourceTrack();
      onFailed(name);
    }
  };

  // The language pack for the viewer's own language starts downloading on
  // their first click or key press (browsers require a gesture), so it is
  // usually ready by the time they open the captions menu
  const warmUp = (options) => {
    if (config.translate.preload === false) return;

    // Only when the best provider downloads language packs (Chrome's)
    const languages = options.filter(option => option.providers[0].preload).map(({ language }) => language);
    const preferred = [locale, ...(navigator.languages || [])].map(getLanguage);
    const target = preferred.find(language => languages.includes(language));
    if (!target) return;

    const [provider] = options.find(({ language }) => language === target).providers;

    const stop = () => {
      document.removeEventListener('pointerdown', handleGesture, true);
      document.removeEventListener('keydown', handleGesture, true);
    };

    function handleGesture() {
      stop();
      getTranslator(provider, sourceLanguage, target).catch(error => {
        logger.debug('captions', 'warm up', target, error);
      });
    }

    document.addEventListener('pointerdown', handleGesture, true);
    document.addEventListener('keydown', handleGesture, true);
    videojsPlayer.on('dispose', stop);
  };

  return Promise.all(targets.map(language => {
    return findProviders(providers, sourceLanguage, language).then(found => found.length > 0 ? { language, providers: found } : null);
  })).then(options => {
    if (videojsPlayer.isDisposed()) return;

    const tracks = new Map();
    options.filter(Boolean).forEach(({ language, providers: found }) => {
      const name = getLanguageName(locale, language);
      const track = videojsPlayer.addTextTrack('subtitles', `${name} · ${label}`, language);
      tracks.set(track, { language, name, providers: found });
    });

    if (tracks.size === 0) return;

    // Each switch shows only the picked language's own notice: the one
    // left behind keeps working quietly
    let current = null;
    videojsPlayer.textTracks().addEventListener('change', () => {
      const showing = [...tracks.keys()].find(track => track.mode === 'showing') || null;
      if (showing === current) return;

      const previous = current;
      current = showing;
      if (!showing) {
        if (previous !== failed) onHidden();
        failed = null;
        return;
      }

      const option = tracks.get(showing);
      const notice = status.get(option.language);
      if (started.has(option.language) && notice) {
        notice(option.name);
      } else {
        onHidden();
      }
      if (!started.has(option.language)) translateTrack(showing, option);
    });

    warmUp([...tracks.values()]);

    logger.debug('captions', 'translations', [...tracks.values()].map(({ language }) => language));
  });
};

export default setupCaptionTranslation;
