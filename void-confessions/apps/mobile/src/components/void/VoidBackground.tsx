import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import type { VoidType, VoidWeatherState } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoidBackgroundProps {
  voidType: VoidType;
  weather: VoidWeatherState | null;
}

// Weather-based intensity modifiers
const WEATHER_INTENSITY: Record<string, number> = {
  calm: 0.3,
  serene: 0.4,
  clearing: 0.5,
  heavy: 0.7,
  turbulent: 0.8,
  stormy: 0.9,
  hope: 0.6,
  anger: 0.85,
};

export function VoidBackground({ voidType, weather }: VoidBackgroundProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const intensity = weather ? WEATHER_INTENSITY[weather.state] || 0.5 : 0.5;

  // Animation values
  const pulseProgress = useSharedValue(0);
  const gradientShift = useSharedValue(0);
  const weatherTransition = useSharedValue(0);

  useEffect(() => {
    // Continuous pulse animation
    pulseProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Gradient shift animation
    gradientShift.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Animate weather transitions
  useEffect(() => {
    weatherTransition.value = withTiming(intensity, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [weather?.state]);

  // Primary gradient layer
  const primaryGradientStyle = useAnimatedStyle(() => {
    const scale = 1 + pulseProgress.value * 0.1 * weatherTransition.value;
    return {
      transform: [{ scale }],
      opacity: 0.4 + weatherTransition.value * 0.3,
    };
  });

  // Secondary floating orb
  const secondaryOrbStyle = useAnimatedStyle(() => {
    const translateX = Math.sin(gradientShift.value * Math.PI * 2) * 50;
    const translateY = Math.cos(gradientShift.value * Math.PI * 2) * 30;
    return {
      transform: [{ translateX }, { translateY }],
      opacity: 0.2 + pulseProgress.value * 0.15,
    };
  });

  // Tertiary accent orb
  const tertiaryOrbStyle = useAnimatedStyle(() => {
    const translateX = Math.cos(gradientShift.value * Math.PI * 2) * 40;
    const translateY = Math.sin(gradientShift.value * Math.PI * 2 + 1) * 60;
    return {
      transform: [{ translateX }, { translateY }],
      opacity: 0.15 + pulseProgress.value * 0.1,
    };
  });

  // Weather overlay
  const weatherOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: weatherTransition.value * 0.3,
    };
  });

  return (
    <View style={styles.container}>
      {/* Base dark gradient */}
      <View style={styles.baseGradient} />

      {/* Primary color orb */}
      <Animated.View
        style={[
          styles.primaryOrb,
          primaryGradientStyle,
          { backgroundColor: config.colors.primary },
        ]}
      />

      {/* Secondary floating orb */}
      <Animated.View
        style={[
          styles.secondaryOrb,
          secondaryOrbStyle,
          { backgroundColor: config.colors.secondary || config.colors.primary },
        ]}
      />

      {/* Tertiary accent */}
      <Animated.View
        style={[
          styles.tertiaryOrb,
          tertiaryOrbStyle,
          { backgroundColor: config.colors.accent || config.colors.primary },
        ]}
      />

      {/* Weather intensity overlay */}
      <Animated.View
        style={[
          styles.weatherOverlay,
          weatherOverlayStyle,
          {
            backgroundColor:
              weather?.state === 'stormy' || weather?.state === 'anger'
                ? '#ff000020'
                : weather?.state === 'hope' || weather?.state === 'serene'
                ? '#ffffff10'
                : 'transparent',
          },
        ]}
      />

      {/* Vignette effect */}
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050508',
  },
  primaryOrb: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
  },
  secondaryOrb: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.4,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  tertiaryOrb: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.4,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
  },
  weatherOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulated vignette with border
    borderWidth: SCREEN_WIDTH * 0.15,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: SCREEN_WIDTH * 0.1,
  },
});
