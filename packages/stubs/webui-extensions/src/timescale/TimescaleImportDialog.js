import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dropzone from 'react-dropzone';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import { Overlay } from '@cedalo/webui/src/components/HelperComponent/Overlay';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import TableSelectDialog from './TableSelectDialog';
// import { readDroppedFile } from '../helper';


const TYPE = 'TimescaleImport';

const runImportAction = async (machineId, table /* , file */) => {
	const type = 'timescale.action.import';
	const response = await gatewayClient.sendMachineAction(machineId, { type, data: {
		table,
		content: null
	} });
	// const response = await gatewayClient.sendMachineAction(machineId, { type, data: { fail: true } });
	// verify result
	const { result, error } = response.machineserver;
	if (error) throw new Error('Failed to import!');
	return result;
};
const runImportAction2 = () => new Promise((resolve) => setTimeout(resolve, 2000));

const TimescaleImportDialog = (props) => {
	const { machine, open, onClose, info = {} } = props;
	const [tableName, setTableName] = useState(undefined);
	const [importState, setImportState] = useState({ done: true, pending: false, failed: false, success: false });
	const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);

	useEffect(() => {
		const name = info.params ? info.params[0] : undefined;
		setTableName(name);
	}, [props.info]);

	useEffect(() => {
		const doImport = async () => {
			// try {
			// 	setError('');
			// 	setTables({ all: tables.all, isFetching: true });
			// 	const allTables = await requestTableNames(machineId);
			// 	setTables({ all: allTables, isFetching: false });
			// } catch(err) {
			// 	setTables({ all: tables.all, isFetching: false });
			// 	setError(err.message);
			// }
			await runImportAction2();
			setImportState({...importState, pending: false, done: true, success: true });
			// setImportState({...importState, pending: false, done: true, failed: true });
		}
		if (importState.pending) doImport();
	}, [importState]);
	const onDrop = () => null;
	const onCancel = () => onClose(TYPE);
	const onImport = () => setImportState({ ...importState, done: false, pending: true });
	const onTextFieldChange = (ev) => setTableName(ev.target.value.trim());
	const onTableSelect = (table) => setTableName(table);
	const openTableSelect = () => setIsTableSelectOpen(true);
	const closeTableSelect = () => setIsTableSelectOpen(false);
	const handleSuccess = () => {
		setImportState({ done: true, pending: false, failed: false, success: false });
		onClose(TYPE);
	};
	const handleFailed = () => {
		// reset import state
		setImportState({ done: true, pending: false, failed: false, success: false });
	};

	return (
		<React.Fragment>
			<TableSelectDialog
				machineId={machine.id}
				open={isTableSelectOpen}
				onClose={closeTableSelect}
				onSelect={onTableSelect}
			/>
			{importState.pending && !importState.done ? (
				<Overlay>
					<CircularProgress style={{ width: '48px', height: '48px' }} />
				</Overlay>
			) : null}
			{importState.done && importState.success ? (
				<Overlay>
					{/* on success we want to simply close all... */}
					<ClickAwayListener onClickAway={handleSuccess}>
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<CheckIcon style={{ color: 'green', width: '48px', height: '48px' }} />
							<FormattedMessage id="Import.Success" defaultMessage="Import successful!" />
						</div>
					</ClickAwayListener>
				</Overlay>
			) : null}
			{importState.done && importState.failed ? (
				<Overlay>
					<ClickAwayListener onClickAway={handleFailed}>
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<ErrorIcon style={{ color: 'red', width: '48px', height: '48px' }} />
							<FormattedMessage id="Import.Failed" defaultMessage="Import failed!" />
						</div>
					</ClickAwayListener>
				</Overlay>
			) : null}
			<Dialog open={open}>
				<DialogTitle>
					<FormattedMessage id="Timescale.Dialog.Title" defaultMessage="Timescale import" />
				</DialogTitle>
				<DialogContent style={{ marginTop: '10px' }}>
					<FormControl>
						<TextField
							label="Table"
							onChange={onTextFieldChange}
							style={{ margin: 8 }}
							placeholder="Select or specify table for import"
							// helperText="Select or specify table for import"
							fullWidth
							value={tableName}
							margin="normal"
							InputLabelProps={{
								shrink: true
							}}
							InputProps={{
								endAdornment: (
									<Button color="primary" onClick={openTableSelect}>
										<FormattedMessage id="Import.Button.Select" defaultMessage="Select" />
									</Button>
								)
							}}
						/>
						<Dropzone
							onDrop={onDrop}
							// accept={acceptedFileTypes}
							multiple={false}
							// maxSize={imageMaxSize}
							// style={{"width" : "100%", "height" : "500px", "border" : "1px dotted black"}}
							style={{
								flex: 1,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								padding: '10px',
								width: '100%',
								height: '100px',
								borderWidth: '2px',
								borderRadius: '2px',
								borderColor: 'darkgray',
								borderStyle: 'dashed',
								color: 'darkgray',
								backgroundColor: '#fafafa'
							}}
						>
							<FormattedMessage
								id="TimescaleImport.DropFile"
								defaultMessage="Drop file to import here or click to select one"
							/>

							{/* <section className="container">
							<div className="dropzone"> 
								{/* {...getRootProps({ className: 'dropzone' })}> */}
							{/* <input {...getInputProps()} /> */}
							{/* <p>Drop file to import here or click to select one</p> */}
							{/* <p style={{ backgroundColor: '#fafafa', height: '100px' }}>
								<FormattedMessage
									id="TimescaleImport.DropFile"
									defaultMessage="Drop file to import here or click to select one"
								/>
							</p> */}
							{/* </div>
						</section> */}
						</Dropzone>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={onCancel}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button color="primary" onClick={onImport} disabled={!tableName}>
						<FormattedMessage id="Import.Button.Import" defaultMessage="Import" />
					</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
TimescaleImportDialog.TYPE = TYPE;

function mapStateToProps(state) {
	return {
		machine: state.monitor.machine,
	};
}
// export default TimescaleImportDialog;
export default connect(mapStateToProps)(TimescaleImportDialog);