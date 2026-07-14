# template-cli

## React Native Cli 탬플릿
> 프로젝트명 변경 가능
>
> ios bundleDisplayName 참조하도록 수정
> 
> ios AppDelegate.swift의 moduleName 변경
```bash
npm install -g react-native-rename

react-native-rename [변경할 이름]
```


## Project Start
```bash
npx @react-native-community/cli templatecli --version 0.86.0
```


## React-Native-Config
> android/app/ .... 폴더명 패키지명과 동일하게 수정


## 적용 사항
> [스택, 탭 네비게이터]
> [알림창]
> [Jotai]
> [React Query]
> [React Config]
> [Custom Text - 폰트 적용 필요]
> [Android API 35 대응]
> [커스텀 버튼]
> [Colors]
> [Animation 모듈]
> [Permission]
> [Header]





## ENV 분기

[android]
> android/app/build.gradle 참조
> 
> android/settings.gradle 참조

[IOS]
> https://velog.io/@2ast/React-Native-개발용-Dev-앱-분리하기-ios
> 
> https://velog.io/@heumheum2/React-Native-Multiple-Environments

[create from root]
> .env.development
> 
> .env.production


## PROJECT SETTING
```bash
yarn
```
```bash
cd ios && pod install
```


## RUN PROJECT - Scripts
[android]
```bash
yarn run android:dev # DEVELOPMENT MODE
yarn run android:prod # PRODUCTION MODE
yarn run android:dev:release # DEVELOPMENT RELEASE MODE
yarn run android:prod:release # PRODUCTION RELEASE MODE
yarn run android:dev-apk # DEVELOPMENT APK
yarn run android:dev-aab # DEVELOPMENT BUNDLE
yarn run android:prod-apk # PRODUCTION APK
yarn run android:prod-aab # PRODUCTION BUNDLE
```

[IOS]
```bash
yarn run ios:dev # DEVELOPMENT MODE
yarn run ios:prod # PRODUCTION MODE
yarn run ios:dev:release # DEVELOPMENT RELEASE MODE
yarn run ios:prod:release # PRODUCTION RELEASE MODE
```


## Gradle Clean

```bash
cd android                                                                     
./gradlew clean
cd ..
yarn run ${scripts}
```
