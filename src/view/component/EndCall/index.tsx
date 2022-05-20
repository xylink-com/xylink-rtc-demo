import React, { useState } from 'react';
import { Popover } from 'antd';
import SVG from '@/component/Svg';
import './index.scss';

interface IProps {
  stopMeeting: () => void;
}

const EndCall = (props: IProps) => {
  const { stopMeeting } = props;
  const [visible, setVisible] = useState(false);

  const endCallContent = (
    <div className="xy-btn-box">
      <div
        className="xy-btn xy-end-btn"
        onClick={() => {
          stopMeeting();
        }}
      >
        离开会议
      </div>
      <div
        className="xy-btn xy-cancel-btn"
        onClick={() => {
          setVisible(false);
        }}
      >
        取消
      </div>
    </div>
  );

  return (
    <Popover
      content={endCallContent}
      visible={visible}
      onVisibleChange={setVisible}
      placement="top"
      trigger="click"
      overlayClassName="xy-popover"
      align={{
        offset: [0, 2]
      }}
    >
      <div className="button button-warn end-call">
        <SVG icon="end_call" type="danger" />
        <div className="title">挂断</div>
      </div>
    </Popover>
  );
};

export default EndCall as any;
