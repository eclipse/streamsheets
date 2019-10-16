import { Button, TableCell, Tooltip } from '@material-ui/core';
import * as Colors from '@material-ui/core/colors';
import Fab from '@material-ui/core/Fab';
import ExportIcon from '@material-ui/icons/CloudUpload';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import ResourceFilter from '../base/listing/ResourceFilter';
import ExportDialog from './ExportDialog';
import ExportTable from './ExportTable';
import ImportDropzone from './ImportDropzone';
import { Restricted } from '../HelperComponent/Restricted';
import { RESOURCE_TYPES, RESOURCE_ACTIONS } from '../../helper/AccessManager';

const findMissingConnectors = (streamIds, streamsToExport) =>
	Array.from(
		new Set(
			streamsToExport
				.map((stream) => stream.connector && stream.connector.id)
				.filter((id) => !!id)
				.filter((id) => !streamIds.includes(id)),
		),
	);

const resolveStreams = (streamIds, streams) =>
	streamIds.map((id) => streams.find((stream) => stream.id === id)).filter((stream) => !!stream);

const getMachines = (props) => {
	const { machines } = props;
	if (machines.isFetching || machines.receivedAt === 0) {
		return [];
	}
	const machineData = machines.data || [];
	return machineData;
};

const flatten = (arrays) => [].concat(...arrays);

const getStreams = (props) => {
	const { streams } = props;
	if (streams.fetching) {
		return [];
	}
	const { connectors, consumers, producers } = streams;
	return [...connectors, ...consumers, ...producers];
};

const sort = (resources) => resources.sort((r1, r2) => r1.name.localeCompare(r2.name));

const setToggle = (set, value) => (set.has(value) ? set.delete(value) : set.add(value));

const setAddAll = (set, values) => new Set([...set, ...values]);

const setDeleteAll = (set, values) => {
	values.forEach((value) => set.delete(value));
	return set;
};

const limitSelectedToFiltered = (selectedSet, ids) => new Set([...selectedSet].filter((v) => ids.includes(v)));

const getReferencedStreams = (machine) => {
	const referencedStreamsArray = [].concat(
		...machine.streamsheets.map((t) => {
			const cells = Object.values(t.sheet.cells);
			const cellStreamRefs = flatten(cells.filter((c) => !!c.references).map((c) => c.references))
				.filter((ref) => ref.startsWith('|'))
				.map((ref) => machine.namedCells[ref])
				.filter((stream) => stream !== undefined)
				.map((stream) => stream.value && stream.value.id);

			const inboxStream = t.inbox.stream;
			const inboxStreamRef = inboxStream && inboxStream.id ? [inboxStream.id] : [];
			return [...cellStreamRefs, ...inboxStreamRef];
		}),
	);
	return new Set(referencedStreamsArray);
};

const resolveWithDependencies = (streams, stream) => {
	if (stream.connector) {
		return [stream.id, stream.connector.id];
	} else if (Array.isArray(stream.consumers)) {
		return [stream.id].concat(
			...stream.consumers.map((streamRef) => {
				const consumer = streams.find((s) => s.id === streamRef.id);
				return resolveWithDependencies(streams, consumer);
			}),
		);
	}
	return [stream.id];
};

const DS_CLASS_NAME_MAPPING = {
	ProducerConfiguration: 'Stream.Producer',
	ConnectorConfiguration: 'Stream.Connector',
	ConsumerConfiguration: 'Stream.Consumer',
};

const prepareForDisplay = (resources, filterFunction) =>
	sort(filterFunction(resources));
class ExportComponent extends React.Component {
	static getDerivedStateFromProps(nextProps, prevState) {
		const { filterFunction } = prevState;
		const filteredMachines = prepareForDisplay(getMachines(nextProps), filterFunction);
		const filteredStreams = prepareForDisplay(getStreams(nextProps), filterFunction);

		return { filteredMachines, filteredStreams };
	}

	constructor(props) {
		super(props);
		this.state = {
			// eslint-disable-next-line
			filterFunction: (r) => r,
			selectedStreams: new Set(),
			filteredMachines: getMachines(props),
			filteredStreams: getStreams(props),
			showDialog: false,
		};
	}

	onUpdateFilter = (filterFunction) => {
		const filteredMachines = prepareForDisplay(getMachines(this.props), filterFunction);
		const filteredStreams = prepareForDisplay(getStreams(this.props), filterFunction);
		this.setState({
			filteredMachines,
			filteredStreams,
			// eslint-disable-next-line
			filterFunction,
		});
	};

	onSelectMachine = (machineId) => {
		this.props.toggleMachineForExport(machineId);
	};

	onSelectStream = (streamId) => {
		const { selectedStreams } = this.state;
		setToggle(selectedStreams, streamId);
		this.setState({ selectedStreams });
	};

	onSelectAllMachines = (event) => {
		const { filteredMachines } = this.state;
		const currentMachineIds = filteredMachines.map((m) => m.id);
		if (event.target.checked) {
			this.props.selectMachinesForExport(currentMachineIds);
		} else {
			this.props.deselectMachinesForExport(currentMachineIds);
		}
	};

	onSelectAllStreams = (event) => {
		const { selectedStreams, filteredStreams } = this.state;
		const currentStreamIds = filteredStreams.map((m) => m.id);
		const updatedSelection = event.target.checked
			? setAddAll(selectedStreams, currentStreamIds)
			: setDeleteAll(selectedStreams, currentStreamIds);

		this.setState({ selectedStreams: updatedSelection });
	};

	onSelectLinkedStreams = (machineId) => {
		const { filteredMachines } = this.state;
		const machine = filteredMachines.find((m) => m.id === machineId);
		if (machine) {
			const { selectedStreams } = this.state;
			const referencedStreams = getReferencedStreams(machine);

			const allStreams = getStreams(this.props);

			const existingReferences = allStreams.filter((stream) => referencedStreams.has(stream.id));
			const referencesWithDependencies = [].concat(
				...existingReferences.map((stream) => resolveWithDependencies(allStreams, stream)),
			);

			const updatedSelection = setAddAll(selectedStreams, referencesWithDependencies);
			this.setState({ selectedStreams: updatedSelection });
		}
	};

	onExport = async (event, fileName) => {
		const { selectedStreams } = this.state;
		const { selectedMachines } = this.props;
		if (selectedStreams.size === 0 && selectedMachines.size === 0) {
			return;
		}
		// TODO: should be part of exportMachineStreamDefinitions result
		// as soon as migration to graphql is done
		const streamIds = [...selectedStreams];
		const streams = getStreams(this.props);
		const streamsToExport = resolveStreams(streamIds, streams);

		const missingConnectorIds = findMissingConnectors(streamIds, streamsToExport);
		const missingConnectors = resolveStreams(missingConnectorIds, streams);
		const exportedStreams = [...streamsToExport, ...missingConnectors];
		exportedStreams.forEach((stream) => {
			// TODO: Should not be part of the result.
			delete stream.status;
		});

		this.props.doExport([...selectedMachines], exportedStreams, fileName);
	};

	getStreamTypeName = (stream) => {
		const id = DS_CLASS_NAME_MAPPING[stream.className];
		return this.props.intl.formatMessage({ id, defaultMessage: '' });
	};

	hideDialog = () => {
		this.setState({ showDialog: false });
	};

	showDialog = () => {
		this.setState({ showDialog: true });
	};

	selectLinkedStreamsColumn = {
		header: (
			<Restricted type={RESOURCE_TYPES.STREAM} action={RESOURCE_ACTIONS.VIEW}>
				<TableCell key="linkedStreamsButton" />
			</Restricted>
		),
		cellCreator: (resource) => (
			<Restricted type={RESOURCE_TYPES.STREAM} action={RESOURCE_ACTIONS.VIEW}>
				<TableCell key="linkedStreamsButton">
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
								this.onSelectLinkedStreams(resource.id);
							}}
							variant="contained"
						>
							<FormattedMessage id="Export.SelectStreams" defaultMessage="Select Streams" />
						</Button>
					</Tooltip>
				</TableCell>
			</Restricted>
		),
	};

	streamTypeColumn = {
		header: <TableCell key="typeName">Type</TableCell>,
		cellCreator: (resource) => {
			const typeName = this.getStreamTypeName(resource);
			return <TableCell key="typeName">{typeName}</TableCell>;
		},
	};

	defaultFileName = () => {
		if (this.props.selectedMachines.size === 1) {
			const selectedMachineId = [...this.props.selectedMachines][0];
			const selectedMachine = getMachines(this.props).find((m) => m.id === selectedMachineId);
			return selectedMachine && selectedMachine.name;
		} else if (this.props.selectedMachines.size === 0 && this.state.selectedStreams.size === 1) {
			const selectedStreamId = [...this.state.selectedStreams][0];
			const selectedStream = getStreams(this.props).find((stream) => stream.id === selectedStreamId);
			return selectedStream && selectedStream.name;
		}
		return undefined;
	};

	render() {
		const machines = this.state.filteredMachines;
		const streams = this.state.filteredStreams;
		const streamIds = streams.map((stream) => stream.id);
		const machineIds = machines.map((m) => m.id);
		const selectedStreams = limitSelectedToFiltered(this.state.selectedStreams, streamIds);
		const selectedMachines = limitSelectedToFiltered(this.props.selectedMachines, machineIds);
		return (
			<ImportDropzone>
				<div
					style={{
						display: 'flex',
						flexFlow: 'column',
						height: '100%',
						position: 'relative',
					}}
				>
					{this.state.showDialog && (
						<ExportDialog
							open
							onCancel={this.hideDialog}
							onConfirm={(event, name) => {
								this.hideDialog();
								this.onExport(event, name);
							}}
							fileName={this.defaultFileName()}
						/>
					)}
					<Fab
						variant="fab"
						color="default"
						style={{
							position: 'absolute',
							right: '48px',
							bottom: '48px',
							backgroundColor: Colors.blue[800],
							color: 'white',
						}}
						onClick={this.showDialog}
					>
						<ExportIcon />
					</Fab>
					<ResourceFilter filterName onUpdateFilter={this.onUpdateFilter} />
					<div
						style={{
							flexGrow: 1,
							height: 'inherit',
							display: 'flex',
							width: '100%',
							justifyContent: 'space-around',
							flexWrap: 'wrap',
							overflowY: 'auto',
						}}
					>
						<Restricted type={RESOURCE_TYPES.MACHINE} action={RESOURCE_ACTIONS.VIEW}>
							<div
								style={{
									padding: '16px',
									flexGrow: 1,
									minWidth: '500px',
								}}
							>
								<h2
									style={{
										display: 'inline-flex',
									}}
								>
									<FormattedMessage id="Export.List.Machines.Title" defaultMessage="Machines" />
								</h2>
								<ExportTable
									resources={machines}
									selected={selectedMachines}
									onSelectAll={this.onSelectAllMachines}
									onSelect={this.onSelectMachine}
									columns={[this.selectLinkedStreamsColumn]}
								/>
							</div>
						</Restricted>
						<Restricted type={RESOURCE_TYPES.STREAM} action={RESOURCE_ACTIONS.VIEW}>
							<div
								style={{
									padding: '16px',
									flexGrow: 1,
									minWidth: '500px',
								}}
							>
								<h2
									style={{
										display: 'inline-flex',
									}}
								>
									<FormattedMessage id="Export.List.Streams.Title" defaultMessage="Streams" />
								</h2>

								<ExportTable
									resources={streams}
									selected={selectedStreams}
									onSelectAll={this.onSelectAllStreams}
									onSelect={this.onSelectStream}
									columns={[this.streamTypeColumn]}
								/>
							</div>
						</Restricted>
					</div>
				</div>
			</ImportDropzone>
		);
	}
}
ExportComponent.propTypes = {
	// eslint-disable-next-line react/no-typos
	intl: intlShape.isRequired,
	// eslint-disable-next-line
	machines: PropTypes.object.isRequired,
	// eslint-disable-next-line
	streams: PropTypes.object.isRequired,
	// eslint-disable-next-line
	selectedMachines: PropTypes.instanceOf(Set).isRequired,
	selectMachinesForExport: PropTypes.func.isRequired,
	deselectMachinesForExport: PropTypes.func.isRequired,
	toggleMachineForExport: PropTypes.func.isRequired,
	doExport: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
	return {
		machines: state.machines,
		streams: state.streams,
		selectedMachines: state.export.selectedMachines,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	connect(
		mapStateToProps,
		mapDispatchToProps,
	)(ExportComponent),
);
