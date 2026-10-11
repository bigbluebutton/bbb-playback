import React from 'react';
import { createRoot } from 'react-dom/client';
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
import { EditorLoading } from 'components/recording-editor/i18n';

const RecordingEditor = React.lazy(() => import('components/recording-editor'));

const locale = getLocale();
const style = getStyle();

const root = createRoot(document.getElementById('root'));

root.render(
  (
    <IntlProvider
      locale={locale}
      messages={getMessages(locale)}
    >
      {style ? <link rel="stylesheet" type="text/css" href={style} /> : null}
      {process.env.REACT_APP_RECORDING_EDITOR === '1' || new URLSearchParams(window.location.search).get('editor') === '1'
        ? <React.Suspense fallback={<EditorLoading />}><RecordingEditor /></React.Suspense> : ROUTER ? <Router /> : <Loader />}
    </IntlProvider>
  )
);
