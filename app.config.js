export default ({ config }) => {

  return {
    expo: {
      name: "Sirius",
      slug: "data-science-native",
      scheme: "org",
      version: "1.2.5",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/icon.png",
        resizeMode: "cover",
        backgroundColor: "#000000"
      },
      newArchEnabled: true,
      android: {
        package: "me.ihjas.notes",
        versionCode: 19,
        permissions: ["INTERNET", "CAMERA"],
        runtimeVersion: "1.2.5",
        
      },
      web: {
        favicon: "./assets/icon.png",
        bundler: "metro"
      },
      plugins: [
        "expo-router",
        "expo-secure-store",
        [
          "expo-notifications",
          {
            icon: "./assets/image.png",
            color: "#ffffff"
          }
        ],
        [
          'expo-build-properties',
          {
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              buildToolsVersion: '35.0.0',
              packagingOptions: {
                abiFilters: ['armeabi-v7a', 'arm64-v8a']
              }
            },
            ios: {
              deploymentTarget: '15.1',
            },
          },
        ],
      ],
      extra: {
        router: {
          origin: false
        },
        eas: {
          projectId: "f98e6168-8ce2-4498-856d-8dee633447f7"
        }
      },
      updates: {
        url: "https://u.expo.dev/f98e6168-8ce2-4498-856d-8dee633447f7"
      },
      ios: {
        runtimeVersion: "1.1",
        bundleIdentifier: "me.ihjas.notes"
      }
    }
  };
};