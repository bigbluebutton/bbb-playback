import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Player from './components/player';
import Error from './components/error';

ReactDOM.render(
  (<BrowserRouter>
    <Switch>
      <Route path="/:id">
        <Player />
      </Route>
      <Route component={Error} />
    </Switch>
  </BrowserRouter>),
  document.getElementById('root')
);
