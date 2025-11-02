import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Button, TextInput, Text, Dialog, Portal } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/index.ts';
import { doc, setDoc } from 'firebase/firestore';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';
import { SafeAreaView } from 'react-native-safe-area-context';


type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdAsAdmin, setCreatedAsAdmin] = useState(false);
  const ADMIN_CODE = 'MUROS2025'; // Código de administrador (puedes cambiarlo)

  const onRegister = async () => {
    setLoading(true);
    setError('');
    
    // Validar email y contraseña
    if (!email.trim() || !password.trim()) {
      setError('Email y contraseña son requeridos');
      setLoading(false);
      return;
    }
    
    // Determinar el rol: SIEMPRE requiere código para ser admin
    let userRole = 'user';
    let willBeAdmin = false;
    
    if (adminCode.trim() === ADMIN_CODE) {
      // Si se ingresó el código correcto, crear como admin
      userRole = 'admin';
      willBeAdmin = true;
    } else if (adminCode.trim() !== '') {
      // Si ingresó un código pero es incorrecto
      setError('Código de administrador incorrecto. Tu cuenta se creará como usuario normal.');
      setLoading(false);
      return;
    }
    // Si no ingresó código, userRole queda como 'user' y willBeAdmin como false
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        name: name.trim() || '',
        companyId: COMPANY_ID,
        role: userRole,
        createdAt: new Date().toISOString(),
      });
      
      // Cerrar sesión para que el usuario entre con sus credenciales
      await auth.signOut();
      
      // Mostrar modal de éxito
      setShowSuccessDialog(true);
      setLoading(false);
      
      // Guardar el rol para mostrarlo en el modal
      setCreatedAsAdmin(willBeAdmin);
      
      // Esperar antes de redirigir al login
      setTimeout(() => {
        setShowSuccessDialog(false);
        setCreatedAsAdmin(false);
        navigation.replace('Login');
      }, 3500);
      
      // Retornar para evitar que el catch se ejecute
      return;
    } catch (e: any) {
      setError(e?.message || 'Error al crear cuenta');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', marginTop: -65 }}>
      {/* Logo en register - mismo tamaño que login */}
      {/* @ts-ignore */}
      <Image source={require('../../assets/favIcon.png')} style={{ width: 300, height: 300, alignSelf: 'center', marginTop: -80 }} resizeMode="contain" />
      <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center', marginTop: -30 }}>Crea una cuenta</Text>
      <TextInput label="Nombre" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      {!!error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: 12 }} />
      <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 12 }} />
      
      {/* Campo de código admin - siempre visible */}
      <TextInput
        label="Código de administrador (opcional)"
        value={adminCode}
        onChangeText={setAdminCode}
        secureTextEntry
        style={{ marginBottom: 8 }}
        placeholder="Ingresa el código para crear como administrador"
      />
      <Text variant="bodySmall" style={{ color: '#666', marginBottom: 12, fontStyle: 'italic' }}>
        Si tienes el código de administrador, ingresalo aquí para crear tu cuenta con permisos de admin.
      </Text>
      
      {/* Mensaje informativo sobre el rol */}
    {/*}  <View style={{ 
        backgroundColor: adminCode.trim() === ADMIN_CODE ? '#e8f5e9' : '#fff3e0', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 12 
      }}>
        <Text variant="bodySmall" style={{ 
          color: adminCode.trim() === ADMIN_CODE ? '#2e7d32' : '#e65100', 
          textAlign: 'center' 
        }}>
          {adminCode.trim() === ADMIN_CODE 
            ? '✅ Código correcto - Tu cuenta será creada como Administrador'
            : 'ℹ️ Tu cuenta se creará como Usuario normal (sin permisos de administrador)'
          }
        </Text>
      </View>*/}
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
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 12 }}>
              Serás redirigido al inicio de sesión para que puedas ingresar con tus credenciales.
            </Text>
            {createdAsAdmin && (
              <View style={{ backgroundColor: '#fff3e0', padding: 12, borderRadius: 8, marginTop: 8 }}>
                <Text variant="bodySmall" style={{ color: '#e65100', textAlign: 'center', fontWeight: '600' }}>
                  ✅ Tu cuenta fue creada como Administrador
                </Text>
              </View>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
    </SafeAreaView>
  );
}


