import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Define course data in an object
const courseData = {
  semester2: [
    {
      title: 'Data Science',
      modules: [
        { text: 'Module 1', path: '/cs2/mod1.md' ,webview: false, qa: {name:"obj",path:"/cs2/qa/js/levels.json", obj: 1}  },
        { text: 'Module 2', path: '/cs2/mod2.md' ,webview: false, qa: {name:"obj",path:"/cs2/qa/js/levels.json", obj: 2}},
        { text: 'Module 3', path: '/cs2/mod3.md' , webview: false, qa: {name:"obj",path:"/cs2/qa/js/levels.json", obj: 3}},
        { text: 'Module 4', path: '/cs2/mod4.md', webview: false, qa: {} },
      ],
    },
    {
      title: 'Statistics',
      modules: [
        { text: 'Module 1', path: '/stat2/mod1' , webview: false, qa: {}},
        { text: 'Module 2', path: '/stat2/mod2' ,webview: false, qa: {}},
        { text: 'Module 3', path: '/stat2/mod3' ,webview: false, qa: {}}
      ],
    },
    {
      title: 'Arabic',
      modules: [
        { text: 'Lesson 1', path: '/arabic/lesson1/' , webview: true, qa: {}},
        { text: 'Lesson 2', path: '/arabic/lesson2/' ,webview: true, qa: {}},
        { text: 'Lesson 5', path: '/arabic/lesson5/' ,webview: true , qa: {}},
        { text: 'Lesson 7', path: '/arabic/lesson7/' ,webview: true , qa: {}},
      ],
    },
    {
      title: 'Web Design',
      modules: [
        { text: 'Module 1', path: '/cs2.1/mod1.md' ,webview: false , qa: {}},
        { text: 'Module 2', path: '/cs2.1/mod2.md' , webview: false , qa: {}},
        { text: 'Module 3', path: '/cs2.1/mod3.md' , webview: false , qa: {}},
        { text: 'Module 4', path: '/cs2.1/mod4.md' , webview: false , qa: {}},
      ],
    }
  ],
};

const Home = () => {
  const router = useRouter();

  // Reusable Module Button
  const ModuleButton = ({ text, path, webview }) => (
    <TouchableOpacity
      className="bg-white/20 rounded-[10px] px-5 py-5 mb-1"
      onPress={() => {
          if(webview){
            router.push(`/webview${path}`)
          }else{
            router.push(`/notes${path}`)
          }
      }}
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
          <ModuleButton key={idx} text={module.text} path={module.path} webview={module.webview} />
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