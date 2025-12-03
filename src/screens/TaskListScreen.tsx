import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Button, FAB, Text, Chip, Menu, Portal, Dialog } from 'react-native-paper';
import { Alert } from 'react-native';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { auth, db, storage } from '../firebase/index.ts';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, addDoc, getDoc, onSnapshot as onSnapshotUsers, Timestamp, arrayUnion } from 'firebase/firestore';
import TaskItem from '../components/TaskItem.tsx';
import { COLOR_LABELS, BRAND_COLORS, COLOR_OPTIONS } from '../theme.ts';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';
import { scheduleNotificationsForTask } from '../services/taskNotifications.ts';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  // Filtros
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterTime, setFilterTime] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Adjuntos requeridos
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{ uri: string; name: string; size?: number; mimeType?: string } | null>(null);

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
    const unsub = onSnapshot(q, async (snap) => {
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

      // Programar notificaciones para todas las tareas pendientes con fecha límite
      // (solo para las tareas que el usuario puede ver)
      for (const task of items) {
        if (!task.done && task.dueDate) {
          try {
            await scheduleNotificationsForTask(task.id, task.title, task.dueDate, false);
          } catch (error) {
            // Silenciar errores de notificaciones, no bloquear el flujo
            if (__DEV__) {
              console.warn(`Error al programar notificaciones para tarea ${task.id}:`, error);
            }
          }
        }
      }
    });

    // Si hay una tarea siendo completada, mantenerla en la lista hasta que termine el delay
    // (esto se maneja en el estado completingTaskId y en renderItem)
    return () => { unsub(); unsubUsers(); };
  }, [user, navigation]);

  const toggleDone = async (task: Task) => {
    // Si la tarea requiere adjunto y aún no tiene, abrir modal de adjuntos
    const requiresAttachment = (task as any).requiresAttachment === true;
    const attachments = (task as any).attachments as any[] | undefined;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!task.done && requiresAttachment && !hasAttachments) {
      setAttachmentTask(task);
      setSelectedAttachment(null);
      setAttachmentError(null);
      return;
    }

    // Si se está marcando como completada, agregar delay antes de actualizar
    if (!task.done) {
      setCompletingTaskId(task.id);
      setCompletingTask({ ...task, done: true }); // Mantener una copia local
      // Esperar 2 segundos antes de actualizar para que se vea la animación
      setTimeout(async () => {
        await updateDoc(doc(db, 'tasks', task.id), { done: true });
        // Cancelar notificaciones cuando la tarea se marca como completada
        try {
          await scheduleNotificationsForTask(task.id, task.title, task.dueDate, true);
        } catch (error) {
          console.warn('Error al cancelar notificaciones:', error);
        }
        setCompletingTaskId(null);
        setCompletingTask(null);
      }, 2000);
    } else {
      await updateDoc(doc(db, 'tasks', task.id), { done: false });
      // Reprogramar notificaciones si la tarea se desmarca y tiene fecha límite
      try {
        await scheduleNotificationsForTask(task.id, task.title, task.dueDate, false);
      } catch (error) {
        console.warn('Error al reprogramar notificaciones:', error);
      }
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

  // Aplicar filtros a las tareas
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filtro por prioridad (color)
    if (filterPriority) {
      filtered = filtered.filter(task => task.color === filterPriority);
    }

    // Filtro por persona
    if (filterPerson) {
      filtered = filtered.filter(task => {
        if (filterPerson === 'all') {
          return (task as any).forAll === true;
        }
        return task.assigneeUid === filterPerson || 
               (Array.isArray((task as any).participants) && (task as any).participants.includes(filterPerson));
      });
    }

    // Filtro por tiempo
    if (filterTime !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(task => {
        if (!task.dueDate) {
          return filterTime === 'upcoming'; // Tareas sin fecha se consideran "próximas"
        }
        
        const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate.seconds * 1000);
        const dueDay = new Date(dueDate);
        dueDay.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.ceil((dueDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filterTime) {
          case 'overdue':
            return daysDiff < 0;
          case 'today':
            return daysDiff === 0;
          case 'upcoming':
            return daysDiff > 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [tasks, filterPriority, filterPerson, filterTime]);

  // Incluir tareas que están siendo completadas aunque ya no estén en la query
  const tasksToRender = useMemo(() => {
    const baseTasks = filteredTasks;
    if (!completingTask) return baseTasks;
    // Si la tarea que se está completando ya no está en la lista (porque la query la filtró),
    // agregarla al principio para mantenerla visible durante el delay
    const existsInTasks = baseTasks.some(t => t.id === completingTask.id);
    if (!existsInTasks) {
      return [completingTask, ...baseTasks];
    }
    return baseTasks;
  }, [filteredTasks, completingTask]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFilterPriority(null);
    setFilterPerson(null);
    setFilterTime('all');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = filterPriority !== null || filterPerson !== null || filterTime !== 'all';

  const handlePickAttachment = async () => {
    try {
      setAttachmentError(null);
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const size = file.size ?? 0;
      const maxBytes = 20 * 1024 * 1024; // 20MB
      if (size > maxBytes) {
        setAttachmentError('El archivo supera el máximo de 20MB. Por favor, elige uno más liviano.');
        return;
      }
      setSelectedAttachment({
        uri: file.uri,
        name: file.name ?? 'archivo',
        size,
        mimeType: file.mimeType,
      });
    } catch (error) {
      setAttachmentError('No se pudo seleccionar el archivo. Intenta de nuevo.');
    }
  };

  const handleUploadAttachmentAndComplete = async () => {
    if (!attachmentTask || !selectedAttachment) {
      setAttachmentError('Primero selecciona un archivo para adjuntar.');
      return;
    }
    if (!user) {
      setAttachmentError('Debes iniciar sesión para adjuntar archivos.');
      return;
    }
    try {
      setAttachmentUploading(true);
      setAttachmentError(null);

      const response = await fetch(selectedAttachment.uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `tasks/${attachmentTask.id}/${Date.now()}-${selectedAttachment.name}`);
      await uploadBytes(storageRef, blob, {
        contentType: selectedAttachment.mimeType,
      });
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'tasks', attachmentTask.id), {
        attachments: arrayUnion({
          name: selectedAttachment.name,
          url,
          size: selectedAttachment.size ?? null,
          uploadedBy: user.uid,
          uploadedAt: serverTimestamp(),
        }),
      });

      const t = attachmentTask;
      setAttachmentTask(null);
      setSelectedAttachment(null);

      // Ahora sí completar la tarea (ya tiene adjunto)
      await toggleDone(t);
    } catch (error) {
      setAttachmentError('Error al subir el archivo. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setAttachmentUploading(false);
    }
  };

  const openAttachmentModal = (task: Task) => {
    setAttachmentTask(task);
    setSelectedAttachment(null);
    setAttachmentError(null);
  };

  const renderItem = ({ item }: { item: Task }) => {
    const requiresAttachment = (item as any).requiresAttachment === true;
    const attachments = (item as any).attachments as any[] | undefined;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    return (
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
        requiresAttachment={requiresAttachment}
        hasAttachments={hasAttachments}
        onAttachPress={requiresAttachment ? () => openAttachmentModal(item) : undefined}
        onToggleDone={() => toggleDone(item)}
        onDelete={() => removeTask(item)}
      />
    );
  };

  // Obtener saludo con emoji y texto según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      return { emoji: '👋', message: 'Anda a dormir 😴' };
    }
    if (hour >= 5 && hour < 8) {
      return { emoji: '👋', message: 'Madrugador! Metele ganas 💪' };
    }
    if (hour >= 8 && hour < 12) {
      return { emoji: '👋', message: 'Buenos días! A organizar el día 🚀' };
    }
    if (hour >= 12 && hour < 14) {
      return { emoji: '👋', message: 'Hora de comer! Después seguimos 🍽️' };
    }
    if (hour >= 14 && hour < 18) {
      return { emoji: '👋', message: 'Hace tu tarde productiva! 💼' };
    }
    if (hour >= 18 && hour < 22) {
      return { emoji: '👋', message: 'Casi terminamos el día! ⭐' };
    }
    return { emoji: '👋', message: 'Ya es tarde, anda a dormir 😴' };
  };

  const greeting = getGreeting();

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
        <Appbar.Header >
          <Appbar.Content title="Tareas" />
          <IconButtonWithFeedback
            icon="filter"
            onPress={() => setShowFilterMenu(true)}
          />
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
        
        {/* Barra de filtros */}
        {hasActiveFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {filterPriority && (
                <Chip
                  icon="close"
                  onClose={() => setFilterPriority(null)}
                  style={styles.filterChip}
                >
                  {COLOR_OPTIONS.find(c => c.color === filterPriority)?.label || 'Prioridad'}
                </Chip>
              )}
              {filterPerson && (
                <Chip
                  icon="close"
                  onClose={() => setFilterPerson(null)}
                  style={styles.filterChip}
                >
                  {filterPerson === 'all' ? 'Todos' : (userMap[filterPerson]?.name || userMap[filterPerson]?.email || 'Persona')}
                </Chip>
              )}
              {filterTime !== 'all' && (
                <Chip
                  icon="close"
                  onClose={() => setFilterTime('all')}
                  style={styles.filterChip}
                >
                  {filterTime === 'overdue' ? 'Vencidas' : filterTime === 'today' ? 'Hoy' : 'Próximas'}
                </Chip>
              )}
              <Button mode="text" onPress={clearFilters} compact>
                Limpiar
              </Button>
            </ScrollView>
          </View>
        )}

        {/* Modales */}
        <Portal>
          {/* Modal de filtros */}
          <Dialog visible={showFilterMenu} onDismiss={() => setShowFilterMenu(false)}>
            <Dialog.Title>Filtrar tareas</Dialog.Title>
            <Dialog.Content>
              <Text variant="titleMedium" style={{ marginBottom: 8, marginTop: 8 }}>Por prioridad</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {COLOR_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.color}
                    selected={filterPriority === opt.color}
                    onPress={() => setFilterPriority(filterPriority === opt.color ? null : opt.color)}
                    style={{ marginRight: 8, marginBottom: 8, backgroundColor: filterPriority === opt.color ? opt.color : undefined }}
                    textStyle={{ color: filterPriority === opt.color ? 'white' : undefined }}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={{ marginBottom: 8 }}>Por persona</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <Chip
                  selected={filterPerson === 'all'}
                  onPress={() => setFilterPerson(filterPerson === 'all' ? null : 'all')}
                  style={styles.filterChip}
                >
                  Todos
                </Chip>
                {Object.entries(userMap).map(([uid, userData]) => (
                  <Chip
                    key={uid}
                    selected={filterPerson === uid}
                    onPress={() => setFilterPerson(filterPerson === uid ? null : uid)}
                    style={styles.filterChip}
                  >
                    {userData.name || userData.email}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={{ marginBottom: 8 }}>Por tiempo</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'overdue', label: 'Vencidas' },
                  { value: 'today', label: 'Hoy' },
                  { value: 'upcoming', label: 'Próximas' },
                ].map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={filterTime === opt.value}
                    onPress={() => setFilterTime(opt.value as any)}
                    style={styles.filterChip}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowFilterMenu(false)}>Cerrar</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Modal de adjuntar archivo cuando es obligatorio */}
          <Dialog visible={!!attachmentTask} onDismiss={() => setAttachmentTask(null)}>
            <Dialog.Title>Adjuntar archivo</Dialog.Title>
            <Dialog.Content>
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                {(attachmentTask as any)?.title || 'Tarea'}
              </Text>
              <Text variant="bodySmall" style={{ marginBottom: 12, color: '#666' }}>
                Esta tarea requiere al menos un archivo adjunto para poder marcarse como completada.
              </Text>

              <Button
                mode="outlined"
                onPress={handlePickAttachment}
                disabled={attachmentUploading}
                style={{ marginBottom: 8 }}
              >
                Elegir archivo
              </Button>

              {selectedAttachment && (
                <Text variant="bodySmall" style={{ marginBottom: 4 }}>
                  Seleccionado: {selectedAttachment.name}
                </Text>
              )}

              {attachmentError && (
                <Text variant="bodySmall" style={{ color: '#d32f2f', marginTop: 4 }}>
                  {attachmentError}
                </Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAttachmentTask(null)} disabled={attachmentUploading}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleUploadAttachmentAndComplete}
                loading={attachmentUploading}
                disabled={attachmentUploading || !selectedAttachment}
              >
                Adjuntar y completar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {tasks.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Text style={{ marginBottom: 12 }}>No hay tareas aún</Text>
            <Button mode="outlined" onPress={seedQuickTask}>Cargar ejemplo</Button>
          </View>
        ) : tasksToRender.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Text style={{ marginBottom: 12 }}>No hay tareas que coincidan con los filtros</Text>
            {hasActiveFilters && (
              <Button mode="outlined" onPress={clearFilters}>Limpiar filtros</Button>
            )}
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
          style={{
            position: 'absolute',
            right: 16,
            bottom: 40,
            zIndex: 10,
            backgroundColor: BRAND_COLORS.primary
          }}
          onPress={() => navigation.navigate('TaskForm')}
          color="#FFFFFF"
          size="medium"
        />
        {/* Logo centrado abajo - no interfiere con toques */}
        {/* @ts-ignore */}
        <Image
          source={require('../../assets/logo.png')}
          style={{ position: 'absolute', zIndex: -1, alignSelf: 'center', bottom: -40, width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
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
    paddingTop: 16,
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
  filtersContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersScroll: {
    paddingHorizontal: 12,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});


