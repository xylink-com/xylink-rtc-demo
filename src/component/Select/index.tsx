/**
 * Select component
 */
import React, { useEffect, useState } from 'react';
import { Select as AntdSelect, SelectProps } from 'antd';
import { OptionProps } from 'antd/lib/select';

const { Option } = AntdSelect;

interface customSelectOptionProps extends OptionProps {
  isSelected?: boolean;
}

const Select = (props: SelectProps<any>) => {
  const { options, value, children, ...restProps } = props;
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    if (React.Children.count(children) === 0) {
      setSelectedValue(null);
    }
  }, [children]);

  useEffect(() => {
    setSelectedValue(value);
  }, [value, setSelectedValue]);

  useEffect(() => {
    if (options && options.length) {
      const selectedOption = options.find((option: any) => option.isSelected);

      if (selectedOption) {
        setSelectedValue(selectedOption.value);
      }
    }
  }, [options]);

  return (
    <AntdSelect {...restProps} value={selectedValue}>
      {options
        ? options.map((option: any) => (
            <AntdSelect.Option key={option.value} value={option.value}>
              {option.label}
            </AntdSelect.Option>
          ))
        : null}

      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const { value, isSelected, children, ...restProps } =
            child.props as customSelectOptionProps;

          if (value !== selectedValue && isSelected) {
            setSelectedValue(value);
          }

          return (
            <Option key={value} value={value} {...restProps}>
              {children}
            </Option>
          );
        }
        return null;
      })}
    </AntdSelect>
  );
};

Select.Option = (props: customSelectOptionProps) => {
  return <AntdSelect.Option {...props}></AntdSelect.Option>;
};

export default Select;
