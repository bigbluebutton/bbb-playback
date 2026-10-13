import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Toast from './index';
import notify, { dismiss } from 'utils/toast';

describe('toast', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Toast />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const shown = () => container.textContent;

  it('shows the latest message', () => {
    act(() => notify({ message: 'First' }));
    act(() => notify({ message: 'Second' }));

    expect(shown()).toBe('Second');
  });

  it('takes down a message by its key, and only that one', () => {
    act(() => notify({ key: 'captions', message: 'Getting Spanish captions ready…' }));
    act(() => dismiss('bookmarks'));
    expect(shown()).toBe('Getting Spanish captions ready…');

    act(() => dismiss('captions'));
    expect(shown()).toBe('');
  });

  it('closes after its duration', () => {
    jest.useFakeTimers();
    act(() => notify({ duration: 1000, message: 'Saved' }));
    act(() => jest.advanceTimersByTime(1000));
    jest.useRealTimers();

    expect(shown()).toBe('');
  });
});
