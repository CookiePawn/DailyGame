import { NavigatorScreenParams } from "@react-navigation/native";
import { MainTabParamList } from "../Tab";

export type MainStackParamList = {
  Splash: undefined;
  MainTab: NavigatorScreenParams<MainTabParamList>;
  OpenSourceLicense: undefined;
};