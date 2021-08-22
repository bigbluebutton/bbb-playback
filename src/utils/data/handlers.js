import { POSITIONS } from 'utils/constants';
import logger from 'utils/logger';

const getScrollLeft = (firstNode, currentNode, align) => {
  if (!currentNode) return 0;

  const {
    clientWidth,
    offsetLeft,
    parentNode,
  } = currentNode;

  if (!firstNode || !parentNode) return 0;

  const ltr = document.dir === 'ltr';
  const spacing = ltr ? firstNode.offsetLeft : 0;
  const parentWidth = parentNode.clientWidth;

  let horizontalOffset = 0;
  switch (align) {
    case POSITIONS.LEFT:
      horizontalOffset = offsetLeft - spacing;
      break;
    case POSITIONS.CENTER:
      horizontalOffset = parseInt(offsetLeft + (clientWidth - spacing - parentWidth) / 2, 10);
      break;
    case POSITIONS.RIGHT:
      horizontalOffset = offsetLeft + clientWidth - parentWidth;
      break;
    default:
      logger.debug('unhandled', align);
  }

  return horizontalOffset;
};

const getScrollTop = (firstNode, currentNode, align) => {
  if (!currentNode) return 0;

  const {
    clientHeight,
    offsetTop,
    parentNode,
  } = currentNode;

  if (!firstNode || !parentNode) return 0;

  const spacing = firstNode.offsetTop;
  const parentHeight = parentNode.clientHeight;

  let verticalOffset = 0;
  switch (align) {
    case POSITIONS.TOP:
      verticalOffset = offsetTop - spacing;
      break;
    case POSITIONS.MIDDLE:
      verticalOffset = parseInt(offsetTop + (clientHeight - spacing - parentHeight) / 2, 10);
      break;
    case POSITIONS.BOTTOM:
      verticalOffset = offsetTop + clientHeight - parentHeight;
      break;
    default:
      logger.debug('unhandled', align);
  }

  return verticalOffset;
};

const handleOnEnterPress = (event, action) => {
  if (event && event.key === 'Enter') {
    if (typeof action === 'function') action();
  }
};

const handleAutoScroll = (fNode, cNode, direction, align) => {
  // Auto-scroll can start after getting the first and current nodes
  if (fNode && cNode) {
    const { parentNode: pNode } = cNode;

    switch (direction) {
      case POSITIONS.LEFT:
        pNode.scrollLeft = getScrollLeft(fNode, cNode, align);
        break;
      case POSITIONS.TOP:
        pNode.scrollTop = getScrollTop(fNode, cNode, align);
        break;
      default:
        logger.debug('unhandled', direction);
    }
  }
};

export {
  getScrollLeft,
  getScrollTop,
  handleAutoScroll,
  handleOnEnterPress,
};
