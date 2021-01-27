/**
 * XYRTC Audio Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useEffect, useRef } from 'react';
import './index.scss';

interface IProps {
  item: any,
  muted: boolean;
  streamId: string;
  audioOutput?: string; // 扬声器
  client: any;
}

const Audio: React.FC<any> = (props: IProps) => {
  const { muted, streamId, client } = props;
  const audioRef = useRef<HTMLAudioElement>(null);

  // 组件加载完成（DOM已经渲染）的回调事件
  useEffect(() => {
    const audioEle = audioRef.current;
    if (audioEle && client) {
      // 设置播放器
      client.setAudioRenderer(streamId, audioRef.current);
    }

    // react hook 组件销毁时的回调函数
    return () => {
      // 暂停audio组件播放
      audioEle && audioEle.pause();
    }
  }, [client, streamId]);

  // audio组件在页面中隐藏即可，不需要展示出来
  return (
    <div className="wrap-audio">
      <audio
        autoPlay={true}
        ref={audioRef}
        muted={muted}
      ></audio>
    </div >
  )
}

export default Audio;