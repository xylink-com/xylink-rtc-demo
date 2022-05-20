import React, { useState } from 'react';
import { Menu, Modal } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import Device from './Device';
import Feedback from './Feedback';
import Version from './Version';
import Common from './Common';
import { ISetting, TSettingType } from '@/type/index';
import {
  SettingOutlined,
  VideoCameraOutlined,
  FormOutlined,
  BulbOutlined
} from '@ant-design/icons';
import store from '@/utils/store';
import './style/index.scss';
import { SETTING_KEYS } from '@/enum';

interface IProps {
  isInMeeting: boolean;
  visible: boolean;
  setting?: ISetting;
  onCancel: () => void;
  onSetting?: (data: ISetting) => void;
}

const Setting = (props: IProps) => {
  const { isInMeeting = false, visible = false, setting, onCancel, onSetting } = props;
  const { localHide = false, layoutMode = 'AUTO', isThird = false } = setting || {};
  const [current, setCurrent] = useState<TSettingType>('common');

  const onHandleSetting = (data: ISetting) => {
    const values: Record<string, any> = {};

    SETTING_KEYS.forEach((key) => {
      if (data.hasOwnProperty(key)) {
        if (key === 'selectedDevice') {
          store.set('selectedDevice', data.selectedDevice);

          onCancel();
        } else {
          values[key] = data[key];
        }
      }
    });

    onSetting && onSetting(data);
  };

  return (
    <Modal
      title='设置'
      wrapClassName="xy__setting-modal"
      maskClosable={false}
      closable={false}
      visible={visible}
      footer={null}
      width={720}
      onCancel={() => {
        onCancel();
      }}
    >
      <div className="setting__container">
        <div
          className="close"
          onClick={() => {
            onCancel();
          }}
        >
          <span className="close-icon" />
        </div>
        <div className="setting__header">
          <Menu
            style={{ width: 200 }}
            selectedKeys={[current]}
            mode="vertical"
            onClick={(e: MenuInfo) => {
              setCurrent(e.key as TSettingType);
            }}
          >
            <Menu.Item key="common" icon={<SettingOutlined />}>
              常规
            </Menu.Item>
            <Menu.Item key="device" icon={<VideoCameraOutlined />}>
              设备
            </Menu.Item>
            <Menu.Item key="feedback" icon={<FormOutlined />}>
              反馈
            </Menu.Item>
            <Menu.Item key="about" icon={<BulbOutlined />}>
              关于
            </Menu.Item>
          </Menu>
        </div>

        <div className="setting__content">
          {current === 'common' && (
            <Common
              isInMeeting={isInMeeting}
              isThird={isThird}
              localHide={localHide}
              layoutMode={layoutMode}
              onSetting={onHandleSetting}
            />
          )}

          {
            current === 'device' &&
            <Device setting={setting} onSetting={onHandleSetting} current={current} />
          }

          {current === 'feedback' && <Feedback />}
          {current === 'about' && <Version />}
        </div>
      </div>
    </Modal>
  );
};

export default Setting;
