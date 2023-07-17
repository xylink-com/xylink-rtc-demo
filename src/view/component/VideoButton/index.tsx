import React, { memo } from 'react';
import SVG from '@/component/Svg';

interface IProps {
  permission: any;
  video: string;
  videoOperate: () => void;
}


const VideoButton = (props: IProps) => {
  const { permission, video, videoOperate } = props;

  let videoClass = 'mute_camera';
  let svgIcon = 'camera';
  let svgType: 'default' | 'danger' = 'default';

  if (permission.camera === 'denied') {
    videoClass = 'button-warn mute_camera_error';
    svgIcon = 'mute_camera_error';
    svgType = 'danger';
  } else if (video === 'unmuteVideo') {
    videoClass = 'camera';
    svgIcon = 'camera';
  } else {
    videoClass = 'mute_camera';
    svgIcon = 'mute_camera';
    svgType = 'danger';
  }

  return (
    <div className={`button ${videoClass}`} onClick={videoOperate}>
      <SVG icon={svgIcon} type={svgType} />
      <div className="title">
        {video === 'unmuteVideo' ? '关闭摄像头' : '开启摄像头'}
      </div>
    </div>
  );
}

export default memo(VideoButton);