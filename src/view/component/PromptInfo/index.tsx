import React from 'react';
import { IRoster, RecordStatus } from '@xylink/xy-rtc-sdk';
import Timmer from '@/component/Timmer';
import './index.scss';

import muteSpeakerIcon from '@/assets/img/icon/icon_mute_speak.svg';

interface IProps {
  forceLayoutId: string;
  chairman: boolean;
  isLocalShareContent: boolean;
  content: IRoster | null;
  localHide?: boolean;
  recordStatus: number;
  isMuteSpeaker: boolean;
  forceFullScreen: () => void;
}

const PromptInfo = (props: IProps) => {
  const {
    chairman,
    forceLayoutId,
    localHide = false,
    isLocalShareContent,
    content,
    recordStatus,
    isMuteSpeaker,
  } = props;

  const remoteRecordStatus = recordStatus === RecordStatus.REMOTE_STAR || recordStatus === RecordStatus.REMOTE_PAUSED;
  const remoteRecordContent = (
    <div className="remote-record-content">
      <span>云端录制</span>
      {recordStatus === RecordStatus.REMOTE_PAUSED ? '暂停中' : '录制中'}
    </div>
  );

  return (
    <div className={`meeting-prompt`}>
      {recordStatus === RecordStatus.LOCAL_START && (
        <div className="meeting-prompt-box">
          <Timmer children="云端录制" before />
        </div>
      )}

      {remoteRecordStatus && (
        <div className="meeting-prompt-box">
          <Timmer children={remoteRecordContent} before time={false} />
        </div>
      )}

      {forceLayoutId && (
        <div className="meeting-prompt-box">
          主屏已被锁定
          <span
            className="lock-btn"
            onClick={() => {
              props.forceFullScreen();
            }}
          >
            解锁
          </span>
        </div>
      )}
      {localHide && <div className="meeting-prompt-box">已开启隐藏本地画面模式</div>}
      {chairman && <div className="meeting-prompt-box">主会场模式</div>}
      {isMuteSpeaker && (
        <div className="meeting-prompt-box">
          <img className="icon-mute-speaker" src={muteSpeakerIcon} alt="" /> 您已被主持人禁止收听
        </div>
      )}
      {isLocalShareContent && <div className="meeting-prompt-box">本地共享中</div>}
      {content && (
        <div className="meeting-prompt-box">
          <span>{content.displayName}</span>
          正在共享
        </div>
      )}
    </div>
  );
};

export default PromptInfo;
