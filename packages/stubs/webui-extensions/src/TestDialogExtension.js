import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '@cedalo/webui/src/actions/actions';
import { useJSGNotification } from '@cedalo/webui/src/components/SheetDialogs/JSGHooks';
// import { MachineDataDialogs } from './machinedata/MachineDataDownloader';
import TimescaleImportDialog from './timescale/TimescaleImportDialog'

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

const TestDialogExtensions = connect(
	(state) => ({ appState: state.appState }),
	mapDispatchToProps
)(({ appState, setAppState }) => {
	const [dialogState, setDialogState] = useState({
		[TimescaleImportDialog.TYPE]: false
	});
	const [dialogInfo, setDialogInfo] = useState({});
	// const showDialog = (type) => {
	// 	const newState = { [`showDialog${type}`]: true };
	// 	setAppState(newState)
	// };
	// const openDialog = (type) => {

	// };
	const onClose = (type) => {
		setDialogState({ [type]: false });
	}
	const onOpen = (type) => {
		setDialogState({ [type]: true });
	}
	const onShowTimescaleImportDialog = (notification = {}) => {
		console.log('handle timescale import...');
		// showDialog('TimescaleImport');
		setDialogInfo({[TimescaleImportDialog.TYPE]: notification.object})
		onOpen(TimescaleImportDialog.TYPE);
	};

	// useJSGNotification('showFileDialog', onShowFileDialog);
	// useJSGNotification('showDialog:File', onShowFileDialog);
	useJSGNotification('showDialog:TimescaleImport', onShowTimescaleImportDialog);

	return (
		<React.Fragment>
			{/* <MachineDataDialog open={appState.showMachineDataDialog} /> */}
			{/* <TimescaleImportDialog open={appState.showDialogTimescaleImport} /> */}
			<TimescaleImportDialog
				open={dialogState[TimescaleImportDialog.TYPE]}
				info={dialogInfo[TimescaleImportDialog.TYPE]}
				onClose={onClose}
			/>
		</React.Fragment>
	);
});
export default TestDialogExtensions;