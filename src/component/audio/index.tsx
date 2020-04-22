import React, { useLayoutEffect, useEffect } from 'react';
import './index.scss';

const Audio: React.FC<any> = (props: any) => {
  const { item, id, muted } = props;
  const status = item.status;

  useEffect(() => {
    return () => {
      const id = item.data.streams[0].id;
      const audioEle: any = document.getElementById(`audio-${status}-${id}`);

      if (audioEle) {
        audioEle.pause();
      }
    }
  }, []);

  useLayoutEffect(() => {
    (async () => {
      const id = item.data.streams[0].id;
      const audioEle: any = document.getElementById(`audio-${status}-${id}`);

      if (audioEle && !audioEle.srcObject) {
        audioEle.srcObject = item.data.streams[0];

        try {
          await audioEle.play();
        } catch (err) {
          console.log("play audio err: ", err);
        }
      }
    })();
  })

  return (
    <div className="wrap-audio">
      <audio
        autoPlay
        id={`audio-${status}-${id}`}
        muted={muted}
      ></audio>
    </div >
  )
}

export default Audio;