/**
 * 摄像头、麦克风操作失败 引导页面
 */
import React from 'react';
import { Modal } from 'antd';
import './index.scss';
import ch_step_operate_video from '@/assets/img/operate/ch_step_operate_video.png';
import ch_step_operate_permission from '@/assets/img/operate/ch_step_operate_permission.png';

interface IProps {
  visible: boolean;
  onClose: (is: boolean) => void;
}

function Guide(props: IProps) {
  const { visible, onClose } = props;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      title=""
      wrapClassName="xy__guide-modal"
      maskClosable={false}
      closable={false}
      visible={visible}
      footer={null}
      width={542}
      onCancel={() => {
        onClose(true);
      }}
    >
      <div className="guide-content">
        <div className="model-title guide-title">
          <div className="close">
            <span
              className="close-icon"
              onClick={() => {
                onClose(false);
              }}
            />
          </div>

          <div className={'title'}>摄像头或麦克风设置</div>
        </div>

        <div className="model-container guide-container">
          <div className="guide-tip">
            <div className="guide-tip-title">1、检查Web权限是否允许摄像头或麦克风</div>
            <div className="guide-tip-img">
              <img width="100%" src={ch_step_operate_permission} alt="" />
            </div>
          </div>
          <div className="guide-tip">
            <div className="guide-tip-title">2、确保通话中选择了正确的设备，可通过以下操作切换设备</div>
            <div className="guide-tip-img">
              <img width="100%" src={ch_step_operate_video} alt="" />
            </div>
          </div>
          <div className="guide-tip">
            <div className="guide-tip-title">3、检查摄像头或麦克风硬件设备本身是否正常</div>
          </div>
          <div className="guide-tip">
            <div className="guide-tip-title">4、检查系统权限是否允许摄像头或麦克风;</div>
            <div className="guide-tip-content">
              <div>-{`Windows 系统：设置 > 隐私 > 相机/麦克风 > 允许桌面应用访问你的相机/麦克风`} </div>
              <div>-{` Mac OS 系统：系统偏好设置 > 安全与隐私 > 隐私 > 摄像头/麦克风`} </div>
            </div>
          </div>
          <div className="guide-tip">
            <div className="guide-tip-title">
              5、如果以上步骤未设置成功，可<span
                className="link"
                onClick={() => {
                  window.location.reload();
                }}
              >
                刷新
              </span>页面尝试重新授权；

            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default Guide;
