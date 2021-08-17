/**
 * 出入会提醒
 * 1.显示最新的3条，3秒更新一次
 * 2.无数据变化，10s之后隐藏
 * 3.超过1000人，不会收到此消息
 */
import React, { useState, useRef, useEffect } from 'react';
import { IReminder } from '@xylink/xy-rtc-sdk';
import './index.scss';
import iconHide from '../../style/img/icon_hide.svg';

interface IProps {
  reminders: IReminder[];
}

const actionMap: {
  [key: string]: string;
} = {
  in: '加入',
  out: '离开'
};

const InOutReminder = (props: IProps) => {
  const { reminders } = props;

  const [newReminders, setNewReminders] = useState(reminders); // 显示的消息
  const [isHide, setIsHide] = useState(true); // 隐藏toolbar + content
  const [isHideContent, setIsHideContent] = useState(false); // 隐藏content
  const [remindersTemp, setRemindersTemp] = useState<IReminder[]>([]); // 存储展示的消息

  const remindersQueue = useRef<IReminder[]>([]); // 存储3秒收到的消息
  const timer = useRef<any>(null); // 隐藏定时器
  const queueTimer = useRef<any>(null); // 存储定时器

  useEffect(() => {
    return () => {
      setRemindersTemp([]);
      clearInterval(queueTimer.current);
      queueTimer.current = null;
    };
  }, []);

  useEffect(() => {
    remindersQueue.current = remindersQueue.current.concat(reminders);

    // 起一个3s定时器，每3秒取最后一个最新的数据进行展示
    if (!queueTimer.current && remindersQueue.current.length > 0) {
      queueTimer.current = setInterval(() => {
        if (remindersQueue.current.length > 1) {
          setRemindersTemp((remindersTemp) => {
            return remindersTemp.concat(remindersQueue.current.pop() || []).slice(-3);
          });

          remindersQueue.current = [];
        }
      }, 2000);
    }

    // 第一条数据直接显示
    if (remindersQueue.current.length === 1) {
      setRemindersTemp((remindersTemp) => {
        return remindersTemp.concat(reminders);
      });
    }
  }, [reminders]);

  useEffect(() => {
    const clearTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    if (remindersTemp.length !== 0) {
      setIsHide(false);
      setNewReminders(remindersTemp);

      timer.current = setTimeout(() => {
        setIsHide(true);
        setRemindersTemp([]);
        clearInterval(queueTimer.current);
        queueTimer.current = null;
        remindersQueue.current = [];
      }, 10000);
    }

    return () => {
      clearTimer();
    };
  }, [remindersTemp]);

  const onToggleReminder = () => {
    setIsHideContent(!isHideContent);
  };

  return (
    <div
      className={`reminder ${isHideContent ? 'reminder-close' : 'reminder-expand'} ${isHide ? 'reminder-hide' : 'reminder-show'
        }`}
    >
      <div className="reminder-toolbar" onClick={onToggleReminder}>
        <img src={iconHide} alt="" />
        {!isHideContent && '隐藏'}
      </div>
      <ul className="reminder-content">
        {newReminders.map((item, index) => {
          return (
            <li key={index}>
              <div>
                <span className="name">{item.displayName}</span>
                {actionMap[item.action]}了会议
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default InOutReminder;
