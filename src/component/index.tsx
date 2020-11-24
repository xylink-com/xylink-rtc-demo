
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Row, message, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import {
  IDisconnected,
  IParticipantCount,
  ILayout,
  IScreenInfo,
  IAudioTrack,
  ICallStatus,
  IAudioStatus,
  IRoster,
  ISubTitleContent,
  IDevices,
  IChoosedSettingDevice
} from '../type/index';
import { ENV, SERVER, ACCOUNT, THIRD } from '../utils/config';
import xyRTC from '@xylink/xy-rtc-sdk';
import Video from './Video';
import Audio from './Audio';
import Internels from './Internels';
import store from '../utils/store';
import Login from './Login';
import Setting from './Setting'
import Barrage from './Barrage'
import '../style/index.scss';

let client: any;
let stream: any;
let audioLevelTimmer: any;
const DEFAULT_DEVICES = {
  audioInputList: [],
  audioOutputList: [],
  videoInList: []
};

function Home() {
  const { phone = '', password = '', meeting = '', meetingPassword = '', meetingName = '', muteVideo = false, muteAudio = false }: any =
    store.get('xy-user') || {};

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
    meetingName,
    muteVideo,
    muteAudio
  });
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
  const [video, setVideo] = useState<'muteVideo' | 'unmuteVideo'>(() => {
    return muteVideo ? 'muteVideo' : 'unmuteVideo';
  });

  // 麦克风状态
  const [audio, setAudio] = useState<'mute' | 'unmute'>(() => {
    return muteAudio ? 'mute' : 'unmute';
  });
  // 是否强制静音
  const [disableAudio, setDisableAudio] = useState(false);
  // 举手状态
  const [handStatus, setHandStatus] = useState(false);
  // 是否有字幕或点名
  const [subTitle, setSubTitle] = useState<ISubTitleContent>({ action: 'cancel', content: '' });
  // 桌面布局模式（语音激励模式/画廊模式）
  const [layoutModel, setLayoutModel] = useState('speaker');
  // 会议成员数量
  const [participantsCount, setParticipantsCount] = useState(0);
  // 音量等级
  const [micLevel, setMicLevel] = useState(0);
  // 开启content的状态
  const [shareContentStatus, setShareContentStatus] = useState(false);
  // 呼叫数据统计
  const [senderStatus, setSenderStatus] = useState<any>({ sender: {}, receiver: {} });
  // 是否是调试模式（开启则显示所有画面的呼叫数据）
  const [debug, setDebug] = useState(false);
  // 配置环境，第三方集成不需要配置，默认是线上环境
  const [env, setEnv] = useState(ENV);

  const [settingVisible, setSettingVisible] = useState(false);

  const bgmAudioRef = useRef<HTMLAudioElement>(null);

  // pre devices
  const preDevicesRef = useRef<{ audioInput: any, videoIn: any }>(null);

  // 缓存清理声量的timmer定时器函数
  const clearTimmer = useCallback(() => {
    audioLevelTimmer && clearInterval(audioLevelTimmer);
    audioLevelTimmer = null;
  }, []);

  // 获取实时音量大小
  useEffect(() => {
    // 呼叫成功时，开始获取实时音量
    if (callMeeting && !callLoading) {
      if (audio === 'unmute') {
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
    };
  }, [audio, callMeeting, callLoading]);

  useEffect(() => {
    if (!callLoading && bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
    if (callMeeting && callLoading) {
      const devices = store.get("xy-devices") || { audioOutputValue: "default" }
      xyRTC.setOutputAudioDevice(bgmAudioRef.current, devices.audioOutputValue);
      // bgmAudioRef.current.play();
    }
  }, [callMeeting, callLoading]);

  // 挂断会议
  const disconnected = (msg = '', reason?: string) => {
    message.info(msg);

    stop(reason);
  };

  // 结束会议操作
  const stop = (reason: string = 'OK') => {
    clearStorage();

    // 重置audio、video状态
    setAudio(muteAudio ? 'mute' : 'unmute');
    setVideo(muteVideo ? 'muteVideo' : 'unmuteVideo');

    // 重置字幕信息
    setSubTitle({ action: 'cancel', content: '' });

    // sdk清理操作
    stream && stream.close();
    client && client.close(reason);

    // 清理组件状
    setCallMeeting(false);
    setCallLoading(false);
    setShareContentStatus(false);
    setDebug(false);
    setLayout([]);
    setMicLevel(0);

    // 清理定时器
    clearTimmer();
    client = null;
    stream = null;
  };

  const clearStorage = () => {
    store.remove("xy-devices");
    store.remove("xy-deviceList");
  }

  // 监听client的内部事件
  const initEventListener = (client: any) => {
    // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
    client.on('disconnected', (e: IDisconnected) => {
      const showMessage = (e.detail && e.detail.message) || '呼叫异常，请稍后重试';

      disconnected(showMessage, 'EXPIRED');
    });

    // 会议成员数量数据
    client.on('participants-count', (e: IParticipantCount) => {
      setParticipantsCount(e.participantsNum);
    });

    // 会议layout数据
    client.on('layout', (e: ILayout[]) => {
      setLayout(e);
    });

    // 动态计算的显示容器信息
    client.on('screen-info', (e: IScreenInfo) => {
      setScreenInfo(e);
    });

    // audio list数据
    client.on('audio-track', (e: IAudioTrack[]) => {
      setAudioList(e);
    });

    // 呼叫状态
    client.on('call-status', (e: ICallStatus) => {
      // 10518入会成功
      // 10519正在呼叫中
      // 呼叫失败，请将detail信息作为disconnected的第二个参数
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
    });

    // 麦克风状态
    client.on('audio-status', (e: IAudioStatus) => {
      const { disableMute, muteOperation } = e;
      // if (disableMute) {
      //   setDisableAudio(disableMute);
      // }
      setDisableAudio(disableMute);

      if (muteOperation) {
        setAudio(muteOperation);
      }

      if (muteOperation === 'mute' && disableMute) {
        message.info('主持人已强制静音，如需发言，请点击“举手发言”');

        setHandStatus(false);
      } else if (muteOperation === 'mute' && !disableMute) {
        message.info('您已被主持人静音');
      } else if (muteOperation === 'unmute' && disableMute) {
        message.info('主持人已允许您发言');
        setHandStatus(false);
      } else if (muteOperation === 'unmute' && !disableMute) {
        message.info('您已被主持人取消静音');
      }
    });

    // 分享content消息
    client.on('content', (e: { data: IRoster }) => {
      if (e.data) {
        message.info('您正在接收共享内容', 3);
      }
    });

    client.on('meeting-stats', (e: any) => {
      setSenderStatus(e);
    });

    // 字幕、点名消息
    client.on('sub-title', (e: ISubTitleContent) => {
      setSubTitle(e);
    });

    // 清除举手
    client.on('cancel-handup', (e: boolean) => {
      if (e) {
        onHandDown();
      }
    });

    // 设备切换
    client.on('devices', async (e: any) => {
      if (e && e.detail) {
        const nextDevices: IDevices = e.detail || DEFAULT_DEVICES;
        const preDevices = store.get("xy-deviceList") || DEFAULT_DEVICES;
        // pre 设备
        // @ts-ignore
        const { videoIn: preVideoIn, audioInput: preAudioInput } = preDevicesRef.current;
        // 当前连接设备
        const { videoIn: nextVideoIn, audioInput: nextAudioInput, audioOutput } = xyRTC.diffDevices(preDevices, nextDevices);

        nextVideoIn && message.info(`视频设备已自动切换至 ${nextVideoIn.label}`);
        nextAudioInput && message.info(`音频输入设备已自动切换至 ${nextAudioInput.label}`);
        audioOutput && message.info(`音频输出设备已自动切换至 ${audioOutput.label}`);

        if (nextAudioInput && nextAudioInput.deviceId !== preAudioInput.deviceId) {
          console.log('switch audio device:::', nextAudioInput.deviceId);
          try {
            stream.switchDevice('audio', nextAudioInput.deviceId);
            // @ts-ignore
            preDevicesRef.current.audioInput = nextAudioInput;
          } catch (err) {
            stream.switchDevice('audio', undefined);
          }
        }

        if (nextVideoIn && nextVideoIn.deviceId !== preVideoIn.deviceId) {
          console.log('switch video device:::', nextVideoIn.deviceId);
          try {
            stream.switchDevice('video', nextVideoIn.deviceId);
            // @ts-ignore
            preDevicesRef.current.videoIn = nextVideoIn;
          } catch (err) {
            stream.switchDevice('video', undefined);
          }
        }

        if (audioOutput) {
          const devices = store.get("xy-devices");

          store.set("xy-devices", {
            ...devices,
            audioOutputValue: audioOutput.deviceId
          })
        }

        store.set("xy-deviceList", nextDevices);
      }
    });
  };

  // 通过stream获取设备信息
  const updateDevicesByStream = async (stream: any) => {
    if (stream && stream.localStream && stream.localStream.stream) {

      const tempLocalStream = stream.localStream.stream.clone();

      const audioTrack = tempLocalStream.getAudioTracks()[0];
      const videoTrack = tempLocalStream.getVideoTracks()[0];

      const audioInput = audioTrack.getSettings();
      const videoIn = videoTrack.getSettings();

      // @ts-ignore
      preDevicesRef.current = {
        audioInput: {
          ...audioInput,
          label: audioTrack.label
        },
        videoIn: {
          ...videoIn,
          label: videoTrack.label
        }
      }
      const deviceList = await xyRTC.getDevices();
      store.set('xy-deviceList', deviceList);
    }

  }

  const join = async () => {
    setCallMeeting(true);
    setCallLoading(true);

    let callStatus = true;

    try {
      const { meeting, meetingPassword, meetingName, muteAudio, muteVideo } = user;
      const { wssServer, httpServer, logServer } = SERVER(env);

      // 这里三方可以根据环境修改sdk log等级
      // xyRTC.logger.setLogLevel("NONE");

      client = xyRTC.createClient({
        // 注意，第三方集成时，默认是prd环境，不需要配置wss/http/log server地址；
        wssServer,
        httpServer,
        logServer,
        muteAudio,
        muteVideo,
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
        const { extId, clientId, clientSecret } = ACCOUNT(env);

        result = await client.loginExternalAccount({
          // 用户名自行填写
          displayName: 'thirdName',
          extId,
          clientId,
          clientSecret
        });
      } else {
        const { clientId } = ACCOUNT(env);
        // 小鱼登录
        result = await client.loginXYlinkAccount(
          user.phone,
          user.password,
          clientId
        );
      }

      if (result.code === 10104) {
        message.info('登录密码错误');

        setCallMeeting(false);
        setCallLoading(false);
        return;
      } else if (result.code !== 200) {
        message.info('登录失败');

        setCallMeeting(false);
        setCallLoading(false);
        return;
      }

      const token = result.data.token || result.data.access_token;

      callStatus = await client.makeCall({
        token,
        confNumber: meeting,
        password: meetingPassword,
        displayName: meetingName
      });

      if (callStatus) {
        stream = xyRTC.createStream();

        const devices = store.get("xy-devices") || {
          audioInputValue: 'default',
          videoInValue: ''
        };

        await stream.init({ devices });

        client.publish(stream, { isSharePeople: true });

        // 记录入会时的设备信息
        updateDevicesByStream(stream);
      }
    } catch (err) {
      console.log('入会失败: ', err);

      disconnected(err.msg || '呼叫异常，请稍后重试', 'PEER_NET_DISCONNECT');
    }
  };

  // 表单数据提交
  // 开始进行入会操作
  const handleSubmit = (values: any) => {
    // const isSupport = xyRTC.checkSupportWebRTC();

    // if (!isSupport) {
    //   message.info('Not support webrtc');

    //   return;
    // }

    // setUser(values);
    // store.set('xy-user', values);

    join();
  };

  const onChangeInput = (value: any, type: string) => {
    const inputVal = value;

    const users = { ...user, [type]: inputVal };
    store.set('xy-user', users);
    setUser(users);

    if (type === "muteVideo") {
      setVideo(value ? "muteVideo" : "unmuteVideo");
    }

    if (type === "muteAudio") {
      setAudio(value ? "mute" : "unmute");
    }
  };

  // 摄像头操作
  const videoOperate = () => {
    if (video === 'unmuteVideo') {
      client.muteVideo();

      setVideo('muteVideo');
    } else {
      client.unmuteVideo();

      setVideo('unmuteVideo');
    }
  };

  // 取消举手
  const onHandDown = async () => {
    const isHandStatus = await client.onHandDown();
    setHandStatus(isHandStatus);
  };

  // 麦克风操作
  const audioOperate = async () => {
    if (audio === 'mute' && disableAudio && !handStatus) {
      const isHandStatus = await client.onHandUp();
      setHandStatus(isHandStatus);
      message.info('发言请求已发送');
      return;
    }

    if (audio === 'mute' && disableAudio && handStatus) {
      await onHandDown();
      return;
    }

    if (audio === 'unmute' && disableAudio) {
      const isHandStatus = await client.onMute();
      setHandStatus(isHandStatus);
      return;
    }

    if (audio === 'unmute') {
      client.muteAudio();

      setAudio('mute');

      message.info('麦克风已静音');
    } else {
      client.unmuteAudio();

      setAudio('unmute');
    }
  };

  // 上传呼叫日志
  const upload = async () => {
    const result = await xyRTC.logger.uploadLog(user.meetingName);

    if (result) {
      message.info('上传成功');
    } else {
      message.info('上传失败');
    }
  };

  // 下载呼叫数据到本地
  const download = async () => {
    await xyRTC.logger.downloadLog();
  };

  // 切换布局
  const switchLayout = () => {
    const modal = client.switchLayout().toLowerCase();

    setLayoutModel(modal);
  };

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
    const devices = store.get("xy-devices") || { audioOutputValue: "default" }

    return audioList.map((item: IAudioTrack) => {
      const id = item.data.streams[0].id;
      const muted = item.status === 'local';

      return <Audio item={item} muted={muted} key={id} audioOutput={devices.audioOutputValue || ""} />;
    });
  };

  const renderLayout = () => {
    const layoutLen = layout.length;

    return layout
      .filter((item: ILayout) => item.roster.participantId)
      .map((item: ILayout, index: number) => {
        const id = item.roster.endpointId;
        const mediagroupid = item.roster.mediagroupid;
        const streamId = (item.stream && item.stream.video && item.stream.video.id) || '';
        const key = id + streamId + mediagroupid;
        const isRefresh = layoutLen > 1 && layoutLen === index + 1;

        return (
          <Video
            model={layoutModel}
            item={item}
            key={key}
            index={index}
            videoId={key}
            isRefresh={isRefresh}
          ></Video>
        );
      });
  };

  let audioStatus = '取消静音';

  if (audio === 'unmute') {
    audioStatus = disableAudio ? '结束发言' : '静音';
  } else if (audio === 'mute') {
    if (disableAudio) {
      audioStatus = handStatus ? '取消举手' : '举手发言';
    } else {
      audioStatus = '取消静音';
    }
  }

  const renderMeetingLoading = () => {
    if (callMeeting && callLoading) {
      return (
        <div className="loading">
          <div className="loading-content">
            <div className="avatar">
              <img
                src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png"
                alt="nemo-avatar"
              />
            </div>
            <div className="name">正在呼叫 {user.meeting}</div>
            <div
              className="stop"
              onClick={() => {
                stop();
              }}
            >
              <img src="https://cdn.xylink.com/wechatMP/images/end.png" alt="end-call" />
            </div>
            <audio
              ref={bgmAudioRef}
              autoPlay
              loop
              src="https://cdn.xylink.com/wechatMP/ring.ogg"
            ></audio>
          </div>
        </div>
      );
    }

    return null;
  };

  // 停止分享content
  const stopShareContent = () => {
    client.stopShareContent();

    setShareContentStatus(false);
  };

  // 分享content内容
  const shareContent = async () => {
    try {
      const result = await stream.createContentStream();

      // 创建分享屏幕stream成功
      if (result.code === 518) {
        setShareContentStatus(true);

        stream.on('start-share-content', () => {
          client.publish(stream, { isShareContent: true });
        });

        stream.on('stop-share-content', () => {
          stopShareContent();
        });
      } else {
        if (result && result.code !== 500) {
          message.info(result.msg || '分享屏幕失败');
          return;
        }
      }
    } catch (err) {
      console.log('share screen error: ', err);
    }
  };

  const switchDebug = () => {
    const status = !debug;

    setDebug(status);
    client.switchDebug(status);
  };

  const handleSwitchEnv = (e: any) => {
    const val = e.key;

    store.set('xy-sdk-env', val);
    setEnv(val);
  };

  const onToggleSetting = () => {
    setSettingVisible(!settingVisible);
  }

  const onSaveSetting = (devices: IChoosedSettingDevice, deviceList: IDevices) => {
    store.set("xy-devices", devices);
    store.set("xy-deviceList", deviceList);

    onToggleSetting();
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
              {renderLayout()}
            </div>

            <div className="audio-list">{renderAudioList()}</div>

            <Barrage subTitle={subTitle} />
          </div>

          <div className="meeting-footer">
            <div>
              <Button
                onClick={() => {
                  stop();
                }}
                type="primary"
                size="small"
              >
                挂断
              </Button>
            </div>
            <div>
              <Button onClick={audioOperate} type="primary" size="small">
                {audioStatus}
              </Button>
            </div>
            <div>
              <Button onClick={videoOperate} type="primary" size="small">
                {video === 'unmuteVideo' ? '关闭摄像头' : '开启摄像头'}
              </Button>
            </div>
            <div>
              <Button onClick={switchLayout} type="primary" size="small">
                切换布局
              </Button>
            </div>
            <div>
              <Button onClick={switchDebug} type="primary" size="small">
                调试：{debug ? 'Yes' : 'No'}
              </Button>
            </div>
            {shareContentStatus ? (
              <div>
                <Button onClick={stopShareContent} type="primary" size="small">
                  结束共享
                </Button>
              </div>
            ) : (
                <div>
                  <Button onClick={shareContent} type="primary" size="small">
                    共享
                </Button>
                </div>
              )}
            <div>
              <Button style={{ width: '90px' }} type="primary" size="small">
                声量：{micLevel}
              </Button>
            </div>
          </div>

          <Internels
            debug={debug}
            senderStatus={senderStatus}
            switchDebug={switchDebug}
          ></Internels>
        </>
      );
    }

    return null;
  };

  const menu = (
    <Menu onClick={handleSwitchEnv}>
      <Menu.Item key="TXDEV">
        <div>TXDEV</div>
      </Menu.Item>
      <Menu.Item key="PRE">
        <div>PRE</div>
      </Menu.Item>
      <Menu.Item key="PRD">
        <div>PRD</div>
      </Menu.Item>
    </Menu>
  );

  const renderForm = () => {
    if (!callMeeting && !callLoading) {
      return (
        <div className="login">
          <h1 className="title">XY RTC DEMO</h1>
          <div className="sub-title">
            <span>设置环境：</span>
            <Dropdown overlay={menu}>
              <a style={{ marginRight: '18px' }}>
                {env}
                <DownOutlined />
              </a>
            </Dropdown>
            <Button size="small" type="text" onClick={upload}>
              上传日志
            </Button>

            <Button size="small" type="text" onClick={download}>
              下载日志
            </Button>
          </div>

          <Row justify="center">
            <Login
              isThird={isThird}
              onHandleSubmit={handleSubmit}
              user={user}
              onChangeInput={onChangeInput}
            ></Login>
          </Row>

          <div className="setting">
            <span style={{ cursor: 'pointer' }} onClick={onToggleSetting}>设置</span>
          </div>
        </div>
      );
    }

    return null;
  };



  return (
    <div className="container">
      {renderForm()}

      {renderMeetingLoading()}

      {renderMeeting()}

      {
        settingVisible &&
        <Setting
          visible={settingVisible}
          onCancel={onToggleSetting}
          onOK={onSaveSetting}
        />
      }
    </div>
  );
}

export default Home;
