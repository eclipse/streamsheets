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
import CanvasComponent from '../Canvas/CanvasComponent';
import MachineLoadingDialog from './MachineLoadingDialog';

export default function MachineDetailComponent(props) {
	return (
		<div
			style={{
				height: '100%',
				width: '100%',
			}}
		>
			<MachineLoadingDialog />
			<CanvasComponent canEditMachine={props.canEditMachine} />
		</div>
	);
}
