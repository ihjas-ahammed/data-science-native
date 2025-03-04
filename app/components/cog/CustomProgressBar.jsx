import { View } from 'react-native';
import React from 'react';

const CustomProgressBar = ({ progress, width, height }) => {
  // Clamp progress between 0 and 1 for safety
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  // Determine the color class based on progress

  const filledClass =
  clampedProgress < 0.1 ? 'bg-red-500'     // 10-20%
  : clampedProgress < 0.3 ? 'bg-orange-500' // 30-40%
  : clampedProgress < 0.5 ? 'bg-yellow-500' // 50-60%
  : clampedProgress < 0.7 ? 'bg-lime-500'  // 70-80%
  : clampedProgress < 0.9 ? 'bg-green-500'  // 80-90%
  : 'bg-green-500';


  // Calculate border radius for pill shape
  const borderRadius = height / 2;

  // Style for the inner bar, with dynamic width and conditional rounding
  const innerStyle = {
    width: `${clampedProgress * 100}%`,
    height: '100%',
    borderTopLeftRadius: borderRadius,
    borderBottomLeftRadius: borderRadius,
    ...(clampedProgress === 1 && {
      borderTopRightRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
    }),
  };

  return (
    <View
      className="bg-gray-200 flex-1"
      style={{ height, borderRadius, overflow: 'hidden' }}
    >
      <View className={filledClass} style={innerStyle} />
    </View>
  );
};

export default CustomProgressBar;