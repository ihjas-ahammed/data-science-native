import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ScheduleList = ({ 
  schedule, 
  calculateProgress, 
  onEditTask, 
  onDeleteTask, 
  onOpenProgressModal, 
  onOpenSubtasksModal 
}) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);

  useEffect(() => {
    const findCurrentTask = () => {
      if (schedule.length === 0) return -1;

      const now = new Date();
      return schedule.findIndex(task => {
        const [hours, minutes] = task.time.split(':');
        let scheduleStart = new Date();
        scheduleStart.setHours(parseInt(hours), parseInt(minutes), 0);
        const scheduleEnd = new Date(scheduleStart.getTime() + task.duration * 60000);
        return now >= scheduleStart && now <= scheduleEnd;
      });
    };

    const interval = setInterval(() => {
      setCurrentTaskIndex(findCurrentTask());
    }, 1000);

    return () => clearInterval(interval);
  }, [schedule]);

  const formatTimeToAmPm = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s/g, '');
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return '';
    const [hours, minutes] = startTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    date.setMinutes(date.getMinutes() + parseInt(durationMinutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s/g, '');
  };

  const renderItem = ({ item, index }) => {
    const progress = calculateProgress(item);
    const endTime = calculateEndTime(item.time, item.duration);
    const isCurrent = index === currentTaskIndex;

    return (
      <View className={`bg-white rounded-lg p-4 mb-2 shadow-sm ${isCurrent ? 'border-l-4 border-blue-500' : ''}`}>
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={16} color="gray" className="mr-2" />
              <Text className="text-gray-600">
                {formatTimeToAmPm(item.time)} - {endTime}
              </Text>
            </View>
            <Text className="text-gray-800 font-medium">{item.activity}</Text>
          </View>
          <Text className="text-blue-500 font-semibold">{Math.round(progress.real)}%</Text>
        </View>

        <View className="h-2 bg-gray-200 rounded-full overflow-hidden my-2">
          <View 
            className="h-full bg-blue-300 absolute"
            style={{ width: `${progress.time}%` }}
          />
          <View 
            className="h-full bg-blue-500 absolute"
            style={{ width: `${progress.real}%` }}
          />
        </View>

        <View className="flex-row justify-end space-x-2">
          <TouchableOpacity onPress={() => onEditTask(item.id)}>
            <MaterialIcons name="edit" size={20} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => item.progressType === 'manual' 
              ? onOpenProgressModal(item.id)
              : onOpenSubtasksModal(item.id)}
          >
            <MaterialIcons 
              name={item.progressType === 'manual' ? 'percent' : 'task'} 
              size={20} 
              color="gray" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDeleteTask(item.id)}>
            <MaterialIcons name="delete" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-800">Today's Tasks</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-3 py-1 rounded"
          onPress={() => onEditTask(null)}
        >
          <Text className="text-white">Add Task</Text>
        </TouchableOpacity>
      </View>

      {schedule.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">
            No tasks scheduled. Click "Add Task" to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedule}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ScheduleList;