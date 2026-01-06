'use client';

/**
 * Crisis Resources Modal
 *
 * Displays crisis resources when concerning content is detected.
 * This is a safety-critical component.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { LocaleCrisisResources, CrisisResource } from '@void-confessions/core';

interface CrisisResourcesModalProps {
  visible: boolean;
  resources: LocaleCrisisResources;
  supportMessage: string;
  onClose: () => void;
  onResourceClick?: (resource: CrisisResource) => void;
}

export function CrisisResourcesModal({
  visible,
  resources,
  supportMessage,
  onClose,
  onResourceClick,
}: CrisisResourcesModalProps) {
  const handleCall = (phone: string, resource: CrisisResource) => {
    onResourceClick?.(resource);
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleText = (number: string, keyword?: string, resource?: CrisisResource) => {
    if (resource) onResourceClick?.(resource);
    const body = keyword ? `&body=${keyword}` : '';
    Linking.openURL(`sms:${number.replace(/\s/g, '')}${body}`);
  };

  const handleWebsite = (url: string, resource: CrisisResource) => {
    onResourceClick?.(resource);
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.modalContainer}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              style={styles.header}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>💚</Text>
              </View>
              <Text style={styles.title}>You&apos;re Not Alone</Text>
              <Text style={styles.subtitle}>{supportMessage}</Text>
            </Animated.View>

            {/* Emergency Number */}
            {resources.emergencyNumber && (
              <Animated.View
                entering={FadeInDown.delay(200)}
                style={styles.emergencyCard}
              >
                <Text style={styles.emergencyLabel}>Emergency Services</Text>
                <TouchableOpacity
                  style={styles.emergencyButton}
                  onPress={() => Linking.openURL(`tel:${resources.emergencyNumber}`)}
                >
                  <Text style={styles.emergencyNumber}>{resources.emergencyNumber}</Text>
                  <Text style={styles.emergencyAction}>Call Now</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Resources List */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text style={styles.sectionTitle}>
                Support Resources in {resources.localeName}
              </Text>

              {resources.resources.map((resource, index) => (
                <Animated.View
                  key={resource.name}
                  entering={FadeInDown.delay(400 + index * 100)}
                  style={styles.resourceCard}
                >
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Text style={styles.resourceDescription}>
                    {resource.description}
                  </Text>

                  {resource.available24x7 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>24/7 Available</Text>
                    </View>
                  )}

                  <View style={styles.resourceActions}>
                    {resource.phone && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCall(resource.phone!, resource)}
                      >
                        <Text style={styles.actionIcon}>📞</Text>
                        <Text style={styles.actionText}>Call {resource.phone}</Text>
                      </TouchableOpacity>
                    )}

                    {resource.textLine && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          handleText(resource.textLine!, resource.textKeyword, resource)
                        }
                      >
                        <Text style={styles.actionIcon}>💬</Text>
                        <Text style={styles.actionText}>
                          Text {resource.textLine}
                          {resource.textKeyword && ` (${resource.textKeyword})`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {resource.website && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleWebsite(resource.website!, resource)}
                      >
                        <Text style={styles.actionIcon}>🌐</Text>
                        <Text style={styles.actionText}>Visit Website</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Footer message */}
            <Animated.View
              entering={FadeInDown.delay(800)}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                These resources offer free, confidential support.
                {'\n'}You deserve help and you&apos;re brave for being here.
              </Text>
            </Animated.View>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>I understand</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: '85%',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2d5a3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 22,
  },
  emergencyCard: {
    backgroundColor: '#3d2020',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#5a2020',
  },
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  emergencyAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b9a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resourceCard: {
    backgroundColor: '#252540',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  resourceName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#8b8b9a',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d5a3d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6bff6b',
  },
  resourceActions: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#252540',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#8b8b9a',
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
