import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Appbar, List, Text, Dialog, Portal, RadioButton, Button } from 'react-native-paper';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { COMPANY_ID } from '../firebase/firebaseConfig';

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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('Login');
      return;
    }
    // Traer mi rol para habilitar edición
    (async () => {
      const me = await getDoc(doc(db, 'users', user.uid));
      const myRole = (me.data() as any)?.role;
      setIsAdmin(myRole === 'admin');
    })();
    const q = query(collection(db, 'users'), where('companyId', '==', COMPANY_ID));
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map((d) => d.data() as Member));
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
        <FlatList
          data={members}
          keyExtractor={(m) => m.uid}
          renderItem={({ item }) => (
            <List.Item
              title={item.name || item.email}
              description={item.role === 'admin' ? 'administrador' : 'usuario'}
              left={() => (
                // @ts-ignore
                <Image source={require('../../assets/logo.png')} style={{ width: 22, height: 22, marginHorizontal: 12 }} resizeMode="contain" />
              )}
              onPress={() => {
                if (!isAdmin) return;
                // No permitir auto-downgrade para evitar perder admin sin querer
                if (auth.currentUser && auth.currentUser.uid === item.uid) return;
                setSelectedMember(item);
                setSelectedRole(item.role === 'admin' ? 'admin' : 'user');
                setRoleDialogOpen(true);
              }}
            />
          )}
        />
        <Portal>
          <Dialog visible={roleDialogOpen} onDismiss={() => setRoleDialogOpen(false)}>
            <Dialog.Title>Asignar rol</Dialog.Title>
            <Dialog.Content>
              <Text>{selectedMember?.name || selectedMember?.email}</Text>
              <RadioButton.Group onValueChange={(v) => setSelectedRole(v as any)} value={selectedRole}>
                <RadioButton.Item label="Administrador" value="admin" />
                <RadioButton.Item label="Usuario" value="user" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setRoleDialogOpen(false)}>Cancelar</Button>
              <Button onPress={async () => {
                if (selectedMember) {
                  await updateDoc(doc(db, 'users', selectedMember.uid), { role: selectedRole });
                }
                setRoleDialogOpen(false);
              }}>Guardar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        </>
      )}
    </View>
  );
}


