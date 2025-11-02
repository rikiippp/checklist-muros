import * as Notifications from 'expo-notifications';
import { Timestamp } from 'firebase/firestore';

/**
 * Programa notificaciones para una tarea basándose en su fecha límite
 * - 2 días antes: 1 notificación
 * - 1 día antes: 1 notificación
 * - Día de vencimiento: notificaciones cada 2 horas (de 8 AM a 10 PM)
 */
export async function scheduleTaskDeadlineNotifications(
  taskId: string,
  taskTitle: string,
  dueDate: Timestamp | null | undefined
): Promise<void> {
  if (!dueDate) return;

  try {
    // Verificar permisos
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('Permisos de notificaciones no concedidos');
        return;
      }
    }

    // Cancelar notificaciones anteriores de esta tarea
    await cancelTaskNotifications(taskId);

    // Convertir Timestamp a Date
    const deadlineDate = dueDate.toDate();
    const now = new Date();
    
    // Si la fecha límite ya pasó, no programar notificaciones
    if (deadlineDate <= now) {
      return;
    }

    const notifications: Notifications.NotificationRequestInput[] = [];

    // Calcular fechas
    const twoDaysBefore = new Date(deadlineDate);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    twoDaysBefore.setHours(9, 0, 0, 0); // 9:00 AM

    const oneDayBefore = new Date(deadlineDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0); // 9:00 AM

    // Notificación 2 días antes (si aún no pasó)
    if (twoDaysBefore > now) {
      notifications.push({
        identifier: `task-${taskId}-2days`,
        content: {
          title: '⏰ Recordatorio de tarea',
          body: `Acuérdate de hacer "${taskTitle}". Su fecha límite es el ${deadlineDate.toLocaleDateString()}`,
          sound: 'default',
          data: { taskId, type: 'deadline-reminder' },
        },
        trigger: {
          date: twoDaysBefore,
        },
      });
    }

    // Notificación 1 día antes (si aún no pasó)
    if (oneDayBefore > now) {
      notifications.push({
        identifier: `task-${taskId}-1day`,
        content: {
          title: '⚠️ Tarea próxima a vencer',
          body: `Acuérdate de hacer "${taskTitle}". Su fecha límite es mañana (${deadlineDate.toLocaleDateString()})`,
          sound: 'default',
          data: { taskId, type: 'deadline-reminder' },
        },
        trigger: {
          date: oneDayBefore,
        },
      });
    }

    // Notificaciones el día de vencimiento: cada 2 horas de 8 AM a 10 PM
    const deadlineDay = new Date(deadlineDate);
    deadlineDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Solo programar si el día de vencimiento es hoy o futuro
    if (deadlineDay >= today) {
      // Horarios: 8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM, 10 PM
      const reminderHours = [8, 10, 12, 14, 16, 18, 20, 22];
      
      for (const hour of reminderHours) {
        const reminderTime = new Date(deadlineDate);
        reminderTime.setHours(hour, 0, 0, 0);

        // Solo programar si el tiempo aún no pasó
        if (reminderTime > now) {
          notifications.push({
            identifier: `task-${taskId}-due-${hour}`,
            content: {
              title: '🔴 ¡Tarea vence hoy!',
              body: `Acuérdate de hacer "${taskTitle}". Su fecha límite es hoy (${deadlineDate.toLocaleDateString()})`,
              sound: 'default',
              data: { taskId, type: 'deadline-today' },
            },
            trigger: {
              date: reminderTime,
            },
          });
        }
      }
    }

    // Programar todas las notificaciones
    for (const notification of notifications) {
      try {
        await Notifications.scheduleNotificationAsync(notification);
      } catch (error) {
        console.warn(`Error al programar notificación ${notification.identifier}:`, error);
      }
    }

    if (__DEV__) {
      console.log(`Programadas ${notifications.length} notificaciones para la tarea "${taskTitle}"`);
    }
  } catch (error) {
    console.error('Error al programar notificaciones de tarea:', error);
  }
}

/**
 * Cancela todas las notificaciones programadas para una tarea
 */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  try {
    // Obtener todas las notificaciones programadas
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Filtrar las que pertenecen a esta tarea
    const taskNotifications = scheduledNotifications.filter(
      (notification) => notification.identifier.startsWith(`task-${taskId}-`)
    );

    // Cancelar cada notificación
    for (const notification of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    if (__DEV__) {
      console.log(`Canceladas ${taskNotifications.length} notificaciones de la tarea ${taskId}`);
    }
  } catch (error) {
    console.error('Error al cancelar notificaciones de tarea:', error);
  }
}

/**
 * Verifica y programa notificaciones para todas las tareas pendientes
 * Útil para cuando la app se abre o cuando se carga una nueva tarea
 */
export async function scheduleNotificationsForTask(
  taskId: string,
  taskTitle: string,
  dueDate: Timestamp | null | undefined,
  done: boolean
): Promise<void> {
  // No programar notificaciones para tareas completadas
  if (done) {
    await cancelTaskNotifications(taskId);
    return;
  }

  await scheduleTaskDeadlineNotifications(taskId, taskTitle, dueDate);
}

