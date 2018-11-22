import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Button extends Component {
  render() {
    const { onButtonClick, text } = this.props;
    return (
      <button type="button" onClick={onButtonClick}>
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
