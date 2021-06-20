import React from 'react';
import Body from './body';
import Footer from './footer';
import Header from './header';
import Modal from 'components/utils/modal';
import './index.scss';

const About = (props) => {
  const {
    content,
    metadata,
    toggleModal,
  } = props;

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

// Avoid re-render
const areEqual = () => true;

export default React.memo(About, areEqual);
