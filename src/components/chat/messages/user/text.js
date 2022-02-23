import React from 'react';
import PropTypes from 'prop-types';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';

const propTypes = {
  active: PropTypes.bool,
  hyperlink: PropTypes.bool,
  text: PropTypes.string,
  emphasised: PropTypes.bool,
  chatEmphasizedText: PropTypes.bool,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  text: '',
  emphasised: false,
  chatEmphasizedText: true,
};

const Text = ({
  active,
  hyperlink,
  text,
  emphasised,
  chatEmphasizedText
}) => {
  if (hyperlink) {
    const options = {
      className: cx('linkified', { inactive: !active }),
    };

    return (
      <Linkify options={options}>
        {emphasised && chatEmphasizedText ?
          (<b>{text}</b>):
          (text)
        }
      </Linkify>
    );
  }

  return (
    <React.Fragment>
      {emphasised && chatEmphasizedText ?
        (<b>{text}</b>):
        (text)
      }
    </React.Fragment>
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
