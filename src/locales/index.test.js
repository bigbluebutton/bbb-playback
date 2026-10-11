import { getMessages } from './index';
import messages from './messages';

test('loading another language never overwrites the English fallback catalog', () => {
  const original = { ...messages.en };
  const japanese = getMessages('ja');
  expect(japanese).not.toBe(messages.en);
  expect(messages.en).toEqual(original);
  expect(getMessages('en')).toEqual(original);
});
