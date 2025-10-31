import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { COMPANY_ID } from '../firebase/firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        name: name.trim() || '',
        companyId: COMPANY_ID,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      navigation.replace('Tasks');
    } catch (e: any) {
      setError(e?.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      {/* @ts-ignore */}
      <Image source={require('../../assets/logo.png')} style={{ width: 140, height: 140, alignSelf: 'center', marginBottom: 12 }} resizeMode="contain" />
      <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>Crear cuenta</Text>
      <TextInput label="Nombre" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: 12 }} />
      <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onRegister} loading={loading} disabled={loading}>
        Registrarme
      </Button>
    </View>
  );
}


