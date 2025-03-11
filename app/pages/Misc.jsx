import { View, Text, TouchableHighlight } from 'react-native'
import React from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

const Extras = () => {
    return (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-indigo-100 dark:border-indigo-800">
            <View className="flex-row items-center mb-3 bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
            <TouchableHighlight
                underlayColor="#E0E7FF"
                onPress={()=>router.push("pages/BusTracker")}
                className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
            >
                <View className="flex-row justify-between items-center w-full">
                    <View>
                        <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                            Bus Tracker
                        </Text>
                    </View> 
                    <Ionicons name="bus" size={24} color="#6366f1" />
                </View>
            </TouchableHighlight>
        </View>
        </View>
    )
}

export default Extras