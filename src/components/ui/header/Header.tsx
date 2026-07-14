import { colors } from '@/styles';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Assets } from '@/assets';
import { useNavigation } from '@/navigations';
import { Typography } from '../text';

interface HeaderProps {
    title?: string;
    onBack?: () => void;
    backButton?: boolean;
}

const Header = ({ title, onBack, backButton = true }: HeaderProps) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {backButton && (
                <TouchableOpacity style={styles.backButton} onPress={onBack ? onBack : () => navigation.goBack()}>
                    <Assets.Icons.ARROW_LEFT width={32} height={32} color={colors.black} />
                </TouchableOpacity>
            )}
            <Typography style={styles.title}>{title || ''}</Typography>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        zIndex: 9999,
    },

    // Title
    title: {
        fontSize: 18,
        fontWeight: '500',
        color: colors.black,
    },

    // Back Button
    backButton: {
        position: 'absolute',
        left: 12,
    },
});

export default Header;