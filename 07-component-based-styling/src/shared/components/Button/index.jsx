import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './style.css';

class Button extends Component {
  render() {
    const { onButtonClick, text } = this.props;
    return (
      <button type="button" className={styles.button} onClick={onButtonClick}>
        {text}
      </button>
    );
  }
}

Button.defaultProps = {
  text: 'Hello',
  onButtonClick: function defaultHandler() {},
};

// type checking for component properties
Button.propTypes = {
  text: PropTypes.string,
  onButtonClick: PropTypes.func,
};

export default Button;
