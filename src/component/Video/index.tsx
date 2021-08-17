/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

 import React, { useRef, useEffect, useState, useMemo } from 'react';
 import { ILayout } from '@xylink/xy-rtc-sdk';
 import './index.scss';
 
 interface IProps {
   // roster数据
   item: ILayout;
   // 桌面布局模式，语音激励和画廊模式
   model: string;
   // pid: endpointed + mediagroupId
   id: string;
   client: any;
   forceLayoutId: ''; // 分页时 退出全屏
   setForceLayoutId: (forceLayoutId: string) => void;
 }
 
 const Video: React.FC<any> = (props: IProps) => {
   const { item, model, id, client, forceLayoutId, setForceLayoutId } = props;
   const state = item.state;
   const wrapVideoId = 'wrap-' + id;
 
   const [border, setBorder] = useState({});
   const [isFullScreen, setIsFullScreen] = useState(false);
 
   const videoWrapRef = useRef<any>(null);
 
   useEffect(() => {
     client.setVideoRenderer(id, wrapVideoId);
   }, [client, id, wrapVideoId]);
 
   useEffect(() => {
     // 退出全屏(外部影响，如分页等)
     const exitFullScreen = async () => {
       await client.forceFullScreen();
 
       setTimeout(() => {
         setIsFullScreen(false);
       }, 1000);
     };
 
     !forceLayoutId && isFullScreen && exitFullScreen();
   }, [client, forceLayoutId, isFullScreen]);
 
   useEffect(() => {
     let borderStyle =
       model === 'GALLERY' && item.roster.isActiveSpeaker ? '2px solid #1483eb' : 'none';
 
     setBorder({ border: borderStyle });
   }, [model, item.roster.isActiveSpeaker]);
 
   const toggleFullScreen = async () => {
     await client.forceFullScreen(!isFullScreen && item.roster.id);
 
     if (isFullScreen) {
       setTimeout(() => {
         setIsFullScreen(false);
 
         setForceLayoutId('');
       }, 1000);
     } else {
       setForceLayoutId(item.roster.id);
       setIsFullScreen(true);
     }
   };
 
   const videoWrapStyle = useMemo(() => {
     let wrapStyle = {};
     // 全屏
     if (isFullScreen) {
       return (wrapStyle = {
         position: 'fixed',
         width: '100%',
         height: '100%',
         left: '0',
         top: '0',
         zIndex: '101'
       });
     }
 
     const positionStyle = item.positionStyle;
 
     if (positionStyle && positionStyle.width) {
       wrapStyle = positionStyle;
     }
 
     return wrapStyle;
   }, [item.positionStyle, isFullScreen]);
 
   const videoStyle = useMemo(() => {
     let style = {};
     let fullStyle = {};
 
     if (isFullScreen) {
       fullStyle = {
         width: '100%',
         height: '100%',
         objectFit: 'contain'
       };
     }
 
     style = item.rotate;
 
     if (item.roster.isContent || isFullScreen) {
       style = {
         ...style,
         ...fullStyle
       };
     }
 
     return style;
   }, [isFullScreen, item.rotate, item.roster]);
 
   const renderVideoName = () => {
     return (
       <div className="video-status">
         {!item.roster.isContent && (
           <div
             className={item.roster.audioTxMute ? 'audio-muted-status' : 'audio-unmuted-status'}
           ></div>
         )}
         <div className="name">{`${item.roster.displayName || 'Local'}`}</div>
       </div>
     );
   };
 
   return (
     <div
       className="wrap-video"
       style={videoWrapStyle}
       ref={videoWrapRef}
       id={wrapVideoId}
       onDoubleClick={toggleFullScreen}
     >
       <div className="video">
         <div className="video-content" style={border}>
           <div className="video-model">
             <div
               className={`video-bg ${
                 state === 'AUDIO_TEL' || state === 'AUDIO_CONTENT' || state === 'AUDIO_ONLY'
                   ? 'video-show'
                   : 'video-hidden'
               }`}
             >
               <div className="center">
                 <div>语音通话中</div>
               </div>
               {renderVideoName()}
             </div>
 
             <div
               className={`video-bg ${
                 state === 'MUTE' || state === 'INVALID' ? 'video-show' : 'video-hidden'
               }`}
             >
               <div className="center">
                 {isFullScreen && <div className="displayname">{item.roster.displayName || ''}</div>}
 
                 <div>{item.roster.isLocal ? '视频暂停' : '对方忙，暂时关闭视频'}</div>
               </div>
               {renderVideoName()}
             </div>
 
             <div className={`video-bg ${state === 'REQUEST' ? 'video-show' : 'video-hidden'}`}>
               <div className="center">
                 <div>视频请求中...</div>
               </div>
               {renderVideoName()}
             </div>

             <div
              className={`video-status video-animote ${
                state === 'NORMAL' ? 'video-show' : 'video-hidden'
              }`}
            >
              {!item.roster.isContent && (
                <div
                  className={
                    item.roster.audioTxMute ? 'audio-muted-status' : 'audio-unmuted-status'
                  }
                ></div>
              )}
              <div className="name">{item.roster.displayName}</div>
            </div>
           </div>
         </div>
 
         {<video style={videoStyle}></video>}
       </div>
     </div>
   );
 };
 
 export default Video;
 