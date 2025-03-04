import { View, Text, StatusBar, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import * as SecureStore from 'expo-secure-store';
import CustomProgressBar from './components/cog/CustomProgressBar';

import { MaterialIcons } from '@expo/vector-icons';


const cog = () => {
  // Extract parameters from the route
  const { dt } = useLocalSearchParams();
  const { qa, title } = JSON.parse(dt);
  const { path, obj } = qa;

  // State definitions
  const [data, setData] = useState([]); // Initialize as empty array to avoid mapping errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({}); // Store scores for each section

  // Define file path for quiz data
  const filePath = `${RNFS.DocumentDirectoryPath}/quiz_data/${path}`;
  const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));

  // Function to sanitize section names for SecureStore keys
  const sanitizeKey = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  // Load quiz data from file or download it
  useEffect(() => {
    const loadData = async () => {
      try {
        const fileExists = await RNFS.exists(filePath);
        if (fileExists) {
          const fileContent = await RNFS.readFile(filePath, 'utf8');
          setData(JSON.parse(fileContent));
        } else {
          await RNFS.mkdir(directoryPath, { NSURLIsExcludedFromBackupKey: true });
          const downloadUrl = `https://ihjas-ahammed.github.io/${path}`;
          const downloadResult = await RNFS.downloadFile({
            fromUrl: downloadUrl,
            toFile: filePath,
          }).promise;
          if (downloadResult.statusCode === 200) {
            const downloadedContent = await RNFS.readFile(filePath, 'utf8');
            setData(JSON.parse(downloadedContent));
          } else {
            throw new Error('Download failed');
          }
        }
      } catch (err) {
        setError('Failed to load quiz data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [path]);

  // Load scores from SecureStore once data is available
  useEffect(() => {
    const loadScores = async () => {
      const scorePromises = data[obj+""].map((section) => {
        const key = sanitizeKey(section.name);
        return SecureStore.getItemAsync(key).then((scr) => ({
          key,
          score: scr ? parseInt(scr, 10) : 0,
        }));
      });
      const scoresArray = await Promise.all(scorePromises);
      const scoresObj = scoresArray.reduce((acc, { key, score }) => {
        acc[key] = score;
        return acc;
      }, {});

      setScores(scoresObj)

    }
    loadScores();
  });

  // Loading state UI
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  // Error state UI
  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">{error}</Text>
      </SafeAreaView>
    );
  }

  const handleExit = () => {
    router.back();
  };

  // Main UI with list of section cards
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <View className="h-14 bg-indigo-600 flex-row items-center px-4 shadow-md">
        <TouchableOpacity className="p-2" onPress={handleExit}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1 ml-4">{title}</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        {data[obj + ""].map((section, index) => {
          const key = sanitizeKey(section.name);
          const score = scores[key] || 0;
          const total = section.qa.length;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                router.push('/quiz?qs=' + JSON.stringify({ name: section.name, qa: section.qa, key: key }));
              }}
              className="p-4 bg-white rounded-xl shadow-lg mb-4 border border-gray-200"
            >
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                {section.name}
              </Text>
              <View className="flex-row items-center">
                <CustomProgressBar progress={total > 0 ? score / total : 0} height={10} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default cog;