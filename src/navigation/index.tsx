import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TaskListScreen from '../screens/TaskListScreen';
import TaskFormModal from '../screens/TaskFormModal';
import CompletedTasksScreen from '../screens/CompletedTasksScreen';
import { auth } from '../firebase';
import TeamScreen from '../screens/TeamScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tasks: undefined;
  TaskForm: { id?: string } | undefined;
  CompletedTasks: undefined;
  Team: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const user = auth.currentUser;
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'Tasks' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Tasks" component={TaskListScreen} options={{ title: 'Tareas' }} />
        <Stack.Screen name="CompletedTasks" component={CompletedTasksScreen} options={{ title: 'Tareas Completadas' }} />
        <Stack.Screen name="Team" component={TeamScreen} options={{ title: 'Mi equipo' }} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="TaskForm" component={TaskFormModal} options={{ title: 'Nueva tarea' }} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}


