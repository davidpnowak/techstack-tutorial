# 07 - Component based Styling

We follow the component based architecture approach, so how about styling? We decided to put styling to the component, but in the web we have the following situation:

- **General**: A style should always be defined within a component.
- **Development**: You want to have Hot Module reload, when you change a style of a component.
- **Development**: When the application is rendered on the server, you want to return the style inline.
- **Production**: You want to return the styles as a separate Stylesheet that gets loaded independently to the source code and javascript code.

We do it by just adding a `style.css` file to the component and define the look and feel for that particular component within the file.

## The current state of CSS

In 2017, the typical modern JavaScript stack based on React has known best practices. The different libraries and tools this tutorial made you set up are pretty much the _cutting-edge industry standard_. Yes, that's a complex stack to set up, but at least, most front-end devs agree that React-Webpack (maybe with Redux for WebApps) is the way to go. Now regarding CSS, I have some pretty bad news. Nothing settled, there is no standard way to go, no standard stack.

SASS, BEM, SMACSS, SUIT, Bass CSS, React Inline Styles, LESS, Styled Components, CSSX, JSS, Radium, Web Components, CSS Modules, OOCSS, Tachyons, Stylus, Atomic CSS, PostCSS, Aphrodite, React Native for Web, and many more that I forget are all different approaches or tools to get the job done. They all do it well, which is the problem, there is no clear winner, it's a big mess.

We will follow a very traditional stack: CSS was developed by our forefathers and therefore it is stable to build upon. We will add some additional Power with SASS later.

## CSS Modules

> 💡 **[CSS Modules](https://github.com/css-modules/css-modules)** is a CSS file in which all class names and animation names are scoped locally by default.

CSS Modules compile to a low-level interchange format called ICSS or [Interoperable CSS](https://github.com/css-modules/icss), but are written like normal CSS files:

```css
/* style.css */
.className {
  color: green;
}
```

When importing the **CSS Module** from a JS Module, it exports an object with all mappings from local names to global names.

```js
import styles from './style.css';

const element = () => <div className={styles.className} />;
```

All URLs (`url(...)`) and `@imports` are in module request format (`./xxx` and `../xxx` means relative, `xxx` and `xxx/yyy` means in modules folder, i. e. in `node_modules`).

### Naming

For local class names camelCase naming is recommended but not enforced.

### Exceptions

`:global` switches to global scope for the current selector respective identifier. `:global(.xxx)` respective `@keyframes :global(xxx)` declares the stuff in parenthesis in the global scope.

Similarly, `:local` and `:local(...)` for local scope.

If the selector is switched into global mode, global mode is also activated for the rules. (This allows us to make `animation: abc;` local.)

Example: `.localA :global .global-b .global-c :local(.localD.localE) .global-d`

### Webpack config

Now is a good time to differentiate between production config and development config. Therefore, we are going to split the configs into three configuration variables: _common_, _development_ and _production_.

To combine the configurations we will use the library webpack-merge, so install that first:

- **Run:** `yarn add --dev webpack-merge`

Now put the content of the default export to a constant `commonConfig` and remove all conditions where we were checking if isProd is true or other dev settings where made. On Bottom we now define a variable that contains the setup specific config:

**Update** `webpack.config.babel.js`

```jsx
import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import { WDS_PORT, isProd } from './src/shared/config';

// #1
//
// Universal Config
const commonConfig = {
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
};

// #2
//
// Development Config
const developmentConfig = {};

// #3
//
// Production Config
const productionConfig = {};

const config = () => {
  if (isProd) {
    return merge(commonConfig, productionConfig);
  }

  return merge(commonConfig, developmentConfig);
};

export default config;
```

### Production Settings

In Production we need to ensure three things:

- Render the Page on Server
- Combine all Styles in a styles.css
- Combine Application logic in bundle.js

#### Render Page on Server & Combine all Styles

In production the Server initiates the Server Side Rendering in lib/server that was compiled by babel. During that compiling we need to tell babel how to handle css files.

For this we use the Babel plugin `babel-plugin-css-modules-transform`.

- **Run:** `yarn add --dev babel-plugin-css-modules-transform`

**Update** the babel config `.babelrc`:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": [
    [
      "css-modules-transform",
      {
        "generateScopedName": "[name]__[local]___[hash:base64:5]",
        "extensions": [".css"],
        "extractCss": "./dist/css/styles.css"
      }
    ]
  ]
}
```

So when babel is compiling to ES5 code, it will take the css imports and combine them to a styles.css file.

#### Combine all Scripts

So when the Server Side Rendered Component is delivered by the server, it serves also a Javascript with all the business logic compiled by Webpack.

Lets take a look at the Webpack config for Production:

**Update** `webpack.config.babel.js`

```jsx
// #3
//
// Production Config
const productionConfig = {
  entry: ['./src/client'],
  output: {
    publicPath: '/static/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  devtool: false,
};
```

Pretty simple. We don't need any css file handling because the babel-loader uses the babel config and therefore already knows the css handling.

### Link the extracted stylesheet from the application

In production mode we link the stylesheet with a `<link>` tag. In dev mode we
rely on `style-loader` to inject a `<style>` tag containing the extracted style
into the page to allow for HMR of stylesheets.

**Modify** `src/server/render-app.jsx`

```jsx
// [...]
const stylesheet = isProd
  ? `<link rel="stylesheet" href="${STATIC_PATH}/css/styles.css">`
  : '';
const script = isProd
  ? `<script src="${STATIC_PATH}/js/bundle.js"></script>`
  : `<script src="http://localhost:${WDS_PORT}/dist/js/bundle.js"></script>`;
// [...]
<head>
  ${head.title}
  ${head.meta}
  ${stylesheet}
</head>
<body>
  <div class="${APP_CONTAINER_CLASS}">${appHtml}</div>
  // [...]
```

Lets try it out:

**Create** the file `src/shared/components/Button/style.css` and add this content:

```css
.button {
  background: #e20015;
  border: none;
  margin: 20px;
  padding: 21px 40px;
  color: #fff;
}
```

Now, in `src/shared/components/Button/index.jsx` **import** the styles and **add** the class to the Button:

```jsx
//[...]
import styles from './style.css';

class Button extends Component {
  render() {
    return (
      <button
        type="button"
        className={styles.button}
        onClick={this.props.onButtonClick}
      >
        {this.props.text}
      </button>
    );
  }
}
//[...]
```

- **Run:** `yarn prod:build` and take a look into the dist folder.

You will find a css/styles.css file with following content:

```css
.style__button___1h5je {
  background: linear-gradient(to bottom right, #ec008c, #e20015);
  border: none;
  margin: 20px;
  padding: 21px 40px;
  color: #fff;
}
```

- **Run:** the application with `yarn prod:start`and reload `http://localhost:8000`. You will notice that the font family changed back to the default styling and the Buttons are styled. The reason for that is that when requesting style.css express finds the stylesheet in dist and sends it back immediatly, therefore ignores the stylesheet in public.

### Development Settings

In Development, we need to tell babel for Server Side Rendering as well, how the loader should handle css files. This behaves exactly the same as on production and therefore the `.babelrc` config works here as well.

But we want to have `Hot Module Reload` with `webpack` and dont want to use an external file for our development changes.

To use a different css handling, we have to tell `webpack` and explicitly the `babel-loader` first, that it shouldn't use the babel config in webpack.

And then we need to **set** a specific css handling for Development. Check out the config on how we treat those conditions:

```jsx
// #2
//
// Development Config
const developmentConfig = {
  entry: ['react-hot-loader/patch', './src/client'],
  output: {
    publicPath: `http://localhost:${WDS_PORT}/dist/`,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          babelrc: false,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            query: {
              modules: true,
              importLoaders: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
  devtool: 'source-map',
  devServer: {
    port: WDS_PORT,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  plugins: [
    // Development plugins
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
  ],
};
```

The interesting part is the `query` parameter for the `babel-loader`. It tells the loader to ignore the `.babelrc` settings.

- **Run:** `yarn add --dev style-loader css-loader`

The next rule uses css-loader with modules true to put the css imports into your javascript modules and therefore enables Hot Module Reload in Development.

- **Run:** the application with `yarn start` and in another window `yarn dev:wds` and reload `http://localhost:8000`. When you refresh a couple of times you notice that the style is loaded with a bit of delay. This shows that the styling is only done when the javascript is loaded and we have hot module reload for styles as well.

_Don't forget to close the production server with `yarn prod:stop` if it is still running._

### Set some global stylings

The style from public/css is ignored and we could just rename it and link it in the application. But to fit it into our development process we put it into our app:

**Create** a file `src/shared/styles/main.css` containing:

```css
html,
body {
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px;
  font-family: Verdana;
}
```

**Modify** `src/shared/app.jsx` like so:

```jsx
// [...]
// Routes
import { HOME_PAGE_ROUTE, TUTORIALS_PAGE_ROUTE } from './routes';

// global styles
import './styles/main.css';

class App extends Component {
//[...]
```

You should see the result (different font family) without reloading.

## Sass Time

This is the step before we give our App a facelift, so stay with me!

To use Sass files, we have to change the css loader in our webpack config and adapt the plugin in our `.babelrc` config. But first lets install some dependencies:

- **Run:** `yarn add --dev node-sass sass-loader`

**Modify** `webpack.config.babel.js` to add the sass loader to the development webpack config:

```jsx
  {
    test: /\.(css|scss)$/,
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        query: {
          modules: true,
          importLoaders: true,
          localIdentName: '[name]__[local]___[hash:base64:5]',
        },
      },
      'sass-loader',
    ],
  },
```

The .babelrc file is a json and css-modules-transform needs to refer to an function defined elsewhere. So we **create** the file `babelrc.js` in root with content:

```jsx
// ./path/to/module-exporting-a-function.js
const sass = require('node-sass');
const path = require('path');

module.exports = function processSass(data, filename) {
  const result = sass.renderSync({
    data: data,
    file: filename,
  }).css;
  return result.toString('utf8');
};
```

and **modify** the `.babelrc`:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": [
    [
      "css-modules-transform",
      {
        "generateScopedName": "[name]__[local]___[hash:base64:5]",
        "preprocessCss": "./babelrc.js",
        "extensions": [".css", ".scss"],
        "extractCss": "./dist/css/styles.css"
      }
    ]
  ]
}
```

This looks quite hacky and it actually is. With Babel 7 the configuration can be a js file (.babelrc.js) so we can do the same in one file, until then we do the hacky way in Babel 6.

Now, change the filename and the import of the Button Component and the global Stylesheet to .scss.

**Create** a new file `src/shared/styles/_variables.scss`:

```sass
$brand-primary: #e20015;
```

And **rename** and **modify** `src/shared/styles/main.scss`:

```sass
@import 'variables';

html,
body {
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px;
  font-family: Verdana;
}

a {
  color: $brand-primary;
}
```

**Modify** `src/shared/app.jsx`:

```jsx
// global styles
import './styles/main.scss';

class App extends Component {
```

**Cancel** `yarn dev:wds` and **run** it again so that the new webpack config is applied. If you reload the application you should see the Links in red and the sass style was successfully compiled. The same will happen when you run the production steps.

## Absolute Paths (or 'kind of' Namespacing)

Webpack provides an [advanced mechanism to resolve files](https://webpack.js.org/concepts/module-resolution/). The sass-loader uses node-sass' custom importer feature to pass all queries to the webpack resolving engine. Thus you can import your Sass modules from node_modules. Just prepend them with a ~ to tell webpack that this is not a relative import:

`@import "~bootstrap/dist/css/bootstrap";`

It's important to only prepend it with ~ because ~/ resolves to the home directory. webpack needs to distinguish between bootstrap and ~bootstrap because CSS and Sass files have no special syntax for importing relative files. Writing @import "file" is the same as @import "./file";

To take advantage of this module resolving, we also change the behavior where webpack is looking for files. Open `webpack.config.babel.js` and **change** the commonConfig Variable to:

```jsx
// #1
//
// Universal Config
const commonConfig = {
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.join(__dirname, 'src'), 'node_modules'],
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
};
```

This tells webpack when looking for an import that is not relative or absolute to look **_first_** in the **src** folder and only after that into the node_modules folder.

**Modify** `babelrc.js` to do the same thing for the babel node sass preprocessor:

```jsx
const sass = require('node-sass');
const path = require('path');

module.exports = function processSass(data, filename) {
  // we need to remove the ~ that was used for the sass loader, otherwise the path with include paths is wrong.
  const removeTilde = data.replace(/~/g, '');
  const result = sass.renderSync({
    data: removeTilde,
    file: filename,
    includePaths: [path.join(__dirname, 'src')],
    outputStyle: 'compressed',
  }).css;

  return result.toString('utf8');
};
```

### Add better Linking

The resolve modules webpack feature is not only for sass imports but also js imports. We can reduce the overall linking complexity of our application with this:

```jsx
// Use this:
import { firstEndpointRoute } from 'shared/routes';
// Instead of that:
import { firstEndpointRoute } from '../../../shared/routes';
```

To handle the server side once again we have to align webpack again with babel loader. So we add another plugin to our babel configuration:

- **Run:** `yarn add --dev babel-plugin-module-resolver`

And **modify** the `.babelrc` Config:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": [
    [
      "css-modules-transform",
      {
        "generateScopedName": "[name]__[local]___[hash:base64:5]",
        "preprocessCss": "./babelrc.js",
        "extensions": [".css", ".scss"],
        "extractCss": "./dist/css/styles.css"
      }
    ],
    [
      "module-resolver",
      {
        "root": ["./src"]
      }
    ]
  ]
}
```

Now every time babel is resolving a path it will look in `src/` before `node_modules`.

To avoid ES Linting errors add another plugin:

> 💡 Please make sure that `eslint-import-resolver-babel-module` installs at least `v5.0.0` to make it compatible with Babel v7.

- **Run:** `yarn add --dev eslint-plugin-import eslint-import-resolver-babel-module@^5.0.0`

And **modify** your `.eslintrc.json` file to:

```json
{
  "extends": "airbnb",
  "plugins": ["compat"],
  "rules": {
    "compat/compat": 2,
    "react/prefer-stateless-function": 0
  },
  "env": {
    "browser": true
  },
  "settings": {
    "polyfills": ["fetch"],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

Now you can change the relative imports in the following files:

- src/client/index.jsx
- src/server/index.js
- src/server/render-app.jsx
- src/server/routing.js
- src/shared/app.jsx
- src/shared/components/Navigation/index.jsx
- src/shared/pages/Home/index.jsx

Change the imports to the absolute path (so `import App from '../shared/app'` to `import App from 'shared/app;`)

Keep HMR active - to see if it works correctly.

That was a tough one, not just for you but for us as well. When you came that far you have a pretty solid stack already, I know it seems we have a lot of plugins but they do quite simple tasks and help us to keep a nice codebase without having relative paths like crazy. The more imports you have the better you will understand.

Congratulations, you completed Page 7!

Don't forget to:

**Run:** `git add .`
and then
`git commit -m="Page 7"`

---

Next section: [08 - Better Styles](https://github.com/XXXLutz/techstack-tutorial/blob/master/08-better-styles/Readme.md)

Back to the [previous section](https://github.com/XXXLutz/techstack-tutorial/blob/master/06-ssr-helmet/Readme.md) or the [table of contents](https://github.com/XXXLutz/techstack-tutorial/blob/master/Readme.md).
