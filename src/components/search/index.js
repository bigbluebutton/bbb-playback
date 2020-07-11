import React, { PureComponent } from 'react';
import Modal from 'components/utils/modal';
import './index.scss';

export default class Search extends PureComponent {
  renderBody() {
    return (
      <div className="body">
        body
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="header">
        <div className="title">
          title
        </div>
        <div className="subtitle">
          subtitle
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className="footer">
        footer
      </div>
    );
  }

  render() {
    const { toggleModal } = this.props;

    return (
      <Modal onClose={toggleModal}>
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </Modal>
    );
  }
}
