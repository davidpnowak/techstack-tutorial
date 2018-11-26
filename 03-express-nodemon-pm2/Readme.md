# 03 - Express, Nodemon, and PM2

In this section we are going to create the server that will render our web app. We will also set up a development mode and a production mode for this server.

## Express

> **[Express](http://expressjs.com/)** is by far the most popular web application framework for Node. It provides a very simple and minimal API, and its features can be extended with _middleware_.

Let's set up a minimal Express server to serve an HTML page with some CSS.

**Delete** everything inside `src`.

Create the following files and folders:

- **Create** a `public/css/style.css` file containing:

```css
body {
  width: 960px;
  margin: auto;
  font-family: sans-serif;
}

h1 {
  color: #e20015;
}
```

- Create an empty `src/client/` folder.
- Create an empty `src/server/` folder.
- Create an empty `src/shared/` folder.

The `shared` folder is where we put _isomorphic / universal_ JavaScript code – files that are used by both the client and the server. A great use case of shared code is _routes_, as you will see later in this tutorial when we'll make an asynchronous call. Here we simply have some configuration constants as an example for now.

**Create** a `src/shared/config.js` file containing:

```js
export const WEB_PORT = process.env.PORT || 8000;
export const STATIC_PATH = '/static';
export const APP_NAME = 'Hello App';
export const isProd = process.env.NODE_ENV === 'production';
```

If the Node process used to run your app has a `process.env.PORT` environment variable set (that's the case when you deploy to Heroku for instance) it will use this for the port. If there is none, we default to `8000`.

The `isProd` is a simple util to test whether we are running in production mode or not. If the "NODE_ENV" is not set to "production" then the code defaults to "development".

**Run:** `yarn add express compression`

`compression` is an Express middleware to activate Gzip compression on the server.

**Create** a `src/server/index.js` file containing:

```js
import compression from 'compression';
import express from 'express';

import { APP_NAME, STATIC_PATH, WEB_PORT, isProd } from '../shared/config';
import renderApp from './render-app';

const app = express();

app.use(compression());
app.use(STATIC_PATH, express.static('dist'));
app.use(STATIC_PATH, express.static('public'));

app.get('/', (req, res) => {
  res.send(renderApp(APP_NAME));
});

app.listen(WEB_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Server running on port ${WEB_PORT} ${
      isProd ? '(production)' : '(development)'
    }.`
  );
});
```

We're using 2 different static file directories here. `dist` for generated files and `public` for declarative ones.

**Create** a `src/server/render-app.js` file containing:

```js
import { STATIC_PATH } from '../shared/config';

const renderApp = title =>
  `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <link rel="stylesheet" href="${STATIC_PATH}/css/style.css">
  </head>
  <body>
    <h1>${title}</h1>
  </body>
</html>
`;

export default renderApp;
```

You know how you typically have _templating engines_ on the back-end? Well these are pretty much obsolete now that JavaScript supports template strings. Here we create a function, that takes a `title` as a parameter and injects it in both the `title` and `h1` tags of the page, returning the complete HTML string. We also use a `STATIC_PATH` constant as the base path for all our static assets.

In `package.json` **change** your `start` script to: `"start": "babel-node src/server",`

- **Run:** `yarn start`, and hit `localhost:8000` in your browser.

If everything works as expected you should see a blank page with "Hello App" written both on the tab title and as a red heading on the page.

**Note**: Some processes – typically processes that wait for things to happen, like a server for instance – will prevent you from entering commands in your terminal until they're done. To interrupt such processes and get your prompt back, press **Ctrl+C**. You can alternatively open a new terminal tab if you want to keep them running while being able to enter commands. You can also make these processes run in the background but that's out of the scope of this tutorial.

## Nodemon

> **[Nodemon](https://nodemon.io/)** is a utility to automatically restart your Node server when file changes happen in the directory.

We are going to use Nodemon whenever we are in **development** mode.

- **Run:** `yarn add --dev nodemon`

**Change** `scripts` in `package.json`

```json
"start": "yarn dev:start",
"dev:start": "nodemon --ignore lib --exec babel-node src/server",
```

`start` is now just a pointer to `dev:start`.

In `dev:start`, the `--ignore lib` indicates to _not_ restart the server when changes happen in the `lib` directory. Nodemon typically runs the `node` binary. We tell Nodemon to use the `babel-node` binary instead. This way it will understand all the ES6 code.

- **Run:** `yarn start` and open `localhost:8000`.

Go ahead and **change** the `APP_NAME` constant in `src/shared/config.js`, which triggers a restart of your server in the terminal. Refresh the page to see the updated title.

## PM2

> **[PM2](http://pm2.keymetrics.io/)** is a Process Manager for Node. It keeps your processes alive in production and offers tons of features to manage them and monitor them.

We are going to use PM2 whenever we are in **production** mode.

- **Run:** `yarn add --dev pm2`

In production, you want your server to be as performant as possible. `babel-node` triggers the entire Babel transpilation process for your files at each execution, which is not something you want in production. We need Babel to do all this work beforehand and have our server serve plain old pre-compiled ES5 files.

One of the main features of Babel is to take a folder of ES6 code (usually named `src`) and transpile it into a folder of ES5 code (usually named `lib`), thus the package `@babel/cli` needs to be included to this step.

This `lib` folder is auto-generated. Before a new build we need to clean up this directory. A simple cross platform package to delete files is `rimraf`.

- **Run:** `yarn add --dev rimraf @babel/cli`

**Add** `prod:build` to our `scripts` in `package.json`:

```json
"prod:build": "rimraf lib && babel src -d lib --ignore .test.js",
```

- **Run:** `yarn prod:build`

This generates a `lib` folder with the transpiled code, except for files ending in `.test.js` (note that `.test.jsx` files are also ignored by this parameter).

**Add** `/lib/` to your `.gitignore`

One last thing: We are going to pass a `NODE_ENV` environment variable to our PM2 binary. With Unix, you would do this by running `NODE_ENV=production pm2`. With Windows, We're going to use a small package called `cross-env` to make this work.

**Run:** `yarn add --dev cross-env`

**Change** the `scripts` section of your `package.json`

```json
"scripts": {
  "dev:start": "nodemon --ignore lib --exec babel-node src/server",
  "prod:build": "rimraf lib && babel src -d lib --ignore .test.js",
  "prod:start": "cross-env NODE_ENV=production pm2 start lib/server && pm2 logs",
  "prod:stop": "pm2 delete server",
  "start": "yarn dev:start",
  "test": "eslint src --fix",
  "precommit": "yarn test"
},
```

- **Run:** `yarn prod:build`, then run `yarn prod:start`.

PM2 shows an active process. Go to `http://localhost:8000/` in your browser to see your app. Your terminal should show the logs, which should be "Server running on port 8000 (production)." Note that with PM2, your processes are run in the background. If you press Ctrl+C, it will kill the `pm2 logs` command, which was the last command of our `prod:start` chain. If you want to stop the server, run `yarn prod:stop`.

When you get an error that the address is already in use, it is usually because you have forgotten to stop the pm2 server. So just run `yarn prod:stop` and it should be working again.

To ensure that `prod:build` works fine before commiting code to the repository, **add** it to the `precommit` task in your `package.json`.

```json
"precommit": "yarn test && yarn prod:build"
```

Congratulations, you completed Page 3!

Don't forget to:

**Run:** `git add .`
and then
`git commit -m="Page 3"`

---

Next section: [04 - Webpack, React, and Hot Module Replacement](https://github.com/XXXLutz/techstack-tutorial/blob/master/04-webpack-react-hmr/Readme.md)

Back to the [previous section](https://github.com/XXXLutz/techstack-tutorial/blob/master/02-babel-es6-eslint-husky/Readme.md) or the [table of contents](https://github.com/XXXLutz/techstack-tutorial/blob/master/Readme.md).
