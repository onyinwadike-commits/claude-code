/**
 * LettersList Screen
 *
 * Shows all letters to the void - pending and ready to reveal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  getLetterMetadata,
  getTimeRemaining,
  type LetterMetadata,
} from '../services/letterStorage';
import type { LettersListScreenProps } from '../navigation';

export function LettersListScreen(): React.JSX.Element {
  const navigation = useNavigation<LettersListScreenProps['navigation']>();

  const [letters, setLetters] = useState<LetterMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLetters = useCallback(async () => {
    try {
      const metadata = await getLetterMetadata();
      // Sort: ready first, then by return date
      metadata.sort((a, b) => {
        if (a.isReady && !b.isReady) return -1;
        if (!a.isReady && b.isReady) return 1;
        return a.returnDate - b.returnDate;
      });
      setLetters(metadata);
    } catch (error) {
      console.error('Failed to load letters:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLetters();
    }, [loadLetters])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLetters();
  }, [loadLetters]);

  const handleLetterPress = useCallback(
    (letter: LetterMetadata) => {
      if (letter.isReady && !letter.hasBeenViewed) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('LetterReveal', { letterId: letter.id });
      } else if (!letter.isReady) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Could show a modal explaining the letter isn't ready yet
      }
    },
    [navigation]
  );

  const readyLetters = letters.filter((l) => l.isReady && !l.hasBeenViewed);
  const pendingLetters = letters.filter((l) => !l.isReady);
  const viewedLetters = letters.filter((l) => l.hasBeenViewed);

  const formatCreatedDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your letters...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Letters to the Void</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8b8b9a"
          />
        }
      >
        {letters.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyTitle}>No letters yet</Text>
            <Text style={styles.emptyText}>
              Write a letter to your future self.{'\n'}
              It will return to you on the date you choose.
            </Text>
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => navigation.navigate('VoidSelect')}
            >
              <Text style={styles.writeButtonText}>Write a Letter</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            {/* Ready to reveal */}
            {readyLetters.length > 0 && (
              <Animated.View entering={FadeInDown} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  READY TO REVEAL ({readyLetters.length})
                </Text>
                {readyLetters.map((letter, index) => (
                  <TouchableOpacity
                    key={letter.id}
                    onPress={() => handleLetterPress(letter)}
                  >
                    <Animated.View
                      entering={FadeInDown.delay(index * 100)}
                      layout={Layout.springify()}
                      style={[styles.letterCard, styles.readyCard]}
                    >
                      <View style={styles.letterIcon}>
                        <Text style={styles.letterIconText}>📜</Text>
                      </View>
                      <View style={styles.letterInfo}>
                        <Text style={styles.letterStatus}>A letter has returned!</Text>
                        <Text style={styles.letterDate}>
                          Written {formatCreatedDate(letter.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.revealBadge}>
                        <Text style={styles.revealBadgeText}>Reveal</Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* Pending */}
            {pendingLetters.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(readyLetters.length * 100)}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>
                  IN THE VOID ({pendingLetters.length})
                </Text>
                {pendingLetters.map((letter, index) => {
                  const timeRemaining = getTimeRemaining(letter.returnDate);
                  return (
                    <TouchableOpacity
                      key={letter.id}
                      onPress={() => handleLetterPress(letter)}
                      disabled
                    >
                      <Animated.View
                        entering={FadeInDown.delay((readyLetters.length + index) * 100)}
                        layout={Layout.springify()}
                        style={styles.letterCard}
                      >
                        <View style={[styles.letterIcon, styles.pendingIcon]}>
                          <Text style={styles.letterIconText}>🔒</Text>
                        </View>
                        <View style={styles.letterInfo}>
                          <Text style={styles.letterPending}>
                            {letter.returnDays}-day letter
                          </Text>
                          <Text style={styles.letterDate}>
                            {timeRemaining.formatted}
                          </Text>
                        </View>
                        <View style={styles.daysRemaining}>
                          <Text style={styles.daysNumber}>{timeRemaining.days}</Text>
                          <Text style={styles.daysLabel}>days</Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}

            {/* Viewed (if any still exist) */}
            {viewedLetters.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(
                  (readyLetters.length + pendingLetters.length) * 100
                )}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>
                  VIEWED ({viewedLetters.length})
                </Text>
                {viewedLetters.map((letter, index) => (
                  <Animated.View
                    key={letter.id}
                    entering={FadeInDown.delay(
                      (readyLetters.length + pendingLetters.length + index) * 100
                    )}
                    style={[styles.letterCard, styles.viewedCard]}
                  >
                    <View style={[styles.letterIcon, styles.viewedIcon]}>
                      <Text style={styles.letterIconText}>✓</Text>
                    </View>
                    <View style={styles.letterInfo}>
                      <Text style={styles.letterViewed}>Letter viewed</Text>
                      <Text style={styles.letterDate}>
                        {formatCreatedDate(letter.createdAt)}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            )}
          </>
        )}

        {/* Info */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.infoSection}>
          <Text style={styles.infoText}>
            Your letters are encrypted and stored only on this device.{'\n'}
            They are never sent to any server.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8b8b9a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8b8b9a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  writeButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  writeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b6b7a',
    letterSpacing: 1,
    marginBottom: 12,
  },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  readyCard: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    backgroundColor: '#1a1a2e',
  },
  viewedCard: {
    opacity: 0.6,
  },
  letterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pendingIcon: {
    backgroundColor: '#2a2a3e',
  },
  viewedIcon: {
    backgroundColor: '#1a3a1a',
  },
  letterIconText: {
    fontSize: 20,
  },
  letterInfo: {
    flex: 1,
  },
  letterStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 4,
  },
  letterPending: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  letterViewed: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8b8b9a',
    marginBottom: 4,
  },
  letterDate: {
    fontSize: 13,
    color: '#6b6b7a',
  },
  revealBadge: {
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  revealBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  daysRemaining: {
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b8b9a',
  },
  daysLabel: {
    fontSize: 10,
    color: '#6b6b7a',
    textTransform: 'uppercase',
  },
  infoSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#6b6b7a',
    textAlign: 'center',
    lineHeight: 20,
  },
});
