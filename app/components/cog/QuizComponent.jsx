import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Assuming you're using Expo

const QuizComponent = ({
  sampleQ,
  currentSectionIndex,
  setCurrentSectionIndex,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  prompt,
  setPrompt,
  selectedImage,
  setSelectedImage,
  isApiLoading,
  errorMessage,
  setErrorMessage,
  response,
  setResponse,
  pickImage, // Function to handle image picking
  takePicture, // Function to handle camera
  handleSend, // Function to handle submission
}) => {
  return (
    <View className="p-4 bg-gray-800 rounded-lg mb-4 border border-gray-700">
      {/* Display Section and Question Info */}
      <Text className="text-xl font-semibold text-gray-200 mb-3">
        {sampleQ[currentSectionIndex].name} - Question {currentQuestionIndex + 1}
      </Text>
      <Text className="text-gray-200 mb-2">
        {sampleQ[currentSectionIndex].questions[currentQuestionIndex]}
      </Text>
      <Text className="text-gray-400 mb-4">
        Max Marks: {sampleQ[currentSectionIndex].marks}
      </Text>

      {/* User Answer Input */}
      <TextInput
        className="bg-gray-700 text-gray-200 p-2 rounded mb-2"
        placeholder="Enter your answer"
        placeholderTextColor="#9ca3af"
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      {/* Image Picker and Camera Buttons */}
      <View className="flex-row justify-end mb-2">
        <TouchableHighlight onPress={pickImage} underlayColor="#4b5563" className="p-2">
          <MaterialIcons name="image" size={24} color="#e5e7eb" />
        </TouchableHighlight>
        <TouchableHighlight onPress={takePicture} underlayColor="#4b5563" className="p-2 ml-2">
          <MaterialIcons name="camera-alt" size={24} color="#e5e7eb" />
        </TouchableHighlight>
      </View>

      {/* Display Selected Image and Clear Button */}
      {selectedImage && (
        <View className="mt-2">
          <Image source={{ uri: selectedImage }} style={{ width: 200, height: 200 }} className="rounded" />
          <TouchableHighlight
            onPress={() => setSelectedImage(null)}
            underlayColor="#4b5563"
            className="mt-2 p-2 bg-red-600 rounded"
          >
            <Text className="text-white text-center">Clear Image</Text>
          </TouchableHighlight>
        </View>
      )}

      {/* Submit Button */}
      <TouchableHighlight
        onPress={handleSend}
        underlayColor="#4b5563"
        className={`bg-blue-600 p-2 rounded ${isApiLoading ? 'opacity-50' : ''}`}
        disabled={isApiLoading || (!prompt.trim() && !selectedImage)}
      >
        <Text className="text-white text-center">Submit Answer</Text>
      </TouchableHighlight>

      {/* Loading Indicator */}
      {isApiLoading && <ActivityIndicator size="large" color="white" className="mt-4" />}

      {/* Error Message */}
      {errorMessage && <Text className="text-red-500 mt-2">{errorMessage}</Text>}

      {/* Response Display */}
      {response && (
        <ScrollView className="mt-4 p-2 bg-gray-700 rounded" style={{ maxHeight: 200 }}>
          <Text className="text-gray-200">{response}</Text>
        </ScrollView>
      )}

      {/* Navigation Buttons */}
      <View className="flex-row justify-between mt-4">
        <TouchableHighlight
          onPress={() => {
            if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
              setPrompt('');
              setSelectedImage(null);
              setResponse(null);
              setErrorMessage(null);
            } else if (currentSectionIndex > 0) {
              setCurrentSectionIndex(currentSectionIndex - 1);
              setCurrentQuestionIndex(sampleQ[currentSectionIndex - 1].questions.length - 1);
              setPrompt('');
              setSelectedImage(null);
              setResponse(null);
              setErrorMessage(null);
            }
          }}
          underlayColor="#4b5563"
          className={`p-2 bg-gray-600 rounded ${
            currentSectionIndex === 0 && currentQuestionIndex === 0 ? 'opacity-50' : ''
          }`}
          disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
        >
          <Text className="text-white">Previous</Text>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={() => {
            if (currentQuestionIndex < sampleQ[currentSectionIndex].questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
              setPrompt('');
              setSelectedImage(null);
              setResponse(null);
              setErrorMessage(null);
            } else if (currentSectionIndex < sampleQ.length - 1) {
              setCurrentSectionIndex(currentSectionIndex + 1);
              setCurrentQuestionIndex(0);
              setPrompt('');
              setSelectedImage(null);
              setResponse(null);
              setErrorMessage(null);
            }
          }}
          underlayColor="#4b5563"
          className={`p-2 bg-gray-600 rounded ${
            currentSectionIndex === sampleQ.length - 1 &&
            currentQuestionIndex === sampleQ[currentSectionIndex].questions.length - 1
              ? 'opacity-50'
              : ''
          }`}
          disabled={
            currentSectionIndex === sampleQ.length - 1 &&
            currentQuestionIndex === sampleQ[currentSectionIndex].questions.length - 1
          }
        >
          <Text className="text-white">Next</Text>
        </TouchableHighlight>
      </View>
    </View>
  );
};

export default QuizComponent;