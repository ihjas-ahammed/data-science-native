import React from 'react';
import { View, Text, Touchable, TouchableOpacity } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const ProgressStats = ({ stats, onAddTask }) => {
    return (
        <View className="p-2.5 gap-2.5">
            {/* First Stat (Overall Progress) */}
            {stats.length > 0 && (
                <View className="flex-1 w-full bg-black rounded-lg p-3 mx-auto">
                    <View className="items-center gap-2.5">
                        <AnimatedCircularProgress
                            size={80}
                            width={6}
                            fill={stats[0].value}
                            tintColor={stats[0].color}
                            backgroundColor="#777777"
                            rotation={0}
                        >
                            {() => (
                                <Text
                                    className="text-base font-semibold"
                                    style={{ color: stats[0].color }}
                                >
                                    {`${stats[0].value}%`}
                                </Text>
                            )}
                        </AnimatedCircularProgress>
                        <View className="items-center">
                            <Text className="text-white text-sm font-semibold text-center">
                                {stats[0].title}
                            </Text>
                            {stats[0].description && (
                                <Text className="text-white text-xs text-center mt-1">
                                    {stats[0].description}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Remaining Stats in Three Columns */}
            <View className="flex flex-row gap-2 flex-wrap justify-center">
                {stats.slice(1).map((stat, index) => (
                    <TouchableOpacity
                        className="bg-black rounded-lg p-3 w-[31%]"
                        activeOpacity={0.7}
                        key={index}
                        onPress={()=>onAddTask(index)}>
                        <View className="flex items-center gap-2">
                            <AnimatedCircularProgress
                                size={60}
                                width={6}
                                fill={stat.value}
                                tintColor={stat.color}
                                backgroundColor="#777777"
                                rotation={0}
                            >
                                {() => (
                                    <Text
                                        className="text-sm font-semibold"
                                        style={{ color: stat.color }}
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