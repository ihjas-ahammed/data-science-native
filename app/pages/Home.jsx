import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Define course data in an object
const courseData = {
  semester2: [
    {
      title: 'Data Science',
      modules: [
        { text: 'Module 1', path: '/cs2/mod1.md' },
        { text: 'Module 2', path: '/cs2/mod2.md' },
        { text: 'Module 3', path: '/cs2/mod3.md' },
        { text: 'Module 4', path: '/cs2/mod4.md' },
        { text: 'Objectives', path: '/cs2/qa/' },
      ],
    },
    {
      title: 'Statistics',
      modules: [
        { text: 'Module 1', path: '/stat2/mod1' },
        { text: 'Module 2', path: '/stat2/mod2' },
        { text: 'Module 3', path: '/stat2/mod3' }
      ],
    },
    {
      title: 'Arabic',
      modules: [
        { text: 'Lesson 1', path: '/arabic/lesson1/' },
        { text: 'Lesson 2', path: '/arabic/lesson2/' },
        { text: 'Lesson 5', path: '/arabic/lesson5/' },
        { text: 'Lesson 7', path: '/arabic/lesson7/' },
      ],
    },
    {
      title: 'Web Design',
      modules: [
        { text: 'Module 1', path: '/cs2.1/mod1.md' },
        { text: 'Module 2', path: '/cs2.1/mod2.md' },
        { text: 'Module 3', path: '/cs2.1/mod3.md' },
        { text: 'Module 4', path: '/cs2.1/mod4.md' },
      ],
    }
  ],
};

const Home = () => {
  const router = useRouter();

  // Reusable Module Button
  const ModuleButton = ({ text, path }) => (
    <TouchableOpacity
      className="bg-white/20 rounded-[10px] px-5 py-5 mb-1"
      onPress={() => router.push(`/webview${path}`)}
    >
      <Text className="text-white">{text}</Text>
    </TouchableOpacity>
  );

  // Reusable Course Card 
  const CourseCard = ({ semester, title, modules, colSpan }) => (
    <View className={`bg-black rounded-[10px] p-5 flex`}>
      <Text className="text-2xl font-bold text-white mb-6 mx-auto">{title}</Text>
      <View className="flex flex-col">
        {modules.map((module, idx) => (
          <ModuleButton key={idx} text={module.text} path={module.path} />
        ))}
      </View>
    </View>
  );

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