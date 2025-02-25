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
    const updateCurrentTask = () => {
      if (schedule.length === 0) return -1;

      const now = new Date();
      const currentIndex = schedule.findIndex(task => {
        const [hours, minutes] = task.time.split(':');
        let scheduleStart = new Date();
        scheduleStart.setHours(parseInt(hours), parseInt(minutes), 0);
        const scheduleEnd = new Date(scheduleStart.getTime() + task.duration * 60000);
        return now >= scheduleStart && now <= scheduleEnd;
      });
      setCurrentTaskIndex(currentIndex);
    };

    updateCurrentTask(); // Initial check
    const interval = setInterval(updateCurrentTask, 1000);

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

  // Sort schedule by time and completion status
  const sortedSchedule = [...schedule].sort((a, b) => {
    const now = new Date();
    const [aHours, aMinutes] = a.time.split(':');
    const [bHours, bMinutes] = b.time.split(':');
    
    const aStart = new Date().setHours(parseInt(aHours), parseInt(aMinutes), 0);
    const bStart = new Date().setHours(parseInt(bHours), parseInt(bMinutes), 0);
    const aEnd = aStart + a.duration * 60000;
    const bEnd = bStart + b.duration * 60000;

    const aProgress = calculateProgress(a);
    const bProgress = calculateProgress(b);

    // Completed tasks (100% progress) go to bottom
    if (aProgress.real === 100 && bProgress.real !== 100) return 1;
    if (bProgress.real === 100 && aProgress.real !== 100) return -1;
    if (aProgress.real === 100 && bProgress.real === 100) {
      return aStart - bStart; // Among completed, sort by start time
    }

    // Current task (if any) should be near top
    const aIsCurrent = now >= aStart && now <= aEnd;
    const bIsCurrent = now >= bStart && now <= bEnd;
    if (aIsCurrent && !bIsCurrent) return -1;
    if (bIsCurrent && !aIsCurrent) return 1;

    // Sort remaining tasks by start time
    return aStart - bStart;
  });

  const renderItem = ({ item, index }) => {
    const progress = calculateProgress(item);
    const endTime = calculateEndTime(item.time, item.duration);
    const isCurrent = sortedSchedule.findIndex(t => t.id === item.id) === currentTaskIndex && currentTaskIndex !== -1;

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

      {sortedSchedule.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">
            No tasks scheduled. Click "Add Task" to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedSchedule}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ScheduleList;