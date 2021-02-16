/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import React from 'react';
import { FormattedMessage } from 'react-intl';
import InfoIcon from '@material-ui/icons/Info';
import ErrorIcon from '@material-ui/icons/ReportProblem';
import * as Colors from '@material-ui/core/colors';
import * as Actions from '../constants/ActionTypes';
import * as WsMessageTypes from '../constants/WebsocketMessageTypes';
import NotificationCenter from '../helper/NotificationCenter';
import { IconConsumer } from '../components/icons';

const defaultNotificationsState = {
	counter: 0,
	notifications: [],
	labels: [],
};

const TOPIC_ERRORS = {
	TOPIC_FORMAT_INVALID: (
		<FormattedMessage id="Notification.TOPIC_FORMAT_INVALID" defaultMessage="Invalid topic format" />
	),
	TOPIC_WILDCARD_UNEXPECTED: (
		<FormattedMessage id="Notification.TOPIC_WILDCARD_UNEXPECTED" defaultMessage="Wildcard is not expected" />
	),
	TOPIC_WILDCARD_POSITION_INVALID: (
		<FormattedMessage
			id="Notification.TOPIC_WILDCARD_POSITION_INVALID"
			defaultMessage="Wildcard at wrong position"
		/>
	),
};
const TOPIC_WARNINGS = {
	TOPIC_WITH_DOUBLE_SLASH: (
		<FormattedMessage id="Notification.TOPIC_WITH_DOUBLE_SLASH" defaultMessage="There should not be double slash" />
	),
	TOPIC_WITH_LEADING_SLASH: (
		<FormattedMessage
			id="Notification.TOPIC_WITH_LEADING_SLASH"
			defaultMessage="There should not be a leading slash"
		/>
	),
	TOPIC_WITH_FILTER_ALL: (
		<FormattedMessage id="Notification.TOPIC_WITH_FILTER_ALL" defaultMessage="# filter is not recommended" />
	),
	TOPIC_WITH_SPACES: (
		<FormattedMessage id="Notification.TOPIC_WITH_SPACES" defaultMessage="Spaces in topic are not recommended" />
	),
	TOPIC_STARTS_RESERVED: (
		<FormattedMessage
			id="Notification.TOPIC_STARTS_RESERVED"
			defaultMessage="Reserved chars like $ should not be used"
		/>
	),
	TOPIC_TOO_SHORT: (
		<FormattedMessage
			id="Notification.TOPIC_TOO_SHORT"
			defaultMessage="Topic looks too short. Having more specific topics is recommended"
		/>
	),
};


function addNotification(notification, state) {
	let hasAlready = false;
	const notifications = state.notifications.map(n => {
		if(n.message === notification.message && n.title === notification.title) {
			n.timestamp = Date.now();
			hasAlready = true;
		}
		return n;
	});
	if(!hasAlready) {
		notification.labels = notification.labels || [];
		notification.labels.forEach((label) => {
			if (label && !state.labels.includes(label)) state.labels.push(label);
		});
		state.notifications.unshift(notification);
	} else {
		state.notifications = notifications.slice();
	}
}


export default function notificationsReducer(state = defaultNotificationsState, action) {
	let notification = null;
	switch (action.type) {
		case WsMessageTypes.REQUEST_FAILED:
			switch (action.request) {
				// eslint-disable-next-line
				case WsMessageTypes.MACHINE_LOAD:
					notification = {
						title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
						message: <FormattedMessage id="Error.machine.load" defaultMessage="Error loading machine" />,
						color: Colors.red[600],
						icon: <ErrorIcon />,
						timestamp: Date.now(),
						error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
					};
					NotificationCenter.showNotification(notification);
					addNotification(notification, state);
					break;
				// eslint-disable-next-line
				case WsMessageTypes.MACHINE_SAVE_AS:
					notification = {
						title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
						message: (
							<FormattedMessage id="Error.machine.saveAs" defaultMessage="Error saving machine as" />
						),
						color: Colors.red[600],
						icon: <ErrorIcon />,
						timestamp: Date.now(),
						error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
					};
					NotificationCenter.showNotification(notification);
					addNotification(notification, state);
					break;
				case WsMessageTypes.MACHINE_RENAME:
					notification = {
						title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
						message: <FormattedMessage id="Error.machine.rename" defaultMessage="Error renaming machine" />,
						color: Colors.red[600],
						icon: <ErrorIcon />,
						timestamp: Date.now(),
						error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
					};
					NotificationCenter.showNotification(notification);
					addNotification(notification, state);
					break;
				case WsMessageTypes.STREAMS_RELOAD:
					notification = {
						title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
						message: (
							<FormattedMessage
								id="Error.streams.reload.timeout"
								defaultMessage="Error reloading streams"
							/>
						),
						color: Colors.red[600],
						icon: <ErrorIcon />,
						timestamp: Date.now(),
						error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
					};
					NotificationCenter.showNotification(notification);
					addNotification(notification, state);
					break;
				default:
			}
			return {
				...state,
				labels: state.labels,
				counter: state.counter + 1,
				notifications: state.notifications,
				loadingFailed: true,
			};
		case Actions.FORM_INPUT_FEEDBACK: {
			({ notification } = action);
			notification = {
				title: <FormattedMessage id="Form.Validation" defaultMessage="Feedback" />,
				message: notification.message,
				color: Colors.red[600],
				icon: <ErrorIcon />,
				timestamp: Date.now(),
				error: notification.error,
				warning: notification.warning,
				show: notification.show,
			};
			if (notification.error) NotificationCenter.showNotification(notification);
			else if (notification.show) NotificationCenter.showNotification(notification);
			addNotification(notification, state);
			return {
				...state,
				notifications: state.notifications,
			};
		}
		case Actions.STREAM_CONTROL_EVENT: {
			const e = {
				streamName: action.event.data.stream.name,
				streamId: action.event.data.stream.id,
				streamEventType: action.event.streamEventType,
				data: action.event.data,
				error: action.event.data.error ? action.event.data.error.message : undefined,
				warning: action.event.data.warning ? action.event.data.warning.message : action.event.data.warning
			};
			notification = {
				title: e.streamName,
				message: '',
				icon: !e.error ? <IconConsumer /> : <ErrorIcon />,
				timestamp: action.event.data.timestamp,
			};
			if (typeof e.error !== 'undefined') {
				notification.error = e.error;
				notification.message = TOPIC_ERRORS[e.error] || e.error;
				notification.labels = ['error', 'stream'];
				if (!action.event.hidden) {
					// NotificationCenter.showNotification(notification);
				}
			} else if (typeof e.warning !== 'undefined') {
				notification.error = e.warning;
				notification.message = TOPIC_WARNINGS[e.warning]  || e.warning;
				notification.labels = ['warning', 'stream'];
				if (!action.event.hidden) {
					// NotificationCenter.showWarningNotification(notification);
				}
			} else {
				notification.message = `${e.streamEventType}`;
				notification.labels = ['info', 'stream', e.streamEventType];
			}
			if (
				(!action.event.data.notification || action.event.data.notification.type !== 'hidden') &&
				!notification.labels.includes('info')
			) {
				addNotification(notification, state);
			}
			if (action.event.data.notification && action.event.data.notification.type === 'popUp') {
				notification = { ...notification, ...action.event.data.notification };
				NotificationCenter.showWarningNotification(notification);
				addNotification(notification, state);
			}
			return {
				...state,
				counter: state.counter + 1,
				notifications: state.notifications,
			};
		}
		case Actions.RECEIVE_MACHINE_CLONE:
			notification = {
				title: <FormattedMessage id="Notification.machine.cloned" defaultMessage="Machine Cloned" />,
				message: <FormattedMessage id="Machine.cloned" defaultMessage="Machine cloned" />,
				color: Colors.green[600],
				icon: <InfoIcon />,
				timestamp: Date.now(),
				labels: ['info', 'machine', 'clone'],
			};
			NotificationCenter.showNotification(notification);
			addNotification(notification, state);
			return {
				...state,
				counter: state.counter + 1,
				notifications: state.notifications,
			};
		case Actions.RECEIVE_MACHINE_SAVE_AS:
			notification = {
				title: <FormattedMessage id="Notification.machine.savedAs" defaultMessage="Machine Saved As" />,
				message: <FormattedMessage id="Machine.savedAs" defaultMessage="Machine Saved As" />,
				color: Colors.green[600],
				icon: <InfoIcon />,
				timestamp: Date.now(),
			};
			NotificationCenter.showNotification(notification);
			addNotification(notification, state);
			return {
				...state,
				counter: state.counter + 1,
				notifications: state.notifications,
			};
		// case Actions.SEND_IMPORT_SUCCESS:
		// 	notification = {
		// 		title: <FormattedMessage id="Import.Notification.Success.Title" defaultMessage="Import Successful" />,
		// 		message: (
		// 			<FormattedMessage id="Import.Notification.Success.Message" defaultMessage="Import Successful" />
		// 		),
		// 		color: Colors.green[600],
		// 		icon: <InfoIcon />,
		// 		timestamp: Date.now(),
		// 	};
		// 	NotificationCenter.showNotification(notification);
		// 	addNotification(notification, state);
		// 	return {
		// 		...state,
		// 		counter: state.counter + 1,
		// 		notifications: state.notifications,
		// 	};
		// case Actions.SEND_IMPORT_ERROR:
		// 	notification = {
		// 		title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
		// 		message: <FormattedMessage id="Import.Notification.Error.Message" defaultMessage="Import Failed" />,
		// 		color: Colors.red[600],
		// 		icon: <ErrorIcon />,
		// 		timestamp: Date.now(),
		// 		error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
		// 	};
		// 	NotificationCenter.showNotification(notification);
		// 	addNotification(notification, state);
		// 	return {
		// 		...state,
		// 		counter: state.counter + 1,
		// 		notifications: state.notifications,
		// 	};
		// case Actions.SEND_EXPORT_ERROR:
		// 	notification = {
		// 		title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
		// 		message: <FormattedMessage id="Export.Notification.Error.Message" defaultMessage="Export Failed" />,
		// 		color: Colors.red[600],
		// 		icon: <ErrorIcon />,
		// 		timestamp: Date.now(),
		// 		error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
		// 	};
		// 	NotificationCenter.showNotification(notification);
		// 	addNotification(notification, state);
		// 	return {
		// 		...state,
		// 		counter: state.counter + 1,
		// 		notifications: state.notifications,
		// 	};
		case Actions.SEND_RESTORE_ERROR:
			notification = {
				title: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
				message: (
					<FormattedMessage
						id="Database.Restore.Notification.Error.Message"
						defaultMessage="Restore Failed"
					/>
				),
				color: Colors.red[600],
				icon: <ErrorIcon />,
				timestamp: Date.now(),
				error: <FormattedMessage id="Request.failed" defaultMessage="Request failed" />,
			};
			NotificationCenter.showNotification(notification);
			addNotification(notification, state);
			return {
				...state,
				counter: state.counter + 1,
				notifications: state.notifications,
			};
		case Actions.SEND_RESTORE_SUCCESS:
			notification = {
				title: (
					<FormattedMessage
						id="Database.Restore.Notification.Success.Title"
						defaultMessage="Restore Successful"
					/>
				),
				message: (
					<FormattedMessage
						id="Database.Restore.Notification.Success.Message"
						defaultMessage="Restore Successful"
					/>
				),
				color: Colors.green[600],
				icon: <InfoIcon />,
				timestamp: Date.now(),
			};
			NotificationCenter.showNotification(notification);
			addNotification(notification, state);
			return {
				...state,
				counter: state.counter + 1,
				notifications: state.notifications,
			};
		case Actions.NOTIFICATIONS_CLEAR:
			return {
				...state,
				notifications: [],
				labels: [],
			};
		default:
			return state;
	}
}
