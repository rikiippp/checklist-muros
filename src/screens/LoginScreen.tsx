import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/index.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Tasks');
    } catch (e: any) {
      setError(e?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      {/* Logo en login (archivo en assets/logo.png) */}
      {/* @ts-ignore */}
      <Image source={require('../../assets/logo.png')} style={{ width: 160, height: 160, alignSelf: 'center', marginBottom: 12 }} resizeMode="contain" />
      <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>Bienvenido</Text>
      {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: 12 }} />
      <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading}>
        Iniciar sesión
      </Button>
      <Button onPress={() => navigation.navigate('Register')} style={{ marginTop: 8 }}>
        Crear cuenta
      </Button>
    </View>
  );
}


