// import ReactMaterialUiNotifications from 'react-materialui-notifications';
// import DateTimeHelper from './DateTimeHelper';
import { NotificationManager } from 'react-notifications';

export default class NotificationCenter {
	// eslint-disable-next-line
	static showNotification({ title, message, error, warning /* , color, icon, timestamp, */ }) {
		if (!error) {
			if(warning) {
				NotificationManager.warning(message, title, 5000);
			} else {
				NotificationManager.success(message, title, 5000);
			}
		} else {
			NotificationManager.error(message, title, 5000);
		}
		// TODO: this library does not work with the latest version
		// of Material UI, so we need to use another library
		/*
		ReactMaterialUiNotifications.showNotification({
			title,
			icon,
			iconBadgeColor: color,
			additionalText: message,
			timestamp: DateTimeHelper.formatTimestamp(timestamp),
			autoHide: 5000,
		});
		*/
	}

	static showWarningNotification({ title, message }) {
		NotificationManager.warning(message, title, 5000);
		// TODO: this library does not work with the latest version
		// of Material UI, so we need to use another library
		/*
		ReactMaterialUiNotifications.showNotification({
			title,
			icon,
			iconBadgeColor: color,
			additionalText: message,
			timestamp: DateTimeHelper.formatTimestamp(timestamp),
			autoHide: 5000,
		});
		*/
	}
}
