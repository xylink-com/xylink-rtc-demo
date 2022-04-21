import React from 'react';
import { IconMap } from './icon';
import './index.scss';

interface IProps {
  icon: string;
  type?: 'default' | 'danger';
  className?: string;
  style?: any;
}

const SVG = (props: IProps) => {
  const { className = '', icon = '', type = 'default', style = {} } = props;

  const Icon = IconMap[icon];

  if (Icon) {
    return (
      <Icon
        className={`svg-icon ${type === 'danger' ? 'svg-icon-danger' : ''} ${className}`}
        style={style}
      />
    );
  }

  return null;
};

export default SVG;
