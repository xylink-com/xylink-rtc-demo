/**
 * XYRTC Meeting Internals Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { memo, useRef, useState } from 'react';
import './index.scss';
import { IInternels } from '@xylink/xy-rtc-sdk';

const transformTime = (timestamp: number = +new Date()) => {
  if (timestamp) {
    var time = new Date(timestamp);
    var y = time.getFullYear(); //getFullYear方法以四位数字返回年份
    var M = time.getMonth() + 1; // getMonth方法从 Date 对象返回月份 (0 ~ 11)，返回结果需要手动加一
    var d = time.getDate(); // getDate方法从 Date 对象返回一个月中的某一天 (1 ~ 31)
    var h = time.getHours(); // getHours方法返回 Date 对象的小时 (0 ~ 23)
    var m = time.getMinutes(); // getMinutes方法返回 Date 对象的分钟 (0 ~ 59)
    var s = time.getSeconds(); // getSeconds方法返回 Date 对象的秒数 (0 ~ 59)
    return y + '-' + M + '-' + d + ' ' + h + ':' + m + ':' + s;
  } else {
    return '';
  }
};

interface IProps {
  senderStatus: IInternels;
  debug: boolean;
  switchDebug: () => void;
}

const Internals = (props: IProps) => {
  const { senderStatus, debug } = props;
  const [expand, setExpand] = useState<boolean>(false);
  const debugContainerRef = useRef<HTMLDivElement | null>(null);
  const debugContentRef = useRef<HTMLDivElement | null>(null);

  const {
    mimeType = 'video/H264',
    audioMimeType = 'audio/Opus',
    timestamp,
    bytesReceivedSecond = 0,
    bytesSentSecond = 0,
    jitterSent = 0,
    jitterReceived = 0,
    audioSendJitter = 0,
    roundTripTime = 0,
    fractionLostSent = 0,
    fractionLostReceived = 0,
    sender = {},
    receiver = {},
    audioSender = {},
    audioReceiver = {},
  } = senderStatus;

  const switchDebug = () => {
    props.switchDebug();
    setExpand(false);
  };

  const toggleExpandInfo = () => {
    setExpand((state) => !state);
  };

  if (debug) {
    return (
      <div className="debug" id="debug_container" ref={debugContainerRef}>
        <div
          id="debug_content"
          ref={debugContentRef}
          className={`debug__container ${expand ? 'debug__expand_container' : ''}`}
        >
          <div className="icon_close" onClick={switchDebug}></div>

          <div className="debug__content">
            <h3 className="table__title">总览：</h3>
            <table className="table">
              <thead>
                <tr className="table-title">
                  <th>视频编码</th>
                  <th>音频编码</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{mimeType}</td>
                  <td>{audioMimeType}</td>
                  <td className="internal_time">{transformTime(timestamp) || 0}</td>
                  <td className="click_type" onClick={toggleExpandInfo}>
                    {expand ? '收起' : '展开'}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="table__title">{'网络探测'}</h3>
            <table className="table">
              <thead>
                <tr className="table-title">
                  <th>{'通道'}</th>
                  <th>{'带宽'}(kbps)</th>
                  <th>{'丢包率'}(%)</th>
                  <th>{'往返延时'}(ms)</th>
                  <th>{'抖动'}(ms)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{'发送'}</td>
                  <td>{bytesSentSecond}</td>
                  <td>{fractionLostSent}</td>
                  <td>{roundTripTime}</td>
                  <td>{jitterSent}</td>
                </tr>
                <tr>
                  <td>{'接收'}</td>
                  <td>{bytesReceivedSecond}</td>
                  <td>{fractionLostReceived}</td>
                  <td>{roundTripTime}</td>
                  <td>{jitterReceived}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="table__title">{'音频'}</h3>
            <table className="table">
              <thead>
                <tr className="table-title">
                  <th>{'通道'}</th>
                  <th>{'名称'}</th>
                  <th>{'码率'}(kbps)</th>
                  <th>{'音量'}</th>
                  <th>{'抖动'}(ms)</th>
                  {expand && <th>{'包速率'}</th>}
                  {expand && <th>{'往返延时'}(ms)</th>}
                  {expand && <th>SSRC</th>}
                </tr>
              </thead>
              <tbody>
                {Object.keys(audioSender).map((key) => {
                  let {
                    bytesSentSecond,
                    audioLevel = 0,
                    ssrc,
                    packetsSentSecond = 0,
                    roundTripTime = 0,
                  } = audioSender[key];

                  return (
                    <tr key={key}>
                      <td>{'发送'}</td>
                      <th>-</th>
                      <td>{bytesSentSecond}</td>
                      <td>{audioLevel ?? '-'}</td>
                      <td>{audioSendJitter}</td>
                      {expand && <td>{packetsSentSecond}</td>}
                      {expand && <td>{roundTripTime}</td>}
                      {expand && <td className="copy_type">{ssrc}</td>}
                    </tr>
                  );
                })}

                {Object.keys(audioReceiver).map((key) => {
                  const {
                    bytesReceivedSecond,
                    audioLevel,
                    ssrc,
                    jitter = 0,
                    name = '',
                    packetsReceivedSecond = 0,
                  } = audioReceiver[key];

                  return (
                    <tr key={key}>
                      <td>{'接收'}</td>
                      <td>{name}</td>
                      <td>{bytesReceivedSecond}</td>
                      <td>{audioLevel ?? '-'}</td>
                      <td>{jitter}</td>
                      {expand && <td>{packetsReceivedSecond}</td>}
                      {expand && <td>-</td>}
                      {expand && <td className="copy_type">{ssrc}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h3 className="table__title">{'本地视频'}</h3>
            <table className="table">
              <thead>
                <tr className="table-title">
                  <th>{'类型'}</th>
                  <th>{'分辨率'}</th>
                  <th>{'期望发送'}（kbps）</th>
                  <th>{'发送'}（kbps）</th>
                  <th>{'编码'}（fps）</th>
                  <th>{'帧率'}（fps）</th>
                  {expand && <th>{'关键帧'}</th>}
                  {expand && <th>PLI</th>}
                  {expand && <th>FIR</th>}
                  {expand && <th>Nack</th>}
                  {expand && <th>SSRC</th>}
                </tr>
              </thead>
              <tbody>
                {Object.keys(sender).map((key) => {
                  const {
                    type,
                    frameWidth,
                    frameHeight,
                    bytesSentSecond,
                    framesSentSecond,
                    framesEncodedSecond,
                    keyFramesEncoded,
                    expBandwidth,
                    pliCount,
                    firCount,
                    nackCount,
                    ssrc,
                    resolution,
                  } = sender[key];

                  return (
                    <tr key={key}>
                      <td>
                        {(type === 'CONTENT' ? `${'共享'}` : `${'视频'}`) +
                          `（${resolution}P）`}
                      </td>
                      <td>
                        {frameWidth}*{frameHeight}
                      </td>
                      <td>{expBandwidth}</td>
                      <td>{bytesSentSecond}</td>
                      <td>{framesEncodedSecond}</td>
                      <td>{framesSentSecond}</td>
                      {expand && <td>{keyFramesEncoded}</td>}
                      {expand && <td>{pliCount}</td>}
                      {expand && <td>{firCount}</td>}
                      {expand && <td>{nackCount}</td>}
                      {expand && <td className="copy_type">{ssrc}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h3 className="table__title">{'远端视频'}</h3>
            <table className="table">
              <thead>
                <tr className="table-title">
                  <th>{'名称'}</th>
                  <th>{'类型'}</th>
                  <th>{'分辨率'}</th>
                  <th>{'接收'}（kbps）</th>
                  <th>{'解码'}（fps）</th>
                  <th>{'帧率'}（fps）</th>
                  {expand && <th>PLI</th>}
                  {expand && <th>Nack</th>}
                  {expand && <th>SSRC</th>}
                </tr>
              </thead>
              <tbody>
                {Object.keys(receiver).map((key) => {
                  const {
                    frameWidth,
                    frameHeight,
                    bytesReceivedSecond,
                    framesReceivedSecond,
                    framesDecodedSecond,
                    name,
                    isContent,
                    pliCount,
                    nackCount,
                    ssrc,
                  } = receiver[key];

                  return (
                    <tr key={key}>
                      <td>{name}</td>
                      <td>{isContent ? `${'共享'}` : `${'视频'}`}</td>
                      <td>
                        {frameWidth} * {frameHeight}
                      </td>
                      <td>{bytesReceivedSecond}</td>
                      <td>{framesDecodedSecond}</td>
                      <td>{framesReceivedSecond}</td>
                      {expand && <td>{pliCount}</td>}
                      {expand && <td>{nackCount}</td>}
                      {expand && <td className="copy_type">{ssrc}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default memo(Internals);
