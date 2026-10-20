import React from 'react';
import { ERROR } from 'utils/constants';
import logger from 'utils/logger';
import Error from './index';

// Shows the error page (with its retry button) instead of a blank page when
// part of the player fails, e.g. a code chunk that cannot be downloaded
// after a redeploy or on a flaky network
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    logger.error('player', error, info && info.componentStack);
  }

  render() {
    const { children, code } = this.props;

    if (this.state.failed) return <Error code={code || ERROR.SERVICE_UNAVAILABLE} />;

    return children;
  }
}

export default ErrorBoundary;
