import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import { useVoidStore } from '../store';
import type { VoidSelectScreenProps } from '../navigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;
const CARD_SPACING = 16;

interface VoidCardData {
  type: VoidType;
  emoji: string;
  description: string;
  tagline: string;
}

const VOID_CARDS: VoidCardData[] = [
  {
    type: 'grief',
    emoji: '💧',
    description: 'Loss, sadness, mourning',
    tagline: 'Let your tears fall into the void',
  },
  {
    type: 'rage',
    emoji: '🔥',
    description: 'Anger, frustration, fury',
    tagline: 'Burn away what burdens you',
  },
  {
    type: 'guilt',
    emoji: '⚖️',
    description: 'Regret, shame, remorse',
    tagline: 'Release the weight you carry',
  },
  {
    type: 'longing',
    emoji: '🌙',
    description: 'Desire, nostalgia, yearning',
    tagline: 'Whisper to what could have been',
  },
  {
    type: 'relief',
    emoji: '✨',
    description: 'Release, freedom, peace',
    tagline: 'Celebrate your liberation',
  },
];

const WEATHER_ICONS: Record<string, string> = {
  calm: '🌫️',
  serene: '✨',
  clearing: '🌤️',
  heavy: '🌧️',
  turbulent: '⛈️',
  stormy: '🌪️',
  hope: '🌈',
  anger: '🔥',
};

interface VoidCardProps {
  data: VoidCardData;
  index: number;
  scrollX: Animated.SharedValue<number>;
  onPress: () => void;
}

function VoidCard({ data, index, scrollX, onPress }: VoidCardProps) {
  const config = VOID_CONFIG[data.type];
  const weather = useVoidStore((state) => state.weather[data.type]);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, -15],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [30, 0, 30],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { translateY },
      ],
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const glowOpacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 0.6, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: glowOpacity,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        {/* Card glow effect */}
        <Animated.View
          style={[
            styles.cardGlow,
            glowStyle,
            { backgroundColor: config.colors.primary },
          ]}
        />

        {/* Card content */}
        <View style={[styles.card, { borderColor: config.colors.primary + '30' }]}>
          {/* Gradient overlay */}
          <View style={styles.cardGradientTop} />
          <View
            style={[
              styles.cardGradientBottom,
              { backgroundColor: config.colors.primary + '15' },
            ]}
          />

          {/* Weather indicator */}
          {weather && (
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherIcon}>
                {WEATHER_ICONS[weather.state] || '🌫️'}
              </Text>
              <Text style={styles.weatherText}>{weather.state}</Text>
            </View>
          )}

          {/* Main content */}
          <View style={styles.cardContent}>
            {/* Color preview orb */}
            <View style={styles.orbContainer}>
              <View
                style={[
                  styles.orbOuter,
                  { backgroundColor: config.colors.primary + '30' },
                ]}
              >
                <View
                  style={[
                    styles.orbMiddle,
                    { backgroundColor: config.colors.primary + '50' },
                  ]}
                >
                  <View
                    style={[
                      styles.orbInner,
                      { backgroundColor: config.colors.primary },
                    ]}
                  />
                </View>
              </View>
              {/* Emoji overlay */}
              <Text style={styles.cardEmoji}>{data.emoji}</Text>
            </View>

            {/* Void name */}
            <Text style={styles.cardTitle}>
              {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
            </Text>

            {/* Description */}
            <Text style={styles.cardDescription}>{data.description}</Text>

            {/* Tagline */}
            <Text style={[styles.cardTagline, { color: config.colors.primary }]}>
              {data.tagline}
            </Text>
          </View>

          {/* Enter button */}
          <View
            style={[styles.enterButton, { backgroundColor: config.colors.primary }]}
          >
            <Text style={styles.enterButtonText}>Enter</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function VoidSelectScreen(): React.JSX.Element {
  const navigation = useNavigation<VoidSelectScreenProps['navigation']>();

  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  // Calculate center offset for first card
  const startOffset = (SCREEN_WIDTH - CARD_WIDTH) / 2;

  const handleSelectVoid = useCallback(
    (voidType: VoidType) => {
      navigation.navigate('Void', { voidType });
    },
    [navigation]
  );

  const snapToIndex = useCallback((index: number) => {
    'worklet';
    const clampedIndex = Math.max(0, Math.min(index, VOID_CARDS.length - 1));
    currentIndex.value = clampedIndex;
    scrollX.value = withSpring(clampedIndex * (CARD_WIDTH + CARD_SPACING), {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
    });
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newValue =
        currentIndex.value * (CARD_WIDTH + CARD_SPACING) - event.translationX;
      scrollX.value = Math.max(
        0,
        Math.min(newValue, (VOID_CARDS.length - 1) * (CARD_WIDTH + CARD_SPACING))
      );
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentPosition = scrollX.value;

      // Determine direction and calculate target index
      let targetIndex = Math.round(currentPosition / (CARD_WIDTH + CARD_SPACING));

      // Apply velocity influence
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          targetIndex = Math.ceil(currentPosition / (CARD_WIDTH + CARD_SPACING));
        } else {
          targetIndex = Math.floor(currentPosition / (CARD_WIDTH + CARD_SPACING));
        }
      }

      snapToIndex(targetIndex);
    });

  const cardsContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startOffset - scrollX.value }],
  }));

  // Pagination dots
  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {VOID_CARDS.map((_, index) => {
        const dotStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ];

          const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.8, 1.4, 0.8],
            Extrapolation.CLAMP
          );

          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.4, 1, 0.4],
            Extrapolation.CLAMP
          );

          return {
            transform: [{ scale }],
            opacity,
          };
        });

        const config = VOID_CONFIG[VOID_CARDS[index].type];

        return (
          <Pressable
            key={index}
            onPress={() => snapToIndex(index)}
          >
            <Animated.View
              style={[
                styles.dot,
                dotStyle,
                { backgroundColor: config.colors.primary },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background gradient layers */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Animated.Text
            entering={FadeInUp.delay(100).duration(400)}
            style={styles.title}
          >
            Choose Your Void
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.subtitle}
          >
            Swipe to explore • Tap to enter
          </Animated.Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Cards carousel */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.carouselContainer}>
          <Animated.View style={[styles.cardsRow, cardsContainerStyle]}>
            {VOID_CARDS.map((card, index) => (
              <VoidCard
                key={card.type}
                data={card}
                index={index}
                scrollX={scrollX}
                onPress={() => handleSelectVoid(card.type)}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Pagination dots */}
      <Animated.View entering={FadeIn.delay(300).duration(400)}>
        {renderDots()}
      </Animated.View>

      {/* Hint text */}
      <Animated.Text
        entering={FadeIn.delay(400).duration(400)}
        style={styles.hintText}
      >
        All confessions disappear after 5 minutes
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  // Gradient layers
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#0a0a12',
    opacity: 0.8,
  },
  gradientLayer2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: '#1a1a2e',
    opacity: 0.3,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    backgroundColor: '#0f0f1a',
    opacity: 0.5,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b6b7a',
    marginTop: 6,
  },
  // Carousel
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Card
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: CARD_SPACING / 2,
  },
  cardGlow: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderRadius: 30,
    filter: 'blur(40px)',
  },
  card: {
    flex: 1,
    backgroundColor: '#12121a',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  // Weather badge
  weatherBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weatherIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  weatherText: {
    fontSize: 12,
    color: '#8b8b9a',
    textTransform: 'capitalize',
  },
  // Card content
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  orbContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  orbOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbMiddle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardEmoji: {
    fontSize: 48,
    position: 'absolute',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: 16,
    color: '#8b8b9a',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardTagline: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Enter button
  enterButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Pagination dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  // Hint
  hintText: {
    fontSize: 12,
    color: '#4a4a5a',
    textAlign: 'center',
    paddingBottom: 40,
  },
});
