/**
 * 设备检测、设置
 */
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Tooltip, Alert, message } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import XYRTC, {
  IDeviceInfo,
  IDeviceManagerChangeValue,
  PermissionType,
  ICurrentPermission,
  XYRTCClient,
  Logger,
  DEVICE_KIND,
  VideoAudioTrack,
  setOutputAudioDevice,
} from '@xylink/xy-rtc-sdk';
import ring from '@/assets/ring.wav';
import SVG from '@/component/Svg';
import Select from '@/component/Select';
import AudioLevel from './AudioLevel';

import { ChangeEntry, useDeviceList, useSpecifiedDevice } from '@/store/device';

const { Option } = Select;
const { AUDIOINPUT, AUDIOOUTPUT, VIDEOINPUT } = DEVICE_KIND;
const { UNKNOWN, GRANTED } = PermissionType;

const Device = memo(() => {
  const client = useRef<XYRTCClient | null>(null);
  const videoAudioTrack = useRef<VideoAudioTrack | null>(null);
  const logger = useRef<Logger | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isFirstCall = useRef(true);

  // Loading
  const [loading, setLoading] = useState(true);
  // 权限状态
  const [permission, setPermission] = useState<ICurrentPermission>({
    camera: UNKNOWN,
    microphone: UNKNOWN,
  });
  // 测试扬声器状态
  const [testAudioStatus, setTestAudioStatus] = useState(false);
  // 摄像头预览不可用
  const [isPreviewUnavailable, setPreviewUnavailable] = useState(false);

  // 设备列表
  const { audioInput, audioOutput, videoInput, setAudioInput, setAudioOutput, setVideoInput } = useDeviceList(
    (state) => {
      return {
        audioInput: state.audioInput,
        audioOutput: state.audioOutput,
        videoInput: state.videoInput,
        setAudioInput: state.setAudioInput,
        setAudioOutput: state.setAudioOutput,
        setVideoInput: state.setVideoInput,
      };
    }
  );
  // 指定设备
  const { specifiedDevice, setSpecifiedDevice } = useSpecifiedDevice((state) => {
    return {
      specifiedDevice: state.specifiedDevice,
      setSpecifiedDevice: state.setSpecifiedDevice,
    };
  });

  const virtualProcessor = useRef<any>(null);

  const stop = async () => {
    setTestAudioStatus(false);

    await client.current?.destroy();

    virtualProcessor.current?.removeOptions();

    client.current = null;
    logger.current = null;
  };

  const start = useCallback(async () => {
    logger.current = XYRTC.createLogger({
      dbName: 'XYRTC_SETTING_DEVICE_LOG',
      tableName: 'LOG',
      scope: 'SETTING',
      maxSize: 10000,
    });

    client.current = XYRTC.createClient(
      {
        clientId: '',
        clientSecret: '',
        extId: '',
      },
      logger.current
    );

    const { audioInput, audioOutput, videoInput } = specifiedDevice;

    try {
      videoAudioTrack.current = await client.current.createVideoAudioTrack();

      videoAudioTrack.current.on('permission', handlePermission);
      videoAudioTrack.current.on('device', handleDevice);
      videoAudioTrack.current.on('track-error', handleError);

      await videoAudioTrack.current.capture({
        audioInputId: audioInput?.isDefault ? '' : audioInput?.deviceId,
        audioOutputId: audioOutput?.isDefault ? '' : audioOutput?.deviceId,
        videoInputId: videoInput?.isDefault ? '' : videoInput?.deviceId,
      });
    } catch (error) {
      console.log('create video audio track error: ', error);
    }

    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 页面初始化，创建Client和Stream模块
  useEffect(() => {
    start();

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 摄像头权限变化，重新启用视频预览
  useEffect(() => {
    const videoOperate = async () => {
      if (loading || !client.current) {
        return;
      }

      try {
        if (isFirstCall.current && permission.camera === GRANTED) {
          isFirstCall.current = false;
          setVideoRender();
          return;
        }

        if (permission.camera === GRANTED) {
          await client.current.unmuteVideo();
          setVideoRender();
        } else {
          await client.current.muteVideo();
          setPreviewUnavailable(true);
        }
      } catch (error) {
        console.log('video operate error: ', error);
      }
    };

    videoOperate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission.camera, loading]);

  // 麦克风权限变化，重新启用麦克风
  useEffect(() => {
    const audioOperate = async () => {
      if (loading || !client.current) {
        return;
      }

      try {
        if (permission.microphone === GRANTED) {
          await client.current.unmuteAudio();
        } else {
          await client.current.muteAudio();
        }
      } catch (error) {
        console.log('audio operate error: ', error);
      }
    };

    audioOperate();
  }, [permission.microphone, loading]);

  // 启用本地视频预览
  const setVideoRender = useCallback(() => {
    if (!client.current) return;

    const mediaStream = client.current.getVideoStream();

    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream as MediaStream;
    }

    setPreviewUnavailable(false);
  }, []);

  // 监听SDK上报的device消息，更新最新的设备列表数据，包含isDefault和isSelected状态
  const handleDevice = (e: IDeviceManagerChangeValue) => {
    console.log('demo get device change : ', e);

    // 获取最新的设备列表，直接更新
    const { audioInputList, audioOutputList, videoInputList } = e.detail;

    setAudioInput(audioInputList);
    setAudioOutput(audioOutputList);
    setVideoInput(videoInputList);

    // 切换设备
    // 扬声器因为在外部，所以需要业务自行切换设备ID
    const { audioOutput, audioInput } = e.nextDevice;

    if (audioOutput) {
      switchLocalAudioOutput(audioOutput.deviceId);
    }

    if (audioInput) {
      console.log('audio input change');
    }
  };

  // 监听SDK上报的权限消息
  const handlePermission = (e: ICurrentPermission) => {
    console.log('demo get permission: ', e);

    setPermission(e);
  };

  const handleError = (e: any) => {
    console.log('demo get error event: ', e);
    const { msg = '' } = e;

    msg && message.info(msg);
  };

  // 切换设备
  const handleChange = async (kind: DEVICE_KIND, e: string, option?: any) => {
    const device: IDeviceInfo = option.data;
    console.log('switch device: ', kind, device);

    if (kind === AUDIOINPUT) {
      await switchAudioInputDevice(device);
    }

    if (kind === AUDIOOUTPUT) {
      await switchAudioOutputDevice(device);
    }

    if (kind === VIDEOINPUT) {
      await switchVideoInputDevice(device);
    }
  };

  /**
   * 切换麦克风
   */
  const switchAudioInputDevice = async (device: IDeviceInfo) => {
    const { deviceId, isDefault } = device;
    const { SETTING } = ChangeEntry;

    setSpecifiedDevice({ audioInput: device }, SETTING);
    try {
      await videoAudioTrack.current?.switchDevice(DEVICE_KIND.AUDIOINPUT, deviceId, { isDefault });
    } catch (err) {
      console.error('switch audio input error: ', err);

      // message.error(err?.msg || '切换麦克风设备失败');
    }
  };

  /**
   * 切换摄像头
   */
  const switchVideoInputDevice = async (device: IDeviceInfo) => {
    const { deviceId, isDefault } = device;
    const { SETTING } = ChangeEntry;

    try {
      await videoAudioTrack.current?.switchDevice(DEVICE_KIND.VIDEOINPUT, deviceId, { isDefault });

      setVideoRender();

      setSpecifiedDevice({ videoInput: device }, SETTING);
    } catch (err) {
      console.warn('switch video input error: ', err);

      // message.error(err?.msg || '切换摄像头设备失败');
    }
  };

  /**
   * 切换扬声器
   */
  const switchAudioOutputDevice = async (device: IDeviceInfo) => {
    const { deviceId, isDefault } = device;
    const nextDevice = { audioOutput: device };
    const { SETTING } = ChangeEntry;

    await switchLocalAudioOutput(deviceId);

    setSpecifiedDevice(nextDevice, SETTING);
    // 调用SDK切换设备方法，通知设备切换行为
    await videoAudioTrack.current?.switchDevice(DEVICE_KIND.AUDIOOUTPUT, deviceId, { isDefault });
  };

  /**
   * 切换本地扬声器
   * @param { string } deviceId - 设备ID
   */
  const switchLocalAudioOutput = async (deviceId: string) => {
    // 更新设置组件的audio播放器对应的输出设备
    try {
      await setOutputAudioDevice(audioRef.current!, deviceId);
    } catch (err) {
      console.log('setOutputAudioDevice error: ', err);
    }
  };

  useEffect(() => {
    (async () => {
      if (audioRef.current && testAudioStatus) {
        const selectDevice = audioOutput.find((device) => device.isSelected);
        console.log('play audio use selected device: ', selectDevice);

        if (selectDevice) {
          try {
            await audioRef.current.play();
            await switchLocalAudioOutput(selectDevice?.deviceId || '');
          } catch (err) {
            console.log('test audio error: ', err);
          }
        }
      }
    })();
  }, [audioOutput, testAudioStatus]);

  // 扬声器测试
  const playAudioTest = () => {
    setTestAudioStatus((state) => !state);
  };

  const renderDeviceSettingLoading = () => {
    if (loading) {
      return (
        <div className="fixed">
          <div className="request__loading">
            <LoadingOutlined spin={true} className="roll" />
            <div className="init">设备检测...</div>
          </div>
        </div>
      );
    }

    return null;
  };

  // 提示设备异常信息
  const renderFailTips = () => {
    const { camera, microphone } = permission;
    const isShowStreamFailTips =
      camera === 'denied' || camera === 'failed' || microphone === 'denied' || microphone === 'failed';

    const isCameraDeniedPermission = camera === 'denied';
    const isMicrophoneDeniedPermission = microphone === 'denied';

    let tips = '设备启用失败，请检查授权状态或设备可用性';

    if (isCameraDeniedPermission && isMicrophoneDeniedPermission) {
      tips = '摄像头和麦克风授权失败，请重新授权';
    } else if (isCameraDeniedPermission) {
      tips = '摄像头授权失败，请重新授权';
    } else if (isMicrophoneDeniedPermission) {
      tips = '麦克风授权失败，请重新授权';
    }

    if (isShowStreamFailTips) {
      return (
        <Alert
          message={
            <div className="stream-fail">
              <ExclamationCircleOutlined className="stream-fail-icon" />
              <span className="stream-fail-tip">{tips}</span>
            </div>
          }
          type="info"
          showIcon={false}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={`setting__content-device ${
        permission.microphone !== 'granted' || permission.camera !== 'granted' ? 'tip' : ''
      }`}
    >
      {renderFailTips()}
      {renderDeviceSettingLoading()}

      <div className={`setting__content-device-main ${!loading ? 'visible' : 'hidden'}`}>
        {/* 摄像头 */}
        <div className="item">
          <div className="key">
            <Tooltip title={'进行设备检测及音视频设备设置'} placement="rightBottom" overlayStyle={{ fontSize: '12px' }}>
              <div className="camera">
                <span>摄像头</span>
                <SVG icon="message" className="setting-tips" />
              </div>
            </Tooltip>
          </div>

          <div className="value">
            <Select
              notFoundContent="暂无设备可选"
              onChange={(e: any, option: any) => handleChange(VIDEOINPUT, e, option)}
            >
              {videoInput.map((device) => {
                const { label, isDefault, isSelected, key = '' } = device;

                return (
                  <Option key={key} isSelected={isSelected} value={key} data={device}>
                    {isDefault ? `系统默认-${label}` : label}
                  </Option>
                );
              })}
            </Select>
          </div>
        </div>
        <div className="item">
          <div className="key"></div>
          <div className="value video-value">
            <div className="preview-video-box">
              <div className={`preview-video-bg ${isPreviewUnavailable ? 'visible' : 'hidden'}`}>预览不可用</div>
              <video
                className="preview-video"
                autoPlay
                muted={true}
                ref={videoRef}
                controls={false}
                playsInline
              ></video>
              <video autoPlay muted={true} controls={false} playsInline></video>
            </div>
          </div>
        </div>

        {/* 麦克风 */}
        <div className="item">
          <div className="key">麦克风</div>
          <div className="value">
            <Select
              notFoundContent="暂无设备可选"
              onChange={(e: any, option: any) => handleChange(AUDIOINPUT, e, option)}
            >
              {audioInput.map((device) => {
                const { label, isDefault, isSelected, key = '' } = device;

                return (
                  <Option key={key} isSelected={isSelected} value={key} data={device}>
                    {isDefault ? `系统默认-${label}` : label}
                  </Option>
                );
              })}
            </Select>
          </div>
        </div>
        <div className="item audioLevel">
          <div className="key">音量</div>
          <div className="value">
            <SVG icon="volume" className="volume" />
            <AudioLevel track={videoAudioTrack.current} permission={permission.microphone} />
          </div>
        </div>

        {/* 扬声器 */}
        {audioOutput.length > 0 && (
          <>
            <div className="item loudspeaker">
              <div className="key">扬声器</div>
              <div className="value">
                <Select
                  notFoundContent="暂无设备可选"
                  onChange={(e: any, option: any) => handleChange(AUDIOOUTPUT, e, option)}
                >
                  {audioOutput.map((device) => {
                    const { label, isDefault, isSelected, key = '' } = device;

                    return (
                      <Option key={key} isSelected={isSelected} value={key} data={device}>
                        {isDefault ? `系统默认-${label}` : label}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </div>

            <div className="item speaker">
              <div className="key"></div>
              <div className="value">
                <span className="play-audio" onClick={playAudioTest}>
                  {testAudioStatus ? '停止扬声器' : '测试扬声器'}
                </span>
                {testAudioStatus && <span className="play-audio-status">正在播放声音...</span>}
                {testAudioStatus && <audio className="preview-audio" ref={audioRef} loop={true} src={ring}></audio>}
              </div>
            </div>
          </>
        )}
        <div className="item">
          <div className="key">详细检测</div>
          <div className="value">
            <a href="https://cdn.xylink.com/webrtc/web/index.html#/detect" rel="noopener noreferrer" target="_blank">
              开始检测
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Device;
