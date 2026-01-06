import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { VoidType, VoidWeatherState } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

interface WeatherIndicatorProps {
  voidType: VoidType;
  weather: VoidWeatherState | null;
}

const WEATHER_DATA: Record<string, { icon: string; label: string }> = {
  calm: { icon: '🌫️', label: 'Calm' },
  serene: { icon: '✨', label: 'Serene' },
  clearing: { icon: '🌤️', label: 'Clearing' },
  heavy: { icon: '🌧️', label: 'Heavy' },
  turbulent: { icon: '⛈️', label: 'Turbulent' },
  stormy: { icon: '🌪️', label: 'Stormy' },
  hope: { icon: '🌈', label: 'Hope' },
  anger: { icon: '🔥', label: 'Anger' },
};

export function WeatherIndicator({
  voidType,
  weather,
}: WeatherIndicatorProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const weatherInfo = weather ? WEATHER_DATA[weather.state] : WEATHER_DATA.calm;

  // Animation values
  const scale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  // Initial fade in
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  // Weather change animation
  useEffect(() => {
    if (weather) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );

      iconRotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      // Pulse effect for intense weather
      if (
        weather.state === 'stormy' ||
        weather.state === 'turbulent' ||
        weather.state === 'anger'
      ) {
        pulseOpacity.value = withSequence(
          withTiming(0.6, { duration: 300 }),
          withTiming(0, { duration: 500 })
        );
      }
    }
  }, [weather?.state]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Pulse background for intense weather */}
      <Animated.View
        style={[
          styles.pulseBackground,
          pulseStyle,
          { backgroundColor: config.colors.primary },
        ]}
      />

      <View style={[styles.content, { borderColor: config.colors.primary + '40' }]}>
        <Animated.Text style={[styles.icon, iconStyle]}>
          {weatherInfo.icon}
        </Animated.Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{weatherInfo.label}</Text>
          {weather && (
            <View style={styles.intensityBar}>
              <View
                style={[
                  styles.intensityFill,
                  {
                    width: `${weather.intensity * 100}%`,
                    backgroundColor: config.colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pulseBackground: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  intensityBar: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 2,
  },
});
