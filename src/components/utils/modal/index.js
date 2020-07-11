import React, { PureComponent } from 'react';
import Button from 'components/utils/button';
import './index.scss';

export default class More extends PureComponent {
  render() {
    const {
      children,
      onClose,
    } = this.props;

    return (
      <div className="modal-wrapper">
        <div className="modal">
          <div className="modal-control">
            <Button
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
