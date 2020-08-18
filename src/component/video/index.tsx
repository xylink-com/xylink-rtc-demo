/**
 * XYRTC Video Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useLayoutEffect, useRef, useEffect, useState, useCallback } from 'react';
import { MoreOutlined, FullscreenOutlined, BlockOutlined, FullscreenExitOutlined, ExpandOutlined } from '@ant-design/icons';
import { Menu, Dropdown, Button } from 'antd';
import fullScreen from "../../utils/screen";
import './index.scss';

interface IProps {
  // roster数据
  item: any;
  // 最后一位的画面需要每次渲染是刷新一下
  isRefresh: boolean;
  // 索引值
  index: number;
  // 桌面布局模式，语音激励和画廊模式
  model: string;
  // 当前video唯一的key值
  videoId: string;
}

const Video: React.FC<any> = (props: IProps) => {
  const { item, index, isRefresh, model, videoId } = props;
  const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";

  const videoRef = useRef<any>(null);

  const [border, setBorder] = useState({});
  const [streamStatus, setStreamStatus] = useState('enabled');
  // safari 关闭画中画功能
  const [operate, setOperate] = useState({
    isPicture: false,
    isDisabled: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isCoverMode: true
  });

  const timmer = useRef<any>(0);

  const onMute = () => {
    clearTimeer();

    timmer.current = setTimeout(() => {
      if (streamStatus !== 'enabled') {
        setStreamStatus('comming');
      }
    }, 1200);
  }

  const onUnmute = () => {
    setStreamStatus('enabled');
    clearTimeer();
  }

  const clearTimeer = () => {
    if (timmer.current) {
      clearTimeout(timmer.current);
      timmer.current = null;
    }
  }

  const onLoadStart = () => {
    setStreamStatus('comming');
  }

  const onLoadCanPlay = () => {
    setStreamStatus('enabled');
  }

  const onLoadEnded = () => {
    console.log(`-----${item.roster.displayName} on load ended`);
  }

  const onLoadError = () => {
    console.log(`-----${item.roster.displayName} on load error`);
  }

  const showPictureInPicture = () => {
    setOperate({
      ...operate,
      isPicture: true
    })
  }

  const hidePictureInPicture = () => {
    setOperate({
      ...operate,
      isPicture: false
    })
  }

  useEffect(() => {
    const videoEle: any = document.getElementById(videoId);

    if (index >= 1 && item && item.stream && item.stream.track) {
      item.stream.track.addEventListener('mute', onMute);

      item.stream.track.addEventListener('unmute', onUnmute);
    }

    return () => {
      if (videoEle) {
        videoEle.pause();

        // 进入画中画模式时候执行
        videoEle.removeEventListener('enterpictureinpicture', showPictureInPicture);
        // 退出画中画模式时候执行
        videoEle.removeEventListener('leavepictureinpicture', hidePictureInPicture);
      }

      if (index >= 1 && item && item.stream && item.stream.track) {
        item.stream.track.removeEventListener('mute', onMute);

        item.stream.track.removeEventListener('unmute', onUnmute);
      }

      clearTimeer();
    }
  }, []);

  useEffect(() => {
    if (model === "gallery" && item.roster.isActiveSpeaker) {
      setBorder({
        border: "2px solid #1483eb"
      })
    } else {
      setBorder({
        border: "none"
      })
    }
  }, [model, item.roster.isActiveSpeaker]);

  useLayoutEffect(() => {
    (async () => {
      const videoEle: any = document.getElementById(videoId);

      if (videoEle && !videoEle.srcObject && item.stream.video) {
        videoEle.srcObject = item.stream.video;

        try {
          await videoEle.play();

          // 进入画中画模式时候执行
          videoEle.addEventListener('enterpictureinpicture', showPictureInPicture);
          // 退出画中画模式时候执行
          videoEle.addEventListener('leavepictureinpicture', hidePictureInPicture);
        } catch (err) {
          console.log("play video err: ", err);
        }
      }
    })();

    if (isRefresh && videoRef.current) {
      const realWidth = parseInt(videoRef.current.style.width);

      videoRef.current.style.width = `${realWidth}px`;
    }
  })

  const switchPictureInPicture = async () => {
    if (operate.isPicture) {
      // @ts-ignore
      document.exitPictureInPicture()
    } else {
      const videoDom = document.getElementById(videoId);

      // @ts-ignore
      videoDom && videoDom.requestPictureInPicture();
    }
  }

  const switchVideoMode = () => {
    const videoEle: any = document.getElementById(videoId);
    if (operate.isCoverMode) {
      videoEle.style.objectFit = "contain"
    } else {
      videoEle.style.objectFit = "cover"
    }

    setOperate({
      ...operate,
      isCoverMode: !operate.isCoverMode
    })
  }

  const toggleFullScreen = () => {
    fullScreen.toggleFullScreen(videoRef.current);
  }

  const renderVideoMenu = useCallback(
    () => {
      return (
        <Menu>
          <Menu.Item onClick={toggleFullScreen}>
            {fullScreen.getFullStatus(videoRef.current) ? (
              <>
                <FullscreenExitOutlined />
              切换显示
            </>
            ) : (
                <>
                  <FullscreenOutlined />
              切换显示
            </>
              )}
          </Menu.Item>
          <Menu.Item onClick={switchPictureInPicture}>
            {operate.isPicture ?
              (
                <><BlockOutlined />退出画中画</>
              ) :
              (
                <><BlockOutlined />画中画</>
              )
            }
          </Menu.Item>
          {
            !item.roster.isContent &&
            <Menu.Item onClick={switchVideoMode}>
              {operate.isCoverMode ? (
                <>
                  <ExpandOutlined />
                contain模式
              </>
              ) : (
                  <>
                    <ExpandOutlined />
                cover模式
              </>
                )}
            </Menu.Item>
          }
        </Menu>
      )
    },
    [operate],
  );

  let videoStyle = {};
  let videoSty = {};
  const positionStyle = item.positionStyle;
  const isShowLoading = (!item.stream.video || streamStatus === 'coming') && index >= 1;

  if (positionStyle && positionStyle.width) {
    videoStyle = positionStyle;
  }

  if (index > 0) {
    videoSty = item.rotate;

    if (item.roster.isContent) {
      videoSty = {
        ...videoSty,
        width: 'auto',
        objectFit: 'contain'
      };
    }
  } else {
    videoSty = {
      ...item.rotate,
      transform: 'rotateY(180deg)'
    };
  }
  const renderVideoName = () => {
    return <div className="video-status">
      <div className={item.roster.audioTxMute ? "audio-muted-status" : "audio-unmuted-status"}></div>
      <div className="name">
        {`${item.roster.displayName || "Local"}`}
      </div>
    </div>
  }

  const renderVideoStatus = () => {
    if (operate.isPicture) {
      return (
        <div className="video-bg">
          <div className="center">
            {/* <div className="displayname">{item.roster.displayName || "Local"}</div> */}
            <div>画中画显示中...</div>
            <div>
              <Button type="link" onClick={switchPictureInPicture}>恢复</Button>
            </div>
          </div>
          {renderVideoName()}
        </div>
      )
    }

    if (item.roster.isContent) {
      if (item.roster.videoTxMute) {
        return (
          <div className="video-bg">
            <div className="center">
              <div className="displayname">{item.roster.displayName || ""}</div>
              <div>语音通话中</div>
            </div>
          </div>
        )
      }

      return null;
    }

    if (item.roster.videoTxMute) {
      return (
        <div className="video-bg">
          <div className="center">
            <div>视频暂停</div>
          </div>
          {renderVideoName()}
        </div>
      )
    }

    if (isShowLoading) {
      return (
        <div className="video-bg">
          <div className="center">
            <div>视频请求中...</div>
          </div>
          {renderVideoName()}
        </div>
      )
    }

    return renderVideoName()
  }

  const renderVideoOperate = () => {
    return (
      <div id={streamId}>
        <Dropdown overlay={renderVideoMenu} placement="bottomRight" trigger={['click']} getPopupContainer={() => {
          const dom: any = document.getElementById(streamId);

          return dom ? dom : document.body;
        }}>
          <MoreOutlined className="operate-icon" />
        </Dropdown>
      </div>
    )
  }

  return (
    <div className="wrap-video" style={videoStyle} ref={videoRef}>
      <div className="video">
        <div className="video-content" style={border}>
          <div className="video-model">
            <div className="status">
              <p style={{ display: 'none' }}>streamId: {item.stream && item.stream.video && item.stream.video.id}</p>
            </div>
            {
              renderVideoStatus()
            }

            {
              !operate.isDisabled && !item.roster.videoTxMute && renderVideoOperate()
            }
          </div>
        </div>

        {
          item.stream.video && (
            <video
              style={videoSty}
              autoPlay
              controls={false}
              playsInline
              id={videoId}
              muted={index === 0}
              onCanPlay={onLoadCanPlay}
              onLoadStart={onLoadStart}
              onError={onLoadError}
              onEnded={onLoadEnded}
            ></video>
          )
        }

      </div>
    </div >
  )
}

export default Video;