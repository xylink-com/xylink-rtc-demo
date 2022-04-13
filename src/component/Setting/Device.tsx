/**
 * 设备检测、设置
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Row, Select, Tooltip, Alert } from 'antd';
import xyRTC, {
  DeviceManager,
  IDeviceInfo,
  IDeviceList,
  IDeviceManagerChangeValue,
  IMediaSupportedConstraints,
  TPermissionType,
  ICurrentPermission
} from '@xylink/xy-rtc-sdk';
import { ISetting, IDeviceType } from '@/type/index';
import {
  AudioOutlined,
  SoundOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import ring from '@/assets/ring.ogg';
import Guide from '../Guide';

interface IProps {
  current: string;
  setting?: ISetting;
  onSetting: (data: ISetting) => void;
}

const { Option } = Select;

const Device = (props: IProps) => {
  const DEFAULT_DEVICE_LABEL = '选择设备';
  const DEVICE_ABNORMAL_MAP = {
    DENIED: '未授权限',
    NONE: '未发现设备'
  };
  const { current, setting, onSetting } = props;
  const { selectedDevice } = setting || {
    selectedDevice: { audioInput: null, audioOutput: null, videoInput: null }
  };
  const stream = useRef<any>();

  const [audioInputList, setAudioInputList] = useState<IDeviceInfo[]>([]);
  const [audioOutputList, setAudioOutputList] = useState<IDeviceInfo[]>([]);
  const [videoInList, setVideoInList] = useState<IDeviceInfo[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [select, setSelect] = useState({
    audioInputValue: selectedDevice?.audioInput?.deviceId || 'default',
    audioOutputValue: selectedDevice?.audioOutput?.deviceId || 'default',
    videoInValue: selectedDevice?.videoInput?.deviceId || ''
  });

  const [testAudioStatus, setTestAudioStatus] = useState(false);
  const [iauth, setIauth] = useState('pending');
  const [permission, setPermission] = useState<ICurrentPermission>({
    camera: '',
    microphone: ''
  });
  const [videoStatusVisible, setVideoStatusVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const deviceManager = useRef<any>(null);
  const previewStream = useRef<MediaStream | null>(null);
  const audioLevelTimmer = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getDevices = useCallback(async () => {
    try {
      const devices = await deviceManager.current.getDevices();

      setDevices(devices);
    } catch (error) { }
  }, []);

  useEffect(() => {
    async function start() {
      deviceManager.current = new DeviceManager();

      await deviceManager.current.init();

      // 在某些浏览器需要先采流授权，才能得到对应的设备信息
      await getStream();

      await getDevices();

      await initDeviceManagerEvent();
    }

    if (current === 'device') {
      start();
    }

    if (current !== 'device') {
      stop();
    }

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    const { deviceId } = selectedDevice?.audioOutput || { deviceId: '' };

    if (deviceId && audioRef.current) {
      audioRef.current && xyRTC.setOutputAudioDevice(audioRef.current, deviceId);
    }
  }, [selectedDevice]);

  const initDeviceManagerEvent = async () => {
    deviceManager.current.on('permission', async (e: ICurrentPermission) => {
      const { camera, microphone } = e;
      if (camera === 'denied' && microphone === 'denied') {
        setIauth('denied');
      } else {
        await getStream();
      }

      setPermission(e);
    });

    deviceManager.current.on('device', (e: IDeviceManagerChangeValue) => {
      const { detail, nextDevice } = e;
      const { videoInput, audioInput, audioOutput } = nextDevice;
      const nextDevices: IDeviceList = detail;

      if (videoInput) {
        handleChange('videoInValue', videoInput.deviceId);
      }

      if (audioInput) {
        handleChange('audioInputValue', audioInput.deviceId);
      }

      if (audioOutput) {
        handleChange('audioOutputValue', audioOutput.deviceId);
      }
      setDevices(nextDevices);
    });
  };

  // 设置设备数据
  const setDevices = (devices: IDeviceList) => {
    const { audioInputList, audioOutputList, videoInList } = devices;

    setAudioInputList(audioInputList);
    setAudioOutputList(audioOutputList);
    setVideoInList(videoInList);
  };

  const clearAudioLevelTimmer = () => {
    if (audioLevelTimmer.current) {
      clearInterval(audioLevelTimmer.current);
    }
  };

  const clearStream = () => {
    if (previewStream.current) {
      xyRTC.closePreviewStream(previewStream.current);
      console.log('setting stream closed successfully:', previewStream.current);
    }
  };

  const stop = () => {
    clearAudioLevelTimmer();

    if (deviceManager.current) {
      deviceManager.current.destroy();
    }

    clearStream();

    stream?.current?.close();

    setTestAudioStatus(false);
  };

  const replaceTrack = async (key: IDeviceType, deviceId: string | undefined = undefined) => {
    if (previewStream.current) {
      // 音量level clear
      if (key === 'audioInputValue') {
        clearInterval(audioLevelTimmer.current);
        setAudioLevel(0);

        // 因为在Firefox中 无法同时采集两个麦克风的流，所以先停止之前的audioTrack
        const localAudioTrack = previewStream.current.getAudioTracks()[0];

        if (localAudioTrack) {
          previewStream.current.removeTrack(localAudioTrack);
          localAudioTrack.stop();
        }
      }

      if (key === 'videoInValue') {
        // 1. remove && stop
        const localVideoTrack = previewStream.current.getVideoTracks()[0];

        if (localVideoTrack) {
          previewStream.current.removeTrack(localVideoTrack);
          localVideoTrack.stop();
        }
      }

      // 2. add new track
      try {
        let params: { video?: any; audio?: any } = {};

        if (key === 'videoInValue') {
          params.video = {
            deviceId: deviceId ? { exact: deviceId || select.videoInValue } : undefined
          };
        }

        if (key === 'audioInputValue') {
          params.audio = {
            deviceId: deviceId ? { exact: deviceId || select.audioInputValue } : undefined
          };
        }

        const newConstraintsStream = await stream.current.getPreviewStream(
          !!params.video,
          !!params.audio,
          params
        );
        const newTrack =
          key === 'audioInputValue'
            ? newConstraintsStream.getAudioTracks()[0]
            : newConstraintsStream.getVideoTracks()[0];

        previewStream.current.addTrack(newTrack);

        key === 'videoInValue' && setVideoStatusVisible(false);
      } catch (err) {
        key === 'videoInValue' && setVideoStatusVisible(true);

        return;
      }

      // 音量level重置
      if (key === 'audioInputValue') {
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
  };

  const findDeviceById = (deviceId: string, list: IDeviceInfo[]) => {
    return (
      list.find((item: IDeviceInfo) => {
        return item.deviceId === deviceId;
      }) || { deviceId: '', label: '' }
    );
  };

  // 保存设置信息
  const handleOk = () => {
    stop();

    let { audioInputValue, audioOutputValue, videoInValue } = select;

    audioInputValue = audioInputValue === DEFAULT_DEVICE_LABEL ? 'default' : audioInputValue;
    audioOutputValue = audioOutputValue === DEFAULT_DEVICE_LABEL ? 'default' : audioOutputValue;
    videoInValue = videoInValue === DEFAULT_DEVICE_LABEL ? '' : videoInValue;

    onSetting({
      selectedDevice: {
        audioInput: findDeviceById(audioInputValue, audioInputList),
        audioOutput: findDeviceById(audioOutputValue, audioOutputList),
        videoInput: findDeviceById(videoInValue, videoInList)
      },
      deviceList: {
        audioInputList,
        audioOutputList,
        videoInList
      }
    });
  };

  // 获取随机数
  const getRangeRandom = (min = 50, max = 500) => {
    const num = Math.floor(Math.random() * (max - min + 1) + min);

    return num;
  };

  // 启动stream成功，打开界面显示
  const hideCheckingPage = () => {
    const randomTimer = getRangeRandom();

    setTimeout(() => {
      setIauth('granted');
    }, randomTimer);
  };

  // 获取流并更新到video组件显示
  const getStream = async () => {
    if (!stream.current) {
      stream.current = xyRTC.createStream();
    }

    try {
      let params: IMediaSupportedConstraints = {};
      let isVideo = true;
      let isAudio = true;

      previewStream.current?.getTracks().forEach((track: any) => {
        track.stop();
      });

      if (isVideo) {
        let cameraPermission: TPermissionType = 'failed';

        if (selectedDevice?.videoInput?.deviceId) {
          params['video'] = {
            deviceId: { exact: selectedDevice.videoInput.deviceId }
          };
        }

        try {
          previewStream.current = await stream.current.getPreviewStream(isVideo, false, {
            video: params['video']
          });

          cameraPermission = 'granted';
        } catch (err: any) {
          console.log('video err:', err);

          if (err?.code === 950404) {
            cameraPermission = 'denied';
          }

          isVideo = false;
        }

        setPermission((permission) => ({
          ...permission,
          camera: cameraPermission
        }));
      }

      if (isAudio) {
        let microphonePermission: TPermissionType = 'failed';

        if (selectedDevice?.audioInput?.deviceId) {
          params['audio'] = {
            deviceId: { exact: selectedDevice.audioInput.deviceId }
          };
        }

        try {
          const audioTempStream = await stream.current.getPreviewStream(false, isAudio, {
            audio: params['audio']
          });
          if (isVideo) {
            const audioTrack = audioTempStream.getAudioTracks()[0];
            previewStream.current?.addTrack(audioTrack);
          } else {
            previewStream.current = audioTempStream;
          }

          microphonePermission = 'granted';
        } catch (err: any) {
          console.log('audio err:', err);

          if (err?.code === 950404) {
            microphonePermission = 'denied';
          }

          isAudio = false;
        }

        setPermission((permission) => ({
          ...permission,
          microphone: microphonePermission
        }));
      }

      setVideoStatusVisible(!isVideo);

      if (previewStream.current) {
        const videoTrack = previewStream.current.getVideoTracks()[0];
        const audioTrack = previewStream.current.getAudioTracks()[0];

        const audioInput = audioTrack?.getSettings()['deviceId'] || 'default';
        const videoInput = videoTrack?.getSettings()['deviceId'] || '';

        setSelect((select) => {
          return {
            ...select,
            videoInValue: videoInput,
            audioInputValue: audioInput
          };
        });

        if (videoRef.current && videoTrack) {
          videoRef.current.srcObject = previewStream.current;
        }

        hideCheckingPage();

        clearAudioLevelTimmer();

        if (audioTrack) {
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
      }
    } catch (err) { }

    setIauth('granted');
  };

  /**
   * device change
   * @param e    deviceId
   * @param key
   */
  const handleChange = async (key: IDeviceType, e: string) => {
    if (!e) {
      return;
    }

    if (key === 'audioOutputValue' && audioRef.current) {
      xyRTC.setOutputAudioDevice(audioRef.current, e);
    }

    if (key === 'audioInputValue' || key === 'videoInValue') {
      replaceTrack(key, e);
    }

    setSelect((select) => {
      return {
        ...select,
        [key]: e
      };
    });
  };

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
  };

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
      );
    }

    if (iauth === 'pending') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">设备检测中...</div>
          </div>
        </div>
      );
    }

    if (iauth === 'reopen') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <div className="init">授权被拒，请重新打开设置页面</div>
          </div>
        </div>
      );
    }

    if (iauth === 'error') {
      return (
        <div className="fixed">
          <div className="request__loading">
            <div className="init">浏览器版本太低，请升级最新的Chrome浏览器访问</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderFailTips = () => {
    const { camera, microphone } = permission;
    const isShowStreamFailTips =
      camera === 'denied' ||
      camera === 'failed' ||
      microphone === 'denied' ||
      microphone === 'failed';

    if (isShowStreamFailTips) {
      return (
        <Alert
          message={
            <div className="stream-fail">
              <ExclamationCircleOutlined className="stream-fail-icon" />
              <span className="stream-fail-tip">摄像头或麦克风打开失败</span>
              <span
                className="click-me"
                onClick={() => {
                  setGuideVisible(true);
                }}
              >
                点我
              </span>
            </div>
          }
          type="info"
          showIcon={false}
        />
      );
    }

    return null;
  };

  if (current !== 'device') {
    return null;
  }

  return (
    <div className="setting__content-device">
      {renderFailTips()}

      {renderDeviceSettingLoading()}
      <div className={`setting__content-device-main ${iauth === 'granted' ? 'visible' : 'hidden'}`}>
        <div>
          <div className="item">
            <div className="key">
              <Tooltip
                title='进行设备检测及音视频设备设置，此设置仅对当前会议有效'
                placement="rightBottom"
                overlayStyle={{ fontSize: '12px' }}
              >
                摄像头
                <ExclamationCircleOutlined className={'setting-tips'} />
              </Tooltip>
            </div>
            <div className="value">
              {permission.camera === 'denied' ? (
                <div className="setting__select-disabled">{DEVICE_ABNORMAL_MAP.DENIED}</div>
              ) : (
                <Select
                  value={select.videoInValue || DEFAULT_DEVICE_LABEL}
                  onChange={(e) => handleChange('videoInValue', e)}
                >
                  {videoInList.map(({ deviceId, label }) => (
                    <Option key={deviceId} value={deviceId}>
                      {label}
                    </Option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div className="item">
            <div className="key"></div>
            <div className="value video-value">
              <div className={`preview-video-bg ${videoStatusVisible ? 'visible' : 'hidden'}`}>
                预览不可用
              </div>
              <div className="preview-video-box">
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
          </div>

          <div className="item">
            <div className="key">麦克风</div>
            <div className="value">
              {permission.microphone !== 'granted' || audioInputList.length === 0 ? (
                <div className="setting__select-disabled">
                  {permission.microphone !== 'granted'
                    ? DEVICE_ABNORMAL_MAP.DENIED
                    : DEVICE_ABNORMAL_MAP.NONE}
                </div>
              ) : (
                <Select
                  value={
                    audioInputList.length === 1 && !audioInputList[0].deviceId
                      ? DEFAULT_DEVICE_LABEL
                      : select.audioInputValue
                  }
                  onChange={(e) => handleChange('audioInputValue', e)}
                >
                  {audioInputList.map(({ deviceId, label }) => (
                    <Option key={deviceId} value={deviceId}>
                      {label}
                    </Option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div className="item">
            <div className="key"></div>
            <div className="value">
              <AudioOutlined style={{ marginRight: '5px' }} />
              <div className="level-process">
                <div
                  className="level-value"
                  style={{ transform: `translateX(${audioLevel}%)` }}
                ></div>
              </div>
            </div>
          </div>

          {audioOutputList.length > 0 && (
            <>
              <div className="item">
                <div className="key">扬声器</div>
                <div className="value">
                  <Select
                    value={
                      audioOutputList.length === 1 && !audioOutputList[0].deviceId
                        ? DEFAULT_DEVICE_LABEL
                        : select.audioOutputValue
                    }
                    onChange={(e) => handleChange('audioOutputValue', e)}
                  >
                    {audioOutputList.map(({ deviceId, label }) => (
                      <Option key={deviceId} value={deviceId}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="item">
                <div className="key"></div>
                <div className="value">
                  <SoundOutlined style={{ marginRight: '5px' }} />
                  <span className="play-audio" onClick={play}>
                    {testAudioStatus ? "停止扬声器" : "测试扬声器"}
                  </span>
                  {testAudioStatus && <span className="play-audio-status">正在播放...</span>}
                  <audio className="preview-audio" ref={audioRef} loop={true} src={ring}></audio>
                </div>
              </div>
            </>
          )}

          <div className="item">
            <div className="key">详细检测</div>
            <div className="value">
              <a
                href='https://cdn.xylink.com/webrtc/web/index.html#/detect'
                rel="noopener noreferrer"
                target="_blank"
              >
                开始检测
              </a>
            </div>
          </div>
        </div>

        <div className="setting__content-device-footer">
          <Row justify="end" style={{ paddingTop: '15px' }}>
            <Button type="primary" onClick={handleOk}>
              保存
            </Button>
          </Row>
        </div>
      </div>

      <Guide visible={guideVisible} onClose={setGuideVisible} />
    </div>
  );
};

export default Device;
