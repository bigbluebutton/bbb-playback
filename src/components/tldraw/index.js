import { withSize } from 'react-sizeme'
import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import { gte as semverGte } from 'semver';
import Cursor from './cursor';
import {
  Tldraw,
  ColorStyle,
  DashStyle,
  SizeStyle,
  TDShapeType,
} from "tldraw-v1";
import {
  useCurrentContent,
  useCurrentIndex,
  useCurrentInterval,
} from 'components/utils/hooks';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import { isEmpty } from 'utils/data/validators';
import { buildFileURL } from 'utils/data';
import './index.scss';
import { getTldrawData, getViewBox, getTldrawBbbVersion } from 'utils/tldraw';

// The size of the scaled coordinate system for tldraw whiteboard
let MAX_IMAGE_WIDTH = 2048;
let MAX_IMAGE_HEIGHT = 1536;

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

  const bbbVersion = getTldrawBbbVersion(index);
  if (bbbVersion && semverGte(bbbVersion, '2.6.1')) {
    MAX_IMAGE_WIDTH = 1440;
    MAX_IMAGE_HEIGHT = 1080;
  }

  const scaleRatio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
  const scaledWidth = width * scaleRatio;
  const scaledHeight = height * scaleRatio;

  assets[`slide-background-asset-${id}`] = {
    id: `slide-background-asset-${id}`,
    size: [scaledWidth || 0, scaledHeight || 0],
    src: buildFileURL(src),
    type: "image",
  };

  shapes["slide-background-shape"] = {
    assetId: `slide-background-asset-${id}`,
    childIndex: -1,
    id: "slide-background-shape",
    name: "Image",
    type: TDShapeType.Image,
    parentId: tldrawAPI?.currentPageId,
    point: [0, 0],
    isLocked: true,
    size: [scaledWidth || 0, scaledHeight || 0],
    style: {
      dash: DashStyle.Draw,
      size: SizeStyle.Medium,
      color: ColorStyle.Blue,
    },
  };

  if (index === -1 || isEmpty(interval)) return { assets, shapes, scaleRatio }

  for (let i = 0; i < interval.length; i++) {
    if (!interval[i]) continue;

    const tldrawData = getTldrawData(index, id);

    if (tldrawData[i]) {
      const {
        shape,
      } = tldrawData[i];
  
      shape.parentId = tldrawAPI?.currentPageId;
      shapes[shape.id] = shape; 
    }
  }

  return { assets, shapes, scaleRatio }
}

const TldrawPresentation = ({ size }) => {
  const [tldrawAPI, setTLDrawAPI] = React.useState(null);
  const intl = useIntl();
  const currentContent = useCurrentContent();
  const currentPanzoomIndex = useCurrentIndex(storage.panzooms);
  const currentSlideIndex = useCurrentIndex(storage.slides);
  const started = currentPanzoomIndex !== -1;

  const result = SlideData(tldrawAPI);

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
    let zoom =
      Math.min(
        svgWidth / viewboxWidth,
        svgHeight / viewboxHeight
      );

    tldrawAPI?.setCamera([x, y], zoom);

  }, [svgWidth, svgHeight, viewboxWidth, viewboxHeight, x, y, currentSlideIndex, tldrawAPI, size, result]);

  React.useEffect(() => {
    tldrawAPI?.replacePageContent(shapes, {}, assets)
  }, [tldrawAPI, shapes, assets]);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('presentation-wrapper', { inactive: currentContent !== ID.PRESENTATION })}
      id={ID.PRESENTATION}
    >
      {!started
        ? <div className={cx('presentation', 'logo')} />
        : <div className={'presentation'}
          style={{
            position: 'absolute',
            width: svgWidth < 0 ? 0 : svgWidth,
            height: svgHeight < 0 ? 0 : svgHeight,
          }}>
          <Cursor tldrawAPI={tldrawAPI} size={size} />
          <Tldraw
            disableAssets={true}
            autofocus={false}
            showPages={false}
            showZoom={false}
            showUI={false}
            showMenu={false}
            showMultiplayerMenu={false}
            readOnly={true}
            onMount={(app) => {
              app.onPan = () => { };
              app.setSelectedIds = () => { };
              app.setHoveredId = () => { };
              setTLDrawAPI(app);
            }}
            onPatch={(e, t, reason) => {
              // disable select
              if (e?.getPageState()?.brush || e?.selectedIds?.length !== 0) {
                e.patchState(
                  {
                    document: {
                      pageStates: {
                        [e?.currentPageId]: {
                          selectedIds: [],
                          brush: null,
                        },
                      },
                    },
                  },
                );
              }
              //disable pan&zoom
              if (reason && (reason.includes("zoomed") || reason.includes("panned"))) {
                let zoom =
                  Math.min(
                    svgWidth / viewboxWidth,
                    svgHeight / viewboxHeight
                  );
                tldrawAPI?.setCamera([x, y], zoom);
              }
            }}
          />
        </div>
      }
    </div>
  );
};

const areEqual = () => true;

export default React.memo(withSize({ monitorHeight: true })(TldrawPresentation), areEqual);
