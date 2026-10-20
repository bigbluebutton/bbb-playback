// A stand-in for Chrome's built-in translator (window.Translator), put in
// the page before the player loads. It marks each line with its language,
// e.g. "[es] مرحبا", in every browser engine, so tests do not depend on a
// translation service. Languages can be slowed down or made to fail:
//   useFakeTranslator(page, { delay: { es: 3000 }, fail: { es: true } })
const useFakeTranslator = (page, options = {}) => page.addInitScript((settings) => {
  const fake = {
    delay: {},
    fail: {},
    languages: ['en', 'es', 'fr'],
    ...settings,
  };
  window.fakeTranslator = fake;

  window.Translator = {
    availability: async ({ sourceLanguage, targetLanguage }) => (
      sourceLanguage === 'ar' && fake.languages.includes(targetLanguage) ? 'available' : 'unavailable'
    ),
    create: async ({ targetLanguage }) => ({
      translate: async (text) => {
        const delay = fake.delay[targetLanguage] || 0;
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (fake.fail[targetLanguage]) throw new Error(`no ${targetLanguage}`);

        return `[${targetLanguage}] ${text}`;
      },
    }),
  };
}, options);

// The in-browser models download from these hosts; tests that need a
// translation to fail block them
const IN_BROWSER_MODELS = /cdn\.jsdelivr\.net|huggingface\.co/;

module.exports = {
  IN_BROWSER_MODELS,
  useFakeTranslator,
};
