import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function ensureNotifPermission(): Promise<boolean> {
    const {status: existing} = await Notifications.getPermissionsAsync();
    if(existing === 'granted') return true;

    const {status} = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function configureAndroidChannel() {
    if(Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.DEFAULT,
    });
}

export async function scheduleOneReminder(params: {
    title: string;
    body: string;
    fireAt: number;
}): Promise<string> {
    const notificationId= await Notifications.scheduleNotificationAsync({
        content: {
            title: params.title,
            body: params.body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(params.fireAt),
        },
    });
    return notificationId;
}

export async function cancelReminder(notificationId: string) {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error(error);
    }
}