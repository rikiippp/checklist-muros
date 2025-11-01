import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text, Chip, Dialog, Portal, Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { auth, db } from '../firebase';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { COLOR_OPTIONS } from '../theme';
import { COMPANY_ID } from '../firebase/firebaseConfig';

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
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        forAll,
      });

      // Notificaciones: enviar a tokens de los participantes (excepto el creador)
      try {
        const tokens: string[] = [];
        for (const uid of participants) {
          if (uid === user.uid) continue;
          const udoc = await getDoc(doc(db, 'users', uid));
          const t = (udoc.data() as any)?.expoPushToken;
          if (t) tokens.push(t);
        }
        if (tokens.length > 0) {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(tokens.map((to) => ({
              to,
              sound: 'default',
              title: 'Nueva tarea',
              body: title.trim(),
              data: { taskId: taskRef.id },
            })) as any),
          });
          const result = await response.json();
          if (__DEV__) {
            console.log('Notificaciones enviadas:', result);
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
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>Nueva tarea</Text>
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

      <Button mode="contained" onPress={onSave} loading={loading} disabled={loading || !title.trim()} style={{ marginTop: 16 }}>
        Guardar
      </Button>
      <Button onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>Cancelar</Button>
    </View>
  );
}


