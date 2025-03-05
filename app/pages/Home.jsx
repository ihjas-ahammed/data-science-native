import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

// Define initial course data (unchanged)
const initialCourseData = {
  semester2: [
    {
      title: 'Data Science',
      modules: [
        { text: 'Module 1', path: '/cs2/mod1.md', webview: false, qa: { name: "obj", path: "cs2/qa/js/levels.json", obj: 1 } },
        { text: 'Module 2', path: '/cs2/mod2.md', webview: false, qa: { name: "obj", path: "cs2/qa/js/levels.json", obj: 2 } },
        { text: 'Module 3', path: '/cs2/mod3.md', webview: false, qa: { name: "obj", path: "cs2/qa/js/levels.json", obj: 3 } },
        { text: 'Module 4', path: '/cs2/mod4.md', webview: false, qa: {} },
      ],
    },
    {
      title: 'Statistics',
      modules: [
        { text: 'Module 1', path: '/stat2/mod1', webview: false, qa: {} },
        { text: 'Module 2', path: '/stat2/mod2', webview: false, qa: {} },
        { text: 'Module 3', path: '/stat2/mod3', webview: false, qa: {} }
      ],
    },
    {
      title: 'Arabic',
      modules: [
        { text: 'Lesson 1', path: '/arabic/lesson1/', webview: true, qa: {} },
        { text: 'Lesson 2', path: '/arabic/lesson2/', webview: true, qa: {} },
        { text: 'Lesson 5', path: '/arabic/lesson5/', webview: true, qa: {} },
        { text: 'Lesson 7', path: '/arabic/lesson7/', webview: true, qa: {} },
      ],
    },
    {
      title: 'Web Design',
      modules: [
        { text: 'Module 1', path: '/cs2.1/mod1.md', webview: false, qa: {} },
        { text: 'Module 2', path: '/cs2.1/mod2.md', webview: false, qa: {} },
        { text: 'Module 3', path: '/cs2.1/mod3.md', webview: false, qa: {} },
        { text: 'Module 4', path: '/cs2.1/mod4.md', webview: false, qa: {} },
      ],
    }
  ],
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
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Reusable Module Button
  const ModuleButton = ({ text, path, webview, qa2, last }) => (
    <View className={`py-3 ${!last ? 'border-b':''} border-white/70 flex-row items-center`}>
      <TouchableOpacity
        className="flex-1"
        activeOpacity={0.8}
        onPress={() => {
          if (webview) {
            router.push(`/webview${path}`);
          } else {
            router.push(`/notes${path}`);
          }
        }}
      >
        <Text className="text-white text-lg">{text}</Text>
      </TouchableOpacity>
      {qa2  && (
        <TouchableOpacity
          className="px-4"
          activeOpacity={0.8}
          onPress={() => {
            const data = JSON.stringify({ title: text, qa: qa2 });
            console.log(data);
            router.push(`/cog?dt=${data}`);
          }}
        >
          <Ionicons name="caret-forward-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Reusable Course Card
  const CourseCard = ({ title, modules }) => (
    <View className="bg-[#222] rounded-[10px] p-5 shadow-lg">
      <Text className="text-2xl font-bold text-white mb-6 text-center">{title}</Text>
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
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#222222" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="max-w-5xl p-5">
          <View className="grid md:grid-cols-3 gap-3 mb-4">
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
    </View>
  );
};

export default Home;