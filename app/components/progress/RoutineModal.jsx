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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const RoutineModal = ({ visible, onClose, courseData, onSave }) => {
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
    handleSaveI();
  };

  // Reset and close modal
  const handleCancel = () => {
    setSelectedModule('');
    setSelectedSubtasks({});
    setTime('');
    setDuration('');
    onClose();
  };

  const handleSaveI = () => {
    setSelectedModule('');
    setSelectedSubtasks({});
    setTime('');
    setDuration('');
    onSave();
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

  const isFormValid = selectedModule && 
    Object.keys(selectedSubtasks).some(key => selectedSubtasks[key]) && 
    time && 
    duration;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="w-[85%] bg-indigo-800 rounded-xl p-4 shadow-md">
          {/* Header */}
          <View className="flex-row items-center mb-4 border-b border-indigo-100/20 pb-2">
            <MaterialIcons name="event-note" size={22} color="#E0E7FF" />
            <Text className="text-white text-xl font-bold ml-2">
              Add Routine 
            </Text>
          </View>

          <ScrollView 
            className="max-h-96"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Form */}
            <View className="gap-4">
              {/* Module Selection */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="book-outline" size={16} color="#A5B4FC" />
                  <Text className="text-indigo-100 ml-2 text-base">Module</Text>
                </View>
                <View className="border border-indigo-100/30 rounded-lg bg-indigo-100/10">
                  <Picker
                    selectedValue={selectedModule}
                    onValueChange={(itemValue) => {
                      setSelectedModule(itemValue);
                      setSelectedSubtasks({});
                    }}
                    style={{
                      color:"#ffffff"
                    }}
                    className="text-indigo-100"
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
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkbox-outline" size={16} color="#A5B4FC" />
                    <Text className="text-indigo-100 ml-2 text-base">Subtasks</Text>
                  </View>
                  <ScrollView className="min-h-40 flex border border-indigo-100/30 rounded-lg bg-indigo-100/10 p-1 ">
                    {getSubtasksForModule().map((subtask, index) => (
                      <View key={index} className="flex-row items-center py-2 border-b border-indigo-100/10">
                        <Checkbox
                          status={selectedSubtasks[subtask.name] ? 'checked' : 'unchecked'}
                          onPress={() => toggleSubtask(subtask.name)}
                          color="#A5B4FC"
                          uncheckedColor="#A5B4FC"
                        />
                        <Text className="text-indigo-100 text-base flex-1 ml-2">{subtask.name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Time Picker */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color="#A5B4FC" />
                  <Text className="text-indigo-100 ml-2 text-base">Start Time</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="w-14 border border-indigo-100/30 rounded-lg bg-indigo-100/10 px-3 py-2 text-center text-indigo-100 text-base"
                    value={time.split(/[: ]/)[0]}
                    onChangeText={handleHourChange}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor="#A5B4FC"
                  />
                  <Text className="text-indigo-100 text-lg font-bold">:</Text>
                  <TextInput
                    className="w-14 border border-indigo-100/30 rounded-lg bg-indigo-100/10 px-3 py-2 text-center text-indigo-100 text-base"
                    value={time.split(/[: ]/)[1]}
                    onChangeText={handleMinuteChange}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#A5B4FC"
                  />
                  <TouchableOpacity
                    onPress={togglePeriod}
                    className="bg-indigo-300 py-2 px-3 rounded-lg min-w-[50px] items-center"
                  >
                    <Text className="text-indigo-800 font-bold text-base">{time.split(/[: ]/)[2]}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Duration Input */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="timer-outline" size={16} color="#A5B4FC" />
                  <Text className="text-indigo-100 ml-2 text-base">Duration (minutes)</Text>
                </View>
                <TextInput
                  className="border border-indigo-100/30 rounded-lg bg-indigo-100/10 px-3 py-2 text-indigo-100 text-base"
                  placeholder="Duration in minutes"
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                  placeholderTextColor="#A5B4FC"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="flex-row justify-end mt-4 pt-2 border-t border-indigo-100/20">
            <TouchableOpacity
              className="py-2.5 px-4 mr-3"
              onPress={handleCancel}
            >
              <Text className="text-indigo-300 text-base font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`bg-indigo-100 py-2.5 px-4 rounded-lg ${!isFormValid ? 'bg-indigo-100/50' : ''}`}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <Text className="text-indigo-800 text-base font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RoutineModal;