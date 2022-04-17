import React from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { ERROR } from 'utils/constants';
import Error from './error';
import Loader from './loader';

const Router = () => {

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route
          path="/:recordId"
          element={<Loader />}
        />
        <Route render={() => <Error code={ERROR.NOT_FOUND} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
