import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store'; // For offline storage

const ImportExportDialog = ({ open, onClose, firebaseApp, onImportData }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!userId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid user ID',
      });
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const progressRef = ref(db, `progress-${userId}`);
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const progressData = snapshot.val();
        onImportData(progressData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Progress data imported successfully',
        });
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No progress data found for this user ID',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to import progress data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!userId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid user ID',
      });
      return;
    }

    setLoading(true);
    try {
      const storedData = await SecureStore.getItemAsync('progressData');
      if (storedData) {
        const db = getDatabase(firebaseApp);
        const progressRef = ref(db, `progress-${userId}`);
        await set(progressRef, JSON.parse(storedData));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Progress data exported successfully',
        });
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No local progress data found to export',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export progress data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="import-export" size={24} color="#E0E7FF" />
            <Text style={styles.modalTitle}>Import/Export Progress</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>User ID:</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="Enter user ID"
              placeholderTextColor="#A5B4FC"
              selectionColor="#818CF8"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.importButton, loading && styles.disabledButton]}
              onPress={handleImport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="cloud-download" size={18} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Import</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.exportButton, loading && styles.disabledButton]}
              onPress={handleExport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="cloud-upload" size={18} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '85%',
    backgroundColor: '#4338CA', // indigo-800
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 231, 255, 0.2)', // indigo-100/20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E7FF', // indigo-100
    marginLeft: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#E0E7FF', // indigo-100
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#818CF8', // indigo-400
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'rgba(224, 231, 255, 0.1)', // indigo-100/10
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: '48%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 6,
  },
  importButton: {
    backgroundColor: '#6366F1', // indigo-500
  },
  exportButton: {
    backgroundColor: '#55AA22', // custom green that fits with the theme
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(224, 231, 255, 0.15)', // indigo-100/15
    borderWidth: 1,
    borderColor: 'rgba(224, 231, 255, 0.3)', // indigo-100/30
  },
  closeButtonText: {
    color: '#E0E7FF', // indigo-100
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImportExportDialog;