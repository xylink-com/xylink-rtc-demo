/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useRef, useEffect, useState } from 'react';
import { Client, ILayout, NetworkQualityLevel } from '@xylink/xy-rtc-sdk';
import { Tooltip } from 'antd';
import SVG from '@/component/Svg';
import './index.scss';

interface IProps {
  // roster数据
  item: ILayout;
  // 桌面布局模式，语音激励和画廊模式
  model: string;
  // pid: endpointed + mediagroupId
  id: string;
  client: Client;
  forceLayoutId: string;
  networkLevel?: number;
}

const Video: React.FC<IProps> = (props) => {
  const { item, model, id, client, forceLayoutId, networkLevel = NetworkQualityLevel.Excellent } = props;
  const state = item.state;
  const wrapVideoId = 'wrap-' + id;

  const [border, setBorder] = useState({});

  const videoWrapRef = useRef<any>(null);

  const isFullScreen = forceLayoutId === item.roster.id;

  useEffect(() => {
    client.setVideoRenderer(id, wrapVideoId);
  }, [client, id, wrapVideoId]);

  useEffect(() => {
    let borderStyle = model === 'GALLERY' && item.roster.isActiveSpeaker ? '2px solid #1483eb' : 'none';

    setBorder({ border: borderStyle });
  }, [model, item.roster.isActiveSpeaker]);

  const toggleFullScreen = async () => {
    const forceFullScreenId = isFullScreen ? '' : item.roster.id;

    await client.forceFullScreen(forceFullScreenId);
  };

  const renderVideoName = () => {
    return (
      <div className="video-status">
        {!item.roster.isContent && (
          <div className={item.roster.audioTxMute ? 'audio-muted-status' : 'audio-unmuted-status'}></div>
        )}
        {networkLevel < NetworkQualityLevel.Good && (
          <Tooltip overlayClassName="signal-tip" title="网络质量不佳" placement="topLeft" align={{ offset: [-10, 0] }}>
            <div className="video-signal">
              <SVG icon={`signal_${networkLevel}`}></SVG>
            </div>
          </Tooltip>
        )}
        <div className="name">{`${item.roster.displayName || 'Local'}`}</div>
      </div>
    );
  };

  return (
    <div
      className="wrap-video"
      style={item.positionStyle}
      ref={videoWrapRef}
      id={wrapVideoId}
      onDoubleClick={toggleFullScreen}
    >
      <div className="video">
        <div className="video-content" style={border}>
          <div className="video-model">
            <div
              className={`video-bg ${
                state === 'AUDIO_TEL' || state === 'AUDIO_CONTENT' || state === 'AUDIO_ONLY'
                  ? 'video-show'
                  : 'video-hidden'
              }`}
            >
              <div className="center">
                <div>语音通话中</div>
              </div>
            </div>

            <div className={`video-bg ${state === 'MUTE' || state === 'INVALID' ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                {isFullScreen && <div className="displayname">{item.roster.displayName || ''}</div>}

                <div>{item.roster.isLocal ? '视频暂停' : '对方忙，暂时关闭视频'}</div>
              </div>
            </div>

            <div className={`video-bg ${state === 'REQUEST' ? 'video-show' : 'video-hidden'}`}>
              <div className="center">
                <div>视频请求中...</div>
              </div>
            </div>

            {/* 左下角：终端名称 */}
            {renderVideoName()}
          </div>
        </div>

        <video style={item.rotate}></video>
      </div>
    </div>
  );
};

export default Video;
