import React from 'react';
import CanvasComponent from '../Canvas/CanvasComponent';
import MachineLoadingDialog from './MachineLoadingDialog';

export default function MachineDetailComponent() {
	return (
		<div
			style={{
				height: '100%',
				width: '100%',
			}}
		>
			<MachineLoadingDialog />
			<CanvasComponent />
		</div>
	);
}
