/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

import { DEFAULT_LOCAL_USER, LAYOUT_MODE_LIST } from '@/enum';
import { IDeviceList, ISelectedDevice, IMode } from '@xylink/xy-rtc-sdk';

export type TSettingType = 'device' | 'common' | 'feedback' | 'about';

export type IDeviceType = 'audioOutputValue' | 'audioInputValue' | 'videoInValue';

export type TMeetingVideoStatus = {
  status: 'muteVideo' | 'unmuteVideo';
};

export type TMeetingAudioStatus = {
  status: 'muteAudio' | 'unmuteAudio';
};

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
  layoutMode?: ILayoutMode;
  isThird?: boolean;
  localHide?: boolean; // 是否隐藏本地画面
  speakerName?: boolean; // 是否显示正在讲话人
  isLowResolution?: boolean; // 是否开启低性能模式
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

export type TFontSizeType = 'small' | 'middle' | 'big';

export type TLocationType = 'top' | 'middle' | 'bottom';

// 字幕显示的语言
export type TShowLanguage = 'Chinese' | 'English' | 'ChineseAndEnglish';

export interface ISubtitle {
  isStart: boolean;
  localLanguage: string;
  showLanguage: TShowLanguage;
}

/**
 * 会控操作摄像头事件
 *
 * @property { string } toast - 提示内容
 * @property { boolean } isNotify - 是否通知后台更新操作结果
 * @property { string } requestId - 请求ID
 */
export interface IVideoOperateData {
  toast: string;
  isNotify: boolean;
  requestId: string;
}
