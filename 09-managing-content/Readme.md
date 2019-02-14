# 09 - Managing Content

The next two chapters are optional topics and show how we would approach new features in the stack and add content and functionality in our platform.

In this chapter we will implement a simple way to manage articles based on plain markdown files.

Download the [placeholder markdown file](https://pastebin.com/raw/K5fjJGkf) and **save** it as `public/documents/lorem.md`.

The public folder is defined in the `src/server/index.js` as a public path and we will use it to store our documents. There are styles we don't need in there anymore so **delete** the `css` Folder.

We use the package `marked` for Mark Down Rendering:

* **Run:** `yarn add marked`

**Edit** the file `src/shared/pages/Tutorials/index.jsx` containing
```jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import main from '../../styles/main.scss';

import { readDocument, markupDocument } from '../helpers';

class Tutorials extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Tutorials',
      html: '',
    };
  }

  componentDidMount() {
    readDocument(this.props.match.params.docname)
      .then(markupDocument)
      .then(result => this.setState(result));
  }

  render() {
    return (
      <div>
        <Helmet
          title={this.state.title}
          meta={[
            { name: 'description', content: 'A page to say hello' },
            { property: 'og:title', content: this.state.title },
          ]}
        />
        <div className={main.container}>
          {/* eslint-disable react/no-danger */}
          <article dangerouslySetInnerHTML={{ __html: this.state.html }} />
          {/* eslint-enable react/no-danger */}
        </div>
      </div>
    );
  }
}

Tutorials.propTypes = {
  match: PropTypes.shape({ params: PropTypes.shape({ docname: PropTypes.string }) }).isRequired,
};

export default Tutorials;
```

**Create** a file `src/shared/pages/helpers.js` containing the following functions:
```jsx
import marked from 'marked';

import { STATIC_PATH } from 'shared/config';

// eslint-disable-next-line import/prefer-default-export
export function readDocument(docname) {
  if (/[~.:/\\]/.test(docname)) {
    throw new Error('Illegal filename');
  }

  return fetch(`${STATIC_PATH}/documents/${docname}.md`, { method: 'GET' }).then((response) => {
    if (response.ok) {
      return response.text().then(result => ({ text: result, filename: `${docname}.md` }));
    }
    return { text: '', filename: `${docname}.md` };
  });
}
```

`readDocument` fetches the markdown document containing the requested article from the server.

**Add** the following render function to `src/shared/pages/helpers.js`:
```jsx
/* Find first heading of lowest depth */
function findHeading(tokens) {
  const headings = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === 'heading') {
      if (token.depth === 1) {
        return token.text;
      }
      if (!headings[token.depth]) {
        headings[token.depth] = token.text;
      }
    }
  }

  return headings.reverse().pop();
}

export function markupDocument(doc) {
  const tokens = marked.lexer(doc.text);

  const headingText = findHeading(tokens);
  const markup = marked.parser(tokens);
  const data = {
    title: headingText,
    html: markup,
    text: doc.text,
    filename: doc.filename,
  };

  return data;
}
```

`markupDocument` compiles the markdown document to html and aggregates some metadata. It uses the `findHeading` function to find the title of the markdown document from the tokens produced by `marked.lexer`.

**Edit** the Tutorials route in `src/shared/routes.js`
```jsx
export const HOME_PAGE_ROUTE = '/';
export const NOT_FOUND_DEMO_PAGE_ROUTE = '/404';

export const firstEndpointRoute = num => `/ajax/first/${num || ':num'}`;
export const tutorialsRoute = docname => `/tutorials/${docname || ':docname'}`;
```

**Modify** `src/server/controller.js` to change the controller. For now the controller will just verify whether the requested document is an allowed filename.
```jsx
// eslint-disable-next-line import/prefer-default-export
export const tutorialsPage = (docname) => {
  // don't allow these characters: . : / \
  if (/[~.:/\\]/.test(docname)) {
    throw new Error('Illegal filename');
  }

  return {};
};
```

**Modify** `src/server/routing.js` to edit the ExpressJS endpoint for the article page. Remove the old TUTORIALS_PAGE_ROUTE and change it to the function. Because the function is now doing something different, we change our first Endpoint route to the function that sends back the request to the Button. This could also stay in the controller but it is small enough to put it in the `routing.js`.
```jsx
import {
  HOME_PAGE_ROUTE,
  firstEndpointRoute,
  tutorialsRoute,
} from 'shared/routes';

// [...]

  app.get(tutorialsRoute(), (req, res) => {
    res.send(renderApp(req.url, tutorialsPage()));
  });

  app.get(firstEndpointRoute(), (req, res) => {
    res.json({
      serverMessage: `Hello from the server! (received ${req.params.num})`,
    });
  });

// [...]
```

**Modify** `src/shared/app.jsx` to add the article page to the react router:
```jsx
// [...]
// Routes
import {
  HOME_PAGE_ROUTE,
  tutorialsRoute,
} from 'shared/routes';
// [...]
         <Switch>
            <Route exact path={HOME_PAGE_ROUTE} render={() => <Home />} />
            <Route path={tutorialsRoute()} component={Tutorials} />
            <Route component={NotFoundPage} />
          </Switch>
// [...]
```

We pass `Tutorials` as a component property to the route instead of passing a render function so that react router can pass us an object containing the request parameters.

In the Navigation we link the lorem Ipsum Article directly, go to `src/shared/components/Navigation/index.jsx` and **change** it to:
```jsx
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

import { HOME_PAGE_ROUTE, tutorialsRoute, NOT_FOUND_DEMO_PAGE_ROUTE } from 'shared/routes';

import styles from './style.scss';

class Navigation extends Component {
  render() {
    return (
      <nav className={styles.navigation}>
        <div className={styles.navigationLogo}>
          <img
            src="//www.xxxlutz.at/static/templates/xxxlutz.at/resources/images/logo-2d.png"
            alt="Logo of xxxlutz"
          />
        </div>
        <ul className={styles.navigationList}>
          {[
            { route: HOME_PAGE_ROUTE, label: 'Home' },
            { route: tutorialsRoute('lorem'), label: 'Tutorials' },
            { route: NOT_FOUND_DEMO_PAGE_ROUTE, label: '404 Demo' },
          ].map(link => (
            <li key={link.route} className={styles.navigationListitem}>
              <NavLink
                className={styles.navigationHref}
                to={link.route}
                activeClassName={styles.navigationHrefActive}
                exact
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}

export default Navigation;
```

The Tutorials page is now fully functional. Start the dev server and **visit** `http://localhost:8000/tutorials/lorem` in your browser.

If you add other markdown files into the `public/documents/` folder, you can view them like this, too. Sometimes the Webpack bundling is faster than Nodemon restart, that causes an error because it is trying to load the article before the server is up. This is annoying but should not influence your dev too much! Now you would start and add SSR to the Tutorials Page, but we keep it lazy loading.

Congratulations, you completed Page 9!

Don't forget to:

**Run:** `git add .`
and then
`git commit -m="Page 9"`

---



Next section: [10 - Get Data via Github](https://github.com/XXXLutz/techstack-tutorial/blob/master/10-get-data-via-github/Readme.md)

Back to the [previous section](https://github.com/XXXLutz/techstack-tutorial/blob/master/08-better-styles/Readme.md) or the [table of contents](https://github.com/XXXLutz/techstack-tutorial/blob/master/Readme.md).
