/**
 * 参会者
 * 支持翻页
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Drawer, Pagination } from 'antd';
import { IRoster, Client } from '@xylink/xy-rtc-sdk';
import { MAX_PARTICIPANT_COUNT, PARTICIPANT_PAGE_SIZE } from '@/enum';
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

interface IProps {
  visible: boolean;
  contentUri: string;
  rosters: IRoster[];
  count: number;
  client: Client;
  setShowDrawer: (visible: boolean) => void;
}

const Participant = memo((props: IProps) => {
  let { visible, contentUri, rosters, count, setShowDrawer, client } = props;
  const [unmuteCount, setUnmuteCount] = useState(0);
  const [selfRoster, setSelfRoster] = useState<any>(null);
  let { data, pageInfo, fetch } = usePagination<IRoster[]>(rosters);
  const nameRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef('all');

  useEffect(() => {
    const selfRoster = client?.getSelfRoster();

    setSelfRoster(selfRoster);
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
        data: newRosters
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
      className="drawer"
      onClose={() => {
        setShowDrawer(false);
      }}
      visible={visible}
    >
      <div className="member">
        <div className="member-header">
          <span
            className="member-hide-btn"
            onClick={() => {
              setShowDrawer(false);
            }}
          ></span>
          参会者
          <div className="member-search">
            <input
              ref={nameRef}
              placeholder="搜索"
              className="member-search-input"
              onChange={onChangeName}
            />
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
            className={`member-navbar-item ${tabRef.current === 'all' ? 'member-navbar-item-active' : ''
              }`}
            onClick={() => {
              onChangeTab('all');
            }}
          >
            已入会({count})
          </span>
          {!!unmuteCount && (
            <span
              className={`member-navbar-item ${tabRef.current === 'unmute' ? 'member-navbar-item-active' : ''
                }`}
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
            const {
              participantId,
              endpointId,
              mediagroupid,
              displayName,
              videoTxMute,
              videoRxMute,
              audioTxMute,
              audioRxMute,
              isContent,
              isActiveSpeaker
            } = item;
            const key = participantId + mediagroupid;
            const audioImg = audioTxMute ? muteActive : unmuteActive;
            const videoImg = videoTxMute ? muteCamera : unmuteCamera;
            const isContentOnly = videoTxMute && videoRxMute && audioRxMute && audioTxMute;

            let memberStatusImg = '';

            if (isContent) {
              return null;
            }

            if (endpointId === selfRoster?.endpointId) {
              memberStatusImg = local;
            } else {
              if (isActiveSpeaker && !audioTxMute) {
                memberStatusImg = speaker;
              }
            }

            return (
              <div className="member-item" key={key}>
                <div className="info">
                  <div className="avatar">
                    <img src={confernece} alt="avatar" />
                    {memberStatusImg && (
                      <img className="avatar__status" src={memberStatusImg} alt="" />
                    )}
                  </div>
                  <div className="name" title={displayName}>
                    <span className="name__info">
                      {displayName}
                      {isContentOnly && <>(仅桌面共享)</>}
                    </span>
                    {contentUri === endpointId && !isContentOnly && (
                      <span className="name__status">正在共享...</span>
                    )}
                  </div>
                </div>
                {!isContent && (
                  <div className="member__staus">
                    <div className="member__staus-audio">
                      <img src={audioImg} alt="unmute" />
                    </div>
                    <div className="member__staus-video">
                      <img src={videoImg} alt="mute" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {data.length === 0 && <div className="member__tips">未找到符合条件的结果</div>}

          {isShowLimitInfo() && (
            <div className="member__tips">
              仅显示{rosters.length}条参会信息
            </div>
          )}
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
    </Drawer>
  );
});

export default Participant;
