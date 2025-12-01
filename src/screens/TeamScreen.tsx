import React, { useEffect, useState } from 'react';
import { FlatList, View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, List, Text, Dialog, Portal, RadioButton, Button, Divider } from 'react-native-paper';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/index.tsx';
import { auth, db } from '../firebase/index.ts';
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { COMPANY_ID } from '../firebase/firebaseConfig.ts';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Team'>;

type Member = {
  uid: string;
  email: string;
  name?: string;
  role?: string;
};

type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate?: Timestamp | null;
  assigneeUid?: string;
  forAll?: boolean;
  participants?: string[];
};

export default function TeamScreen({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [manageRolesMode, setManageRolesMode] = useState(false);
  
  // Estados para modal de estadísticas
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedMemberForStats, setSelectedMemberForStats] = useState<Member | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

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

  // Cargar tareas del usuario seleccionado para estadísticas
  useEffect(() => {
    if (!selectedMemberForStats) {
      setUserTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('companyId', '==', COMPANY_ID)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const tasks: Task[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const task: Task = {
          id: d.id,
          title: data.title || '',
          done: data.done || false,
          dueDate: data.dueDate || null,
          assigneeUid: data.assigneeUid,
          forAll: data.forAll || false,
          participants: data.participants || [],
        };

        // Filtrar tareas donde el usuario es participante o asignado
        const isParticipant = task.participants?.includes(selectedMemberForStats.uid) || false;
        const isAssignee = task.assigneeUid === selectedMemberForStats.uid || false;
        const isForAll = task.forAll === true;

        if (isParticipant || isAssignee || isForAll) {
          tasks.push(task);
        }
      });
      setUserTasks(tasks);
    });

    return () => unsub();
  }, [selectedMemberForStats]);

  // Calcular estadísticas del usuario
  const calculateStats = () => {
    if (!selectedMemberForStats) return { assigned: 0, completed: 0, overdue: 0, assignedTasks: [], completedTasks: [], overdueTasks: [] };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const assignedTasks: Task[] = [];
    const completedTasks: Task[] = [];
    const overdueTasks: Task[] = [];

    userTasks.forEach(task => {
      if (task.done) {
        completedTasks.push(task);
      } else {
        assignedTasks.push(task);
        
        // Verificar si está vencida
        if (task.dueDate) {
          const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate.seconds * 1000);
          const dueDay = new Date(dueDate);
          dueDay.setHours(0, 0, 0, 0);
          
          if (dueDay < now) {
            overdueTasks.push(task);
          }
        }
      }
    });

    return {
      assigned: assignedTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      assignedTasks,
      completedTasks,
      overdueTasks,
    };
  };

  const stats = calculateStats();

  const openStatsDialog = (member: Member) => {
    setSelectedMemberForStats(member);
    setStatsDialogOpen(true);
  };

  const closeStatsDialog = () => {
    setStatsDialogOpen(false);
    setSelectedMemberForStats(null);
  };

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
                    if (canEdit) {
                      // Modo de gestión de roles: abrir diálogo de cambio de rol
                      setSelectedMember(item);
                      setSelectedRole((item.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user');
                      setRoleDialogOpen(true);
                    } else {
                      // Modo normal: abrir estadísticas del usuario
                      openStatsDialog(item);
                    }
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

          {/* Modal de estadísticas de usuario */}
          <Portal>
            <Dialog visible={statsDialogOpen} onDismiss={closeStatsDialog} style={{ maxHeight: '80%' }}>
              <Dialog.Title>
                Estadísticas de {selectedMemberForStats?.name || selectedMemberForStats?.email}
              </Dialog.Title>
              <Dialog.Content>
                <ScrollView style={{ maxHeight: 500 }}>
                  {/* Resumen de estadísticas */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                      <Text variant="headlineMedium" style={styles.statNumber}>{stats.assigned}</Text>
                      <Text variant="bodySmall" style={styles.statLabel}>Tareas asignadas</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text variant="headlineMedium" style={[styles.statNumber, { color: '#43a047' }]}>{stats.completed}</Text>
                      <Text variant="bodySmall" style={styles.statLabel}>Completadas</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text variant="headlineMedium" style={[styles.statNumber, { color: '#e53935' }]}>{stats.overdue}</Text>
                      <Text variant="bodySmall" style={styles.statLabel}>Vencidas</Text>
                    </View>
                  </View>

                  <Divider style={{ marginVertical: 16 }} />

                  {/* Tareas asignadas */}
                  <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                    Tareas asignadas ({stats.assigned})
                  </Text>
                  {stats.assignedTasks.length === 0 ? (
                    <Text variant="bodySmall" style={{ color: '#666', marginBottom: 16 }}>
                      No hay tareas asignadas
                    </Text>
                  ) : (
                    <View style={{ marginBottom: 16 }}>
                      {stats.assignedTasks.map((task) => (
                        <View key={task.id} style={styles.taskItem}>
                          <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                            • {task.title}
                          </Text>
                          {task.dueDate && (
                            <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                              Vence: {task.dueDate.toDate ? task.dueDate.toDate().toLocaleDateString() : 'N/A'}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  <Divider style={{ marginVertical: 16 }} />

                  {/* Tareas vencidas */}
                  {stats.overdue > 0 && (
                    <>
                      <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: 'bold', color: '#e53935' }}>
                        Tareas vencidas ({stats.overdue})
                      </Text>
                      <View style={{ marginBottom: 16 }}>
                        {stats.overdueTasks.map((task) => (
                          <View key={task.id} style={styles.taskItem}>
                            <Text variant="bodyMedium" style={{ fontWeight: '500', color: '#e53935' }}>
                              • {task.title}
                            </Text>
                            {task.dueDate && (
                              <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                                Vencida: {task.dueDate.toDate ? task.dueDate.toDate().toLocaleDateString() : 'N/A'}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                      <Divider style={{ marginVertical: 16 }} />
                    </>
                  )}

                  {/* Tareas completadas */}
                  <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: 'bold', color: '#43a047' }}>
                    Tareas completadas ({stats.completed})
                  </Text>
                  {stats.completedTasks.length === 0 ? (
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                      No hay tareas completadas
                    </Text>
                  ) : (
                    <View>
                      {stats.completedTasks.slice(0, 10).map((task) => (
                        <View key={task.id} style={styles.taskItem}>
                          <Text variant="bodyMedium" style={{ fontWeight: '500', color: '#43a047' }}>
                            • {task.title}
                          </Text>
                        </View>
                      ))}
                      {stats.completedTasks.length > 10 && (
                        <Text variant="bodySmall" style={{ color: '#666', marginTop: 8, fontStyle: 'italic' }}>
                          ...y {stats.completedTasks.length - 10} más
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={closeStatsDialog}>Cerrar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  taskItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 8,
  },
});


