// Translates caption lines on the viewer's device with open translation
// models (transformers.js), away from the page so playback stays smooth.
// Started by src/utils/captions/local.js. Models are downloaded once and kept
// in the browser cache.

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

const getPipeline = (settings, model, onProgress) => {
  if (!pipelines.has(model)) {
    const created = getLibrary(settings).then(({ pipeline }) => pipeline('translation', model, {
      dtype: 'q8',
      progress_callback: onProgress,
    }));
    created.catch(() => pipelines.delete(model));
    pipelines.set(model, created);
  }

  return pipelines.get(model);
};

// Download progress over every file of every model of the request. Hosts
// do not always send file sizes, so the expected model sizes stand in
const createProgress = (report, expected) => {
  const files = new Map();
  let last = 0;

  return (event) => {
    if (event.status !== 'progress') return;

    files.set(`${event.name}/${event.file}`, event);
    let loaded = 0;
    let known = 0;
    files.forEach((file) => {
      loaded += file.loaded || 0;
      known += file.total || 0;
    });
    const value = Math.min(loaded / Math.max(known, expected, 1), 0.99);
    if (value > last) {
      last = value;
      report(value);
    }
  };
};

const load = (settings, steps, report) => {
  const expected = steps.reduce((sum, step) => sum + (step.size || 0), 0);
  const onProgress = createProgress(report, expected);

  return Promise.all(steps.map(step => getPipeline(settings, step.model, onProgress)));
};

// Each step is one model; a language pair without a direct model goes
// through English in two steps. Lines are translated one at a time: these
// models lose track of where a sentence ends when lines are batched
const translate = async (settings, steps, text) => {
  let result = text;
  for (const step of steps) {
    const pipe = await getPipeline(settings, step.model);
    const input = step.prefix ? `${step.prefix} ${result}` : result;
    const [output] = await pipe(input, { ...step.options, max_new_tokens: 256 });
    result = output.translation_text;
  }

  return result;
};

self.onmessage = async ({ data }) => {
  const { id, settings, steps, text, type } = data;
  try {
    if (type === 'load') {
      await load(settings, steps, (loaded) => self.postMessage({ id, loaded, type: 'progress' }));
      self.postMessage({ id, type: 'done' });
    } else if (type === 'translate') {
      self.postMessage({ id, text: await translate(settings, steps, text), type: 'done' });
    }
  } catch (error) {
    self.postMessage({ id, message: String(error && error.message ? error.message : error), type: 'error' });
  }
};
