import { Stream } from '@xylink/xy-rtc-sdk';
import React, { memo } from 'react';
import MicLevel from '../MicLevel';
import SVG from '../Svg';

interface IProps {
  stream: Stream;
  permission: any;
  audio: string;
  disableAudio: boolean;
  handStatus: boolean;
  audioOperate: () => void;
}


const AudioButton = (props: IProps) => {
  const { stream, permission, audio, disableAudio, handStatus, audioOperate } = props;

  let audioClass = 'button-warn mute_mic';
  let audioStatus = '取消静音';
  let svgIcon = 'mic_null';
  let svgType: 'default' | 'danger' = 'default';

  if (permission.microphone === 'denied') {
    audioClass = 'button-warn mute_mic_error';
    svgIcon = 'mute_mic_error';
  } else {
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
  }

  return (

    <div className={`button ${audioClass}`} onClick={audioOperate}>
      <div className="mic-icon">
        {permission.microphone !== 'denied' && !disableAudio && <MicLevel stream={stream} audio={audio as 'muteAudio' | 'unmuteAudio'} />}
        <SVG icon={svgIcon} type={svgType} />
      </div>
      <div className="title">{audioStatus}</div>
    </div>
  );
}

export default memo(AudioButton);