import { IDeviceInfo, DEVICE_KIND, VideoAudioTrack } from '@xylink/xy-rtc-sdk';
import React, { memo } from 'react';
import DebounceButton from '@/component/DebounceButton';
import MicLevel from '../MicLevel';
import DeviceSelect from '../DeviceSelect';
import SVG from '@/component/Svg';

interface IProps {
  track: VideoAudioTrack | null;
  audio: string;
  disableAudio: boolean;
  handStatus: boolean;
  onSwitchDevice: (key: DEVICE_KIND, deviceId: IDeviceInfo) => void;
  onToggleSetting: () => void;
  audioOperate: () => void;
}

const AudioButton = (props: IProps) => {
  const { track, audio, disableAudio, handStatus, onSwitchDevice, onToggleSetting, audioOperate } = props;

  let audioClass = 'button-warn mute_mic';
  let audioStatus = '取消静音';
  let svgIcon = 'mic_null';
  let svgType: 'default' | 'danger' = 'default';

  if (audio === 'muteAudio' && !disableAudio) {
    audioClass = 'button-warn mute_mic';
    svgIcon = 'cancel_mic_mute';
    svgType = 'danger';
  }

  if (audio === 'unmuteAudio' && !disableAudio) {
    audioStatus = '静音';
    audioClass = 'mic_aec';
  }

  if (audio === 'muteAudio' && disableAudio && !handStatus) {
    audioStatus = '举手发言';
    audioClass = 'hand_up';
    svgIcon = 'hand_up';
  }

  if (audio === 'muteAudio' && disableAudio && handStatus) {
    audioStatus = '取消举手';
    audioClass = 'hand_down';
    svgIcon = 'hand_down';
  }

  if (audio === 'unmuteAudio' && disableAudio) {
    audioStatus = '结束举手';
    audioClass = 'hand_end';
    svgIcon = 'hand_end';
  }

  return (
    <div className="button-box">
      <DebounceButton onClick={audioOperate} className={`button ${audioClass}`}>
        <div className="mic-icon">
          {!disableAudio && <MicLevel videoAudioTrack={track} audio={audio as 'muteAudio' | 'unmuteAudio'} />}
          <SVG icon={svgIcon} type={svgType} />
        </div>
        <div className="title">{audioStatus}</div>
      </DebounceButton>
      <DeviceSelect type="audio" onSwitchDevice={onSwitchDevice} onToggleSetting={onToggleSetting}>
        <div className="arrow">
          <SVG icon="arrow" />
        </div>
      </DeviceSelect>
    </div>
  );
};

export default memo(AudioButton);
