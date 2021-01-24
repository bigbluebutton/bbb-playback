import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import Thumbnails from 'components/thumbnails';
import { search as config } from 'config';
import Button from 'components/utils/button';
import Modal from 'components/utils/modal';
import {
  isEmpty,
  isEqual,
  search,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  search: {
    id: 'player.search.aria',
    description: 'Aria label for the search button',
  },
});

export default class Search extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      disabled: true,
      search: [],
    };
  }

  handleOnChange(event) {
    if (!event || !event.target) return null;

    const { value } = event.target;
    if (value) {
      const disabled = value.length < config.length.min;
      if (!disabled) {
        const { thumbnails } = this.props;
        const result = search(value, thumbnails);

        if (!isEqual(this.state.search, result, 'array')) {
          this.setState({ search: result });
        }
      } else {
        if (!isEmpty(this.state.search)) {
          this.setState({ search: [] });
        }
      }

      if (this.state.disabled !== disabled) {
        this.setState({ disabled });
      }
    }
  }

  handleOnClick(event) {
    const {
      handleSearch,
      toggleModal,
    } = this.props;

    const { search } = this.state;

    handleSearch(search);
    toggleModal();
  }

  renderBody() {
    const {
      intl,
      metadata,
      thumbnails,
    } = this.props;

    const { search } = this.state;

    return (
      <div className="search-body">
        <input
          maxLength={config.length.max}
          minLength={config.length.min}
          onChange={(event) => this.handleOnChange(event)}
          type="text"
        />
        <div className={cx('result', { active: true })}>
          <Thumbnails
            currentDataIndex={0}
            handleSearch={null}
            interactive={false}
            intl={intl}
            metadata={metadata}
            player={null}
            search={search}
            thumbnails={thumbnails}
          />
        </div>
      </div>
    );
  }

  renderFooter() {
    const { intl } = this.props;
    const { disabled } = this.state;

    return (
      <div className="search-footer">
        <Button
          aria={intl.formatMessage(intlMessages.search)}
          disabled={disabled}
          handleOnClick={(event) => this.handleOnClick(event)}
          icon="search"
          type="solid"
        />
      </div>
    );
  }

  render() {
    const {
      intl,
      toggleModal,
    } = this.props;

    return (
      <Modal
        intl={intl}
        onClose={toggleModal}
      >
        {this.renderBody()}
        {this.renderFooter()}
      </Modal>
    );
  }
}
