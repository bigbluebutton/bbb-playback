import React from 'react';
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

const Modal = ({ children, onClose }) => {
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

export default Modal;
