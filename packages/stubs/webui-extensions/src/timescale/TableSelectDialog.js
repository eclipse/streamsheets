import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';


const requestTableNames = async (machineId) => {
	const type = 'timescale.action.listtables';
	const response = await gatewayClient.sendMachineAction(machineId, { type });
	// verify result
	const { result, error } = response.machineserver;
	if (error) throw new Error('Failed to load table names from machine!');
	if (!result || !result.length) throw new Error('No tables available!');
	return result;
};

const showError = (err) =>
	err ? (
		<FormattedMessage
			id="Timescale.TableSelect.Error.Message"
			defaultMessage="Error: {error}"
			values={{ error: err }}
		/>
	) : null;
const showProgressHint = (doIt) => doIt ? <CircularProgress style={{justifySelf: 'center' }}/> : null;
const showTableList = (doIt, tables, onSelect) =>
	doIt ? (
		<List
			style={{ maxHeight: '250px' }}
			subheader={
				<ListSubheader component="div">
					<FormattedMessage id="Timescale.TableSelect.Tables" defaultMessage="Tables" />
				</ListSubheader>
			}
		>
			{tables.map((tbl) => (
				<ListItem key={tbl} button onClick={() => onSelect(tbl)}>
					<ListItemText primary={tbl} />
				</ListItem>
			))}
		</List>
	) : null;

const TableSelectDialog = (props) => {
	const { machineId, open, onSelect, onClose } = props;
	const [error, setError] = useState('');
	const [tables, setTables] = useState({ all: [], isFetching: false });

	useEffect(() => {
		const requestTables = async () => {
			try {
				setError('');
				setTables({ all: tables.all, isFetching: true });
				const allTables = await requestTableNames(machineId);
				setTables({ all: allTables, isFetching: false });
			} catch(err) {
				setTables({ all: tables.all, isFetching: false });
				setError(err.message);
			}
		}
		if (open) requestTables();
	}, [open])

	return (
		<Dialog open={open}>
			<DialogTitle>
				<FormattedMessage
					id="Timescale.TableSelect.Title"
					defaultMessage="Please select table for Timescale import"
				/>
			</DialogTitle>
			<DialogContent style={{	marginTop: '10px', textAlign: 'center' }} >
				{showError(error)}
				{showProgressHint(tables.isFetching && !error)}
				{showTableList(!tables.isFetching && !error, tables.all, onSelect)}
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={onClose} disabled={tables.isFetching}>
					<FormattedMessage id="Ok" defaultMessage="Ok" />
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TableSelectDialog;
