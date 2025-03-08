import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

const TopicProgress = ({ topic, onLevelChange }) => {
  const [value, setValue] = useState(topic.level - 1);

  // Function to get background color based on level
  const getLevelColor = (level) => {
    const percentage = (level / 6) * 100; // Convert level to percentage (0-6 → 0-100%)
    
    if (percentage < 25) {
      return '#EF4444'; // Red - low level
    } else if (percentage < 50) {
      return '#F59E0B'; // Amber - medium-low level
    } else if (percentage < 75) {
      return '#14B8A6'; // Teal - medium-high level
    } else {
      return '#55AA22'; // Green - high level
    }
  };

  // Handle slider value change
  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
    onLevelChange(newValue);
  }, [onLevelChange]);

  // Calculate progress percentage for the progress bar
  const progressPercentage = ((value / 6) * 100);

  return (
    <View className="bg-indigo-800 rounded-lg p-4 mb-2 mx-1 shadow">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-3 max-w-[80%] ">
          <MaterialIcons name="book" size={20} color="#E0E7FF" />
          <Text className="text-white text-base font-semibold ml-2">{topic.name.indexOf(":") != -1 ? topic.name.split(":")[0]:topic.name}</Text>
        </View>
        <View className="bg-white w-7 h-7 rounded-full items-center justify-center">
          <Text className="text-indigo-800 text-sm font-bold">{value}</Text>
        </View>
      </View>
      
      <View className="mt-1">
        <Slider
          style={{ width: '100%', height: 36 }}
          value={value}
          minimumValue={0}
          maximumValue={6}
          step={1}
          onValueChange={handleValueChange}
          minimumTrackTintColor={getLevelColor(value)}
          maximumTrackTintColor="rgba(224, 231, 255, 0.3)"
          thumbTintColor="#ffffff"
        />
        <Text className="text-indigo-100 text-xs text-right mt-1">
          {Math.round(progressPercentage)}%
        </Text>
      </View>
    </View>
  );
};

export default TopicProgress;