import React, { ReactElement, useState } from 'react';
import { Popover } from 'antd';
import { IDeviceInfo, DEVICE_KIND } from '@xylink/xy-rtc-sdk';
import { useDeviceList } from '@/store/device';
import './index.scss';

interface IProps {
  type: 'audio' | 'video';
  children: ReactElement;
  onSwitchDevice: (key: DEVICE_KIND, device: IDeviceInfo) => void;
  onToggleSetting: () => void;
}

const DeviceSelect = (props: IProps) => {
  const { children, type, onSwitchDevice, onToggleSetting } = props;
  const [visible, setVisible] = useState(false);

  // 设备列表
  const { audioInput, audioOutput, videoInput } = useDeviceList((state) => {
    return {
      audioInput: state.audioInput,
      audioOutput: state.audioOutput,
      videoInput: state.videoInput
    };
  });

  const content =
    type === 'audio' ? (
      <>
        <div className="select__item">
          <p>选择麦克风</p>
          <ul>
            {audioInput.length ? (
              audioInput.map((device: IDeviceInfo) => {
                const { isSelected, isDefault, label, key } = device;
                return (
                  <li
                    key={key}
                    className={`${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setVisible(false);
                      onSwitchDevice(DEVICE_KIND.AUDIOINPUT, device);
                    }}
                  >
                    {isDefault ? `系统默认-${label}` : label}
                  </li>
                );
              })
            ) : (
              <li className="unSelect_li">暂无设备可选</li>
            )}
          </ul>
          <div className="h-line" />
        </div>
        <div className="select__item">
          <p>选择扬声器</p>
          <ul>
            {audioOutput.length ? (
              audioOutput.map((device: IDeviceInfo) => {
                const { isSelected, isDefault, label, key } = device;
                return (
                  <li
                    key={key}
                    className={`${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setVisible(false);
                      onSwitchDevice(DEVICE_KIND.AUDIOOUTPUT, device);
                    }}
                  >
                    {isDefault ? `系统默认-${label}` : label}
                  </li>
                );
              })
            ) : (
              <li className="unSelect_li">暂无设备可选</li>
            )}
          </ul>
          <div className="h-line" />
        </div>
        <div
          className="select__operate"
          onClick={() => {
            setVisible(false);
            onToggleSetting();
          }}
        >
          音频选项
        </div>
      </>
    ) : (
      <>
        <div className="select__item">
          <p>选择摄像头</p>
          <ul>
            {videoInput.length ? (
              videoInput.map((device: IDeviceInfo) => {
                const { isSelected, isDefault, label, key } = device;

                return (
                  <li
                    key={key}
                    className={`${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setVisible(false);
                      onSwitchDevice(DEVICE_KIND.VIDEOINPUT, device);
                    }}
                  >
                    {isDefault ? `系统默认-${label}` : label}
                  </li>
                );
              })
            ) : (
              <li className="unSelect_li">暂无设备可选</li>
            )}
          </ul>
          <div className="h-line" />
        </div>
        <div
          className="select__operate"
          onClick={() => {
            setVisible(false);
            onToggleSetting();
          }}
        >
          视频选项
        </div>
      </>
    );

  return (
    <Popover
      content={content}
      visible={visible}
      onVisibleChange={setVisible}
      trigger="click"
      placement="top"
      overlayClassName="select-popover"
      align={{
        offset: [0, -7]
      }}
    >
      {children}
    </Popover>
  );
};

export default DeviceSelect;
