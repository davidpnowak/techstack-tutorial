# 02 - Babel, ES6, ESLint and Husky

We're now going to use some ES6 syntax, which is a great improvement over the "old" ES5 syntax. All browsers and JS environments understand ES5 well, but not ES6. That's where a tool called **Babel** comes to the rescue!

## Babel

> **[Babel](https://babeljs.io/)** is a compiler that transforms ES6 code (and other things like React's JSX syntax) into ES5 code. It is very modular and can be used in many different [environments](https://babeljs.io/docs/setup/). It is by far the preferred ES5 compiler of the React community.

**Move** your `index.js` into a new `src` folder. This is where you will write your ES6 code. **Replace** the contents in `index.js` with a simple:

```js
const str = 'ES6';
console.log(`Hello ${str}`);
```

We're using a _template string_ here, which is an ES6 feature that lets us inject variables directly inside the string without concatenation using `${}`. Note that template strings are created using **backquotes**.

- **Run:** `yarn add --dev @babel/node` to install the `babel-node` CLI executable for Babel.

Since Babel v7, former included parts were released as standalone npm modules under the common `@babel` namespace:

- [@babel/core](https://npmjs.org/package/@babel/core): The core Babel transpiler module, needed as common base for every other installed Babel module.
- [@babel/node](https://npmjs.org/package/@babel/node): CLI for transpiling modern JavaScript code into legacy code before executing.
- [@babel/cli](https://npmjs.org/package/@babel/cli): CLI executable for transpiling JavaScript code from source directories to a destination `.js` file.

Furthermore, Babel needs to know which features to transpile, therefore we need to provide a selection of manuals, so that Babel is able to do its magic:

- [@babel/preset-env](https://npmjs.org/package/@babel/preset-env): A collection of latest JavaScript features which need to get transpiled to match a certain ECMAScript standard.

`babel-node` (included in `@babel/node`) is great for development, but it's very heavy and not meant for production. In this chapter we are going to use `babel-node` to set up the development environment, and in the next one we'll use `babel` to build ES5 files for production.

In `package.json`, in your `start` script, **replace** `node .` with `babel-node src` (`index.js` is the default file that Node looks for, which is why we can omit `index.js`).

Running `yarn start` now, it will print the correct output, but Babel is not actually doing anything. That's because we didn't give it any information about the transformations we want to apply. The only reason it prints the correct output is because Node natively understands ES6 without Babel's help. Some browsers or older versions of Node would not be so successful though!

- **Run:** `yarn add --dev @babel/preset-env` to install a Babel preset package called `env`, which contains configurations for the most recent ECMAScript features supported by Babel.

**Create** a `.babelrc` file at the root of your project, which is a JSON file for your Babel configuration. Insert the following snippet to make Babel use the `env` preset:

```json
{
  "presets": ["env"]
}
```

`yarn start` will still work but it's actually being executed now. We can't really tell if it is though, since we're using `babel-node` to interpret ES6 code on the fly. You'll soon have proof that your ES6 code is actually transformed when you reach the ES6 modules syntax section of this chapter.

## ES6

> **[ES6](http://es6-features.org/)**: The most significant improvement of the JavaScript language. There are too many ES6 features to list them here but typical ES6 code uses classes with `class`, `const` and `let`, template strings, and arrow functions (`(text) => { console.log(text) }`).

### Creating an ES6 class

**Create** a new file, `src/Sessel.js`, containing the following ES6 class:

```js
class Sessel {
  constructor(color) {
    this.color = color;
  }

  info() {
    return `I am a ${this.color} chair.`;
  }
}

module.exports = Sessel;
```

It should not look surprising to you if you've done OOP in the past in any language. It's relatively recent for JavaScript though. The class is exposed to the outside world via the `module.exports` assignment.

**Replace** the contents of your `src/index.js` to:

```js
const Sessel = require('./Sessel');

const redChair = new Sessel('red');

console.log(redChair.info());
```

As you can see, unlike the community-made package `color` that we used before, when we require one of our files, we use `./` in the `require()`.

- **Run:** `yarn start`

  I am a red Chair.

### The ES6 modules syntax

Here we simply replace `const Sessel = require('./Sessel');` by `import Sessel from './Sessel';`, which is the newer ES6 modules syntax (as opposed to "CommonJS" modules syntax). It is currently not natively supported by NodeJS but Babel processes those ES6 files correctly.

In `Sessel.js`, we also **replace** `module.exports = Sessel;` by `export default Sessel;`

- **Run:** `yarn start`

  I am a red Chair.

## ESLint

> **[ESLint](http://eslint.org)** is the linter of choice for ES6 code. A linter gives you recommendations about code formatting, which enforces style consistency in your code, and code you share with your team. It's also a great way to learn about JavaScript by making mistakes that ESLint will catch.

ESLint works with _rules_, and there are [many of them](http://eslint.org/docs/rules/). Instead of configuring the rules we want for our code ourselves, we will use the config created by **Airbnb**. This config uses a few plugins so we need to install those as well.

It's strongly advised to check out Airbnb's most recent [instructions](https://www.npmjs.com/package/eslint-config-airbnb) to install the config package and all its dependencies correctly.

> 💡 Unfortunately `eslint-config-airbnb` demands a very strict version handling for its peerDependencies. If you use an **npm** version greater than 5, you can run the `npx install-peerdeps --dev eslint-config-airbnb` command.

- **Run:** (npm v5+)
  `npx install-peerdeps --dev eslint-config-airbnb`, afterwards run `yarn` to rebuild the `yarn.lock` file
- **Run:** (npm < v5)
  Query for the demanded versions of the peerDependencies: `yarn info eslint-config-airbnb peerDependencies`
  Install the resulting packages using the correct version numbers: `yarn add --dev eslint@^X.Y.Z eslint-plugin-import@^X.Y.Z eslint-plugin-jsx-a11y@^X.Y.Z eslint-plugin-react@^X.Y.Z eslint-config-airbnb@latest`

**Create** an `.eslintrc.json` file at the root of your project, just like we did for Babel, and write the following to it:

```json
{
  "extends": "airbnb"
}
```

**Update** the `scripts` of your `package.json` to include a new `test` task:

```json
"scripts": {
  "start": "babel-node src",
  "test": "eslint src --fix"
},
```

Here we just tell ESLint that we want it to lint all JavaScript files under the `src` folder. The **fix** flag tells ESLint to automatically fix indentation and line endings.

We will use this standard `test` task to run a chain of all the commands that validate our code - whether it's linting, type checking, or unit testing.

- **Run** `yarn test`

You'll see a couple of lines that say `can't resolve reference #/definitions/basicConfig from id #` (you can [ignore this](https://github.com/airbnb/javascript/issues/1488)), and a warning for using `console.log()` in `index.js`.

Add `/* eslint-disable no-console */` at the top of our `index.js` file to allow the use of `console` in this file.

- **Run** `yarn test` again and now all tests should pass.

### Compat

[Compat](https://github.com/amilajack/eslint-plugin-compat) is a neat ESLint plugin that warns you if you use some JavaScript APIs that are not available in the browsers you need to support. It uses [Browserslist](https://github.com/ai/browserslist), which relies on [Can I Use](http://caniuse.com/).

- **Run:** `yarn add --dev eslint-plugin-compat`

**Add** the following to your `package.json` file to indicate that we want to support browsers that have more than 1% market share:

```json
"browserslist": ["> 1%"],
```

**Modify** your `.eslintrc.json` file like so:

```json
{
  "extends": "airbnb",
  "plugins": ["compat"],
  "rules": {
    "compat/compat": 2
  }
}
```

To turn off consistent linebreak enforcement (https://eslint.org/docs/rules/linebreak-style) optionally use:

```json
  "rules": {
    "compat/compat": 2,
    "linebreak-style": 0
  }
```

You can try the plugin by using `navigator.serviceWorker` or `fetch` in your code for instance, which should raise an ESLint warning.

### ESLint in your editor

This chapter set you up with ESLint in the terminal, which is great for catching errors at build time & before pushing, but you also probably want it integrated to your IDE for immediate feedback. Do NOT use your IDE's native ES6 linting. Configure it so the binary used for linting is the one in your `node_modules` folder instead. This way it can use all of your project's config, the Airbnb preset, etc. Otherwise you will just get some generic ES6 linting.

### IDE/Editor Special: Prettier Setup

> **[Prettier](https://github.com/prettier/prettier)** enforces a consistent code style (i.e. code formatting that won't affect the AST) across your entire codebase because it disregards the original styling\* by parsing it away and re-printing the parsed AST with its own rules that take the maximum line length into account, wrapping code when necessary.

We will use a **[prettier-eslint](https://github.com/prettier/prettier-eslint)**, that runs **eslint --fix** after prettier to enforce our eslint ruleset as well. First we need to install prettier-eslint.

- **Run** `yarn add --dev prettier-eslint`

> We want **VS Code** to format our code using Prettier after saving a file. First press `CMD + Shift + P` and select `Install Extension`. Install the ESlint and Prettier Extension for IDE support.
> Press `CMD + ,` if you’re on a Mac - to open the VS Code Workspace Settings - then **add** the following:

```javascript
{
    // Format a file on save. A formatter must be available, the file must not be auto-saved, and editor must not be shutting down.
    "editor.formatOnSave": true,
    // Enable/disable default JavaScript formatter (For Prettier)
    "javascript.format.enable": false,
    // Use 'prettier-eslint' instead of 'prettier'. Other settings will only be fallbacks in case they could not be inferred from eslint rules.
    "prettier.eslintIntegration": true
}
```

> You need to reload to see the extensions in action. For other Text editors the setup will vary.

## Git Hooks with Husky

> **[Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)**: Scripts that are run when certain actions like a commit or a push occur.

Okay, so we now have this neat `test` task that tells us if our code looks good or not. We're going to set up Git Hooks to automatically run this task before every `git commit`, which will prevent us from pushing bad code to the repository if it doesn't pass the `test` task.

[Husky](https://github.com/typicode/husky) is a package that makes it very easy to set up Git Hooks.

- **Run** `yarn add --dev husky`

All we have to do is to **create** a new task in `scripts` and name it `precommit`:

```json
"scripts": {
  "start": "babel-node src",
  "test": "eslint src --fix",
  "precommit": "yarn test"
},
```

If you now try to commit your code, it should automatically run the `test` task.

If you encounter any issues or husky isn't running correctly (or not at all):

- **Run** `yarn add --dev husky --force`

Congratulations, you completed Page 2!

Don't forget to:

**Run** `git add .`
and then
`git commit -m="Page 2"`

---

Next section: [03 - Express, Nodemon, and PM2](https://github.com/XXXLutz/techstack-tutorial/blob/master/03-express-nodemon-pm2/Readme.md)

Back to the [previous section](https://github.com/XXXLutz/techstack-tutorial/blob/master/01-node-yarn-package-json/Readme.md) or the [table of contents](https://github.com/XXXLutz/techstack-tutorial/blob/master/Readme.md).
