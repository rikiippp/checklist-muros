import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Appbar, Button, FAB, Text } from 'react-native-paper';
import { Alert } from 'react-native';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { auth, db } from '../firebase';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, addDoc, getDoc, onSnapshot as onSnapshotUsers } from 'firebase/firestore';
import TaskItem from '../components/TaskItem';
import { COLOR_LABELS } from '../theme';
import { COMPANY_ID } from '../firebase/firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

type Task = {
  id: string;
  title: string;
  description?: string;
  color: string;
  done: boolean;
  companyId: string;
  assigneeUid?: string;
  createdBy?: string;
  colorLabel?: string;
  createdAt?: any;
  dueDate?: any;
};

export default function TaskListScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const user: User | null = auth.currentUser;
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [userMap, setUserMap] = useState<Record<string, { name?: string; email?: string }>>({});

  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
      return;
    }
    (async () => {
      const me = await getDoc(doc(db, 'users', user.uid));
      const r = (me.data() as any)?.role;
      if (r === 'admin') setUserRole('admin');
    })();
    const unsubUsers = onSnapshotUsers(query(collection(db, 'users'), where('companyId', '==', COMPANY_ID)), (qs) => {
      const m: Record<string, { name?: string; email?: string }> = {};
      qs.forEach((d) => { const v = d.data() as any; m[d.id] = { name: v.name, email: v.email }; });
      setUserMap(m);
    });
    const q = query(
      collection(db, 'tasks'),
      where('companyId', '==', COMPANY_ID),
      where('done', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: Task[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        // Si el doc tiene participants, filtra por el usuario actual; si no, muestra (compatibilidad)
        if (Array.isArray(data.participants)) {
          if (user && data.participants.includes(user.uid)) {
            items.push({ id: d.id, ...data });
          }
        } else {
          items.push({ id: d.id, ...data });
        }
      });
      setTasks(items);
    });
    return () => { unsub(); unsubUsers(); };
  }, [user, navigation]);

  const toggleDone = async (task: Task) => {
    await updateDoc(doc(db, 'tasks', task.id), { done: !task.done });
  };

  const removeTask = async (task: Task) => {
    const isCreator = user && task.createdBy === user.uid;
    const isForAll = (task as any).forAll === true;
    if (!isCreator && userRole !== 'admin') {
      Alert.alert('Sin permiso', 'Solo el creador o el administrador pueden eliminar la tarea');
      return;
    }
    if (isForAll && userRole !== 'admin') {
      Alert.alert('Protegida', 'Las tareas para todos solo puede eliminarlas el administrador');
      return;
    }
    await deleteDoc(doc(db, 'tasks', task.id));
  };

  const seedQuickTask = async () => {
    if (!user) return;
    await addDoc(collection(db, 'tasks'), {
      title: 'Tarea de ejemplo',
      description: 'Puedes editarla o borrarla',
      color: '#f07e0e',
      colorLabel: 'PRIORIDAD',
      done: false,
      companyId: COMPANY_ID,
      assigneeUid: user.uid,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const renderItem = ({ item }: { item: Task }) => (
    <TaskItem
      title={item.title}
      description={item.description}
      color={item.color}
      colorLabel={item.colorLabel || COLOR_LABELS[item.color]}
      done={item.done}
      createdAt={item.createdAt}
      dueDate={item.dueDate}
      assignedToLabel={(item as any).forAll ? 'Todos' : (item.assigneeUid ? (userMap[item.assigneeUid]?.name || userMap[item.assigneeUid]?.email || 'Asignado') : '')}
      canDelete={(userRole === 'admin') || (!!user && item.createdBy === user.uid && !(item as any).forAll) || undefined}
      onToggleDone={() => toggleDone(item)}
      onDelete={() => removeTask(item)}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title="Tareas" />
        <Appbar.Action icon="account-group" onPress={() => navigation.navigate('Team')} />
        <Appbar.Action icon="check-circle" onPress={() => navigation.navigate('CompletedTasks')} />
        <Appbar.Action icon="logout" onPress={() => auth.signOut().then(() => navigation.replace('Login'))} />
      </Appbar.Header>
      {tasks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ marginBottom: 12 }}>No hay tareas aún</Text>
          <Button mode="outlined" onPress={seedQuickTask}>Cargar ejemplo</Button>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }} onPress={() => navigation.navigate('TaskForm')} />
      {/* Logo centrado abajo - no interfiere con toques */}
      {/* @ts-ignore */}
      <Image
        source={require('../../assets/logo.png')}
        style={{ position: 'absolute', alignSelf: 'center', bottom: -10, width: 200, height: 200 }}
        resizeMode="contain"
      />
    </View>
  );
}


