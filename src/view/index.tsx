import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { message, Modal } from 'antd';
import cloneDeep from 'clone-deep';
import xyRTC, {
  Client,
  Stream,
  getLayoutRotateInfo,
  ILayout,
  IScreenInfo,
  IStatus,
  IMeetingControl,
  IRoster,
  ISubTitleContent,
  ISelectedDevice,
  IDeviceInfo,
  ICurrentPermission,
  IMode,
  IReminder,
  IConfInfo,
  IPageInfo,
  IDeviceManagerChangeValue,
  IReqInfo,
  IVideoAudioType,
  IConferenceInfo,
  RecordStatus,
  ITranslationContent,
  IRecordPermission,
  IRecordingStateChanged,
  IRecordStatusNotification,
  RecordingState,
  IMCVideoEvent,
  unMuteVideoQueryToastValue,
  IExportUserInfo,
  SpeakersInfo,
  SpeakersInfoObj,
  ICloudRoomConfig,
  PermissionType,
  NetworkQualityLevel,
  INetworkParameter,
} from '@xylink/xy-rtc-sdk';
import {
  IRotationInfoTotalItem,
  IParticipantCount,
  IAudioTrack,
  TMeetingVideoStatus,
  TMeetingAudioStatus,
  ISetting,
  IUser,
  ISubtitle,
  IVideoOperateData,
} from '@/type/index';
import { SERVER, ACCOUNT } from '@/utils/config';
import { DEFAULT_LOCAL_USER, DEFAULT_DEVICE, DEFAULT_SETTING, DEFAULT_CALL_INFO, ELEMENT_ID } from '@/enum/index';
import { MAX_PARTICIPANT_COUNT_SHOW } from '@/enum/participant';
import { TEMPLATE } from '@/utils/template';
import { getLayoutIndexByRotateInfo, getScreenInfo, calculateBaseLayoutList } from '@/utils/index';
import store from '@/utils/store';
import SVG from '@/component/Svg';
import Video from './component/Video';
import Audio from './component/Audio';
import Internels from './component/Internels';
import Login from './component/Login';
import Setting from './component/Setting';
import Barrage from './component/Barrage';
import InOutReminder from './component/InOutReminder';
import Hold from './component/Hold';
import Participant from './component/Participant';
import MeetingLoading from './component/Loading';
import EndCall from './component/EndCall';
import VideoButton from './component/VideoButton';
import AudioButton from './component/AudioButton';
import MeetingHeader from './component/Header';
import PromptInfo from './component/PromptInfo';
import SubtitleButton from './component/SubtitleButton';
import Speaker from './component/Speaker';
import { DEFAULT_SUBTITLE } from '@/enum/subtitle';
import Subtitles from './component/Subtitles';
import PromptModel from './component/PromptModel';
import { isMobile, isPc } from '@/utils/browser';
import { WindowResize } from '@/utils/resize';

import '@/assets/style/index.scss';
import Invite from './component/Invite';

let restartCount = 0; // 音频播放失败count

const defaultUser = store.get('xy-user') || DEFAULT_LOCAL_USER;

function Home() {
  // 呼叫状态
  const [callMeeting, setCallMeeting] = useState(false);
  // 是否呼叫中
  const [callLoading, setCallLoading] = useState(false);
  // 登录/呼叫数据
  const [user, setUser] = useState<IUser>(defaultUser);
  // 云会议室信息
  const [conferenceInfo, setConferenceInfo] = useState<IConferenceInfo>(DEFAULT_CALL_INFO);
  // 参会成员数据，包含stream，roster，position等信息，最终依赖layout的数据进行画面布局、渲染、播放、状态显示
  const [layout, setLayout] = useState<any>([]);
  // 所有参会者信息
  const [rosters, setRosters] = useState<IRoster[]>([]);
  // screen容器信息
  const [screenInfo, setScreenInfo] = useState({
    rateWidth: 0,
    rateHeight: 0,
  });
  // 所有声源列表
  const [audioList, setAudioList] = useState<any>([]);
  // 摄像头状态
  const [video, setVideo] = useState<IVideoAudioType>(() => {
    return user.muteVideo ? 'muteVideo' : 'unmuteVideo';
  });
  // 麦克风状态
  const [audio, setAudio] = useState<IVideoAudioType>(() => {
    return user.muteAudio ? 'muteAudio' : 'unmuteAudio';
  });
  // 是否强制静音
  const [disableAudio, setDisableAudio] = useState(false);
  // 举手状态
  const [handStatus, setHandStatus] = useState(false);
  // 是否有字幕或点名
  const [subTitle, setSubTitle] = useState<ISubTitleContent>({ action: 'cancel', content: '' });
  // content
  const [content, setContent] = useState<IRoster | null>(null);
  // 主会场
  const [chairman, setChairman] = useState({
    chairmanUri: '', // 主会场是否入会
    hasChairman: false, // 是否有设置主会场(预设主会场)
  });
  // current forceLayout roster id
  const [forceLayoutId, setForceLayoutId] = useState('');
  // 桌面布局模式（语音激励模式/画廊模式）
  const [templateMode, setTemplateMode] = useState('speaker');
  // 会议成员数量
  const [participantsCount, setParticipantsCount] = useState(0);
  // 开启content的状态
  const [isLocalShareContent, setLocalShareContent] = useState(false);
  // 是否显示参会者列表
  const [participantVisible, setParticipantVisible] = useState(false);
  // 呼叫数据统计
  const [senderStatus, setSenderStatus] = useState<any>({ sender: {}, receiver: {} });
  // 是否是调试模式（开启则显示所有画面的呼叫数据）
  const [debug, setDebug] = useState(false);
  const [onhold, setOnhold] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  // 设置信息
  const [setting, setSetting] = useState<ISetting>(store.get('xy-setting') || DEFAULT_SETTING);
  const { speakerName = true } = setting;

  const [selectedDevice, setSelectedDevice] = useState<ISelectedDevice>(DEFAULT_DEVICE.nextDevice);
  const [permission, setPermission] = useState<ICurrentPermission>({
    camera: PermissionType.UNKNOWN,
    microphone: PermissionType.UNKNOWN,
  });
  const [contentIsDisabled, setContentIsDisabled] = useState(false);
  const [pageStatus, setPageStatus] = useState({
    previous: false, // 上一页
    next: true, // 下一页
  });
  const [reminders, setReminders] = useState<IReminder[]>([]);
  // 分页
  const [pageInfo, setPageInfo] = useState<IPageInfo>({
    pageSize: 3,
    currentPage: 1,
    totalPage: 0,
  });

  // 是否允许收听
  const [isMuteSpeaker, setMuteSpeaker] = useState(false);
  // 录制权限
  const [recordPermission, setRecordPermission] = useState({
    meeting: false, // 会议室 录制权限
    control: false, // 会控上报录制权限
  });
  // 录制状态
  const [recordStatus, setRecordStatus] = useState(RecordStatus.NONE);
  // 同传字幕内容
  const [translationContent, setTranslationContent] = useState<ITranslationContent | null>(null);
  // 同传字幕状态
  const [subtitleState, setSubtitleState] = useState<ISubtitle>(DEFAULT_SUBTITLE);
  // 会控打开视频弹出框提示
  const [videoModelVisible, setVideoModelVisible] = useState(false);
  //会议室owner，个人云会议室信息
  const [cloudRoomMessage, setCloudRoomMessage] = useState<ICloudRoomConfig | null>(null);
  //正在讲话人名称信息
  const [speakersInfo, setSpeakersInfo] = useState<SpeakersInfoObj[]>([]);
  //会议室Owner
  const [isOwner, setIsOwner] = useState(false);
  // 网络信号等级
  const [localNetworkLevel, setLocalNetworkLevel] = useState(NetworkQualityLevel.Excellent);
  const [remoteNetworkLevel, setRemoteNetworkLevel] = useState<any>({});

  const client = useRef<Client | null>(null);
  const stream = useRef<Stream | null>(null);
  const onholdRef = useRef(false);
  const rotationInfoRef = useRef<IRotationInfoTotalItem[]>([]);
  const nextLayoutListRef = useRef([]);
  const confChangeInfoRef = useRef<IConfInfo>();
  // 会控开启/关闭摄像头数据缓存
  const mcVideoDataRef = useRef<IMCVideoEvent | null>();

  //  录制权限
  const disableRecord = useMemo(() => {
    const { meeting, control } = recordPermission;
    return (
      !meeting || !control || recordStatus === RecordStatus.REMOTE_STAR || recordStatus === RecordStatus.REMOTE_PAUSED
    );
  }, [recordPermission, recordStatus]);

  useEffect(() => {
    const onResize = () => {
      if (client.current) {
        client.current.updateLayoutSize();
      }
    };

    if (!callLoading) {
      // 入会成功
      WindowResize.init(ELEMENT_ID, onResize);
    }

    return () => {
      WindowResize.destroy();
    };
  }, [callLoading]);

  useEffect(() => {
    // 入会成功 如果检测到权限拒绝，则自动关闭摄像头、麦克风
    const operate = async (permission: ICurrentPermission, callMeeting: boolean, callLoading: boolean) => {
      const { camera, microphone } = permission;

      if (callMeeting && !callLoading && client.current) {
        const selfRoster = client.current.getSelfRoster();
        const { videoTxMute, audioTxMute } = selfRoster || {
          videoTxMute: false,
          audioTxMute: false,
        };

        if (camera === 'denied' && !videoTxMute) {
          await client.current.muteVideo();
          setVideo('muteVideo');
          message.info('当前摄像头不可用，视频已自动暂停');
        }

        if (microphone === 'denied' && !audioTxMute) {
          await client.current.muteAudio();
          setAudio('muteAudio');
          message.info('当前麦克风不可用，已自动静音');
        }
      }
    };

    operate(permission, callMeeting, callLoading);
  }, [permission, callMeeting, callLoading]);

  useEffect(() => {
    if (!(callMeeting && !callLoading)) {
      return;
    }

    const { currentPage = 0, totalPage = 0 } = pageInfo;

    const { participantCount = 1 } = confChangeInfoRef.current || {};

    // 总页数大于当前页，则显示 "下一页"按钮
    let next = currentPage < totalPage;
    // 非首页，则显示”上一页“按钮
    let previous = currentPage !== 0;

    // 不显示分页按钮
    // 1. 人数为1
    // 2. 人数为2,且隐藏本地画面
    // 3. 共享(本地)
    // 4. 主会场(非本地、且在线)
    if (
      participantCount === 1 ||
      (participantCount === 2 && setting.localHide) ||
      isLocalShareContent ||
      chairman.chairmanUri
    ) {
      next = false;
      previous = false;
    }

    setPageStatus({
      next,
      previous,
    });
  }, [callMeeting, callLoading, pageInfo, setting.localHide, isLocalShareContent, chairman.chairmanUri]);

  //是否为会议室Owner
  useEffect(() => {
    setIsOwner(cloudRoomMessage?.meetingNumber === conferenceInfo.number);
  }, [cloudRoomMessage, setIsOwner, conferenceInfo.number]);

  // 挂断会议
  const disconnected = (msg = '') => {
    message.info(msg);

    stop();
  };

  // 结束会议操作
  const stop = useCallback(() => {
    // 重置audio、video状态
    setAudio(user.muteAudio ? 'muteAudio' : 'unmuteAudio');
    setVideo(user.muteVideo ? 'muteVideo' : 'unmuteVideo');

    // 重置字幕信息
    setSubTitle({ action: 'cancel', content: '' });

    // 重置onhold
    setOnhold(false);

    // 重置
    setForceLayoutId('');

    // sdk清理操作
    stream.current?.close();
    client.current?.destroy();

    // 清理组件状
    setCallMeeting(false);
    setCallLoading(false);
    setLocalShareContent(false);
    setDebug(false);
    setLayout([]);
    setSettingVisible(false);

    setConferenceInfo(DEFAULT_CALL_INFO);
    setRecordStatus(RecordStatus.NONE);
    setTranslationContent(null);

    client.current = null;
    stream.current = null;
  }, [user.muteAudio, user.muteVideo]);

  // CUSTOM布局 计算页码信息
  const calcPageInfo = () => {
    const { participantCount } = confChangeInfoRef.current!;
    let { pageSize, currentPage } = pageInfo;
    let cacheCustomPageInfo = JSON.parse(JSON.stringify(pageInfo));

    // 会议产生变动，那么就重新计算总页数
    // participantCount + contentPartCount 代表people + content的总个数
    let totalPage = Math.ceil((participantCount - 1) / pageSize);
    totalPage = totalPage > 0 ? totalPage : 0;

    // 如果当前的页码大于最新最大的页码，就更新到最后一页
    if (currentPage > totalPage) {
      currentPage = totalPage;
    }

    cacheCustomPageInfo = {
      ...cacheCustomPageInfo,
      totalPage,
      currentPage,
    };

    // 缓存页码信息
    setPageInfo(cacheCustomPageInfo);

    return cacheCustomPageInfo;
  };

  // CUSTOM布局 请流
  const customRequestLayout = (cacheCustomPageInfo: IPageInfo) => {
    const { chairManUrl, contentUri, participantCount } = confChangeInfoRef.current!;
    let reqList: IReqInfo[] = [];
    let extReqList: IReqInfo[] = [];
    let realLen = participantCount - 1;
    const { pageSize, currentPage } = cacheCustomPageInfo;

    if (chairManUrl) {
      extReqList.push({
        calluri: chairManUrl,
        mediagroupid: 0,
        resolution: 3,
        quality: 2,
      });

      realLen -= 1;
    }

    if (contentUri) {
      extReqList.push({
        calluri: contentUri,
        mediagroupid: 1,
        resolution: 4,
        quality: 2,
      });
      realLen -= 1;
    }

    // 如果真实请流大于每页最大数量
    if (realLen > pageSize) {
      if (realLen < currentPage * pageSize) {
        realLen = realLen - (currentPage - 1) * pageSize;
      } else {
        realLen = pageSize;
      }
    }

    for (let i = 0; i < realLen; i++) {
      reqList.push({
        calluri: '',
        mediagroupid: 0,
        resolution: 1,
        quality: 1,
      });
    }

    client.current?.requestNewLayout(reqList, pageSize, currentPage, extReqList, {
      uiShowLocalWhenPageMode: false,
    });
  };

  // 监听client的内部事件
  const initEventListener = (client: any) => {
    // 会议室信息
    client.on('conference-info', (e: IConferenceInfo) => {
      setConferenceInfo(e);
    });

    // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
    client.on('disconnected', (e: IStatus) => {
      const showMessage = (e.detail && e.detail.message) || '呼叫异常，请稍后重试';

      disconnected(showMessage);
    });

    // 会议成员数量数据
    client.on('participants-count', (e: IParticipantCount) => {
      setParticipantsCount(e.participantsNum);
    });

    // 从v2.0.2版本开始，需要监听conf-change-info来请求Layout数据。以前版本不兼容
    // 接收到conf-change-info后，需要基于此列表数据计算想要请求的参会成员和共享Content画面流
    // client.requestNewLayout请求后，会回调custom-layout数据，包含有请求的视频画面数据
    client.on('conf-change-info', (e: IConfInfo) => {
      const { chairManUrl } = e;
      confChangeInfoRef.current = e;

      setChairman((chairman) => ({
        ...chairman,
        chairmanUri: chairManUrl,
      }));

      // CUSTOM 模式
      if (setting.layoutMode === 'CUSTOM') {
        const cacheCustomPageInfo: IPageInfo = calcPageInfo();

        customRequestLayout(cacheCustomPageInfo);
      }
    });

    // AUTO 布局回调layout数据，使用此数据直接渲染画面即可
    // CUSTOM 布局不需要监听此数据
    client.on('layout', (e: ILayout[]) => {
      setLayout(e);
    });

    // CUSTOM 自定义布局，通过 custom-layout 回调布局结果数据
    // 【v2.0.0 版本之前】第一步：根据【roster】回调消息的列表数据请求对应参会人员的画面数据
    // 【v2.0.1 版本之后】第一步：根据【conf-change-info】回调消息的列表数据请求对应参会人员的画面数据
    // 第二步：在【custom-layout】回调消息里面，获取请求的参会人最新的布局列表数据
    // 第三步：基于最新的布局列表数据，计算 position/size/rotate 等信息，计算完成后，直接渲染即可
    // 备注：Auto 布局在内部做了 position/size/rotate 计算，所以如果不是特殊定制位置，使用Auto回调的【layout】数据直接渲染画面即可
    client.on('custom-layout', (e: ILayout[]) => {
      // 此处渲染没有排序处理，需要自行将回调数据排序并展示
      // 此示例程序通过配置一个一组 TEMPLATE 模版数据，来计算layout container容器大小和layout item position/size/rotate 信息
      // 如果不想通过此方式实现，第三方获取到customLayoutList数据后，自行处理数据即可
      // @ts-ignore
      const nextTemplateRate = TEMPLATE.rate[e.length] || 0.5625;
      const { rateWidth, rateHeight } = getScreenInfo(ELEMENT_ID, nextTemplateRate);

      // 设置layout container容器的大小
      setScreenInfo({ rateWidth, rateHeight });

      // 计算初始layoutList数据
      // 包含计算每个参会成员的大小、位置
      // 如果不需要做上述的getOrderLayoutList的排序操作，那么直接在calculateBaseLayoutList中的第一个参数配置e即可
      // @ts-ignore
      nextLayoutListRef.current = calculateBaseLayoutList(e, rateWidth, rateHeight);

      // 计算屏幕旋转信息
      nextLayoutListRef.current = calculateRotate();

      setLayout(nextLayoutListRef.current);
    });

    // AUTO模式回调数据，推送最新的Layout容器大小信息
    // 支持响应屏幕变化后，推送最新数据
    client.on('screen-info', (e: IScreenInfo) => {
      setScreenInfo(e);
    });

    // audio list数据
    client.on('audio-track', (e: IAudioTrack[]) => {
      setAudioList(e);
    });

    // 呼叫状态
    client.on('call-status', (e: IStatus) => {
      // XYSDK:950518 入会成功
      // XYSDK:950519 正在呼叫中
      const code = e.code;
      const msg = e.msg;

      if (code === 'XYSDK:950518') {
        message.success(msg);

        setCallLoading(false);
      } else if (code === 'XYSDK:950519') {
        message.info(msg);
      } else {
        disconnected(msg);
      }
    });

    // 麦克风状态
    client.on('meeting-control', (e: IMeetingControl) => {
      const { disableMute, muteOperation, contentIsDisabled, chairmanUri, recordIsDisabled, isMuteSpeaker } = e;
      let info = '';

      setDisableAudio(disableMute);
      setContentIsDisabled(contentIsDisabled);

      setChairman((chairman) => ({
        ...chairman,
        hasChairman: !!chairmanUri,
      }));

      setRecordPermission((permission) => ({ ...permission, control: !recordIsDisabled }));

      if (muteOperation === 'muteAudio' && disableMute) {
        info = '主持人已强制静音，如需发言，请点击“举手发言”';
        setHandStatus(false);
      } else if (muteOperation === 'muteAudio' && !disableMute) {
        info = '您已被主持人静音';
      } else if (muteOperation === 'unmuteAudio' && disableMute) {
        info = '主持人已允许您发言';
        setHandStatus(false);
      } else if (muteOperation === 'unmuteAudio' && !disableMute) {
        info = '您已被主持人取消静音';
      }

      // 禁止收听
      if (isMuteSpeaker === 'on') {
        setMuteSpeaker(true);
      } else if (isMuteSpeaker === 'off') {
        info = '您已被主持人允许收听';
        setMuteSpeaker(false);
      }

      // 在等候室时，不做提示
      if (!onholdRef.current && info) {
        message.info(info);
      }
    });

    // 麦克风状态
    client.on('audio-status', (e: TMeetingAudioStatus) => {
      setAudio(e.status);
    });

    // 摄像头状态
    client.on('video-status', (e: TMeetingVideoStatus) => {
      setVideo(e.status);
    });

    // 分享content消息
    client.on('content', (e: { data: IRoster }) => {
      if (e.data) {
        message.info('您正在接收共享内容', 3);
      }
    });

    // 会议实时数据
    client.on('meeting-stats', (e: any) => {
      setSenderStatus(e);
    });

    // content
    client.on('content', (e: { data: IRoster }) => {
      setContent(e.data);
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

    // 设备旋转信息
    // 自定义布局需要处理
    client.on('rotation-change', (e: any) => {
      // 当手机竖屏入会，或者分享的竖屏的内容时
      // 自定义布局需要手动计算视频画面的旋转信息
      if (setting.layoutMode === 'CUSTOM') {
        rotationInfoRef.current = e;
        // 计算屏幕旋转信息
        nextLayoutListRef.current = calculateRotate();

        // 更新layout布局列表数据
        setLayout(nextLayoutListRef.current);
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

    // 设备权限
    client.on('permission', async (e: ICurrentPermission) => {
      setPermission(e);
    });

    // 被移入等候室
    client.on('onhold', (e: boolean) => {
      onholdRef.current = e;
      setOnhold(e);
    });

    // AUTO布局 当前模板类型
    client.on('template-mode', (mode: IMode) => {
      setTemplateMode(mode);
    });

    // 出入会消息
    client.on('in-out-reminder', (e: any) => {
      setReminders(e);
    });

    // 分页信息
    client.on('page-info', (pageInfo: IPageInfo) => {
      setPageInfo({ ...pageInfo });
    });

    // 参会者信息
    client.on('bulkRoster', handleBulkRoster);

    // video、audio play failed, 在移动端某些浏览器，audio需要手动播放
    client.on('play-failed', ({ type, key, error }: { type: 'video' | 'audio'; key: string; error: any }) => {
      if (type === 'video') {
        console.log('[xyRTC on]video play failed:' + key, error);
      }

      if (type === 'audio') {
        console.log('[xyRTC on]audio play failed:' + key, error);

        // 因有多个audio组件, 所以会多次收到此消息，只需第一次的时候重新播放音频即可。
        if (isMobile) {
          if (restartCount === 0) {
            Modal.warning({
              className: 'xy-modal-confirm',
              width: 288,
              icon: null,
              content: '点击“一键收听”按钮收听其他参会人声音',
              closable: true,
              centered: isMobile,
              okText: '一键收听',
              onOk() {
                client.playAudio();
              },
            });

            restartCount++;
          }
        }
      }
    });

    // current forceLayout roster id
    client.on('force-full-screen', (id: string) => {
      setForceLayoutId(id);
    });

    // 录制权限
    client.on('record-permission', (data: IRecordPermission) => {
      const { authorize } = data;

      setRecordPermission((permission) => ({ ...permission, meeting: authorize }));
    });

    // 录制结果
    client.on('recording-state-changed', (data: IRecordingStateChanged) => {
      const { reason, state, reasonText } = data;

      if (state === RecordingState.RECORD_STATE_STARTED) {
        // message.info('录制成功');
        setRecordStatus(RecordStatus.LOCAL_START);
      } else if (state === RecordingState.RECORD_STATE_IDLE) {
        setRecordStatus(RecordStatus.NONE);

        if (reason !== 'STATE:200') {
          message.info(reasonText);
        } else {
          message.info('录制完成，录制视频已保存到云会议室管理员的文件夹中');
        }
      }
    });

    // 录制状态
    client.on('record-status-notification', (data: IRecordStatusNotification) => {
      const { isStart, status } = data;

      let remoteRecordStatus =
        status === 'RECORDING_STATE_PAUSED' ? RecordStatus.REMOTE_PAUSED : RecordStatus.REMOTE_STAR;

      setRecordStatus(isStart ? remoteRecordStatus : RecordStatus.NONE);
    });

    // 同传字幕
    client.on('translation-content', (data: ITranslationContent) => {
      setTranslationContent(data);
    });

    //云会议信息（是否为会议Owner）
    client.on('user-info', (e: IExportUserInfo) => {
      setCloudRoomMessage(e.cloudRoomInfo);
    });

    //正在说话的人
    client.on('speakers-info', (data: SpeakersInfo) => {
      setSpeakersInfo(data.speakersInfo);
    });

    // 会控开启关闭摄像头
    client.on('meeting-control-video', (data: IMCVideoEvent) => {
      console.log('demo get meeting control video: ', data);
      mcVideoDataRef.current = data;

      const { key, value } = data;
      const { requestId, force } = value;

      if (key === 'muteVideoQuery') {
        muteVideoOperate({ toast: '主持人已强制关闭您的摄像头', isNotify: true, requestId });
      } else if (key === 'unMuteVideoQuery') {
        // 会控强制打开摄像头，只有会控操作自己的设备，才会出现强制开启摄像头操作，其他人都是需要false弹窗提示开启
        if (force) {
          unMuteVideoOperate({ toast: '', isNotify: true, requestId });
        } else {
          setVideoModelVisible(true);
        }
      } else if (key === 'toast') {
        const { message: msg } = value as unMuteVideoQueryToastValue;

        if (msg) {
          message.info(msg);
        }
      }
    });

    //  本地网络信号等级
    client.on('networkLevel', (data: number) => {
      setLocalNetworkLevel(data);
    });

    // 参会者网络信号等级
    client.on('networkParameter', (data: INetworkParameter) => {
      setRemoteNetworkLevel((obj: any) => {
        if (obj[data.fromCallUri]?.networkLevel === data.networkLevel) return obj;

        return { ...obj, [data.fromCallUri]: data };
      });
    });
  };

  // 处理参会者消息
  // 参会者信息 是增量消息
  // bulkRosterType: 0 - 全量roster, 1 - 增量roster
  // addRosterInfo  新增的参会者信息  当bulkRosterType是0的时候，此参数表示全量数据
  // changeRosterInfo  变化的参会者信息
  // deleteRosterInfo  被删除的参会者信息
  const handleBulkRoster = (e: any) => {
    const { bulkRosterType = 0, addRosterInfo = [], changeRosterInfo = [], deleteRosterInfo = [] } = e;

    if (bulkRosterType === 0) {
      setRosters(addRosterInfo);
    } else {
      setRosters((rosters) => {
        let newRosters: IRoster[] = rosters.concat(addRosterInfo);

        if (deleteRosterInfo.length > 0) {
          deleteRosterInfo.forEach((info: { participantId: number }) => {
            const index = newRosters.findIndex((roster) => {
              return roster.participantId === info.participantId;
            });

            if (index > -1) {
              newRosters.splice(index, 1);
            }
          });
        }

        if (changeRosterInfo.length > 0) {
          changeRosterInfo.forEach((info: IRoster) => {
            const index = newRosters.findIndex((roster) => {
              return roster.participantId === info.participantId;
            });

            if (index > -1) {
              newRosters[index] = info;
            } else {
              newRosters.push(info);
            }
          });
        }

        return newRosters;
      });
    }
  };

  // 计算 layout 成员渲染
  const calculateRotate = () => {
    const rotationInfo = rotationInfoRef.current;
    const cacheNextLayoutList = cloneDeep(nextLayoutListRef.current);

    rotationInfo.forEach((item: IRotationInfoTotalItem) => {
      let rotateInfo = {};
      const { participantId, mediagroupid } = item;
      const index = getLayoutIndexByRotateInfo(nextLayoutListRef.current, participantId, mediagroupid);

      if (index >= 0) {
        const layoutItem: any = cacheNextLayoutList[index];
        const { width, height } = layoutItem?.positionInfo;

        // 调用 xy-rtc-sdk 库提供的 helper 函数【getLayoutRotateInfo】方便第三方计算旋转信息
        // 提供 item 和 layoutItemContainerWidth 和 height 计算旋转信息
        // 返回旋转角度和宽高样式，此数据和AUTO布局的计算结果一致
        rotateInfo = getLayoutRotateInfo(item, width, height);
        // @ts-ignore
        cacheNextLayoutList[index]['rotate'] = rotateInfo;
      }
    });

    return cacheNextLayoutList;
  };

  const join = async () => {
    setCallMeeting(true);
    setCallLoading(true);

    let callStatus = true;

    try {
      const { meeting = '', meetingPassword, meetingName, muteAudio, muteVideo, extUserId = '' } = user;
      const { layoutMode = 'AUTO', localHide = false, isThird = true } = setting;
      const { clientId, clientSecret } = ACCOUNT;

      setConferenceInfo((info) => ({
        ...info,
        number: meeting,
        callNumber: meeting,
      }));

      // 这里三方可以根据环境修改sdk log等级
      // xyRTC.logger.setLogLevel("NONE");

      client.current = xyRTC.createClient({
        // 注意，第三方集成时，默认是prd环境，不需要配置server地址；
        server: SERVER,
        // 入会是否是自动静音
        muteAudio,
        // 入会是否是关闭摄像头
        muteVideo,
        // 使用哪一种布局方式：
        // AUTO：自动布局，第三方只需要监听layout回调消息即可渲染布局和视频画面
        // CUSTOM：自定义布局，灵活性更高，但是实现较为复杂，自定义控制参会成员的位置、大小和画面质量
        layout: layoutMode || 'AUTO',
        container: {
          // AUTO布局时，自定义指定Layout显示容器
          // CUSTOM布局时，可以使用此元素自行计算显示容器的大小和每个参会成员的位置&大小信息
          elementId: ELEMENT_ID,
          // AUTO布局时，Layout容器相对于elementId元素空间的偏移量，四个值分别对应：[上、下、左、右]
          // 如果没有配置elementId元素，默认使用Body空间大小计算信息
          offset: [0, 0],
        },
        // 隐藏 Local 画面配置项
        localHide,
        // 网关id (必填)
        clientId,
        // 网关密钥 (必填)
        clientSecret,
      });

      // SDK功能控制开关
      client.current.setFeatureConfig({
        enableMeetingOwner: true,
        enableMeetingInvite: true,
        enableCheckRecordPermission: true,
        enableAutoResizeLayout: false,
        enableSpeakerInfo: true,
        enableLayoutAvatar: false,
        enableLowResolution: setting.isLowResolution,
        enableBandwidthSetting: true,
      });

      initEventListener(client.current);

      /**
       * 重要提示
       * 重要提示
       * 重要提示
       * 第三方登录，请在config配置文件里面配置企业账户信息
       * 重要提示
       * 重要提示
       * 重要提示
       */
      let result: any;

      if (isThird) {
        const { extId } = ACCOUNT;

        result = await client.current.loginExternalAccount({
          // 用户名自行填写
          displayName: meetingName || 'thirdName',
          extId,
          extUserId,
        });
      } else {
        // 小鱼登录
        result = await client.current.loginXYlinkAccount(user.phone || '', user.password || '');
      }

      // XYSDK:950120 成功
      // XYSDK:950104 账号密码错误
      if (result.code === 'XYSDK:950104') {
        message.info('登录密码错误');

        setCallMeeting(false);
        setCallLoading(false);
        return;
      }

      if (result.code !== 'XYSDK:950120') {
        message.info('登录失败');

        setCallMeeting(false);
        setCallLoading(false);
        return;
      }

      const token = result.detail.access_token;

      callStatus = await client.current.makeCall({
        token,
        confNumber: meeting,
        password: meetingPassword,
        displayName: meetingName,
      });

      if (callStatus) {
        // 订阅全量参会者信息
        client.current.subscribeBulkRoster();

        stream.current = xyRTC.createStream();

        const { audioInput, audioOutput, videoInput } = selectedDevice;

        await stream.current.init({
          devices: {
            audioInputValue: audioInput?.deviceId || 'default',
            audioOutputValue: audioOutput?.deviceId || 'default',
            videoInValue: videoInput?.deviceId || '',
          },
        });

        client.current?.publish(stream.current, { isSharePeople: true });
      }
    } catch (err: any) {
      disconnected(err.msg || '呼叫异常，请稍后重试');
    }
  };

  // 表单数据提交
  // 开始进行入会操作
  const handleSubmit = async () => {
    const result = await (isPc ? xyRTC.checkSupportWebRTC() : xyRTC.checkSupportMobileWebRTC());
    const { result: isSupport } = result;

    if (!isSupport) {
      message.info('Not support webrtc');

      return;
    }

    join();
  };

  const onChangeUserInfo = (value: any, type: string) => {
    const newUser = { ...user, [type]: value };

    store.set('xy-user', newUser);

    setUser(newUser);

    if (type === 'muteVideo') {
      setVideo(value ? 'muteVideo' : 'unmuteVideo');
    }

    if (type === 'muteAudio') {
      setAudio(value ? 'muteAudio' : 'unmuteAudio');
    }
  };

  // 摄像头操作
  const videoOperate = async () => {
    if (client.current) {
      if (video === 'unmuteVideo') {
        await muteVideoOperate();
      } else if (video === 'muteVideo') {
        await unMuteVideoOperate();
      }
    }
  };

  // 关闭摄像头
  const muteVideoOperate = async (data?: IVideoOperateData) => {
    const { requestId, isNotify, toast } = data || {};

    try {
      let result: IVideoAudioType = await client.current!.muteVideo();
      setVideo(result);

      if (toast) {
        message.info(toast);
      }

      if (isNotify) {
        client.current!.sendVideoControlResult('muteVideo', {
          agree: true,
          reason: '',
          requestId: requestId || '',
        });
      }
    } catch (err) {
      console.log('mute video operate err: ', err);
    }
  };

  // 开启摄像头
  const unMuteVideoOperate = async (data?: IVideoOperateData) => {
    const { requestId, isNotify, toast } = data || {};

    try {
      let result: IVideoAudioType = await client.current!.unmuteVideo();

      setVideo(result);

      if (toast) {
        message.info(toast);
      }

      if (isNotify) {
        client.current!.sendVideoControlResult('unMuteVideo', {
          agree: true,
          reason: '',
          requestId: requestId || '',
        });
      }
    } catch (err: any) {
      const msg = err?.msg || '禁止操作';

      message.error(msg);

      if (isNotify) {
        let reason = '';

        // 没有权限，通知会控
        if (err.code === 'XYSDK:950225') {
          reason = 'no.camera.permission';
        }

        client.current!.sendVideoControlResult('unMuteVideo', {
          agree: false,
          reason,
          requestId: requestId || '',
        });
      }
    }
  };

  // 用户拒绝会控请求打开摄像头
  const onVideoOperateCancel = () => {
    setVideoModelVisible(false);

    if (client.current && mcVideoDataRef.current) {
      const { requestId = '' } = mcVideoDataRef.current.value;

      client.current.sendVideoControlResult('unMuteVideo', {
        agree: false,
        reason: 'reject.unmute.video',
        requestId,
      });
    }
  };

  // 用户同意会控请求打开摄像头
  const onVideoOperateOK = () => {
    setVideoModelVisible(false);

    if (mcVideoDataRef.current) {
      const { requestId = '' } = mcVideoDataRef.current.value;

      unMuteVideoOperate({ toast: '', isNotify: true, requestId });
    }
  };

  // 麦克风操作
  const onAudioOperate = async () => {
    if (client.current) {
      try {
        let result: IVideoAudioType = 'muteAudio';

        if (audio === 'unmuteAudio') {
          result = await client.current.muteAudio();

          message.info('麦克风已静音');
        } else {
          result = await client.current.unmuteAudio();
        }
        setAudio(result);
      } catch (err: any) {
        const msg = err?.msg || '禁止操作';

        message.error(msg);
      }
    } else {
      message.error('麦克风设备无法访问');
    }
  };

  // 取消举手
  const onHand = async (type: 'handup' | 'handdown' | 'mute') => {
    const funcMap = {
      handup: {
        func: 'onHandUp',
        msg: '发言请求已发送',
      },
      handdown: {
        func: 'onHandDown',
        msg: '',
      },
      mute: {
        func: 'onMute',
        msg: '',
      },
    };

    try {
      const { func, msg } = funcMap[type];
      //@ts-ignore
      const handStatus = await client.current[func]();

      setHandStatus(handStatus);
      if (msg) {
        message.info(msg);
      }
    } catch (err) {
      message.info('操作失败');
    }
  };

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

  // 切换布局
  const switchLayout = async () => {
    await client.current?.switchLayout();
  };

  // 自定义布局分页
  const customSwitchPage = (type: string) => {
    const { currentPage, totalPage } = pageInfo;
    let nextPage = currentPage;

    if (type === 'next') {
      nextPage += 1;
    } else if (type === 'previous') {
      nextPage -= 1;
    } else if (type === 'home') {
      nextPage = 1;
    }

    nextPage = Math.max(nextPage, 1);
    nextPage = Math.min(nextPage, totalPage);

    const newPageInfo = {
      ...pageInfo,
      currentPage: nextPage,
    };

    setPageInfo(newPageInfo);

    customRequestLayout(newPageInfo);
  };

  // force layout
  const forceFullScreen = async (id = '') => {
    await client.current?.forceFullScreen(id);
  };

  // 分页
  const switchPage = async (type: 'previous' | 'next' | 'home') => {
    if (setting.layoutMode === 'CUSTOM') {
      customSwitchPage(type);
      return;
    }

    const { currentPage, totalPage } = pageInfo;
    let nextPage = currentPage;

    if (type === 'next') {
      nextPage += 1;
    } else if (type === 'previous') {
      nextPage -= 1;
    } else if (type === 'home') {
      nextPage = 0;
    }

    nextPage = Math.max(nextPage, 0);
    nextPage = Math.min(nextPage, totalPage);

    client.current?.setPageInfo(nextPage);
  };

  const layoutStyle = useMemo(() => {
    const { rateWidth, rateHeight } = screenInfo;
    const layoutStyle = {
      width: rateWidth + 'px',
      height: rateHeight + 'px',
    };

    return layoutStyle;
  }, [screenInfo]);

  const renderAudioList = () => {
    return audioList.map((item: IAudioTrack) => {
      const streamId = item.data.streams[0].id;
      const muted = item.status === 'local';

      return <Audio muted={muted} key={streamId} streamId={streamId} client={client.current} />;
    });
  };

  const renderLayout = () => {
    return layout
      .filter((item: ILayout) => item.roster.participantId)
      .map((item: ILayout) => {
        const id = item.roster.id;

        let networkLevel = 4;

        if (!item.roster.videoTxMute) {
          networkLevel = item.roster.isLocal
            ? localNetworkLevel
            : remoteNetworkLevel[item.roster.endpointId]?.networkLevel || 4;
        }

        return (
          <Video
            client={client.current!}
            model={templateMode}
            item={item}
            key={id}
            id={id}
            forceLayoutId={forceLayoutId}
            networkLevel={networkLevel}
          ></Video>
        );
      });
  };

  // 停止分享content
  const stopShareContent = () => {
    client.current?.stopShareContent();

    setLocalShareContent(false);
  };

  // 分享content内容
  const shareContent = async () => {
    try {
      if (stream.current && client.current) {
        // screenAudio 共享时，是否采集系统音频。 true: 采集； false: 不采集
        const result = await stream.current.createContentStream({ screenAudio: true });

        // 创建分享屏幕stream成功
        if (result) {
          setLocalShareContent(true);

          stream.current.on('start-share-content', () => {
            client.current!.publish(stream.current!, { isShareContent: true });
          });

          stream.current.on('stop-share-content', () => {
            stopShareContent();
          });
        } else {
          message.info('分享屏幕失败');
        }
      } else {
        message.info('分享屏幕失败');
      }
    } catch (err: any) {
      if (err && err.code !== 'XYSDK:950501') {
        message.info(err.msg || '分享屏幕失败');
      }
    }
  };

  // 录制
  const toggleRecord = async () => {
    if (!disableRecord) {
      if (recordStatus === RecordStatus.NONE) {
        await client.current?.startCloudRecord();
      }

      if (recordStatus === RecordStatus.LOCAL_START) {
        await client.current?.stopCloudRecord();
      }
    }
  };

  // 打开统计面板
  const switchDebug = () => {
    const status = !debug;

    setDebug(status);

    client.current?.switchDebug(status);
  };

  const onToggleSetting = useCallback(() => {
    setSettingVisible((visible) => !visible);
  }, []);

  const getParticipantsMaxCount = () => {
    const count = participantsCount;
    if (count > MAX_PARTICIPANT_COUNT_SHOW) {
      return `${MAX_PARTICIPANT_COUNT_SHOW}+`;
    }
    return count;
  };

  const toggleLocal = async () => {
    if (client.current) {
      await client.current.toggleLocal();
    }
  };

  const switchDevice = async (key: 'audioInput' | 'audioOutput' | 'videoInput' | string, device: IDeviceInfo) => {
    const deviceMap: any = {
      audioInput: {
        key: 'audio',
        zh_text: '音频输入设备',
      },
      audioOutput: {
        key: 'video',
        zh_text: '音频输出设备',
      },
      videoInput: {
        key: 'video',
        zh_text: '视频设备',
      },
    };

    const { deviceId, label } = device;
    try {
      if (key === 'audioOutput') {
        await stream.current?.setAudioOutput(deviceId);
      } else if (key === 'audioInput' || key === 'videoInput') {
        await stream.current?.switchDevice(deviceMap[key]['key'], deviceId);
      }
      message.info(`${deviceMap[key]['zh_text']}已自动切换至 ${label}`);
    } catch (err) {
      message.error('设备切换失败');
      return Promise.reject(err);
    }
  };

  const onSwitchDevice = async (nextDevice: ISelectedDevice) => {
    const { audioInput, videoInput, audioOutput } = nextDevice || DEFAULT_DEVICE.nextDevice;

    try {
      if (audioInput?.deviceId !== selectedDevice?.audioInput?.deviceId) {
        await switchDevice('audioInput', audioInput!);
      }

      if (audioOutput?.deviceId !== selectedDevice?.audioOutput?.deviceId) {
        await switchDevice('audioOutput', audioOutput!);
      }

      if (videoInput?.deviceId !== selectedDevice?.videoInput?.deviceId) {
        await switchDevice('videoInput', videoInput!);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const onSaveSetting = async (data: ISetting) => {
    // 切换设备
    if (data.hasOwnProperty('selectedDevice')) {
      onToggleSetting();

      try {
        if (stream.current) {
          await onSwitchDevice(data['selectedDevice']!);
        }

        setSelectedDevice(data['selectedDevice']!);
      } catch (err) {}

      return;
    }

    if (data.hasOwnProperty('localHide')) {
      toggleLocal();
    }

    const key = Object.keys(data)[0];
    const value = data[key as keyof ISetting];

    const newSetting = { ...setting, [key]: value };

    store.set('xy-setting', newSetting);

    setSetting(newSetting);
  };

  const renderMeeting = () => {
    if (callMeeting && !callLoading && !onhold) {
      return (
        <>
          <MeetingHeader
            conferenceInfo={conferenceInfo}
            onToggleSetting={onToggleSetting}
            switchDebug={switchDebug}
            stopMeeting={stop}
          />

          {/* 正在讲话人名称 */}
          {speakerName && (
            <Speaker
              audio={audio}
              video={video}
              disableAudio={disableAudio}
              permission={permission}
              stream={stream.current!}
              audioOperate={audioOperate}
              videoOperate={videoOperate}
              speakersInfo={speakersInfo}
              participantVisible={participantVisible}
            />
          )}

          <PromptInfo
            forceLayoutId={forceLayoutId}
            chairman={chairman.hasChairman}
            content={content}
            localHide={setting.localHide}
            isLocalShareContent={isLocalShareContent}
            forceFullScreen={forceFullScreen}
            recordStatus={recordStatus}
            isMuteSpeaker={isMuteSpeaker}
          />

          <div className={`meeting-content ${participantVisible && isPc && 'meeting-content-mini'}`} id="meeting">
            {pageStatus.previous && (
              <div className="previous-box">
                <div
                  className="previous-button"
                  onClick={() => {
                    switchPage('previous');
                  }}
                >
                  <SVG icon="previous" />
                </div>
                {pageInfo.currentPage > 1 && (
                  <div
                    className="home-button"
                    onClick={() => {
                      switchPage('home');
                    }}
                  >
                    回首页
                  </div>
                )}
              </div>
            )}

            <div className="meeting-layout" style={layoutStyle}>
              {renderLayout()}
            </div>

            <div className="audio-list">{renderAudioList()}</div>

            {!onhold && (
              <>
                <Barrage subTitle={subTitle} />
                <InOutReminder reminders={reminders} />
              </>
            )}

            {pageStatus.next && (
              <div className="next-box">
                <div
                  className="next-button"
                  onClick={() => {
                    switchPage('next');
                  }}
                >
                  <SVG icon="next" />
                  {pageInfo.totalPage > 1 && pageInfo.currentPage > 0 && (
                    <div className="page-number">
                      {pageInfo.currentPage} /{pageInfo.totalPage > 100 ? '...' : pageInfo.totalPage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="meeting-footer">
            {translationContent && <Subtitles subtitle={subtitleState} translationContent={translationContent} />}

            <div className="middle">
              <div className="button setting" onClick={onToggleSetting}>
                <SVG icon="setting" />
                <div className="title">设置</div>
              </div>

              {/* 邀请 */}
              {<Invite inviteInfo={conferenceInfo?.inviteInfo} participantVisible={participantVisible} />}

              <div
                onClick={() => {
                  conferenceInfo.numberType !== 'APP' && setParticipantVisible(true);
                }}
                className={`button host ${conferenceInfo.numberType === 'APP' ? 'disabled-button' : ''}`}
              >
                <div className="layout">
                  <SVG icon="meeting_host" />
                  <div className="title">
                    {cloudRoomMessage?.meetingNumber === conferenceInfo.number && isPc ? '主持会议' : '参会者'}
                  </div>
                </div>
                <div className="tag">{getParticipantsMaxCount()}</div>
              </div>

              <div className="button layout" onClick={switchLayout}>
                <SVG icon="layout" />
                <div className="title">窗口布局</div>
              </div>

              {isLocalShareContent ? (
                <div onClick={stopShareContent} className="button button-warn share-stop">
                  <SVG icon="share_stop" type="danger" />
                  <div className="title">结束共享</div>
                </div>
              ) : (
                <div onClick={shareContent} className={`button share ${contentIsDisabled ? 'disabled-button' : ''}`}>
                  <SVG icon="share" />
                  <div className="title">共享</div>
                </div>
              )}
              {/* 会议录制 */}
              {isPc && (
                <div onClick={toggleRecord} className={`button ${disableRecord ? 'disabled-button' : ''}`}>
                  <div className="layout">
                    <SVG icon={recordStatus === RecordStatus.LOCAL_START ? 'record_stop' : 'record'} />
                    <div className="title">{recordStatus === RecordStatus.LOCAL_START ? '停止录制' : '会议录制'}</div>
                  </div>
                </div>
              )}

              {/* 字幕 */}
              {isPc && (
                <SubtitleButton client={client.current!} subtitle={subtitleState} setSubtitleState={setSubtitleState} />
              )}

              <div className="line" />

              <AudioButton
                permission={permission}
                audio={audio}
                disableAudio={disableAudio}
                handStatus={handStatus}
                stream={stream.current!}
                audioOperate={audioOperate}
              />

              <VideoButton permission={permission} video={video} videoOperate={videoOperate} />

              <EndCall stopMeeting={stop} />
            </div>
          </div>

          {participantVisible && (
            <Participant
              client={client.current!}
              contentUri={content?.endpointId || ''}
              rosters={rosters}
              visible={participantVisible}
              count={participantsCount}
              isOwner={isOwner}
              setShowDrawer={setParticipantVisible}
            />
          )}

          <Internels debug={debug} senderStatus={senderStatus} switchDebug={switchDebug}></Internels>

          {/* 会控控制打开摄像头提示框 */}
          <PromptModel
            open={videoModelVisible}
            content="主持人请求开启您的摄像头，是否马上开启？"
            okText="同意开启"
            closeText="保持关闭"
            timer={10}
            onCancel={onVideoOperateCancel}
            onOK={onVideoOperateOK}
          />
        </>
      );
    }

    return null;
  };

  return (
    <div className="container">
      {/* 加入会议 */}
      {!callMeeting && !callLoading && (
        <Login
          user={user}
          isThird={setting.isThird}
          onChangeUserInfo={onChangeUserInfo}
          onHandleSubmit={handleSubmit}
          onToggleSetting={onToggleSetting}
        ></Login>
      )}

      {/* 正在呼叫 */}
      {callMeeting && callLoading && <MeetingLoading conferenceInfo={conferenceInfo} stopMeeting={stop} />}

      {/* 等候室、被设置呼叫等待 */}
      {callMeeting && !callLoading && onhold && <Hold conferenceInfo={conferenceInfo} stopMeeting={stop} />}

      {renderMeeting()}

      {settingVisible && (
        <Setting
          isInMeeting={callMeeting && !callLoading && !onhold}
          setting={{ ...setting, selectedDevice }}
          visible={settingVisible}
          onCancel={onToggleSetting}
          onSetting={onSaveSetting}
        />
      )}
    </div>
  );
}

export default Home;
