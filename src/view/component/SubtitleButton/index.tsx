/**
 * 同传字幕按钮
 */
import React, { useEffect, useMemo, useState } from 'react';
import { XYRTCClient, TLocalLanguage } from '@xylink/xy-rtc-sdk';
import { ISubtitle, TShowLanguage } from '@/type';
import { Popover } from 'antd';
import DebounceButton from '@/component/DebounceButton';
import SVG from '@/component/Svg';
import { subtitleLanguage } from '@/enum/subtitle';

import './index.scss';

interface IProps {
  client: XYRTCClient;
  subtitle: ISubtitle;
  setSubtitleState: (state: any) => void;
}

interface ILanguageList {
  local: Record<TLocalLanguage, string>;
  show: Record<TShowLanguage, string>;
}

const SubtitleButton = (props: IProps) => {
  const { client, subtitle, setSubtitleState } = props;
  const [visible, setVisible] = useState(false);
  const { isStart, showLanguage, localLanguage } = subtitle;

  // 设置本地说话的语言
  useEffect(() => {
    client?.setTranslationLanguage(subtitleLanguage);
  }, [client]);

  const languageList: ILanguageList = useMemo(
    () => ({
      local: {
        Chinese: '简体中文',
        English: 'English',
      },
      show: {
        Chinese: '简体中文',
        English: 'English',
        ChineseAndEnglish: '中英双语',
      },
    }),
    []
  );

  //  设置本地说话的语言
  const switchLocalLanguage = (language: TLocalLanguage) => {
    setSubtitleState((state: ISubtitle) => ({ ...state, localLanguage: language }));

    client?.setTranslationLanguage(language);

    setVisible(false);
  };

  // 设置字幕显示的语言
  const switchShowLanguage = (language: TShowLanguage) => {
    setSubtitleState((state: ISubtitle) => ({ ...state, showLanguage: language }));

    setVisible(false);
  };

  const toggleSubtitle = () => {
    client[isStart ? 'stopTranslation' : 'startTranslation']();

    setSubtitleState((state: ISubtitle) => ({ ...state, isStart: !state.isStart }));
  };

  const content = (
    <>
      <div
        className="select__item"
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <p>我说的语言</p>
        <ul>
          {Object.keys(languageList.local).map((key) => (
            <li
              key={key}
              value={localLanguage}
              className={`${key === localLanguage ? 'selected' : ''}`}
              onClick={() => {
                switchLocalLanguage(key as TLocalLanguage);
              }}
            >
              {languageList.local[key as TLocalLanguage]}
            </li>
          ))}
        </ul>
        <div className="h-line" />
      </div>
      <div
        className="select__item"
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <p>字幕显示的语言</p>
        <ul>
          {Object.keys(languageList.show).map((key) => (
            <li
              key={key}
              value={showLanguage}
              className={`${key === showLanguage ? 'selected' : ''}`}
              onClick={() => {
                switchShowLanguage(key as TShowLanguage);
              }}
            >
              {languageList.show[key as TShowLanguage]}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <DebounceButton className="button button-max" onClick={toggleSubtitle}>
      <div className="layout">
        <SVG icon={isStart ? 'subtitle_stop' : 'subtitle'} />
        <div className="title"> {isStart ? '关闭字幕' : '开启字幕'} </div>
      </div>
      <Popover
        content={content}
        visible={visible}
        onVisibleChange={setVisible}
        trigger="click"
        placement="top"
        overlayClassName="xy-popover select-popover"
        align={{
          offset: [0, -2],
        }}
      >
        <div
          className="arrow"
          onClick={(e: any) => {
            e.stopPropagation();
          }}
        >
          <SVG icon="arrow" />
        </div>
      </Popover>
    </DebounceButton>
  );
};

export default SubtitleButton;
