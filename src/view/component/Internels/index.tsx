/**
 * XYRTC Meeting Internals Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React from 'react';
import { IInternels } from '@xylink/xy-rtc-sdk';
import './index.scss';

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

const Internels = ({ senderStatus, debug, switchDebug }: IProps) => {
  const {
    mimeType = 'video/H264',
    timestamp,
    bytesReceivedSecond = 0,
    bytesSentSecond = 0,
    jitterSent = 0,
    jitterReceived = 0,
    roundTripTime = 0,
    fractionLostSent = 0,
    fractionLostReceived = 0,
    sender = {},
    receiver = {},
    audioSender = {},
    audioReceiver = {},
  } = senderStatus;

  if (debug) {
    return (
      <div className="debug">
        <div className="debug__container">
          <div className="close-icon" onClick={switchDebug} />

          <h3>总览：</h3>
          <table className="table">
            <thead>
              <tr className="table-title">
                <th>视频编码</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{mimeType}</td>
                <td>{transformTime(timestamp)}</td>
              </tr>
            </tbody>
          </table>

          <br />
          <h3>网络探测：</h3>
          <table className="table">
            <thead>
              <tr className="table-title">
                <th>通道</th>
                <th>带宽(kbps)</th>
                <th>丢包率(%)</th>
                <th>往返延时(ms)</th>
                <th>抖动(ms)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>发送</td>
                <td>{bytesSentSecond}</td>
                <td>{fractionLostSent}</td>
                <td>{roundTripTime}</td>
                <td>{jitterSent ?? '-'}</td>
              </tr>
              <tr>
                <td>接收</td>
                <td>{bytesReceivedSecond}</td>
                <td>{fractionLostReceived}</td>
                <td>{roundTripTime}</td>
                <td>{jitterReceived ?? '-'}</td>
              </tr>
            </tbody>
          </table>

          <br />
          <h3>发送：</h3>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>类型</th>
                  <th>实际分辨率</th>
                  <th>期望发送（kb/s）</th>
                  <th>发送（kb/s）</th>
                  <th>编码（帧/s）</th>
                  <th>发送的帧率（帧/s）</th>
                  <th>关键帧</th>
                  <th>pliCount</th>
                  <th>firCount</th>
                  <th>nackCount</th>
                  <th>ssrc</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(sender).map((key) => {
                  let {
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
                      <td>本地视频（{resolution}P）</td>
                      <td>
                        {frameWidth} * {frameHeight}
                      </td>
                      <td>{expBandwidth}</td>
                      <td>{bytesSentSecond}</td>
                      <td>{framesEncodedSecond}</td>
                      <td>{framesSentSecond}</td>
                      <td>{keyFramesEncoded}</td>
                      <td>{pliCount}</td>
                      <td>{firCount}</td>
                      <td>{nackCount}</td>
                      <td>{ssrc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          </table>

          <br />

          <h3>音频：</h3>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>通道名称</th>
                  <th>Codec</th>
                  <th>码率(kbps)</th>
                  <th>音量</th>
                  <th>ssrc</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(audioSender).map((key) => {
                  let { mimeType, bytesSentSecond, audioLevel, ssrc } = audioSender[key];

                  return (
                    <tr key={key}>
                      <td>音频发送</td>
                      <td>{mimeType}</td>
                      <td>{bytesSentSecond ?? '-'}</td>
                      <td>{audioLevel ?? '-'}</td>
                      <td>{ssrc ?? '-'}</td>
                    </tr>
                  );
                })}

                {Object.keys(audioReceiver).map((key) => {
                  const { mimeType, bytesReceivedSecond, audioLevel, ssrc } = audioReceiver[key];

                  return (
                    <tr key={key}>
                      <td>音频接收</td>
                      <td>{mimeType}</td>
                      <td>{bytesReceivedSecond}</td>
                      <td>{audioLevel ?? '-'}</td>
                      <td>{ssrc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          </table>
          <br />
          <h3>与会者：</h3>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>昵称</th>
                  <th>类型</th>
                  <th>实际分辨率</th>
                  <th>解码（帧/s）</th>
                  <th>接受的帧率（帧/s）</th>
                  <th>接收（kb/s）</th>
                  <th>关键帧</th>
                  <th>pliCount</th>
                  <th>nackCount</th>
                  <th>ssrc</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(receiver).map((key) => {
                  const {
                    bytesReceivedSecond,
                    framesReceivedSecond,
                    framesDecodedSecond,
                    type,
                    name,
                    isContent,
                    keyFramesDecoded,
                    pliCount,
                    nackCount,
                    ssrc,
                    frameWidth,
                    frameHeight,
                  } = receiver[key];

                  return (
                    <tr key={key}>
                      <td>{name}</td>
                      <td>
                        {type} * {isContent ? 'Con' : 'Peo'}
                      </td>
                      <td>
                        {frameWidth} * {frameHeight}
                      </td>
                      <td>{framesDecodedSecond}</td>
                      <td>{framesReceivedSecond || '-'}</td>
                      <td>{bytesReceivedSecond}</td>
                      <td>{keyFramesDecoded}</td>
                      <td>{pliCount}</td>
                      <td>{nackCount}</td>
                      <td>{ssrc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

export default Internels;
