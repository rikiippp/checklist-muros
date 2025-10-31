import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation';
import { theme } from './src/theme';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setReady(true));
    return () => unsub();
  }, []);

  if (!ready) return null;

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
