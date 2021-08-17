/**
 * 等候室、被设置onhold
 */
import React from 'react';
import { ICallInfo } from "../../type";
import './index.scss';

interface IProps {
  callInfo: ICallInfo;
  stopMeeting: (isConfirm: boolean) => void;
}

const Hold = (props: IProps) => {
  const { callInfo } = props;

  return (
    <div className="hold">
      <div className="hold-content">
        <p className="hold-title">请稍等，主持人稍后邀请您入会</p>

        <p className="hold-conference-title">会议主题</p>
        <p className="hold-conference">{callInfo.displayName}</p>

        <div className="hold-level-meeting">
          <span
            onClick={() => {
              props.stopMeeting(false);
            }}
          >
            离开会议
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hold;
