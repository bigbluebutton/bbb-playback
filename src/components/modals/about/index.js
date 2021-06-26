import React from 'react';
import PropTypes from 'prop-types';
import Body from './body';
import Footer from './footer';
import Header from './header';
import Modal from 'components/utils/modal';
import './index.scss';

const propTypes = {
  content: PropTypes.object,
  metadata: PropTypes.object,
  toggleModal: PropTypes.func,
};

const defaultProps = {
  content: {},
  metadata: {},
  toggleModal: () => {},
};

const About = ({
  content,
  metadata,
  toggleModal,
}) => {

  return (
    <Modal onClose={toggleModal}>
      <Header metadata={metadata} />
      <Body
        content={content}
        users={metadata.participants}
      />
      <Footer />
    </Modal>
  );
};

About.propTypes = propTypes;
About.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(About, areEqual);
