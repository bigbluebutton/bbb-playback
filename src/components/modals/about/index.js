import React from 'react';
import PropTypes from 'prop-types';
import Body from './body';
import Footer from './footer';
import Header from './header';
import Modal from 'components/utils/modal';
import './index.scss';

const propTypes = { handleClose: PropTypes.func };

const defaultProps = { handleClose: () => {} };

const About = ({ handleClose }) => {

  return (
    <Modal onClose={handleClose}>
      <Header />
      <Body />
      <Footer />
    </Modal>
  );
};

About.propTypes = propTypes;
About.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(About, areEqual);
