import { create } from 'zustand';
import store from '../utils/store';
import { DEFAULT_SETTING, STORAGE_KEY } from '@/enum';
import { ISetting } from '@/type';

export interface ISettingOptions {
  setting: ISetting;
  setSetting: (options: any) => void;
}

export const useSetting = create<ISettingOptions>((set) => ({
  setting: DEFAULT_SETTING,

  setSetting: (options: any) =>
    set((state) => {
      const mergeSetting = { ...state.setting, ...options };

      store.set(STORAGE_KEY.xySetting, mergeSetting);

      return { setting: mergeSetting };
    })
}));
