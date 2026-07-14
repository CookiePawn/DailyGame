import { ParamListBase, RouteProp, useRoute } from '@react-navigation/native';
import { MainStackParamList } from '../Stack';

export default <T extends keyof K, K extends ParamListBase = MainStackParamList>() => useRoute<RouteProp<K, T>>();
