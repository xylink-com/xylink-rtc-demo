/**
 * 同传字幕内容
 *
 * 1. 名称太长时：显示名称前10个字符，超出部分显示为...
 * 2. 发言人连续发言时，每句发言前面都需要拼接名称，每句发言都重起一行显示
 * 3. 最多采集3路的语音转写字幕
 * 4. 字幕单行最长显示50个中文字符，最多显示2行（中英对照翻译一句,中文两行，英文两行）,向上滚动清屏
 * 5. 5s清屏
 */
import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ITranslationContent } from '@xylink/xy-rtc-sdk';
import { ISubtitle, TShowLanguage } from '@/type';

import './index.scss';

interface IProps {
  subtitle: ISubtitle;
  translationContent?: ITranslationContent | null;
}

const Subtitles = ({ translationContent, subtitle }: IProps) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); // 隐藏定时器
  const contentQueue = useRef<ITranslationContent[]>([]);
  const [contentTemp, setContentTemp] = useState<ITranslationContent[]>([]);
  const subtitleRef = useRef<HTMLDivElement>(null);

  const { isStart, showLanguage } = subtitle;

  const languageRef = useRef(showLanguage);

  useEffect(() => {
    const contentQueueTemp = contentQueue.current;

    const clearTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    return () => {
      contentQueueTemp.length = 0;
      setContentTemp([]);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    // 取消字幕
    if (!isStart) {
      contentQueue.current.length = 0;
      setContentTemp([]);
    }
  }, [isStart]);

  useEffect(() => {
    languageRef.current = showLanguage;
    // @ts-ignore
    if (showLanguage === 'ChineseAndEnglish' && contentQueue.current.length > 1) {
      contentQueue.current.shift();

      setContentTemp([...contentQueue.current]);
    }
  }, [showLanguage]);

  useEffect(() => {
    // 整体超过两行滚动
    const scrollFunc = (element: HTMLElement | null) => {
      if (element) {
        const elementHeight = element.scrollHeight;

        element.scrollTo({ top: elementHeight, behavior: 'smooth' });
      }
    };

    scrollFunc(subtitleRef.current);
  }, [contentTemp, showLanguage]);

  useEffect(() => {
    const { url = '', dn = '' } = translationContent || {};

    if (translationContent && dn) {
      // 名称最多显示10个字符
      translationContent.dn = dn.length > 10 ? dn.substring(0, 10) + '...' : dn;

      // 记录当前url对应的content内容对应的index，可能多个
      const contentIndexList: number[] = [];

      contentQueue.current.forEach((item: any, index) => {
        if (item.url === url) {
          contentIndexList.push(index);
        }
      });

      if (contentIndexList.length === 0) {
        contentQueue.current.push(translationContent);
      } else {
        const index = contentIndexList[contentIndexList.length - 1]; // 数组中最后一个index代表当前要改变的content
        const content = contentQueue.current[index];

        // end 标识一句话结束。
        if (content.isEnd) {
          contentQueue.current.push(translationContent);
        } else {
          contentQueue.current[index] = translationContent;
        }
      }

      // 最多显示两句， 中英文最多显示1句
      // @ts-ignore
      const maxContentCount = languageRef.current === 'ChineseAndEnglish' ? 1 : 2;

      // 最多展示两句
      if (contentQueue.current.length > maxContentCount) {
        contentQueue.current.shift();
      }

      setContentTemp([...contentQueue.current]);
    }

    //  5s未收到新的信息 清屏
    timer.current && clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      contentQueue.current.length = 0;

      setContentTemp([]);
    }, 5000);
  }, [translationContent]);

  if (!contentTemp || contentTemp.length === 0) {
    return null;
  }

  return (
    <div className="subtitle">
      <div
        className={`subtitle-wrapper ${
          // @ts-ignore
          showLanguage === 'ChineseAndEnglish' ? 'four-line-height' : 'two-line-height'
        }`}
        ref={subtitleRef}
      >
        {contentTemp.map((item, index) => {
          return <Item key={index} showLanguage={showLanguage} item={item} />;
        })}
      </div>
    </div>
  );
};

const Item = ({ showLanguage = 'Chinese', item }: { showLanguage: TShowLanguage; item: ITranslationContent }) => {
  const srcRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollFunc = (element: HTMLElement | null) => {
      if (element) {
        const elementHeight = element.scrollHeight;

        element.scrollTo({ top: elementHeight, behavior: 'smooth' });
      }
    };

    scrollFunc(srcRef.current);
    scrollFunc(targetRef.current);
  }, [item, showLanguage]);

  const getTitle = (lang: TShowLanguage) => {
    const { src, srcLang, target, targetLang } = item;
    if (lang === 'Chinese') {
      if (srcLang === 'zh') return src;

      if (targetLang === 'zh') return target;
    }

    if (lang === 'English') {
      if (srcLang === 'en') return src;

      if (targetLang === 'en') return target;
    }
  };

  return (
    <div className="subtitle-item">
      <span className="subtitle-item-name">{item.dn}：</span>
      <div className="subtitle-item-content">
        {showLanguage === 'ChineseAndEnglish' && (
          <>
            <div className="single-line" ref={srcRef}>
              {getTitle('Chinese')}
            </div>
            <div className="single-line" ref={targetRef}>
              {getTitle('English')}
            </div>
          </>
        )}

        {showLanguage !== 'ChineseAndEnglish' && (
          <div ref={srcRef} className="multi-line">
            {getTitle(showLanguage)}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Subtitles);
