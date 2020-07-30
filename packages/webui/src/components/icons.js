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
/* eslint-disable import/prefer-default-export */
import IconLabel from '@material-ui/icons/Label';
import IconSecurity from '@material-ui/icons/VerifiedUser';
import IconConnector from '@material-ui/icons/SettingsInputComposite';
import IconMachine from '@material-ui/icons/Business';
import IconStream from '@material-ui/icons/CompareArrows';
import IconConsumer from '@material-ui/icons/Input';
import IconProducer from '@material-ui/icons/SettingsRemote';
import IconQueue from '@material-ui/icons/QueuePlayNext';
import IconAddMachine from '@material-ui/icons/Add';
import IconPlay from '@material-ui/icons/PlayArrow';
import IconStop from '@material-ui/icons/Stop';
import IconPause from '@material-ui/icons/Pause';
import IconDelete from '@material-ui/icons/Delete';
import IconReload from '@material-ui/icons/Autorenew';
import IconClose from '@material-ui/icons/Close';
import IconChecked from '@material-ui/icons/CheckCircle';
import IconUser from '@material-ui/icons/Person';
import IconSave from '@material-ui/icons/Save';
import IconEdit from '@material-ui/icons/Edit';
import IconOrganize from '@material-ui/icons/GroupWork';
import SvgIcon from '@material-ui/core/SvgIcon';
import React from 'react';

export function IconCopy() {
	return (<SvgIcon>
		<path
			d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
		/>
	</SvgIcon>);
}

export function IconCut() {
	return (<SvgIcon>
		<path
			d="M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z"
		/>
	</SvgIcon>);
}

export function IconPaste() {
	return (<SvgIcon>
		<path
			d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"
		/>
	</SvgIcon>);
}

export {
	IconEdit,
	IconLabel,
	IconSecurity,
	IconConsumer,
	IconConnector,
	IconMachine,
	IconQueue,
	IconAddMachine,
	IconPlay,
	IconStop,
	IconPause,
	IconDelete,
	IconReload,
	IconClose,
	IconChecked,
	IconUser,
	IconSave,
	IconOrganize,
	IconProducer,
	IconStream,
};

