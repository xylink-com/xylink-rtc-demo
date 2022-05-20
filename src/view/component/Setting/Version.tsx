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
      update: splitData[1]
    };

    return about;
  });

  return (
    <div className="setting__content-about">
      <img width="150" src={logo} alt="logo" />
      <div className="about-version">
        版本号：{about.version}
      </div>
      <div className="about-version about-time">
        变更时间：{about.update}
      </div>

      <div>CopyRight © 2022,XYLink Inc.</div>
    </div>
  );
};

export default Version;
