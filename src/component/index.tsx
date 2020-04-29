
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Row, message } from 'antd';
import { IDisconnected, IParticipantCount, ILayout, IScreenInfo, IAudioTrack, ICallStatus, IAudioStatus, IRoster } from '../type/index';
import { ENV, SERVER, ACCOUNT, THIRD } from '../utils/config';
import xyRTC from 'xy-rtc-sdk';
import Video from './video';
import Audio from './audio';
import Internels from './Internels';
import store from '../utils/store';
import Login from './Login';

import '../style/index.scss';

let client: any;
let stream: any;
let audioLevelTimmer: any;

function Home() {
  const { phone = "", password = "", meeting = "", meetingPassword = "", meetingName = "" }: any = store.get("user") || {};

  // 是否是第三方Demo版本
  const [isThird] = useState(THIRD);
  // 呼叫状态
  const [callMeeting, setCallMeeting] = useState(false);
  // 是否呼叫中
  const [callLoading, setCallLoading] = useState(false);
  // 登录/呼叫数据
  const [user, setUser] = useState({
    phone,
    password,
    meeting,
    meetingPassword,
    meetingName
  })
  // 参会成员数据，包含stream，roster，postion等信息，最终依赖layout的数据进行画面布局、渲染、播放、状态显示
  const [layout, setLayout] = useState<any>([]);
  // screen容器信息
  const [screenInfo, setScreenInfo] = useState({
    rateWidth: 0,
    rateHeight: 0
  });
  // 所有声源列表
  const [audioList, setAudioList] = useState<any>([]);
  // 摄像头状态
  const [video, setVideo] = useState('unmuteVideo');
  // 麦克风状态
  const [audio, setAudio] = useState('unmute');
  // 是否强制静音
  const [disableAudio, setDisableAudio] = useState(false);
  // 桌面布局模式（语音激励模式/画廊模式）
  const [layoutModel, setLayoutModel] = useState('speaker');
  // 会议成员数量
  const [participantsCount, setParticipantsCount] = useState(0);
  // 自动带宽调整，默认为开启
  const [autoBandwidth, setAutoBandwidth] = useState(true);
  // 音量等级
  const [micLevel, setMicLevel] = useState(0);
  // 开启content的状态
  const [shareContentStatus, setShareContentStatus] = useState(false);
  // 呼叫数据统计
  const [senderStatus, setSenderStatus] = useState<any>({ sender: {}, receiver: {} });
  // 是否是调试模式（开启则显示所有画面的呼叫数据）
  const [debug, setDebug] = useState(false);

  // 缓存清理声量的timmer定时器函数
  const clearTimmer = useCallback(() => {
    audioLevelTimmer && clearInterval(audioLevelTimmer);
    audioLevelTimmer = null;
  }, [])

  // 获取实时音量大小
  useEffect(() => {
    // 呼叫成功时，开始获取实时音量
    if (callMeeting && !callLoading) {
      if (audio === "unmute") {
        if (!audioLevelTimmer) {
          audioLevelTimmer = setInterval(() => {
            if (stream) {
              const level = stream.getAudioLevel();

              // 更新Audio的实时音量显示
              setMicLevel(level);
            }
          }, 500);
        }
      } else {
        clearTimmer();
        setMicLevel(0);
      }
    } else {
      clearTimmer();
      setMicLevel(0);
    }

    return () => {
      // 组件卸载时，清理定时器
      clearTimmer();
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

    // 清理组件状
    setCallMeeting(false);
    setCallLoading(false);
    setShareContentStatus(false);
    setLayout([]);
    setMicLevel(0);

    // 清理定时器
    clearTimmer();
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

      setLayout(e);
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

    client.on('sender-status', (e: any) => {
      console.log("senders event: ", e);

      setSenderStatus(e);
    })
  }

  const join = async () => {
    setCallMeeting(true);
    setCallLoading(true);

    let callStatus = true;

    try {
      const { meeting, meetingPassword, meetingName } = user;
      const { wssServer, httpServer, logServer } = SERVER;

      // 这里三方可以根据环境修改sdk log等级
      // xyRTC.logger.setLogLevel("NONE");

      client = xyRTC.createClient({
        // 注意，第三方集成时，默认是prd环境，不需要配置wss/http/log server地址；
        wssServer,
        httpServer,
        logServer,
        debug: false,
        container: {
          offsetHeight: 92
        }
      });

      initEventListener(client);

      /**
       * 重要提示
       * 重要提示
       * 重要提示
       * 第三方登录，请在config配置文件里面配置企业账户信息
       * 重要提示
       * 重要提示
       * 重要提示
       */
      let result;

      if (isThird) {
        const { extId, clientId, clientSecret } = ACCOUNT;

        result = await client.loginExternalAccount({
          // 用户名自行填写
          displayName: 'thirdName',
          extId,
          clientId,
          clientSecret
        });
      }

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
        const mediagroupid = item.roster.mediagroupid;

        const streamId = (item.stream && item.stream.video && item.stream.video.id) || "";
        const isRefresh = layoutLen > 1 && layoutLen === (index + 1);

        return (
          <Video model={layoutModel} item={item} key={id + streamId + mediagroupid} index={index} isRefresh={isRefresh}></Video>
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

  const switchDebug = () => {
    const status = !debug;

    setDebug(status);
    client.switchDebug(status);
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

            <Internels debug={debug} senderStatus={senderStatus} switchDebug={switchDebug}></Internels>
          </div>

          <div className="meeting-footer">
            <div>
              <Button onClick={() => {
                stop()
              }} type="primary" size="small">Stop Call</Button>
            </div>
            <div>
              <Button onClick={audioOperate} type="primary" size="small">{audioStatus}</Button>
            </div>
            <div>
              <Button onClick={videoOperate} type="primary" size="small">{video === "unmuteVideo" ? "muteVideo" : "unmuteVideo"}</Button>
            </div>
            <div>
              <Button onClick={switchLayout} type="primary" size="small">切换布局</Button>
            </div>
            <div>
              <Button onClick={switchAutoBandwidth} type="primary" size="small">自动带宽：{autoBandwidth ? 'Yes' : 'No'}</Button>
            </div>
            <div>
              <Button onClick={switchDebug} type="primary" size="small">调试：{debug ? 'Yes' : 'No'}</Button>
            </div>
            {
              shareContentStatus ?
                <div>
                  <Button onClick={stopShareContent} type="primary" size="small">结束共享</Button>
                </div>
                :
                <div>
                  <Button onClick={shareContent} type="primary" size="small">共享</Button>
                </div>
            }
            <div>
              <Button style={{ width: '90px' }} type="primary" size="small">声量：{micLevel}</Button>
            </div>
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
          <h1>XY RTC DEMO（{ENV}）</h1>

          <Row justify="center">
            <Login isThird={isThird} onHandleSubmit={handleSubmit} user={user} onChangeInput={onChangeInput}></Login>
          </Row>

          <Row justify="center" style={{ marginTop: '50px' }}>
            <Button style={{ marginRight: '20px' }} type="primary" onClick={upload}>上传日志</Button>

            <Button type="primary" onClick={download}>下载日志</Button>
          </Row>
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
