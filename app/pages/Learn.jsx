import { get, getDatabase, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const calculateLevel = (score) => {
  if (score < 120) return { level: 1, progress: (score / 120) * 100 };
  if (score < 240) return { level: 2, progress: ((score - 120) / 120) * 100 };
  if (score < 480) return { level: 3, progress: ((score - 240) / 240) * 100 };
  if (score < 960) return { level: 4, progress: ((score - 480) / 480) * 100 };

  return { level: 5, progress: 100 }; // Max level
};

const getLevelColor = (level) => {
  const colors = {
    1: '#4F46E5', // Indigo
    2: '#10B981', // Emerald
    3: '#F59E0B', // Amber
    4: '#EF4444', // Red
    5: '#8B5CF6', // Purple
  };
  return colors[level] || colors[1];
};

const Learn = ({ firebaseApp, navigation }) => {
  const [learn, setLearn] = useState([]);
  const [scores, setScores] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLearn = async () => {
      try {
        const db = getDatabase(firebaseApp);
        const learnRf = ref(db, 'learn');
        const snapshot = await get(learnRf);
        if (snapshot.exists()) setLearn(snapshot.val());
        setLoading(false);
      } catch (e) {
        console.error('Error loading learn data:', e);
        setLoading(false);
      }
    };

    loadLearn();
  }, []);

  useEffect(() => {
    const loadScores = async () => {
      try {
        const newScores = [];
        const newLevels = [];
        
        for (let i = 0; i < learn.length; i++) {
          const score = await SecureStore.getItemAsync('score-' + i);
          const scoreValue = score ? parseInt(score) : 0;
          newScores[i] = scoreValue;
          
          const levelInfo = calculateLevel(scoreValue);
          newLevels[i] = levelInfo;
        }
        
        setScores(newScores);
        setLevels(newLevels);
      } catch (e) {
        console.error('Error loading scores:', e);
      }
    };

    if (learn.length > 0) loadScores();
  }, [learn]);

  const handleCardPress = (index) => {
    // Navigate to lesson or show more details
    navigation && navigation.navigate('LessonDetails', { 
      lesson: learn[index],
      index,
      score: scores[index],
      level: levels[index]
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-base text-gray-600">Loading your courses...</Text>
      </View>
    );
  }

  if (learn.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Ionicons name="school-outline" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg text-gray-500 text-center">No courses available yet</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    const levelInfo = levels[index] || { level: 1, progress: 0 };
    const levelColor = getLevelColor(levelInfo.level);
    
    return (
      <TouchableOpacity 
        className="bg-white rounded-2xl mb-4 p-4 shadow"
        onPress={() => handleCardPress(index)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-lg font-semibold text-gray-800 mb-1">{item.name}</Text>
            <Text className="text-sm text-gray-500">
              {scores[index] || 0} / {item.maxScore} points
            </Text>
          </View>
          
          <View className="items-center justify-center">
            <AnimatedCircularProgress
              size={80}
              width={8}
              fill={levelInfo.progress}
              tintColor={levelColor}
              backgroundColor="#E0E7FF"
              rotation={0}
              lineCap="round"
            >
              {() => (
                <View className="items-center justify-center">
                  <Text className="text-2xl font-bold text-gray-800">{levelInfo.level}</Text>
                  <Text className="text-xs text-gray-500 font-medium">LV</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <FlatList
        data={learn}
        renderItem={renderItem}
        keyExtractor={(_, index) => `learn-${index}`}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Learn;