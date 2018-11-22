import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import Helmet from 'react-helmet';

import App from 'shared/app';
import {
  APP_CONTAINER_CLASS, STATIC_PATH, WDS_PORT, isProd,
} from 'shared/config';

const renderApp = (location, state, routerContext = {}) => {
  const appHtml = ReactDOMServer.renderToString((
    <StaticRouter location={location} context={routerContext}>
      <App />
    </StaticRouter>));
  const head = Helmet.rewind();

  const stylesheet = isProd ? `<link rel="stylesheet" href="${STATIC_PATH}/css/styles.css">` : '';
  const script = isProd
    ? `<script src="${STATIC_PATH}/js/bundle.js"></script>`
    : `<script src="http://localhost:${WDS_PORT}/dist/js/bundle.js"></script>`;

  return `<!doctype html>
    <html>
      <head>
        ${head.title}
        ${head.meta}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${stylesheet}
      </head>
      <body>
        <div class="${APP_CONTAINER_CLASS}">${appHtml}</div>
        ${script}
      </body>
    </html>`;
};

export default renderApp;
