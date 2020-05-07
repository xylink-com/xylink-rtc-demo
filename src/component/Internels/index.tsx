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
    bytesReceived,
    bytesSent,
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
                <th>Codec</th>
                <th>Time</th>
                <th>BytesRec/s</th>
                <th>BytesSent/s</th>
                <th>BytesRec</th>
                <th>BytesSent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{mimeType}</td>
                <td>{transformTime(timestamp)}</td>
                <td>{bytesReceivedSecond}</td>
                <td>{bytesSentSecond}</td>
                <td>{bytesReceived}</td>
                <td>{bytesSent}</td>
              </tr>
            </tbody>
          </table>

          <br />
          <h3>发送：</h3>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>Type</th>
                  <th>Res</th>
                  <th>FamesEn/s</th>
                  <th>FramesSent/s</th>
                  <th>BytesSent/s</th>
                  <th>BytesSent</th>
                  <th>PacketsSent</th>
                  <th>keyFramesEn</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(sender).map((key) => {
                    const {
                      frameWidth,
                      frameHeight,
                      bytesSent,
                      bytesSentSecond,
                      packetsSent,
                      framesSentSecond,
                      framesEncodedSecond,
                      type,
                      keyFramesEncoded
                    } = sender[key];

                    return (
                      <tr key={key}>
                        <td>{type}</td>
                        <td>{frameWidth} * {frameHeight}</td>
                        <td>{framesEncodedSecond}</td>
                        <td>{framesSentSecond}</td>
                        <td>{bytesSentSecond}</td>
                        <td>{bytesSent}</td>
                        <td>{packetsSent}</td>
                        <td>{keyFramesEncoded}</td>
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
                  <th>Name</th>
                  <th>Type</th>
                  <th>Res</th>
                  <th>FramesDe/s</th>
                  <th>FramesRe/s</th>
                  <th>BytesRe/s</th>
                  <th>PacketsRe</th>
                  <th>NackCount</th>
                  <th>keyFramesDe</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(receiver).map((key) => {
                    const {
                      frameWidth,
                      frameHeight,
                      bytesReceivedSecond,
                      nackCount,
                      packetsReceived,
                      framesReceivedSecond,
                      framesDecodedSecond,
                      type,
                      name,
                      isContent,
                      keyFramesDecoded
                    } = receiver[key];

                    return (
                      <tr key={key}>
                        <td>{name}</td>
                        <td>{type} * {isContent ? "Con" : 'Peo'}</td>
                        <td>{frameWidth} * {frameHeight}</td>
                        <td>{framesDecodedSecond}</td>
                        <td>{framesReceivedSecond}</td>
                        <td>{bytesReceivedSecond}</td>
                        <td>{packetsReceived}</td>
                        <td>{nackCount}</td>
                        <td>{keyFramesDecoded}</td>
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