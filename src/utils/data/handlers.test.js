import {
  getScrollTop,
  handleOnKeyActivation,
} from './handlers';

it('gets the vertical offset of a scrollable list', () => {
  const parentNode = { clientHeight: 100 };
  const firstNode = { offsetTop: 0 };
  const currentNode = {
    clientHeight: 10,
    offsetTop: 100,
    parentNode,
  };

  // TODO: Add more tests
  expect(getScrollTop(firstNode, currentNode, 'top')).toEqual(100);
  expect(getScrollTop(firstNode, currentNode, 'middle')).toEqual(55);
  expect(getScrollTop(firstNode, currentNode, 'bottom')).toEqual(10);
});

describe('handleOnKeyActivation', () => {
  const keydown = (key) => ({ key, preventDefault: jest.fn() });

  it.each(['Enter', ' '])('activates with %p', (key) => {
    const action = jest.fn();
    const event = keydown(key);
    handleOnKeyActivation(event, action);

    expect(action).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it.each(['altKey', 'ctrlKey', 'metaKey'])('leaves Enter with %s to the shortcuts', (modifier) => {
    const action = jest.fn();
    const event = { ...keydown('Enter'), [modifier]: true };
    handleOnKeyActivation(event, action);

    expect(action).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it.each(['Tab', 'ArrowDown', 'a'])('leaves %p alone', (key) => {
    const action = jest.fn();
    const event = keydown(key);
    handleOnKeyActivation(event, action);

    expect(action).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
