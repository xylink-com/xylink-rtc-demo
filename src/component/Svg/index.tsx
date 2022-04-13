import React from 'react';
import './index.scss';
import { IconMap } from './icon';

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
