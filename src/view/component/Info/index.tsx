import React from 'react';
import { IConferenceInfo } from '@xylink/xy-rtc-sdk';
import { Popover } from 'antd';
import SVG from '@/component/Svg';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './index.scss';

interface IProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  conferenceInfo: IConferenceInfo;
  onToggleSetting: () => void;
}

function MeetingInfo(props: IProps) {
  const { conferenceInfo, visible, setVisible, onToggleSetting } = props;
  const { displayName, number } = conferenceInfo;

  const meetingContent = (
    <>
      <div
        className="upload-icon"
        onClick={() => {
          onToggleSetting();
          setVisible(false);
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

  return (
    <Popover
      content={meetingContent}
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottom"
      overlayClassName="meeting-popover"
      trigger="click"
    >
      <ExclamationCircleOutlined style={{ cursor: 'pointer' }} />
    </Popover>
  );
}
export default MeetingInfo;
