import React, { useEffect, useState } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import JSG from '@cedalo/jsg-ui';
import store from '../../store';
import { graphManager } from '../../GraphManager';
import gatewayClient from '../../helper/GatewayClient';

const TEST_JSON = {
	"devices": [
		{
			"DeviceID": "1",
			// "DeviceName": "cedalo-device",
			"DeviceName": "cedalo-device really long name. to test the bounds and to check if we have to set max width",
			"Settings": {
				"Interval": true,
				"IntervalCycle": 110
			},
			"Battery": 100,
			"Acceleration": {
				"LinearX": 0,
				"LinearY": 0,
				"LinearZ": 0
			},
			"Proximity": false,
			"Magneticfield": {
				"AxisX": 0,
				"AxisY": 0,
				"AxisZ": 0
			},
			"Orientation": {
				"Yaw": -3,
				"Pitch": -2,
				"Roll": 8
			},
			"Rotation": {
				"RotationRoll": 0,	
				"RotationPitch": 1,	
				"RotationYaw": 0	
			},
			"GPS": {
				"Altitude": 0,
				"Latitude": 0,
				"Longitude": 0
			},
			"Gravity": {
				"GravityX": 8,
				"GravityY": 2,
				"GravityZ": -56
			},
			"Array": [
				"Hello",
				"World",
				"!!"
			]
		
		},
		{
			"DeviceID": "2",
			"DeviceName": "cedalo-device",
			"Settings": {
				"Interval": true,
				"IntervalCycle": 110
			},
			"Battery": 100,
			"Acceleration": {
				"LinearX": 0,
				"LinearY": 0,
				"LinearZ": 0
			},
			"Proximity": false,
			"Magneticfield": {
				"AxisX": 0,
				"AxisY": 0,
				"AxisZ": 0
			},
			"Orientation": {
				"Yaw": -3,
				"Pitch": -2,
				"Roll": 8
			},
			"Rotation": {
				"RotationRoll": 0,	
				"RotationPitch": 1,	
				"RotationYaw": 0	
			},
			"GPS": {
				"Altitude": 0,
				"Latitude": 0,
				"Longitude": 0
			},
			"Gravity": {
				"GravityX": 8,
				"GravityY": 2,
				"GravityZ": -56
			},
			"Array": [
				"Hello",
				"World",
				"!!"
			]
		
		}
	]
}
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
	const streamsheetId = getSheetId();
	const reference = getCellReference();
	if (reference) return TEST_JSON;
	if (machineId && streamsheetId && !reference) {
		const response = await gatewayClient.getCellRawValue(machineId, streamsheetId, reference);
		return handleResponse(response);
	}
	throw new Error(
		`Required data missing! machineId: ${machineId}, streamsheetId: ${streamsheetId}, reference: ${reference}`
	);
};

const prettyPrint = (json) => <Typography><pre>{JSON.stringify(json, null, 2)}</pre></Typography>
// const prettyPrint = (json) => <pre><Typography>{JSON.stringify(json, null, 2)}</Typography></pre>

const showError = (error) => (
	<div
		style={{
			margin: '10px',
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center'
		}}
	>
		<ErrorIcon style={{ color: 'red', width: '36px', height: '36px', paddingRight: '5px' }} />
		<Typography style={{ marginTop: '5px' }}>{error}</Typography>
		{/* <Typography style={{ wordWrap: 'break-word'}}>{error}</Typography> */}
	</div>
);

const fetchingFeedback = () => (
	<div
		style={{
			width: '100%',
			height: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		}}
	>
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
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'left'
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'left'
			}}
			// style={{
			// 	minWidth: '100px',
			// 	maxWidth: '300px',
			// 	minHeight: '200px',
			// 	maxHeight: '400px',
			// 	overflowX: 'auto',
			// 	// whiteSpace: 'nowrap'
			// }}
		>
			<div
				style={{
					minWidth: '100px',
					maxWidth: '300px',
					minHeight: '200px',
					maxHeight: '400px',
					overflowX: 'auto',
					// whiteSpace: 'nowrap'
				}}
			>
				{getContent(payload)}
			</div>
		</Popover>
	);
};

export default CellPayloadPopover;
