/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AutoState, Client, ILayout, NetworkQualityLevel } from '@xylink/xy-rtc-sdk';
import { Tooltip } from 'antd';
import SVG from '@/component/Svg';
import './index.scss';
import useDoubleClick from '@/hook/useDoubleClick';

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
  const { item, model, client, forceLayoutId, networkLevel = NetworkQualityLevel.Excellent } = props;
  const { state, roster, templateConfig, pollingState = '', pollingName, id } = item || {};
  const {
    isActiveSpeaker,
    displayName = '',
    audioTxMute = false,
    isContent = false,
    isLocal = false,
    isFocusScreen = false,
  } = roster || {};

  const { isPIP = false } = templateConfig || {};
  const wrapVideoId = 'wrap-' + id;

  const [border, setBorder] = useState({});

  const videoWrapRef = useRef<any>(null);

  const isFullScreen = forceLayoutId === id;

  useEffect(() => {
    client.setVideoRenderer(id, wrapVideoId);
  }, [client, id, wrapVideoId]);

  useEffect(() => {
    let borderStyle = model === 'GALLERY' && isActiveSpeaker ? '2px solid #1483eb' : 'none';

    setBorder({ border: borderStyle });
  }, [model, isActiveSpeaker]);

  const renderVideoName = () => {
    return (
      <div className="video-status">
        {!isContent && <div className={audioTxMute ? 'audio-muted-status' : 'audio-unmuted-status'}></div>}
        {networkLevel < NetworkQualityLevel.Good && (
          <Tooltip overlayClassName="signal-tip" title="网络质量不佳" placement="topLeft" align={{ offset: [-10, 0] }}>
            <div className="video-signal">
              <SVG icon={`signal_${networkLevel}`}></SVG>
            </div>
          </Tooltip>
        )}
        <div className="name">{`${displayName || 'Local'}`}</div>

        {isFocusScreen && (
          <Tooltip overlayClassName="signal-tip" title="焦点画面模式" placement="topLeft" align={{ offset: [-10, 0] }}>
            <SVG icon="focus" className="focus-icon"></SVG>
          </Tooltip>
        )}
      </div>
    );
  };

  // 点击视频，双击：forceLayout; 点击：切换主画面
  const handleDoubleClick = useDoubleClick(async () => {
    const forceFullScreenId = isFullScreen ? '' : id;

    await client.forceFullScreen(forceFullScreenId);
  });

  const onClickVideo = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (isPIP) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }

    handleDoubleClick();
  };

  const pollingStateText = useMemo(() => {
    const { NOT_FOUND, NO_JOINED } = AutoState;
    const stateMapText: any = {
      [NOT_FOUND]: '未发现可用终端',
      [NO_JOINED]: `${pollingName} 未入会`,
    };
    let stateText = '';

    if (pollingState) {
      stateText = stateMapText[pollingState] || '';
    }

    return stateText;
  }, [pollingState, pollingName]);

  const render = () => {
    if (pollingState === AutoState.NULL) {
      return null;
    }

    return (
      <div
        className={`wrap-video ${isPIP ? 'video-small' : ''}`}
        style={item.positionStyle}
        ref={videoWrapRef}
        id={wrapVideoId}
        onClick={onClickVideo}
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
                  {isFullScreen && <div className="displayname">{displayName || ''}</div>}

                  <div>{isLocal ? '视频暂停' : '对方忙，暂时关闭视频'}</div>
                </div>
              </div>

              <div className={`video-bg ${state === 'REQUEST' || pollingStateText ? 'video-show' : 'video-hidden'}`}>
                <div className="center">
                  <div>{pollingStateText ? pollingStateText : '视频请求中...'}</div>
                </div>
              </div>

              {/* 左下角：终端名称 */}
              {!pollingStateText && renderVideoName()}
            </div>
          </div>

          <video style={item.rotate}></video>
        </div>
      </div>
    );
  };

  return <>{render()}</>;
};

export default Video;
