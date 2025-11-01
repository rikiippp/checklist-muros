import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Button, TextInput, Text, Dialog, Portal } from 'react-native-paper';
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      
      // Cerrar sesión para que el usuario entre con sus credenciales
      await auth.signOut();
      
      // Mostrar modal de éxito
      setShowSuccessDialog(true);
      setLoading(false);
      
      // Esperar 2.5 segundos antes de redirigir al login
      setTimeout(() => {
        setShowSuccessDialog(false);
        navigation.replace('Login');
      }, 4500);
    } catch (e: any) {
      setError(e?.message || 'Error al crear cuenta');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      {/* Logo en register - mismo tamaño que login */}
      {/* @ts-ignore */}
      <Image source={require('../../assets/logo.png')} style={{ width: 160, height: 160, alignSelf: 'center', marginBottom: 12 }} resizeMode="contain" />
      <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>Crear cuenta</Text>
      <TextInput label="Nombre" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: 12 }} />
      <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onRegister} loading={loading} disabled={loading}>
        Registrarme
      </Button>
      <Button onPress={() => navigation.navigate('Login')} style={{ marginTop: 8 }}>
        Ya tengo cuenta - Iniciar sesión
      </Button>
      
      {/* Modal de éxito */}
      <Portal>
        <Dialog visible={showSuccessDialog} dismissable={false}>
          <Dialog.Icon icon="check-circle" size={64} color="#4caf50" />
          <Dialog.Title style={{ textAlign: 'center' }}>¡Cuenta creada exitosamente!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión para que puedas ingresar con tus credenciales.
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}


