import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // Modern storage solution
import { MaterialIcons } from '@expo/vector-icons';
import '../global.css'

const NavBar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('username'); // Remove username key
      router.replace('/'); // Redirect to home
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View className="max-w-5xl mx-auto">
      <View className="mb-8 w-full">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}
        >
          {/* Home Button */}
          <TouchableOpacity
            className="flex h-fit bg-black/44 rounded-[10px] px-5 py-2.5 mr-2"
            onPress={() => router.push('/')}
          >
            <MaterialIcons name="notes" size={24} color="white" />
          </TouchableOpacity>

          {/* Progress Button */}
          <TouchableOpacity
            className="flex h-fit bg-black/44 rounded-[10px] px-5 py-2.5 mr-2"
            onPress={() => router.push('/progress')}
          >
            <MaterialIcons name="percent" size={24} color="white" />
          </TouchableOpacity>

          {/* Routine Button */}
          <TouchableOpacity
            className="flex h-fit bg-black/44 rounded-[10px] px-5 py-2.5 mr-2"
            onPress={() => router.push('/routine')}
          >
            <MaterialIcons name="task" size={24} color="white" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            className="flex h-fit bg-black/44 rounded-[10px] px-5 py-2.5 ml-auto"
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default NavBar;