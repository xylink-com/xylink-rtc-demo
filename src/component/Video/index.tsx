/**
 * XYRTC Video Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { fscreen } from "../../utils/screen";
import { ILayout } from '../../type'
import './index.scss';

interface IProps {
  // roster数据
  item: ILayout;
  // 桌面布局模式，语音激励和画廊模式
  model: string;
  // pid: endpointed + mediagroupId
  id: string;
  client: any;
}

const Video: React.FC<any> = (props: IProps) => {
  const { item, model, id, client } = props;
  const state = item.state;
  const wrapVideoId = 'wrap-' + id;

  const [border, setBorder] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);

  const videoWrapRef = useRef<any>(null);

  useEffect(() => {
    const videoWrapEle = videoWrapRef.current;
    // 监听全屏状态change事件
    fscreen.init(videoWrapEle, (e) => {
      setIsFullScreen(e.isFullScreen);
    });

    // 释放资源
    return () => { fscreen.clear(videoWrapEle); }
  }, [])

  useEffect(() => {
    // 对称布局AS设备显示2px篮框
    let borderStyle = (model === "GALLERY" && item.roster.isActiveSpeaker) ? "2px solid #1483eb" : "none";

    setBorder({ border: borderStyle })
  }, [model, item.roster.isActiveSpeaker]);

  useEffect(() => {
    client.setVideoRenderer(id, wrapVideoId);
  }, [client, id, wrapVideoId]);

  const toggleFullScreen = () => {
    if (isFullScreen) {
      fscreen.exit(videoWrapRef.current);
    } else {
      fscreen.request(videoWrapRef.current);
    }
  }

  const videoWrapStyle = useMemo(() => {
    let wrapStyle = {};
    const positionStyle = item.positionStyle;

    if (positionStyle && positionStyle.width) {
      wrapStyle = positionStyle;
    }

    return wrapStyle;
  }, [item.positionStyle]);

  const videoStyle = useMemo(() => {
    let style = {};
    let fullStyle = {};

    if (isFullScreen) {
      fullStyle = {
        width: "100%",
        height: "100%",
        objectFit: "contain"
      };
    }

    style = item.rotate;

    if (item.roster.isContent || isFullScreen) {
      style = {
        ...style,
        ...fullStyle
      };
    }

    return style;
  }, [isFullScreen, item.rotate, item.roster]);

  const renderVideoName = () => {
    return <div className="video-status">
      {!item.roster.isContent && <div className={item.roster.audioTxMute ? "audio-muted-status" : "audio-unmuted-status"}></div>}
      <div className="name">
        {`${item.roster.displayName || "Local"}`}
      </div>
    </div>
  }

  return (
    <div className="wrap-video" style={videoWrapStyle} ref={videoWrapRef} id={wrapVideoId} onDoubleClick={toggleFullScreen}>
      <div className="video">
        <div className="video-content" style={border}>
          <div className="video-model">
            <div className={`video-bg ${state === 'AUDIO_TEL' || state === 'AUDIO_CONTENT' || state === 'AUDIO_ONLY' ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div>语音通话中</div>
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-bg ${state === 'MUTE' || state === 'INVALID' ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                {isFullScreen && <div className="displayname">{item.roster.displayName || ""}</div>}

                <div>{item.roster.isLocal ? '视频暂停' : '对方忙，暂时关闭视频'}</div>
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-bg ${state === 'REQUEST' ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div>视频请求中...</div>
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-status video-animote ${state === 'NORMAL' ? 'video-show' : 'video-hidden'}`}>
              {
                !item.roster.isContent && <div className={item.roster.audioTxMute ? "audio-muted-status" : "audio-unmuted-status"}></div>
              }
              <div className="name">
                {item.roster.displayName}
              </div>
            </div>

          </div>
        </div>

        {
          <video style={videoStyle} ></video>
        }
      </div>
    </div >
  )
}

export default Video;