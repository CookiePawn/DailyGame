import { colors } from '@/styles';
import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PopUpProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    draggable?: boolean;
    contentStyle?: StyleProp<ViewStyle>;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const PopUp = ({ visible, onClose, children, draggable = false, contentStyle }: PopUpProps) => {
    const insets = useSafeAreaInsets();

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const [isMounted, setIsMounted] = React.useState(visible);

    const openWithAnimation = () => {
        translateY.setValue(300);
        backdropOpacity.setValue(0);

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 260,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeWithAnimation = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 360,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => setIsMounted(false));
    };

    useEffect(() => {
        if (visible) {
            setIsMounted(true);
            requestAnimationFrame(openWithAnimation);
            return;
        }

        if (isMounted) {
            closeWithAnimation();
        }
    }, [visible]);

    if (!isMounted) return null;

    return (
        <Modal visible={isMounted} transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View
                        style={[
                            styles.blur,
                            {
                                opacity: backdropOpacity,
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Bottom Sheet */}
                <Animated.View
                    style={[
                        styles.content,
                        contentStyle,
                        {
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    {/* Handle (디자인 유지) */}
                    {draggable && (
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>
                    )}

                    {children}

                    {/* iOS Safe Area */}
                    {Platform.OS === 'ios' && (
                        <View style={[styles.bottomPadding, { height: insets.bottom }]} />
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    blur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
    },

    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: colors.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        padding: 16,
    },

    bottomPadding: {
        width: '100%',
        backgroundColor: colors.white,
    },

    handleContainer: {
        width: '100%',
        height: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },

    handle: {
        width: 50,
        height: 3,
        borderRadius: 3,
        backgroundColor: colors.neutral200,
    },
});

export default PopUp;
