/**
 * 通用设置
 */
import React from 'react';
import { Select } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import {  ISetting } from '@/type';
import { LAYOUT_MODE_LIST, LAYOUT_MODE_MAP } from '@/enum';
import Operate from './components/operate';
import { LayoutMode } from '@xylink/xy-rtc-sdk';

interface IProp {
  isThird: boolean;
  layoutMode: LayoutMode;
  localHide: boolean;
  isInMeeting: boolean;
  speakerName: boolean;
  isLowResolution: boolean;
  onSetting: (data: ISetting) => void;
}

const { Option } = Select;

const Common = ({ layoutMode, isThird, localHide, isInMeeting, speakerName, isLowResolution, onSetting }: IProp) => {
  const onChangeOperate = (key: string, e: CheckboxChangeEvent) => {
    onSetting({
      [key]: e.target.checked,
    });
  };

  return (
    <div className="setting__content-common">
      {!isInMeeting && (
        <>
          <div className="item">
            <div className="key">布局模式</div>
            <div className="value">
              <Select
                defaultValue={layoutMode}
                onChange={(value: LayoutMode) => {
                  onSetting({
                    layoutMode: value,
                  });
                }}
              >
                {LAYOUT_MODE_LIST.map((key) => {
                  return (
                    <Option key={key} value={key}>
                      {LAYOUT_MODE_MAP[key]}
                    </Option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div className="item">
            <div className="key">登录方式</div>
            <div className="value">
              <Select
                defaultValue={isThird ? 1 : 0}
                onChange={(value: number) => {
                  onSetting({
                    isThird: !!value,
                  });
                }}
              >
                <Option key="xy" value={0}>
                  小鱼账号登录
                </Option>
                <Option key="third" value={1}>
                  第三方账号登录
                </Option>
              </Select>
            </div>
          </div>
        </>
      )}
      {/* 隐藏本地画面 */}
      <Operate type="localHide" defaultValue={localHide} onChangeEvent={onChangeOperate} title="隐藏本地画面" />
      {/*显示正在讲话者名称 */}
      <Operate
        type="speakerName"
        defaultValue={speakerName}
        onChangeEvent={onChangeOperate}
        title="显示正在讲话者名称"
      />
      {/*是否开启低性能模式 */}
      <Operate
        type="isLowResolution"
        defaultValue={isLowResolution}
        disabled={isInMeeting}
        onChangeEvent={onChangeOperate}
        title="流畅模式"
      />
    </div>
  );
};

export default Common;
