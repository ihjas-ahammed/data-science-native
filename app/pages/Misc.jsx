import { View, Text, TouchableHighlight } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import ApiKeyManager from '../components/cog/ApiKeyManager'
import * as SecureStore from 'expo-secure-store'

const Extras = () => {
    const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
    const [savedApiKey, setSavedApiKey] = useState('');

    useEffect(()=>{
        const loadApiKey = async () => {
            const apiKey = await SecureStore.getItemAsync('google-api')
            if(apiKey) setSavedApiKey(apiKey)
        }

        loadApiKey()
    },[])


    return (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-indigo-100 dark:border-indigo-800">
            <View className="flex-column gap-2 items-center mb-3 p-2 rounded-lg">
                <TouchableHighlight
                    underlayColor="#E0E7FF"
                    onPress={() => router.push("pages/BusTracker")}
                    className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
                >
                    <View className="flex-row justify-between items-center w-full">
                        <View>
                            <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                                Bus Tracker
                            </Text>
                        </View>
                        <Ionicons name="location" size={24} color="#6366f1" />
                    </View>
                </TouchableHighlight>
                <TouchableHighlight
                    underlayColor="#E0E7FF"
                    onPress={() => setApiKeyModalVisible(true)}
                    className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
                >
                    <View className="flex-row justify-between items-center w-full">
                        <View>
                            <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                                Manage Google API for AI
                            </Text>
                        </View>
                        <Ionicons name="cog-outline" size={24} color="#6366f1" />
                    </View>
                </TouchableHighlight>
            </View>
            <ApiKeyManager
                isVisible={apiKeyModalVisible}
                onClose={() => setApiKeyModalVisible(false)}
                savedApiKey={savedApiKey}
                onApiKeySaved={(newKey) => setSavedApiKey(newKey)}
            />
        </View>
    )
}

export default Extras