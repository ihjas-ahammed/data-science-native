import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RNFS from 'react-native-fs';

// Define initial course data
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
  const courseFilePath = `${RNFS.DocumentDirectoryPath}/course.json`;

  // Function to save course data to file
  const saveCourseData = async (data) => {
    try {
      await RNFS.writeFile(courseFilePath, JSON.stringify(data), 'utf8');
    } catch (error) {
      console.error('Error saving course data:', error);
    }
  };

  // Function to load course data from file
  const loadCourseData = async () => {
    try {
      const exists = await RNFS.exists(courseFilePath);
      if (exists) {
        const fileContent = await RNFS.readFile(courseFilePath, 'utf8');
        setCourseData(JSON.parse(fileContent));
      } else {
        // If file doesn't exist, use initial data and save it
        setCourseData(initialCourseData);
        await saveCourseData(initialCourseData);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setCourseData(initialCourseData); // Fallback to initial data
    }
  };

  // Function to download course data from GitHub
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

  // Initial load and attempt to download
  useEffect(() => {
    // Load local data first
    loadCourseData();

    // Attempt to download fresh data (runs async)
    downloadCourseData();

    // Set up periodic checking (every 5 minutes)
    const intervalId = setInterval(() => {
      downloadCourseData();
    }, 5 * 60 * 1000);

    // Cleanup interval
    return () => clearInterval(intervalId);
  }, []);

  // Reusable Module Button
  const ModuleButton = ({ text, path, webview, qa }) => (
    <View className="bg-white/20 rounded-[10px] flex-row mb-1 flex h-[40px] ">
      <TouchableOpacity
        className="h-full w-fit flex-1 px-4 justify-center"
        onPress={() => {
          if (webview) {
            router.push(`/webview${path}`)
          } else {
            router.push(`/notes${path}`)
          }
        }}
      >
        <Text className="text-white">{text}</Text>
      </TouchableOpacity>
      {qa.obj ?
        <TouchableOpacity
          className="flex h-full justify-center px-4"
          onPress={() => {
            let t = JSON.stringify({title:text,qa:qa})
            console.log(t)
            router.push(`/cog?dt=${t}`)
          }}>
          <Ionicons name="cog-outline" size={24} color="white" />
        </TouchableOpacity>
        : <></>}
    </View>
  );

  // Reusable Course Card 
  const CourseCard = ({ semester, title, modules, colSpan }) => (
    <View className={`bg-black rounded-[10px] p-5 flex`}>
      <Text className="text-2xl font-bold text-white mb-6 mx-auto">{title}</Text>
      <View className="flex flex-col">
        {modules.map((module, idx) => (
          <ModuleButton key={idx} text={module.text} path={module.path} webview={module.webview} qa={module.qa} />
        ))}
      </View>
    </View>
  );

  // Show loading state while courseData is null
  if (!courseData) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="max-w-5xl p-5">
        {/* Semester 2 */}
        <View className="grid md:grid-cols-3 gap-3 mb-4">
          {courseData.semester2.map((course, idx) => (
            <CourseCard
              key={idx}
              semester={course.title === 'Maths' ? 'Old Files and Projects' : 'Semester 2'}
              title={course.title}
              modules={course.modules}
              colSpan={course.colSpan}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default Home;