import { GestureResponderEvent, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Typography } from '../text';
import { colors } from '@/styles';
import { useState } from 'react';
import { Assets } from '@/assets';
import Lottie from 'lottie-react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    flex?: boolean;
    type?: 'fill' | 'outline' | 'text';
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    progress?: boolean;
    onPress?: (event: GestureResponderEvent) => Promise<void> | void;
}

const Button = ({ title, type = 'fill', flex = false, bgColor, textColor, borderColor, progress = true, onPress, ...props }: ButtonProps) => {
    const [loading, setLoading] = useState(false);

    let bg_color;
    let text_color;
    let border_color;

    if (type === 'fill') {
        bg_color = bgColor || colors.brand700;
        text_color = textColor || colors.white;
        border_color = borderColor || bgColor || colors.brand700;
    } else if (type === 'outline') {
        bg_color = 'transparent';
        text_color = textColor || colors.brand700;
        border_color = borderColor || colors.brand700;
    } else if (type === 'text') {
        bg_color = 'transparent';
        text_color = textColor || colors.brand700;
        border_color = 'transparent';
    }

    const handlePress = async (event: GestureResponderEvent) => {
        if (progress) {
            setLoading(true);
            await onPress?.(event);
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } else {
            await onPress?.(event);
        }
    }

    return (
        <TouchableOpacity style={[styles.button, { backgroundColor: bg_color, borderColor: border_color }, flex && { flex: 1 }]} onPress={handlePress} {...props}>
            {loading && <Lottie source={Assets.Lotties.LOADING} autoPlay loop style={styles.loadingAnimation}
                colorFilters={[
                    { keypath: 'squash ball', color: colors.white },
                ]} />}
            {!loading && <Typography style={[styles.title, { color: text_color }]} allowFontScaling={false}>{title}</Typography>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        padding: 11,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    title: {
        fontSize: 16,
        lineHeight: 20,
        fontWeight: 'regular',
    },

    // Loading Animation
    loadingAnimation: {
        width: 30,
        height: 30,
    },
});

export default Button;