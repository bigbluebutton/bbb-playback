import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Icon from 'components/utils/icon';

const intlMessages = defineMessages({
  more: {
    id: 'button.more.aria',
    description: 'Aria label for the button that opens more actions',
  },
});

const propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.string,
    key: PropTypes.string,
    label: PropTypes.string,
    onSelect: PropTypes.func,
  })),
};

const defaultProps = { items: [] };

// Places the menu under the button, aligned with its end edge, so it stays
// on screen in both reading directions
const getPosition = (button) => {
  const rect = button.getBoundingClientRect();
  const rtl = getComputedStyle(button).direction === 'rtl';

  return {
    top: rect.bottom + 6,
    ...(rtl ? { left: Math.max(8, rect.left) } : { right: Math.max(8, window.innerWidth - rect.right) }),
  };
};

// "More" button with a menu of named actions. The menu is drawn on the page
// itself, since the top bar clips what overflows it
const More = ({ items }) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const button = useRef();
  const menu = useRef();

  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton && button.current) button.current.focus();
  };

  const focusItem = (index) => {
    const entries = menu.current ? [...menu.current.querySelectorAll('[role="menuitem"]')] : [];
    if (entries.length === 0) return;

    entries[(index + entries.length) % entries.length].focus();
  };

  useEffect(() => {
    if (!open) return undefined;

    const first = menu.current && menu.current.querySelector('[role="menuitem"]');
    if (first) first.focus();

    // A click outside closes the menu and does nothing else
    let closing = false;
    const handleDown = (event) => {
      closing = false;
      const inside = (menu.current && menu.current.contains(event.target))
        || (button.current && button.current.contains(event.target));
      if (inside) return;

      closing = true;
      event.stopPropagation();
      setOpen(false);
    };
    const swallow = (event) => {
      if (!closing) return;

      event.stopPropagation();
      if (event.type === 'click') {
        event.preventDefault();
        closing = false;
      }
    };
    const handleResize = () => setOpen(false);

    window.addEventListener('pointerdown', handleDown, true);
    window.addEventListener('pointerup', swallow, true);
    window.addEventListener('click', swallow, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointerdown', handleDown, true);
      window.removeEventListener('pointerup', swallow, true);
      window.removeEventListener('click', swallow, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  if (items.length === 0) return null;

  const label = intl.formatMessage(intlMessages.more);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }

    setPosition(getPosition(button.current));
    setOpen(true);
  };

  const handleMenuKey = (event) => {
    const entries = [...menu.current.querySelectorAll('[role="menuitem"]')];
    const index = entries.indexOf(document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        focusItem(index + 1);
        break;
      case 'ArrowUp':
        focusItem(index - 1);
        break;
      case 'Home':
        focusItem(0);
        break;
      case 'End':
        focusItem(entries.length - 1);
        break;
      case 'Escape':
        close();
        break;
      case 'Tab':
        setOpen(false);
        return;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const select = (item) => {
    close();
    item.onSelect();
  };

  return (
    <div className="button-wrapper more-wrapper">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={cx('button', 'default', 'circle', { active: open })}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            toggle();
          }
        }}
        ref={button}
        title={label}
        type="button"
      >
        <Icon name="more" />
      </button>
      {open ? createPortal(
        <div
          aria-label={label}
          className="top-bar-menu"
          onKeyDown={handleMenuKey}
          ref={menu}
          role="menu"
          style={position}
        >
          {items.map(item => (
            <button
              className="top-bar-menu-item"
              key={item.key}
              onClick={() => select(item)}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <span className="top-bar-menu-icon" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  );
};

More.propTypes = propTypes;
More.defaultProps = defaultProps;

export default More;
