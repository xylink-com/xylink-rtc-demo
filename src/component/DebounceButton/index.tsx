/**
 * 防抖按钮
 */
import React, { ReactNode } from 'react';
import { debounce } from '@/utils/index';

interface IProps {
  children: ReactNode;
  onClick: any;
  className?: string;
  delay?: number;
  atleast?: number;
}

const DebounceButton = (props: IProps) => {
  const { onClick, className = '', delay = 500, atleast = 1000 } = props;

  const debounceClick = debounce(onClick, delay, atleast);

  return (
    <div onClick={debounceClick} className={className}>
      {props.children}
    </div>
  );
};
export default DebounceButton;
