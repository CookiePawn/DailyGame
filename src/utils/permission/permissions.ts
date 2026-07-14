// utils/permissions.ts
import { Platform } from 'react-native';
import {
    request,
    PERMISSIONS,
    RESULTS,
    requestNotifications,
    NotificationsResponse
} from 'react-native-permissions';

type PermissionType = 'NOTIFICATIONS' | 'APP_TRACKING_TRANSPARENCY';

const checkPermission = async (type: PermissionType) => {
    if (Platform.OS === 'android') {
        switch (type) {
            case 'NOTIFICATIONS':
                return await requestNotifications();
            case 'APP_TRACKING_TRANSPARENCY':
                return true;
        }
    } else {
        switch (type) {
            case 'NOTIFICATIONS':
                return await requestNotifications();
            case 'APP_TRACKING_TRANSPARENCY':
                return await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
        }
    }
};

export const requestPermission = async (permission: PermissionType): Promise<boolean> => {
    const status = await checkPermission(permission);
    if (permission === 'NOTIFICATIONS') return (status as NotificationsResponse).status === RESULTS.GRANTED;
    return status === RESULTS.GRANTED;
};
