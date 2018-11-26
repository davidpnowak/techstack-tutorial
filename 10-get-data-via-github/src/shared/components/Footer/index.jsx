import React, { Component } from 'react';
import { APP_NAME } from 'shared/config';
import main from '../../styles/main.scss';
import styles from './style.scss';

class Footer extends Component {
  render() {
    return (
      <div className={main.footer}>
        <div className={styles.footer}>
          <p>
©
            {APP_NAME}
            {' '}
2017
          </p>
        </div>
      </div>
    );
  }
}

export default Footer;
