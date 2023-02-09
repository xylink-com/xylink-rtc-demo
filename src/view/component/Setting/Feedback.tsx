import React, { useState } from 'react';
import { Button, message, Input } from 'antd';
import xyRTC from '@xylink/xy-rtc-sdk';
import store from '@/utils/store';

const { TextArea } = Input;

interface IProps {
  onClose?: () => void;
}

const Feedback = (props: IProps) => {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    setUploadLoading(true);
    try {
      const { meetingName = '' } = store.get('xy-user') || {};

      const result: any = await xyRTC.logger.uploadLog(meetingName, contact, content);

      if (result) {
        message.info('提交成功');

        setContent('');

        props.onClose && props.onClose();
      } else {
        message.info('提交失败');
      }

      setContact('');
    } catch (err) {
      message.info('提交失败');
    }

    setUploadLoading(false);
  };

  const download = async () => {
    setLoading(true);

    await xyRTC.logger.downloadLog();

    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="feedback">
      <div className="feedback__content">
        <div className="item">
          <div className="key">内容描述</div>
          <div className="value">
            <TextArea
              placeholder="请输入您的宝贵意见和建议"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="item feedback__content-contact">
          <div className="key">联系方式</div>
          <div className="value">
            <Input
              value={contact}
              className="feedback__content-input"
              placeholder="请输入您的联系方式"
              onChange={(e) => {
                setContact(e.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="feedback__footer">
        <div className="item">
          <div className="key">日志</div>
          <div className="value logSubmit">
            <Button className="download" type="text" onClick={download} loading={loading}>
              下载日志
            </Button>

            <Button
              className="upload-btn"
              loading={uploadLoading}
              onClick={upload}
              type="primary"
              disabled={!content.trim()}
            >
              {uploadLoading ? '提交中' : '提交'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
