import React from 'react';
import { View, TouchableOpacity, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';

const NavBar = ({ current, setCurrent }) => { // Added proper prop destructuring
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('username');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView className="max-w-5xl" style={{ backgroundColor: "#222" }}>
      <View className="w-full flex-row justify-center pt-4 pb-2">
        {/* Home Button */}
        <TouchableOpacity
          className="bg-black/44 rounded-[10px] px-5 py-2.5 mx-2"
          onPress={() => setCurrent("Notes")}
        >
          <MaterialIcons name="notes" size={24} color="white" />
        </TouchableOpacity>

        {/* Progress Button */}
        <TouchableOpacity
          className="bg-black/44 rounded-[10px] px-5 py-2.5 mx-2"
          onPress={() => setCurrent("Progress")}
        >
          <Text className={`text-white my-auto font-bold text-xl ${current == "Progress" ? 'border-b-2 border-white':''}`}>PROGRESS</Text>
        </TouchableOpacity>

        {/* Routine Button */}
        <TouchableOpacity
          className="bg-black/44 rounded-[10px] px-5 py-2.5 mx-2"
          onPress={() => setCurrent("Routine")}
        >
          <Text className={`text-white my-auto font-bold text-xl ${current == "Routine" ? 'border-b-2 border-white':''}`}>ROUTINE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NavBar;