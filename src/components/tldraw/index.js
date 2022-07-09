import { withSize } from 'react-sizeme'
import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import Cursor from './cursor';
import {
  Tldraw,
  ColorStyle,
  DashStyle,
  SizeStyle,
  TDShapeType,
} from "@tldraw/tldraw";
import { Utils } from "@tldraw/core";
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

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

const getTldrawData = (index) => storage.tldraw[index].data;

const SlideData = (tldrawAPI) => {
  let assets = {};
  let shapes = {};
  const currentIndex = useCurrentIndex(storage.slides);

  const {
    index,
    interval,
  } = useCurrentInterval(storage.tldraw);
  
  if (currentIndex === -1) return { assets, shapes }

  const {
    height,
    id,
    src,
    width,
  } = storage.slides[currentIndex];

  let imageUrl =  buildFileURL(src);
  // tldraw needs the full address as src
  if (!imageUrl.startsWith("http")) {
    imageUrl = window.location.origin + imageUrl;
  }

  assets[`slide-background-asset-${id}`] = {
    id: `slide-background-asset-${id}`,
    size: [width || 0, height || 0],
    src: buildFileURL(src),
    type: "image",
  };

  shapes["slide-background-shape"] = {
    assetId: `slide-background-asset-${id}`,
    childIndex: 0.5,
    id: "slide-background-shape",
    name: "Image",
    type: TDShapeType.Image,
    parentId: tldrawAPI?.currentPageId,
    point: [0, 0],
    isLocked: true,
    size: [width || 0, height || 0],
    style: {
      dash: DashStyle.Draw,
      size: SizeStyle.Medium,
      color: ColorStyle.Blue,
    },
  };

  if (index === -1 || isEmpty(interval)) return { assets, shapes, width, height }

  for (let i = 0; i < interval.length; i++) {
    if (!interval[i]) continue;

    const tldrawData = getTldrawData(index);

    const {
      shape,
    } = tldrawData[i];

    shapes[shape.id] = shape;
  }

  return { assets, shapes, width, height }
}

const getCameraAndZoom = (index) => {
  const inactive = {
    xCamera: 0,
    yCamera: 0,
    zoom: 0,
  };

  if (index === -1) return inactive;

  const currentData = storage.panzooms[index];

  return {
    xCamera: currentData.xCamera,
    yCamera: currentData.yCamera,
    zoom: currentData.zoom,
  };
};

const TldrawPresentation = ({ size }) => {
  const [tldrawAPI, setTLDrawAPI] = React.useState(null);
  const intl = useIntl();
  const currentContent = useCurrentContent();
  const currentPanzoomIndex = useCurrentIndex(storage.panzooms);
  const currentSlideIndex = useCurrentIndex(storage.slides);
  const started = currentPanzoomIndex !== -1;

  const result = SlideData(tldrawAPI);

  let { assets, shapes } = result;

  const calculateCameraFitSlide = (size, result) => {
    const { width, height } = result;
    if (size && width && height) {
      let zoom = 
        Math.min(
          (size.width) / width,
          (size.height) / height,
        )        
        
      zoom = Utils.clamp(zoom, 0.1, 5);
    
      let point = [0, 0];
      if ((size.width / size.height) > 
          (width / height)) 
      { 
        point[0] = (size.width - (width * zoom)) / 2 / zoom
      } else {
        point[1] = (size.height - (height * zoom)) / 2 / zoom
      }
    
      return {point, zoom}
    } else {
      return null
    }
  }

  React.useEffect(() => {
    const { xCamera, yCamera, zoom } = getCameraAndZoom(currentPanzoomIndex);
    if (xCamera === 0 && yCamera === 0 && zoom === 0) {
      const camera = calculateCameraFitSlide(size, result);
      if (camera) {
        tldrawAPI?.setCamera(camera.point, camera.zoom);
      }
    } else {
      tldrawAPI?.setCamera([xCamera, yCamera], zoom);
    }
  }, [currentPanzoomIndex, currentSlideIndex, tldrawAPI, size, result]);
  
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
        ? <div className={cx('presentation', 'logo')}/>
        : <div className={'presentation'}>
            <Cursor tldrawAPI={tldrawAPI} size={size}/>
            <Tldraw          
              disableAssets={true}
              showPages={false}
              showZoom={true}
              showUI={false}
              showMenu={false}
              showMultiplayerMenu={false}
              readOnly={true}
              onMount={(app) => {
                setTLDrawAPI(app);
              }}
            />
          </div>
      }
    </div>
  );
};

const areEqual = () => true;

export default React.memo(withSize({ monitorHeight: true })(TldrawPresentation), areEqual);
