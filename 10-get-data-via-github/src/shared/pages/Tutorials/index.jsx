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
    let url = '';
    const { match } = this.props;
    if (match.params.docname !== 'Readme.md') {
      url = `/repo/${match.params.docname}/Readme.md`;
    } else {
      url = '/repo/Readme.md';
    }
    readDocument(url)
      .then(markupDocument)
      .then(result => this.setState(result));
  }

  render() {
    const { html, title } = this.state;
    return (
      <div>
        <Helmet
          title={title}
          meta={[
            { name: 'description', content: 'A page to 1say hello' },
            { property: 'og:title', content: title },
          ]}
        />
        <div className={main.container}>
          {/* eslint-disable react/no-danger */}
          <article dangerouslySetInnerHTML={{ __html: html }} />
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
