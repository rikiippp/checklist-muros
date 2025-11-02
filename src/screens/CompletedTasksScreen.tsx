import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { auth, db } from '../firebase/index.ts';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where, getDoc, onSnapshot as onSnapshotUsers } from 'firebase/firestore';
import TaskItem from '../components/TaskItem.tsx';
import { COLOR_LABELS } from '../theme.ts';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'CompletedTasks'>;

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
};

export default function CompletedTasksScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const user = auth.currentUser;
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [userMap, setUserMap] = useState<Record<string, { name?: string; email?: string }>>({});

  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
      return;
    }
    (async () => {
      if (user) {
        const me = await getDoc(doc(db, 'users', user.uid));
        const r = (me.data() as any)?.role; if (r === 'admin') setUserRole('admin');
      }
    })();
    const unsubUsers = onSnapshotUsers(query(collection(db, 'users'), where('companyId', '==', COMPANY_ID)), (qs) => {
      const m: Record<string, { name?: string; email?: string }> = {};
      qs.forEach((d) => { const v = d.data() as any; m[d.id] = { name: v.name, email: v.email }; });
      setUserMap(m);
    });
    const q = query(
      collection(db, 'tasks'),
      where('companyId', '==', COMPANY_ID),
      where('done', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: Task[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (Array.isArray(data.participants)) {
          if (user && data.participants.includes(user.uid)) items.push({ id: d.id, ...data });
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
    if (!isCreator && userRole !== 'admin') return;
    if (isForAll && userRole !== 'admin') return;
    await deleteDoc(doc(db, 'tasks', task.id));
  };

  const renderItem = ({ item }: { item: Task }) => (
    <TaskItem
      title={item.title}
      description={item.description}
      color={item.color}
      colorLabel={item.colorLabel || COLOR_LABELS[item.color]}
      done={item.done}
      createdAt={item.createdAt}
      dueDate={(item as any).dueDate}
      assignedToLabel={(item as any).forAll ? 'Todos' : (item.assigneeUid ? (userMap[item.assigneeUid]?.name || userMap[item.assigneeUid]?.email || 'Asignado') : '')}
      canDelete={(userRole === 'admin') || (user && item.createdBy === (user as any).uid && !(item as any).forAll)}
      onToggleDone={() => toggleDone(item)}
      onDelete={() => removeTask(item)}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Completadas" />
      </Appbar.Header>
      {tasks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text>No hay tareas completadas aún</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

