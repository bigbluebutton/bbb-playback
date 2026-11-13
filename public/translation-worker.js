// Translates caption lines on the viewer's device with an open translation
// model (transformers.js), away from the page so playback stays smooth.
// Started by src/utils/captions/local.js, which sends one request at a
// time. Models are downloaded once and kept in the browser cache.

let library = null;
const pipelines = new Map();

const getLibrary = (settings) => {
  if (!library) {
    library = import(settings.library).then((module) => {
      module.env.allowLocalModels = false;
      if (settings.models) module.env.remoteHost = settings.models;

      return module;
    }, (error) => {
      library = null;
      throw error;
    });
  }

  return library;
};

// Large downloads break now and then; the next try reuses what the browser
// cache already holds
const RETRY_DELAYS = [2000, 6000];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createPipeline = async (settings, model, onProgress) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const { pipeline } = await getLibrary(settings);

      return await pipeline('translation', model, {
        dtype: 'q8',
        progress_callback: onProgress,
      });
    } catch (error) {
      if (attempt >= RETRY_DELAYS.length) throw error;
      await wait(RETRY_DELAYS[attempt]);
    }
  }
};

const getPipeline = (settings, model, onProgress) => {
  if (!pipelines.has(model)) {
    const created = createPipeline(settings, model, onProgress);
    created.catch(() => pipelines.delete(model));
    pipelines.set(model, created);
  }

  return pipelines.get(model);
};

// Download progress of one model. Hosts do not always send file sizes, so
// the expected model size stands in. Once both model files are in, the
// page hears that the model is being prepared, which can take minutes in
// Safari
const MODEL_FILES = 2;

const createProgress = (post, expected) => {
  const files = new Map();
  let last = 0;
  let downloaded = false;

  return (event) => {
    if (event.status === 'done' && /\.onnx$/.test(event.file || '')) {
      files.set(event.file, { done: true });
      const done = [...files.values()].filter(file => file.done).length;
      if (!downloaded && done >= MODEL_FILES) {
        downloaded = true;
        post({ type: 'downloaded' });
      }
      return;
    }
    if (event.status !== 'progress' || downloaded) return;

    files.set(event.file, event);
    let loaded = 0;
    let known = 0;
    files.forEach((file) => {
      loaded += file.loaded || 0;
      known += file.total || 0;
    });
    const value = Math.min(loaded / Math.max(known, expected, 1), 0.99);
    if (value > last) {
      last = value;
      post({ loaded: value, type: 'progress' });
    }
  };
};

// One step of a translation (a pair without a direct model goes through
// English in two). Lines are translated one at a time: these models lose
// track of where a sentence ends when lines are batched
const translate = async (settings, step, text) => {
  const pipe = await getPipeline(settings, step.model);
  const input = step.prefix ? `${step.prefix} ${text}` : text;
  const [output] = await pipe(input, { ...step.options, max_new_tokens: 256 });

  return output.translation_text;
};

self.onmessage = async ({ data }) => {
  const { id, settings, step, text, type } = data;
  const post = (message) => self.postMessage({ ...message, id });
  try {
    if (type === 'load') {
      await getPipeline(settings, step.model, createProgress(post, step.size || 0));
      post({ type: 'done' });
    } else if (type === 'translate') {
      post({ text: await translate(settings, step, text), type: 'done' });
    }
  } catch (error) {
    post({ message: String(error && error.message ? error.message : error), type: 'error' });
  }
};
