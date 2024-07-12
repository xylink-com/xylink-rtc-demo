import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { PermissionType, VideoAudioTrack } from '@xylink/xy-rtc-sdk';

/**
 * 麦克风音量
 */

interface AudioLevelProps {
  track: VideoAudioTrack | null;
  permission: PermissionType;
}

const { GRANTED } = PermissionType;

const AudioLevel = memo((props: AudioLevelProps) => {
  const { track, permission } = props;
  const audioLevelTimer = useRef<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const clearAudioLevelTimer = useCallback(() => {
    if (audioLevelTimer.current) {
      clearInterval(audioLevelTimer.current);
      setAudioLevel(0);
    }
  }, []);

  const getAudioLevel = useCallback(() => {
    clearAudioLevelTimer();

    if (track) {
      audioLevelTimer.current = setInterval(async () => {
        const level = await track.getAudioLevel();

        setAudioLevel(level);
      }, 100);
    }
  }, [track, clearAudioLevelTimer]);

  useEffect(() => {
    if (permission === GRANTED) {
      getAudioLevel();
    }

    return () => {
      clearAudioLevelTimer();
    };
  }, [getAudioLevel, clearAudioLevelTimer, permission]);

  return (
    <div className="level-process">
      <div className="level-value" style={{ transform: `translateX(${audioLevel}%)` }}></div>
    </div>
  );
});

export default AudioLevel;
