import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

// Define a reusable NavItem component
const NavItem = ({ page, icon, label, current, setCurrent }) => {
  const isSelected = page === current;
  return (
    <TouchableOpacity
      className="px-5 py-2.5 flex-col items-center"
      onPress={() => setCurrent(page)}
      accessibilityLabel={label}
    >
      <MaterialIcons
        name={icon}
        size={24}
        color={isSelected ? '#4CAF50' : 'white'}
      />
      <Text
        className={`text-sm ${isSelected ? 'text-green-500' : 'text-white'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Main NavBar component
const NavBar = ({ current, setCurrent }) => {
  return (
    <SafeAreaView style={{ backgroundColor: '#222' }}>
      <View className="h-[1px] bg-gray-600" />
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
        <NavItem
          page="Routine"
          icon="calendar-today"
          label="Routine"
          current={current}
          setCurrent={setCurrent}
        />
      </View>
    </SafeAreaView>
  );
};

export default NavBar;