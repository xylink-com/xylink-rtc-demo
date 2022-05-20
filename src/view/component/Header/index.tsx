/**
 * 会议头部
 */
import React, { useEffect, useMemo, useState } from 'react';
import { IConferenceInfo } from '@xylink/xy-rtc-sdk';
import { Popover } from "antd";
import { ExclamationCircleOutlined } from '@ant-design/icons';
import SVG from '@/component/Svg';
import Timmer from '@/component/Timmer';
import './index.scss';

interface IProps {
  conferenceInfo: IConferenceInfo;
  onToggleSetting: () => void;
  switchDebug: () => void;
  stopMeeting: () => void;
}

const MeetingHeader = (props: IProps) => {
  const { conferenceInfo, onToggleSetting } = props;
  const { displayName, numberType, number } = conferenceInfo || {};
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

  const meetingContent = useMemo(() => {
    return <>
      <div
        className="upload-icon"
        onClick={() => {
          onToggleSetting();
          setInfoVisible(false);
        }}
      >
        <SVG icon="setting" />
      </div>
      <div className="meeting-popover-name" title={displayName}>
        {displayName}
      </div>
      <div className="meeting-popover-number">
        会议号：<span className="number">{number}</span>
      </div>
    </>
  }, [onToggleSetting, displayName, number]);

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

        {
          numberType === 'CONFERENCE' &&
          <Popover
            content={meetingContent}
            visible={infoVisible}
            onVisibleChange={setInfoVisible}
            placement="bottom"
            overlayClassName="meeting-popover"
            trigger="click"
          >
            <ExclamationCircleOutlined style={{ cursor: 'pointer' }} />
          </Popover>
        }
      </span>
    </div>
  );
};

export default MeetingHeader;
