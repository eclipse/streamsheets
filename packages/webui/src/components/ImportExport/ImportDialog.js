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
import { ArrayUtil } from '@cedalo/util';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import MUIGrid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import VersionUpgrade from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import gatewayClient from '../../helper/GatewayClient';
import { useGraphQL } from '../../helper/Hooks';
import { Overlay } from '../HelperComponent/Overlay';
import { ConfirmImportDialog } from './ConfirmImportDialog';

const entityShape = PropTypes.shape({ id: PropTypes.string, name: PropTypes.string });

const UpgradeIcon = (props) => (
	<Tooltip enterDelay={300} title={props.tooltip}>
		<VersionUpgrade style={{ fontSize: '16px' }} color="error" />
	</Tooltip>
);

const IMPORT_INFO_QUERY = `
	query GetImportInfo($scope: ScopeInput!, $input: ImportInfoInput!) {
		scoped(scope: $scope) {
			getImportInfo(input: $input){
				machines {
					id
					nameInUse
				}
				streams {
					id
					nameInUse
				}
			}
			providers
			machines {
				name
			}
			streams {
				name
				type
				provider
			}
			connectors {
				name
				provider
				id
			}
		}
	}
`;

const DO_IMPORT = `
	mutation DoImport($scope: ScopeInput!, $input: ImportInput!, $file: Upload!) {
		scoped(scope: $scope) {
			import(input: $input, file: $file)	{
				success
				code
			}
		}
	}
`;

export const ImportDialog = connect((state) => ({ importData: state.import.importData }))((props) => {
	const { importData } = props;
	const importInfoInput = importData
		? {
				machines: importData.machines.map(({ machine }) => ({ id: machine.id, name: machine.name })),
				streams: importData.streams.map(({ id, name }) => ({ id, name }))
		  }
		: null;
	return importInfoInput ? <ImportDialogInner {...props} importInfoInput={importInfoInput} /> : null;
});

const fixStreamName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');
const isConnector = (stream) => stream.className === 'ConnectorConfiguration';
const isProducer = (stream) => stream.className === 'ProducerConfiguration';
const isConsumer = (stream) => stream.className === 'ConsumerConfiguration';

const initReducer = ({
	machines,
	streams,
	usage,
	providers,
	existingMachines,
	existingStreams,
	existingConnectors
}) => {
	// const allConn
	const machineUsage = new Set(usage.machines.filter((i) => i.nameInUse).map((i) => i.id));
	const streamUsage = new Set(usage.streams.filter((i) => i.nameInUse).map((i) => i.id));
	const connectorsByProvider = ArrayUtil.partition(existingConnectors, (c) => c.provider);
	const streamsInitialized = streams
		.map((stream) => ({
			...stream,
			provider: (() => {
				if (stream.providerId) {
					return stream.providerId;
				} else if (stream.provider) {
					return stream.provider.id;
				} else if (stream.connector) {
					const connector = streams.find((s) => s.id === stream.connector.id && isConnector(s));
					if (connector && connector.provider) {
						return connector.provider.id;
					}
				}
				return null;
			})()
		}))
		.filter((s) => providers.includes(s.provider))
		.reduce((acc, stream) => {
			const originalConnector =
				stream.connector && streams.find((s) => s.id === stream.connector.id && isConnector(s));
			const availableConnectors = connectorsByProvider[stream.provider] || [];
			return {
				...acc,
				[stream.id]: {
					id: stream.id,
					selected: true,
					name: stream.name,
					newName: fixStreamName(stream.name),
					type: (() => {
						if (isConnector(stream)) {
							return 'connector';
						} else if (isProducer(stream)) {
							return 'producer';
						} else if (isConsumer(stream)) {
							return 'consumer';
						}
						return null;
					})(),
					provider: stream.provider,
					nameInUse: streamUsage.has(stream.id),
					error: null,
					originalConnector,
					availableConnectors,
					connectorId: (() => {
						if (isConnector(stream)) {
							return null;
						}
						if (originalConnector) {
							return 'original';
						}
						if (availableConnectors[0]) {
							return availableConnectors[0].id;
						}
						return null;
					})()
				}
			};
		}, {});
	const requireConnectorSelect = Object.values(streamsInitialized).some(
		(s) => ['producer', 'consumer'].includes(s.type) && !s.originalConnector
	);

	return {
		showConnectorSelect: false,
		requireConnectorSelect,
		showConfirmation: requireConnectorSelect,
		existingMachines,
		existingStreams,
		machines: machines.reduce(
			(acc, { machine }) => ({
				...acc,
				[machine.id]: {
					id: machine.id,
					selected: true,
					name: machine.name,
					newName: machine.name,
					nameInUse: machineUsage.has(machine.id),
					error: null
				}
			}),
			{}
		),
		streams: streamsInitialized
	};
};

const updateAt = (state, [pathElement, ...rest], updater) =>
	pathElement
		? {
				...state,
				[pathElement]: updateAt(state[pathElement], rest, updater)
		  }
		: updater(state);

const reducer = (state, action) => {
	switch (action.type) {
		case 'init':
			return initReducer(action.data);
		case 'set_require_connector_select':
			return { ...state, requireConnectorSelect: true, showConnectorSelect: true };
		case 'connector_select_toggle':
			return { ...state, showConnectorSelect: !state.showConnectorSelect };
		case 'machine_toggle':
			return updateAt(state, ['machines', action.data], (old) => ({
				...old,
				selected: !old.selected
			}));
		case 'machine_set_name':
			return updateAt(state, ['machines', action.data.id], (old) => {
				return {
					...old,
					newName: action.data.name,
					nameInUse: state.existingMachines.has(action.data.name)
				};
			});
		case 'stream_toggle':
			return updateAt(state, ['streams', action.data], (old) => ({
				...old,
				selected: !old.selected
			}));
		case 'stream_set_name':
			return updateAt(state, ['streams', action.data.id], (old) => {
				const existing = state.existingStreams.get(action.data.name);
				const wrongProviderError =
					existing && existing.provider !== old.provider ? 'PROVIDERS_DONT_MATCH' : null;
				const wrongTypeError = existing && existing.type !== old.type ? 'TYPES_DONT_MATCH' : null;
				const missingNameError = action.data.name === '' ? 'MISSING_NAME' : null;
				const error = wrongProviderError || wrongTypeError || missingNameError;

				return {
					...old,
					newName: fixStreamName(action.data.name),
					nameInUse: !error && state.existingStreams.has(action.data.name),
					error
				};
			});
		case 'stream_set_connector':
			return updateAt(state, ['streams', action.data.id], (old) => ({
				...old,
				connectorId: action.data.connectorId
			}));
		case 'show_confirmation':
			return {
				...state,
				showConfirmation: true
			};
		case 'cancel_confirmation':
			return {
				...state,
				showConfirmation: false
			};
		case 'start_import':
			return {
				...state,
				importing: true
			};
		case 'import_success':
			return {
				...state,
				importing: false,
				importDone: true
			};
		case 'import_error':
			return {
				...state,
				importing: false,
				importError: action.data
			};
		default:
			throw new Error(`UNKNOWN ACTION: ${action.type}`);
	}
};

const ConnectorSelect = (props) => {
	const { disabled, value, originalConnector, availableConnectors, onChange } = props;
	const connectorsAvailable = (originalConnector && originalConnector.selected) || availableConnectors.length > 0;
	const originalNotSelected = !originalConnector.selected;
	const error = !disabled && (!connectorsAvailable || (originalNotSelected && value === 'original'));
	return (
		<TextField
			select
			id="connector"
			label={<FormattedMessage id="Import.Stream.Connector" defaultMessage="Connector" />}
			fullWidth
			variant="outlined"
			disabled={disabled || !connectorsAvailable}
			value={connectorsAvailable ? value : 'non-available'}
			error={error}
			style={{ alignSelf: 'flex-end' }}
			onChange={onChange}
		>
			{!connectorsAvailable ? (
				<MenuItem value="non-available">
					<FormattedMessage id="Import.Connector.NonAvailable" defaultMessage="No connector available" />
				</MenuItem>
			) : null}
			{originalConnector ? (
				<MenuItem value="original" disabled={originalNotSelected}>
					<i>{originalConnector.newName} <FormattedMessage id="Import.Connector.FromFile" defaultMessage="(from file)" /></i>
				</MenuItem>
			) : null}
			{availableConnectors.map((c) => (
				<MenuItem key={c.id} value={c.id}>
					{c.name}
				</MenuItem>
			))}
		</TextField>
	);
};

const withShowable = (Component) => ({ show, ...props }) => (show !== false ? <Component {...props} /> : null);

const Grid = withShowable(MUIGrid);

const FormattedError = (props) => {
	const { error, stream } = props;
	switch (error) {
		case 'PROVIDERS_DONT_MATCH':
			return (
				<FormattedMessage
					id="Import.Error.ProvidersDontMatch"
					defaultMessage="Providers don't match! Existing stream {stream} has a different provider."
					values={{ stream }}
				/>
			);
		case 'TYPES_DONT_MATCH':
			return (
				<FormattedMessage
					id="Import.Error.TypesDontMatch"
					defaultMessage="Types don't match! Existing stream {stream} has a different type."
					values={{ stream }}
				/>
			);
		case 'MISSING_NAME':
			return <FormattedMessage id="Import.Error.NameRequired" defaultMessage="New name is missing!" />;
		case 'DUPLICATE_NAME':
			return (
				<FormattedMessage id="Import.Error.DuplicateName" defaultMessage="Duplicate name in current import!" />
			);
		default:
			return null;
	}
};

const StreamType = (props) => {
	const { type } = props;
	switch (type) {
		case 'consumer':
			return <FormattedMessage id="Stream.Consumer" defaultMessage="Consumer" />;
		case 'producer':
			return <FormattedMessage id="Stream.Producer" defaultMessage="Producer" />;
		case 'connector':
			return <FormattedMessage id="Stream.Connector" defaultMessage="Connector" />;
		default:
			return null;
	}
};

const StreamList = withShowable((props) => {
	const { streams, dispatch, streamErrors, requireConnectorSelect } = props;
	const streamRows = Object.values(streams).map(
		({ selected, name, newName, id, nameInUse, availableConnectors, originalConnector, connectorId, type }) => {
			const error = selected && streamErrors[id];
			const showConnectorSelect = props.showConnectorSelect && type !== 'connector';
			const inputProps =
				nameInUse && selected
					? {
							style: { width: 'calc(100% - 14px)' },
							endAdornment: (
								<InputAdornment position="end">
									<UpgradeIcon
										tooltip={
											<FormattedMessage
												id="Import.UpdateStreamIcon.Tooltip"
												defaultMessage="Name already in use. Existing Stream with same name will be replaced!"
											/>
										}
									/>
								</InputAdornment>
							)
					  }
					: null;
			return (
				<Grid item container sm={12} key={id} alignItems="center" spacing={8}>
					<Grid
						item
						container
						alignItems="center"
						justify="flex-start"
						md={props.showConnectorSelect ? 3 : 5}
						sm={5}
						onClick={() => dispatch({ type: 'stream_toggle', data: id })}
						style={{ cursor: 'pointer' }}
					>
						<Grid item sm={3}>
							<Checkbox checked={selected} tabIndex={-1} disableRipple />
						</Grid>
						<Grid item sm={9}>
							<Tooltip enterDelay={300} title={name}>
								<Typography
									variant="subtitle1"
									style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
								>
									{name}
								</Typography>
							</Tooltip>
							<Typography variant="subtitle2">
								<i>
									<StreamType type={type} />
								</i>
							</Typography>
						</Grid>
					</Grid>

					<Grid item xs={12} sm={7} md={props.showConnectorSelect ? 5 : 7}>
						<TextField
							id={id}
							label={<FormattedMessage id="Import.Stream.ImportAs" defaultMessage="Import As" />}
							error={!!error}
							helperText={error ? <FormattedError error={error} stream={newName} /> : undefined}
							variant="outlined"
							fullWidth
							disabled={!selected}
							value={newName}
							onChange={(event) =>
								dispatch({
									type: 'stream_set_name',
									data: {
										id,
										name: event.target.value
									}
								})
							}
							InputProps={inputProps}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={4} show={showConnectorSelect}>
						<ConnectorSelect
							value={connectorId}
							disabled={!selected}
							originalConnector={originalConnector ? streams[originalConnector.id] : null}
							onChange={(event) =>
								dispatch({
									type: 'stream_set_connector',
									data: {
										id,
										connectorId: event.target.value
									}
								})
							}
							availableConnectors={availableConnectors}
						/>
					</Grid>
				</Grid>
			);
		}
	);
	return (
		<React.Fragment>
			<Grid item container justify="space-between" alignItems="center">
				<Grid item>
					<Typography style={{ padding: '16px 0px', float: 'left' }} variant="h6" color="textPrimary">
						<FormattedMessage id="Import.List.Streams.Title" defaultMessage="Streams" />
					</Typography>
				</Grid>
				<Grid show={!requireConnectorSelect} item>
					<FormattedMessage id="Import.List.Streams.ShowAdvanced" defaultMessage="Show Advanced" />
					<Checkbox
						checked={props.showConnectorSelect}
						tabIndex={-1}
						disableRipple
						disabled={requireConnectorSelect}
						onClick={() => dispatch({ type: 'connector_select_toggle' })}
					/>
				</Grid>
			</Grid>
			<Grid item container spacing={8} alignItems="center">
				{ArrayUtil.intersperse(streamRows, (index) => (
					<Grid key={`sep-${index}`} item sm={12}>
						<Divider />
					</Grid>
				))}
			</Grid>
		</React.Fragment>
	);
});

const MachineList = withShowable((props) => {
	const { machines, dispatch, machineErrors, showConnectorSelect } = props;
	const machineRows = Object.values(machines).map(({ selected, name, newName, id, nameInUse }) => {
		const error = selected && machineErrors[id];
		const inputProps =
			nameInUse && selected
				? {
						style: {
							width: 'calc(100% - 14px)'
						},
						endAdornment: (
							<InputAdornment position="end">
								<UpgradeIcon
									tooltip={
										<FormattedMessage
											id="Import.UpdateMachineIcon.Tooltip"
											defaultMessage="Name already in use. Existing Machine with same name will be replaced!"
										/>
									}
								/>
							</InputAdornment>
						)
				  }
				: null;

		return (
			<Grid item container sm={12} key={id} alignItems="center" spacing={8}>
				<Grid
					item
					container
					alignItems="center"
					justify="flex-start"
					md={showConnectorSelect ? 3 : 5}
					sm={5}
					onClick={() => dispatch({ type: 'machine_toggle', data: id })}
					style={{ cursor: 'pointer' }}
				>
					<Grid item sm={3}>
						<Checkbox checked={selected} tabIndex={-1} disableRipple />
					</Grid>
					<Grid item sm={9}>
						<Tooltip enterDelay={300} title={name}>
							<Typography variant="subtitle1" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
								{name}
							</Typography>
						</Tooltip>
					</Grid>
				</Grid>

				<Grid item xs={12} sm={7} md={showConnectorSelect ? 5 : 7}>
					<TextField
						id={id}
						label={<FormattedMessage id="Import.Machine.ImportAs" defaultMessage="Import As" />}
						variant="outlined"
						error={!!error}
						helperText={error ? <FormattedError error={error} /> : undefined}
						disabled={!selected}
						value={newName}
						fullWidth
						onChange={(event) =>
							dispatch({
								type: 'machine_set_name',
								data: {
									id,
									name: event.target.value
								}
							})
						}
						InputProps={inputProps}
					/>
				</Grid>
			</Grid>
		);
	});

	return (
		<React.Fragment>
			<Grid item>
				<Typography style={{ padding: '16px 0px' }} variant="h6" color="textPrimary">
					<FormattedMessage id="Import.List.Machines.Title" defaultMessage="Machines" />
				</Typography>
			</Grid>

			<Grid item container spacing={8} alignItems="center">
				{ArrayUtil.intersperse(machineRows, (index) => (
					<Grid key={`sep-${index}`} item sm={12}>
						<Divider />
					</Grid>
				))}
			</Grid>
		</React.Fragment>
	);
});

function ImportDialogInner(props) {
	const {
		importData: { machines, streams },
		importInfoInput,
		scope
	} = props;
	const { data, loading } = useGraphQL(IMPORT_INFO_QUERY, { scope, input: importInfoInput }, [scope.id]);
	const [state, dispatch] = useReducer(reducer, {
		machines: {},
		streams: {},
		showConnectorSelect: false,
		showConfirmation: false
	});
	useEffect(() => {
		if (!loading && data) {
			dispatch({
				type: 'init',
				data: {
					machines,
					streams,
					usage: data.scoped.getImportInfo,
					providers: data.scoped.providers,
					existingMachines: new Map(data.scoped.machines.map((m) => [m.name, m])),
					existingConnectors: data.scoped.connectors,
					existingStreams: new Map(
						[
							...data.scoped.streams,
							...data.scoped.connectors.map((c) => ({ ...c, type: 'connector' }))
						].map((s) => [s.name, s])
					)
				}
			});
		}
	}, [loading]);

	useEffect(() => {
		if (state.importDone) {
			setTimeout(() => {
				props.closeImportDialog();
			}, 500);
		}
	}, [state.importDone]);

	const doImport = async () => {
		dispatch({ type: 'start_import' });
		const machineSelection = Object.values(state.machines)
			.filter((m) => m.selected)
			.map((m) => ({ id: m.id, newName: m.newName }));
		const streamSelection = Object.values(state.streams)
			.filter((s) => s.selected)
			.map((s) => ({
				id: s.id,
				newName: s.newName,
				connectorId: s.connectorId === 'original' ? null : s.connectorId
			}));
		const selectedMachineIds = machineSelection.map((s) => s.id);
		const selectedStreamIds = streamSelection.map((s) => s.id);
		const trimmedImportFileContent = {
			...props.importData,
			machines: props.importData.machines.filter((m) => selectedMachineIds.includes(m.machine.id)),
			streams: props.importData.streams.filter((s) => selectedStreamIds.includes(s.id))
		};
		try {
			const result = await gatewayClient.graphql(
				DO_IMPORT,
				{
					scope,
					file: null,
					input: {
						machines: machineSelection,
						streams: streamSelection
					}
				},
				new Blob([JSON.stringify(trimmedImportFileContent)], {
					type: 'text/plain;charset=utf8;'
				})
			);
			const { success, code } = result.data.scoped.import;
			if (success) {
				dispatch({ type: 'import_success' });
				props.updateMachines();
			} else {
				dispatch({ type: 'import_error', data: code });
			}
		} catch (error) {
			dispatch({ type: 'import_error', data: 'UNEXPECTED_ERROR' });
			console.error(error);
		}
	};

	const showStreamList = streams.length > 0;
	const showMachineList = machines.length > 0;
	const duplicateMachineNames = Object.fromEntries(
		Object.entries(ArrayUtil.partition(Object.values(state.machines), (s) => s.newName)).filter(
			([, v]) => v.length > 1
		)
	);
	const duplicateStreamNames = Object.fromEntries(
		Object.entries(ArrayUtil.partition(Object.values(state.streams), (s) => s.newName)).filter(
			([, v]) => v.length > 1
		)
	);

	const machineErrors = Object.fromEntries(
		Object.entries(state.machines).map(([k, v]) => [
			k,
			duplicateMachineNames[v.newName] ? 'DUPLICATE_NAME' : v.error
		])
	);

	const streamErrors = Object.fromEntries(
		Object.entries(state.streams).map(([k, v]) => [k, duplicateStreamNames[v.newName] ? 'DUPLICATE_NAME' : v.error])
	);

	const selectedConnectors = Object.values(state.streams)
		.filter((s) => s.type === 'connector' && s.selected)
		.map((c) => c.id);

	const streamWithoutConnector = Object.values(state.streams).filter((s) => {
		if (s.type === 'connector' || !s.selected) {
			return false;
		}
		if (s.connectorId === 'original') {
			return !selectedConnectors.includes(s.originalConnector.id);
		}
		return !s.availableConnectors.map((c) => c.id).includes(s.connectorId);
	});
	const importAllowed =
		streamWithoutConnector.length === 0 &&
		[...Object.values(streamErrors), ...Object.values(machineErrors)].every((error) => error === null);

	useEffect(() => {
		if (data && streamWithoutConnector.length !== 0 && !state.showConnectorSelect) {
			setTimeout(() => dispatch({ type: 'set_require_connector_select' }), 1000);
		}
	}, [streamWithoutConnector.length]);

	const machinesThatOverwrite = Object.values(state.machines).filter((m) => m.nameInUse && m.selected);
	const streamsThatOverwrite = Object.values(state.streams).filter((s) => s.nameInUse && s.selected);

	if (state.showConfirmation) {
		return (
			<ConfirmImportDialog
				machines={machinesThatOverwrite}
				streams={streamsThatOverwrite}
				onCancel={() => dispatch({ type: 'cancel_confirmation' })}
				onConfirm={() => {
					doImport();
				}}
			>
				{state.importing && (
					<Overlay>
						<CircularProgress style={{ width: '24px', height: '24px' }} />
					</Overlay>
				)}
				{state.importDone && (
					<Overlay>
						<CheckIcon color="primary" />
					</Overlay>
				)}
			</ConfirmImportDialog>
		);
	}

	const content = !data ? (
		<React.Fragment>
			<DialogContent style={{ margin: '16px auto' }}>
				<DialogContentText>
					<FormattedMessage id="Import.Loading" defaultMessage="Loading..." />
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={props.closeImportDialog}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
			</DialogActions>
		</React.Fragment>
	) : (
		<React.Fragment>
			<DialogContent>
				<Grid container direction="column">
					<MachineList
						show={showMachineList}
						machines={state.machines}
						showConnectorSelect={state.showConnectorSelect}
						machineErrors={machineErrors}
						dispatch={dispatch}
					/>
					<StreamList
						show={showStreamList}
						streams={state.streams}
						showConnectorSelect={state.showConnectorSelect}
						streamErrors={streamErrors}
						requireConnectorSelect={state.requireConnectorSelect}
						dispatch={dispatch}
					/>
				</Grid>
			</DialogContent>
			<DialogActions>
				{/* {!isImporting && !importDone ? ( */}
				<React.Fragment>
					<Button color="primary" onClick={props.closeImportDialog}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button
						disabled={!importAllowed}
						onClick={() => {
							const hasOverwrites = machinesThatOverwrite.length + streamsThatOverwrite.length > 0;
							if (hasOverwrites) {
								dispatch({ type: 'show_confirmation' });
							} else {
								doImport();
							}
						}}
					>
						<FormattedMessage id="Import.Button.Import" defaultMessage="Import" />
					</Button>
				</React.Fragment>
				{/* ) : null} */}
				{/* {importDone ? (
					<Button onClick={props.closeImportDialog}>
						<FormattedMessage id="Close" defaultMessage="Close" />
						</Button>
				) : null} */}
			</DialogActions>
			{state.importing && (
				<Overlay>
					<CircularProgress style={{ width: '24px', height: '24px' }} />
				</Overlay>
			)}
			{state.importDone && (
				<Overlay>
					<CheckIcon color="primary" />
				</Overlay>
			)}
		</React.Fragment>
	);

	return (
		<Dialog
			fullWidth
			open
			maxWidth={state.showConnectorSelect ? 'md' : 'sm'}
			onClose={props.closeImportDialog}
			key="dialog"
		>
			<DialogTitle>
				<FormattedMessage id="Import.Dialog.Title" defaultMessage="Import" />
			</DialogTitle>
			{content}
		</Dialog>
	);
}

ImportDialogInner.propTypes = {
	importData: PropTypes.shape({
		machines: PropTypes.arrayOf(PropTypes.shape({ machine: entityShape })),
		streams: PropTypes.arrayOf(entityShape)
	}).isRequired,
	closeImportDialog: PropTypes.func.isRequired,
	updateMachines: PropTypes.func.isRequired
	// importMachinesAndStreams: PropTypes.func.isRequired,
};

const mapStateToProps = ({ user }) => ({
	scope: user.user ? user.user.scope : null
});

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportDialog);
