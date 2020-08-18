import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  close: {
    id: 'button.close.aria',
    description: 'Aria label for the close button',
  },
});

export default class More extends PureComponent {
  render() {
    const {
      children,
      intl,
      onClose,
    } = this.props;

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
  }
}
