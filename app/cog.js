import { View, Text, StatusBar, ActivityIndicator, ScrollView, TouchableHighlight, Modal, TextInput, Image, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Markdown from 'react-native-markdown-display';
import TestComponent from './components/TestComponent';

// Utility function to shuffle an array (Fisher-Yates algorithm)
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Define sample sizes for each section
const sampleSizes = {
  "Section A": 8,
  "Section B": 5,
  "Section C": 1
};

const cog = () => {
  const { dt } = useLocalSearchParams();
  const { qa, title } = JSON.parse(dt);
  const { path, obj } = qa;

  const [data, setData] = useState([]);
  const [sampleQ, setSampleQ] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [allWrongQuestions, setAllWrongQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('topics');
  const [modalVisible, setModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');

  const [isDiceRolled, setIsDiceRolled] = useState(false)

  const filePath = `${FileSystem.documentDirectory}quiz_data/${path}`;
  const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
  // Use sanitized title for the sample questions file path
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const sampleFilePath = `${FileSystem.documentDirectory}quiz_data/${sanitizedTitle}/sample_current.json`;

  const sanitizeKey = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  // Load Google API key from secure storage
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const storedApiKey = await SecureStore.getItemAsync('google-api');
        if (storedApiKey) {
          setSavedApiKey(storedApiKey);
        }
      } catch (err) {
        console.error('Failed to load API key:', err);
      }
    };
    loadApiKey();
  }, []);

  // Load main quiz data
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

  const reloadSampleQ = async () => {
    try {
      setIsLoading(true);
      await FileSystem.deleteAsync(filePath);
      await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
      const downloadUrl = `https://ihjas-ahammed.github.io/${path}`;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, filePath);
      if (downloadResult.status === 200) {
        const downloadedContent = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
        setData(JSON.parse(downloadedContent));
      } else {
        throw new Error('Download failed');
      }

      if (data && data.sample && data.sample.sections) {
        const generatedSampleQ = data.sample.sections.map(section => {
          const questions = section.questions;
          const sampleSize = sampleSizes[section.name] || 0;
          const availableQuestions = questions.length;
          const numToSelect = Math.min(sampleSize, availableQuestions);
          const selectedQuestions = shuffle([...questions]).slice(0, numToSelect);
          return {
            name: section.name,
            marks: section.marks || 0,
            questions: selectedQuestions
          };
        });

        await FileSystem.writeAsStringAsync(sampleFilePath, JSON.stringify(generatedSampleQ), { encoding: FileSystem.EncodingType.UTF8 });
        setSampleQ(generatedSampleQ);
        setIsDiceRolled(true)
      }
    } catch (err) {
      setError('Failed to reload quiz data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load or generate sampleQ after main data is loaded
  useEffect(() => {
    if (data && data[obj]) {
      const loadSampleQ = async () => {
        try {
          // Ensure the directory exists
          const sampleDirectory = sampleFilePath.substring(0, sampleFilePath.lastIndexOf('/'));
          await FileSystem.makeDirectoryAsync(sampleDirectory, { intermediates: true });

          const fileInfo = await FileSystem.getInfoAsync(sampleFilePath);
          if (fileInfo.exists) {
            // Load existing sampleQ
            const fileContent = await FileSystem.readAsStringAsync(sampleFilePath, { encoding: FileSystem.EncodingType.UTF8 });
            setSampleQ(JSON.parse(fileContent));

            setIsDiceRolled(true)
          } else if (data.sample && data.sample.sections) {
            // Generate sampleQ
            const generatedSampleQ = data.sample.sections.map(section => {
              const questions = section.questions;
              const sampleSize = sampleSizes[section.name] || 0;
              const availableQuestions = questions.length;
              const numToSelect = Math.min(sampleSize, availableQuestions);
              const selectedQuestions = shuffle([...questions]).slice(0, numToSelect);
              return {
                name: section.name,
                marks: section.marks || 0,
                questions: selectedQuestions
              };
            });
            // Save to file
            await FileSystem.writeAsStringAsync(sampleFilePath, JSON.stringify(generatedSampleQ), { encoding: FileSystem.EncodingType.UTF8 });
            setSampleQ(generatedSampleQ);
          }
        } catch (err) {
          console.error('Failed to load or generate sample questions:', err);
        }
      };
      loadSampleQ();
    }
  }, [data, obj]);

  const loadRepracticeQuestions = useCallback(async () => {
    if (data && data[obj]) {
      const repracticePromises = data[obj].map((section) => {
        const key = sanitizeKey(title + section.name);
        const repracticeKey = `repractice-${key}`;
        return SecureStore.getItemAsync(repracticeKey).then((str) => ({
          key,
          questions: str ? JSON.parse(str) : [],
        }));
      });
      const repracticeArray = await Promise.all(repracticePromises);
      const allQuestions = repracticeArray.flatMap(({ key, questions }) =>
        questions.map((question, index) => ({ sectionKey: key, question, index }))
      );
      setAllWrongQuestions(allQuestions);
    }
  }, [data, obj, title]);

  useFocusEffect(
    useCallback(() => {
      const loadScoresAndRepractice = async () => {
        if (data && data[obj]) {
          const scorePromises = data[obj].map((section) => {
            const key = sanitizeKey(title + section.name);
            return SecureStore.getItemAsync(key).then((scr) => ({
              key,
              score: scr ? parseInt(scr, 10) : 0,
            }));
          });
          const [scoresArray] = await Promise.all([Promise.all(scorePromises)]);
          const scoresObj = scoresArray.reduce((acc, { key, score }) => {
            acc[key] = score;
            return acc;
          }, {});
          setScores(scoresObj);
          await loadRepracticeQuestions();
        }
      };
      loadScoresAndRepractice();
    }, [data, obj, loadRepracticeQuestions])
  );

  const removeQuestion = async (sectionKey, questionIndex) => {
    try {
      const repracticeKey = `repractice-${sectionKey}`;
      const str = await SecureStore.getItemAsync(repracticeKey);
      if (str) {
        const questions = JSON.parse(str);
        questions.splice(questionIndex, 1);
        await SecureStore.setItemAsync(repracticeKey, JSON.stringify(questions));
        await loadRepracticeQuestions();
      }
    } catch (err) {
      console.error('Failed to remove question:', err);
    }
  };

  const saveApiKey = async () => {
    try {
      if (apiKey.trim()) {
        await SecureStore.setItemAsync('google-api', apiKey.trim());
        setSavedApiKey(apiKey.trim());
        setApiKey('');
        setApiKeyModalVisible(false);
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-indigo-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-indigo-50 dark:bg-gray-900">
        <Text className="text-red-500 text-lg">{error}</Text>
      </SafeAreaView>
    );
  }

  const handleExit = () => {
    router.back();
  };

  // Custom progress bar component to match TestComponent style
  const GameProgressBar = ({ score, total }) => {
    // Calculate percentage
    const percentage = (score / total) * 100;

    // Determine color based on score percentage
    const getProgressColor = () => {
      if (percentage < 40) return '#FF4D4D'; // Bright red for low scores
      if (percentage < 70) return '#FFD700'; // Gold for medium scores
      return '#32CD32'; // Lime green for high scores
    };

    // Create array of circles based on total
    const circles = Array.from({ length: total > 10 ? 10 : total }, (_, i) => i + 1);
    const filledCircles = Math.ceil((circles.length * score) / total);

    return (
      <View className="flex-row flex-wrap max-w-full justify-end">
        {circles.map((circle, index) => {
          // Determine if this circle should be filled based on score
          const isActive = index < filledCircles;

          return (
            <View
              key={circle}
              className={`h-2 w-2 rounded-full m-0.5 ${isActive ? 'shadow' : ''}`}
              style={{
                backgroundColor: isActive ? getProgressColor() : 'rgba(255,255,255,0.3)',
                shadowColor: isActive ? getProgressColor() : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isActive ? 0.7 : 0,
                shadowRadius: isActive ? 2 : 0,
              }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View className="h-14 bg-indigo-600 dark:bg-indigo-800 flex-row items-center px-4 shadow-md">
        <TouchableHighlight underlayColor="#4338CA" onPress={handleExit} className="p-2 rounded-full">
          <MaterialIcons name="arrow-back" size={24} color="#E0E7FF" />
        </TouchableHighlight>
        <Text className="text-indigo-50 text-lg font-bold flex-1 ml-4">{title}</Text>
        {activeTab === 'test' && (
          <TouchableHighlight underlayColor="#4338CA" onPress={reloadSampleQ} className="p-2 rounded-full">
            <Ionicons name="dice" size={24} color="#E0E7FF" />
          </TouchableHighlight>
        )}
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView className="flex-1 p-4 mb-4">
          {activeTab === 'topics' ? (
            data[obj]?.map((section, index) => {
              const key = sanitizeKey(title + section.name);
              const score = scores[key] || 0;
              const total = section.qa.length < 10 ? section.qa.length : 9;
              return (
                <TouchableHighlight
                  key={index}
                  onPress={() => {
                    router.push('/quiz?qs=' + JSON.stringify({ name: section.name, qa: section.qa, key: key }));
                  }}
                  underlayColor="#E0E7FF"
                  className="mb-4 rounded-lg overflow-hidden"
                >
                  <View className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-indigo-100 dark:border-indigo-800">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="stars" size={24} color="#6366f1" />
                      <Text className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 ml-2">
                        {section.name}
                      </Text>
                    </View>

                    <View className="bg-indigo-50 dark:bg-gray-700 p-3 rounded-lg relative">
                      <View className="absolute top-2 right-2 z-10">
                        <GameProgressBar score={score} total={total} />
                      </View>

                      <View style={{ paddingTop: 20 }}>
                        <Text className="text-gray-600 dark:text-gray-300">
                          {score}/{total} completed
                        </Text>
                        {score >= total ? (
                          <View className="flex-row items-center mt-1">
                            <MaterialIcons name="check-circle" size={18} color="#10b981" />
                            <Text className="text-green-500 ml-1">Completed!</Text>
                          </View>
                        ) : (
                          <Text className="text-indigo-600 dark:text-indigo-300 mt-1">
                            Tap to continue quiz
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableHighlight>
              );
            })
          ) : activeTab === 'tools' ? (
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-indigo-100 dark:border-indigo-800">
              <View className="flex-row items-center mb-3 bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                <MaterialIcons name="build" size={24} color="#6366f1" />
                <Text className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 ml-2">
                  Tools & Practice
                </Text>
              </View>

              <TouchableHighlight
                onPress={() => {
                  if (allWrongQuestions.length > 0) {
                    router.push('/quiz?qs=' + JSON.stringify({
                      name: "Repractice",
                      qa: allWrongQuestions.map(item => item.question),
                      key: "repractice",
                      maxNo: allWrongQuestions.length,
                    }));
                  } else {
                    alert("No questions to repractice.");
                  }
                }}
                underlayColor="#E0E7FF"
                className="mb-4 p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg relative"
              >
                <View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                      Repractice Questions
                    </Text>
                    <Text className="text-indigo-600 dark:text-indigo-300 font-semibold">
                      {allWrongQuestions.length}
                    </Text>
                  </View>
                  <Text className="text-gray-600 dark:text-gray-300 mt-1">
                    Review questions you've struggled with
                  </Text>
                </View>
              </TouchableHighlight>

              <TouchableHighlight
                onPress={() => setModalVisible(true)}
                underlayColor="#E0E7FF"
                className="mb-4 p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                      Manage Practice Items
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 mt-1">
                      Edit your repractice question list
                    </Text>
                  </View>
                  <MaterialIcons name="edit" size={24} color="#6366f1" />
                </View>
              </TouchableHighlight>

              {/* New API Key Management Section */}
              <TouchableHighlight
                onPress={() => setApiKeyModalVisible(true)}
                underlayColor="#E0E7FF"
                className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-800 dark:text-gray-200 font-semibold">
                      Manage Google API Key
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 mt-1">
                      {savedApiKey ? "API key is configured" : "Set your Google API key for AI features"}
                    </Text>
                  </View>
                  <MaterialIcons name="vpn-key" size={24} color="#6366f1" />
                </View>
              </TouchableHighlight>
            </View>
          ) : (
            sampleQ.length > 0 ? (
              <TestComponent sampleQ={sampleQ} isDiceRolled={isDiceRolled} />
            ) : (
              <View className="flex items-center justify-center p-4">
                <Text className="text-gray-500">No tests available!</Text>
              </View>
            )
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="h-16 bg-white dark:bg-gray-800 flex-row items-center justify-around shadow-lg border-t border-indigo-100 dark:border-indigo-800">
          <TouchableHighlight
            underlayColor="#E0E7FF"
            onPress={() => setActiveTab('topics')}
            className="flex-1 items-center justify-center"
          >
            <View className="items-center">
              <MaterialIcons
                name="quiz"
                size={24}
                color={activeTab === 'topics' ? '#6366f1' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${activeTab === 'topics' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                Quiz
              </Text>
            </View>
          </TouchableHighlight>

          <TouchableHighlight
            underlayColor="#E0E7FF"
            onPress={() => setActiveTab('test')}
            className="flex-1 items-center justify-center"
          >
            <View className="items-center">
              <MaterialIcons
                name="assignment"
                size={24}
                color={activeTab === 'test' ? '#6366f1' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${activeTab === 'test' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                Test
              </Text>
            </View>
          </TouchableHighlight>

          <TouchableHighlight
            underlayColor="#E0E7FF"
            onPress={() => setActiveTab('tools')}
            className="flex-1 items-center justify-center"
          >
            <View className="items-center">
              <MaterialIcons
                name="build"
                size={24}
                color={activeTab === 'tools' ? '#6366f1' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${activeTab === 'tools' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                Tools
              </Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>

      {/* Repractice Questions Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
          <View className="h-14 bg-indigo-600 dark:bg-indigo-800 flex-row items-center px-4 shadow-md">
            <TouchableHighlight
              underlayColor="#4338CA"
              onPress={() => setModalVisible(false)}
              className="p-2 rounded-full"
            >
              <MaterialIcons name="close" size={24} color="#E0E7FF" />
            </TouchableHighlight>
            <Text className="text-indigo-50 text-lg font-bold flex-1 ml-4">
              Edit Repractice Questions
            </Text>
          </View>

          <ScrollView className="flex-1 p-4">
            {allWrongQuestions.length > 0 ? (
              allWrongQuestions.map((item, idx) => (
                <View
                  key={`${item.sectionKey}-${item.index}`}
                  className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-indigo-100 dark:border-indigo-800"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-800 dark:text-gray-200 flex-1 mr-2">
                      {item.question.question}
                    </Text>
                    <TouchableHighlight
                      onPress={() => removeQuestion(item.sectionKey, item.index)}
                      underlayColor="#E0E7FF"
                      className="p-2 bg-indigo-100 dark:bg-indigo-700 rounded-full"
                    >
                      <MaterialIcons name="delete" size={20} color="#6366f1" />
                    </TouchableHighlight>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center p-8 my-8">
                <MaterialIcons name="assignment-turned-in" size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-center mt-4 text-lg">
                  No repractice questions available
                </Text>
                <Text className="text-gray-400 text-center mt-2">
                  Questions you struggle with will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* API Key Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={apiKeyModalVisible}
        onRequestClose={() => setApiKeyModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
          <View className="h-14 bg-indigo-600 dark:bg-indigo-800 flex-row items-center px-4 shadow-md">
            <TouchableHighlight
              underlayColor="#4338CA"
              onPress={() => setApiKeyModalVisible(false)}
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
    </SafeAreaView>
  );
};

export default cog;