import { StatusBar } from 'expo-status-bar';
import { ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import "./global.css"
import NavBar from './components/NavBar';
import Home from './components/Home';

export default function App() {
  return (

    <SafeAreaView className='flex-1'>
      <ImageBackground
        source={require('../assets/splash-bg.png')} // Adjust path if in assets folder
        resizeMode="cover"
        className='flex-1 overflow-y-scroll no-scrollbar bg-center p-6 pt-10 w-full'
      >
        <NavBar/>
        <Home/>
        <StatusBar style="auto" />
      </ImageBackground>
    </SafeAreaView>
  )

}