/**
 * XYRTC Audio Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useLayoutEffect, useEffect, useRef } from 'react';
import xyRTC from '@xylink/xy-rtc-sdk';
import './index.scss';

interface IProps {
  item: any,
  muted: boolean;
  audioOutput?: string; // 扬声器
}

const Audio: React.FC<any> = (props: IProps) => {
  const { item, muted, audioOutput = "" } = props;
  const status = item.status;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      audioRef.current && audioRef.current.pause();
    }
  }, []);

  useEffect(() => {
    // 扬声器
    if (audioOutput && status !== "local") {
      xyRTC.setOutputAudioDevice(audioRef.current, audioOutput);
    }
  }, [audioOutput, status]);

  useLayoutEffect(() => {
    (async () => {
      if (audioRef.current && !audioRef.current.srcObject) {
        audioRef.current.srcObject = item.data.streams[0];

        try {
          await audioRef.current.play();
        } catch (err) {
        }
      }
    })();
  })

  return (
    <div className="wrap-audio">
      <audio
        autoPlay
        ref={audioRef}
        muted={muted}
      ></audio>
    </div >
  )
}

export default Audio;