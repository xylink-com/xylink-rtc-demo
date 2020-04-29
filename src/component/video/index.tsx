import React, { useLayoutEffect, useRef, useEffect, useState, useCallback } from 'react';
import { MoreOutlined, FullscreenOutlined, BlockOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Menu, Dropdown, Button } from 'antd';
import './index.scss';

const Video: React.FC<any> = (props: any) => {
  const { item, index, isRefresh, model } = props;
  const id = item.roster.participantId;
  const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";

  const videoRef = useRef<any>(null);

  const [border, setBorder] = useState({});
  const [streamStatus, setStreamStatus] = useState('enabled');

  const [operate, setOperate] = useState({
    isFullScreen: false,
    isPicture: false,
    isDisabled: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  });

  const timmer = useRef<any>(0);

  const onMute = () => {
    clearTimeer();

    timmer.current = setTimeout(() => {
      if (streamStatus !== 'enabled') {
        setStreamStatus('comming');
      }
    }, 1500);
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
    const id = item.roster.participantId;
    const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";

    const videoEle: any = document.getElementById(id + streamId);

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
      const id = item.roster.participantId;
      const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";

      const videoEle: any = document.getElementById(id + streamId);

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
    const video = id + streamId;
    const videoDom = document.getElementById(video);

    if (video) {
      if (operate.isPicture) {
        // @ts-ignore
        document.exitPictureInPicture()
      } else {
        // @ts-ignore
        videoDom && videoDom.requestPictureInPicture();
      }
    }
  }

  const renderVideoMenu = useCallback(
    () => {
      return (
        <Menu>
          <Menu.Item onClick={() => {
            const doc = window.document;
            const docEl = videoRef.current;

            // @ts-ignore
            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            // @ts-ignore
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

            // @ts-ignore
            if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
              requestFullScreen.call(docEl);

              setOperate({
                ...operate,
                isFullScreen: true
              })
            }
            else {
              cancelFullScreen.call(doc);

              setOperate({
                ...operate,
                isFullScreen: false
              })
            }
          }}>
            {operate.isFullScreen ?
              (
                <><FullscreenExitOutlined />切换显示</>
              ) :
              (
                <><FullscreenOutlined />切换显示</>
              )
            }
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

  const renderVideoStatus = () => {
    if (operate.isPicture) {
      return (
        <div className="video-bg">
          {
            item.roster.audioTxMute && <div className="audio-muted-status"></div>
          }

          <div className="center">
            <div className="displayname">{item.roster.displayName || "Local"}</div>
            <div>画中画显示中...</div>
            <div>
              <Button type="link" onClick={switchPictureInPicture}>恢复</Button>
            </div>
          </div>
        </div>
      )
    }

    if (item.roster.isContent) {
      return null;
    }

    if (item.roster.videoTxMute) {
      return (
        <div className="video-bg">
          {
            item.roster.audioTxMute && <div className="audio-muted-status"></div>
          }

          <div className="center">
            <div className="displayname">{item.roster.displayName || "Local"}</div>
            <div>视频暂停</div>
          </div>
        </div>
      )
    }

    if (isShowLoading) {
      return (
        <div className="video-bg">
          {
            item.roster.audioTxMute && <div className="audio-muted-status"></div>
          }

          <div className="center">
            <div className="displayname">{item.roster.displayName || "Local"}</div>
            <div>视频请求中...</div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="name">
          {
            `${item.roster.displayName || "Local"}`
          }
        </div>

        {
          item.roster.audioTxMute && <div className="audio-muted-status"></div>
        }
      </div>
    )
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
              !operate.isDisabled && renderVideoOperate()
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
              id={id + streamId}
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