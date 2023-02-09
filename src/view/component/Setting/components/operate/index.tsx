import React from 'react';
import { Checkbox } from 'antd';

interface IProp {
  defaultValue?: boolean;
  type: string;
  disabled?: boolean;
  title?: string;
  onChangeEvent?: (key: string, data: any) => void;
}

const Operate = (props: IProp) => {
  const { defaultValue, onChangeEvent, title, disabled, type } = props;

  return (
    <div className="item">
      <div className="key">{title}</div>
      <div className="value">
        <Checkbox
          defaultChecked={defaultValue}
          disabled={disabled}
          onChange={(e) => {
            onChangeEvent && onChangeEvent(type, e);
          }}
        >
          {/* <div className="key">{title}</div> */}
        </Checkbox>
      </div>
    </div>
  );
};
export default Operate;
