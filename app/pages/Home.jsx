import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define initial course data (unchanged)
const initialCourseData = {
  "semester2": [
    // Original data preserved (unchanged)
    // This is truncated in the artifact for brevity but should remain intact in implementation
  ]
};

const Home = () => {
  const router = useRouter();
  const [courseData, setCourseData] = useState(null);
  const courseFilePath = `${FileSystem.documentDirectory}course.json`;

  // Data handling functions
  const saveCourseData = async (data) => {
    try {
      await FileSystem.writeAsStringAsync(courseFilePath, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
    } catch (error) {
      console.error('Error saving course data:', error);
    }
  };

  const loadCourseData = async () => {
    try {
      const info = await FileSystem.getInfoAsync(courseFilePath);
      if (info.exists) {
        const fileContent = await FileSystem.readAsStringAsync(courseFilePath, { encoding: FileSystem.EncodingType.UTF8 });
        setCourseData(JSON.parse(fileContent));
      } else {
        setCourseData(initialCourseData);
        await saveCourseData(initialCourseData);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setCourseData(initialCourseData);
    }
  };

  const downloadCourseData = async () => {
    try {
      const response = await fetch('https://ihjas-ahammed.github.io/course.json');
      if (response.ok) {
        const downloadedData = await response.json();
        setCourseData(downloadedData);
        await saveCourseData(downloadedData);
      }
    } catch (error) {
      console.log('No internet or failed to download course data:', error);
    }
  };

  useEffect(() => {
    loadCourseData();
    downloadCourseData();
    const intervalId = setInterval(() => {
      downloadCourseData();
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Reusable Module Button
  const ModuleButton = ({ text, path, webview, qa2, last }) => (
    <View className={`py-3 ${!last ? 'border-b border-gray-700/30' : ''} flex-row items-center`}>
      <TouchableOpacity
        className="flex-1"
        activeOpacity={0.7}
        onPress={() => {
          if (webview) {
            router.push(`/webview${path}`);
          } else {
            router.push(`/notes${path}`);
          }
        }}
      >
        <Text className="text-gray-800 dark:text-gray-100 text-base font-medium">{text}</Text>
      </TouchableOpacity>
      {qa2 && (
        <TouchableOpacity
          className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/50"
          activeOpacity={0.7}
          onPress={() => {
            const data = JSON.stringify({ title: text, qa: qa2 });
            console.log(data);
            router.push(`/cog?dt=${data}`);
          }}
        >
          <MaterialIcons name="quiz" size={22} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Reusable Course Card
  const CourseCard = ({ title, modules }) => (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center mb-4">
        <MaterialIcons name="school" size={24} color="#6366f1" />
        <Text className="text-xl font-bold text-gray-800 dark:text-white ml-2">{title}</Text>
      </View>
      <View className="h-[1px] bg-gray-100 dark:bg-gray-700 mb-4" />
      <View className="flex flex-col">
        {modules.map((module, idx) => (
          <ModuleButton
            key={idx}
            last={idx === modules.length - 1}
            text={module.text}
            path={module.path}
            webview={module.webview}
            qa2={module.qa2}
          />
        ))}
      </View>
    </View>
  );

  // Loading state
  if (!courseData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white dark:bg-gray-800">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="grid gap-4">
            {courseData.semester2.map((course, idx) => (
              <CourseCard
                key={idx}
                title={course.title}
                modules={course.modules}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;