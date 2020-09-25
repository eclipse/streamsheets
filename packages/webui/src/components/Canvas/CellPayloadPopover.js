import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import JSG from '@cedalo/jsg-ui';
import store from '../../store';
import { graphManager } from '../../GraphManager';
import gatewayClient from '../../helper/GatewayClient';

const styles = {
	centerItems: {
		width: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
	}
};

const getMachineId = () => {
	const machine = store.getState().monitor.machine;
	return machine && machine.id;
};
const getSheetId = () => {
	const sheetView = graphManager.getActiveSheetView();
	const streamsheet = sheetView.getItem();
	const streamsheetContainer = streamsheet && streamsheet.getStreamSheetContainer();
	return streamsheetContainer && streamsheetContainer instanceof JSG.StreamSheetContainer
		? streamsheetContainer
				.getStreamSheetContainerAttributes()
				.getSheetId()
				.getValue()
		: undefined;
};
const getCellReference = () => {
	const sheetView = graphManager.getActiveSheetView();
	const selection = sheetView.getOwnSelection();
	const selectedRange = selection && selection.getRanges()[0];
	if (selectedRange) {
		const range = selectedRange.copy();
		range.shiftToSheet();
		return range.toString();
	}
	return undefined;
};
const handleResponse = ({ machineserver } = {}) => {
	if (!machineserver || machineserver.error) {
		throw new Error('Failed to fetch cell payload data!');
	}
	return JSON.parse(machineserver.rawvalue);
};
const fetchPayload = async () => {
	const machineId = getMachineId();
	const sheetId = getSheetId();
	const reference = getCellReference();
	if (machineId && sheetId && reference) {
		const response = await gatewayClient.getCellRawValue(machineId, sheetId, reference);
		return handleResponse(response);
	}
	const error = `Required data missing! machine: ${machineId}, streamsheet: ${sheetId}, reference: ${reference}`;
	throw new Error(error);
};

const prettyPrint = (json) => (
	<div style={{ padding: '0px 10px', maxWidth: '300px', maxHeight: '400px', overflow: 'auto'}}>
		<pre>
			<Typography variant="inherit">{JSON.stringify(json, null, 2)}</Typography>
		</pre>
	</div>
);
const showError = (/* error */) => (
	<div style={{ ...styles.centerItems }}>
		<ErrorIcon style={{ color: 'red', width: '36px', height: '36px', marginTop: '15px' }} />
		<Typography style={{ margin: '10px' }}>
			<FormattedMessage id="Request.failed" defaultMessage="Request failed" />
		</Typography>
	</div>
);
const fetchingFeedback = () => (
	<div style={{ ...styles.centerItems, width: '125px', height: '150px' }}>
		<CircularProgress />
	</div>
);
const payloadContent = (payload) => (payload.error ? showError(payload.error) : prettyPrint(payload.json));
const getContent = (payload) =>	payload ? payloadContent(payload) : fetchingFeedback();


const CellPayloadPopover = (props) => {
	const { open, anchor, onClose } = props;
	const [payload, setPayload] = useState(null);

	useEffect(() => {
		const getPayload = async () => {
			try {
				const pl = await fetchPayload();
				setPayload({ json: pl });
			} catch (error) {
				console.error(error);
				setPayload({ error: error.message });
			}
		};
		if (open) {
			getPayload();
			setPayload(null);
		}
	}, [open]);

	return (
		<Popover
			open={open}
			onClose={onClose}
			anchorEl={anchor}
			anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
			transformOrigin={{ vertical: 'top', horizontal: 'left' }}
		>
			{getContent(payload)}
		</Popover>
	);
};

export default CellPayloadPopover;
