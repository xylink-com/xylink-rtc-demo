import React, { useState, useEffect, useRef } from 'react';
import { Menu, Modal, Button, Row, Select, message, Switch } from 'antd';
import xyRTC, { DeviceManager } from '@xylink/xy-rtc-sdk';
import { IDeviceItem, IDevices, IDeviceType, ISetting, TSettingType, IDeviceManagerChangeValue } from "../../type";
import { AudioOutlined, SettingOutlined, SoundOutlined, CloseOutlined, LoadingOutlined, VideoCameraOutlined } from '@ant-design/icons';
import './index.scss';

import getIauthImg from './guide.svg';
import cameraNoIauthImg from './camera_no_iauth.svg';

interface IProps {
  visible: boolean;
  setting?: ISetting;
  onCancel: () => void;
  onSetting: (data: ISetting) => void;
}

const { Option } = Select;

const Setting = (props: IProps) => {
  const { visible = false, setting, onCancel, onSetting } = props;
  const { selectedDevice, localHide = false } = setting || { localHide: false };
  const stream = useRef<any>();

  const [current, setCurrent] = useState<TSettingType>("device");
  const [audioInputList, setAudioInputList] = useState<IDeviceItem[]>([]);
  const [audioOutputList, setAudioOutputList] = useState<IDeviceItem[]>([]);
  const [videoInList, setVideoInList] = useState<IDeviceItem[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const [select, setSelect] = useState({
    audioInputValue: selectedDevice?.audioInput?.deviceId || "default",
    audioOutputValue: selectedDevice?.audioOutput?.deviceId || "default",
    videoInValue: selectedDevice?.videoInput?.deviceId || ""
  });

  const [testAudioStatus, setTestAudioStatus] = useState(false);
  const [iauth, setIauth] = useState('pending');
  const [videoStatusVisible, setVideoStatusVisible] = useState(false);

  const deviceManager = useRef<any>(null);
  const previewStream = useRef<any>(null);
  const audioLevelTimmer = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function start() {
      deviceManager.current = new DeviceManager();

      await deviceManager.current.init();

      await getStream();

      await initDeviceManagerEvent();

      getDevices();
    }

    start();

    return () => {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { audioOutputValue } = select;
    if (audioOutputValue && audioRef.current) {
      audioRef.current && xyRTC.setOutputAudioDevice(audioRef.current, audioOutputValue);
    }
  }, [select]);

  // 设置设备数据
  const setDevices = (devices: IDevices) => {
    const { audioInputList, audioOutputList, videoInList } = devices;

    setAudioInputList(audioInputList);
    setAudioOutputList(audioOutputList);
    setVideoInList(videoInList);
  }

  const getDevices = async () => {
    const devices = await deviceManager.current.getDevices();

    setDevices(devices);
  }

  const initDeviceManagerEvent = async () => {
    deviceManager.current.on('permission', async (e: any) => {
      const { camera } = e;
      if (camera === 'granted') {
        await getStream();

        getDevices();
      }
      setIauth(camera);

    });

    deviceManager.current.on('device', (e: IDeviceManagerChangeValue) => {
      const { detail, nextDevice } = e;
      const { videoInput, audioInput, audioOutput } = nextDevice;
      const nextDevices: IDevices = detail;

      if (videoInput) {
        handleChange("videoInValue", videoInput.deviceId);
      }

      if (audioInput) {
        handleChange("audioInputValue", audioInput.deviceId);
      }

      if (audioOutput) {
        handleChange("audioOutputValue", audioOutput.deviceId);
      }
      setDevices(nextDevices);
    });
  }

  const clearAudioLevelTimmer = () => {
    if (audioLevelTimmer.current) {
      clearInterval(audioLevelTimmer.current);
    }
    setAudioLevel(0);
  }

  const clearStream = () => {
    if (previewStream.current) {
      xyRTC.closePreviewStream(previewStream.current);
    }
  }

  const stop = () => {
    clearAudioLevelTimmer();

    if (deviceManager.current) {
      deviceManager.current.destory();
    }

    clearStream();

    stream?.current?.close();
  }

  const replaceTrack = async (key: IDeviceType, deviceId: string | undefined = undefined) => {
    if (previewStream.current) {
      // 音量level clear
      if (key === "audioInputValue") {
        clearAudioLevelTimmer();
      }

      // 1. add new track
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

        const newConstraintsStream = await stream.current.getPreviewStream(!!params.video, !!params.audio, params);
        const newTrack = (key === "audioInputValue") ? newConstraintsStream.getAudioTracks()[0] : newConstraintsStream.getVideoTracks()[0];

        previewStream.current.addTrack(newTrack);

        key === "videoInValue" && setVideoStatusVisible(false);

      } catch (err) {
        // create stream error
        key === "videoInValue" && setVideoStatusVisible(true);

        return;
      }

      // 2. remove && stop
      const localStreamTrack = (key === "audioInputValue") ? previewStream.current.getAudioTracks()[0] : previewStream.current.getVideoTracks()[0];

      if (localStreamTrack) {
        previewStream.current.removeTrack(localStreamTrack);
        localStreamTrack.stop();
      }

      // 音量level重置
      if (key === "audioInputValue") {
        stream.current.clearAudioLevel();

        audioLevelTimmer.current = setInterval(async () => {
          try {
            const level = await stream.current.getAudioLevel(previewStream.current);

            // 更新Audio的实时音量显示
            setAudioLevel(level);
          } catch (err) {
            clearAudioLevelTimmer();
          }
        }, 100);
      }
    }
  }

  const findDeviceById = (deviceId: string, list: IDeviceItem[]) => {
    return list.find((item: IDeviceItem) => {
      return item.deviceId === deviceId;
    }) || { deviceId: "", label: "" };
  }

  const handleOk = () => {
    if (videoStatusVisible) {
      message.error("设备不可用,请重新选择");
    } else {
      const { audioInputValue, audioOutputValue, videoInValue } = select;

      onSetting({
        selectedDevice: {
          audioInput: findDeviceById(audioInputValue, audioInputList),
          audioOutput: findDeviceById(audioOutputValue, audioOutputList),
          videoInput: findDeviceById(videoInValue, videoInList),
        },
        deviceList: {
          audioInputList,
          audioOutputList,
          videoInList
        }
      });
    }
  }

  // 获取随机数
  const getRangeRandom = (min = 50, max = 500) => {
    const num = Math.floor(Math.random() * (max - min + 1) + min);

    return num
  }

  // 启动stream成功，打开界面显示
  const hideCheckingPage = () => {
    const randomTimer = getRangeRandom();

    setTimeout(() => {
      setIauth('granted');
    }, randomTimer);
  }

  // 获取流并更新到video组件显示
  const getStream = async () => {
    if (!stream.current) {
      stream.current = xyRTC.createStream();
    }

    try {
      let params: { video?: any, audio?: any } = {};

      if (selectedDevice?.videoInput?.deviceId) {
        params['video'] = {
          deviceId: selectedDevice.videoInput.deviceId
        }
      }

      if (selectedDevice?.audioInput?.deviceId) {
        params['audio'] = {
          deviceId: { exact: selectedDevice.audioInput.deviceId }
        }
      }

      previewStream?.current?.getTracks().forEach((track: any) => {
        track.stop();
      });

      previewStream.current = await stream.current.getPreviewStream(true, true, params);

      if (previewStream.current) {
        const videoTrack = previewStream.current.getVideoTracks()[0];
        const audioTrack = previewStream.current.getAudioTracks()[0];

        const audioInput = audioTrack?.getSettings()['deviceId'] || "default";
        const videoInput = videoTrack?.getSettings()['deviceId'] || "";

        setSelect((select) => {
          return {
            ...select,
            videoInValue: videoInput,
            audioInputValue: audioInput
          }
        })

        if (videoRef.current && videoTrack) {
          videoRef.current.srcObject = previewStream.current;
        }

        hideCheckingPage();

        clearAudioLevelTimmer();

        stream.current.clearAudioLevel();

        await stream.current.getAudioLevel(previewStream.current);
        // 实时获取音量大小
        audioLevelTimmer.current = setInterval(async () => {
          try {
            const level = await stream.current.getAudioLevel();

            // 更新Audio的实时音量显示
            setAudioLevel(level);
          } catch (err) {
            clearAudioLevelTimmer();
          }

        }, 100);
      }
    } catch (err) {
      // 如果是403，则未授权
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

  // 隐藏本地local
  const onChangeHideLocal = (localHide: boolean) => {
    onSetting({
      localHide
    });
  }

  const renderDeviceSetting = () => {
    const visible = iauth === "granted" ? "visible" : "hidden";

    return (
      <div className={`setting__content-device-main ${visible}`}>
        <div>
          <div className="item">
            <div className="key">
              摄像头</div>
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

        </div>

        <div className="setting_footer">
          <Row justify="end" style={{ paddingTop: '15px' }}>
            <Button type="primary" style={{ marginRight: '20px' }} onClick={handleOk}>确定</Button>
          </Row>
        </div>
      </div >
    )
  }

  const renderDeviceSettingLoading = () => {
    // 'granted' | 'denied' | 'prompt' | 'pending' | 'reopen'

    if (iauth === 'prompt') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">请求获取摄像头&麦克风权限，请点击【允许】按钮进行授权操作</div>
          </div>
        </div>
      )
    }

    if (iauth === 'pending') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">设备检测中...</div>
          </div>
        </div>
      )
    }

    if (iauth === 'denied') {
      return (
        <div className="fixed">
          <div className="request__iauth">
            <h2 className="tips">摄像头和麦克风未授权</h2>
            <div>
              <span>需要使用摄像头和麦克风权限，请点击浏览器地址栏中被屏蔽的摄像头图标 </span>
              <img src={cameraNoIauthImg} alt="img no iauth" />
              <span>，然后选择“始终允许”</span>
            </div>
            <img src={getIauthImg} className="guide-img" alt="请求授权" />

            <div className="done">
              {/* <span>完成操作？</span> */}
              {/* <Button style={{ padding: 0 }} type="link" onClick={() => {
                window.location.reload();
              }}>重新启动</Button> */}
            </div>
          </div>
        </div>
      )
    }

    if (iauth === 'reopen') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <div className="init">授权被拒，请重新打开设置页面</div>
          </div>
        </div>
      )
    }

    if (iauth === 'error') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <div className="init">浏览器版本太低，请升级最新的Chrome浏览器访问</div>
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
      width={720}
      onOk={handleOk}
      onCancel={() => {
        onCancel();
      }}
    >
      <div className="setting__container">
        <div className="close" onClick={() => {
          onCancel();
        }}>
          <CloseOutlined />
        </div>
        <div className="setting__header">
          <Menu
            style={{ width: 200 }}
            selectedKeys={[current]}
            mode="vertical"
            onClick={handleClick}>
            <Menu.Item key="device" icon={<VideoCameraOutlined />}>
              音视频
        </Menu.Item>
            <Menu.Item key="common" icon={<SettingOutlined />}>
              常规
        </Menu.Item>
          </Menu>
        </div>
        <div className={`setting__content setting__content-device  ${current === "device" ? "show" : "hide"}`}>
          {
            renderDeviceSettingLoading()
          }
          {
            renderDeviceSetting()
          }
        </div>

        <div className={`setting__content ${current === "common" ? "show" : "hide"}`}>
          <div className="item">
            <div className="key">隐藏本地画面</div>
            <div className="value">
              <Switch defaultChecked={localHide} onChange={onChangeHideLocal} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default Setting;