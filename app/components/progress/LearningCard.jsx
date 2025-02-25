import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LearningCard = ({ title, progress, onClick, isActive }) => {

  return (
    <TouchableOpacity
      onPress={onClick}
      className="bg-black rounded-lg p-3 mb-2 mx-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 w-fit max-w-[80%]">
          <Ionicons name="book-outline" size={20} color="#8b5cf6" />
          <Text className="text-white font-semibold text-base " numberOfLines={2}>
            {title || 'Untitled'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 ">
          <Ionicons
            name="chevron-forward"
            size={16}
            color="white"
            style={{ transform: [{ rotate: isActive ? '90deg' : '0deg' }] }}
          />
        </View>
      </View>
      <View className="mt-4">
        <View className="h-2 bg-gray-600 rounded-full overflow-hidden">
          <View
            className="h-full bg-violet-500"
            style={{ width: `${parseInt(progress) || 0}%` }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LearningCard;