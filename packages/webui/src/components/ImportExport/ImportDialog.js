import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import VersionUpgrade from '@material-ui/icons/ArrowUpward';
import ImportSuccess from '@material-ui/icons/Check';
import ImportError from '@material-ui/icons/Error';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';

const entityShape = PropTypes.shape({ id: PropTypes.string, name: PropTypes.string });

const UpgradeIcon = () => (
	<Tooltip
		enterDelay={300}
		title={
			<FormattedMessage
				id="Import.Icon.Update.Tooltip"
				defaultMessage="Updates an existing machine."
			/>
		}
	>
		<VersionUpgrade style={{ fontSize: '16px' }} />
	</Tooltip>
);

const ImportSelect = ({ selection, isUpgrade, onChange, show, isStream }) =>
	show && selection !== undefined ? (
		<Select value={selection} onChange={(event) => onChange(event)}>
			<MenuItem value={0}>
				<FormattedMessage id="Import.Select.DontImport" defaultMessage="Dont Import" />
			</MenuItem>
			{isUpgrade ? (
				[
					!isStream && (
						<MenuItem key="import" value={2}>
							<FormattedMessage id="Import.Select.Import" defaultMessage="Import" />
						</MenuItem>
					),
					<MenuItem key="importAndUpdate" value={1}>
						<FormattedMessage
							id="Import.Select.ImportAndUpdate"
							defaultMessage="Import + Update Existing"
						/>
					</MenuItem>,
				]
			) : (
				<MenuItem value={1}>
					<FormattedMessage id="Import.Select.Import" defaultMessage="Import" />
				</MenuItem>
			)}
		</Select>
	) : null;

ImportSelect.propTypes = {
	selection: PropTypes.number.isRequired,
	isUpgrade: PropTypes.bool.isRequired,
	show: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	// TODO: Temporary fix, refactor
	isStream: PropTypes.bool,
};

ImportSelect.defaultProps = {
	isStream: false,
};

const hasSelection = (selection) => Object.values(selection).filter((s) => s !== 0).length > 0;

const openMachine = (machineId) => window.open(`/machines/${machineId}`, '_blank');

export function ImportDialog(props) {
	ImportDialog.propTypes = {
		importData: PropTypes.shape({
			machines: PropTypes.arrayOf(PropTypes.shape({ machine: entityShape })),
			streams: PropTypes.arrayOf(entityShape),
		}).isRequired,
		open: PropTypes.bool.isRequired,
		machineRenames: PropTypes.instanceOf(Map).isRequired,
		streamRenames: PropTypes.instanceOf(Map).isRequired,
		closeImportDialog: PropTypes.func.isRequired,
		importMachinesAndStreams: PropTypes.func.isRequired,
		updateMachineSelection: PropTypes.func.isRequired,
		updateStreamSelection: PropTypes.func.isRequired,
		successfulMachineImports: PropTypes.objectOf(PropTypes.string).isRequired,
		failedMachineImports: PropTypes.objectOf(PropTypes.string).isRequired,
		upgradedMachines: PropTypes.arrayOf(PropTypes.string).isRequired,
		upgradedStreams: PropTypes.arrayOf(PropTypes.string).isRequired,
		isImporting: PropTypes.bool.isRequired,
		importDone: PropTypes.bool.isRequired,
		machineSelection: PropTypes.objectOf(PropTypes.number).isRequired,
		streamSelection: PropTypes.objectOf(PropTypes.number).isRequired,
	};

	const updateMachineSelection = (event, machineId) => {
		props.updateMachineSelection(machineId, event.target.value);
	};

	const updateStreamSelection = (event, streamId) => {
		props.updateStreamSelection(streamId, event.target.value);
	};

	const {
		open,
		importData: { machines, streams },
		machineRenames,
		streamRenames,
		isImporting,
		successfulMachineImports,
		failedMachineImports,
		upgradedMachines,
		machineSelection,
		streamSelection,
		upgradedStreams,
		importDone,
	} = props;

	const showStreamList = open && streams.length > 0;
	const showMachineList = open && machines.length > 0;
	const hasAnySelection = hasSelection(streamSelection) || hasSelection(machineSelection);

	return (
		<Dialog fullWidth open={open} onClose={props.closeImportDialog}>
			<DialogTitle>
				<FormattedMessage id="DialogImport.title" defaultMessage="Import" />
			</DialogTitle>
			<DialogContent>
				{showMachineList ? (
					<List
						subheader={
							<ListSubheader style={{ backgroundColor: 'white' }}>
								<FormattedMessage
									id="Import.List.Machines.Title"
									defaultMessage="Machines"
								/>
							</ListSubheader>
						}
					>
						{machines.map(({ machine }) => {
							const rename = machineRenames.get(machine.id);
							const idAfterImport = successfulMachineImports[machine.id];
							const isUpgrade = upgradedMachines.includes(machine.id);
							const importFailed = !!failedMachineImports[machine.id];
							const isImportingMachine =
								isImporting && !!machineSelection[machine.id];
							let icon = null;
							if (isImportingMachine) {
								if (idAfterImport) {
									icon = <ImportSuccess />;
								} else {
									icon = <CircularProgress />;
								}
							}
							if (importFailed) {
								icon = <ImportError />;
							}
							return (
								<ListItem key={machine.id}>
									<ListItemText
										style={{ width: '95%' }}
										primary={
											<span>
												{machine.name}
												{isUpgrade ? <UpgradeIcon /> : null}
											</span>
										}
										secondary={rename && rename.old}
									/>
									{icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
									{importDone && idAfterImport ? (
										<ListItemSecondaryAction>
											<Button
												onClick={() => openMachine(idAfterImport)}
												variant="contained"
											>
												<FormattedMessage
													id="Import.OpenMachine"
													defaultMessage="Open"
												/>
											</Button>
										</ListItemSecondaryAction>
									) : null}
									<ImportSelect
										show={!isImporting && !importDone}
										selection={machineSelection[machine.id]}
										isUpgrade={isUpgrade}
										onChange={(event) =>
											updateMachineSelection(event, machine.id)
										}
									/>
								</ListItem>
							);
						})}
					</List>
				) : null}
				{showStreamList && showMachineList ? <Divider /> : null}
				{showStreamList ? (
					<List
						subheader={
							<ListSubheader style={{ backgroundColor: 'white' }}>
								<FormattedMessage
									id="Import.List.Streams.Title"
									defaultMessage="Streams"
								/>
							</ListSubheader>
						}
					>
						{streams.map((stream) => {
							const rename = streamRenames.get(stream.id);
							const isUpgrade = upgradedStreams.includes(stream.id);
							return (
								<ListItem key={stream.id}>
									<ListItemText
										style={{ width: '95%' }}
										primary={
											<span>
												{stream.name}
												{isUpgrade ? <UpgradeIcon /> : null}
											</span>
										}
										secondary={rename && rename.old}
									/>
									<ImportSelect
										show={!isImporting && !importDone}
										selection={streamSelection[stream.id]}
										isUpgrade={isUpgrade}
										isStream
										onChange={(event) =>
											updateStreamSelection(event, stream.id)
										}
									/>
								</ListItem>
							);
						})}
					</List>
				) : null}
			</DialogContent>
			<DialogActions>
				{!isImporting && !importDone ? (
					<React.Fragment>
						<Button onClick={props.closeImportDialog}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							disabled={!hasAnySelection}
							onClick={props.importMachinesAndStreams}
						>
							<FormattedMessage id="DialogImport.import" defaultMessage="Import" />
						</Button>
					</React.Fragment>
				) : null}
				{importDone ? (
					<Button onClick={props.closeImportDialog}>
						<FormattedMessage id="Close" defaultMessage="Close" />
					</Button>
				) : null}
			</DialogActions>
		</Dialog>
	);
}

function mapStateToProps(state) {
	return {
		...state.import,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(ImportDialog);
