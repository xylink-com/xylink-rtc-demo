import { THIRD } from '@/utils/config';

// 会议container ID
export const ELEMENT_ID = 'meeting';

export const LAYOUT_MODE_MAP = {
  AUTO: '自动布局',
  CUSTOM: '自定义布局',
};

export const LAYOUT_MODE_LIST = ['AUTO', 'CUSTOM'] as const;

export const SETTING_KEYS = ['selectedDevice', 'localHide'] as const;

export const DEFAULT_LOCAL_USER = {
  phone: '',
  password: '',
  meeting: '',
  meetingPassword: '',
  meetingName: '',
  muteVideo: false,
  muteAudio: false,
  extUserId: '',
};

export const DEFAULT_SETTING = {
  layoutMode: 'AUTO', // 默认自动布局
  isThird: THIRD, // 默认三方账号登录
  localHide: false, // 默认不隐藏本地画面
  speakerName: true, //默认显示正在讲话人
  isLowResolution: false, //默认不开启低性能模式
};

// 会议默认配置信息
export const DEFAULT_LOCAL_MEETING = {
  meetingId: '',
  displayName: '',
  password: '',
  muteVideo: false,
  muteAudio: false,
  localHide: false,
  InFullScreen: false, // PC可进行全屏，手机端不可全屏,初始值false
  joinNow: true, //默认立即入会
  speakerName: true, //默认显示正在讲话人
  isLowResolution: false, //默认不开启低性能模式
};

export const DEFAULT_CALL_INFO = {
  avatar: '',
  displayName: '',
  numberType: 'CONFERENCE',
  number: '',
  callNumber: '',
};

const NEXT_DEVICE = {
  deviceId: '',
  label: '',
};
export const DEFAULT_DEVICE = {
  detail: {
    audioInputList: [],
    audioOutputList: [],
    videoInList: [],
  },
  nextDevice: {
    audioInput: NEXT_DEVICE,
    videoInput: NEXT_DEVICE,
    audioOutput: NEXT_DEVICE,
  },
};
