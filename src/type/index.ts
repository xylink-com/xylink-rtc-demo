/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

export interface IDisconnected {
  code: number;
  msg: string;
  detail: {
    message: string;
    key: string;
  };
}

export interface IParticipantCount {
  participantsNum: number;
}

export interface IRoster {
  deviceType: string;
  endpointId: string;
  displayName: string;
  mediagroupid: number;
  participantId: number;
  audioTxMute: boolean;
  videoTxMute: boolean;
  audioRxMute: boolean;
  videoRxMute: boolean;
  videoMuteReason: number;
  isForceFullScreen: boolean;
  isLastAdd: boolean;
  onHold: boolean;
  isPolling: boolean;
  isContent: boolean;
}

export interface ILayout {
  roster: IRoster;
  position: number[];
  seat: number;
  status: string;
  stream: {
    video: null | MediaStream;
    videoTrackId: null | string;
    isExist: boolean;
    track: MediaStreamTrack;
  };
  display: boolean;
  deal: boolean;
  positionInfo?: {
    width: number;
    height: number;
  };
  positionStyle?: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  rotate: any;
}

export interface IScreenInfo {
  rateWidth: number;
  rateHeight: number;
  width: number;
  height: number;
  isWidth: boolean;
}

export interface IAudioTrack {
  status: string;
  data: {
    streams: MediaStream[];
    track: MediaStreamTrack;
  };
}

export interface ICallStatus {
  code: number;
  msg: string;
  detail: string;
}

export interface IAudioStatus {
  disableMute: boolean;
  muteOperation: 'unmute' | 'mute' | '';
}

export interface ISpeakerInfo {
  speakerInfo: {
    endpointId: string;
    pid: number;
  };
}
export interface ISubTitleContent {
  fontFamily?: string; // 字体
  fontRGB?: string; // 字体颜色
  scroll?: string; // 是否滚动 1-滚 0-固定
  action?: string; // push、cancel
  location?: string; // 位置
  fontSize?: string; // 字体大小
  backgroundAlpha?: string; // 背景色透明度
  scrollSpeed?: string; // 滚动速度
  content: string; // 内容
  backgroundRGB?: string; // 背景色
}

export interface IDeviceItem {
  deviceId: string;
  label: string;
}

export interface IDevices {
  audioInputList: IDeviceItem[];
  audioOutputList: IDeviceItem[];
  videoInList: IDeviceItem[];
}

export interface IChoosedDevice {
  audioInputValue: string;
  audioOutputValue: string;
  videoInValue: string;
}

export type IDeviceType = 'audioOutputValue' | 'audioInputValue' | 'videoInValue';

export interface IChoosedSettingDevice {
  audioInputValue: string;
  audioOutputValue: string;
  videoInValue: string;
}
