import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

const RoutineModal = ({ visible, onClose, courseData }) => {
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedSubtasks, setSelectedSubtasks] = useState({});
  const [time, setTime] = useState(''); // Displayed as "HH:MM AM/PM"
  const [duration, setDuration] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [username, setUsername] = useState('admin');

  useEffect(() => {
    const loadSchedule = async () => {
      if (username) {
        const storedSchedule = await SecureStore.getItemAsync(`routine-${username}`);
        if (storedSchedule) {
          const parsedSchedule = JSON.parse(storedSchedule);
          const sortedSchedule = parsedSchedule.sort((a, b) => {
            const timeA = new Date(`2000/01/01 ${a.time}`);
            const timeB = new Date(`2000/01/01 ${b.time}`);
            return timeA - timeB;
          });
          setSchedule(sortedSchedule);
          scheduleNotifications(sortedSchedule);
        }
      }
    };
    loadSchedule();
    console.log(schedule);
  }, [username]);

  // Set default time like AddTaskModal
  useEffect(() => {
    const setDefaultTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    if (!time) setTime(setDefaultTime());
  }, [visible]);

  // Get modules from the provided courseData
  const modules = courseData?.topics || [];

  // Get subtasks for the selected module
  const getSubtasksForModule = () => {
    if (!selectedModule) return [];
    const module = modules.find((m) => m.name === selectedModule);
    return module?.subtopics || [];
  };

  // Toggle subtask selection
  const toggleSubtask = (subtaskName) => {
    setSelectedSubtasks((prev) => ({
      ...prev,
      [subtaskName]: !prev[subtaskName],
    }));
  };

  const scheduleNotifications = async (tasks) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    tasks.forEach(task => {
      const [hours, minutes] = task.time.split(':');
      const trigger = new Date();
      trigger.setHours(parseInt(hours));
      trigger.setMinutes(parseInt(minutes));
      trigger.setSeconds(0);

      Notifications.scheduleNotificationAsync({
        content: {
          title: `${task.activity} session started`,
          body: `It will end in ${task.duration} minutes!`,
        },
        trigger,
      });
    });
  };

  // Handle save action
  const handleSave = async () => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const saveTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

    const routineData = {
      activity: courseData.name,
      duration: duration,
      id: Date.now(),
      manualProgress: 0,
      progressType: 'subtasks',
      subtasks: Object.keys(selectedSubtasks)
        .filter((key) => selectedSubtasks[key])
        .map((text) => ({
          completed: false,
          text,
        })),
      time: saveTime,
    };

    await SecureStore.setItemAsync(`routine-${username}`, JSON.stringify([...schedule, routineData]));
    scheduleNotifications([...schedule, routineData]);
    ToastAndroid.show('Task added successfully!', ToastAndroid.SHORT);
    handleCancel();
  };

  // Reset and close modal
  const handleCancel = () => {
    setSelectedModule('');
    setSelectedSubtasks({});
    setTime('');
    setDuration('');
    onClose();
  };

  // Time picker handlers
  const togglePeriod = () => {
    const [timePart, period] = time.split(' ');
    setTime(`${timePart} ${period === 'AM' ? 'PM' : 'AM'}`);
  };

  const handleHourChange = (text) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 12)) {
      const [_, minutes, period] = time.split(/[: ]/);
      setTime(`${num.padStart(2, '')}:${minutes} ${period}`);
    }
  };

  const handleMinuteChange = (text) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 59)) {
      const [hours, , period] = time.split(/[: ]/);
      setTime(`${hours}:${num.padStart(2, '')} ${period}`);
    }
  };

  if (!visible) return null;


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl p-6 w-11/12 max-w-md shadow-lg">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Add Routine for {courseData?.name}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form */}
            <View className="space-y-4 gap-4">
              {/* Module Selection */}
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="book-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-gray-700">Module</Text>
                </View>
                <View className="border border-gray-300 rounded-lg bg-gray-50">
                  <Picker
                    selectedValue={selectedModule}
                    onValueChange={(itemValue) => {
                      setSelectedModule(itemValue);
                      setSelectedSubtasks({});
                    }}
                  >
                    <Picker.Item label="Select a module" value="" />
                    {modules.map((module, index) => (
                      <Picker.Item key={index} label={module.name} value={module.name} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Subtasks Selection */}
              {selectedModule && getSubtasksForModule().length > 0 && (
                <View>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkbox-outline" size={16} color="gray" className="mr-2" />
                    <Text className="text-gray-700">Subtasks</Text>
                  </View>
                  <ScrollView className="max-h-40">
                    {getSubtasksForModule().map((subtask, index) => (
                      <View key={index} className="flex-row items-center py-2">
                        <Checkbox
                          status={selectedSubtasks[subtask.name] ? 'checked' : 'unchecked'}
                          onPress={() => toggleSubtask(subtask.name)}
                        />
                        <Text className="ml-2 text-gray-600 flex-1">{subtask.name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Time Picker */}
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-gray-700">Start Time</Text>
                </View>
                <View className="flex-row items-center space-x-2 gap-2">
                  <TextInput
                    className="w-16 border border-gray-300 rounded-lg p-2 text-gray-800 text-center bg-gray-50"
                    value={time.split(/[: ]/)[0]}
                    onChangeText={handleHourChange}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text className="text-gray-600 text-lg font-medium">:</Text>
                  <TextInput
                    className="w-16 border border-gray-300 rounded-lg p-2 text-gray-800 text-center bg-gray-50"
                    value={time.split(/[: ]/)[1]}
                    onChangeText={handleMinuteChange}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={togglePeriod}
                    className="bg-blue-500 rounded-lg px-3 py-2 min-w-[50px] items-center"
                  >
                    <Text className="text-white font-medium">{time.split(/[: ]/)[2]}</Text>
                  </TouchableOpacity>
                </View>
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
                  value={duration}
                  onChangeText={setDuration}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="flex-row justify-end space-x-2 mt-6 gap-1">
            <TouchableOpacity
              className="bg-gray-200 px-4 py-2 rounded-lg"
              onPress={handleCancel}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${!selectedModule || Object.keys(selectedSubtasks).length === 0 || !time || !duration
                  ? 'bg-gray-400'
                  : 'bg-blue-500'
                }`}
              onPress={handleSave}
              disabled={!selectedModule || Object.keys(selectedSubtasks).length === 0 || !time || !duration}
            >
              <Text className="text-white font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RoutineModal;