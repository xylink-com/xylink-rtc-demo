/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

import { DEFAULT_LOCAL_USER, LAYOUT_MODE_LIST, SETTING_KEYS } from "@/enum";
import { IDeviceList, ISelectedDevice, IMode } from "@xylink/xy-rtc-sdk";

export type TSettingType = "device" | "common" | "feedback" | "about";

export type IDeviceType =
  | "audioOutputValue"
  | "audioInputValue"
  | "videoInValue";

export type TMeetingVideoStatus = {
  status: "muteVideo" | "unmuteVideo";
};

export type TMeetingAudioStatus = {
  status: "muteAudio" | "unmuteAudio";
};

export type ISettingKey = typeof SETTING_KEYS[number];

export type ILayoutMode = typeof LAYOUT_MODE_LIST[number];

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
  layoutMode?: ILayoutMode;
  isThird?: boolean;
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

export type IUser = Partial<typeof DEFAULT_LOCAL_USER>;
export interface ILayoutItem {
  key: IMode;
  text: string;
}
export interface ILayoutModeMap {
  normal: ILayoutItem[][];
  content: ILayoutItem[][];
  chairmanUri: ILayoutItem[][];
}

export type TFontSizeType = "small" | "middle" | "big";

export type TLocationType = "top" | "middle" | "bottom";
