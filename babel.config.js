module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src', // '@'를 './src'로 설정
        },
      },
    ],
    ['react-native-worklets/plugin'],
  ],
};