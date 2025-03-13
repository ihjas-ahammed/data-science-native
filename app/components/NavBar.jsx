import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

// Define a reusable NavItem component
const NavItem = ({ page, icon, label, current, setCurrent }) => {
  const isSelected = page === current;
  return (
    <TouchableOpacity
      className={`px-5 py-2.5 flex-col items-center rounded-lg ${
        isSelected ? 'bg-indigo-100 dark:bg-indigo-900' : ''
      }`}
      onPress={() => setCurrent(page)}
      accessibilityLabel={label}
    >
      <MaterialIcons
        name={icon}
        size={24}
        color={isSelected ? '#6366f1' : '#9ca3af'}
      />
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const NavItemI = ({ page, icon, label, current, setCurrent }) => {
  const isSelected = page === current;
  return (
    <TouchableOpacity
      className={`px-5 py-2.5 flex-col items-center rounded-lg ${
        isSelected ? 'bg-indigo-100 dark:bg-indigo-900' : ''
      }`}
      onPress={() => setCurrent(page)}
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={24}
        color={isSelected ? '#6366f1' : '#9ca3af'}
      />
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Main NavBar component
const NavBar = ({ current, setCurrent }) => {
  return (
    <SafeAreaView className="bg-white dark:bg-gray-800 shadow-md">
      <View className="h-[1px] bg-indigo-100 dark:bg-indigo-800" />
      <View className="w-full flex-row justify-around py-2">
        <NavItem
          page="Notes"
          icon="notes"
          label="Notes"
          current={current}
          setCurrent={setCurrent}
        />
        <NavItem
          page="Progress"
          icon="bar-chart"
          label="Progress"
          current={current}
          setCurrent={setCurrent}
        />
        <NavItemI
          page="Learn"
          icon="flash"
          label="Learn"
          current={current}
          setCurrent={setCurrent}
        />
        <NavItem
          page="Routine"
          icon="calendar-today"
          label="Routine"
          current={current}
          setCurrent={setCurrent}
        />
        <NavItem
          page="Extras"
          icon="science"
          label="Tools"
          current={current}
          setCurrent={setCurrent}
        />
      </View>
    </SafeAreaView>
  );
};

export default NavBar;