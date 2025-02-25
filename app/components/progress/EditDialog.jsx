import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const EditDialog = ({ open, onClose, courses, data, onSave }) => {
  const [selectedCourses, setSelectedCourses] = useState(data || []);

  // Toggle course selection
  const handleToggle = (course) => {
    if (!has(selectedCourses, course)) {
      setSelectedCourses([...selectedCourses, course]);
    } else {
      setSelectedCourses(selectedCourses.filter(c => c.name !== course.name));
    }
  };

  // Update selectedCourses when data prop changes
  useEffect(() => {
    setSelectedCourses(data || []);
  }, [data]);

  // Check if a course is selected
  const has = (courseList, course) => courseList.some(c => c.name === course.name);

  // Save changes and close dialog
  const handleSave = () => {
    onSave(selectedCourses);
    onClose();
  };

  // Render each course item
  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleToggle(item)}
      className="flex-row items-center py-2"
    >
      <View
        className={`w-6 h-6 rounded border-2 mr-2 ${
          has(selectedCourses, item) ? 'bg-white border-white' : 'border-gray-400'
        }`}
      />
      <Text className="text-white text-lg">{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-gray-800 w-4/5 rounded-lg p-4">
          {/* Dialog Title */}
          <Text className="text-white text-xl font-bold mb-4">Edit Courses</Text>

          {/* Course List */}
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={(item, index) => index.toString()}
            className="max-h-60"
          />

          {/* Dialog Actions */}
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 mr-2"
            >
              <Text className="text-gray-400 text-lg">Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="bg-white px-4 py-2 rounded"
            >
              <Text className="text-gray-800 text-lg font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// If you're using StyleSheet alongside NativeWind (optional)
const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
  },
});

export default EditDialog;