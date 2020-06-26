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
import JSG from '@cedalo/jsg-ui';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { intl } from '../../helper/IntlGlobalProvider';
import { useJSGNotification } from './JSGHooks';
		

export default function AlertDialog() {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState('None');
	const [id, setId] = useState(undefined);
	const [messageObject, setMessageObject] = useState();

	const onSheetMessage = (notification) => {
		if (notification.object) {
			try {
				setId(notification.object.message.id);
				setMessage(notification.object.message.message);
				setOpen(true);
				setMessageObject(notification.object.message);
			} catch(e) {
				console.log(e);
			}
		}
	};

	useJSGNotification(JSG.WorksheetView.SHEET_MESSAGE_NOTIFICATION, onSheetMessage);

	const handleClose = () => {
		setOpen(false);
		if (messageObject.focusElement) {
			messageObject.focusElement._ignoreBlur = true;
			const cellEditor = JSG.CellEditor.getActiveCellEditor();
			if (cellEditor) {
				cellEditor.restoreSelection(
					{
						start: messageObject.focusIndex,
						end: messageObject.focusIndex,
					},
					messageObject.focusElement,
				);
			}
			messageObject.focusElement._ignoreBlur = false;
		}
	};

	return (
		<div>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>
					<FormattedMessage id="Alert" defaultMessage="Alert" />
				</DialogTitle>
				<DialogContent
					style={{
						margin: '20px',
					}}
				>
					<DialogContentText>{id ? intl.formatMessage({ id }) : message}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button autoFocus color="primary" onClick={handleClose}>
						<FormattedMessage id="OK" defaultMessage="OK" />
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
