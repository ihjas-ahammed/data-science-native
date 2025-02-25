import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const TopicProgress = ({ topic, onLevelChange }) => {
  const [value, setValue] = useState(topic.level - 1);

  // Function to get background color based on level
  const getLevelColor = (level) => {
    const colors = {
      0: '#9ca3af', // bg-gray-400
      1: '#10b981', // bg-emerald-500
      2: '#3b82f6', // bg-blue-500
      3: '#6366f1', // bg-indigo-500
      4: '#8b5cf6', // bg-violet-500
      5: '#a855f7', // bg-purple-500
      6: '#ec4899', // bg-pink-500
    };
    return colors[level] || colors[0];
  };

  // Handle slider value change with debouncing for smoothness
  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
    onLevelChange(newValue);
  }, [onLevelChange]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Topic Name and Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.topicText}>{topic.name}</Text>
          <Slider
            style={styles.slider}
            value={value}
            minimumValue={0}
            maximumValue={6}
            step={1}
            onValueChange={handleValueChange}
            minimumTrackTintColor="#8b5cf6" // Violet-500
            maximumTrackTintColor="#777777" // Grey
            thumbTintColor="#ffffff" // White thumb
          />
        </View>

        {/* Level Indicator */}
        <View
          style={[
            styles.levelIndicator,
            { backgroundColor: getLevelColor(value) },
          ]}
        >
          <Text style={styles.levelText}>{value}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    marginRight: 16,
  },
  topicText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40, // Ensure enough touch area
    marginTop: 8,
  },
  levelIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TopicProgress;