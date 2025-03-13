import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { FontAwesome5 } from '@expo/vector-icons'

const ReaderSelector = ({ sections, currentSectionIndex, onSelectSection, className }) => {
  if (!sections || sections.length === 0) return null
  
  return (
    <View className={`bg-white rounded-lg shadow mb-2 ${className}`}>
      <Text className="text-lg font-bold text-gray-800 px-4 pt-4 pb-2">
        Select Section
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4">
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectSection(index)}
            className={`mx-2 px-4 py-2 rounded-full ${
              index === currentSectionIndex 
                ? 'bg-indigo-600' 
                : 'bg-gray-100'
            }`}
          >
            <View className="flex-row items-center">
              <FontAwesome5 
                name="bookmark" 
                size={14} 
                color={index === currentSectionIndex ? '#ffffff' : '#4b5563'} 
              />
              <Text 
                className={`ml-2 ${
                  index === currentSectionIndex 
                    ? 'text-white font-medium' 
                    : 'text-gray-600'
                }`}
                numberOfLines={1}
              >
                {section.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export default ReaderSelector