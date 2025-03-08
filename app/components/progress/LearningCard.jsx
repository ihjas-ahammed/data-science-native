import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LearningCard = ({ title, progress, onClick, isActive }) => {
  const getProgressColor = (percentage) => {
    if (percentage < 0 || percentage > 100) return '#94A3B8'; // Slate color for invalid values
        
        // Create a color scale that avoids the indigo/purple spectrum used in backgrounds
        if (percentage < 25) {
            // Low progress - red
            return '#7bed9f'; // Tailwind red-500
        } else if (percentage < 50) {
            // Some progress - yellow/amber
            return '#2ed573'; // Tailwind amber-500
        } else if (percentage < 75) {
            // Good progress - teal (avoiding pure green which might be hard to read)
            return '#1e90ff'; // Tailwind teal-500
        } else {
            // Excellent progress - cyan (avoiding blue/indigo used in the UI)
            return '#1e90ff'; // Tailwind cyan-500
        }
  };

  const progressColor = getProgressColor(progress);

  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.7}
      className="bg-indigo-800 rounded-lg p-3 mb-2 mx-1 shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 w-fit max-w-[80%]">
          <MaterialIcons name="book" size={20} color="#E0E7FF" />
          <Text className="text-white font-semibold text-base " numberOfLines={2}>
            {title || 'Untitled'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MaterialIcons
            name="chevron-right"
            size={22}
            color="white"
            style={{ transform: [{ rotate: isActive ? '90deg' : '0deg' }] }}
          />
        </View>
      </View>
      <View className="mt-3">
        <View className="h-2 bg-indigo-300/30 dark:bg-indigo-900/50 rounded-full overflow-hidden">
          <View
            className="h-full"
            style={{ 
              width: `${parseInt(progress) || 0}%`,
              backgroundColor: progressColor
            }}
          />
        </View>
        <Text className="text-xs text-indigo-100 mt-1 text-right">
          {parseInt(progress) || 0}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default LearningCard;