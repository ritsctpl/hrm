// components/CustomDatePicker.tsx
import React from 'react';
import { DatePicker ,TimePicker} from 'antd';
import  { Dayjs } from 'dayjs';

interface CustomDatePickerProps {
  value?: Dayjs;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  showTime?: boolean;
  format?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = (props) => {
  return (
    <DatePicker
    {...props} style={{ width :'100%'}}
    />
  );
};

export const CustomTimePicker: React.FC<CustomDatePickerProps> = (props) => {
  return (
    <TimePicker
          {...props} style={{ width :'100%'}}
        />
  );
};

