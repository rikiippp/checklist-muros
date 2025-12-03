import React, { useState } from 'react';
import { View, Image, Alert } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/index.ts';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este correo electrónico.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      case 'auth/invalid-credential':
        return 'El correo electrónico o la contraseña son incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está en uso.';
      default:
        return 'Error al iniciar sesión. Verifica tus datos e intenta de nuevo.';
    }
  };

  const onLogin = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Tasks');
    } catch (e: any) {
      const errorCode = e?.code || '';
      const errorMessage = getErrorMessage(errorCode);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Correo requerido',
        'Por favor ingresa tu correo electrónico para restablecer tu contraseña.'
      );
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        'Correo inválido',
        'Por favor ingresa un correo electrónico válido.'
      );
      return;
    }

    setResetPasswordLoading(true);
    try {
      // Usar ActionCodeSettings para personalizar la URL de redirección
      await sendPasswordResetEmail(auth, email.trim(), {
        url: 'https://muros-checklist.firebaseapp.com/__/auth/action',
        handleCodeInApp: false, // Abre en navegador, no en la app
      });
      Alert.alert(
        'Correo enviado',
        'Se ha enviado un correo electrónico para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam si no lo encuentras).',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      const errorCode = e?.code || '';
      let errorMessage = 'No se pudo enviar el correo de restablecimiento.';
      
      switch (errorCode) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo electrónico.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
          break;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', marginTop: -65 }}>
        {/* Logo en login (archivo en assets/logo.png) */}
        {/* @ts-ignore */}
        <Image source={require('../../assets/favIcon.png')} style={{ width: 300, height: 300, alignSelf: 'center', marginTop: -80 }} resizeMode="contain" />
        <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>Bienvenido a MUROS</Text>
        {!!error && (
          <Text 
            style={{ 
              color: '#d32f2f', 
              marginBottom: 12, 
              padding: 12, 
              backgroundColor: '#ffebee', 
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            {error}
          </Text>
        )}
        <TextInput 
          label="Email" 
          value={email} 
          onChangeText={(text) => {
            setEmail(text);
            setError(''); // Limpiar error al escribir
          }} 
          autoCapitalize="none" 
          keyboardType="email-address" 
          style={{ marginBottom: 12 }}
          error={!!error && error.includes('correo')}
        />
        <TextInput 
          label="Contraseña" 
          value={password} 
          onChangeText={(text) => {
            setPassword(text);
            setError(''); // Limpiar error al escribir
          }} 
          secureTextEntry={!showPassword}
          style={{ marginBottom: 12 }}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          error={!!error && error.includes('contraseña')}
        />
        <Button 
          mode="text" 
          onPress={handleForgotPassword} 
          loading={resetPasswordLoading}
          disabled={resetPasswordLoading || loading}
          style={{ marginBottom: 8, alignSelf: 'flex-end' }}
        >
          ¿Olvidaste tu contraseña?
        </Button>
        <Button 
          mode="contained" 
          onPress={onLogin} 
          loading={loading} 
          disabled={loading || resetPasswordLoading}
          style={{ marginBottom: 8 }}
        >
          Iniciar sesión
        </Button>
        <Button 
          onPress={() => navigation.navigate('Register')} 
          disabled={loading || resetPasswordLoading}
        >
          Crear cuenta
        </Button>
      </View>
    </SafeAreaView>
  );
}


