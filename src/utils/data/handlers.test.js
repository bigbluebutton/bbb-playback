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

it('activates on Enter and Space only', () => {
  const action = jest.fn();
  const preventDefault = jest.fn();

  handleOnKeyActivation({ key: 'Enter', preventDefault }, action);
  handleOnKeyActivation({ key: ' ', preventDefault }, action);
  expect(action).toHaveBeenCalledTimes(2);
  expect(preventDefault).toHaveBeenCalledTimes(2);

  handleOnKeyActivation({ key: 'Tab', preventDefault }, action);
  handleOnKeyActivation(null, action);
  expect(action).toHaveBeenCalledTimes(2);
  expect(preventDefault).toHaveBeenCalledTimes(2);
});
