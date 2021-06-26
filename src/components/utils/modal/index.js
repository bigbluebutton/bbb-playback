import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  close: {
    id: 'button.close.aria',
    description: 'Aria label for the close button',
  },
});

const propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClose: PropTypes.func,
};

const defaultProps = {
  children: null,
  onClose: () => {},
};

const Modal = ({
  children,
  onClose,
}) => {
  const intl = useIntl();

  return (
    <div className="modal-wrapper">
      <div className="modal">
        <div className="modal-control">
          <Button
            aria={intl.formatMessage(intlMessages.close)}
            circle
            handleOnClick={onClose}
            icon="close"
          />
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = propTypes;
Modal.defaultProps = defaultProps;

export default Modal;
