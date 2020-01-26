import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from "react-intl";
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { error } from 'config';
import Error from 'components/error';
import Loader from 'components/loader';
import {
  getLocale,
  getMessages,
} from 'locales';
import './index.scss';

const locale = getLocale();
const messages = getMessages();

ReactDOM.render(
  (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
    >
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Switch>
          <Route
            path="/:recordId"
            component={ Loader }
          />
          <Route render={(props) => <Error {...props} code={error['NOT_FOUND']} />} />
        </Switch>
      </BrowserRouter>
    </IntlProvider>
  ),
  document.getElementById('root')
);
