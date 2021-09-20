import React, { useState } from 'react';
import Content from './content';
import Control from './control';
import { ID } from 'utils/constants';
import './index.scss';

const DEFAULT = ID.CHAT;

const Application = () => {
  const [current, setCurrent] = useState(DEFAULT);

  const toggleApplication = (application) => {
    if (current !== application) setCurrent(application);
  };

  return (
    <div className="application">
      <Control
        current={current}
        toggleApplication={toggleApplication}
      />
      <Content current={current} />
    </div>
  );
};

const areEqual = () => true;

export default React.memo(Application, areEqual);
