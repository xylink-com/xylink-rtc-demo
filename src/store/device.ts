import { create } from 'zustand';
import store from '../utils/store';
import { STORAGE_KEY } from '@/enum';
import { IDeviceInfo } from '@xylink/xy-rtc-sdk';

interface DeviceList {
  audioInput: IDeviceInfo[];
  audioOutput: IDeviceInfo[];
  videoInput: IDeviceInfo[];
  setAudioInput: (deviceList: IDeviceInfo[]) => void;
  setAudioOutput: (deviceList: IDeviceInfo[]) => void;
  setVideoInput: (deviceList: IDeviceInfo[]) => void;
}

interface ISpecifiedDevice {
  audioInput?: IDeviceInfo | null;
  videoInput?: IDeviceInfo | null;
  audioOutput?: IDeviceInfo | null;
}

export enum ChangeEntry {
  'SETTING' = 'SETTING',
  'MEETING' = 'MEETING',
  'UNKNOWN' = 'UNKNOWN'
}

/**
 * 切换设备，缓存设备ID，并通知会中需要切换的设备数据
 */
interface SpecifiedDevice {
  specifiedDevice: ISpecifiedDevice;
  changeSpecifiedDevice: ISpecifiedDevice;
  changeEntry: ChangeEntry;
  setSpecifiedDevice: (device: ISpecifiedDevice, entry: ChangeEntry) => void;
}

/**
 * 当前设备列表
 */
export const useDeviceList = create<DeviceList>((set) => ({
  audioInput: store.get(STORAGE_KEY.audioInput) || [],
  audioOutput: store.get(STORAGE_KEY.audioOutput) || [],
  videoInput: store.get(STORAGE_KEY.videoInput) || [],
  setAudioInput: (deviceList: IDeviceInfo[]) =>
    set(() => {
      store.set(STORAGE_KEY.audioInput, deviceList);

      return { audioInput: deviceList };
    }),
  setAudioOutput: (deviceList: IDeviceInfo[]) =>
    set(() => {
      store.set(STORAGE_KEY.audioOutput, deviceList);

      return { audioOutput: deviceList };
    }),
  setVideoInput: (deviceList: IDeviceInfo[]) =>
    set(() => {
      store.set(STORAGE_KEY.videoInput, deviceList);

      return { videoInput: deviceList };
    })
}));

/**
 * 获取设备详情
 *
 * @param { string } specifiedKey - 指定设备Key
 * @param { IDeviceInfo[] } deviceList - 设备列表
 * @returns { IDeviceInfo | null } - 设备数据
 */
const getDeviceByKey = (specifiedKey: string = '', deviceList: IDeviceInfo[]) => {
  return deviceList.find(({ key }) => key === specifiedKey) || null;
};

/**
 * 全局设置的设备
 */
export const useSpecifiedDevice = create<SpecifiedDevice>((set) => ({
  // 全局指定的设备ID
  specifiedDevice: store.get(STORAGE_KEY.specifiedDeviceV2) || {
    audioInput: null,
    audioOutput: null,
    videoInput: null
  },
  // 需要切换的设备信息
  changeSpecifiedDevice: {
    audioInput: null,
    audioOutput: null,
    videoInput: null
  },
  changeEntry: ChangeEntry.UNKNOWN,
  // 设置全局指定的DeviceId
  setSpecifiedDevice: (device: ISpecifiedDevice, entry: ChangeEntry) =>
    set((state) => {
      // 缓存最新设置的设备
      const specifiedDevice = { ...state.specifiedDevice, ...device };

      store.remove(STORAGE_KEY.specifiedDeviceV1);
      store.set(STORAGE_KEY.specifiedDeviceV2, specifiedDevice);

      // 通知全局设备变更
      const changeSpecifiedDevice: ISpecifiedDevice = {
        audioInput: null,
        audioOutput: null,
        videoInput: null
      };
      const { audioInput, audioOutput, videoInput } = useDeviceList.getState();
      const { audioInput: specAI, audioOutput: specAO, videoInput: specVI } = device;

      if (specAI) {
        changeSpecifiedDevice.audioInput = getDeviceByKey(specAI.key, audioInput);
      } else if (specAO) {
        changeSpecifiedDevice.audioOutput = getDeviceByKey(specAO.key, audioOutput);
      } else if (specVI) {
        changeSpecifiedDevice.videoInput = getDeviceByKey(specVI.key, videoInput);
      }

      return { specifiedDevice, changeSpecifiedDevice, changeEntry: entry };
    })
}));
