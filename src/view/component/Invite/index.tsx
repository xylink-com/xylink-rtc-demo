/**
 * 会中底部 "邀请" 按钮
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import { Button, message, Modal } from 'antd';
import ClipboardJS from 'clipboard';
import { Base64 } from 'js-base64';
import closeIcon from '@/assets/img/icon/close.svg';
import { InviteInfo } from '@xylink/xy-rtc-sdk';
import SVG from '@/component/Svg';
import './index.scss';

let clipboard: any;

interface IProps {
  inviteInfo?: InviteInfo;
  participantVisible?: boolean;
}

const Invite = (props: IProps) => {
  const { inviteInfo, participantVisible } = props;
  const [inviteVisible, setInviteVisible] = useState(false);
  const { shareUrl = '', password = '', number = '', linkNumber = '', userName = '' } = inviteInfo || {};
  const trsPassword = password ? Base64.decode(password) : '';

  const toggleInvite = useCallback(() => {
    setInviteVisible((visible) => !visible);
  }, [setInviteVisible]);

  const getCopyText = () => {
    const topicTitle = userName + '邀请您参加视频会议';

    const t1 = '入会链接: ';
    const con1 = shareUrl;

    const t2 = '软件客户端和硬件终端入会: ';
    const con2_1 = '会议号: ' + number;
    const con2_2 = trsPassword ? '\n会议密码: ' + trsPassword : '';

    const t3 = '手机一键拨号入会:';
    const con3 = linkNumber;

    const phoneContentStr = t3 + '\n' + con3 + '\n';

    let contentStr =
      '' +
      topicTitle +
      '\n' +
      '\n' +
      t1 +
      '\n' +
      con1 +
      '\n' +
      '\n' +
      t2 +
      '\n' +
      con2_1 +
      con2_2 +
      '\n' +
      '\n' +
      phoneContentStr;

    return contentStr;
  };

  const handleCancel = () => {
    setInviteVisible(false);
  };

  const handleOk = () => {
    setInviteVisible(false);
  };

  useEffect(() => {
    if (inviteVisible) {
      clipboard = new ClipboardJS('#copyBtn');
      clipboard.on('success', () => {
        message.success('已复制到剪贴板', 2);
      });

      return () => {
        clipboard && clipboard.destroy();
      };
    }
  }, [inviteVisible]);

  const footer = (
    <Button type="primary" className="footerBtn" id="copyBtn" data-clipboard-text={getCopyText()}>
      复制邀请文本
    </Button>
  );
  const close = <img className="close" src={closeIcon} alt=""></img>;
  return (
    <>
      <div className="button invite" onClick={toggleInvite}>
        <div className="layout">
          <SVG icon="invite" />
          <div className="title">邀请</div>
        </div>
      </div>

      {inviteVisible && (
        <Modal
          title={'邀请链接'}
          className="modal"
          closeIcon={close}
          visible={inviteVisible}
          onCancel={handleCancel}
          onOk={handleOk}
          centered
          maskClosable={false}
          width={420}
          footer={footer}
          style={participantVisible ? { left: -120 } : { left: 0 }}
        >
          <div className="shareContent">
            <div className="mainTitle">
              <span>{userName} 邀请您参加视频会议</span>
            </div>

            <div className="contentList">
              <p className="title">入会链接： </p>
              <div className="contentItem">
                <span className="link">{shareUrl}</span>
                {shareUrl && (
                  <div id="copyBtn" className="copyIcon" data-clipboard-text={shareUrl}>
                    <SVG icon="copy"></SVG>
                  </div>
                )}
              </div>
            </div>

            <div className=" contentList">
              <p className="title">软件客户端和硬件终端入会： </p>
              <div className="contentItem">
                <span>会议号： {number}</span>
                {number && (
                  <div id="copyBtn" className="copyIcon" data-clipboard-text={number}>
                    <SVG icon="copy"></SVG>
                  </div>
                )}
              </div>
              {trsPassword && <div className="contentItem">会议密码： {trsPassword}</div>}
            </div>

            <div className="contentList ">
              <p className="title">手机一键拨号入会： </p>
              <div className="contentItem">
                <span className="link">{linkNumber}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default memo(Invite);
