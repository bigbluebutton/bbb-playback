import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import messages from './messages';

const collectArguments = (elements, names = new Set()) => {
  elements.forEach(element => {
    if (element.type !== TYPE.literal && element.type !== TYPE.pound) {
      names.add(element.value);
    }

    if (element.options) {
      Object.values(element.options).forEach(option => {
        collectArguments(option.value, names);
      });
    }

    if (element.children) collectArguments(element.children, names);
  });

  return names;
};

const getArguments = (message) => [...collectArguments(parse(message))].sort();

const english = messages.en;

describe('locale messages', () => {
  Object.entries(messages).forEach(([locale, strings]) => {
    describe(locale, () => {
      it('only contains keys that exist in English', () => {
        const unknown = Object.keys(strings).filter(key => !(key in english));

        expect(unknown).toEqual([]);
      });

      it('parses and uses the same placeholders as English', () => {
        Object.entries(strings).forEach(([key, message]) => {
          let names;
          try {
            names = getArguments(message);
          } catch (error) {
            throw new Error(`${locale} ${key} does not parse: ${message}`);
          }

          expect({ key, names }).toEqual({ key, names: getArguments(english[key]) });
        });
      });
    });
  });
});
