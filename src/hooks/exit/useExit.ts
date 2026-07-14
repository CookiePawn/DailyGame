import { BackHandler, ToastAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useRef } from 'react';
import { exitApp } from '@logicwind/react-native-exit-app';

export const useExit = () => {
    const backPressedTime = useRef(0);

    useFocusEffect(
        React.useCallback(() => {
            const backAction = () => {
                const currentTime = new Date().getTime();
                const timeDiff = currentTime - backPressedTime.current;

                if (timeDiff < 2000) { // 2초 이내에 두 번 누른 경우
                    exitApp();
                    return true;
                }

                backPressedTime.current = currentTime;
                ToastAndroid.show('한번 더 누르면 종료됩니다', ToastAndroid.SHORT);
                return true;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

            return () => {
                backHandler.remove();
            };
        }, [])
    );
};