import { StatusBar } from 'expo-status-bar';
import { ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import "./global.css"
import NavBar from './components/NavBar';
import Home from './pages/Home'
import { useState } from 'react';
import Routine from './pages/Routine';

export default function App() {
  const [current, setcurrent] = useState("Notes")
  return (

    <SafeAreaView className='flex-1'>
      <NavBar current={current} setCurrent={(newCurrent) => setcurrent(newCurrent)} />
      {current == "Notes" ? <Home /> : <></>}
      {current == "Routine" ? <Routine /> : <></>}
      <StatusBar style="auto" />
    </SafeAreaView>
  )

}