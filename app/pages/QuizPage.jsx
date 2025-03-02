import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Sample questions (would be replaced with your full question set)


const QuizScreen = ({sampleQuestions, title}) => {
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
  
  const TARGET_CORRECT_ANSWERS = 30;
  
  // Initialize questions with shuffled order
  useEffect(() => {
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setAskedQuestions([]);
  }, []);
  
  // Shuffle options when current question changes
  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      // Create array of {text, isCorrect, originalIndex} objects
      const questionOptions = currentQuestion.options.map((option, index) => ({
        text: option,
        isCorrect: index === currentQuestion.correct,
        originalIndex: index
      }));
      
      // Shuffle options
      const shuffledOptions = [...questionOptions].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions);
      
      // Reset answer state
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
    
    // Color transition from red to yellow to green based on progress
    Animated.timing(progressBarColor, {
      toValue: score / TARGET_CORRECT_ANSWERS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [score, progressAnim, progressBarColor]);
  
  const interpolatedColor = progressBarColor.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff4d4d', '#ffde59', '#4CAF50']
  });
  
  const handleAnswer = (isCorrect, index) => {
    // Show which options are correct/incorrect
    setAnswerSelected(true);
    setSelectedOptionIndex(index);
    
    // Record this question as asked
    setAskedQuestions([...askedQuestions, questions[currentQuestionIndex]]);
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedbackMessage('Correct! +1 point');
      setFeedbackColor('#28a745');
    } else {
      // Decrease score but not below 0
      setScore(Math.max(0, score - 1));
      setFeedbackMessage('Incorrect! -1 point');
      setFeedbackColor('#dc3545');
    }
    
    setShowFeedback(true);
    
    // Hide feedback after 2 seconds and move to next question
    setTimeout(() => {
      setShowFeedback(false);
      
      // Check if we've reached the target score
      if (score + (isCorrect ? 1 : 0) >= TARGET_CORRECT_ANSWERS) {
        setCompleted(true);
        return;
      }
      
      moveToNextQuestion();
    }, 2000);
  };
  
  const moveToNextQuestion = useCallback(() => {
    // If we've gone through all questions, check if we need to reset
    if (currentQuestionIndex >= questions.length - 1) {
      // We've gone through all questions once
      if (askedQuestions.length >= questions.length) {
        // Reset and shuffle questions again, but exclude already answered correctly questions
        const remainingQuestions = questions.filter(
          q => !askedQuestions.some(asked => asked === q && asked.answeredCorrectly)
        );
        
        if (remainingQuestions.length === 0) {
          // All questions answered correctly, shuffle all again
          const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
          setQuestions(shuffledQuestions);
        } else {
          // Shuffle remaining questions
          const shuffledRemaining = [...remainingQuestions].sort(() => Math.random() - 0.5);
          setQuestions(shuffledRemaining);
        }
        
        setAskedQuestions([]);
        setCurrentQuestionIndex(0);
      } else {
        // We still have some unasked questions in this round
        setCurrentQuestionIndex(0);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions, askedQuestions]);
  
  const handleExit = () => {
    router.push('/');
  };
  
  const handleRestart = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setAskedQuestions([]);
    setCompleted(false);
    setAnswerSelected(false);
    setSelectedOptionIndex(null);
    
    // Reshuffle questions
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
        <View className="bg-white bg-opacity-20 px-3 py-1.5 rounded-full">
          <Text className="text-black font-bold">Score: {score}</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View className="h-8 bg-gray-200 rounded-lg mx-4 mt-4 overflow-hidden">
        <Animated.View 
          style={[
            { 
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: interpolatedColor
            }
          ]} 
        />
        <Text className="absolute w-full text-center leading-8 text-xs font-bold text-gray-800">
          {score}/{TARGET_CORRECT_ANSWERS} correct answers
        </Text>
      </View>
      
      {/* Question Card */}
      <View className="bg-white rounded-lg p-4 m-4 shadow-sm flex-1">
        <Text className="text-sm text-gray-500 mb-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text className="text-lg font-bold text-gray-800 mb-6">
          {questions[currentQuestionIndex].question}
        </Text>
        
        {/* Options */}
        <View className="flex-1">
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              className={getOptionClassName(option, index)}
              onPress={() => !answerSelected && handleAnswer(option.isCorrect, index)}
              disabled={answerSelected}
            >
              <Text className="text-base text-gray-700">
                {option.text}
              </Text>
              {answerSelected && option.isCorrect && (
                <MaterialIcons name="check-circle" size={20} color="#22c55e" className="absolute right-4 top-4" />
              )}
              {answerSelected && index === selectedOptionIndex && !option.isCorrect && (
                <MaterialIcons name="cancel" size={20} color="#ef4444" className="absolute right-4 top-4" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Feedback Message */}
      {showFeedback && (
        <View 
          className="absolute bottom-6 left-6 right-6 p-4 rounded-lg items-center justify-center shadow-md"
          style={{backgroundColor: feedbackColor}}
        >
          <Text className="text-white text-base font-bold">{feedbackMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default QuizScreen;