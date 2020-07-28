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
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';
import ExportIcon from '@material-ui/icons/CloudUpload';
import { saveAs } from 'file-saver';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { notifyExportFailed } from '../../actions/actions';
import gatewayClient from '../../helper/GatewayClient';
import { useGraphQL } from '../../helper/Hooks';
import { Restricted, NotAllowed } from '../HelperComponent/Restricted';
import ExportDialog from './ExportDialog';
import ExportTable from './ExportTable';
import ImportDropzone from './ImportDropzone';
import Wall from '../HelperComponent/Wall';
import Typography from '@material-ui/core/Typography';

const TABLE_QUERY = `
	query ExportTable($scope: ScopeInput!) {
		scoped(scope: $scope){
			machines {
				id
				name
				referencedStreams
			}
	
			streams {
				id
				name
				type
				connector {
					id
				}
			}
	
			connectors {
				name
				id
				type
			}
		}
	}
`;

const EXPORT_QUERY = `
	query Export($scope: ScopeInput!, $machines: [ID!]!, $streams: [ID!]!) {
		scoped(scope: $scope) {
			export(machines: $machines, streams: $streams) {
				data
				success
			}
		}
	}
`;

const doExport = async (scope, machines, streams, fileName) => {
	try {
		const { scoped } = await gatewayClient.graphql(EXPORT_QUERY, { machines, streams, scope });
		if (scoped.export.success) {
			const blob = new Blob([JSON.stringify(scoped.export.data, null, 2)], {
				type: 'text/plain;charset=utf8;'
			});
			saveAs(blob, fileName);
			return true;
		}
	} catch (error) {
		console.error(error);
	}
	return false;
};

const selectionArray = (selectionObject) =>
	Object.entries(selectionObject)
		.filter(([, v]) => v === true)
		.map(([k]) => k);

const selectionCount = (selectionObject) => selectionArray(selectionObject).length;

const isSelectionEmpty = (selectionObject) => selectionCount(selectionObject) === 0;

const toggleSelection = (selectionObject, key) => ({ ...selectionObject, [key]: !selectionObject[key] });

const defaultFileName = (machines, selectedMachines, streams, selectedStreams) => {
	if (selectionCount(selectedMachines) === 1) {
		const selectedMachine = selectionArray(selectedMachines)[0];
		const machine = machines.find((m) => m.id === selectedMachine);
		return machine && machine.name;
	} else if (isSelectionEmpty(selectedMachines) && selectionCount(selectedStreams) === 1) {
		const selectedStream = selectionArray(selectedStreams)[0];
		const stream = streams.find((s) => s.id === selectedStream);
		return stream && stream.name;
	}
	return undefined;
};

const sort = (resources) => resources.sort((r1, r2) => r1.name.localeCompare(r2.name));

const StreamType = ({ stream }) => {
	switch (stream.type) {
		case 'producer':
			return <FormattedMessage id="Stream.Producer" defaultMessage="Producer" />;
		case 'consumer':
			return <FormattedMessage id="Stream.Consumer" defaultMessage="Consumer" />;
		case 'connector':
			return <FormattedMessage id="Stream.Connector" defaultMessage="Connector" />;
		default:
			return '';
	}
};

StreamType.propTypes = {
	stream: PropTypes.shape({
		type: PropTypes.string
	}).isRequired
};

const streamWithConnector = (streams, streamId) => {
	const stream = streams.find((s) => s.id === streamId);
	return stream ? { [stream.id]: true, [stream.connector.id]: true } : {};
};

// const identity = (x) => x;

const ExportComponent = (props) => {
	const { scope, filter } = props;
	const { data /* errors, loading */ } = useGraphQL(TABLE_QUERY, { scope }, [scope.id]);
	const streams = data ? data.scoped.streams : [];
	const connectors = data ? data.scoped.connectors : [];
	const machines = data ? data.scoped.machines : [];

	const [selectedMachines, setSelectedMachines] = useState(props.initialMachineSelection);
	const [selectedStreams, setSelectedStreams] = useState({});
	const [showDialog, setShowDialog] = useState(false);

	const sortedStreams = useMemo(() => sort([...streams, ...connectors]), [streams, connectors]);
	const sortedMachines = useMemo(() => sort(machines), [machines]);

	const filteredMachines =
		filter.length > 0
			? sortedMachines.filter((resource) => resource.name.toLowerCase().includes(filter.toLowerCase()))
			: sortedMachines;
	const filteredStreams =
		filter.length > 0
			? sortedStreams.filter((resource) => resource.name.toLowerCase().includes(filter.toLowerCase()))
			: sortedStreams;

	// const filteredStreams = useMemo(() => filter.func(sortedStreams), [filter, sortedStreams]);
	// const filteredMachines = useMemo(() => {
	// 	return filter.func(sortedMachines);
	// }, [filter, sortedMachines]);

	const selectLinkedStreams = (machineId) => {
		const machine = data.scoped.machines.find((m) => m.id === machineId);
		if (machine) {
			const newSelection = machine.referencedStreams.reduce(
				(acc, cur) => ({ ...acc, ...streamWithConnector(data.scoped.streams, cur) }),
				{}
			);
			setSelectedStreams({ ...selectedStreams, ...newSelection });
		}
	};

	const toggleStream = (streamId) => {
		setSelectedStreams(toggleSelection(selectedStreams, streamId));
	};

	const toggleMachine = (machineId) => {
		setSelectedMachines(toggleSelection(selectedMachines, machineId));
	};

	const toggleAllStreams = (event) => {
		const isSelected = event.target.checked;
		const selectionUpdate = filteredStreams.reduce((acc, cur) => ({ ...acc, [cur.id]: isSelected }), {});
		setSelectedStreams({ ...selectedStreams, ...selectionUpdate });
	};

	const toggleAllMachines = (event) => {
		const isSelected = event.target.checked;
		const selectionUpdate = filteredMachines.reduce((acc, cur) => ({ ...acc, [cur.id]: isSelected }), {});
		setSelectedMachines({ ...selectedMachines, ...selectionUpdate });
	};

	const onConfirmExport = async (event, filename) => {
		setShowDialog(false);
		const machinesToExport = selectionArray(selectedMachines);
		const streamsToExport = selectionArray(selectedStreams);
		const success = await doExport(props.scope, machinesToExport, streamsToExport, filename);
		if (!success) {
			props.notifyExportFailed();
		}
	};

	const onExportButton = async () => {
		if (selectionCount(selectedStreams) === 0 && selectionCount(selectedMachines) === 0) {
			return;
		}
		setShowDialog(true);
	};

	const selectLinkedStreamsColumn = {
		header: (
			<Restricted all={['stream']} key="selecteLinked">
				<TableCell />
			</Restricted>
		),
		cellCreator: (resource) => (
			<Restricted all={['stream']} key="selecteLinked">
				<TableCell>
					<Tooltip
						enterDelay={300}
						title={
							<FormattedMessage
								id="Export.SelectStreams.Tooltip"
								defaultMessage="Select streams used by the machine"
							/>
						}
					>
						<Button
							// className={classes.toolIconDark}
							onClick={(event) => {
								event.stopPropagation();
								selectLinkedStreams(resource.id);
							}}
							variant="contained"
						>
							<FormattedMessage id="Export.SelectStreams" defaultMessage="Select Streams" />
						</Button>
					</Tooltip>
				</TableCell>
			</Restricted>
		)
	};

	const streamTypeColumn = {
		header: <TableCell key="type">Type</TableCell>,
		cellCreator: (resource) => (
			<TableCell key="type">
				<StreamType stream={resource} />
			</TableCell>
		)
	};

	return (
		<Restricted oneOf={['machine.view', 'stream']}>
			<NotAllowed>
				<div
					style={{
						fontSize: '2rem',
						textAlign: 'center',
						color: 'red',
						// border: 'red dotted',
						padding: '5px',
						margin: '50px'
					}}
				>
					<FormattedMessage id="Admin.notAuthorized" defaultMessage="Not Authorized" />
				</div>
			</NotAllowed>
			<ImportDropzone>
				<Wall>
				<div
					style={{
						display: 'flex',
						flexFlow: 'column',
						height: '100%',
						position: 'relative'
					}}
				>
					{showDialog && (
						<ExportDialog
							open
							onCancel={() => setShowDialog(false)}
							onConfirm={onConfirmExport}
							fileName={defaultFileName(sortedMachines, selectedMachines, sortedStreams, selectedStreams)}
						/>
					)}
					<Fab
						variant="round"
						color="primary"
						style={{
							position: 'absolute',
							right: '48px',
							bottom: '48px',
							color: 'white'
						}}
						onClick={onExportButton}
					>
						<ExportIcon />
					</Fab>
					<div
						style={{
							flexGrow: 1,
							height: 'inherit',
							display: 'flex',
							width: '100%',
							justifyContent: 'space-around',
							flexWrap: 'wrap',
							overflowY: 'auto'
						}}
					>
						<Restricted all={['machine.view']}>
							<div
								style={{
									padding: '16px',
									flexGrow: 1,
									minWidth: '500px'
								}}
							>
								<Typography variant="h5">
									<FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
								</Typography>
								<ExportTable
									resources={filteredMachines}
									selected={selectedMachines}
									onSelectAll={toggleAllMachines}
									onSelect={toggleMachine}
									columns={[selectLinkedStreamsColumn]}
								/>
							</div>
						</Restricted>
						<Restricted all={['stream']}>
							<div
								style={{
									padding: '16px',
									flexGrow: 1,
									minWidth: '500px'
								}}
							>
								<Typography variant="h5">
									<FormattedMessage id="Export.List.Streams.Title" defaultMessage="Streams" />
								</Typography>

								<ExportTable
									resources={filteredStreams}
									selected={selectedStreams}
									onSelectAll={toggleAllStreams}
									onSelect={toggleStream}
									columns={[streamTypeColumn]}
								/>
							</div>
						</Restricted>
					</div>
				</div>
				</Wall>
			</ImportDropzone>
		</Restricted>
	);
};

function mapStateToProps(state) {
	const [, , initialMachine] = state.router.location.pathname.split('/');
	const initialMachineSelection = initialMachine ? { [initialMachine]: true } : {};
	return {
		initialMachineSelection,
		scope: state.user.user.scope
	};
}

const mapDispatchToProps = {
	notifyExportFailed
};

export default connect(mapStateToProps, mapDispatchToProps)(ExportComponent);
