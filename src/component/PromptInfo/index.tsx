import React from 'react';
import { IRoster } from '@xylink/xy-rtc-sdk';

import './index.scss';

interface IProps {
  forceLayoutId: string;
  chairman: any;
  localHide: boolean;
  isLocalShareContent: boolean;
  content: IRoster | null;
}

const PromptInfo = (props: IProps) => {
  const { chairman, forceLayoutId, localHide, isLocalShareContent, content } = props;

  return (
    <div className={`meeting-prompt`}>
      {/* <div className="meeting-prompt-box"> */}
      {forceLayoutId && (
        <div className="meeting-prompt-box">
          主屏已被锁定
          <span
            className="lock-btn"
            onClick={() => {
            }}
          >
            解锁
          </span>
        </div>
      )}
      {localHide && <div className="meeting-prompt-box">已开启隐藏本地画面模式</div>}

      {chairman.hasChairman && <div className="meeting-prompt-box">主会场模式</div>}
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
