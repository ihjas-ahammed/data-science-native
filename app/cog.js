import { View, Text, StatusBar, ActivityIndicator, ScrollView, TouchableHighlight } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import CustomProgressBar from './components/cog/CustomProgressBar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const cog = () => {
  const { dt } = useLocalSearchParams();
  const { qa, title } = JSON.parse(dt);
  const { path, obj } = qa;

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [allWrongQuestions, setAllWrongQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('topics');

  const filePath = `${FileSystem.documentDirectory}quiz_data/${path}`;
  const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));

  const sanitizeKey = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  // Load quiz data when the component mounts or path changes
  useEffect(() => {
    const loadData = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
          setData(JSON.parse(fileContent));
        } else {
          await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
          const downloadUrl = `https://ihjas-ahammed.github.io/${path}`;
          const downloadResult = await FileSystem.downloadAsync(downloadUrl, filePath);
          if (downloadResult.status === 200) {
            const downloadedContent = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
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

  // Load scores and repractice questions every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadScoresAndRepractice = async () => {
        if (data && data[obj]) {
          const scorePromises = data[obj].map((section) => {
            const key = sanitizeKey(section.name);
            return SecureStore.getItemAsync(key).then((scr) => ({
              key,
              score: scr ? parseInt(scr, 10) : 0,
            }));
          });

          const repracticePromises = data[obj].map((section) => {
            const key = sanitizeKey(section.name);
            const repracticeKey = `repractice-${key}`;
            return SecureStore.getItemAsync(repracticeKey).then((str) => ({
              key,
              questions: str ? JSON.parse(str) : [],
            }));
          });

          const [scoresArray, repracticeArray] = await Promise.all([
            Promise.all(scorePromises),
            Promise.all(repracticePromises),
          ]);

          const scoresObj = scoresArray.reduce((acc, { key, score }) => {
            acc[key] = score;
            return acc;
          }, {});
          setScores(scoresObj);

          const allQuestions = repracticeArray.flatMap(({ questions }) => questions);
          setAllWrongQuestions(allQuestions);
        }
      };
      loadScoresAndRepractice();
    }, [data, obj])
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="white" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-red-500 text-lg">{error}</Text>
      </SafeAreaView>
    );
  }

  const handleExit = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#2d3748" />
      <View className="h-14 bg-gray-800 flex-row items-center px-4 shadow-md">
        <TouchableHighlight underlayColor="#4b5563" onPress={handleExit} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color="#e5e7eb" />
        </TouchableHighlight>
        <Text className="text-gray-200 text-lg font-bold flex-1 ml-4">{title}</Text>
      </View>
      <View className="flex-1">
        <ScrollView className="flex-1 p-4 mb-4">
          {activeTab === 'topics' ? (
            data[obj].map((section, index) => {
              const key = sanitizeKey(section.name);
              const score = scores[key] || 0;
              const total = section.qa.length;
              return (
                <TouchableHighlight
                  key={index}
                  onPress={() => {
                    router.push('/quiz?qs=' + JSON.stringify({ name: section.name, qa: section.qa, key: key }));
                  }}
                  underlayColor="#4b5563"
                  className="p-4 bg-gray-800 rounded-lg mb-4 border border-gray-700"
                >
                  <View>
                    <Text className="text-xl font-semibold text-gray-200 mb-3">
                      {section.name}
                    </Text>
                    <View className="flex-row items-center">
                      <CustomProgressBar progress={total > 0 ? score / total : 0} height={10} />
                    </View>
                  </View>
                </TouchableHighlight>
              );
            })
          ) : (
            <TouchableHighlight
              onPress={() => {
                if (allWrongQuestions.length > 0) {
                  router.push('/quiz?qs=' + JSON.stringify({
                    name: "Repractice",
                    qa: allWrongQuestions,
                    key: "repractice",
                    maxNo: allWrongQuestions.length,
                  }));
                } else {
                  alert("No questions to repractice.");
                }
              }}
              underlayColor="#4b5563"
              className="p-4 bg-gray-800 rounded-lg mb-4 border border-gray-700"
            >
              <View>
                <Text className="text-xl font-semibold text-gray-200 mb-3">
                  Repractice ({allWrongQuestions.length} questions)
                </Text>
              </View>
            </TouchableHighlight>
          )}
        </ScrollView>
        <View className="h-16 bg-gray-800 flex-row items-center justify-around shadow-md">
          <TouchableHighlight
            underlayColor="#4b5563"
            onPress={() => setActiveTab('topics')}
            className="flex-1 items-center justify-center"
          >
            <View className="items-center">
              <MaterialIcons
                name="library-books"
                size={24}
                color={activeTab === 'topics' ? '#e5e7eb' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${activeTab === 'topics' ? 'text-gray-200' : 'text-gray-400'}`}
              >
                Topics
              </Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor="#4b5563"
            onPress={() => setActiveTab('tools')}
            className="flex-1 items-center justify-center"
          >
            <View className="items-center">
              <MaterialIcons
                name="build"
                size={24}
                color={activeTab === 'tools' ? '#e5e7eb' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${activeTab === 'tools' ? 'text-gray-200' : 'text-gray-400'}`}
              >
                Tools
              </Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default cog;