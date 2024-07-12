/**
 * 正在讲话的终端
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { ICurrentPermission, IVideoAudioType, SpeakersInfoItem, VideoAudioTrack } from '@xylink/xy-rtc-sdk';
import SVG from '@/component/Svg';
import DebounceButton from '@/component/DebounceButton';
import { PARTICIPANT_WIDTH_PC } from '@/enum/participant';
import MicLevel from '../MicLevel';
import './index.scss';

interface IProps {
  videoAudioTrack: VideoAudioTrack;
  audio: IVideoAudioType;
  video: IVideoAudioType;
  permission: ICurrentPermission;
  disableAudio: boolean;
  speakersInfo: SpeakersInfoItem[];
  participantVisible: boolean;
  videoOperate: () => void;
  audioOperate: () => void;
}
const INITIAL_POSITION = { x: -20, y: 44 };

const Speaker = memo((props: IProps) => {
  const { videoAudioTrack, speakersInfo, participantVisible, audio, video, permission, disableAudio } = props;

  const speakerOuterRef = useRef(null);
  const speakerRef = useRef(null);
  const hasMoved = useRef(false);
  const inParticipantArea = useRef(false);
  const endX = useRef<number>(INITIAL_POSITION.x);
  const [position, setPosition] = useState(INITIAL_POSITION);

  //麦克风
  const renderAudio = () => {
    let svgIcon = 'mic_mute';

    if (permission.microphone === 'denied') {
      svgIcon = 'mic_mute';
    } else {
      if (audio === 'muteAudio' && !disableAudio) {
        svgIcon = 'mic_mute';
      }
      if (audio === 'unmuteAudio' && !disableAudio) {
        svgIcon = 'microphone';
      }
    }

    return (
      <div className={`speakerMedia ${permission.microphone === 'denied' && 'cursorDisable'}`}>
        <DebounceButton
          className={`media ${permission.microphone === 'denied' && 'clickDisable'}`}
          onClick={props.audioOperate}
        >
          <div className="media-icon">
            {permission.microphone !== 'denied' && !disableAudio && (
              <MicLevel audio={audio} videoAudioTrack={videoAudioTrack} className="micLevel" />
            )}
            <SVG icon={svgIcon} />

            {permission.microphone === 'denied' && (
              <div className="permission">
                <SVG icon="no_permission" />
              </div>
            )}
          </div>
        </DebounceButton>
      </div>
    );
  };

  const renderVideo = () => {
    let svgIcon = 'mute_camera';

    if (permission.microphone === 'denied') {
      svgIcon = 'mute_camera';
    } else {
      if (video === 'muteVideo') {
        svgIcon = 'mute_camera';
      }
      if (video === 'unmuteVideo') {
        svgIcon = 'camera';
      }
    }

    return (
      <div className={`speakerMedia ${permission.camera === 'denied' && 'cursorDisable'}`}>
        <DebounceButton
          className={`media ${permission.camera === 'denied' && 'clickDisable'}`}
          onClick={props.videoOperate}
        >
          <div className="media-icon">
            <SVG icon={svgIcon} />
            {permission.camera === 'denied' && (
              <div className="permission">
                <SVG icon="no_permission" />
              </div>
            )}
          </div>
        </DebounceButton>
      </div>
    );
  };

  //处理讲话人名的显示
  const getSpeakers = useCallback(() => {
    const nameArr = speakersInfo.map((item: any, index: number) => {
      return `${item.name}`;
    });

    if (nameArr.length === 0) {
      return '无';
    }

    const nameEle = document.getElementById('name');

    //name容器宽度
    const nameContentWidth = Number(nameEle?.offsetWidth);

    if (nameEle) {
      const nameContentFontSize = window.getComputedStyle(nameEle).fontSize.slice(0, 2);

      //name区域能容纳的字符数
      const wordsNumber = Math.floor(nameContentWidth / Number(nameContentFontSize));

      //正在说话的人名字字符数
      let namesNumber = 0;

      const nameStrArr = nameArr.join('、').split('');

      nameStrArr.map((char: string, index: number) => {
        if (char.charCodeAt(index) > 255) {
          //字符编码大于255，说明是双字节字符
          namesNumber++;
        } else {
          namesNumber += 0.5;
        }
        return nameStrArr;
      });

      const lastIndex = nameArr.length - 1;
      //最后两说话人名字字符数
      const lastTwoPersonNumber = nameArr.slice(lastIndex - 1).join('').length;

      //至少显示一个完整的名字
      if (namesNumber > wordsNumber && lastTwoPersonNumber > wordsNumber) {
        return nameArr[lastIndex];
      }

      if (lastTwoPersonNumber <= wordsNumber) {
        return nameArr.slice(lastIndex - 1).join('、');
      }

      if (namesNumber < wordsNumber) {
        return nameArr.join('、');
      }
    }
  }, [speakersInfo]);

  const bind = useDrag(
    (state) => {
      let nextX = state.offset[0];
      let nextY = state.offset[1];

      if (state.last) {
        const data: any = getSpeakerBarPosition({ nextX, nextY });
        nextX = data.x;
        nextY = data.y;
        endX.current = nextX;
      }

      setPosition({ x: nextX, y: nextY });

      //未打开参会者列表，拖拽后，判断是否占据区域
      inParticipantArea.current = !participantVisible && nextX > -PARTICIPANT_WIDTH_PC;
    },
    {
      axis: undefined,
      pointer: {
        touch: true,
      },
      //true时，当用户刚刚单击组件，组件将不会触发拖动逻辑
      filterTaps: true,
      bounds: speakerOuterRef,
      //初始位置offset
      from: () => [position.x, position.y],
    }
  );

  //获取位置
  const getSpeakerBarPosition = useCallback(
    (data: any) => {
      let { nextX, nextY } = data;

      //未打开参会者列表，判断是否占据区域
      if (!participantVisible && nextX > -PARTICIPANT_WIDTH_PC) {
        inParticipantArea.current = true;
      }
      //占据参会者位置，左移320px
      if (inParticipantArea.current && participantVisible) {
        nextX = -(PARTICIPANT_WIDTH_PC - INITIAL_POSITION.x);
        inParticipantArea.current = false;
        hasMoved.current = true;
      }

      //关闭参会者列表时，恢复原被移动的位置
      if (!participantVisible && hasMoved.current) {
        nextX = endX.current;
        hasMoved.current = false;
      }

      return {
        x: nextX,
        y: nextY,
      };
    },
    [participantVisible]
  );

  const handleSetPosition = useCallback(() => {
    const { x = INITIAL_POSITION.x, y = INITIAL_POSITION.y }: any = getSpeakerBarPosition({
      nextX: position.x,
      nextY: position.y,
    });

    setPosition({ x, y });
  }, [getSpeakerBarPosition, position.x, position.y]);

  useEffect(() => {
    handleSetPosition();
  }, [handleSetPosition]);

  return (
    <div className="speakerOuter" ref={speakerOuterRef}>
      <div
        {...bind()}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        className="speakerContainer"
        ref={speakerRef}
      >
        {renderAudio()}
        {renderVideo()}

        <div className="speakers">
          <div className="title">正在讲话： </div>
          <div className="name" id="name">
            {getSpeakers()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Speaker;
