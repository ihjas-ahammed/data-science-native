import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import './global.css';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import { useState } from 'react';
import Routine from './pages/Routine';
import { initializeApp } from 'firebase/app';
import Progress from './pages/Progress';
import analytics from '@react-native-firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAnjWWep4dtxvn1YKtmdU7A002X2NAvlX0',
  authDomain: 'data-science-ef878.firebaseapp.com',
  databaseURL: 'https://data-science-ef878-default-rtdb.firebaseio.com',
  projectId: 'data-science-ef878',
  storageBucket: 'data-science-ef878.firebasestorage.app',
  messagingSenderId: '1010841233830',
  appId: '1:1010841233830:web:e7aa0b516ace71c1720767',
  measurementId: 'G-FL7XZR6X7Q',
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default function App() {
  const [current, setCurrent] = useState('Notes');

  useEffect(() => {
    // Log a custom event when the app mounts
    analytics().logEvent('app_open', {
      description: 'App was opened',
    });
  }, []);

  const logScreenView = async (screenName) => {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  };

  // Define page titles for display
  const pageTitles = {
    Notes: 'Notes',
    Routine: 'Routine',
    Progress: 'Progress',
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View className="h-[1px] bg-indigo-100 dark:bg-indigo-800" />
      <View className="py-4 px-5 border-b border-indigo-100 dark:border-indigo-800">
        <Text className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 text-center">
          {pageTitles[current]}
        </Text>
      </View>
      <View className="flex-1">
        {current === 'Notes' && <Home />}
        {current === 'Routine' && <Routine firebaseApp={app} />}
        {current === 'Progress' && (
          <Progress firebaseApp={app} setPage={setCurrent} />
        )}
      </View>
      <NavBar current={current} setCurrent={setCurrent} />
    </SafeAreaView>
  );
}