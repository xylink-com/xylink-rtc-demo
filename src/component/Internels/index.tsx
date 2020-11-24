/**
 * XYRTC Meeting Internals Component
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React from 'react';
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
  senderStatus: any;
  debug: boolean;
  switchDebug: () => void;
}

const Internels: React.FC<any> = ({ senderStatus, debug, switchDebug }: IProps) => {
  const {
    mimeType,
    sender = {},
    timestamp,
    receiver = {},
    bytesReceivedSecond,
    bytesSentSecond
  } = senderStatus;

  if (debug) {
    return (
      <div className="debug">
        <div className="debug__container">
          <div className="close" onClick={switchDebug}>X</div>

          <h3>总览：</h3>
          <table className="table">
            <thead>
              <tr className="table-title">
                <th>视频编码</th>
                <th>时间</th>
                <th>接收（kb/s）</th>
                <th>发送（kb/s）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{mimeType}</td>
                <td>{transformTime(timestamp)}</td>
                <td>{bytesReceivedSecond}</td>
                <td>{bytesSentSecond}</td>
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
                  <th>分辨率</th>
                  <th>期望发送（kb/s）</th>
                  <th>发送（kb/s）</th>
                  <th>编码（帧/s）</th>
                  <th>码率（帧/s）</th>
                  <th>关键帧</th>
                  <th>pliCount</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(sender).map((key) => {
                    const {
                      frameWidth,
                      frameHeight,
                      bytesSentSecond,
                      framesSentSecond,
                      framesEncodedSecond,
                      type,
                      keyFramesEncoded,
                      expBandwidth,
                      pliCount
                    } = sender[key];

                    return (
                      <tr key={key}>
                        <td>{type}</td>
                        <td>{frameWidth} * {frameHeight}</td>
                        <td>{expBandwidth}</td>
                        <td>{bytesSentSecond}</td>
                        <td>{framesEncodedSecond}</td>
                        <td>{framesSentSecond}</td>
                        <td>{keyFramesEncoded}</td>
                        <td>{pliCount}</td>
                      </tr>
                    )
                  })
                }
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
                  <th>期望分辨率</th>
                  <th>解码（帧/s）</th>
                  <th>码率（帧/s）</th>
                  <th>接收（kb/s）</th>
                  <th>关键帧</th>
                  <th>pliCount</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(receiver).map((key) => {
                    const {
                      frameWidth,
                      frameHeight,
                      bytesReceivedSecond,
                      framesReceivedSecond,
                      framesDecodedSecond,
                      type,
                      name,
                      isContent,
                      expResolution,
                      keyFramesDecoded,
                      pliCount
                    } = receiver[key];

                    return (
                      <tr key={key}>
                        <td>{name}</td>
                        <td>{type} * {isContent ? "Con" : 'Peo'}</td>
                        <td>{frameWidth} * {frameHeight}</td>
                        <td>{expResolution}</td>
                        <td>{framesDecodedSecond}</td>
                        <td>{framesReceivedSecond}</td>
                        <td>{bytesReceivedSecond}</td>
                        <td>{keyFramesDecoded}</td>
                        <td>{pliCount}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </>
          </table>
        </div>
      </div>
    )
  }

  return null;
}

export default Internels;