import React from 'react';
import {
  BrowserRouter,
  Route,
  Switch,
} from 'react-router-dom';
import { ERROR } from 'utils/constants';
import Error from './error';
import Loader from './loader';

const Router = () => {

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Switch>
        <Route
          path="/:recordId"
          component={Loader}
        />
        <Route render={() => <Error code={ERROR.NOT_FOUND} />} />
      </Switch>
    </BrowserRouter>
  );
};

export default Router;
