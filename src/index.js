import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from "react-intl";
import Loader from 'components/loader';
import Router from 'components/router';
import {
  getLocale,
  getMessages,
} from 'locales';
import { ROUTER } from 'utils/constants';
import { getStyle } from 'utils/params';
import './index.scss';

const locale = getLocale();
const style = getStyle();

ReactDOM.render(
  (
    <IntlProvider
      locale={locale}
      messages={getMessages(locale)}
    >
      {style ? <link rel="stylesheet" type="text/css" href={style} /> : null}
      {ROUTER ? <Router /> : <Loader />}
    </IntlProvider>
  ),
  document.getElementById('root')
);
