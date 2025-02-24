import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const ProgressModal = ({ isOpen, onClose, task, onSave }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (task) {
      setProgress(task.manualProgress || 0);
    }
  }, [task]);

  if (!isOpen || !task) return null;

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

  const calculateEndTime = () => {
    const [hours, minutes] = task.time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    date.setMinutes(date.getMinutes() + parseInt(task.duration));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s/g, '');
  };

  const handleSave = () => {
    onSave(progress);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-6 w-11/12 max-w-md">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Update Progress</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="space-y-4">
            <Text className="text-gray-600 text-center">
              {formatTimeToAmPm(task.time)} - {calculateEndTime()}
            </Text>
            
            <View className="items-center space-y-2">
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={progress}
                onValueChange={(value) => setProgress(Math.round(value))}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#D1D5DB"
                thumbTintColor="#3B82F6"
              />
              <Text className="text-2xl font-semibold text-blue-500">
                {progress}%
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-6">
            <TouchableOpacity
              className="bg-blue-500 py-2 rounded-lg"
              onPress={handleSave}
            >
              <Text className="text-white text-center font-medium">Save Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProgressModal;