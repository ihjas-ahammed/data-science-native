import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore } from 'firebase/firestore';
import ProgressOverview from '../components/routine/ProgressOverview';
import ScheduleList from '../components/routine/ScheduleList';
import AddTaskModal from '../components/routine/AddTaskModal';
import ProgressModal from '../components/routine/ProgressModal';
import SubtasksModal from '../components/routine/SubtasksModal';
import ImportExportRoutineDialog from '../components/routine/ImportExportRoutineDialog';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Routine = ({ firebaseApp }) => {
  const [schedule, setSchedule] = useState([]);
  const [username, setUsername] = useState('admin');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isSubtasksModalOpen, setIsSubtasksModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // New loading state

  // Check network status
  const checkNetworkStatus = async () => {
    try {
      const response = await fetch("https://8.8.8.8", {
        method: "HEAD",
        timeout: 5000
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      return false;
    }
  };

  // Load schedule from SecureStore
  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true); // Start loading
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
          await scheduleNotifications(sortedSchedule);
        }
      }
      setIsLoading(false); // Stop loading
    };

    const initialize = async () => {
      await loadSchedule();
      
      // Check network status initially and periodically
      const status = await checkNetworkStatus();
      setIsOnline(status);
    };
    
    initialize();
    
    const intervalId = setInterval(async () => {
      const status = await checkNetworkStatus();
      setIsOnline(status);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [username]);

  // Schedule push notifications
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

  // Calculate task progress
  const calculateProgress = (task) => {
    const now = new Date();
    const [hours, minutes] = task.time.split(':');

    let scheduleStart = new Date();
    scheduleStart.setHours(parseInt(hours), parseInt(minutes), 0);
    const scheduleEnd = new Date(scheduleStart.getTime() + task.duration * 60000);

    let timeProgress = 0;
    if (now < scheduleStart) {
      timeProgress = 0;
    } else if (now > scheduleEnd) {
      timeProgress = 100;
    } else {
      const totalDuration = scheduleEnd.getTime() - scheduleStart.getTime();
      const elapsedTime = now.getTime() - scheduleStart.getTime();
      timeProgress = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
    }

    let realProgress = 0;
    if (task.progressType === 'manual') {
      realProgress = task.manualProgress || 0;
    } else {
      realProgress = task.subtasks && task.subtasks.length > 0
        ? (task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100
        : 0;
    }

    return {
      time: timeProgress,
      real: realProgress,
      total: (timeProgress + realProgress) / 2
    };
  };

  // Save to SecureStore
  const saveToStore = async (newSchedule) => {
    await SecureStore.setItemAsync(`routine-${username}`, JSON.stringify(newSchedule));
    await scheduleNotifications(newSchedule);
  };

  // Task management functions
  const addTask = async (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      subtasks: [],
      manualProgress: 0
    };

    const updatedSchedule = [...schedule, newTask].sort((a, b) => {
      const timeA = new Date(`2000/01/01 ${a.time}`);
      const timeB = new Date(`2000/01/01 ${b.time}`);
      return timeA - timeB;
    });

    setSchedule(updatedSchedule);
    await saveToStore(updatedSchedule);
  };

  const updateTask = async (taskId, taskData) => {
    const updatedSchedule = schedule.map(task =>
      task.id === taskId ? { ...task, ...taskData } : task
    );
    setSchedule(updatedSchedule);
    await saveToStore(updatedSchedule);
  };

  const deleteTask = async (taskId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedSchedule = schedule.filter(task => task.id !== taskId);
            setSchedule(updatedSchedule);
            await saveToStore(updatedSchedule);
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Handle imported data
  const handleImportData = (importedData) => {
    const sortedSchedule = importedData.sort((a, b) => {
      const timeA = new Date(`2000/01/01 ${a.time}`);
      const timeB = new Date(`2000/01/01 ${b.time}`);
      return timeA - timeB;
    });
    setSchedule(sortedSchedule);
    scheduleNotifications(sortedSchedule);
  };

  // Handle cloud sync button click
  const handleCloudSyncPress = () => {
    if (!isOnline) {
      Alert.alert(
        "Network Unavailable",
        "You need an internet connection to sync your routine data.",
        [{ text: "OK" }]
      );
      return;
    }
    setIsImportExportModalOpen(true);
  };

  const renderContent = () => (
    <>
      <ProgressOverview
        schedule={schedule}
        calculateProgress={calculateProgress}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
        {/* You can add additional buttons here if needed */}
      </View>
      <ScheduleList
        schedule={schedule}
        calculateProgress={calculateProgress}
        handleCloudSync={handleCloudSyncPress}
        onEditTask={(id) => {
          setEditingTaskId(id);
          setIsAddModalOpen(true);
        }}
        onDeleteTask={deleteTask}
        onOpenProgressModal={(id) => {
          setCurrentTaskId(id);
          setIsProgressModalOpen(true);
        }}
        onOpenSubtasksModal={(id) => {
          setCurrentTaskId(id);
          setIsSubtasksModalOpen(true);
        }}
      />
    </>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={[1]}
        renderItem={() => (
          <View className="px-4 pt-4">
            <View className="bg-white rounded-lg shadow-lg p-4 mb-4">
              {renderContent()}
            </View>
          </View>
        )}
        keyExtractor={() => 'routine-content'}
        ListFooterComponent={<View className="h-4" />}
        showsVerticalScrollIndicator={false}
      />

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTaskId(null);
        }}
        onSave={editingTaskId ? updateTask : addTask}
        editingTask={editingTaskId ? schedule.find(t => t.id === editingTaskId) : null}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        task={schedule.find(t => t.id === currentTaskId)}
        onSave={(progress) => updateTask(currentTaskId, { manualProgress: progress })}
      />

      <SubtasksModal
        isOpen={isSubtasksModalOpen}
        onClose={() => setIsSubtasksModalOpen(false)}
        task={schedule.find(t => t.id === currentTaskId)}
        onUpdateSubtasks={(subtasks) => updateTask(currentTaskId, { subtasks })}
      />

      <ImportExportRoutineDialog
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        firebaseApp={firebaseApp}
        username={username}
        onImportData={handleImportData}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View 
          className="absolute inset-0 flex justify-center items-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
        >
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </View>
  );
};

export default Routine;