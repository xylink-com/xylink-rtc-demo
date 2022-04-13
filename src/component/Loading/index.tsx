/**
 * 会议呼叫页面
 */
import React, { memo, useEffect, useRef } from 'react';
import xyRTC, { IConferenceInfo } from '@xylink/xy-rtc-sdk';
import store from '@/utils/store';
import { DEFAULT_DEVICE } from '@/enum';
import SVG from '../Svg';
import './index.scss';

import ring from '@/assets/ring.wav';
import defaultAvatar from '@/assets/img/confernece.png';


interface IProps {
  callInfo: IConferenceInfo;
  stopMeeting: (isConfirm: boolean) => void;
}

const MeetingLoadding = (props: IProps) => {
  const { callInfo } = props;
  const bgmAudioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    (async () => {
      if (bgmAudioRef.current) {
        const devices = store.get('selectedDevice') || DEFAULT_DEVICE.nextDevice;

        xyRTC.setOutputAudioDevice(bgmAudioRef.current, devices?.audioOutput?.deviceId || 'default');

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
  }, []);

  return (
    <div className='loading'>
      <div className='loading-content'>
        <div className='avatar'>
          <img src={callInfo.avatar || defaultAvatar} alt="nemo-avatar" />
        </div>
        <div className='name'>
          <div className='calling'>正在呼叫</div>
          <div className='text'>{callInfo.displayName}</div>
        </div>
        <div
          className='stop'
          onClick={() => {
            props.stopMeeting(false);
          }}
        >
          <div className='stop-btn'>
            <SVG icon='hang_up' />
          </div>
        </div>
        <audio ref={bgmAudioRef} loop src={ring}></audio>

      </div>
    </div>
  );
};

export default memo(MeetingLoadding);
