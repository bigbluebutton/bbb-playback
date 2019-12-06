import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Loader from './components/loader';
import Error from './components/error';

ReactDOM.render(
  (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Switch>
        <Route path="/:recordId" component={ Loader } />
        <Route component={ Error } />
      </Switch>
    </BrowserRouter>
  ), document.getElementById('root')
);
