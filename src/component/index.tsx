import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  IMeetingAudioStatus,
  IMeetingVideoStatus,
  ISetting,
  IDeviceItem,
  INextDevice,
  IDeviceManagerChangeValue
} from '../type/index';
import { ENV, SERVER, ACCOUNT, THIRD } from '../utils/config';
import { DEFAULT_LOCAL_USER, DEFAULT_DEVICE } from "../enum/index";
import xyRTC from '@xylink/xy-rtc-sdk';
import Video from './Video';
import Audio from './Audio';
import MicLevel from "./MicLevel"
import Internels from './Internels';
import store from '../utils/store';
import Login from './Login';
import Setting from './Setting'
import Barrage from './Barrage'
import '../style/index.scss';

let client: any;
let stream: any;
// auto/custom 两种模式
const LAYOUT = "auto";

function Home() {
  const { phone, password, meeting, meetingPassword, meetingName, muteVideo, muteAudio, localHide } =
    store.get('xy-user') || DEFAULT_LOCAL_USER;

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
    muteAudio,
    localHide
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
  const [audio, setAudio] = useState<'muteAudio' | 'unmuteAudio'>(() => {
    return muteAudio ? 'muteAudio' : 'unmuteAudio';
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
  // 开启content的状态
  const [shareContentStatus, setShareContentStatus] = useState(false);
  // 呼叫数据统计
  const [senderStatus, setSenderStatus] = useState<any>({ sender: {}, receiver: {} });
  // 是否是调试模式（开启则显示所有画面的呼叫数据）
  const [debug, setDebug] = useState(false);
  // 配置环境，第三方集成不需要配置，默认是线上环境
  const [env, setEnv] = useState(ENV);
  const [onhold, setOnhold] = useState(false);

  const [settingVisible, setSettingVisible] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState(DEFAULT_DEVICE.nextDevice);

  const bgmAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // 设置log server
    const { logServer } = SERVER(env);

    xyRTC.logger.setLogServer(logServer);

  }, [env])

  useEffect(() => {
    if (!callLoading && bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
    if (callMeeting && callLoading) {

      xyRTC.setOutputAudioDevice(bgmAudioRef.current, selectedDevice.audioOutput.deviceId || "default");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callMeeting, callLoading]);

  useEffect(() => {
    if (!callLoading && callMeeting && onhold) {
      setTimeout(() => {
        message.info('该会议室已开启等候室，请等待主持人审核');
      }, 1000)
    }
  }, [callMeeting, callLoading, onhold]);

  // 挂断会议
  const disconnected = (msg = '') => {
    message.info(msg);

    stop();
  };

  // 结束会议操作
  const stop = () => {
    // 重置audio、video状态
    setAudio(muteAudio ? 'muteAudio' : 'unmuteAudio');
    setVideo(muteVideo ? 'muteVideo' : 'unmuteVideo');

    // 重置字幕信息
    setSubTitle({ action: 'cancel', content: '' });

    // sdk清理操作
    client && client.destory();

    // 清理组件状
    setCallMeeting(false);
    setCallLoading(false);
    setShareContentStatus(false);
    setDebug(false);
    setLayout([]);
    setSettingVisible(false);

    client = null;
    stream = null;
  };

  // 监听client的内部事件
  const initEventListener = (client: any) => {
    // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
    client.on('disconnected', (e: IDisconnected) => {
      const showMessage = (e.detail && e.detail.message) || '呼叫异常，请稍后重试';

      disconnected(showMessage);
    });

    // 会议成员数量数据
    client.on('participants-count', (e: IParticipantCount) => {
      setParticipantsCount(e.participantsNum);
    });

    client.on('roster', (e: IRoster[]) => {
      console.log('demo get roster message: ', e);
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

    client.on('onhold', (e: boolean) => {
      setOnhold(e);
    })

    // 呼叫状态
    client.on('call-status', (e: ICallStatus) => {
      // 10518入会成功
      // 10519正在呼叫中
      const code = e.code;
      const msg = e.msg;

      if (code === 10518) {
        message.success(msg);
        // 提示
        if (localHide) {
          message.info("已开启隐藏本地画面模式", 5);
        }

        setCallLoading(false);
      } else if (code === 10519) {
        message.info(msg);
      } else {
        disconnected(msg);
      }
    });

    // 麦克风状态
    client.on('meeting-control', (e: IAudioStatus) => {
      const { disableMute, muteOperation } = e;

      setDisableAudio(disableMute);

      if (muteOperation === 'muteAudio' && disableMute) {
        message.info('主持人已强制静音，如需发言，请点击“举手发言”');

        setHandStatus(false);
      } else if (muteOperation === 'muteAudio' && !disableMute) {
        message.info('您已被主持人静音');
      } else if (muteOperation === 'unmuteAudio' && disableMute) {
        message.info('主持人已允许您发言');

        setHandStatus(false);
      } else if (muteOperation === 'unmuteAudio' && !disableMute) {
        message.info('您已被主持人取消静音');
      }
    });

    // 麦克风状态
    client.on('audio-status', (e: IMeetingAudioStatus) => {
      setAudio(e.status);
    });

    // 摄像头状态
    client.on('video-status', (e: IMeetingVideoStatus) => {
      setVideo(e.status)
    })

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
        onHand('handdown');
      }
    });

    // 设备切换
    client.on('device', async (e: IDeviceManagerChangeValue) => {
      const { audioInput, videoInput, audioOutput } = e.nextDevice;

      videoInput && message.info(`视频设备已自动切换至 ${videoInput.label}`);
      audioInput && message.info(`音频输入设备已自动切换至 ${audioInput.label}`);
      setTimeout(() => {
        audioOutput && message.info(`音频输出设备已自动切换至 ${audioOutput.label}`);
      }, 500);
    });
  };

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
        localHide,
        // 使用哪一种布局方式：
        // auto：自动布局，第三方只需要监听layout回调消息即可渲染布局和视频画面
        // custom：自定义布局，自定义控制参会成员的位置和画面质量
        layout: LAYOUT,
        container: {
          offset: [32, 60, 0, 0] // 上 下 左 右
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

      const token = result.data.token?.access_token || result.data.access_token;

      callStatus = await client.makeCall({
        token,
        confNumber: meeting,
        password: meetingPassword,
        displayName: meetingName
      });

      if (callStatus) {
        stream = xyRTC.createStream();

        initStreamEventListener(stream);

        const { audioInput, audioOutput, videoInput } = selectedDevice;

        await stream.init({
          devices: {
            audioInputValue: audioInput.deviceId || 'default',
            audioOutputValue: audioOutput.deviceId || 'default',
            videoInValue: videoInput.deviceId || ''
          }
        });

        client?.publish(stream, { isSharePeople: true });
      }
    } catch (err) {
      disconnected(err.msg || '呼叫异常，请稍后重试');
    }
  };

  const initStreamEventListener = (stream: any) => {
    stream.on('stream-status', (e: { type: string }) => {
      const { type } = e;

      if (type === 'SEND_ONLY') {
        setTimeout(() => {
          message.info("当前仅接收远端画面模式", 5);
        }, 3000);
      }
    })
  }

  // 表单数据提交
  // 开始进行入会操作
  const handleSubmit = () => {
    const isSupport = xyRTC.checkSupportWebRTC();

    if (!isSupport) {
      message.info('Not support webrtc');

      return;
    }

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
      setAudio(value ? "muteAudio" : "unmuteAudio");
    }
  };

  // 摄像头操作
  const videoOperate = async () => {
    try {
      let result: 'muteVideo' | 'unmuteVideo' = 'muteVideo';

      if (video === 'unmuteVideo') {
        result = await client.muteVideo();
      } else {
        result = await client.unmuteVideo();
      }

      setVideo(result);
    } catch (err) {
      const msg = err?.detail?.msg || "禁止操作";
      const code = err?.detail?.code;

      if (code === 401) {
        message.error("当前摄像头或麦克风设备异常，请切换其他设备");
      } else {
        message.error("操作失败: " + msg);
      }
    }
  };

  // 麦克风操作
  const onAudioOperate = async () => {
    try {
      let result: 'muteAudio' | 'unmuteAudio' = 'muteAudio';

      if (audio === 'unmuteAudio') {
        result = await client.muteAudio();

        message.info('麦克风已静音');
      } else {
        result = await client.unmuteAudio();
      }
      setAudio(result);
    } catch (err) {
      const msg = err?.detail?.msg || "禁止操作";
      const code = err?.detail?.code;

      if (code === 401) {
        message.error("当前摄像头或麦克风设备异常，请切换其他设备");
      } else {
        message.error("操作失败: " + msg);
      }
    }
  };

  // 取消举手
  const onHand = async (type: 'handup' | 'handdown' | 'mute') => {
    const funcMap = {
      handup: {
        func: "onHandUp",
        msg: "发言请求已发送"
      },
      handdown: {
        func: "onHandDown",
        msg: ""
      },
      mute: {
        func: "onMute",
        msg: ""
      }
    }

    try {
      const { func, msg } = funcMap[type];
      const handStatus = await client[func]();

      setHandStatus(handStatus);
      if (msg) {
        message.info(msg);
      }
    } catch (err) {
      message.info('操作失败');
    }
  }

  // 麦克风操作
  const audioOperate = async () => {
    if (audio === 'muteAudio' && disableAudio && !handStatus) {
      await onHand('handup');
      return;
    }

    if (audio === 'muteAudio' && disableAudio && handStatus) {
      await onHand('handdown');
      return;
    }

    if (audio === 'unmuteAudio' && disableAudio) {
      await onHand('mute');
      return;
    }

    onAudioOperate();
  };

  // 上传呼叫日志
  const upload = async () => {
    const result = await xyRTC.logger.uploadLog(user.meetingName, user.phone);

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
  const switchLayout = async () => {
    const modal = await client.switchLayout();

    setLayoutModel(modal.toLowerCase());
  };

  const layoutStyle = useMemo(() => {
    const { rateWidth, rateHeight } = screenInfo;
    const layoutStyle = {
      width: rateWidth + 'px',
      height: rateHeight + 'px'
    };

    return layoutStyle;
  }, [screenInfo]);

  const renderAudioList = () => {
    return audioList.map((item: IAudioTrack) => {
      const streamId = item.data.streams[0].id;
      const muted = item.status === 'local';

      return <Audio muted={muted} key={streamId} streamId={streamId} client={client} />;
    });
  };

  const renderLayout = () => {
    return layout
      .filter((item: ILayout) => item.roster.participantId)
      .map((item: ILayout) => {
        const id = item.roster.id;

        return (
          <Video
            client={client}
            model={layoutModel}
            item={item}
            key={id}
            id={id}
          ></Video>
        );
      });
  };

  let audioStatus = '取消静音';

  if (audio === 'unmuteAudio') {
    audioStatus = disableAudio ? '结束发言' : '静音';
  } else if (audio === 'muteAudio') {
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

    return <img src="https://cdn.xylink.com/wechatMP/images/meeting_bg.png" style={{ "display": "none" }} alt="" />;
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
      if (result) {
        setShareContentStatus(true);

        stream.on('start-share-content', () => {
          client.publish(stream, { isShareContent: true });
        });

        stream.on('stop-share-content', () => {
          stopShareContent();
        });
      } else {
        message.info("分享屏幕失败");
      }
    } catch (err) {
      if (err && err.code !== 500) {
        message.info(err.msg || '分享屏幕失败');
      }
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

  const toggleLocal = async () => {
    const { status } = await client.toggleLocal();
    const msg = status ? "已开启隐藏本地画面模式" : "已关闭隐藏本地画面模式";
    message.info(msg);
  }

  const switchDevice = async (key: 'audioInput' | 'audioOutput' | 'videoInput' | string, device: IDeviceItem) => {
    const deviceMap: any = {
      audioInput: {
        key: "audio",
        zh_text: "音频输入设备"
      },
      audioOutput: {
        key: "video",
        zh_text: "音频输出设备"
      },
      videoInput: {
        key: "video",
        zh_text: "视频设备"
      }
    }

    const { deviceId, label } = device;
    try {
      if (key === 'audioOutput') {
        await stream.setAudioOutput(deviceId);
      } else if (
        (key === 'audioInput')
        ||
        (key === 'videoInput')
      ) {
        await stream.switchDevice(deviceMap[key]['key'], deviceId);
      }
      message.info(`${deviceMap[key]["zh_text"]}已自动切换至 ${label}`);
    } catch (err) {
      message.error('设备切换失败');
      return Promise.reject(err);
    }
  }

  const onSwitchDevice = async (nextDevice: INextDevice) => {
    const { audioInput, videoInput, audioOutput } = nextDevice || DEFAULT_DEVICE.nextDevice;

    try {
      if (audioInput?.deviceId !== selectedDevice?.audioInput?.deviceId) {
        await switchDevice("audioInput", audioInput);
      }

      if (audioOutput?.deviceId !== selectedDevice?.audioOutput?.deviceId) {
        await switchDevice("audioOutput", audioOutput);
      }

      if (videoInput?.deviceId !== selectedDevice?.videoInput?.deviceId) {
        await switchDevice("videoInput", videoInput);
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  const onSaveSetting = async (data: ISetting) => {
    if (data['selectedDevice']) {
      onToggleSetting();

      try {
        if (stream) {
          await onSwitchDevice(data['selectedDevice']);
        }
        setSelectedDevice(data.selectedDevice);
      } catch (err) { }
    }

    if (data.hasOwnProperty('localHide')) {

      onChangeInput(data['localHide'], 'localHide');

      if (client) {
        toggleLocal();
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
              <MicLevel stream={stream} audio={audio} />
            </div>
            <div>
              <Button onClick={onToggleSetting} type="primary" size="small">
                设置
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
      <Menu.Item key="TXQA">
        <div>TXQA</div>
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
              <span style={{ marginRight: '18px' }}>
                {env}
                <DownOutlined />
              </span>
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
          setting={{ localHide, selectedDevice }}
          visible={settingVisible}
          onCancel={onToggleSetting}
          onSetting={onSaveSetting}
        />
      }
    </div>
  );
}


export default Home;
