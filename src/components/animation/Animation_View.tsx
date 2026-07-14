import { StyleProp, ViewStyle } from 'react-native'
import React, { useEffect } from 'react'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    cancelAnimation,
} from 'react-native-reanimated';
import { AnimationType } from '@/models';

interface AnimationProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
    animation: AnimationType;
    startTiming?: number;
    endTiming?: number;
}

const Animation_View = ({
    style,
    children,
    animation,
    startTiming = 0,
    endTiming = 800,
}: AnimationProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        // 기존 애니메이션 취소
        cancelAnimation(progress);

        // 초기화
        progress.value = 0;

        timeout = setTimeout(() => {
            if (animation === 'bounce') {
                progress.value = withSpring(1, {
                    damping: 10,
                    stiffness: 100,
                });
            } else {
                progress.value = withTiming(1, { duration: endTiming });
            }
        }, startTiming);

        return () => {
            clearTimeout(timeout);
        };
    }, [animation, startTiming, endTiming]);

    const animatedStyle = useAnimatedStyle(() => {
        switch (animation) {
            case 'bounce':
                return {
                    transform: [{ translateY: -40 * (1 - progress.value) }],
                };

            case 'fade-in':
                return {
                    opacity: progress.value,
                };
            case 'fade-out':
                return {
                    opacity: 1 - progress.value,
                };

            case 'slide-up':
                return {
                    transform: [{ translateY: 100 * (1 - progress.value) }],
                };

            case 'slide-down':
                return {
                    transform: [{ translateY: -100 * (1 - progress.value) }],
                };

            case 'slide-left':
                return {
                    transform: [{ translateX: 100 * (1 - progress.value) }],
                };

            case 'slide-right':
                return {
                    transform: [{ translateX: -100 * (1 - progress.value) }],
                };

            case 'zoom':
                return {
                    transform: [{ scale: progress.value }],
                };

            default:
                return {};
        }
    });

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

export default Animation_View;