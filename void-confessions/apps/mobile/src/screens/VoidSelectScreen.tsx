import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import type { VoidSelectScreenProps } from '../navigation';

const VOID_TYPES: { type: VoidType; emoji: string; description: string }[] = [
  { type: 'grief', emoji: '💧', description: 'Loss, sadness, mourning' },
  { type: 'rage', emoji: '🔥', description: 'Anger, frustration, fury' },
  { type: 'guilt', emoji: '⚖️', description: 'Regret, shame, remorse' },
  { type: 'longing', emoji: '🌙', description: 'Desire, nostalgia, yearning' },
  { type: 'relief', emoji: '✨', description: 'Release, freedom, peace' },
];

export function VoidSelectScreen(): React.JSX.Element {
  const navigation = useNavigation<VoidSelectScreenProps['navigation']>();

  const handleSelectVoid = (voidType: VoidType) => {
    navigation.navigate('Void', { voidType });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Choose Your Void</Text>
      <Text style={styles.subtitle}>
        Where does your confession belong?
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {VOID_TYPES.map((void_, index) => {
          const config = VOID_CONFIG[void_.type];
          return (
            <Animated.View
              key={void_.type}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.voidCard,
                  { borderColor: config.colors.primary + '40' },
                ]}
                onPress={() => handleSelectVoid(void_.type)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.voidIconContainer,
                    { backgroundColor: config.colors.primary + '20' },
                  ]}
                >
                  <Text style={styles.voidEmoji}>{void_.emoji}</Text>
                </View>
                <View style={styles.voidInfo}>
                  <Text style={styles.voidName}>
                    {void_.type.charAt(0).toUpperCase() + void_.type.slice(1)}
                  </Text>
                  <Text style={styles.voidDescription}>{void_.description}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b8b9a',
    textAlign: 'center',
    marginBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  voidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  voidIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  voidEmoji: {
    fontSize: 28,
  },
  voidInfo: {
    flex: 1,
  },
  voidName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  voidDescription: {
    fontSize: 14,
    color: '#8b8b9a',
  },
  chevron: {
    fontSize: 24,
    color: '#6b6b7a',
    marginLeft: 8,
  },
});
