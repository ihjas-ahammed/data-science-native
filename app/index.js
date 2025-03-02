import { StatusBar } from 'expo-status-bar';
import { ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import "./global.css"
import NavBar from './components/NavBar';
import Home from './pages/Home'
import { useState } from 'react';
import Routine from './pages/Routine';
import { initializeApp } from "firebase/app";
import Progress from './pages/Progress';


const firebaseConfig = {
  apiKey: "AIzaSyAnjWWep4dtxvn1YKtmdU7A002X2NAvlX0",
  authDomain: "data-science-ef878.firebaseapp.com",
  databaseURL: "https://data-science-ef878-default-rtdb.firebaseio.com",
  projectId: "data-science-ef878",
  storageBucket: "data-science-ef878.firebasestorage.app",
  messagingSenderId: "1010841233830",
  appId: "1:1010841233830:web:e7aa0b516ace71c1720767",
  measurementId: "G-FL7XZR6X7Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default function App() {
  const [current, setcurrent] = useState("Notes")
  return (

    <SafeAreaView className='flex-1'>
    
          <StatusBar barStyle="light-content" backgroundColor="#000" />
      <NavBar current={current} setCurrent={(newCurrent) => setcurrent(newCurrent)} />
      {current == "Notes" ? <Home /> : <></>}
      {current == "Routine" ? <Routine firebaseApp={app}/> : <></>}
      {current == "Progress" ? <Progress firebaseApp={app} setPage={(page)=>setcurrent(page)}/>: <></>}
      <StatusBar style="auto" />
    </SafeAreaView>
  )

}