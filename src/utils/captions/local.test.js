import { getSteps } from './local';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

describe('local translation models', () => {
  const userAgent = navigator.userAgent;

  const setDevice = (agent, maxTouchPoints = 0) => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: agent });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints });
  };

  afterEach(() => setDevice(userAgent));

  it('uses one small model into or out of English', () => {
    expect(getSteps('en', 'es')).toEqual([{ model: 'Xenova/opus-mt-en-es', size: 115e6 }]);
    expect(getSteps('ar', 'en')).toEqual([{ model: 'Xenova/opus-mt-ar-en', size: 115e6 }]);
  });

  it('goes through English for other pairs', () => {
    expect(getSteps('ar', 'fr').map(step => step.model)).toEqual([
      'Xenova/opus-mt-ar-en',
      'Xenova/opus-mt-en-fr',
    ]);
  });

  it('tags lines for models with several target languages', () => {
    expect(getSteps('en', 'pt')).toEqual([{ model: 'Xenova/opus-mt-en-ROMANCE', prefix: '>>pt<<', size: 115e6 }]);
  });

  it('uses the multilingual model on computers for the other languages', () => {
    expect(getSteps('en', 'fa')).toEqual([{
      model: 'Xenova/m2m100_418M',
      options: { src_lang: 'en', tgt_lang: 'fa' },
      size: 640e6,
    }]);
    expect(getSteps('ar', 'ja')[0].model).toBe('Xenova/m2m100_418M');
  });

  it('keeps phones and tablets to the small models', () => {
    setDevice(IPHONE, 5);
    expect(getSteps('en', 'es')).toHaveLength(1);
    expect(getSteps('en', 'fa')).toBeNull();

    setDevice(IPAD, 5);
    expect(getSteps('ar', 'de')).toHaveLength(2);
    expect(getSteps('ar', 'ko')).toBeNull();
  });

  it('offers nothing for the same or unknown languages', () => {
    expect(getSteps('en', 'en')).toBeNull();
    expect(getSteps('en', 'xx')).toBeNull();
  });
});
