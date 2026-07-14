import { BottomSheet, Typography, Button } from '@/components';
import { License } from '@/models';
import { colors } from '@/styles';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

interface LicenseBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    license: License;
}

const LicenseBottomSheet = ({ visible, onClose, license }: LicenseBottomSheetProps) => {
    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View style={styles.container}>
                <Typography style={styles.title}>{license.libraryName}</Typography>
                <Typography style={styles.description}>{license._description}</Typography>
                <ScrollView >
                    <Typography style={styles.licenseContent}>{license._licenseContent}</Typography>
                </ScrollView>
                <View style={styles.buttonContainer}>
                    <Button title="WEB SITE" onPress={() => { Linking.openURL(license.homepage); }} bgColor={colors.black} />
                </View>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    // Container
    container: {
        maxHeight: 350,
        gap: 16,
    },

    // Title
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Description
    description: {
        fontSize: 14,
    },

    // License Content
    licenseContent: {
        fontSize: 14,
    },

    // Button Container
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    },
});

export default LicenseBottomSheet;