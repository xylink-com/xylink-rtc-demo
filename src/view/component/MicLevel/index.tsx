/**
 * 声量组件
 */
import { IVideoAudioType, Stream } from '@xylink/xy-rtc-sdk';
import React, { memo, useEffect, useState, useRef, useCallback } from 'react';
import './index.scss';

interface IProps {
  audio: IVideoAudioType;
  stream: Stream;
  className?: string;
}

const MicLevel = memo((props: IProps) => {
  const { audio, stream, className } = props;
  const [micLevel, setMicLevel] = useState(0); // 音量等级
  const audioLevelTimmer = useRef<any>(null);

  // 缓存清理声量的timmer定时器函数
  const clearTimmer = useCallback(() => {
    audioLevelTimmer?.current && clearInterval(audioLevelTimmer.current);
    audioLevelTimmer.current = null;
  }, []);

  useEffect(() => {
    if (audio === 'unmuteAudio') {
      if (!audioLevelTimmer.current) {
        audioLevelTimmer.current = setInterval(async () => {
          if (stream) {
            try {
              const level = await stream.getAudioLevel();
              // 更新Audio的实时音量显示
              setMicLevel(level);
            } catch (err) {
              clearTimmer();
            }
          }
        }, 100);
      }
    } else {
      clearTimmer();
      setMicLevel(0);
    }

    return () => {
      // 组件卸载时，清理定时器
      clearTimmer();
    };
  }, [audio, clearTimmer, stream]);

  return (
    <>
      {audio === 'unmuteAudio' && (
        <div className={`aec ${className}`}>
          <div className="aec_content" style={{ transform: `translateY(-${micLevel}%)` }} />
        </div>
      )}
    </>
  );
});

export default MicLevel;
