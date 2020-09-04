import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dropzone from 'react-dropzone';
// import Alert from '@material-ui/lab/Alert';
// import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import TableSelectDialog from './TableSelectDialog'

// import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
// import { readDroppedFile } from '../helper';


const TYPE = 'TimescaleImport';
const TimescaleImportDialog = (props) => {
	const { machine, open, onClose, info = {} } = props;
	const [tableName, setTableName] = useState(undefined);
	const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);
	useEffect(() => {
		const name = info.params ? info.params[0] : undefined;
		setTableName(name);
	}, [props.info]);
	const onCancel = () => onClose(TYPE);
	const onImport = () => null;
	const onTextFieldChange = (ev) => setTableName(ev.target.value.trim());
	const onDrop = () => null;
	const onTableSelect = (table) => setTableName(table);
	const openTableSelect = () => setIsTableSelectOpen(true);
	const closeTableSelect = () => setIsTableSelectOpen(false);

	return (
		<React.Fragment>
			<TableSelectDialog
				machineId={machine.id}
				open={isTableSelectOpen}
				onClose={closeTableSelect}
				onSelect={onTableSelect}
			/>
			<Dialog open={open}>
				<DialogTitle>
					<FormattedMessage id="Timescale.Dialog.Title" defaultMessage="Timescale import" />
				</DialogTitle>
				<DialogContent style={{ marginTop: '10px' }}>
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
							width: '100%',
							height: '250px',
							borderWidth: '2px',
							borderColor: 'rgb(102, 102, 102)',
							borderStyle: 'dashed',
							borderRadius: '5px',
							textAlign: 'center',
							verticalAlign: 'center',
							alignItems: 'center'
						}}
					>
						<p>
							<FormattedMessage
								id="TimescaleImport.DropFile"
								defaultMessage="Drop file to import here or click to upload"
							/>
						</p>
					</Dropzone>
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