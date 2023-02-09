/**
 * 关于界面
 */
import React, { useState } from 'react';
import xyRTC from '@xylink/xy-rtc-sdk';
import logo from '@/assets/img/login-logo.png';

const Version = () => {
  const [about] = useState(() => {
    const splitData = xyRTC.version.split('- build on');
    const about = {
      version: splitData[0],
      update: splitData[1],
    };

    return about;
  });

  return (
    <div className="setting__content-about">
      <img width="150" src={logo} alt="logo" />
      <div className="about-version">版本号：{about.version}</div>
      <div className=" about-time">变更时间：{about.update}</div>

      <div className="about-footer">
        <div>
          <a href="https://cdn.xylink.com/agreement/xylink-agreement.html" target="_blank" rel="noopener noreferrer">
            《服务协议》
          </a>
          和
          <a href="https://cdn.xylink.com/agreement/privacy-agreement.html" target="_blank" rel="noopener noreferrer">
            《隐私政策》
          </a>
        </div>
        <div>CopyRight © 2023,XYLink Inc.</div>
      </div>
    </div>
  );
};

export default Version;
