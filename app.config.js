export default ({ config }) => {
  
    return {
      expo: {
        name: "Sirius",
        slug: "data-science-native",
        scheme: "org",
        version: "1.0.10",
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
          adaptiveIcon: {
            foregroundImage: "./assets/icon.png",
            backgroundColor: "#ffffff"
          },
          package: "me.ihjas.notes",
          versionCode: 11,
          permissions: ["INTERNET","CAMERA"],
          runtimeVersion: "1.1"
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
              icon: "./assets/icon.png",
              color: "#ffffff"
            }
          ]
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
          runtimeVersion: "1.0.10"
        }
      }
    };
  };