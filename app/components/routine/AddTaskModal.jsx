import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Modal, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AddTaskModal = ({ isOpen, onClose, onSave, editingTask }) => {
  const [taskData, setTaskData] = useState({
    time: '', // Displayed as "HH:MM AM/PM", stored as "HH:MM" in 24h
    activity: '',
    duration: '',
    progressType: 'manual'
  });

  useEffect(() => {
    const setDefaultTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    if (editingTask) {
      const [hours, minutes] = editingTask.time.split(':');
      let displayHours = parseInt(hours);
      const period = displayHours >= 12 ? 'PM' : 'AM';
      displayHours = displayHours % 12 || 12;
      setTaskData({
        time: `${displayHours.toString().padStart(2, '0')}:${minutes} ${period}`,
        activity: editingTask.activity,
        duration: editingTask.duration,
        progressType: editingTask.progressType
      });
    } else {
      setTaskData({
        time: setDefaultTime(),
        activity: '',
        duration: '',
        progressType: 'manual'
      });
    }
  }, [editingTask]);

  const calculateEndTime = () => {
    if (!taskData.time || !taskData.duration) return '';
    const [timePart, period] = taskData.time.split(' ');
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const date = new Date();
    date.setHours(hours, parseInt(minutes));
    date.setMinutes(date.getMinutes() + parseInt(taskData.duration));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s/g, '');
  };

  const togglePeriod = () => {
    const [timePart, period] = taskData.time.split(' ');
    setTaskData({
      ...taskData,
      time: `${timePart} ${period === 'AM' ? 'PM' : 'AM'}`
    });
  };

  const handleHourChange = (text) => {
  
    const num = text.replace(/[^0-9]/g, '');
    if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 12)) {
      const [_, minutes, period] = taskData.time.split(/[: ]/);
      setTaskData({
        ...taskData,
        time: `${num.padStart(2, '')}:${minutes} ${period}`
      });
    }
  };

  const handleMinuteChange = (text) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 59)) {
      const [hours, , period] = taskData.time.split(/[: ]/);
      setTaskData({
        ...taskData,
        time: `${hours}:${num.padStart(2, '')} ${period}`
      });
    }
  };

  const handleSubmit = () => {
    if (!taskData.time || !taskData.activity || !taskData.duration) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const [timePart, period] = taskData.time.split(' ');
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const saveTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

    const saveData = { ...taskData, time: saveTime };
    if (editingTask) {
      onSave(editingTask.id, saveData);
    } else {
      onSave(saveData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const [hours, minutes, period] = taskData.time.split(/[: ]/);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl p-6 w-11/12 max-w-md shadow-lg">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              {editingTask ? 'Edit Task' : 'Add Task'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="space-y-4 gap-4">
            {/* Time Picker */}
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={16} color="gray" className="mr-2" />
                <Text className="text-gray-700">Start Time</Text>
              </View>
              <View className="flex-row items-center space-x-2 gap-2">
                {/* Hours Input */}
                <TextInput
                  className="w-16 border border-gray-300 rounded-lg p-2 text-gray-800 text-center bg-gray-50"
                  value={hours}
                  onChangeText={handleHourChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="HH"
                  placeholderTextColor="#9CA3AF"
                />
                <Text className="text-gray-600 text-lg font-medium">:</Text>
                {/* Minutes Input */}
                <TextInput
                  className="w-16 border border-gray-300 rounded-lg p-2 text-gray-800 text-center bg-gray-50"
                  value={minutes}
                  onChangeText={handleMinuteChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#9CA3AF"
                />
                {/* AM/PM Toggle */}
                <TouchableOpacity
                  onPress={togglePeriod}
                  className="bg-blue-500 rounded-lg px-3 py-2 min-w-[50px] items-center"
                >
                  <Text className="text-white font-medium">{period}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Activity Input */}
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text-outline" size={16} color="gray" className="mr-2" />
                <Text className="text-gray-700">Activity</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg p-2 text-gray-800 bg-gray-50"
                placeholder="Activity name"
                value={taskData.activity}
                onChangeText={(text) => setTaskData({ ...taskData, activity: text })}
              />
            </View>

            {/* Duration Input */}
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="timer-outline" size={16} color="gray" className="mr-2" />
                <Text className="text-gray-700">Duration (minutes)</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg p-2 text-gray-800 bg-gray-50"
                placeholder="Duration in minutes"
                keyboardType="numeric"
                value={taskData.duration}
                onChangeText={(text) => setTaskData({ ...taskData, duration: text })}
              />
              {taskData.time && taskData.duration && (
                <Text className="text-gray-500 mt-1">
                  Ends at: {calculateEndTime()}
                </Text>
              )}
            </View>

            {/* Progress Type Toggle */}
            <View>
              <Text className="text-gray-700 mb-2">Progress Tracking Method</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600">
                  {taskData.progressType === 'manual' ? 'Manual' : 'Subtasks'}
                </Text>
                <Switch
                  value={taskData.progressType === 'subtasks'}
                  onValueChange={(value) => setTaskData({
                    ...taskData,
                    progressType: value ? 'subtasks' : 'manual'
                  })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          {/* Footer Buttons */}
          <View className="flex-row justify-end space-x-2 mt-6 gap-1">
            <TouchableOpacity
              className="bg-gray-200 px-4 py-2 rounded-lg"
              onPress={onClose}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg"
              onPress={handleSubmit}
            >
              <Text className="text-white font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddTaskModal;