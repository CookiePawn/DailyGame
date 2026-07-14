import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps { }

const Typography: React.FC<CustomTextProps> = ({ style, ...rest }) => {
  const styles = StyleSheet.flatten(style);

  const getFontFamily = () => {
    switch (styles?.fontWeight) {
      case '900':
        return 'Pretendard-Black';
      case '800':
        return 'Pretendard-ExtraBold';
      case 'bold':
      case '700':
        return 'Pretendard-Bold';
      case '600':
        return 'Pretendard-SemiBold';
      case '500':
        return 'Pretendard-Medium';
      case '400':
      case 'normal':
        return 'Pretendard-Regular';
      case '300':
        return 'Pretendard-Light';
      case '200':
        return 'Pretendard-ExtraLight';
      case '100':
        return 'Pretendard-Thin';
      default:
        return 'Pretendard-Regular';
    }
  };

  return (
    <RNText 
      style={[
        { fontFamily: getFontFamily() },
        style,
        { fontWeight: undefined },
      ]} 
      {...rest} 
    />
  );
};

export default Typography;