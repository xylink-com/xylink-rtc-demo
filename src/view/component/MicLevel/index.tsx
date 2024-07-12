/**
 * 声量组件
 */
import { IVideoAudioType, VideoAudioTrack } from '@xylink/xy-rtc-sdk';
import React, { memo, useEffect, useState, useRef, useCallback } from 'react';
import './index.scss';

interface IProps {
  audio: IVideoAudioType;
  videoAudioTrack: VideoAudioTrack | null;
  className?: string;
}

const MicLevel = memo((props: IProps) => {
  const { audio, videoAudioTrack, className } = props;
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
          if (videoAudioTrack) {
            try {
              const level = await videoAudioTrack.getAudioLevel();
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
  }, [audio, clearTimmer, videoAudioTrack]);

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
