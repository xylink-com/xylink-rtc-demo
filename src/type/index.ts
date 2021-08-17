/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

import { IDeviceList, ISelectedDevice } from '@xylink/xy-rtc-sdk';

export type TSettingType = 'device' | 'common' | 'feedback';

export type IDeviceType = 'audioOutputValue' | 'audioInputValue' | 'videoInValue';

export type TMeetingVideoStatus = {
  status: 'muteVideo' | 'unmuteVideo';
};

export type TMeetingAudioStatus = {
  status: 'muteAudio' | 'unmuteAudio';
};

export type TServerEnv = 'dev' | 'txdev' | 'txqa' | 'pre' | 'prd';

export type IServerInfo = {
  [key in TServerEnv]: {
    wssServer: string;
    httpServer: string;
    baseServer: string;
    logServer: string;
  };
};

export interface ICallInfo {
  displayName: string;
  numberType: string;
  number: string;
  avatar: string;
}

export interface IParticipantCount {
  participantsNum: number;
}

export interface IAudioTrack {
  status: string;
  data: {
    streams: MediaStream[];
    track: MediaStreamTrack;
  };
}
export interface ISetting {
  selectedDevice?: ISelectedDevice;
  deviceList?: IDeviceList;
  localHide?: boolean;
  fullScreen?: boolean;
}

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