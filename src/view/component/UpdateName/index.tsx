/**
 * 会控改名
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptModel from '../PromptModel';
import { Input, message } from 'antd';
import { XYRTCClient } from '@xylink/xy-rtc-sdk';

interface IProps {
  client: XYRTCClient | null;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const UpdateName = (props: IProps) => {
  const { visible = false, setVisible, client } = props;
  const [newName, setNewName] = useState('');
  const inputRef = useRef<Input | null>(null);

  useEffect(() => {
    const selfRoster = client?.getSelfRoster();
    const { displayName = '' } = selfRoster || {};

    setNewName(displayName);

    inputRef.current?.focus();
  }, [client]);

  const onChange = useCallback((e: any) => {
    let value = e.target.value;
    setNewName(value);
  }, []);

  const content = useMemo(() => {
    return (
      <>
        <Input value={newName} placeholder="修改本地名称" ref={inputRef} onChange={onChange} />
      </>
    );
  }, [newName, onChange]);

  const rename = async () => {
    try {
      await props.client?.rename(newName!);

      setVisible(false);
    } catch (err: any) {
      let { code, msg } = err;

      if (code !== 'XYSDK:950120') {
        message.info(msg || '操作失败');
      }
    }
  };

  return (
    <PromptModel
      open={visible}
      title="改名"
      content={content}
      okText="确定"
      closeText="取消"
      onCancel={() => {
        setVisible(false);
      }}
      onOK={rename}
    ></PromptModel>
  );
};

export default UpdateName;
