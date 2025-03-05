import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import './global.css';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import { useState } from 'react';
import Routine from './pages/Routine';
import { initializeApp } from 'firebase/app';
import Progress from './pages/Progress';

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

  // Define page titles for display
  const pageTitles = {
    Notes: 'Notes',
    Routine: 'Routine',
    Progress: 'Progress',
  };

  return (
    <SafeAreaView className="flex-1 bg-[#222222]">
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <Text className="text-2xl font-bold text-white text-center mt-4 h-14">
        {pageTitles[current]}
      </Text>
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