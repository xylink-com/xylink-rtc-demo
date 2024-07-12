/**
 * 会议呼叫页面
 */
import React, { memo, useEffect, useRef } from 'react';
import { IConferenceInfo, setOutputAudioDevice } from '@xylink/xy-rtc-sdk';
import SVG from '@/component/Svg';
import './index.scss';

import ring from '@/assets/ring.wav';
import defaultAvatar from '@/assets/img/confernece.png';
import { useSpecifiedDevice } from '@/store/device';

interface IProps {
  conferenceInfo: IConferenceInfo;
  stopMeeting: (isConfirm: boolean) => void;
}

const MeetingLoading = (props: IProps) => {
  const { conferenceInfo } = props;
  const bgmAudioRef = useRef<HTMLAudioElement>(null);
  const specifiedDevice = useSpecifiedDevice((state) => state.specifiedDevice);

  useEffect(() => {
    (async () => {
      if (bgmAudioRef.current) {
        const { deviceId = '' } = specifiedDevice.audioOutput || {};

        setOutputAudioDevice(bgmAudioRef.current, deviceId || 'default');

        if (bgmAudioRef.current.paused) {
          try {
            await bgmAudioRef.current.play();
          } catch (error) {
            console.log('bgmAudio play error:', error);
          }
        }
      }
    })();

    return () => {
      bgmAudioRef?.current?.pause();
    };
  }, [specifiedDevice.audioOutput]);

  return (
    <div className="loading">
      <div className="loading-content">
        <div className="avatar">
          <img src={conferenceInfo.avatar || defaultAvatar} alt="nemo-avatar" />
        </div>
        <div className="name">
          <div className="calling">正在呼叫</div>
          <div className="text">{conferenceInfo.displayName}</div>
        </div>
        <div
          className="stop"
          onClick={() => {
            props.stopMeeting(false);
          }}
        >
          <div className="stop-btn">
            <SVG icon="hang_up" />
          </div>
        </div>
        <audio ref={bgmAudioRef} loop src={ring}></audio>
      </div>
    </div>
  );
};

export default memo(MeetingLoading);
