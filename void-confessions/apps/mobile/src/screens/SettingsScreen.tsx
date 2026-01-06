import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVoidStore, useSettingsStore } from '../store';
import { restorePurchases } from '../services';
import { useConfidantAI, useIsVoidWalkerPlus } from '../hooks';
import type { SettingsScreenProps } from '../navigation';

export function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<SettingsScreenProps['navigation']>();
  const isPremium = useVoidStore((state) => state.isPremium);

  // Settings
  const confidantEnabled = useSettingsStore((state) => state.confidantEnabled);
  const setConfidantEnabled = useSettingsStore((state) => state.setConfidantEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const screenshotBlockingEnabled = useSettingsStore((state) => state.screenshotBlockingEnabled);
  const setScreenshotBlockingEnabled = useSettingsStore((state) => state.setScreenshotBlockingEnabled);

  // Feature access
  const { hasAccess: hasConfidantAccess } = useConfidantAI();
  const isVoidWalkerPlus = useIsVoidWalkerPlus();

  const handleRestorePurchases = async () => {
    try {
      const result = await restorePurchases();
      if (result.success) {
        // Show success (implement alert or toast)
        console.log('Purchases restored successfully');
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
    }
  };

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
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Premium Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>

          {!isPremium ? (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => navigation.navigate('Premium')}
            >
              <Text style={styles.premiumBannerTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumBannerText}>
                Voice confessions, custom release styles, and more
              </Text>
              <Text style={styles.premiumBannerCTA}>Learn More →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Premium Status</Text>
              <Text style={styles.settingValue}>Active</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.settingLabel}>Restore Purchases</Text>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPERIENCE</Text>

          {/* Confidant Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingIcon}>🕯️</Text>
                <Text style={[
                  styles.settingLabel,
                  !hasConfidantAccess && styles.settingLabelDisabled
                ]}>
                  Confidant
                </Text>
                {!hasConfidantAccess && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingDescription}>
                {hasConfidantAccess
                  ? 'Receive compassionate reflection after release'
                  : 'Unlock with Void Walker subscription'}
              </Text>
            </View>
            <Switch
              value={confidantEnabled && hasConfidantAccess}
              onValueChange={setConfidantEnabled}
              disabled={!hasConfidantAccess}
              trackColor={{ false: '#3a3a4e', true: '#7c3aed' }}
              thumbColor={confidantEnabled && hasConfidantAccess ? '#ffffff' : '#8b8b9a'}
            />
          </View>

          {/* Sound Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingIcon}>🔊</Text>
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Text style={styles.settingDescription}>
                Ambient audio and interaction sounds
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#3a3a4e', true: '#7c3aed' }}
              thumbColor={soundEnabled ? '#ffffff' : '#8b8b9a'}
            />
          </View>

          {/* Haptics Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingIcon}>📳</Text>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
              </View>
              <Text style={styles.settingDescription}>
                Vibration responses to interactions
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#3a3a4e', true: '#7c3aed' }}
              thumbColor={hapticsEnabled ? '#ffffff' : '#8b8b9a'}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY</Text>

          {/* Screenshot Blocking */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingIcon}>🛡️</Text>
                <Text style={styles.settingLabel}>Screenshot Blocking</Text>
              </View>
              <Text style={styles.settingDescription}>
                Prevent screenshots of confessions
              </Text>
            </View>
            <Switch
              value={screenshotBlockingEnabled}
              onValueChange={setScreenshotBlockingEnabled}
              trackColor={{ false: '#3a3a4e', true: '#7c3aed' }}
              thumbColor={screenshotBlockingEnabled ? '#ffffff' : '#8b8b9a'}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openURL('https://voidconfessions.app/privacy')}
          >
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openURL('https://voidconfessions.app/terms')}
          >
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>0.1.0</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Your confessions are anonymous and ephemeral.{'\n'}
            They are automatically deleted after 5 minutes.{'\n'}
            We do not store any personal information.
          </Text>
        </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b6b7a',
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 8,
  },
  premiumBanner: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#7c3aed40',
  },
  premiumBannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  premiumBannerText: {
    fontSize: 14,
    color: '#8b8b9a',
    marginBottom: 12,
  },
  premiumBannerCTA: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
  settingLabelDisabled: {
    color: '#6b6b7a',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8b8b9a',
    marginLeft: 26,
  },
  settingValue: {
    fontSize: 16,
    color: '#8b8b9a',
  },
  settingChevron: {
    fontSize: 20,
    color: '#6b6b7a',
  },
  premiumBadge: {
    backgroundColor: '#7c3aed30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7c3aed',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6b6b7a',
    textAlign: 'center',
    lineHeight: 22,
  },
});
