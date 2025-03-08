import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
      style={styles.courseItem}
    >
      <View
        style={[
          styles.checkbox,
          has(selectedCourses, item) ? styles.checkboxSelected : styles.checkboxUnselected
        ]}
      >
        {has(selectedCourses, item) && (
          <MaterialIcons name="check" size={18} color="#4338CA" />
        )}
      </View>
      <Text style={styles.courseText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.dialogContainer}>
          {/* Dialog Title */}
          <View style={styles.titleContainer}>
            <MaterialIcons name="edit" size={22} color="#E0E7FF" />
            <Text style={styles.titleText}>Edit Courses</Text>
          </View>

          {/* Course List */}
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.courseList}
          />

          {/* Dialog Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dialogContainer: {
    width: '85%',
    backgroundColor: '#4338CA', // indigo-800
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 231, 255, 0.2)', // indigo-100/20
    paddingBottom: 8,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  courseList: {
    maxHeight: 240,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 231, 255, 0.1)', // indigo-100/10
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  checkboxUnselected: {
    borderWidth: 2,
    borderColor: '#A5B4FC', // indigo-300
    backgroundColor: 'transparent',
  },
  courseText: {
    color: '#E0E7FF', // indigo-100
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 231, 255, 0.2)', // indigo-100/20
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  closeButtonText: {
    color: '#A5B4FC', // indigo-300
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#E0E7FF', // indigo-100
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#4338CA', // indigo-800
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditDialog;