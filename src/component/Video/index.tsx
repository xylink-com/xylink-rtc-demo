/**
 * XYRTC Video Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MoreOutlined, FullscreenOutlined, BlockOutlined, FullscreenExitOutlined, ExpandOutlined } from '@ant-design/icons';
import { Menu, Dropdown, Button } from 'antd';
import { fscreen } from "../../utils/screen";
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

  const [border, setBorder] = useState({});
  const [streamStatus, setStreamStatus] = useState('enabled');
  const [playStatus, setPlayStatus] = useState(false);
  // safari 关闭画中画功能
  const [operate, setOperate] = useState({
    isPicture: false,
    isDisabled: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isCoverMode: true
  });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const videoWrapRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const timmer = useRef<any>(0);

  useEffect(() => {
    // 监听全屏状态change事件
    fscreen.init(videoWrapRef.current, (e: any) => {
      setIsFullScreen(e.isFullScreen);
    });

    return () => {
      fscreen.clear(videoWrapRef.current);
    }
  }, [])

  const onMute = useCallback(() => {
    console.log(videoId + " onMute");
    clearTimeer();

    timmer.current = setTimeout(() => {
      setStreamStatus(streamStatus => {
        return streamStatus !== 'enabled' ? 'comming' : streamStatus;
      })
    }, 1200);
  }, []);

  const onUnmute = useCallback(() => {
    console.log(videoId + " onUnMute");
    setStreamStatus('enabled');
    clearTimeer();
  }, [])


  const clearTimeer = () => {
    if (timmer.current) {
      clearTimeout(timmer.current);
      timmer.current = null;
    }
  }

  const onLoadStart = () => {
    console.log(videoId + " onLoadStart");

    setPlayStatus(false);
    // setStreamStatus('comming');
  }

  const onLoadCanPlay = () => {
    console.log(videoId + " enabled");

    setPlayStatus(true);
    // setStreamStatus('enabled');
  }

  const showPictureInPicture = useCallback(() => {
    setOperate(operate => {
      return {
        ...operate,
        isPicture: true
      }
    })
  }, []);

  const hidePictureInPicture = useCallback(() => {
    setOperate(operate => {
      return {
        ...operate,
        isPicture: false
      }
    })
  }, []);

  useEffect(() => {
    if (index >= 1 && item && item.stream && item.stream.track) {
      item.stream.track.addEventListener('mute', onMute);

      item.stream.track.addEventListener('unmute', onUnmute);
    }

    return () => {
      if (index >= 1 && item && item.stream && item.stream.track) {
        item.stream.track.removeEventListener('mute', onMute);

        item.stream.track.removeEventListener('unmute', onUnmute);
      }

      clearTimeer();
    }
  }, [index, item, onMute, onUnmute]);

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

  useEffect(() => {
    const videoEle = videoRef.current;

    (async () => {
      if (videoEle && !videoEle.srcObject && item.stream.video) {
        videoEle.srcObject = item.stream.video;

        if (videoEle.paused) {
          await videoEle.play();
        }

        // 进入画中画模式时候执行
        videoEle.addEventListener('enterpictureinpicture', showPictureInPicture);
        // 退出画中画模式时候执行
        videoEle.addEventListener('leavepictureinpicture', hidePictureInPicture);
      }
    })();

    return () => {
      if (videoEle) {
        videoEle.pause();
        videoEle.srcObject = null;

        // 进入画中画模式时候执行
        videoEle.removeEventListener('enterpictureinpicture', showPictureInPicture);
        // 退出画中画模式时候执行
        videoEle.removeEventListener('leavepictureinpicture', hidePictureInPicture);
      }
    }
  }, [item.stream.video, showPictureInPicture, hidePictureInPicture])

  useEffect(() => {
    if (isRefresh && videoWrapRef.current) {
      const realWidth = parseInt(videoWrapRef.current.style.width);

      videoWrapRef.current.style.width = `${realWidth}px`;
    }
  }, [isRefresh]);

  const switchPictureInPicture = useCallback(() => {
    if (operate.isPicture) {
      // @ts-ignore
      document.exitPictureInPicture()
    } else {
      const videoEle = videoRef.current;

      videoEle && videoEle.requestPictureInPicture();
    }
  }, [operate.isPicture]);

  const switchVideoMode = useCallback(() => {
    const videoEle = videoRef.current;

    if (operate.isCoverMode) {
      videoEle.style.objectFit = "contain"
    } else {
      videoEle.style.objectFit = "cover"
    }

    setOperate(operate => {
      return {
        ...operate,
        isCoverMode: !operate.isCoverMode
      }
    })
  }, [operate.isCoverMode]);

  const toggleFullScreen = () => {
    if (isFullScreen) {
      fscreen.exit(videoWrapRef.current);
    } else {
      fscreen.request(videoWrapRef.current);
    }
  }

  const renderVideoMenu = useCallback(
    () => {
      return (
        <Menu theme="dark">
          <Menu.Item onClick={toggleFullScreen}>
            {isFullScreen ? (
              <>
                <FullscreenExitOutlined />
              退出全屏
            </>
            ) : (
                <>
                  <FullscreenOutlined />
              全屏
            </>
              )}
          </Menu.Item>
          <Menu.Item onClick={switchPictureInPicture}>
            {operate.isPicture ?
              (
                <><BlockOutlined />退出悬浮窗口</>
              ) :
              (
                <><BlockOutlined />悬浮窗口</>
              )
            }
          </Menu.Item>
          {
            !item.roster.isContent &&
            <Menu.Item onClick={switchVideoMode}>
              {operate.isCoverMode ? (
                <>
                  <ExpandOutlined />
                比例模式
              </>
              ) : (
                  <>
                    <ExpandOutlined />
                覆盖模式
              </>
                )}
            </Menu.Item>
          }
        </Menu>
      )
    },
    [operate, item.roster.isContent, switchPictureInPicture, switchVideoMode, isFullScreen],
  );

  const videoWrapStyle = useMemo(() => {
    let wrapStyle = {};
    const positionStyle = item.positionStyle;

    if (positionStyle && positionStyle.width) {
      wrapStyle = positionStyle;
    }

    return wrapStyle;
  }, [item.positionStyle]);

  const isShowLoading = (!item.stream.video || streamStatus === 'comming' || !playStatus) && index >= 1;

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

    if (index > 0) {
      style = item.rotate;

      if (item.roster.isContent || isFullScreen) {
        style = {
          ...style,
          ...fullStyle
        };
      }
    } else {
      style = {
        ...item.rotate,
        transform: 'rotateY(180deg)'
      };
    }

    return style;
  }, [isFullScreen, item.rotate, item.roster, index]);

  const renderVideoName = () => {
    return <div className="video-status">
      {!item.roster.isContent && <div className={item.roster.audioTxMute ? "audio-muted-status" : "audio-unmuted-status"}></div>}
      <div className="name">
        {`${item.roster.displayName || "Local"}`}
      </div>
    </div>
  }

  const videoStatus = useMemo(() => {
    let status = {
      picture: false,
      audioOnly: false,
      mute: false,
      request: false,
      normal: false
    };
    const { deviceType, videoTxMute, isContent } = item.roster;

    // 画中画
    if (operate.isPicture) {
      status = {
        ...status,
        picture: true
      }
    } else if (isContent) {
      const request = videoTxMute ? false : isShowLoading;
      // content共享
      // 仅音频共享: videoTxMute === true 
      status = {
        ...status,
        audioOnly: videoTxMute,
        normal: !videoTxMute,
        request
      }
    } else if (videoTxMute) {
      // 画面暂停
      status = {
        ...status,
        mute: true
      }
    } else if (deviceType === "tel" || deviceType === "pstngw") {
      // pstn/tel 入会，显示语音通话中
      status = {
        ...status,
        audioOnly: true
      }
    } else if (isShowLoading) {
      // 请求中
      status = {
        ...status,
        request: true
      }
    } else {
      // 正常模式
      status = {
        ...status,
        normal: true
      }
    }

    return status;
  }, [item, operate.isPicture, isShowLoading]);

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
    <div className="wrap-video" style={videoWrapStyle} ref={videoWrapRef}>
      <div className="video">
        <div className="video-content" style={border}>
          <div className="video-model">
            <div className="status">
              <p style={{ display: 'none' }}>streamId: {item.stream && item.stream.video && item.stream.video.id}</p>
            </div>

            <div className={`video-bg ${videoStatus.picture ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div>悬浮窗口显示中...</div>
                <div>
                  <Button type="link" onClick={switchPictureInPicture}>恢复</Button>
                </div>
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-bg ${videoStatus.audioOnly ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div className="displayname">{item.roster.displayName || ""}</div>
                <div>语音通话中</div>
              </div>
            </div>

            <div className={`video-bg ${videoStatus.mute ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                {
                  index === 0 ? <div>视频暂停</div> : <div>对方忙，暂时关闭视频</div>
                }
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-bg ${videoStatus.request ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div>视频请求中...</div>
              </div>
              {renderVideoName()}
            </div>

            <div className={`video-status video-animote ${videoStatus.normal ? 'video-show' : 'video-hidden'}`}>
              {
                !item.roster.isContent && <div className={item.roster.audioTxMute ? "audio-muted-status" : "audio-unmuted-status"}></div>
              }
              <div className="name">
                {`${item.roster.displayName || "Local"}`}
              </div>
            </div>

            {
              !operate.isDisabled && !item.roster.videoTxMute && !videoStatus.audioOnly && renderVideoOperate()
            }
          </div>
        </div>

        {
          item.stream.video && (
            <video
              ref={videoRef}
              style={videoStyle}
              autoPlay
              controls={false}
              playsInline
              id={videoId}
              muted={index === 0}
              onCanPlay={onLoadCanPlay}
              onLoadStart={onLoadStart}
              onError={() => {
                console.log(videoId + " onError");
              }}
              onEmptied={() => {
                console.log(videoId + " onEmptied");
              }}
              onLoadedMetadata={() => {
                console.log(videoId + " onLoadedMetadata");
              }}

            ></video>
          )
        }

      </div>
    </div >
  )
}

export default Video;