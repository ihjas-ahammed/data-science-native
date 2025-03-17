import { View, Text, TouchableOpacity,SafeAreaView, StatusBar} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getItemAsync, setItemAsync } from 'expo-secure-store'

const Template = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const { subject, index, subInt, lesson } = JSON.parse(exp)
    const dataUrl = lesson.data

    const toolName = 'template'
    const tool = lesson.tools.filter((t,i)=>t.name == toolName)[0]

    const [score, setScore] = useState(0)

    useEffect(()=>{
        const loadScore = async ()=>{
            let storedScore = await getItemAsync('score-'+subInt)
            if(storedScore) setScore(storedScore)
            else await setItemAsync("score-"+subInt,score+"")
            console.log(storedScore)
            }

        loadScore()
    },[])

    const [accuracy, setAccuracy] = useState(0)

    const gameOver = async ()=>{
        let addScore = accuracy*tool.score
        setScore(score + addScore)
        await setItemAsync("score-"+subInt,score+"")
    }

    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800 mr-auto ml-auto">{tool.label}</Text>
            </View>
        </SafeAreaView>
    )
}

export default Template