import React from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import cx from 'classnames';
import Modal from 'components/utils/modal';
import { ID } from 'utils/data';
import './index.scss';

const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;

const CONTENT = [
  ID.USERS,
  ID.PRESENTATION,
  ID.CHAT,
  ID.POLLS,
  ID.NOTES,
  ID.SCREENSHARE,
  ID.CAPTIONS,
];

const Body = ({ content, users }) => {
  const data = {
    ...content,
    users,
  };

  return (
    <div className="about-body">
      {CONTENT.map((item) => (
        <Item
          icon={item}
          key={item}
          value={data[item]}
        />
      ))}
    </div>
  );
};

const Header = ({ metadata }) => {
  const {
    end,
    name,
    start,
  } = metadata;

  const subtitle = [];
  subtitle.push(
    <FormattedDate
      value={new Date(start)}
      day="numeric"
      month="long"
      year="numeric"
    />
  );

  subtitle.push(<FormattedTime value={new Date(start)} />);
  subtitle.push(<FormattedTime value={new Date(end)} />);

  return (
    <div className="about-header">
      <div className="title">
        {name}
      </div>
      <div className="subtitle">
        {subtitle.map(s => <div className="item">{s}</div>)}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <div className="about-footer">
      {BUILD ? <Item key={'settings'} value={BUILD} /> : null}
    </div>
  );
};

const Item = ({ icon, value }) => {
  let element;
  if (typeof value === 'boolean') {
    const icon = value ? 'icon-check' : 'icon-close';
    element = <div className={cx(icon, { green: value, red: !value})} />;
  } else {
    element = value;
  }

  return (
    <div className="item">
      <div className={`icon-${icon}`} />
      <div className="value">
        {element}
      </div>
    </div>
  );
};

const About = (props) => {
  const {
    content,
    intl,
    metadata,
    toggleModal,
  } = props;

  return (
    <Modal
      intl={intl}
      onClose={toggleModal}
    >
      <Header metadata={metadata} />
      <Body
        content={content}
        users={metadata.participants}
      />
      <Footer />
    </Modal>
  );
};

export default About;
