import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Loader from './components/loader';
import Error from './components/error';
import './index.scss';

ReactDOM.render(
  (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Switch>
        <Route path="/:recordId" component={ Loader } />
        <Route render={(props) => <Error {...props} code={404} />} />
      </Switch>
    </BrowserRouter>
  ),
  document.getElementById('root')
);
