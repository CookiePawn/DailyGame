import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Stack';

export default <T extends keyof K, K extends ParamListBase = MainStackParamList>() => useNavigation<NativeStackNavigationProp<K, T>>();
