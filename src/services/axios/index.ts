import axios, { isAxiosError } from 'axios';
import Config from 'react-native-config';
import { Alert } from 'react-native';

export const instance = axios.create({
    baseURL: Config.API_BASE_URL,
});

instance.interceptors.response.use(undefined, error => {
    if (!isAxiosError(error)) return Promise.reject(error);

    const statusCode = error.response?.status || error.status;

    if (statusCode !== 500) return Promise.reject(error);

    Alert.alert(`서버 오류`, `code: ${error.response?.status}\n 잠시 후 다시 시도해 보세요.`);

    return Promise.reject(error);
});