import React from 'react';
import { View, Text } from 'react-native';

const ProgressOverview = ({ schedule, calculateProgress }) => {
  const calculateOverallProgress = () => {
    if (schedule.length === 0) return { time: 0, real: 0, total: 0 };

    const totals = schedule.reduce((acc, task) => {
      const progress = calculateProgress(task);
      return {
        time: acc.time + progress.time,
        real: acc.real + progress.real,
        total: acc.total + progress.total
      };
    }, { time: 0, real: 0, total: 0 });

    return {
      time: Math.round(totals.time / schedule.length),
      real: Math.round(totals.real / schedule.length),
      total: Math.round(totals.total / schedule.length)
    };
  };

  const progress = calculateOverallProgress();

  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-gray-800">Overall Progress</Text>
        <Text className="text-xl font-bold text-blue-500">{progress.total}%</Text>
      </View>
      
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <View 
          className="h-full bg-blue-300 absolute"
          style={{ width: `${progress.time}%` }}
        />
        <View 
          className="h-full bg-blue-500 absolute"
          style={{ width: `${progress.real}%` }}
        />
      </View>
      
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-600">
          Time: <Text className="font-medium">{progress.time}%</Text>
        </Text>
        <Text className="text-sm text-gray-600">
          Real: <Text className="font-medium">{progress.real}%</Text>
        </Text>
      </View>
    </View>
  );
};

export default ProgressOverview;