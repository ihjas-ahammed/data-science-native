import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableHighlight, Animated, StatusBar, ScrollView, LayoutAnimation, Platform, TouchableOpacity, Vibration } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';

const QuizScreen = () => {
  // State declarations
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackColor, setFeedbackColor] = useState('#28a745');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [gameQuestions, setGameQuestions] = useState([]); // New state for unique questions
  const [progressAnim] = useState(new Animated.Value(0));
  const [progressBarColor] = useState(new Animated.Value(0));
  const [completed, setCompleted] = useState(false);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [canProceed, setCanProceed] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [isDescriptionGray, setIsDescriptionGray] = useState(false);
  const correctSoundRef = useRef(null);

  // Parse query parameters
  const { qs } = useLocalSearchParams();
  const { name, qa, key, maxNo } = JSON.parse(qs);

  const title = name;
  const sampleQuestions = qa;
  const TARGET_CORRECT_ANSWERS = maxNo ? maxNo : 10;

  // Load sound effect for correct answers
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/correct.wav')
        );
        correctSoundRef.current = sound;
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };
    loadSound();
    return () => {
      if (correctSoundRef.current) {
        correctSoundRef.current.unloadAsync();
      }
    };
  }, []);

  // Initialize questions with shuffled order
  useEffect(() => {
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setAskedQuestions([]);
    setGameQuestions([]); // Reset on initialization
  }, []);

  // Update score in SecureStore
  const updateScore = () => {
    SecureStore.getItemAsync(key).then(async (scr) => {
      if (parseInt(scr) <= score || !scr) {
        await SecureStore.setItemAsync(key, score.toString());
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
      setCanProceed(false);
      setShowFeedback(false);
    }
  }, [questions, currentQuestionIndex]);

  // Update progress bar animation
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
  }, [score]);

  const interpolatedColor = progressBarColor.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff4d4d', '#ffde59', '#4CAF50'],
  });

  // Handle answer selection
  const handleAnswer = async (isCorrect, index) => {
    setAnswerSelected(true);
    setSelectedOptionIndex(index);
    setAskedQuestions([...askedQuestions, questions[currentQuestionIndex]]);

    // Add to gameQuestions if not already present
    setGameQuestions(prev => {
      const currentQuestion = questions[currentQuestionIndex];
      if (prev.some(q => q === currentQuestion)) {
        return prev;
      } else {
        return [...prev, currentQuestion];
      }
    });

    const newScore = isCorrect ? score + 1 : Math.max(0, score - 1);
    setScore(newScore);
    setFeedbackMessage(isCorrect ? 'Correct! +1 point' : 'Incorrect! -1 point');
    setFeedbackColor(isCorrect ? '#28a745' : '#dc3545');
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    updateScore();

    if (isCorrect && correctSoundRef.current) {
      try {
        await correctSoundRef.current.playAsync();
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    } else {
      Vibration.vibrate(500);
    }

    const repracticeKey = `repractice-${key}`;
    try {
      const currentRepractice = await SecureStore.getItemAsync(repracticeKey);
      let repracticeList = currentRepractice ? JSON.parse(currentRepractice) : [];
      const currentQuestion = questions[currentQuestionIndex];

      if (isCorrect) {
        repracticeList = repracticeList.filter(q => q.question !== currentQuestion.question);
      } else {
        if (!repracticeList.some(q => q.question === currentQuestion.question)) {
          repracticeList.push(currentQuestion);
        }
      }
      await SecureStore.setItemAsync(repracticeKey, JSON.stringify(repracticeList));
    } catch (error) {
      console.error('Error updating repractice list:', error);
    }

    const correctOption = options.find(opt => opt.isCorrect);
    let optionsToKeep = isCorrect ? [correctOption] : [correctOption, options[index]];
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOptions(optionsToKeep);

    if (isCorrect) {
      setCanProceed(true);
      setIsDescriptionGray(false);
    } else {
      setCanProceed(false);
      setIsDescriptionGray(true);
      setTimeout(() => {
        setCanProceed(true);
        setIsDescriptionGray(false);
      }, 2000);
    }

    if (newScore >= TARGET_CORRECT_ANSWERS) {
      setCompleted(true);
    }
  };

  // Move to next question
  const nextQ = async () => {
    if (correctSoundRef.current) {
      try {
        await correctSoundRef.current.stopAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
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

  // Handle exit
  const handleExit = () => {
    router.back();
  };

  // Handle restart
  const handleRestart = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setAskedQuestions([]);
    setGameQuestions([]); // Reset gameQuestions
    setCompleted(false);
    setAnswerSelected(false);
    setSelectedOptionIndex(null);
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  // Dynamic option styling
  const getOptionClassName = (option, index) => {
    let baseClass = "p-4 rounded-lg mb-3 border border-gray-700";
    if (!answerSelected) {
      return `${baseClass} bg-gray-700`;
    }
    if (option.isCorrect) {
      return `${baseClass} bg-green-900 border-green-700`;
    } else {
      return `${baseClass} bg-red-900 border-red-700`;
    }
  };

  // Dynamic description styling
  const getDescriptionClassName = () => {
    let baseClass = "p-4 rounded-lg mb-3 border";
    if (!canProceed) {
      return `${baseClass} border-gray-700 bg-gray-700`;
    } else {
      return `${baseClass} border-blue-700 bg-blue-900`;
    }
  };

  // Completed Screen
  if (completed) {
    return (
      <View className="flex-1 bg-gray-900">
        <StatusBar barStyle="light-content" />
        <ScrollView className="flex-1">
          <View className="justify-center items-center p-6">
            <MaterialIcons name="celebration" size={80} color="#FFD700" />
            <Text className="text-2xl font-bold text-gray-200 mt-6 mb-4">Congratulations!</Text>
            <Text className="text-lg text-center text-gray-400 mb-8">
              You've successfully completed the quiz with {score} correct answers.
            </Text>
          </View>
          <View className="px-4 mb-8">
            <Text className="text-xl font-bold text-gray-200 mb-4">Summary of Questions Asked</Text>
            {gameQuestions.map((q, index) => (
              <View key={index} className="bg-gray-800 rounded-lg p-4 mb-4 shadow-sm border border-gray-700">
                <Text className="text-lg font-bold text-gray-200 mb-2">Question {index + 1}</Text>
                <Text className="text-base text-gray-400 mb-2">{q.question}</Text>
                <Text className="text-base text-gray-200 mb-2">Correct Answer: {q.options[q.correct]}</Text>
                <Text className="text-base text-gray-200">Description: {q.describe}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View className="p-4">
          <TouchableHighlight
            underlayColor="#6366f1"
            onPress={handleRestart}
            className="bg-indigo-500 py-3 px-8 rounded-full mb-4 w-full items-center"
          >
            <Text className="text-white text-lg font-bold">Try Again</Text>
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor="#4b5563"
            onPress={handleExit}
            className="bg-gray-700 py-3 px-8 rounded-full w-full items-center"
          >
            <Text className="text-white text-lg font-bold">Exit</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

  // Loading State
  if (questions.length === 0 || options.length === 0) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-lg text-gray-400">Loading questions...</Text>
      </View>
    );
  }

  // Main Quiz UI
  return (
    <View className="flex-1 bg-gray-900">
      <View className="h-14 bg-gray-800 flex-row items-center px-4 shadow-md">
        <TouchableHighlight underlayColor="#4b5563" onPress={handleExit} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color="#e5e7eb" />
        </TouchableHighlight>
        <Text className="text-gray-200 text-lg font-bold flex-1 ml-4">{title}</Text>
      </View>
      <View className="h-8 bg-gray-700 rounded-lg mx-4 mt-4 overflow-hidden">
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
      <View className="bg-gray-800 rounded-lg p-4 m-4 shadow-sm border border-gray-700">
        <Text className="text-sm text-gray-400 mb-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text className="text-lg font-bold text-gray-200 mb-6">
          {questions[currentQuestionIndex].question}
        </Text>
        <View>
          {options.map((option, index) => (
            <TouchableHighlight
              key={option.originalIndex}
              underlayColor="#4b5563"
              onPress={() => !answerSelected && handleAnswer(option.isCorrect, index)}
              disabled={answerSelected}
              className={getOptionClassName(option, index)}
            >
              <Text className="text-base text-gray-200">{option.text}</Text>
            </TouchableHighlight>
          ))}
        </View>
      </View>
      {showFeedback && questions[currentQuestionIndex].describe !== options.find(opt => opt.isCorrect)?.text && (
        <View className="px-4 pb-4 flex-1">
          <TouchableOpacity
            onPress={nextQ}
            disabled={!canProceed}
            className={getDescriptionClassName()}
          >
            <ScrollView style={{ maxHeight: "100%" }}>
              <Text className="text-base text-gray-200">
                {questions[currentQuestionIndex].describe}
              </Text>
            </ScrollView>
          </TouchableOpacity>
          <Text className="text-center text-gray-400 mt-auto mb-5">
            Click on explanation to move on
          </Text>
        </View>
      )}
    </View>
  );
};

export default QuizScreen;