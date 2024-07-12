import React, { memo } from 'react';
import { IDeviceInfo, DEVICE_KIND } from '@xylink/xy-rtc-sdk';
import SVG from '@/component/Svg';
import DebounceButton from '@/component/DebounceButton';
import DeviceSelect from '../DeviceSelect';

interface IProps {
  video: string;
  onSwitchDevice: (key: DEVICE_KIND, device: IDeviceInfo) => void;
  onToggleSetting: () => void;
  videoOperate: () => void;
}

const VideoButton = (props: IProps) => {
  const { video, videoOperate, onSwitchDevice, onToggleSetting } = props;

  let videoClass = 'button-warn mute_camera';
  let svgIcon = 'camera';
  let svgType: 'default' | 'danger' = 'default';

  if (video === 'unmuteVideo') {
    videoClass = 'camera';
    svgIcon = 'camera';
  } else {
    videoClass = 'button-warn mute_camera';
    svgIcon = 'mute_camera';
    svgType = 'danger';
  }

  return (
    <div className="button-box">
      <DebounceButton className={`button ${videoClass}`} onClick={videoOperate}>
        <SVG icon={svgIcon} type={svgType} />
        <div className="title">{video === 'unmuteVideo' ? '关闭摄像头' : '开启摄像头'}</div>
      </DebounceButton>
      <DeviceSelect type="video" onSwitchDevice={onSwitchDevice} onToggleSetting={onToggleSetting}>
        <div className="arrow">
          <SVG icon="arrow" />
        </div>
      </DeviceSelect>
    </div>
  );
};

export default memo(VideoButton);
