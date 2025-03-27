import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getItemAsync, setItemAsync } from 'expo-secure-store'
import * as FileSystem from 'expo-file-system'
import { WebView } from 'react-native-webview'

const HtmlTool = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const { subject, index, subInt, lesson, toolInt } = JSON.parse(exp)
    const dataUrl = lesson.data

    const tool = lesson.tools[toolInt];
    
    const toolName = tool.name
    
    const [score, setScore] = useState(0)
    const [accuracy, setAccuracy] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [webpageContent, setWebpageContent] = useState('')
    const [showGameOver, setShowGameOver] = useState(false)
    const webViewRef = useRef(null)

    const localFilePath = `${FileSystem.cacheDirectory}${tool.webpage.split('/').pop()}`
    const loadScore = async () => {
        let storedScore = await getItemAsync('score-'+subInt)
        if(storedScore) setScore(parseInt(storedScore))
        else await setItemAsync("score-"+subInt, "0")
    }

    const loadWebpage = async () => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(localFilePath)
            
            if (fileInfo.exists) {
                // Load from local storage
                const content = await FileSystem.readAsStringAsync(localFilePath)
                setWebpageContent(content)
                console.log("It didn't die!")
            } else {
                // Download and save
                try {
                    const downloadResult = await FileSystem.downloadAsync(
                        tool.webpage,
                        localFilePath
                    )
                    
                    if (downloadResult.status === 200) {
                        const content = await FileSystem.readAsStringAsync(localFilePath)
                        setWebpageContent(content)
                        console.log("Oh good")
                    } else {
                        // Use template if download fails
                        setWebpageContent(getTemplateHtml())
                        
                        console.log("Oh good")
                    }
                } catch (err) {
                    console.error("Download error:", err)
                    setWebpageContent(getTemplateHtml())
                }
            }
        } catch (error) {
            console.error("Error loading webpage:", error)
            setWebpageContent(getTemplateHtml())
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        
        loadScore()
        loadWebpage()
    }, [])

    const getTemplateHtml = () => {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interactive Learning</title>
        </head>
        <body>
            <div class="container">
                <h1>Interactive Quiz</h1>
                <div class="quiz-container" id="quiz">
                    <!-- Questions will be dynamically loaded here -->
                </div>
                <div class="result" id="result"></div>
                <button id="submit-btn" style="display:none;">Submit Answers</button>
            </div>

            <script>
                // Sample quiz questions
                const quizQuestions = [
                    {
                        question: "What is the capital of France?",
                        options: ["London", "Berlin", "Paris", "Madrid"],
                        answer: 2
                    },
                    {
                        question: "Which planet is known as the Red Planet?",
                        options: ["Earth", "Mars", "Jupiter", "Venus"],
                        answer: 1
                    },
                    {
                        question: "What is 2 + 2?",
                        options: ["3", "4", "5", "6"],
                        answer: 1
                    }
                ];

                let correctAnswers = 0;
                let totalQuestions = quizQuestions.length;
                let userAnswers = [];
                let quizCompleted = false;

                // Load questions
                function loadQuiz() {
                    const quizContainer = document.getElementById('quiz');
                    quizContainer.innerHTML = '';
                    
                    quizQuestions.forEach((q, qIndex) => {
                        const questionDiv = document.createElement('div');
                        questionDiv.className = 'question-block';
                        
                        const questionText = document.createElement('div');
                        questionText.className = 'question';
                        questionText.textContent = \`\${qIndex + 1}. \${q.question}\`;
                        questionDiv.appendChild(questionText);
                        
                        const optionsDiv = document.createElement('div');
                        optionsDiv.className = 'options';
                        
                        q.options.forEach((opt, optIndex) => {
                            const optionBtn = document.createElement('div');
                            optionBtn.className = 'option-btn';
                            optionBtn.textContent = opt;
                            optionBtn.dataset.qIndex = qIndex;
                            optionBtn.dataset.optIndex = optIndex;
                            
                            optionBtn.addEventListener('click', function() {
                                if (!quizCompleted) {
                                    // Remove selection from other options in this question
                                    const optionBtns = optionsDiv.querySelectorAll('.option-btn');
                                    optionBtns.forEach(btn => {
                                        btn.style.backgroundColor = '#f1f1f1';
                                        btn.style.fontWeight = 'normal';
                                    });
                                    
                                    // Highlight selected option
                                    this.style.backgroundColor = '#b3e5fc';
                                    this.style.fontWeight = 'bold';
                                    
                                    // Save user's answer
                                    userAnswers[qIndex] = parseInt(this.dataset.optIndex);
                                    
                                    // Show submit button if all questions are answered
                                    if (userAnswers.filter(a => a !== undefined).length === totalQuestions) {
                                        document.getElementById('submit-btn').style.display = 'block';
                                    }
                                }
                            });
                            
                            optionsDiv.appendChild(optionBtn);
                        });
                        
                        questionDiv.appendChild(optionsDiv);
                        quizContainer.appendChild(questionDiv);
                    });
                    
                    // Add event listener to submit button
                    document.getElementById('submit-btn').addEventListener('click', checkAnswers);
                }

                // Check answers and display results
                function checkAnswers() {
                    if (quizCompleted) return;
                    
                    quizCompleted = true;
                    correctAnswers = 0;
                    
                    quizQuestions.forEach((q, qIndex) => {
                        const userAnswer = userAnswers[qIndex];
                        const correctAnswer = q.answer;
                        
                        const options = document.querySelectorAll(\`[data-q-index="\${qIndex}"]\`);
                        
                        options.forEach((opt, optIndex) => {
                            if (optIndex === correctAnswer) {
                                opt.classList.add('correct');
                            } else if (optIndex === userAnswer) {
                                opt.classList.add('incorrect');
                            }
                        });
                        
                        if (userAnswer === correctAnswer) {
                            correctAnswers++;
                        }
                    });
                    
                    const accuracy = correctAnswers / totalQuestions;
                    const resultText = \`You got \${correctAnswers} out of \${totalQuestions} correct. Accuracy: \${(accuracy * 100).toFixed(0)}%\`;
                    document.getElementById('result').textContent = resultText;
                    
                    // Hide submit button and show complete button
                    document.getElementById('submit-btn').style.display = 'none';
                    
                    // Send accuracy data to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'setAccuracy',
                        accuracy: accuracy
                    }));
                    
                    // Add game over button
                    const gameOverBtn = document.createElement('button');
                    gameOverBtn.textContent = 'Complete Quiz';
                    gameOverBtn.addEventListener('click', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'gameOver'
                        }));
                    });
                    document.getElementById('result').appendChild(document.createElement('br'));
                    document.getElementById('result').appendChild(gameOverBtn);
                }

                // Initialize the quiz
                window.onload = loadQuiz;
            </script>
        </body>
        </html>
        `;
    }

    const gameOver = async () => {
        let addScore = Math.round(accuracy * tool.score);
        const newScore = score + addScore;
        setScore(newScore);
        await setItemAsync("score-" + subInt, newScore.toString());
        setShowGameOver(true);
    }

    const handleRetry = () => {
        setShowGameOver(false);
        setAccuracy(0);
        if (webViewRef.current) {
            webViewRef.current.reload();
        }
    }

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'setAccuracy') {
                setAccuracy(data.accuracy);
            } else if (data.type === 'gameOver') {
                gameOver();
            }
        } catch (error) {
            console.error('Error parsing WebView message:', error);
        }
    }

    const handleRefresh = async () =>{
        setIsLoading(true)
        try{
            const fileInfo = await FileSystem.getInfoAsync(localFilePath)
            
            if (fileInfo.exists) await FileSystem.deleteAsync(localFilePath)
            console.log("Reloading")
            await loadWebpage()
        }catch(e){
            console.log(e)
        }

        setIsLoading(false)
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800 mr-auto ml-auto">{tool.label}</Text>
                <TouchableOpacity onPress={handleRefresh} className="flex-row items-center">
                    <Ionicons name="refresh" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text className="mt-4 text-gray-600">Loading content...</Text>
                </View>
            ) : (
                <View className="flex-1">
                    <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        source={{ html: webpageContent }}
                        onMessage={handleWebViewMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#0000ff" />
                            </View>
                        )}
                    />
                </View>
            )}
            
            {/* Game Over Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showGameOver}
                onRequestClose={() => setShowGameOver(false)}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-white p-6 rounded-xl w-4/5 items-center shadow-lg">
                        <View className="w-20 h-20 rounded-full bg-green-100 justify-center items-center mb-4">
                            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-800 mb-2">Task Complete!</Text>
                        <Text className="text-lg text-gray-600 mb-1">Accuracy: {(accuracy * 100).toFixed(0)}%</Text>
                        <Text className="text-lg text-gray-600 mb-4">Points earned: {Math.round(accuracy * tool.score)}</Text>
                        <Text className="text-lg text-gray-600 mb-6">Total score: {score}</Text>
                        
                        <View className="flex-row justify-around w-full">
                            <TouchableOpacity 
                                onPress={handleRetry} 
                                className="bg-blue-500 py-3 px-6 rounded-lg"
                            >
                                <Text className="text-white font-bold">Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => router.back()} 
                                className="bg-gray-500 py-3 px-6 rounded-lg"
                            >
                                <Text className="text-white font-bold">Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default HtmlTool