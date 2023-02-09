import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Modal, Button } from 'antd';
import './index.scss';

interface IProps {
  open: boolean;
  content: ReactNode | string;
  type?: string;
  okText?: string;
  closeText?: string;
  timer?: number;
  onCancel: () => void;
  onOK: () => void;
}

const PromptModel = (props: IProps) => {
  const { open, content, closeText = '', okText = '', timer = 0, onCancel, onOK } = props;

  const [countDown, setCountDown] = useState(timer);
  const timerRef = useRef<NodeJS.Timeout | null>();
  let countDownRef = timer;

  useEffect(() => {
    if (timer > 0 && open) {
      timerRef.current = setInterval(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        countDownRef = countDownRef - 1;

        if (countDownRef <= 0) {
          onCancel();
          clearTimer();
        } else {
          setCountDown(countDownRef);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer, open]);

  const clearTimer = () => {
    timerRef.current && clearInterval(timerRef.current);

    setCountDown(timer);
  };

  const handleOk = () => {
    onOK();
    clearTimer();
  };

  const handleCancel = () => {
    onCancel();
    clearTimer();
  };

  return (
    <Modal
      wrapClassName="xy-vm-model"
      width={420}
      visible={open}
      centered={true}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div className="vm-header">
        <div className="wrap-close-icon" onClick={handleCancel}>
          <div className="close-mock" />
        </div>
      </div>

      <div className="vm-content">{content}</div>

      <div className="vm-footer">
        <Button type="default" className="close" onClick={handleCancel}>
          {closeText}
          {timer > 0 && `（${countDown}s）`}
        </Button>
        <Button type="primary" onClick={handleOk}>
          {okText}
        </Button>
      </div>
    </Modal>
  );
};

export default PromptModel;
