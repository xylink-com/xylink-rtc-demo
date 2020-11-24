import React, { useState, useEffect, useRef } from 'react';
import { Menu, Modal, Button, Row, Select, message } from 'antd';
import { AudioOutlined, SettingOutlined, SoundOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import xyRTC from '@xylink/xy-rtc-sdk';
import { IDeviceItem, IDevices, IDeviceType, IChoosedSettingDevice } from "./../../type"
import './index.scss';

import getIauthImg from './guide.svg';
import cameraNoIauthImg from './camera_no_iauth.svg';

interface props {
  visible: boolean;
  onCancel: () => void;
  onOK: (devices: IChoosedSettingDevice, deviceList: IDevices) => void;
}


const { Option } = Select;
let stream: any;
let client: any;

const Setting = (props: props) => {
  const { visible, onCancel, onOK } = props;
  const [current, setCurrent] = useState("setting");
  const [audioInputList, setAudioInputList] = useState<IDeviceItem[]>([]);
  const [audioOutputList, setAudioOutputList] = useState<IDeviceItem[]>([]);
  const [videoInList, setVideoInList] = useState<IDeviceItem[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [select, setSelect] = useState({
    audioInputValue: 'default',
    audioOutputValue: 'default',
    videoInValue: ''
  });
  const [testAudioStatus, setTestAudioStatus] = useState(false);
  const [iauth, setIauth] = useState('pending');
  const [videoStatusVisible, setVideoStatusVisible] = useState(false);

  const streamObj = useRef<any>(null);
  const audioLevelTimmer = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const preSelectedDevice = useRef<IChoosedSettingDevice>({
    audioInputValue: 'default',
    audioOutputValue: 'default',
    videoInValue: ''
  });
  const preDevicesRef = useRef<IDevices>({ audioInputList: [], audioOutputList: [], videoInList: [] });

  useEffect(() => {
    (async () => {
      const result = await xyRTC.getPermission();

      if (result && result.camera && result.camera === "prompt") {
        setIauth("prompt");
      }

      getClient();
      await getStream();
      await getDevices();
    })();

    return () => {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    preDevicesRef.current = {
      audioInputList,
      audioOutputList,
      videoInList
    }
  }, [audioInputList, audioOutputList, videoInList]);

  useEffect(() => {
    preSelectedDevice.current = select
  }, [select])

  const stop = () => {
    stopStream();

    client && client.close();
  }

  const stopStream = () => {
    if (streamObj.current) {
      xyRTC.closePreviewStream(streamObj.current)
    }

    if (audioLevelTimmer.current) {
      clearInterval(audioLevelTimmer.current);
    }

    stream && stream.close();
  }


  const replaceTrack = async (key: IDeviceType, deviceId: string | undefined = undefined) => {
    if (streamObj.current) {
      // 音量level clear
      if (key === "audioInputValue") {
        clearInterval(audioLevelTimmer.current);
      }

      // 1. 停止所有的track
      streamObj.current.getTracks().forEach((track: MediaStreamTrack) => {
        if ((key === 'audioInputValue' && track.kind === 'audio')
          ||
          (key === 'videoInValue' && track.kind === 'video')) {
          // 关闭摄像头，则将所有track进行终止
          // 此处不使用enabled，会保持摄像头指示灯常亮
          track.stop();
        }
      });

      // 2. remove 
      const localStreamTrack = (key === "audioInputValue") ? streamObj.current.getAudioTracks()[0] : streamObj.current.getVideoTracks()[0];
      localStreamTrack && streamObj.current.removeTrack(localStreamTrack);

      // 3. add
      try {
        let params: { video?: any; audio?: any } = {};

        if (key === 'videoInValue') {
          params.video = {
            deviceId: deviceId ? { exact: deviceId || select.videoInValue } : undefined
          }
        }

        if (key === 'audioInputValue') {
          params.audio = {
            deviceId: deviceId ? { exact: deviceId || select.audioInputValue } : undefined
          }
        }

        const newConstraintsStream = await stream.getPreviewStream(!!params.video, !!params.audio, params);
        const newTrack = (key === "audioInputValue") ? newConstraintsStream.getAudioTracks()[0] : newConstraintsStream.getVideoTracks()[0];

        streamObj.current.addTrack(newTrack);
        setVideoStatusVisible(false);
      } catch (err) {
        // create stream error
        setVideoStatusVisible(true);
      }

      // 音量level重置
      if (key === "audioInputValue") {
        stream.clearAudioLevel();

        audioLevelTimmer.current = setInterval(() => {
          const level = stream.getAudioLevel(streamObj.current);

          // 更新Audio的实时音量显示
          setAudioLevel(level);
        }, 500);
      }
    }
  }

  const handleOk = () => {
    if (videoStatusVisible) {
      message.error("设备不可用,请重新选择");
    } else {
      onOK(select, {
        audioInputList,
        audioOutputList,
        videoInList
      });
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  const getClient = () => {
    client = xyRTC.createClient();

    client.initDeviceEvent();

    client.on("devices", (e: any) => {
      const nextDevices: IDevices = e.detail;

      // @ts-ignore
      const { videoIn, audioInput, audioOutput } = xyRTC.diffDevices(preDevicesRef.current, nextDevices);

      if (videoIn) {
        handleChange("videoInValue", videoIn.deviceId);
      }

      if (audioInput) {
        handleChange("audioInputValue", audioInput.deviceId);
      }

      if (audioOutput) {
        handleChange("audioOutputValue", audioOutput.deviceId);
      }

      setVideoInList(nextDevices.videoInList);
      setAudioInputList(nextDevices.audioInputList);
      setAudioOutputList(nextDevices.audioOutputList);
    })
  }

  const getDevices = async () => {
    const devices = await xyRTC.getDevices();

    setDevices(devices);
  }

  const setDevices = (devices: IDevices) => {
    const { audioInputList, audioOutputList, videoInList } = devices;

    const videoInValue = (videoInList[0] && videoInList[0].deviceId) || "";
    const audioInputValue = (audioInputList[0] && audioInputList[0].deviceId) || "default";
    const audioOutputValue = (audioOutputList[0] && audioOutputList[0].deviceId) || "default";

    setAudioInputList(audioInputList);
    setAudioOutputList(audioOutputList);
    setVideoInList(videoInList);
    setSelect({
      audioInputValue,
      audioOutputValue,
      videoInValue
    })
  }

  const getRangeRandom = (min = 50, max = 1000) => {
    const num = Math.floor(Math.random() * (max - min + 1) + min);

    return num
  }

  const getStream = async (params?: any) => {
    stream = xyRTC.createStream();

    try {
      streamObj.current = await stream.getPreviewStream(params);

      if (streamObj.current) {
        const videoStream = streamObj.current.getVideoTracks()[0];

        if (videoRef.current && videoStream) {
          videoRef.current.srcObject = streamObj.current;

          const randomTimer = getRangeRandom();

          setTimeout(() => {
            setIauth('granted');
          }, randomTimer);
        }
        stream.getAudioLevel(streamObj.current);
        audioLevelTimmer.current = setInterval(() => {
          const level = stream.getAudioLevel();

          // 更新Audio的实时音量显示
          setAudioLevel(level);
        }, 100);
      }
    } catch (err) {
      console.log("err: ", err);

      if (err.code === 403) {
        setIauth('denied');
      }
    }
  }

  const handleClick = (e: any) => {
    setCurrent(e.key);
  };
  /**
   * device change 
   * @param e    deviceId
   * @param key  
   */
  const handleChange = async (key: IDeviceType, e: string) => {
    if (key === 'audioOutputValue' && audioRef.current) {
      xyRTC.setOutputAudioDevice(audioRef.current, e);
    }

    if (
      (key === 'audioInputValue')
      ||
      (key === 'videoInValue')
    ) {
      replaceTrack(key, e);
    }

    setSelect(select => {
      return {
        ...select,
        [key]: e
      }
    });
  }

  const play = async () => {
    if (audioRef.current) {
      if (audioRef.current.paused && !testAudioStatus) {
        await audioRef.current.play();
        setTestAudioStatus(true);
      } else {
        await audioRef.current.pause();
        setTestAudioStatus(false);
      }
    }
  }

  const uploadLog = async () => {
    const { meetingName = "" } = JSON.parse(localStorage.getItem('user') || '{}') || {};
    const result = await xyRTC.logger.uploadLog(meetingName);

    if (result) {
      message.info('上传成功');
    } else {
      message.info('上传失败');
    }
  }

  // 下载呼叫数据到本地
  const download = async () => {
    await xyRTC.logger.downloadLog();
  };

  const renderDeviceSetting = () => {
    const visible = iauth === "granted" ? "visible" : "hidden";

    return (
      <div className={`setting__content-device ${visible}`}>
        <div className="item">
          <div className="key">摄像头</div>
          <div className="value">
            <Select value={select.videoInValue} onChange={(e) => handleChange('videoInValue', e)}>
              {
                videoInList.map(({ deviceId, label }) => (
                  <Option key={deviceId} value={deviceId}>{label}</Option>
                ))
              }
            </Select>
          </div>
        </div>

        <div className="item">
          <div className="key"></div>
          <div className="value video-value">
            <div className={`preview-video-bg ${videoStatusVisible ? 'visible' : 'hidden'}`} >
              设备不可用
            </div>
            <video
              className="preview-video"
              autoPlay
              muted={true}
              ref={videoRef}
              controls={false}
              playsInline
            ></video>
          </div>
        </div>

        <div className="item">
          <div className="key">麦克风</div>
          <div className="value">
            <Select value={select.audioInputValue} onChange={(e) => handleChange('audioInputValue', e)}>
              {
                audioInputList.map(({ deviceId, label }) => (
                  <Option key={deviceId} value={deviceId}>{label}</Option>
                ))
              }
            </Select>
          </div>
        </div>

        <div className="item">
          <div className="key"></div>
          <div className="value">
            <AudioOutlined style={{ marginRight: '5px' }} />
            <div className="level-process">
              <div className="level-value" style={{ transform: `translateX(${audioLevel}%)` }}></div>
            </div>
          </div>
        </div>

        <div className="item">
          <div className="key">扬声器</div>
          <div className="value">
            <Select value={select.audioOutputValue} onChange={(e) => handleChange('audioOutputValue', e)}>
              {
                audioOutputList.map(({ deviceId, label }) => (
                  <Option key={deviceId} value={deviceId}>{label}</Option>
                ))
              }
            </Select>
          </div>
        </div>

        <div className="item">
          <div className="key"></div>
          <div className="value">
            <SoundOutlined style={{ marginRight: '5px' }} />
            <span className="play-audio" onClick={play}>{testAudioStatus ? "停止扬声器" : "测试扬声器"}</span>
            {testAudioStatus && <span className="play-audio-status" >正在播放...</span>}
            <audio
              className="preview-audio"
              ref={audioRef}
              loop={true}
              src="https://cdn.xylink.com/wechatMP/ring.ogg"
            ></audio>
          </div>
        </div>

        <div className="item">
          <div className="key">问题反馈</div>
          <div className="value">
            <span className="upload" onClick={uploadLog}>上传日志</span>
            <span className="split">/</span>
            <span className="upload" onClick={download}>下载日志</span>
          </div>
        </div>
      </div >
    )
  }

  const renderDeviceSettingLoading = () => {
    if (iauth === 'prompt') {
      return (
        <div className="setting__content-device fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">请求授权...</div>
          </div>
        </div>
      )
    }

    if (iauth === 'pending') {
      return (
        <div className="setting__content-device fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">设备检测中...</div>
          </div>
        </div>
      )
    }

    if (iauth === 'denied') {
      return (
        <div className="setting__content-device fixed">
          <div className="request__iauth">
            <h2 className="tips">摄像头和麦克风未授权</h2>
            <div>
              <span>需要使用摄像头和麦克风权限，请点击浏览器地址栏中被屏蔽的摄像头图标 </span>
              <img src={cameraNoIauthImg} alt="img no iauth" />
              <span>，然后选择“始终允许”</span>
            </div>
            <img src={getIauthImg} className="guide" alt="请求授权" />

            <div className="done">
              <span>完成操作？</span>
              <Button style={{ padding: 0 }} type="link" onClick={() => {
                window.location.reload();
              }}>点击刷新页面</Button>
            </div>
          </div>
        </div>
      )
    }

    return null;
  }

  return (
    <Modal
      title="设置"
      wrapClassName="xy__setting-modal"
      maskClosable={false}
      closable={false}
      visible={visible}
      footer={null}
      width={500}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div className="settng__header">
        <Menu onClick={handleClick} selectedKeys={[current]} mode="horizontal">
          <Menu.Item key="setting" icon={<SettingOutlined />}>
            设置
        </Menu.Item>
        </Menu>

        <div className="close" onClick={handleCancel}>
          <CloseOutlined />
        </div>
      </div>

      <div className="setting__content">
        {
          renderDeviceSettingLoading()
        }
        {
          renderDeviceSetting()
        }
      </div>
      <div className="setting_footer">
        <Row justify="end" style={{ paddingTop: '15px' }}>
          <Button type="primary" style={{ marginRight: '20px' }} onClick={handleOk}>确定</Button>
        </Row>
      </div>
    </Modal>
  )
}

export default Setting;