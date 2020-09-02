import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
// import Alert from '@material-ui/lab/Alert';
// import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import JSG from '@cedalo/jsg-ui';
import AlertDialog from '@cedalo/webui/src/components/SheetDialogs/AlertDialog';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { readDroppedFile } from '../helper';


const sendAction = async (machineId, type, data) => {
	const response = await gatewayClient.sendMachineAction(machineId, {
		// action unique type
		type,
		// action dependent data
		data
		// : {
		// 	table: 'table123',
		// 	data: ev.target.result
		// }
	});
	return response.machineserver.result;
};

const TableSelectDialog = (props) => {
	const { open, onSelect, onCancel, onImport, table } = props;
	const [tables, setTables] = useState({ all: [], isFetching: false });

	useEffect(() => {
		const machineId = 'SkZV31LfXv';
		const type = 'timescale.action.listtables';
		const requestTables = async () => {
			try {
				setTables({ all: tables.all, isFetching: true });
				const allTables = await sendAction(machineId, type);
				setTables({ all: allTables, isFetching: false });
			} catch(err) {
				setTables({ all: tables.all, isFetching: false });
			}
		}
		requestTables();
	}, [])

	return (
		<Dialog open={open}>
			<DialogTitle>
				<FormattedMessage
					id="Timescale.TableSelect.Title"
					defaultMessage="Please select table for Timescale import"
				/>
			</DialogTitle>
			<DialogContent
				style={{
					marginTop: '20px'
				}}
			>
				{tables.isFetching ? (<CircularProgress/>) : (
					<List>
						{tables.all.map((tbl) => (
							<ListItem key={tbl} button onClick={() => onSelect(tbl)}>
								<ListItemText primary={tbl} />
							</ListItem>
						))}
					</List>
				)}
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={onCancel}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
				<Button color="primary" onClick={onImport} disabled={!table}>
					<FormattedMessage id="Import.Button.Import" defaultMessage="Import" />
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const sendSheetNotification = (id, message) => {
	JSG.NotificationCenter.getInstance().send(
		new JSG.Notification(JSG.WorksheetView.SHEET_MESSAGE_NOTIFICATION, { message: { id, message } })
	);
};

const TimescaleDropHandler = (props) => {
	const { file } = props;
	const [ open, setOpen ] = useState(true);
	const [ table, setTable ] = useState('');
	const [ dataImport, setDataImport ] = useState({isPending: true, state: 'pending'});

	useEffect(() => {
		const machineId = 'SkZV31LfXv';
		const type = 'timescale.action.import';
		const requestTables = async () => {
			try {
				setDataImport({ state: dataImport.state, isPending: true });
				const filedata = await readDroppedFile(file);
				const data = { table, data: filedata };
				await sendAction(machineId, type, data);
				setDataImport({ state: 'success', isPending: false });
				sendSheetNotification('Import success', 'Successfully imported data');
			} catch(err) {
				setDataImport({ state: 'error', isPending: false });
				sendSheetNotification('Import failed', 'Import failed');
			}
		}
		if (table && !open) {
			requestTables();
		}
	}, [open])

	const onCancel = () => {
		console.log('cancel import');
		setOpen(false);
	};
	const onImport = () => {
		console.log(`import to table: ${table}`);
		setOpen(false);
	};
	const onSelect = (tbl) => {
		console.log(`select: ${tbl}`);
		setTable(tbl);
	};

	return (
		<React.Fragment>
			<TableSelectDialog
				open={open}
				table={table}
				onSelect={onSelect}
				onCancel={onCancel}
				onImport={onImport}
			/>
			<AlertDialog />
		</React.Fragment>
	);
};
export default TimescaleDropHandler;
