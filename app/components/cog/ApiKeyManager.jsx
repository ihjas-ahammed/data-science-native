import React, { useState } from 'react';
import { View, Text, TouchableHighlight, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';

const ApiKeyManager = ({
  isVisible,
  onClose,
  savedApiKey,
  onApiKeySaved
}) => {
  const [apiKey, setApiKey] = useState('');

  const saveApiKey = async () => {
    try {
      if (apiKey.trim()) {
        await SecureStore.setItemAsync('google-api', apiKey.trim());
        onApiKeySaved(apiKey.trim());
        setApiKey('');
        onClose();
        alert('API key saved successfully!');
      } else {
        alert('Please enter a valid API key');
      }
    } catch (err) {
      console.error('Failed to save API key:', err);
      alert('Failed to save API key. Please try again.');
    }
  };

  const getApiKey = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
        <View className="h-14 bg-indigo-600 dark:bg-indigo-800 flex-row items-center px-4 shadow-md">
          <TouchableHighlight
            underlayColor="#4338CA"
            onPress={onClose}
            className="p-2 rounded-full"
          >
            <MaterialIcons name="close" size={24} color="#E0E7FF" />
          </TouchableHighlight>
          <Text className="text-indigo-50 text-lg font-bold flex-1 ml-4">
            Google API Key
          </Text>
        </View>

        <View className="flex-1 p-4">
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-semibold mb-1">
              Current Status
            </Text>
            <View className="flex-row items-center">
              <MaterialIcons
                name={savedApiKey ? "check-circle" : "error"}
                size={20}
                color={savedApiKey ? "#10b981" : "#ef4444"}
              />
              <Text className={`ml-2 ${savedApiKey ? "text-green-500" : "text-red-500"}`}>
                {savedApiKey ? "API Key is configured" : "No API Key set"}
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-semibold mb-4">
              Enter Google API Key
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700"
              placeholder="Paste your API key here"
              value={apiKey}
              onChangeText={setApiKey}
              placeholderTextColor="#9ca3af"
              secureTextEntry={true}
            />
            <TouchableHighlight
              underlayColor="#4338CA"
              onPress={saveApiKey}
              className="bg-indigo-600 dark:bg-indigo-700 rounded-lg p-3 items-center"
            >
              <Text className="text-white font-semibold">Save API Key</Text>
            </TouchableHighlight>
          </View>

          <TouchableHighlight
            underlayColor="#E0E7FF"
            onPress={getApiKey}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex-row items-center justify-between"
          >
            <View>
              <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                Get Google API Key
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 mt-1">
                Opens Google AI Studio website
              </Text>

              <MaterialIcons name="open-in-new" size={24} color="#6366f1" />
            </View>
          </TouchableHighlight>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ApiKeyManager;