import React, { useState, useRef, useEffect, useCallback } from 'react';

export const secondToDate = (result: number) => {
  var h =
    Math.floor(result / 3600) < 10
      ? "0" + Math.floor(result / 3600)
      : Math.floor(result / 3600);
  var m =
    Math.floor((result / 60) % 60) < 10
      ? "0" + Math.floor((result / 60) % 60)
      : Math.floor((result / 60) % 60);
  var s =
    Math.floor(result % 60) < 10
      ? "0" + Math.floor(result % 60)
      : Math.floor(result % 60);
  return h + ":" + m + ":" + s;
};

const Timmer = () => {
  const [timmer, setTimmer] = useState("");
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
    }
  }, [onCreateMeetingTimeCount]);

  return (
    <>
      {
        timmer
      }
    </>
  )
}

export default Timmer;