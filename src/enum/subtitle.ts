import { TLocalLanguage } from '@xylink/xy-rtc-sdk';

const lang = navigator.language.toLocaleLowerCase();
let subtitleLanguage: TLocalLanguage = 'Chinese';
if (lang.includes('en')) {
  subtitleLanguage = 'English';
}

export { subtitleLanguage };

export const DEFAULT_SUBTITLE = {
  isStart: false,
  localLanguage: subtitleLanguage,
  showLanguage: subtitleLanguage,
};
