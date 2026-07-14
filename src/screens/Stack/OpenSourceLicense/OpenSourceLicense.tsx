import { View, StyleSheet, FlatList } from 'react-native';
import { Header } from '@/components';
import LICENSE_LIST from './license-list.json';
import { colors } from '@/styles';
import { LicenseItem, LicenseBottomSheet } from './components';
import { useState } from 'react';
import { License } from '@/models';

const Licenses = () => {
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

    return (
        <View style={styles.container}>
            <Header title="Licenses" />
            <FlatList
                data={LICENSE_LIST}
                renderItem={({ item }) => <LicenseItem license={item as License} onSelect={setSelectedLicense} />}
                keyExtractor={(item) => item.libraryName}
            />
            {selectedLicense && (
                <LicenseBottomSheet visible={selectedLicense !== null} onClose={() => setSelectedLicense(null)} license={selectedLicense} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
});

export default Licenses;