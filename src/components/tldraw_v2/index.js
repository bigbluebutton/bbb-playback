import { withSize } from 'react-sizeme'
import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import { Tldraw, AssetRecordType } from '@bigbluebutton/tldraw';
import '@bigbluebutton/tldraw/tldraw.css'
import {
  useCurrentContent,
  useCurrentIndex,
  useCurrentInterval,
  useLayoutSwap,
} from 'components/utils/hooks';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';
import {
  getTldrawData, getViewBox, createTldrawImageAsset,
  createTldrawBackgroundShape, createTldrawCursorShape,
  setupColorThemePaletteOverrides
} from 'utils/tldraw';
import { buildFileURL } from 'utils/data';
import { isEmpty } from 'utils/data/validators';
import getCursor from './cursor';

const MAX_IMAGE_WIDTH = 1440;
const MAX_IMAGE_HEIGHT = 1080;

setupColorThemePaletteOverrides();

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

const SlideData = (tldrawAPI) => {
  let assets = {};
  let shapes = {};
  const currentIndex = useCurrentIndex(storage.slides);
  const currentCursorIndex = useCurrentIndex(storage.cursor);

  const {
    index,
    interval,
  } = useCurrentInterval(storage.tldraw);

  if (currentIndex === -1) return { assets, shapes, scaleRatio: 1.0 }

  const {
    height,
    id,
    src,
    width,
  } = storage.slides[currentIndex];

  const scaleRatio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
  const scaledWidth = width * scaleRatio;
  const scaledHeight = height * scaleRatio;

  const curPageId = tldrawAPI?.getCurrentPageId();
  const assetId = AssetRecordType.createId(curPageId);

  assets[`slide-background-asset-${id}`] = createTldrawImageAsset(assetId, buildFileURL(src), scaledWidth, scaledHeight)
  shapes["slide-background-shape"] = createTldrawBackgroundShape(assetId, curPageId, scaledWidth, scaledHeight)

  const { x, y } = getCursor(currentCursorIndex);

  if (!(x === -1 || y === -1)) {
    shapes['cursor'] = createTldrawCursorShape(x, y, curPageId);
  }

  if (index === -1 || isEmpty(interval)) return { assets, shapes, scaleRatio }

  for (let i = 0; i < interval.length; i++) {
    if (!interval[i]) continue;

    const tldrawData = getTldrawData(index, id);

    if (tldrawData[i]) {
      const {
        shape,
      } = tldrawData[i];

      const newShape = { ...shape };
      newShape.parentId = tldrawAPI?.getCurrentPageId();
      shapes[newShape.id] = newShape;
    }
  }

  return { assets, shapes, scaleRatio }
}

const TldrawPresentationV2 = ({ size }) => {
  const [tldrawAPI, setTLDrawAPI] = React.useState(null);
  const intl = useIntl();
  const currentContent = useCurrentContent();
  const currentPanzoomIndex = useCurrentIndex(storage.panzooms);
  const currentSlideIndex = useCurrentIndex(storage.slides);
  const started = currentPanzoomIndex !== -1;

  const result = SlideData(tldrawAPI);
  const { showScreenshare } = useLayoutSwap();

  let { assets, shapes, scaleRatio } = result;
  const {
    x,
    y,
    width: viewboxWidth,
    height: viewboxHeight
  } = getViewBox(currentPanzoomIndex, scaleRatio);

  let svgWidth;
  let svgHeight;
  svgWidth = (size.height * viewboxWidth) / viewboxHeight;
  if (size.width < svgWidth) {
    svgHeight = (size.height * size.width) / svgWidth;
    svgWidth = size.width;
  } else {
    svgHeight = size.height;
  }

  React.useEffect(() => {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }
    let zoom =
      Math.min(
        svgWidth / viewboxWidth,
        svgHeight / viewboxHeight
      );

    tldrawAPI?.setCamera({ x, y, z: zoom });

  }, [svgWidth, svgHeight, viewboxWidth, viewboxHeight, x, y, currentSlideIndex, tldrawAPI, size, result]);

  React.useEffect(() => {
    tldrawAPI?.updateInstanceState({ isReadonly: false });
    // Remove all current shapes
    const currentShapesSet = tldrawAPI?.getCurrentPageShapeIds() || (new Set());
    const curentShapes = Array.from(currentShapesSet);
    if (curentShapes.length > 0) { tldrawAPI?.deleteShapes(curentShapes); }

    // Remove unnecessary properties from shapes to prevent Tldraw's validation from failing
    const validatedShapes = Object.values(shapes).map((shape) => {
      if ('isModerator' in shape) {
        delete shape.isModerator;
      }
      return shape;
    })

    tldrawAPI?.createAssets(Object.values(assets));
    tldrawAPI?.createShapes(validatedShapes);
    tldrawAPI?.updateInstanceState({ isReadonly: true });
  }, [tldrawAPI, shapes, assets]);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('presentation-wrapper', { inactive: (currentContent !== ID.PRESENTATION && showScreenshare) })}
      id={ID.PRESENTATION}
    >{!started
      ? <div className={cx('presentation', 'logo')} />
      : <div className={'presentation'}
        style={{
          position: 'absolute',
          width: svgWidth < 0 ? 0 : svgWidth,
          height: svgHeight < 0 ? 0 : svgHeight,
        }}>
        <Tldraw
          autofocus={false}
          hideUi={true}
          onMount={(app) => {
            app.updateInstanceState({ canMoveCamera: false });
            app.setSelectedIds = () => { };
            app.setHoveredId = () => { };
            app.setSelectedShapes = () => { };
            app.setHoveredShape = () => { };
            app.onRightClick = () => { };
            app.onDoubleClick = () => { };
            app.onTripleClick = () => { };
            app.onQuadrupleClick = () => { };
            app.onWheel = () => { };
            app.store.listen(
              (entry) => {
                const { changes } = entry;
                const { updated } = changes;
                const { 'instance:instance': instances } = updated;

                if (instances && instances.length > 0) {
                  const newInstance = instances[1];
                  if (newInstance && newInstance.brush) {
                    app.updateInstanceState({ brush: null });
                  }
                }
              },
              { source: 'user' },
            );
            setTLDrawAPI(app);
          }}
        />
      </div>
      }
    </div>
  );
};

const areEqual = () => true;

export default React.memo(withSize({ monitorHeight: true })(TldrawPresentationV2), areEqual);
