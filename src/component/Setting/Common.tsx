/**
 * 通用设置
 */
import React from 'react';
import { Select, Switch } from 'antd';
import { ILayoutMode, ISetting } from '@/type';
import { LAYOUT_MODE_LIST, LAYOUT_MODE_MAP } from '@/enum';

interface IProp {
  isThird: boolean;
  layoutMode: ILayoutMode;
  localHide: boolean;
  isInMeeting: boolean;
  onSetting: (data: ISetting) => void;
}

const { Option } = Select;

const Common = ({ layoutMode, isThird, localHide, isInMeeting, onSetting }: IProp) => {

  return (
    <div className="setting__content-common">

      {
        !isInMeeting && <>
          <div className="item">
            <div className="key">布局模式</div>
            <div className="value">
              <Select defaultValue={layoutMode} onChange={(value: ILayoutMode) => {
                onSetting({
                  layoutMode: value
                });
              }}>
                {
                  LAYOUT_MODE_LIST.map((key) => {
                    return <Option key={key} value={key}>
                      {LAYOUT_MODE_MAP[key]}
                    </Option>
                  })
                }
              </Select>
            </div>
          </div>

          <div className="item">
            <div className="key">登录方式</div>
            <div className="value">
              <Select defaultValue={isThird ? 1 : 0} onChange={(value: number) => {
                onSetting({
                  isThird: !!value
                });
              }}>
                <Option key='xy' value={0}>
                  小鱼账号登录
                </Option>
                <Option key='third' value={1}>
                  第三方账号登录
                </Option>
              </Select>
            </div>
          </div>
        </>
      }

      <div className="item">
        <div className="key">隐藏本地画面</div>
        <div className="value">
          <Switch defaultChecked={localHide} onChange={(value) => {
            onSetting({
              localHide: value
            });
          }} />
        </div>
      </div>
    </div>
  );
};

export default Common;
