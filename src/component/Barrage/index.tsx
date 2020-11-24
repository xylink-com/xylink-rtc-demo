/**
 * 点名、字幕提示
 */
import React, { useRef, useEffect } from "react";
import { ISubTitleContent } from "../../type";
import "./index.scss";

interface IProps {
  subTitle: ISubTitleContent
}

const Barrage = (props: IProps) => {
  const { subTitle } = props;
  const containerWidth = window.innerWidth;
  const subTitleRef = useRef<any>(null);
  let intervalTimer = useRef<any>(null);;

  const {
    content,
    action,
    backgroundRGB = '',
    backgroundAlpha = '0',
    fontRGB = '#fff',
    scroll = '0',
    location = 'top',
    fontSize = 'middle'
  } = subTitle;

  const isScroll = scroll === "1";

  const fontSizeMap: any = {
    small: '18px',
    middle: '22px',
    big: '24px'
  };
  const locationMap: any = {
    top: '0px',
    middle: '42%',
    bottom: '0px'
  };

  const locationKey = location === 'middle' ? 'top' : location;

  const opacity = (Number(backgroundAlpha) / 100).toFixed(2);

  const style = {
    fontSize: fontSizeMap[fontSize],
    color: fontRGB,
    background: backgroundRGB || 'transparent',
    opacity,
    [locationKey]: locationMap[location]
  };



  useEffect(() => {
    // 实现弹幕
    if (subTitleRef.current) {
      const objWidth = subTitleRef.current.clientWidth;
      const initTransformX = containerWidth
      let transformX = initTransformX;

      const render = () => {
        transformX -= 0.5;
        if (transformX + objWidth < 0) {
          cancelAnimationFrame(intervalTimer.current);
          transformX = initTransformX;
        }

        if (subTitleRef.current) {
          subTitleRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`;
        }

        intervalTimer.current = requestAnimationFrame(render);
      };

      if (isScroll) {
        subTitleRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`;
        subTitleRef.current.style.visibility = "initial";

        render();
      }
    }

    return () => {
      cancelAnimationFrame(intervalTimer.current);
    }

  }, [subTitle, containerWidth, isScroll]);

  useEffect(() => {
    if (!subTitle || action !== 'push' || scroll !== '1') {
      cancelAnimationFrame(intervalTimer.current);
    }
  }, [subTitle, action, scroll])




  if (content && action === 'push') {
    const { background, opacity } = style || { background: '', opacity: 1 };
    const textAlign = isScroll ? { textAlign: 'left' } : { textAlign: 'center' };
    const textStyle: any = { ...textAlign, ...style, background: 'transparent', opacity: 1, };

    return (
      <div className="barrage-title" style={textStyle}>
        <div className="barrage-title-bg" style={{ background, opacity }}></div>
        <span className={isScroll ? 'barrage-title-text' : ''} ref={subTitleRef} style={isScroll ? { visibility: "hidden" } : { visibility: "initial" }}>
          {content}
        </span>
      </div>
    );
  } else {
    return <></>
  }
}

export default Barrage;