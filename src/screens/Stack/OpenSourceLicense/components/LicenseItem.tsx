import { StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/components';
import { colors } from '@/styles';
import { License } from '@/models';

interface LicenseItemProps {
    license: License;
    onSelect: (license: License) => void;
}

const LicenseItem = ({ license, onSelect }: LicenseItemProps) => {
    return (
        <TouchableOpacity style={styles.container} onPress={() => onSelect(license)}>
            <Typography style={styles.name}>{license.libraryName}</Typography>
            <Typography style={styles.license}>{license._license} License</Typography>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral100,
    },

    // Name
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.black,
    },

    // License
    license: {
        fontSize: 12,
        color: colors.neutral600,
    },
});

export default LicenseItem;