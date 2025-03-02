import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import "./global.css"

const RootLayout = () => {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }}/>
            <Stack.Screen name="webview/[...path]" options={{ headerShown: false }}/>
            <Stack.Screen name="notes/[...path]" options={{ headerShown: false }}/>
            <Stack.Screen name="cog" options={{ headerShown: false }}/>
        </Stack>
    )
}



export default RootLayout