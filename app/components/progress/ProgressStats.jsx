import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const ProgressStats = ({ stats, onAddTask }) => {
    return (
        <View className="p-2.5 gap-3">
            {/* First Stat (Overall Progress) */}
            {stats.length > 0 && (
                <View className="flex-1 w-full bg-indigo-800  rounded-lg p-4 mx-auto shadow-sm">
                    <View className="items-center gap-3">
                        <AnimatedCircularProgress
                            size={80}
                            width={6}
                            fill={stats[0].value}
                            tintColor={stats[0].color}
                            backgroundColor="#E0E7FF"
                            rotation={0}
                        >
                            {() => (
                                <Text
                                    className="text-base font-bold"
                                    style={{ color: 'white' }}
                                >
                                    {`${stats[0].value}%`}
                                </Text>
                            )}
                        </AnimatedCircularProgress>
                        <View className="items-center">
                            <Text className="text-white text-lg font-semibold text-center">
                                {stats[0].title}
                            </Text>
                            {stats[0].description && (
                                <Text className="text-indigo-100 text-sm text-center mt-1">
                                    {stats[0].description}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Remaining Stats in Three Columns */}
            <View className="flex flex-row gap-2 flex-wrap justify-between">
                {stats.slice(1).map((stat, index) => (
                    <TouchableOpacity
                        className="bg-indigo-800 rounded-lg p-3 w-[31.5%] shadow-sm"
                        activeOpacity={0.7}
                        key={index}
                        onPress={() => onAddTask(index)}
                    >
                        <View className="flex items-center gap-2">
                            <AnimatedCircularProgress
                                size={60}
                                width={5}
                                fill={stat.value}
                                tintColor={stat.color}
                                backgroundColor="#E0E7FF"
                                rotation={0}
                            >
                                {() => (
                                    <Text
                                        className="text-sm font-bold"
                                        style={{ color: 'white' }}
                                    >
                                        {`${stat.value}%`}
                                    </Text>
                                )}
                            </AnimatedCircularProgress>
                            <Text className="text-white text-xs font-semibold text-center">
                                {stat.title}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default ProgressStats;