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
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState('');

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
      // Convert 24h to 12h AM/PM for display
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

  const adjustTime = (type, direction) => {
    const [timePart, period] = taskData.time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (type === 'hour') {
      hours = direction === 'up' ? hours + 1 : hours - 1;
      if (hours > 12) hours = 1;
      if (hours < 1) hours = 12;
    } else if (type === 'minute') {
      minutes = direction === 'up' ? minutes + 1 : minutes - 1;
      if (minutes >= 60) minutes = 0;
      if (minutes < 0) minutes = 59;
    }

    setTaskData({
      ...taskData,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
    });
  };

  const togglePeriod = () => {
    const [timePart, period] = taskData.time.split(' ');
    setTaskData({
      ...taskData,
      time: `${timePart} ${period === 'AM' ? 'PM' : 'AM'}`
    });
  };

  const handleTimeEditSubmit = () => {
    const timeRegex = /^([0-1]?[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(tempTime)) {
      Alert.alert('Error', 'Please enter time as HH:MM AM/PM (e.g., 03:45 PM)');
      setTempTime(taskData.time);
    } else {
      setTaskData({ ...taskData, time: tempTime.trim() });
    }
    setIsEditingTime(false);
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
            {/* Custom Time Picker */}
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={16} color="gray" className="mr-2" />
                <Text className="text-gray-700">Start Time</Text>
              </View>
              {isEditingTime ? (
                <View className="flex-row items-center">
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-gray-800"
                    value={tempTime}
                    onChangeText={setTempTime}
                    onSubmitEditing={handleTimeEditSubmit}
                    placeholder="HH:MM AM/PM"
                    autoFocus
                  />
                  <TouchableOpacity 
                    onPress={handleTimeEditSubmit}
                    className="ml-2 p-2"
                  >
                    <Ionicons name="checkmark" size={20} color="green" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center border border-gray-300 rounded-lg p-2 bg-gray-50">
                  {/* Hours */}
                  <View className="flex-1 items-center">
                    <TouchableOpacity onPress={() => adjustTime('hour', 'up')}>
                      <Ionicons name="chevron-up" size={16} color="gray" />
                    </TouchableOpacity>
                    <Text className="text-base font-medium text-gray-800 my-1">
                      {taskData.time.split(':')[0]}
                    </Text>
                    <TouchableOpacity onPress={() => adjustTime('hour', 'down')}>
                      <Ionicons name="chevron-down" size={16} color="gray" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-base text-gray-600 mx-1">:</Text>
                  {/* Minutes */}
                  <View className="flex-1 items-center">
                    <TouchableOpacity onPress={() => adjustTime('minute', 'up')}>
                      <Ionicons name="chevron-up" size={16} color="gray" />
                    </TouchableOpacity>
                    <Text className="text-base font-medium text-gray-800 my-1">
                      {taskData.time.split(':')[1].split(' ')[0]}
                    </Text>
                    <TouchableOpacity onPress={() => adjustTime('minute', 'down')}>
                      <Ionicons name="chevron-down" size={16} color="gray" />
                    </TouchableOpacity>
                  </View>
                  {/* AM/PM Toggle */}
                  <TouchableOpacity 
                    onPress={togglePeriod}
                    className="bg-blue-500 rounded px-2 py-1 mx-2"
                  >
                    <Text className="text-white text-sm font-medium">
                      {taskData.time.split(' ')[1]}
                    </Text>
                  </TouchableOpacity>
                  {/* Edit Button */}
                  <TouchableOpacity 
                    onPress={() => {
                      setTempTime(taskData.time);
                      setIsEditingTime(true);
                    }}
                    className="p-2"
                  >
                    <Ionicons name="pencil" size={16} color="gray" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Activity Input */}
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text-outline" size={16} color="gray" className="mr-2" />
                <Text className="text-gray-700">Activity</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
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
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
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
          <View className="flex-row justify-end space-x-2 mt-6">
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