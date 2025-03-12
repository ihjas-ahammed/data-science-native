import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const Lesson = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()

    const { subject, index, subInt, lesson } = JSON.parse(exp)

    // Get a background color based on the subject
    const getSubjectColor = () => {
        const colors = {
            math: 'bg-blue-600',
            science: 'bg-green-600',
            history: 'bg-amber-600',
            language: 'bg-purple-600',
            default: 'bg-indigo-600'
        }
        return colors[subject.name?.toLowerCase()] || colors.default
    }

    // Get an icon based on tool type
    const getToolIcon = (toolName) => {
        const toolIcons = {
            quiz: "help-circle",
            video: "videocam",
            reader: "document-text",
            practice: "pencil",
            calculator: "calculator",
            flashcards: "card",
            default: "apps"
        }
        
        // Check if tool name contains any of the keys
        for (const [key, icon] of Object.entries(toolIcons)) {
            if (toolName.toLowerCase().includes(key)) {
                return icon
            }
        }
        return toolIcons.default
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            
            {/* Enhanced Action Bar */}
            <View className={`${getSubjectColor()} shadow-md`}>
                <View className="flex-row items-center justify-between py-4 px-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            className="p-2 bg-white/20 rounded-full"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-xl ml-3">{lesson.name}</Text>
                    </View>
                    
                </View>
                
            </View>
            
            {/* Enhanced Tools List */}
            <ScrollView className="px-4 pt-2 pb-8">
                {lesson.tools.map((tool, i) => (
                    <TouchableOpacity 
                        key={i} 
                        onPress={() => router.push(`/tools/${tool.name}?exp=${exp}`)}
                        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
                    >
                        <View className="flex-row items-center p-4">
                            <View className={`${getSubjectColor()} bg-opacity-20 w-12 h-12 rounded-full items-center justify-center`}>
                                <Ionicons name={getToolIcon(tool.name)} size={24} color={"#fff"} />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-gray-800 text-lg">{tool.label}</Text>
                                <Text className="text-gray-500 mt-1" numberOfLines={1}>
                                    {`Upto ${tool.score} points`}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>
                ))}
                
                {/* Empty state if no tools */}
                {lesson.tools.length === 0 && (
                    <View className="items-center justify-center py-16">
                        <Ionicons name="construct-outline" size={56} color="#D1D5DB" />
                        <Text className="text-gray-400 text-lg mt-4">No tools available</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default Lesson