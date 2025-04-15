import { get, getDatabase, ref } from 'firebase/database';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation, useFocusEffect } from 'expo-router';

const calculateLevel = (score, maxScore) => {
  let l = 1;
  let s = score;
  let m = score;

  while(s > 0) {
    s -= maxScore * Math.pow(2, l-1);
    if(m > maxScore * Math.pow(2, l-1)) m = s;
    if(s > 0) l++;
  }

  return { level: l, progress: m }; // Max level
};

const getLevelColor = (level, totalLevels = 15) => {
  // Make sure level is within bounds
  level = Math.max(1, Math.min(level, totalLevels));
  
  // Define base colors for interpolation
  const baseColors = [
    { r: 79, g: 70, b: 229 },   // Indigo (#4F46E5) - Starting color
    { r: 16, g: 185, b: 129 },  // Emerald (#10B981)
    { r: 245, g: 158, b: 11 },  // Amber (#F59E0B)
    { r: 239, g: 68, b: 68 },   // Red (#EF4444)
    { r: 139, g: 92, b: 246 }   // Purple (#8B5CF6) - Ending color
  ];
  
  // For dynamic levels, interpolate between base colors
  const segment = (baseColors.length - 1) / (totalLevels - 1);
  const segmentIndex = (level - 1) * segment;
  const lowerIndex = Math.floor(segmentIndex);
  const upperIndex = Math.ceil(segmentIndex);
  
  // If we're exactly on a base color, return it
  if (lowerIndex === upperIndex) {
    const { r, g, b } = baseColors[lowerIndex];
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Otherwise interpolate between the two closest base colors
  const weight = segmentIndex - lowerIndex;
  const lowerColor = baseColors[lowerIndex];
  const upperColor = baseColors[upperIndex];
  
  const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * weight);
  const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * weight);
  const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * weight);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const Learn = ({ firebaseApp }) => {
  const [learn, setLearn] = useState([]);
  const [scores, setScores] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const loadCachedData = async () => {
    try {
      const cachedLearnData = await SecureStore.getItemAsync('learn');
      if (cachedLearnData) {
        setLearn(JSON.parse(cachedLearnData));
      }
    } catch (e) {
      console.error('Error loading cached learn data:', e);
    }
  };

  const loadFirebaseData = async (forceOnline = false) => {
    try {
      if (forceOnline) setIsOnline(true);
      else if(!isOnline) return
      
      const db = getDatabase(firebaseApp);
      const learnRef = ref(db, 'learn');
      const snapshot = await get(learnRef);
      
      if (snapshot.exists()) {
        const learnData = snapshot.val();
        setLearn(learnData);
        
        // Cache the data for offline use
        await SecureStore.setItemAsync('learn', JSON.stringify(learnData));
      }else if(forceOnline) {
        await SecureStore.deleteItemAsync('learn');
        setLearn([]);
        return;
      }
      
      setIsOnline(true);
    } catch (e) {
      console.error('Error loading Firebase data:', e);
      // If we can't connect to Firebase, use cached data
      if (forceOnline) {
        setIsOnline(false);
        await loadCachedData();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadData = async (forceOnline = false) => {
    setLoading(true);
    
    // First try to load cached data for immediate display
    if (!forceOnline) {
      await loadCachedData();
    }
    
    // Then try to load fresh data from Firebase
    await loadFirebaseData(forceOnline);
  };

  const loadScores = async () => {
    try {
      const newScores = [];
      const newLevels = [];
      
      for (let i = 0; i < learn.length; i++) {
        const score = await SecureStore.getItemAsync("score-" + i);
        const scoreValue = score ? parseInt(score) : 0;
        newScores[i] = scoreValue;
        
        const levelInfo = calculateLevel(scoreValue, learn[i].maxScore);
        newLevels[i] = levelInfo;
      }
      
      setScores(newScores);
      setLevels(newLevels);
    } catch (e) {
      console.error('Error loading scores:', e);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Load scores whenever learn data changes
  useEffect(() => {
    if (learn.length > 0) loadScores();
  }, [learn]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true); // Force online refresh
  }, []);

  const handleCardPress = (index) => {
    const exp = JSON.stringify({ 
      subject: learn[index],
      index,
      score: scores[index],
      level: levels[index]
    });

    router.push(`/sub?exp=${exp}`);
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
        <TouchableOpacity 
          className="mt-6 bg-indigo-600 py-3 px-6 rounded-full"
          onPress={onRefresh}
        >
          <Text className="text-white font-medium">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    const levelInfo = levels[index] || { level: 1, progress: 0 };
    const levelColor = getLevelColor(levelInfo.level);
    if(!item) return (
      <View>
        
      </View>
    )
    
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
              {levelInfo.progress || 0} / {(item.maxScore*Math.pow(2,levelInfo.level-1))} points
            </Text>
          </View>
          
          <View className="items-center justify-center">
            <AnimatedCircularProgress
              size={80}
              width={8}
              fill={levelInfo.progress*100/(item.maxScore*Math.pow(2,levelInfo.level-1))}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
      />
    </View>
  );
};

export default Learn;