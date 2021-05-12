/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

// Stream的状态：
// NORMAL：正常
// DOMSTRING：无流状态，定义domStream，用来创建流通道
// INVALID：已失效
export type IStreamStatus = "NORMAL" | "DOMSTRING" | "INVALID";

export type IStreamCurrentType = "NORMAL" | "SEND_ONLY" | "FAILED";

export type IStreamObjType =
  | "contentStream"
  | "previewStream"
  | "pipelineStream"
  | "remoteStream";

export type IResolutionType = 0 | 1 | 2 | 3 | 4 | 5;

export type IQualityType = 0 | 1 | 2;

export type IMediaQualityType = 0 | 100 | 200;

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
  deviceType: IDeviceType;
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
  isActiveSpeaker?: boolean;
  id: string;
  isLocal?: boolean;
}

export type IOrderRoster = {
  rosters: IRoster[];
};

export type ILayoutState =
  | "MUTE"
  | "REQUEST"
  | "NORMAL"
  | "INVALID"
  | "AUDIO_TEL"
  | "AUDIO_ONLY"
  | "AUDIO_CONTENT";

export interface ILayout {
  // 忽略
  position: number[];
  // 分辨率
  resolution: number;
  // roster 成员数据
  roster: IRoster;
  // 旋转信息
  rotate: any;
  // 忽略
  seat: number;
  state: ILayoutState;
  // 位置信息
  positionStyle?: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  // 忽略
  positionInfo?: {
    width: number;
    height: number;
  };
  // 忽略
  deal?: boolean;
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
  muteOperation: "unmuteAudio" | "muteAudio" | "";
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

export type IDeviceType =
  | "audioOutputValue"
  | "audioInputValue"
  | "videoInValue";

export interface IChoosedSettingDevice {
  audioInputValue: string;
  audioOutputValue: string;
  videoInValue: string;
}

export type IVideoAudioType =
  | "muteAudio"
  | "muteVideo"
  | "unmuteAudio"
  | "unmuteVideo";

export type IMeetingVideoStatus = {
  status: "muteVideo" | "unmuteVideo";
};

export type IMeetingAudioStatus = {
  status: "muteAudio" | "unmuteAudio";
};

type TDevice = {
  deviceId: string;
  kind: string;
  type: string;
  direction: "audioinput" | "output" | "input";
  label: string;
  groupId: string;
};

export type IDeviceList = {
  audioInputList: TDevice[];
  audioOutputList: TDevice[];
  videoInList: TDevice[];
};

export type TCurrentSelectedDevice = {
  deviceId: string;
  groupId: string;
  label: string;
};

export type ICurrentSelectedDevice = {
  audioInput: TCurrentSelectedDevice;
  videoInput: TCurrentSelectedDevice;
  audioOutput: TCurrentSelectedDevice;
};

export type IDeviceManagerChangeValue = {
  nextDevice: ICurrentSelectedDevice;
  detail: IDeviceList;
};

export interface INextDevice {
  audioInput: IDeviceItem;
  videoInput: IDeviceItem;
  audioOutput: IDeviceItem;
}
export interface ISetting {
  selectedDevice?: INextDevice;
  deviceList?: IDevices;
  localHide?: boolean;
  fullScreen?: boolean;
}

export type TSettingType = "device" | "common";

export interface IRotationInfoItem {
  height: number;
  width: number;
  participantId: number;
  // 数字0，1，2，3，其中：
  // 2顺时针旋转180度、3顺时针旋转270度、其他的数值可以不需要处理
  rotation: number;
}

export interface IRotationInfoTotalItem extends IRotationInfoItem {
  mediagroupid: number;
  id: string;
}

export interface IRotationInfo {
  content: IRotationInfoItem[];
  people: IRotationInfoItem[];
  total: IRotationInfoTotalItem[];
}

export interface ICustomLayoutObj {
  resolution: IResolutionType;
  roster: IRoster;
  rotate: any;
  state: ILayoutState;
  quality: 0 | 100 | 200;
  deal?: boolean;
  position?: number[];
  positionStyle?: {
    left?: string;
    top?: string;
    width?: string;
    height?: string;
  };
  positionInfo?: { width?: number; height?: number };
  zIndex?: number;
}
