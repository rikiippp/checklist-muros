import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Appbar, List, Text, Dialog, Portal, RadioButton, Button } from 'react-native-paper';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { auth, db } from '../firebase/index.ts';
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Team'>;

type Member = {
  uid: string;
  email: string;
  name?: string;
  role?: string;
};

export default function TeamScreen({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [manageRolesMode, setManageRolesMode] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('Login');
      return;
    }
    // Traer mi rol para habilitar edición - misma lógica que TaskListScreen
    (async () => {
      try {
        const me = await getDoc(doc(db, 'users', user.uid));
        const userData = me.data() as any;
        const myRole = userData?.role;
        // Debug: log para ver qué valor tiene
        console.log('TeamScreen - Rol del usuario:', myRole, 'Es admin?', myRole === 'admin');
        setIsAdmin(myRole === 'admin');
      } catch (error) {
        console.error('Error al verificar rol:', error);
        setIsAdmin(false);
      }
    })();
    
    const q = query(collection(db, 'users'), where('companyId', '==', COMPANY_ID));
    const unsub = onSnapshot(q, (snap) => {
      const membersData = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'user'
        } as Member;
      });
      setMembers(membersData);
      
      // Verificar rol desde la lista de miembros (backup)
      const currentMember = membersData.find(m => m.uid === user.uid);
      if (currentMember) {
        const currentRole = currentMember.role;
        console.log('TeamScreen - Rol desde miembros:', currentRole, 'Es admin?', currentRole === 'admin');
        if (currentRole === 'admin') {
          setIsAdmin(true);
        }
      }
    });
    return () => unsub();
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Mi equipo" />
      </Appbar.Header>
      {members.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>No hay miembros aún</Text>
        </View>
      ) : (
        <>
        <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
          {isAdmin ? (
            <>
              <Button
                mode={manageRolesMode ? "contained" : "outlined"}
                onPress={() => setManageRolesMode(!manageRolesMode)}
                icon={manageRolesMode ? "check-circle" : "account-edit"}
              >
                {manageRolesMode ? 'Finalizar gestión de roles' : 'Gestionar roles del equipo'}
              </Button>
              {manageRolesMode && (
                <Text variant="bodySmall" style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>
                  Toca en un miembro para cambiar su rol
                </Text>
              )}
            </>
          ) : (
            <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666' }}>
              Solo los administradores pueden gestionar roles
            </Text>
          )}
        </View>
        <FlatList
          data={members}
          keyExtractor={(m: Member) => m.uid}
          renderItem={({ item }: { item: Member }) => {
            const isCurrentUser = auth.currentUser && auth.currentUser.uid === item.uid;
            const canEdit = isAdmin && manageRolesMode && !isCurrentUser;
            
            return (
              <List.Item
                title={item.name || item.email}
                description={item.role === 'admin' ? 'administrador' : 'usuario'}
                left={() => (
                  // @ts-ignore
                  <Image source={require('../../assets/logo.png')} style={{ width: 22, height: 22, marginHorizontal: 12 }} resizeMode="contain" />
                )}
                onPress={() => {
                  if (!canEdit) {
                    if (isAdmin && manageRolesMode && isCurrentUser) {
                      // Mostrar mensaje que no puede cambiar su propio rol
                      return;
                    }
                    return;
                  }
                  setSelectedMember(item);
                  setSelectedRole((item.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user');
                  setRoleDialogOpen(true);
                }}
                style={{
                  backgroundColor: canEdit ? '#fff3e0' : 'transparent',
                  opacity: canEdit ? 1 : (isAdmin && manageRolesMode && isCurrentUser ? 0.5 : 1)
                }}
              />
            );
          }}
        />
        <Portal>
          <Dialog visible={roleDialogOpen} onDismiss={() => setRoleDialogOpen(false)}>
            <Dialog.Title>Cambiar rol de miembro</Dialog.Title>
            <Dialog.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                {selectedMember?.name || selectedMember?.email}
              </Text>
              <Text variant="bodySmall" style={{ marginBottom: 12, color: '#666' }}>
                Rol actual: <Text style={{ fontWeight: 'bold' }}>{selectedMember?.role === 'admin' ? 'Administrador' : 'Usuario'}</Text>
              </Text>
              <RadioButton.Group onValueChange={(v) => setSelectedRole(v as 'admin' | 'user')} value={selectedRole}>
                <RadioButton.Item label="Administrador" value="admin" />
                <RadioButton.Item label="Usuario" value="user" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                setRoleDialogOpen(false);
                setSelectedMember(null);
              }}>Cancelar</Button>
              <Button 
                mode="contained"
                onPress={async () => {
                  if (selectedMember && selectedMember.role !== selectedRole) {
                    try {
                      await updateDoc(doc(db, 'users', selectedMember.uid), { role: selectedRole });
                      // Mostrar confirmación breve
                    } catch (error) {
                      console.error('Error al actualizar rol:', error);
                    }
                  }
                  setRoleDialogOpen(false);
                  setSelectedMember(null);
                }}
              >
                Guardar cambios
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        </>
      )}
    </View>
  );
}


