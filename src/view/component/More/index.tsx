import React, { useState } from 'react';
import { Popover } from 'antd';
import SVG from '@/component/Svg';
import './index.scss';

interface IProps {
  onToggleSetting: () => void;
}

const More = (props: IProps) => {
  const { onToggleSetting } = props;
  const [visible, setVisible] = useState(false);

  const content = (
    <ul className="more-select">
      <li onClick={onToggleSetting}>设置</li>
    </ul>
  );

  return (
    <Popover
      content={content}
      visible={visible}
      onVisibleChange={setVisible}
      trigger="hover"
      placement="top"
      overlayClassName="xy-popover more-select-popover"
      align={{
        offset: [0, 2]
      }}
    >
      <div className={`button`}>
        <SVG icon={'more'} />
        <div className="title">更多</div>
      </div>
    </Popover>
  );
};

export default More;
