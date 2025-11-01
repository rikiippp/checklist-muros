import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Appbar, Button, FAB, Text } from 'react-native-paper';
import { Alert } from 'react-native';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { auth, db } from '../firebase';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, addDoc, getDoc, onSnapshot as onSnapshotUsers } from 'firebase/firestore';
import TaskItem from '../components/TaskItem';
import { COLOR_LABELS, BRAND_COLORS } from '../theme';
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
  const [userName, setUserName] = useState<string>('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
      return;
    }
    (async () => {
      const me = await getDoc(doc(db, 'users', user.uid));
      const userData = me.data() as any;
      if (userData?.role === 'admin') setUserRole('admin');
      if (userData?.name) setUserName(userData.name);
      else if (userData?.email) setUserName(userData.email.split('@')[0]);
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
    
    // Si hay una tarea siendo completada, mantenerla en la lista hasta que termine el delay
    // (esto se maneja en el estado completingTaskId y en renderItem)
    return () => { unsub(); unsubUsers(); };
  }, [user, navigation]);

  const toggleDone = async (task: Task) => {
    // Si se está marcando como completada, agregar delay antes de actualizar
    if (!task.done) {
      setCompletingTaskId(task.id);
      setCompletingTask({ ...task, done: true }); // Mantener una copia local
      // Esperar 2 segundos antes de actualizar para que se vea la animación
      setTimeout(async () => {
        await updateDoc(doc(db, 'tasks', task.id), { done: true });
        setCompletingTaskId(null);
        setCompletingTask(null);
      }, 2000);
    } else {
      await updateDoc(doc(db, 'tasks', task.id), { done: false });
    }
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

  // Incluir tareas que están siendo completadas aunque ya no estén en la query
  const tasksToRender = useMemo(() => {
    if (!completingTask) return tasks;
    // Si la tarea que se está completando ya no está en la lista (porque la query la filtró),
    // agregarla al principio para mantenerla visible durante el delay
    const existsInTasks = tasks.some(t => t.id === completingTask.id);
    if (!existsInTasks) {
      return [completingTask, ...tasks];
    }
    return tasks;
  }, [tasks, completingTask]);

  const renderItem = ({ item }: { item: Task }) => (
    <TaskItem
      title={item.title}
      description={item.description}
      color={item.color}
      colorLabel={item.colorLabel || COLOR_LABELS[item.color]}
      done={item.done || completingTaskId === item.id}
      createdAt={item.createdAt}
      dueDate={item.dueDate}
      assignedToLabel={(item as any).forAll ? 'Todos' : (item.assigneeUid ? (userMap[item.assigneeUid]?.name || userMap[item.assigneeUid]?.email || 'Asignado') : '')}
      canDelete={(userRole === 'admin') || (!!user && item.createdBy === user.uid && !(item as any).forAll) || undefined}
      onToggleDone={() => toggleDone(item)}
      onDelete={() => removeTask(item)}
    />
  );

  // Obtener saludo con emoji y texto según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      return { emoji: '🌃', message: 'Ya es muy tarde, anda a dormir por favor 😴' };
    }
    if (hour >= 5 && hour < 8) {
      return { emoji: '🌅', message: 'Madrugador! A darle con todo 💪' };
    }
    if (hour >= 8 && hour < 12) {
      return { emoji: '☀️', message: 'Buenos días! A organizar el día 🚀' };
    }
    if (hour >= 12 && hour < 14) {
      return { emoji: '🌤️', message: 'Hora de comer! Después seguimos 🍽️' };
    }
    if (hour >= 14 && hour < 18) {
      return { emoji: '☀️', message: 'Tarde productiva! Vamos que se puede 💼' };
    }
    if (hour >= 18 && hour < 22) {
      return { emoji: '🌙', message: 'Casi terminamos el día! Últimos esfuerzos ⭐' };
    }
    return { emoji: '🌃', message: 'Ya es tarde, anda a dormir por favor 😴' };
  };

  const greeting = getGreeting();

  return (
    <View style={{ flex: 1 }}>
      {/* Saludo con nombre del usuario - ARRIBA del navbar */}
      {userName && (
        <View style={styles.greetingContainer}>
          <Text variant="titleLarge" style={styles.greetingText}>
            Hola {userName}! {greeting.emoji}
          </Text>
          <Text variant="bodyMedium" style={styles.greetingMessage}>
            {greeting.message}
          </Text>
        </View>
      )}
      <Appbar.Header>
        <Appbar.Content title="Tareas" />
        <IconButtonWithFeedback 
          icon="account-group" 
          onPress={() => navigation.navigate('Team')} 
        />
        <IconButtonWithFeedback 
          icon="check-circle" 
          onPress={() => navigation.navigate('CompletedTasks')} 
        />
        <IconButtonWithFeedback 
          icon="logout" 
          onPress={() => auth.signOut().then(() => navigation.replace('Login'))} 
        />
      </Appbar.Header>
      {tasks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ marginBottom: 12 }}>No hay tareas aún</Text>
          <Button mode="outlined" onPress={seedQuickTask}>Cargar ejemplo</Button>
        </View>
      ) : (
        <FlatList
          data={tasksToRender}
          keyExtractor={(t: Task) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
      <FAB 
        icon="plus" 
        style={{ position: 'absolute', right: 16, bottom: 16 }} 
        onPress={() => navigation.navigate('TaskForm')}
        color="#FFFFFF"
      />
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

// Componente para botones con efecto hover/press en naranja
function IconButtonWithFeedback({ icon, onPress }: { icon: string; onPress: () => void }) {
  const [pressed, setPressed] = React.useState(false);
  
  return (
    <TouchableOpacity
      onPressIn={() => setPressed(true)}
      onPressOut={() => {
        setPressed(false);
        onPress();
      }}
      style={[
        styles.iconButton,
        pressed && styles.iconButtonPressed
      ]}
      activeOpacity={0.7}
    >
      <Appbar.Action icon={icon} color={pressed ? BRAND_COLORS.primary : undefined} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  greetingContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greetingText: {
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  greetingMessage: {
    color: '#666666',
    fontStyle: 'italic',
  },
  iconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconButtonPressed: {
    backgroundColor: BRAND_COLORS.primary + '20', // 20% opacity
  },
});


