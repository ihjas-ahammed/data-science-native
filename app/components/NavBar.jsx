import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
// Consolidate icon imports if possible, or keep both if needed elsewhere
import { MaterialIcons } from '@expo/vector-icons'; // Using MaterialIcons for all now
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css'; // Ensure your global CSS supports TailwindCSS Native classes

// Define a single reusable NavItem component
const NavItem = ({ page, icon, label, current, setCurrent, IconComponent = MaterialIcons }) => {
  const isSelected = page === current;
  return (
    <TouchableOpacity
      // Use flex: 1 to distribute space equally
      // Removed horizontal padding (px-*), relying on flex: 1 for spacing
      // Kept vertical padding (py-2.5) for internal spacing
      className={`flex-1 py-2.5 flex-col items-center rounded-lg ${
        isSelected ? 'bg-indigo-100 dark:bg-indigo-900' : ''
      }`}
      onPress={() => setCurrent(page)}
      accessibilityLabel={label}
    >
      <IconComponent // Use the passed IconComponent
        name={icon}
        size={24}
        color={isSelected ? '#6366f1' : '#9ca3af'}
      />
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'
        }`}
        // Add numberOfLines to prevent text wrapping and ensure consistent height
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Main NavBar component
const NavBar = ({ current, setCurrent }) => {
  return (
    // Consider adding edges={['bottom']} if you only want bottom padding for safe area
    <SafeAreaView className="bg-white dark:bg-gray-800 shadow-md px-1" edges={['bottom']}>
      {/* Top Border */}
      <View className="h-[1px] bg-gray-200 dark:bg-gray-700" />
      {/* Container for Nav Items */}
      {/* Removed justify-around as flex: 1 on children handles distribution */}
      <View className="w-full flex-row items-center py-1 ">
        {/* Use the unified NavItem for all items */}
        <NavItem
          page="Notes"
          icon="notes" // MaterialIcons
          label="Read"
          current={current}
          setCurrent={setCurrent}
          // IconComponent={MaterialIcons} // Default, so optional
        />
        <NavItem
          page="Learn"
          // Changed icon to a MaterialIcons equivalent for 'flash'
          icon="flash-on" // Or 'bolt' from MaterialIcons
          label="Learn"
          current={current}
          setCurrent={setCurrent}
          // IconComponent={MaterialIcons} // Default, so optional
        />
        <NavItem
          page="Extras"
          icon="science" // MaterialIcons
          label="Tools"
          current={current}
          setCurrent={setCurrent}
          // IconComponent={MaterialIcons} // Default, so optional
        />
      </View>
    </SafeAreaView>
  );
};

export default NavBar;