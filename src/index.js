import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from "react-intl";
import Loader from 'components/loader';
import Router from 'components/router';
import {
  getLocale,
  getMessages,
} from 'locales';
import {
  LOCAL,
  getStyle,
} from 'utils/data';
import './index.scss';

const locale = getLocale();
const messages = getMessages();
const style = getStyle();

ReactDOM.render(
  (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
    >
      {style ? <link rel="stylesheet" type="text/css" href={style} /> : null}
      {LOCAL ? <Loader /> : <Router />}
    </IntlProvider>
  ),
  document.getElementById('root')
);
