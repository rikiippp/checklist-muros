import React, { useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, Linking, Alert } from 'react-native';
import { Appbar, Text, Button } from 'react-native-paper';
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
  const [filterTime, setFilterTime] = useState<'all' | '7' | '30'>('all');

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

  const getViewUrl = (url: string, name: string): string => {
    // URL para visualizar (sin fl_attachment)
    if (url.includes('cloudinary.com')) {
      // Removemos fl_attachment si existe
      let viewUrl = url.replace('/fl_attachment/', '/');
      // Aseguramos que use /raw/upload/ para PDFs
      if (name.toLowerCase().endsWith('.pdf') || url.includes('.pdf')) {
        if (viewUrl.includes('/image/upload/')) {
          viewUrl = viewUrl.replace('/image/upload/', '/raw/upload/');
        } else if (viewUrl.includes('/auto/upload/')) {
          viewUrl = viewUrl.replace('/auto/upload/', '/raw/upload/');
        } else if (viewUrl.includes('/upload/') && !viewUrl.includes('/raw/upload/')) {
          viewUrl = viewUrl.replace('/upload/', '/raw/upload/');
        }
      }
      return viewUrl;
    }
    return url;
  };

  const getDownloadUrl = (url: string, name: string): string => {
    // URL para descargar (con fl_attachment)
    if (url.includes('cloudinary.com')) {
      let downloadUrl = url;
      const isPDF = name.toLowerCase().endsWith('.pdf') || url.includes('.pdf');
      
      if (isPDF) {
        if (downloadUrl.includes('/raw/upload/')) {
          if (!downloadUrl.includes('fl_attachment')) {
            downloadUrl = downloadUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
          }
        } else if (downloadUrl.includes('/image/upload/')) {
          downloadUrl = downloadUrl.replace('/image/upload/', '/raw/upload/fl_attachment/');
        } else if (downloadUrl.includes('/auto/upload/')) {
          downloadUrl = downloadUrl.replace('/auto/upload/', '/raw/upload/fl_attachment/');
        } else if (downloadUrl.includes('/upload/') && !downloadUrl.includes('/raw/upload/')) {
          downloadUrl = downloadUrl.replace('/upload/', '/raw/upload/fl_attachment/');
        }
      }
      return downloadUrl;
    }
    return url;
  };

  const handleOpenAttachment = async (url: string, name: string) => {
    // Mostrar diálogo con opciones: Ver o Descargar
    Alert.alert(
      name,
      '¿Qué deseas hacer con este archivo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Ver',
          onPress: async () => {
            try {
              const viewUrl = getViewUrl(url, name);
              if (__DEV__) {
                console.log('Intentando ver archivo:', name);
                console.log('URL para ver:', viewUrl);
              }
              const canOpen = await Linking.canOpenURL(viewUrl);
              if (canOpen) {
                await Linking.openURL(viewUrl);
              } else {
                Alert.alert('Error', 'No se pudo abrir el archivo para visualización.');
              }
            } catch (error: any) {
              if (__DEV__) {
                console.error('Error al ver archivo:', error);
              }
              Alert.alert('Error', `No se pudo abrir el archivo: ${error?.message || ''}`);
            }
          },
        },
        {
          text: 'Descargar',
          onPress: async () => {
            try {
              const downloadUrl = getDownloadUrl(url, name);
              if (__DEV__) {
                console.log('Intentando descargar archivo:', name);
                console.log('URL para descargar:', downloadUrl);
              }
              const canOpen = await Linking.canOpenURL(downloadUrl);
              if (canOpen) {
                await Linking.openURL(downloadUrl);
              } else {
                Alert.alert('Error', 'No se pudo descargar el archivo.');
              }
            } catch (error: any) {
              if (__DEV__) {
                console.error('Error al descargar archivo:', error);
              }
              Alert.alert('Error', `No se pudo descargar el archivo: ${error?.message || ''}`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: Task }) => {
    const attachments = (item as any).attachments as any[] | undefined;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    return (
      <View>
        <TaskItem
          title={item.title}
          description={item.description}
          color={item.color}
          colorLabel={item.colorLabel || COLOR_LABELS[item.color]}
          done={item.done}
          createdAt={item.createdAt}
          dueDate={(item as any).dueDate}
          assignedToLabel={(item as any).forAll ? 'Todos' : (item.assigneeUid ? (userMap[item.assigneeUid]?.name || userMap[item.assigneeUid]?.email || 'Asignado') : '')}
          canDelete={(userRole === 'admin') || (user && item.createdBy === (user as any).uid && !(item as any).forAll) || undefined}
          onToggleDone={() => toggleDone(item)}
          onDelete={() => removeTask(item)}
        />
        {hasAttachments && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: -6,
              marginBottom: 8,
              padding: 12,
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#f07e0e',
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: '#666',
                marginBottom: 8,
                fontWeight: '600',
              }}
            >
              📎 Archivos adjuntos ({attachments.length})
            </Text>
            {attachments.map((attachment: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleOpenAttachment(attachment.url, attachment.name || 'Archivo')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  backgroundColor: '#fff',
                  borderRadius: 6,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                }}
              >
                <Text
                  variant="bodySmall"
                  style={{
                    flex: 1,
                    color: '#1976d2',
                    textDecorationLine: 'underline',
                  }}
                  numberOfLines={1}
                >
                  {attachment.name || `Archivo ${index + 1}`}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: '#999',
                    marginLeft: 8,
                    fontSize: 10,
                  }}
                >
                  👁️ Abrir
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const filteredTasks = (() => {
    if (filterTime === 'all') return tasks;
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const days = filterTime === '7' ? 7 : 30;
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days);

    return tasks.filter((t) => {
      const created = (t.createdAt as any) || null;
      if (!created) return true;
      const d = typeof (created as any).toDate === 'function' ? (created as any).toDate() : new Date(created);
      d.setHours(0, 0, 0, 0);
      return d >= cutoff;
    });
  })();

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Completadas" />
      </Appbar.Header>

      {/* Filtros por tiempo */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <Text variant="bodySmall" style={{ marginBottom: 4, color: '#666' }}>Filtrar por fecha de creación</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { value: 'all', label: 'Todas' },
            { value: '7', label: 'Últimos 7 días' },
            { value: '30', label: 'Últimos 30 días' },
          ] as const).map((opt) => (
            <Text
              key={opt.value}
              onPress={() => setFilterTime(opt.value)}
              style={{
                marginRight: 12,
                paddingVertical: 4,
                fontSize: 12,
                color: filterTime === opt.value ? '#fff' : '#555',
                backgroundColor: filterTime === opt.value ? '#f07e0e' : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 10,
              }}
            >
              {opt.label}
            </Text>
          ))}
        </View>
      </View>

      {filteredTasks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text>No hay tareas completadas en este rango</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

