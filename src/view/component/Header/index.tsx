/**
 * 会议头部
 */
import React, { useMemo, useRef, useState } from 'react';
import { IConferenceInfo, NetworkQualityLevel } from '@xylink/xy-rtc-sdk';
import { Popover, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import SVG from '@/component/Svg';
import Timmer from '@/component/Timmer';
import './index.scss';

interface IProps {
  conferenceInfo: IConferenceInfo;
  localNetworkLevel?: NetworkQualityLevel;
  onToggleSetting: () => void;
  switchDebug: () => void;
  stopMeeting: () => void;
}

const MeetingHeader = (props: IProps) => {
  const { conferenceInfo, localNetworkLevel = NetworkQualityLevel.Excellent, onToggleSetting } = props;
  const { displayName, numberType, number } = conferenceInfo || {};
  const [infoVisible, setInfoVisible] = useState(false);
  const [signalVisible, setSignalVisible] = useState(false);
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVisibleChange = (visible: boolean) => {
    setSignalVisible(visible);

    if (signalTimer.current) clearTimeout(signalTimer.current);

    if (visible) {
      signalTimer.current = setTimeout(() => {
        setSignalVisible(false);
      }, 5000);
    }
  };

  const signal = useMemo(() => {
    let title = localNetworkLevel < NetworkQualityLevel.Good ? '网络质量不佳' : '网络连接正常';
    const icon = `signal_${localNetworkLevel}`;

    return (
      <Tooltip
        overlayClassName="signal-tip"
        title={title}
        placement="bottomLeft"
        align={{ offset: [-10, -2] }}
        visible={signalVisible}
        onVisibleChange={handleVisibleChange}
      >
        <span className="meeting-stats-switch">
          <SVG icon={icon}></SVG>
        </span>
      </Tooltip>
    );
  }, [localNetworkLevel, signalVisible]);

  const meetingContent = useMemo(() => {
    return (
      <>
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
    );
  }, [onToggleSetting, displayName, number]);

  return (
    <div className="meeting-header">
      <span className="header-time" onClick={props.switchDebug}>
        {signal}
        <Timmer />
      </span>
      <span className="header-count">
        <span className="header-displayname">
          {displayName}
          {numberType !== 'CONFERENCE' && `(${number})`}
        </span>

        {numberType === 'CONFERENCE' && (
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
        )}
      </span>
    </div>
  );
};

export default MeetingHeader;
