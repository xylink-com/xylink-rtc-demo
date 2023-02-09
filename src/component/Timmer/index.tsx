import React, { useState, useRef, useEffect, useCallback } from 'react';
import './index.scss';

export const secondToDate = (result: number) => {
  var h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
  var m = Math.floor((result / 60) % 60) < 10 ? '0' + Math.floor((result / 60) % 60) : Math.floor((result / 60) % 60);
  var s = Math.floor(result % 60) < 10 ? '0' + Math.floor(result % 60) : Math.floor(result % 60);
  return h + ':' + m + ':' + s;
};

interface IProps {
  children?: React.ReactNode;
  before?: boolean;
  time?: boolean;
}

const Timmer = (props: IProps) => {
  const { children, before = false, time = true } = props;
  const [timmer, setTimmer] = useState('00:00:00');
  const timerCount = useRef(0);
  const meetingTimeout = useRef<any>();

  const onCreateMeetingTimeCount = useCallback(() => {
    timerCount.current++;

    meetingTimeout.current = setTimeout(() => {
      clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;

      const meetingTime = secondToDate(timerCount.current);
      setTimmer(meetingTime);
      onCreateMeetingTimeCount();
    }, 1000);
  }, []);

  useEffect(() => {
    onCreateMeetingTimeCount();

    return () => {
      clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;
    };
  }, [onCreateMeetingTimeCount]);

  return (
    <>
      {' '}
      {before && (
        <i
          className={`timer-circle ${
            Number(timmer.charAt(timmer.length - 1)) % 2 === 0 ? 'circle-show' : 'circle-hide'
          }`}
        />
      )}
      {children && <div className="timer-children">{children}</div>}
      {time && timmer}
    </>
  );
};

export default Timmer;
