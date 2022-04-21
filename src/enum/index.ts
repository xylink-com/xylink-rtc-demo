import { THIRD } from "@/utils/config";

export const MAX_PARTICIPANT_COUNT = 500;
export const PARTICIPANT_PAGE_SIZE = 20;
export const MAX_PARTICIPANT_COUNT_SHOW = 9999;

export const LAYOUT_MODE_MAP = {
  AUTO: "自动布局",
  CUSTOM: "自定义布局",
};

export const LAYOUT_MODE_LIST = ["AUTO", "CUSTOM"] as const;

export const SETTING_KEYS = ["selectedDevice", "localHide"] as const;

export const DEFAULT_LOCAL_USER = {
  phone: "",
  password: "",
  meeting: "",
  meetingPassword: "",
  meetingName: "",
  muteVideo: false,
  muteAudio: false,
  localHide: false,
  layoutMode: 'AUTO',
  isThird: THIRD,
  extUserId: "",
};
const NEXT_DEVICE = {
  deviceId: "",
  label: "",
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
