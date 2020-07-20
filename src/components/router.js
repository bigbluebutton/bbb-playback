import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { error } from 'config';
import Error from 'components/error';
import Loader from './loader';

const Router = () => {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Switch>
        <Route
          path="/:recordId"
          component={Loader}
        />
        <Route render={(props) => <Error {...props} code={error['NOT_FOUND']} />} />
      </Switch>
    </BrowserRouter>
  );
}

export default Router;
