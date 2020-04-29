import React from 'react';
import { transformTime } from '../../utils/index';
import './index.scss';

interface IProps {
  senderStatus: any;
  debug: boolean;
  switchDebug: () => void;
}

const Internels: React.FC<any> = ({ senderStatus, debug, switchDebug }: IProps) => {
  const { bytesReceived, bytesSent, mimeType, sender = {}, timestamp, receiver = {} } = senderStatus;
  const bytesReceivedSecond = senderStatus['bytesReceived/s'];
  const bytesSentSecond = senderStatus['bytesSent/s'];

  if (debug) {
    return (
      <div className="debug">
        <div className="debug__container">
          <div className="close" onClick={switchDebug}>X</div>

          <h3>Sender：</h3>
          <div>mimeType: {mimeType}</div>
          <div>time: {transformTime(timestamp)}</div>
          <div className="line">
            <span>bytesReceived: {bytesReceived}</span>
            <span>bytesReceived/s: {bytesReceivedSecond}</span>
          </div>
          <div className="line">
            <span>bytesSent: {bytesSent}</span>
            <span>bytesSent/s: {bytesSentSecond}</span>
          </div>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>Type</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>FamesEncoded/s</th>
                  <th>FramesSent/s</th>
                  <th>FamesSent</th>
                  <th>FramesEncoded</th>
                  <th>BytesSent</th>
                  <th>HugeFramesSent</th>
                  <th>PacketsSent</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(sender).map((key) => {
                    const { frameWidth, frameHeight, bytesSent, hugeFramesSent, packetsSent, framesSent, framesEncoded, type } = sender[key];
                    const framesEncodedTwo = sender[key]['framesEncoded/s'];
                    const framesSentTwo = sender[key]['framesSent/s'];

                    return (
                      <tr key={key}>
                        <td>{type}</td>
                        <td>{frameWidth}</td>
                        <td>{frameHeight}</td>
                        <td>{framesEncodedTwo}</td>
                        <td>{framesSentTwo}</td>
                        <td>{framesSent}</td>
                        <td>{framesEncoded}</td>
                        <td>{bytesSent}</td>
                        <td>{hugeFramesSent}</td>
                        <td>{packetsSent}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </>
          </table>

          <br />
          <h3>Receiver：</h3>
          <table className="table">
            <>
              <thead>
                <tr className="table-title">
                  <th>Name</th>
                  <th>Type</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>FramesDecoded/s</th>
                  <th>FramesReceived/s</th>
                  <th>FramesReceived</th>
                  <th>FramesDecoded</th>
                  <th>BytesReceived</th>
                  <th>PacketsReceived</th>
                  <th>NackCount</th>
                  <th>JitterBufferDelay</th>
                  <th>PliCount</th>
                </tr>
              </thead>
              <tbody>
                {
                  Object.keys(receiver).map((key) => {
                    const { frameWidth, frameHeight, bytesReceived, nackCount, packetsReceived, framesReceived, framesDecoded, type, name, jitterBufferDelay, pliCount } = receiver[key];
                    const framesDecodedTwo = receiver[key]['framesDecoded/s'];
                    const framesReceivedTwo = receiver[key]['framesReceived/s'];

                    return (
                      <tr key={key}>
                        <td>{name}</td>
                        <td>{type}</td>
                        <td>{frameWidth}</td>
                        <td>{frameHeight}</td>
                        <td>{framesDecodedTwo}</td>
                        <td>{framesReceivedTwo}</td>
                        <td>{framesReceived}</td>
                        <td>{framesDecoded}</td>
                        <td>{bytesReceived}</td>
                        <td>{packetsReceived}</td>
                        <td>{nackCount}</td>
                        <td>{jitterBufferDelay}</td>
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