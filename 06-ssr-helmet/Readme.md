# 06 - Server-Side Rendering and Helmet

## Server-Side Rendering

> **Server-Side Rendering** means rendering your app at the initial load of the page instead of relying on JavaScript to render it in the client's browser.

SSR is essential for SEO and provides a better user experience by showing the app to your users right away.

The first thing we're going to do here is to migrate most of our client code to the shared / isomorphic / universal part of our codebase, since the server is now going to render our React app too.

### The big migration to `shared`

**Move** all the files located under `client` to `shared`, except `src/client/index.jsx`.

We have to adjust a whole bunch of imports:

**Replace**  the 3 occurrences of `'./app'` by `'../shared/app'` in `src/client/index.jsx`

**Replace** `'../shared/routes'` by `'./routes'` and `'../shared/config'` by `'./config'` in `src/shared/app.jsx`

**Replace**  `'../../../shared/routes'` by `'../../routes'` in `src/shared/component/Navigation/index.jsx`


### Server changes

**Create** a `src/server/routing.js` file containing:

```jsx
import { tutorialsPage } from './controller';

import { HOME_PAGE_ROUTE, TUTORIALS_PAGE_ROUTE, firstEndpointRoute } from '../shared/routes';

import renderApp from './render-app';

export default (app) => {
  app.get(HOME_PAGE_ROUTE, (req, res) => {
    res.send(renderApp(req.url));
  });

  app.get(TUTORIALS_PAGE_ROUTE, (req, res) => {
    res.send(renderApp(req.url));
  });

  app.get(firstEndpointRoute(), (req, res) => {
    res.json(tutorialsPage(req.params.num));
  });

  app.get('/500', () => {
    throw Error('Fake Internal Server Error');
  });

  app.get('*', (req, res) => {
    res.status(404).send(renderApp(req.url));
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
  });
};
```

This file is where we deal with requests and responses. The calls to business logic are externalized to a different `controller` module.

**Note**: You will find a lot of React Router examples using `*` as the route on the server, leaving the entire routing handling to React Router. Since all requests go through the same function, this makes it inconvenient to implement MVC-style pages. Instead of doing that, we're here explicitly declaring the routes and their dedicated responses to be able to fetch data from the database and pass it to a given page easily.

**Create** a `src/server/controller.js` file containing:

```jsx
// eslint-disable-next-line import/prefer-default-export
export const tutorialsPage = num => ({
  serverMessage: `Hello from the server! (received ${num})`,
});
```

Here is our controller. It would typically make business logic and database calls but in our case we just hard-code some results. Those results are passed back to the `routing` module to be used to initialize our application state.

**Edit** `src/server/index.js` like so:

```jsx
import compression from 'compression';
import express from 'express';

import routing from './routing';
import { STATIC_PATH, WEB_PORT, isProd } from '../shared/config';

const app = express();

app.use(compression());
app.use(STATIC_PATH, express.static('dist'));
app.use(STATIC_PATH, express.static('public'));

routing(app);

app.listen(WEB_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${WEB_PORT} ${isProd
    ? '(production)'
    : '(development).\nKeep "yarn dev:wds" running in an other terminal'}.`);
});
```

Nothing special here, we just call `routing(app)` instead of implementing routing in this file.

**Rename** `src/server/render-app.js` to `src/server/render-app.jsx` and edit it like so:

```jsx
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';

import App from './../shared/app';
import { APP_CONTAINER_CLASS, STATIC_PATH, WDS_PORT, isProd } from '../shared/config';

function renderApp(location, state, routerContext = {}) {
  const appHtml = ReactDOMServer.renderToString((
    <StaticRouter location={location} context={routerContext}>
      <App />
    </StaticRouter>));

  const script = isProd
    ? `<script src="${STATIC_PATH}/js/bundle.js"></script>`
    : `<script src="http://localhost:${WDS_PORT}/dist/js/bundle.js"></script>`;

  return `<!doctype html>
    <html>
      <head>
        <title>$FIX ME</title>
        <link rel="stylesheet" href="${STATIC_PATH}/css/style.css">
      </head>
      <body>
        <div class="${APP_CONTAINER_CLASS}">${appHtml}</div>
        ${script}
      </body>
    </html>`;
}

export default renderApp;
```

`ReactDOMServer.renderToString` is where the magic happens. React will evaluate our entire `shared` `App`, and return a plain string of HTML elements. `Provider` works the same as on the client, but on the server, we wrap our app inside `StaticRouter` instead of `BrowserRouter`.

* You can now run `yarn start` and `yarn dev:wds` and navigate between pages. Refreshing the page on `/tutorials` and `/404` (or any other URI) should now work correctly.

## React Helmet

> **[React Helmet](https://github.com/nfl/react-helmet)**: A library to inject content to the `head` of a React app, on both the client and the server.

I purposely made you write `FIX ME` in the title to highlight the fact that even though we are doing server-side rendering, we currently do not fill the `title` tag properly (or any of the tags in `head` that vary depending on the page you're on).

**Run** `yarn add react-helmet`

**Edit** `src/server/render-app.jsx` like so:

```jsx
import Helmet from 'react-helmet';
// [...]
const renderApp = (/* [...] */) => {
  // [...]
  const appHtml = ReactDOMServer.renderToString(/* [...] */)
  const head = Helmet.rewind();

  const script = isProd
    ? `<script src="${STATIC_PATH}/js/bundle.js"></script>`
    : `<script src="http://localhost:${WDS_PORT}/dist/js/bundle.js"></script>`;

  return `<!doctype html>
    <html>
      <head>
        ${head.title}
        ${head.meta}
        <link rel="stylesheet" href="${STATIC_PATH}/css/style.css">
      </head>
    // [...]
  )
};
```

React Helmet uses [react-side-effect](https://github.com/gaearon/react-side-effect)'s `rewind` to pull out some data from the rendering of our app, which will soon contain some `<Helmet />` components. Those `<Helmet />` components are where we set the `title` and other `head` details for each page. Note that `Helmet.rewind()` *must* come after `ReactDOMServer.renderToString()`.

**Edit** `src/shared/app.jsx` like so:

```jsx
import Helmet from 'react-helmet';
// [...]
class App extends Component {
  render() {
    return (
      <div>
        <Helmet titleTemplate={`%s | ${APP_NAME}`} defaultTitle={APP_NAME} />
        <Nav />
    // [...]
```

**Edit** `src/shared/pages/Home/index.jsx` like so:

```jsx
import React, { Component } from 'react';
import Helmet from 'react-helmet';

// [...]
class Home extends Component {
// [...]
    return (
      <div>
        <Helmet title="Home" meta={[{ name: 'description', content: 'Home Page description' }]} />
        <h1>Home</h1>
      // [...]
```

**Edit** `src/shared/pages/Tutorials/index.jsx` like so:

```jsx
import React, { Component } from 'react';
import Helmet from 'react-helmet';

class Tutorials extends Component {
  render() {
    return (
      <div>
        <Helmet
          title="Tutorials"
          meta={[{ name: 'description', content: 'Tutorial Page description' }]}
        />
        <p>Tutorial List here</p>
      </div>
    );
  }
}

export default Tutorials;

```

**Edit** `src/shared/pages/error/NotFound/index.jsx` like so:

```jsx
import React, { Component } from 'react';
import Helmet from 'react-helmet';

class NotFoundPage extends Component {
  render() {
    return (
      <div>
        <Helmet
          title="Not Found"
          meta={[{ name: 'description', content: 'Not found Page description' }]}
        />
        <p>Page not found</p>
      </div>
    );
  }
}

export default NotFoundPage;
```

The `<Helmet>` component doesn't actually render anything, it just injects content in the `head` of your document and exposes the same data to the server.

Congratulations, you completed Page 6! SSR is a tough thing and can be hard to wrap your head around. I like to summarize it this way:

- When you request a page it will send you Markup and content back for the browser to render (like Perl, PHP, Python Flask, Java Applications or just static files do it). So we run (with Babel) Javascript on the NodeJs server behaving like a server side scripting language.
- To stay responsive, as modern web applications should be, we send that request with a big javascript file (that was bundled by Webpack) with it as well.
- The javascript file adds all the event listeners and application behaviors to the App (how DOM behaves, what happens when you click a link, etc.) and takes from that point the logic of how the experience for the user should be like, how to load data and in our case making sure the navigation is working on the client side as well.

Go and get a coffee, and don't forget to:

**Run:** `git add .`
and then
`git commit -m="Page 6"`

---


Next section: [07 - Component based Styling](https://github.com/XXXLutz/techstack-tutorial/blob/master/07-component-based-styling/Readme.md)

Back to the [previous section](https://github.com/XXXLutz/techstack-tutorial/blob/master/05-pages-components-react-router/Readme.md) or the [table of contents](https://github.com/XXXLutz/techstack-tutorial/blob/master/Readme.md).
