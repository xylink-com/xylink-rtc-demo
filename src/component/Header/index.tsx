/**
 * 会议头部
 */
import React, { useEffect, useState } from 'react';
import { IConferenceInfo } from '@xylink/xy-rtc-sdk';
import SVG from '../Svg';
import Timmer from '../Timmer';
import Info from '../Info';
import './index.scss';

interface IProps {
  callInfo: IConferenceInfo;
  onToggleSetting: () => void;
  switchDebug: () => void;
  stopMeeting: () => void;
}

const MeetingHeader = (props: IProps) => {
  const { callInfo } = props;
  const { displayName, numberType, number } = callInfo;
  const [onLine, setOnLine] = useState<'online' | 'offline'>('online'); // 网络状况
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    // 监听网络
    function updateOnlineStatus(event: any) {
      const condition = navigator.onLine ? 'online' : 'offline';
      setOnLine(condition);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div
      className='meeting-header'
    >
      <span className="header-time" onClick={props.switchDebug}>
        <SVG icon="signal" className={`meeting-stats-switch ${onLine}`} />
        <Timmer />
      </span>
      <span className="header-count">
        <span className="header-displayname">
          {displayName}
          {numberType !== 'CONFERENCE' && `(${number})`}
        </span>
        {numberType === 'CONFERENCE' && (
          <Info
            visible={infoVisible}
            setVisible={setInfoVisible}
            callInfo={callInfo}
            onToggleSetting={props.onToggleSetting}
          />
        )}
      </span>
    </div>
  );
};

export default MeetingHeader;
