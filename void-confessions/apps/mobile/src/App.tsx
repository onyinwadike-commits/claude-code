import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './navigation';
import { initializePurchases, connectSocket, disconnectSocket } from './services';
import { useVoidStore } from './store';

// Generate anonymous session hash
function generateSessionHash(): string {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 32; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

function App(): React.JSX.Element {
  const setSessionHash = useVoidStore((state) => state.setSessionHash);

  useEffect(() => {
    // Initialize services
    const init = async () => {
      // Generate anonymous session hash
      setSessionHash(generateSessionHash());

      // Initialize RevenueCat
      await initializePurchases();

      // Connect WebSocket
      connectSocket();
    };

    init();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: '#7c3aed',
              background: '#0a0a0a',
              card: '#1a1a2e',
              text: '#ffffff',
              border: '#2a2a3e',
              notification: '#7c3aed',
            },
          }}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />
          <View style={styles.container}>
            <RootNavigator />
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

export default App;
