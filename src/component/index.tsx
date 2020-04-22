/**
 * Meeting page
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-03-03 20:19:35
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Row, Col, Form, Input, message } from 'antd';
import xyRTC from 'xy-rtc-sdk';
import '../style/index.scss';
import cloneDeep from 'clone-deep';
import Video from './video';
import Audio from './audio';
import store from '../utils/store';

import { IDisconnected, IParticipantCount, ILayout, IScreenInfo, IAudioTrack, ICallStatus, IAudioStatus, IRoster } from '../type/index';

let client: any;
let stream: any;

function Home(props: any) {
  const { phone = "", password = "", meeting = "", meetingPassword = "", meetingName = "" }: any = store.get("user") || {};

  const [callMeeting, setCallMeeting] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [user, setUser] = useState({
    phone,
    password,
    meeting,
    meetingPassword,
    meetingName
  })
  const [layout, setLayout] = useState<any>([]);
  const [screenInfo, setScreenInfo] = useState({
    rateWidth: 0,
    rateHeight: 0
  });
  const [audioList, setAudioList] = useState<any>([]);
  const [video, setVideo] = useState('unmuteVideo');
  const [audio, setAudio] = useState('unmute');
  const [disableAudio, setDisableAudio] = useState(false);
  const [layoutModel, setLayoutModel] = useState('speaker');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [autoBandwidth, setAutoBandwidth] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [shareContentStatus, setShareContentStatus] = useState(false);

  const audioLevel = useRef<any>();

  // 获取实时音量大小
  useEffect(() => {
    // 呼叫成功时，开始获取实时音量
    if (callMeeting && !callLoading) {
      if (audio === "unmute") {
        if (!audioLevel.current) {
          audioLevel.current = setInterval(() => {
            if (stream) {
              const level = stream.getAudioLevel();

              // 更新Audio的实时音量显示
              setMicLevel(level);
            }
          }, 500);
        }
      } else {
        audioLevel.current && clearInterval(audioLevel.current);
        audioLevel.current = null;
        setMicLevel(0);
      }
    } else {
      audioLevel.current && clearInterval(audioLevel.current);
      audioLevel.current = null;
      setMicLevel(0);
    }

    return () => {
      // 组件卸载时，清理定时器
      audioLevel.current && clearInterval(audioLevel.current);
      audioLevel.current = null;
    }
  }, [audio, callMeeting, callLoading]);

  // 挂断会议
  const disconnected = (msg = "", reason?: string) => {
    message.info(msg);

    stop(reason);
  }

  // 结束会议操作
  const stop = (reason: string = 'OK') => {
    // sdk清理操作
    stream && stream.close();
    client && client.close(reason);

    // 清理组件状态
    setCallMeeting(false);
    setCallLoading(false);
    setLayout([]);
    setMicLevel(0);

    // 清理定时器
    audioLevel.current && clearInterval(audioLevel.current);
    audioLevel.current = null;
  }

  // 监听client的内部事件
  const initEventListener = (client: any) => {
    // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
    client.on("disconnected", (e: IDisconnected) => {
      console.log("demo page disconnected message: ", e);

      const showMessage = (e.detail && e.detail.message) || '呼叫异常，请稍后重试';

      disconnected(showMessage, 'EXPIRED');
    })

    // 会议成员数量数据
    client.on("participants-count", (e: IParticipantCount) => {
      setParticipantsCount(e.participantsNum);
    })

    // 会议layout数据
    client.on("layout", (e: ILayout[]) => {
      console.log("demo get layout: ", e);

      setLayout(cloneDeep(e));
    })

    // 动态计算的显示容器信息
    client.on("screenInfo", (e: IScreenInfo) => {
      setScreenInfo(e);
    })

    // audio list数据
    client.on("audioTrack", (e: IAudioTrack[]) => {
      console.log("demo get audioTrack list: ", e);

      setAudioList(e);
    })

    // 呼叫状态
    client.on('callStatus', (e: ICallStatus) => {
      // 10518入会成功
      // 10519正在呼叫中
      // 呼叫失败，请将detail信息作为disconnected的第二个参数
      console.log("demo get call status: ", e);
      const code = e.code;
      const msg = e.msg;
      const detail = e.detail;

      if (code === 10518) {
        message.info(msg);

        setCallLoading(false);
      } else if (code === 10519) {
        message.info(msg);
      } else {
        disconnected(msg, detail);
      }
    })

    // 麦克风状态
    client.on('audio-status', (e: IAudioStatus) => {
      console.log("demo get audio status: ", e);

      const { disableMute, muteOperation } = e;

      if (disableMute) {
        setDisableAudio(disableAudio);
      }

      if (muteOperation) {
        setAudio(muteOperation);
      }

      if (muteOperation === "mute" && disableMute) {
        message.info("主持人已强制静音，如需发言，请点击“举手发言”");
      } else if (muteOperation === "mute" && !disableMute) {
        message.info("您已被主持人静音");
      } else if (muteOperation === "unmute" && disableMute) {
        message.info("主持人已允许您发言");
      } else if (muteOperation === "unmute" && !disableMute) {
        message.info("您已被主持人取消静音");
      }
    })

    // 分享content消息
    client.on('content', (e: { data: IRoster }) => {
      if (e.data) {
        message.info("您正在接收共享内容", 3);
      }
    })
  }

  const join = async () => {
    setCallMeeting(true);
    setCallLoading(true);

    let callStatus = true;

    try {
      const { meeting, meetingPassword, meetingName } = user;

      // xyRTC.logger.setLogLevel("NONE");

      client = xyRTC.createClient({
        wssServer: "wss://testdevapi.xylink.com",
        httpServer: "https://testdevapi.xylink.com",
        logServer: "https://txdevlog.xylink.com",
        container: {
          offsetHeight: 92
        }
      });

      initEventListener(client);


      /**
       * 重要提示
       * 重要提示
       * 重要提示
       * 第三方登录，需要填写extId、clientId、clientSecret
       * 重要提示
       * 重要提示
       * 重要提示
       */
      const result = await client.loginExternalAccount({
        displayName: '',
        extId: '',
        clientId: '',
        clientSecret: ''
      });

      if (result.code === 10104) {
        message.info("登录密码错误");

        setCallMeeting(false);
        setCallLoading(false);
        return;
      } else if (result.code !== 200) {
        message.info("登录失败");

        setCallMeeting(false);
        setCallLoading(false);
        return;
      }

      const { token } = result.data;

      callStatus = await client.makeCall({
        token,
        confNumber: meeting,
        password: meetingPassword,
        displayName: meetingName
      });

      if (callStatus) {
        stream = xyRTC.createStream();
        await stream.init();

        client.publish(stream, { isSharePeople: true });
      }

    } catch (err) {
      console.log("入会失败: ", err);

      disconnected(err.msg || "呼叫异常，请稍后重试", 'PEER_NET_DISCONNECT');
    }
  }

  // 表单数据提交
  // 开始进行入会操作
  const handleSubmit = (values: any) => {
    const isSupport = xyRTC.checkSupportWebRTC();

    if (!isSupport) {
      message.info("Not support webrtc");

      return;
    }

    setUser(values);
    store.set("user", values);

    join();
  };

  const onChangeInput = (e: any, type: string) => {
    const inputVal = e.target.value;

    const users = { ...user, [type]: inputVal };
    store.set("user", users);
    setUser(users);
  }

  // 摄像头操作
  const videoOperate = () => {
    if (video === 'unmuteVideo') {
      client.muteVideo();

      setVideo('muteVideo');
    } else {
      client.unmuteVideo();

      setVideo('unmuteVideo');
    }
  }

  // 麦克风操作
  const audioOperate = () => {
    if (audio === "mute" && disableAudio) {
      return;
    }

    if (audio === 'unmute') {
      client.muteAudio();

      setAudio('mute');
    } else {
      client.unmuteAudio();

      setAudio('unmute');
    }
  }

  // 上传呼叫日志
  const upload = async () => {
    const result = await xyRTC.logger.uploadLog(user.meetingName);

    if (result) {
      message.info("上传成功");
    } else {
      message.info("上传失败");
    }
  }

  // 下载呼叫数据到本地
  const download = async () => {
    await xyRTC.logger.downloadLog();
  }

  // 切换布局
  const switchLayout = () => {
    client.switchLayout();

    if (layoutModel === "speaker") {
      setLayoutModel("gallery");
    } else {
      setLayoutModel("speaker");
    }
  }

  const { rateWidth, rateHeight } = screenInfo;
  let layoutStyle = {
    width: rateWidth + 'px',
    height: rateHeight + 'px'
  };

  if (layout[0] && layout[0].position[2] === 1 && layout[0].position[3] === 1) {
    layoutStyle = {
      width: '100%',
      height: '100%'
    };
  }

  const renderAudioList = () => {
    return audioList.map((item: IAudioTrack) => {
      const id = item.data.streams[0].id;
      const muted = item.status === "local";

      return (
        <Audio item={item} muted={muted} id={id} key={id}></Audio>
      )
    })
  }

  const renderLayout = () => {
    const layoutLen = layout.length;

    return layout
      .filter((item: ILayout) => item.roster.participantId)
      .map((item: ILayout, index: number) => {
        const id = item.roster.participantId;

        const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";
        const isRefresh = layoutLen > 1 && layoutLen === (index + 1);

        return (
          <Video model={layoutModel} item={item} key={id + streamId} index={index} isRefresh={isRefresh}></Video>
        )
      })
  }

  let audioStatus = "unmute";

  if (audio === "unmute") {
    audioStatus = "muteAudio";
  } else if (audio === "mute" && disableAudio) {
    audioStatus = "disabledMuteAudio";
  } else if (audio === "mute" && !disableAudio) {
    audioStatus = "unmuteAudio";
  }

  const renderMeetingLoading = () => {
    if (callMeeting && callLoading) {
      return (
        <div className="loading">
          <div className="loading-content">
            <div className="avatar">
              <img src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png" alt="nemo-avatar" />
            </div>
            <div className="name">正在呼叫 {user.meeting}</div>
            <div className="stop" onClick={() => {
              stop();
            }}>
              <img src="https://cdn.xylink.com/wechatMP/images/end.png" alt="end-call" />
            </div>
          </div>
        </div>
      )
    }

    return null;
  }

  // 切换动态带宽
  const switchAutoBandwidth = () => {
    const status = client.switchAutoBandwidth();

    setAutoBandwidth(status);
  }

  // 停止分享content
  const stopShareContent = () => {
    client.stopShareContent();

    setShareContentStatus(false);
  }

  // 分享content内容
  const shareContent = async () => {
    const result = await stream.createContentStream();

    // 创建分享屏幕stream成功
    if (result.code === 518) {
      setShareContentStatus(true);

      stream.on('start-share-content', () => {
        client.publish(stream, { isShareContent: true });
      })

      stream.on('stop-share-content', () => {
        stopShareContent();
      })
    } else {
      if (result && result.code !== 500) {

        message.info(result.msg || '分享屏幕失败');
        return;
      }
    }
  }

  const renderMeeting = () => {
    if (callMeeting && !callLoading) {
      return (
        <>
          <div className="meeting-header">
            <span>
              {user.meeting}-({participantsCount}人)
            </span>
          </div>

          <div className="meeting-content">
            <div className="meeting-layout" style={layoutStyle}>
              {
                renderLayout()
              }

            </div>
            <div className="audio-list">
              {
                renderAudioList()
              }
            </div>
          </div>

          <div className="meeting-footer">
            <div>
              <span>声量：{micLevel}</span>
            </div>
            <div>
              <Button onClick={() => {
                stop()
              }} type="primary">Stop Call</Button>
            </div>
            <div>
              <Button onClick={audioOperate} type="primary">{audioStatus}</Button>
            </div>
            <div>
              <Button onClick={videoOperate} type="primary">{video === "unmuteVideo" ? "muteVideo" : "unmuteVideo"}</Button>
            </div>
            <div>
              <Button onClick={switchLayout} type="primary">切换布局</Button>
            </div>
            <div>
              <Button onClick={switchAutoBandwidth} type="primary">自动带宽：{autoBandwidth ? 'Yes' : 'No'}</Button>
            </div>
            {
              shareContentStatus ?
                <div>
                  <Button onClick={stopShareContent} type="primary">结束共享</Button>
                </div>
                :
                <div>
                  <Button onClick={shareContent} type="primary">共享</Button>
                </div>
            }
          </div>
        </>
      )
    }

    return null;
  }

  const renderForm = () => {
    if (!callMeeting && !callLoading) {
      return (
        <div className="login">
          <h1>XY RTC DEMO</h1>

          <Row justify="center">
            <Form onFinish={handleSubmit} className="login-form" initialValues={user}>
              <Form.Item
                name="phone"
                rules={[{ required: true, message: 'Please input your phone!' }]}
              >
                <Input
                  type="phone"
                  placeholder="手机号"
                  onChange={(e) => {
                    onChangeInput(e, 'phone')
                  }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input
                  type="text"
                  placeholder="登录密码"
                  onChange={(e) => {
                    onChangeInput(e, 'password')
                  }}
                />
              </Form.Item>
              <Form.Item
                name="meeting"
                rules={[{ required: true, message: 'Please input your meeting id!' }]}
              >
                <Input
                  type="text"
                  placeholder="会议号"
                  onChange={(e) => {
                    onChangeInput(e, 'meeting')
                  }}
                />
              </Form.Item>
              <Form.Item
                name="meetingPassword"
              >
                <Input
                  type="text"
                  placeholder="入会密码"
                  onChange={(e) => {
                    onChangeInput(e, 'meetingPassword')
                  }}
                />
              </Form.Item>

              <Form.Item
                name="meetingName"
                rules={[{ required: true, message: 'Please input your meeting name!' }]}
              >
                <Input
                  type="text"
                  placeholder="入会昵称"
                  onChange={(e) => {
                    onChangeInput(e, 'meetingName')
                  }}
                />
              </Form.Item>

              <Row justify="center">
                <Col span={5}><Button type="primary" htmlType="submit">Make Call</Button></Col>
              </Row>
            </Form>
          </Row>

          <Row justify="center" style={{ marginTop: '50px' }}>
            <Button style={{ marginRight: '20px' }} type="primary" onClick={upload}>上传日志</Button>

            <Button type="primary" onClick={download}>下载日志</Button>
          </Row>

          <div className="hidden">
            <img src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png" alt="1" />
            <img src="https://cdn.xylink.com/wechatMP/images/end.png" alt="2" />
          </div>
        </div>
      )
    }

    return null;
  }

  return (
    <div className="container">
      {
        renderForm()
      }

      {
        renderMeetingLoading()
      }

      {
        renderMeeting()
      }
    </div>
  )
}

export default Home;