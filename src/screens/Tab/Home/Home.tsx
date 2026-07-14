import { View, Text } from 'react-native';
import { useExit } from '@/hooks';
import Config from 'react-native-config';

const Home = () => {
  useExit();

  return (
    <View>
      <Text>Home</Text>
      <Text>{Config.ENV}</Text>
      <Text>{Config.API_BASE_URL}</Text>
    </View>
  );
};

export default Home;