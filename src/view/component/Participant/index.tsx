/**
 * 参会者
 * 支持翻页
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Drawer, Pagination } from 'antd';
import { IRoster, XYRTCClient } from '@xylink/xy-rtc-sdk';
import { MAX_PARTICIPANT_COUNT, PARTICIPANT_PAGE_SIZE } from '@/enum/participant';
import { isPc } from '@/utils/browser';
import './index.scss';

import confernece from '@/assets/img/operate/conference.png';
import unmuteActive from '@/assets/img/operate/icon_mic.svg';
import muteActive from '@/assets/img/operate/icon_mute_mic.svg';
import muteCamera from '@/assets/img/operate/icon_mute_camera.svg';
import unmuteCamera from '@/assets/img/operate/icon_camera.svg';
import speaker from '@/assets/img/operate/icon_speaker.gif';
import local from '@/assets/img/operate/icon_me.svg';
import search from '@/assets/img/operate/icon_search.svg';
import usePagination from './usePagination';
import { debounce } from '@/utils';
import UpdateName from '../UpdateName';

interface IProps {
  visible: boolean;
  contentUri: string;
  rosters: IRoster[];
  count: number;
  client: XYRTCClient;
  isOwner: boolean;
  enableRename?: boolean;
  setShowDrawer: (visible: boolean) => void;
}

const Participant = memo((props: IProps) => {
  let { visible, contentUri, rosters, count, setShowDrawer, client, isOwner, enableRename = false } = props;
  const [unmuteCount, setUnmuteCount] = useState(0);
  const [selfRoster, setSelfRoster] = useState<any>(null);
  const [url, setUrl] = useState('');
  let { data, pageInfo, fetch } = usePagination<IRoster[]>(rosters);
  const nameRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef('all');

  useEffect(() => {
    const selfRoster = client?.getSelfRoster();

    setSelfRoster(selfRoster);

    // 获取主持会议链接
    const getConfMgmtUrl = async () => {
      const urls = await client.getConfMgmtUrl();
      setUrl(urls?.side || '');
    };

    getConfMgmtUrl();
  }, [client]);

  useEffect(() => {
    const length = rosters.filter((item) => !item.audioTxMute).length;

    if (length === 0) {
      tabRef.current = 'all';
    }

    setUnmuteCount(length);
  }, [rosters]);

  const memberFilter = useCallback(
    (currentPage: number) => {
      const input = nameRef.current?.value.trimStart() || '';

      let newRosters = rosters;

      if (input || tabRef.current === 'unmute') {
        newRosters = rosters.filter((roster) => {
          let isNameFilter = true;
          let isTabFilter = true;

          if (input) {
            isNameFilter = roster.displayName.toLowerCase().search(input.toLowerCase()) > -1;
          }

          if (tabRef.current === 'unmute') {
            isTabFilter = !roster.audioTxMute;
          }

          return isNameFilter && isTabFilter;
        });
      }

      fetch({
        currentPage,
        data: newRosters,
      });
    },
    [rosters, fetch]
  );

  useEffect(() => {
    memberFilter(pageInfo.currentPage);
  }, [memberFilter, pageInfo.currentPage]);

  // 分页
  const onChangePage = (page: number) => {
    memberFilter(page);
  };

  const onChangeTab = (tab: 'all' | 'unmute') => {
    tabRef.current = tab;
    memberFilter(1);
  };

  const onChangeName = debounce(
    () => {
      memberFilter(1);
    },
    1000,
    1000
  );

  // 是否显示“仅显示{count}条参会信息”
  const isShowLimitInfo = () => {
    if (data.length > 0) {
      const { totalPage, currentPage, totalCount } = pageInfo;

      return totalCount >= MAX_PARTICIPANT_COUNT && totalPage === currentPage;
    }
  };

  return (
    <Drawer
      title=""
      placement="right"
      closable={false}
      width={300}
      mask={true}
      className="participant-drawer"
      onClose={() => {
        setShowDrawer(false);
      }}
      visible={visible}
    >
      {isOwner && isPc ? (
        <>
          <span
            className="hide-btn owner-hide-btn"
            onClick={() => {
              setShowDrawer(false);
            }}
          ></span>

          <iframe id="iframe" width="100%" height="100%" frameBorder="0" scrolling="no" src={url} title="主持会议" />
        </>
      ) : (
        <div className="member">
          <div className="member-header">
            <span
              className="hide-btn"
              onClick={() => {
                setShowDrawer(false);
              }}
            ></span>
            <div className="member-number">参会者 ({count})</div>

            <div className="member-search">
              <input ref={nameRef} placeholder="搜索" className="member-search-input" onChange={onChangeName} />
              <span
                className="member-search-btn"
                onClick={() => {
                  memberFilter(1);
                }}
              >
                <img src={search} alt="" />
              </span>
            </div>
          </div>

          <div className="member-navbar">
            <span
              className={`member-navbar-item ${tabRef.current === 'all' ? 'member-navbar-item-active' : ''}`}
              onClick={() => {
                onChangeTab('all');
              }}
            >
              已入会({count})
            </span>
            {!!unmuteCount && (
              <span
                className={`member-navbar-item ${tabRef.current === 'unmute' ? 'member-navbar-item-active' : ''}`}
                onClick={() => {
                  onChangeTab('unmute');
                }}
              >
                未静音({unmuteCount})
              </span>
            )}
          </div>

          <div className="member-content">
            {data.map((item: IRoster) => {
              const { endpointId, mediagroupid } = item;
              const isLocal = endpointId === selfRoster?.endpointId && mediagroupid === 0;
              const isContent = contentUri === endpointId;

              item = {
                ...item,
                isLocal,
                isContent,
              };

              return <ParticipantItem key={endpointId} client={client} item={item} enableRename={enableRename} />;
            })}

            {data.length === 0 && <div className="member__tips">未找到符合条件的结果</div>}

            {isShowLimitInfo() && <div className="member__tips">仅显示{rosters.length}条参会信息</div>}
          </div>

          {pageInfo.totalPage > 1 && (
            <div className="member-pagination">
              <Pagination
                current={pageInfo.currentPage}
                total={pageInfo.totalCount}
                pageSize={PARTICIPANT_PAGE_SIZE}
                showSizeChanger={false}
                onChange={onChangePage}
                showLessItems={true}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
});

const ParticipantItem = ({ client, item, enableRename }: { client: XYRTCClient; item: IRoster; enableRename: boolean }) => {
  const {
    participantId,
    mediagroupid,
    displayName,
    videoTxMute,
    videoRxMute,
    audioTxMute,
    audioRxMute,
    isContent,
    isActiveSpeaker,
    isLocal,
  } = item;
  const key = participantId + mediagroupid;
  const audioImg = audioTxMute ? muteActive : unmuteActive;
  const videoImg = videoTxMute ? muteCamera : unmuteCamera;
  const isContentOnly = videoTxMute && videoRxMute && audioRxMute && audioTxMute;
  const memberStatusImg = useMemo(() => {
    if (isLocal) return local;
    if (isActiveSpeaker) return speaker;
    return null;
  }, [isLocal, isActiveSpeaker]);

  const [updateNameVisible, setUpdateNameVisible] = useState(false);

  useEffect(() => {
    if (!enableRename && isLocal) {
      setUpdateNameVisible(false);
    }
  }, [enableRename, isLocal]);

  return (
    <div className="member-item" key={key}>
      <div className="info">
        <div className="avatar">
          <img src={confernece} alt="avatar" />
          {memberStatusImg && <img className="avatar__status" src={memberStatusImg} alt="" />}
        </div>
        <div className="name" title={displayName}>
          <span className="name__info">
            {displayName}
            {isContentOnly && <>(仅桌面共享)</>}
          </span>
          {isContent && !isContentOnly && <span className="name__status">正在共享...</span>}
        </div>
      </div>

      {!isContent && (
        <div className="member__status">
          {isLocal && enableRename && (
            <div
              className="member__status-item  member__status-rename"
              onClick={() => {
                setUpdateNameVisible(true);
              }}
            >
              改名
            </div>
          )}
          {updateNameVisible && (
            <UpdateName client={client} visible={updateNameVisible} setVisible={setUpdateNameVisible} />
          )}

          <div className="member__status-audio">
            <img src={audioImg} alt="unmute" />
          </div>
          <div className="member__status-video">
            <img src={videoImg} alt="mute" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Participant;
