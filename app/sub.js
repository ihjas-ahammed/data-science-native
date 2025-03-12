import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const Subject = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()

    const { subject, index } = JSON.parse(exp)

    return (
        <SafeAreaView className="flex-1 ">
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            {/* Action Bar */}
            <View className="flex-row items-center  bg-indigo-600 py-2 px-4">
                <TouchableOpacity 
                    className="p-2"
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg ml-2">{subject.name}</Text>
                
            </View>

            {/* Lessons List */}
            <ScrollView className="p-4">
                {subject.lessons.map((e, i) => (
                    <TouchableOpacity 
                        key={i}
                        className="bg-white rounded-xl mb-3 shadow-sm"
                        onPress={() => {
                            router.push(`/lesson?exp=${JSON.stringify({
                                subject: subject,
                                subInt: index,
                                lesson: e,
                                index: i
                            })}`)
                        }}
                    >
                        <View className="flex-row items-center p-4">
                            <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                <Text className="font-bold text-indigo-600">{i + 1}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-800 mb-1">{e.name}</Text>
                                {e.duration && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm text-gray-500 ml-1">{e.duration}</Text>
                                    </View>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}

export default Subject