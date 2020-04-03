/**
 * Video Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-03-03 20:18:50
 */


import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import './index.scss';

const Video: React.FC<any> = (props: any) => {
  const { item, index, isRefresh, model } = props;
  const id = item.roster.participantId;
  const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";

  const videoRef = useRef<any>(null);

  const [border, setBorder] = useState({});
  const [streamStatus, setStreamStatus] = useState('enabled');

  const timmer = useRef<any>(0);

  const onMute = () => {
    console.log("--------------mute");

    clearTimeer();

    timmer.current = setTimeout(() => {
      if (streamStatus !== 'enabled') {
        setStreamStatus('comming');
      }
    }, 1500);
  }

  const onUnmute = () => {
    console.log("--------------unmute");

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
    console.log(`-----${item.roster.displayName} on load start`);
    setStreamStatus('comming');
  }

  const onLoadCanPlay = () => {
    console.log(`-----${item.roster.displayName} on can play`);
    setStreamStatus('enabled');
  }

  const onLoadEnded = () => {
    console.log(`-----${item.roster.displayName} on load ended`);
  }

  const onLoadError = () => {
    console.log(`-----${item.roster.displayName} on load error`);
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

  let videoStyle = {};
  let videoSty = {};
  const positionStyle = item.positionStyle;
  const isShowLoading = (!item.stream.video || streamStatus === 'coming') && index >= 1;

  if (positionStyle && positionStyle.width) {
    videoStyle = positionStyle;
  }

  if (index > 0) {
    videoSty = item.rotate;
  } else {
    videoSty = {
      ...item.rotate,
      transform: 'rotateY(180deg)'
    };
  }

  const renderVideoStatus = () => {
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