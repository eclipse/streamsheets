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
import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';

import JSG from '@cedalo/jsg-ui';
import { graphManager } from '../../GraphManager';
import { useJSGNotification } from './JSGHooks';

export default function DecisionDialog() {
	const [open, setOpen] = useState(false);
	const [clipData, setClipData] = useState(null);

	const onSheetMessage = (notification) => {
		if (notification.object && notification.object.action === 'pastecells') {
			setOpen(true);
			setClipData(JSG.clipSheet.data);
		}
	};

	useJSGNotification(JSG.WorksheetView.SHEET_ACTION_NOTIFICATION, onSheetMessage);

	const handleClose = () => {
		setOpen(false);
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			sheetView.pasteFromClipboard(
				graphManager.getGraphEditor().getGraphViewer(),
				sheetView._clipTarget,
				clipData,
				'all',
				false,
				true,
			);
		}
	};

	const handleCancel = () => setOpen(false);

	return (
		<div>
			<Dialog open={open} onClose={handleCancel} /* onEscapeKeyDown={handleCancel} */>
				<DialogTitle>
					<FormattedMessage id="Warning" defaultMessage="Warning" />
				</DialogTitle>
				<DialogContent
					style={{
						margin: '20px'
					}}
				>
					<DialogContentText>
						<FormattedMessage
							id="PasteOverwrite"
							defaultMessage="The target range contains values! Do you want to overwrite these?"
						/>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={handleCancel}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button autoFocus color="primary" onClick={handleClose}>
						<FormattedMessage id="OK" defaultMessage="OK" />
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
