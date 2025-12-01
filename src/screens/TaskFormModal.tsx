import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text, Chip, Dialog, Portal, Checkbox, Appbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { auth, db } from '../firebase/index.ts';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { COLOR_OPTIONS } from '../theme.ts';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';
import { scheduleNotificationsForTask } from '../services/taskNotifications.ts';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

export default function TaskFormModal({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(COLOR_OPTIONS[2]); // naranja por defecto
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showPicker, setShowPicker] = useState(false);
  const [selectAssigneeOpen, setSelectAssigneeOpen] = useState(false);
  const [members, setMembers] = useState<{ uid: string; email: string; name?: string }[]>([]);
  const [assignAll, setAssignAll] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('companyId', '==', COMPANY_ID)));
      setMembers(snap.docs.map((d) => d.data() as any));
    };
    load();
  }, []);

  const onSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!title.trim()) return;
    setLoading(true);
    try {
      let participants: string[];
      let assigneeUid: string | null = null;
      let forAll = false;
      if (assignAll || !selectedUid) {
        const allSnap = await getDocs(query(collection(db, 'users'), where('companyId', '==', COMPANY_ID)));
        participants = Array.from(new Set(allSnap.docs.map((d) => d.id)));
        forAll = true;
      } else {
        participants = Array.from(new Set([user.uid, selectedUid]));
        assigneeUid = selectedUid;
      }

      const dueDateTimestamp = dueDate ? Timestamp.fromDate(dueDate) : null;

      const taskRef = await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        description: description.trim() || '',
        color: selected.color,
        colorLabel: selected.label,
        done: false,
        companyId: COMPANY_ID,
        assigneeUid,
        createdBy: user.uid,
        participants,
        createdAt: serverTimestamp(),
        dueDate: dueDateTimestamp,
        forAll,
      });

      // Programar notificaciones de fecha límite si hay dueDate
      if (dueDateTimestamp) {
        try {
          await scheduleNotificationsForTask(taskRef.id, title.trim(), dueDateTimestamp, false);
        } catch (error) {
          console.warn('Error al programar notificaciones de fecha límite:', error);
        }
      }

      // Notificaciones inmediatas: enviar notificaciones locales y push a los participantes
      try {
        const tokens: string[] = [];
        const userNames: Record<string, string> = {};
        
        // Obtener tokens y nombres de los participantes (excepto el creador)
        for (const uid of participants) {
          if (uid === user.uid) continue;
          const udoc = await getDoc(doc(db, 'users', uid));
          const userData = udoc.data() as any;
          const t = userData?.expoPushToken;
          if (t) tokens.push(t);
          // Guardar nombre para la notificación
          userNames[uid] = userData?.name || userData?.email?.split('@')[0] || 'Usuario';
        }

        // Enviar notificaciones push a todos los participantes (excepto el creador)
        // Estas notificaciones llegan a todos los dispositivos, incluso los que no usan Expo Go
        if (tokens.length > 0) {
          // Enviar todas las notificaciones push de forma paralela y esperar a que se completen
          // Esto asegura que se envíen inmediatamente sin retrasos
          const pushPromises = tokens.map(async (to) => {
            try {
              const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to,
                  sound: 'default',
                  title: '📋 Nueva tarea asignada',
                  body: `Se te asignó: "${title.trim()}"`,
                  data: { taskId: taskRef.id, type: 'new-task' },
                  priority: 'high',
                  channelId: 'default',
                }),
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const result = await response.json();
              if (__DEV__) {
                console.log('Notificación push enviada:', result);
              }
              return result;
            } catch (err) {
              console.warn('Error al enviar notificación push individual:', err);
              throw err;
            }
          });

          // Esperar a que todas las notificaciones se envíen (con timeout de 10 segundos)
          try {
            await Promise.race([
              Promise.allSettled(pushPromises),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout en notificaciones push')), 10000)
              )
            ]);
          } catch (error) {
            // Si hay timeout o error, no bloquear el flujo pero loguear
            console.warn('Algunas notificaciones push pueden no haberse enviado:', error);
          }
        }
      } catch (error) {
        // Log del error para debugging, pero no bloquear el flujo
        console.warn('Error al enviar notificaciones:', error);
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Nueva tarea" />
      </Appbar.Header>
      <View style={{ flex: 1, padding: 20 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 12 }}>Crea una tarea</Text>
        <TextInput label="Título" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />
        <TextInput label="Descripción" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />
        <Text style={{ marginBottom: 8 }}>Color / Prioridad</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {COLOR_OPTIONS.map((opt) => (
            <Chip
              key={opt.color}
              selected={selected.color === opt.color}
              onPress={() => setSelected(opt)}
              style={{ marginRight: 8, marginBottom: 8, backgroundColor: selected.color === opt.color ? opt.color : undefined }}
              textStyle={{ color: selected.color === opt.color ? 'white' : undefined }}
            >
              {opt.label}
            </Chip>
          ))}
        </View>
        {/* Fecha límite */}
        <Text style={{ marginTop: 16, marginBottom: 8 }}>Fecha límite (opcional)</Text>
        <Button mode="outlined" onPress={() => setShowPicker(true)} icon="calendar">
          {dueDate ? dueDate.toLocaleDateString() : 'Elegir fecha'}
        </Button>
        {showPicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event: any, selected?: Date) => {
              setShowPicker(false);
              if (selected) setDueDate(selected);
            }}
          />
        )}

        <Text style={{ marginTop: 16, marginBottom: 8 }}>Asignación</Text>
        <Button mode="outlined" onPress={() => setSelectAssigneeOpen(true)}>
          {assignAll ? 'Para todos' : (members.find(m => m.uid === selectedUid)?.name || members.find(m => m.uid === selectedUid)?.email || 'Elegir miembro')}
        </Button>

        <Portal>
          <Dialog visible={selectAssigneeOpen} onDismiss={() => setSelectAssigneeOpen(false)}>
            <Dialog.Title>Asignar tarea</Dialog.Title>
            <Dialog.Content>
              <View style={{ marginBottom: 8 }}>
                <Checkbox.Item
                  label="Para todos"
                  status={assignAll ? 'checked' : 'unchecked'}
                  onPress={() => { setAssignAll(true); setSelectedUid(null); }}
                />
              </View>
              {members.map((m) => (
                <Checkbox.Item
                  key={m.uid}
                  label={m.name || m.email}
                  status={!assignAll && selectedUid === m.uid ? 'checked' : 'unchecked'}
                  onPress={() => { setAssignAll(false); setSelectedUid(m.uid); }}
                />
              ))}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setSelectAssigneeOpen(false)}>Listo</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Button mode="contained" onPress={onSave} loading={loading} disabled={loading || !title.trim()} style={{ marginTop: 16, padding: 6 }}>
          Crear tarea
        </Button>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>Cancelar</Button>
      </View>
    </View>
  );
}


