import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const QuizScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackColor, setFeedbackColor] = useState('#28a745');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [progressAnim] = useState(new Animated.Value(0));
  const [progressBarColor] = useState(new Animated.Value(0));
  const [completed, setCompleted] = useState(false);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const { qs } = useLocalSearchParams();
  const { name, qa, key } = JSON.parse(qs);

  const title = name;
  const sampleQuestions = qa;

  const TARGET_CORRECT_ANSWERS = 10;

  // Initialize questions with shuffled order
  useEffect(() => {
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setAskedQuestions([]);
  }, []);

  const updateScore = () => {
    SecureStore.getItemAsync(key).then(async (scr) => {
      if (parseInt(scr) <= score) {
        console.log("Saving " + key + ":" + score);
        SecureStore.setItemAsync(key, score + "").then(() =>
          console.log("Saved " + key + ":" + score)
        );
      } else if (parseInt(scr) > score) {
        console.log("Hi");
      } else {
        console.log("Saving " + key + ":" + score);
        SecureStore.setItemAsync(key, score + "").then(() =>
          console.log("Saved " + key + ":" + score)
        );
      }
    });
  };

  // Shuffle options when current question changes
  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const questionOptions = currentQuestion.options.map((option, index) => ({
        text: option,
        isCorrect: index === currentQuestion.correct,
        originalIndex: index,
      }));
      const shuffledOptions = [...questionOptions].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions);
      setAnswerSelected(false);
      setSelectedOptionIndex(null);
    }
  }, [questions, currentQuestionIndex]);

  // Update progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score / TARGET_CORRECT_ANSWERS,
      duration: 300,
      useNativeDriver: false,
    }).start();
    Animated.timing(progressBarColor, {
      toValue: score / TARGET_CORRECT_ANSWERS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [score, progressAnim, progressBarColor]);

  const interpolatedColor = progressBarColor.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff4d4d', '#ffde59', '#4CAF50'],
  });

  const handleAnswer = (isCorrect, index) => {
    setAnswerSelected(true);
    setSelectedOptionIndex(index);
    setAskedQuestions([...askedQuestions, questions[currentQuestionIndex]]);

    if (isCorrect) {
      setScore(score + 1);
      setFeedbackMessage('Correct! +1 point');
      setFeedbackColor('#28a745');
    } else {
      setScore(Math.max(0, score - 1));
      setFeedbackMessage('Incorrect! -1 point');
      setFeedbackColor('#dc3545');
    }

    setShowFeedback(true);
    updateScore();

    if (score >= TARGET_CORRECT_ANSWERS) {
      setCompleted(true);
    }
  };

  const nextQ = () => {
    setShowFeedback(false);
    moveToNextQuestion();
  };

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex >= questions.length - 1) {
      if (askedQuestions.length >= questions.length) {
        const remainingQuestions = questions.filter(
          (q) => !askedQuestions.some((asked) => asked === q && asked.answeredCorrectly)
        );
        const shuffledQuestions =
          remainingQuestions.length === 0
            ? [...questions].sort(() => Math.random() - 0.5)
            : [...remainingQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
        setAskedQuestions([]);
        setCurrentQuestionIndex(0);
      } else {
        setCurrentQuestionIndex(0);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions, askedQuestions]);

  const handleExit = () => {
    router.back();
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setAskedQuestions([]);
    setCompleted(false);
    setAnswerSelected(false);
    setSelectedOptionIndex(null);
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  const getOptionClassName = (option, index) => {
    let baseClass = "p-4 rounded-lg mb-3 border border-gray-300";
    if (!answerSelected) {
      return `${baseClass} bg-gray-50`;
    }
    if (option.isCorrect) {
      return `${baseClass} bg-green-100 border-green-300`;
    }
    if (index === selectedOptionIndex && !option.isCorrect) {
      return `${baseClass} bg-red-100 border-red-300`;
    }
    return `${baseClass} bg-gray-50 opacity-50`;
  };

  const getDescriptionClassName = () => {
    if (!showFeedback) {
      return "p-4 rounded-lg mb-3 border border-gray-300 bg-gray-50";
    }
    const isCorrect = options[selectedOptionIndex]?.isCorrect;
    return isCorrect
      ? "p-4 rounded-lg mb-3 border border-green-300 bg-green-100"
      : "p-4 rounded-lg mb-3 border border-red-300 bg-red-100";
  };

  // Render completed screen
  if (completed) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 justify-center items-center p-6">
          <MaterialIcons name="celebration" size={80} color="#FFD700" />
          <Text className="text-2xl font-bold text-gray-800 mt-6 mb-4">Congratulations!</Text>
          <Text className="text-lg text-center text-gray-600 mb-8">
            You've successfully completed the quiz with {score} correct answers.
          </Text>
          <TouchableOpacity
            className="bg-indigo-600 py-3 px-8 rounded-full mb-4 w-4/5 items-center"
            onPress={handleRestart}
          >
            <Text className="text-white text-lg font-bold">Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-600 py-3 px-8 rounded-full w-4/5 items-center"
            onPress={handleExit}
          >
            <Text className="text-white text-lg font-bold">Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (questions.length === 0 || options.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading questions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Action Bar */}
      <View className="h-14 bg-indigo-600 flex-row items-center px-4 shadow-md">
        <TouchableOpacity className="p-2" onPress={handleExit}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1 ml-4">{title}</Text>
      </View>

      {/* Progress Bar */}
      <View className="h-8 bg-gray-200 rounded-lg mx-4 mt-4 overflow-hidden">
        <Animated.View
          style={{
            height: '100%',
            position: 'absolute',
            left: 0,
            top: 0,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: interpolatedColor,
          }}
        />

      </View>

      {/* Question Card */}
      <View className="bg-white rounded-lg p-4 m-4 shadow-sm ">
        <Text className="text-sm text-gray-500 mb-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text className="text-lg font-bold text-gray-800 mb-6">
          {questions[currentQuestionIndex].question}
        </Text>

        {/* Options */}
        <View >
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              className={getOptionClassName(option, index)}
              onPress={() => !answerSelected && handleAnswer(option.isCorrect, index)}
              disabled={answerSelected}
            >
              <Text className="text-base text-gray-700">{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description with Scroll */}
      {showFeedback && questions[currentQuestionIndex].describe !== options[questions[currentQuestionIndex].correct] && (
        <View className="px-4 pb-4 flex-1">
          <TouchableOpacity onPress={nextQ}>
            <ScrollView className={getDescriptionClassName()} style={{ maxHeight: "100%" }}>
              <Text className="text-base text-gray-700">
                {questions[currentQuestionIndex].describe}
              </Text>
            </ScrollView>
          </TouchableOpacity>
          <Text className="text-center text-gray-500 mt-auto mb-5">
            Click on explanation to move on
          </Text>
        </View>
      )}

    </View>
  );
};

export default QuizScreen;