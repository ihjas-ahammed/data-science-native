import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SubtasksModal = ({ isOpen, onClose, task, onUpdateSubtasks }) => {
  const [newSubtask, setNewSubtask] = useState('');

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

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const updatedSubtasks = [
      ...(task.subtasks || []),
      { text: newSubtask.trim(), completed: false }
    ];
    onUpdateSubtasks(updatedSubtasks);
    setNewSubtask('');
  };

  const handleToggleSubtask = (index) => {
    const updatedSubtasks = task.subtasks.map((subtask, i) => 
      i === index ? { ...subtask, completed: !subtask.completed } : subtask
    );
    onUpdateSubtasks(updatedSubtasks);
  };

  const handleDeleteSubtask = (index) => {
    const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
    onUpdateSubtasks(updatedSubtasks);
  };

  const renderSubtask = ({ item, index }) => (
    <View className="flex-row items-center bg-gray-100 rounded p-3 mb-2">
      <Pressable
        onPress={() => handleToggleSubtask(index)}
        className="w-5 h-5 border border-gray-400 rounded mr-3 flex items-center justify-center"
      >
        {item.completed && (
          <Ionicons name="checkmark" size={16} color="green" />
        )}
      </Pressable>
      <Text className={`flex-1 text-gray-800 ${item.completed ? 'line-through text-gray-500' : ''}`}>
        {item.text}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteSubtask(index)}>
        <Ionicons name="trash-outline" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-5 w-11/12 max-w-md">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-gray-800">Subtasks</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Time Info */}
          <Text className="text-gray-600 text-center mb-4">
            {formatTimeToAmPm(task.time)} - {calculateEndTime()}
          </Text>

          {/* Subtasks List */}
          <FlatList
            data={task.subtasks || []}
            renderItem={renderSubtask}
            keyExtractor={(_, index) => index.toString()}
            className="max-h-64 mb-4"
            showsVerticalScrollIndicator={false}
          />

          {/* Add Subtask Input */}
          <View className="flex-row items-center gap-2">
            <TextInput
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
              placeholder="New subtask"
              className="flex-1 border border-gray-300 rounded p-2"
            />
            <TouchableOpacity
              onPress={handleAddSubtask}
              className="bg-blue-500 p-2 rounded"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SubtasksModal;