import { View, Text,StatusBar, TouchableHighlight } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

const timeData = {
    "S.S College": {
        "EDAVANNAPPARA": [
            "06:30 AM", "06:35 AM", "06:40 AM", "06:55 AM", "07:20 AM", "07:40 AM", "07:55 AM",
            "08:10 AM", "08:15 AM", "08:30 AM", "08:40 AM", "08:50 AM", "09:05 AM", "09:25 AM",
            "09:40 AM", "10:05 AM", "10:13 AM", "10:18 AM", "10:40 AM", "10:50 AM", "11:05 AM",
            "11:20 AM", "11:38 AM", "11:55 AM", "12:03 PM", "12:18 PM", "12:30 PM", "12:40 PM",
            "01:08 PM", "01:32 PM", "01:42 PM", "01:50 PM", "01:55 PM", "02:05 PM", "02:15 PM",
            "02:25 PM", "02:48 PM", "03:00 PM", "03:10 PM", "03:25 PM", "03:40 PM", "04:05 PM",
            "04:20 PM", "04:37 PM", "04:50 PM", "04:55 PM", "05:10 PM", "05:22 PM", "05:35 PM",
            "05:45 PM", "05:53 PM", "05:55 PM", "06:03 PM", "06:13 PM", "06:23 PM", "06:35 PM",
            "06:45 PM", "06:58 PM", "07:10 PM", "07:30 PM"
        ]
    }
}

const BusTracker = () => {
  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
          <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
    
          {/* Header */}
          <View className="h-14 bg-indigo-600 dark:bg-indigo-800 flex-row items-center px-4 shadow-md">
            <TouchableHighlight underlayColor="#4338CA" onPress={()=>router.back()} className="p-2 rounded-full">
              <MaterialIcons name="arrow-back" size={24} color="#E0E7FF" />
            </TouchableHighlight>
            <Text className="text-indigo-50 text-lg font-bold flex-1 ml-4">{"Bus Time Tracker"}</Text>
            
          </View>
    
          {/* Main Content */}
          <View className="flex-1">

          </View>
        </SafeAreaView>
  )
}

export default BusTracker