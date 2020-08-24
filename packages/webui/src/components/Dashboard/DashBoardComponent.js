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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types */
/* eslint-disable react/prop-types */
/* eslint-disable no-nested-ternary */

import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import Constants from '../../constants/Constants';
import CombinedResourceListing from '../base/listing/CombinedResourceListing';
import { IconPause, IconPlay, IconStop } from '../icons';
import ImportDropzone from '../ImportExport/ImportDropzone';
import { formatDateString } from '../base/listing/Utils';
import { ImageUploadDialog } from '@cedalo/webui-extensions';
import { Path } from '../../helper/Path';
import { Table, TableBody, Tabs, Tab, Fab } from '@material-ui/core';
import TableSortHeader from '../base/addNewDialog/TableSortHeader';
import StreamHelper from '../../helper/StreamHelper';
import StreamDeleteDialog from '../Admin/streams/StreamDeleteDialog';
import Tooltip from '@material-ui/core/Tooltip';
import Add from '@material-ui/icons/Add';
import StreamTableRow from './StreamTableRow';
import StreamWizard from './StreamWizard';
import GridViewButton from '../../layouts/GridViewButton';
import StreamSettings from './StreamSettings';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';

const PREF_KEY_LAYOUT = 'streamsheets-prefs-listing-layout';

const styles = (theme) => ({
	tableRoot: {
		'& > *': {
			borderBottom: 'unset'
		}
	},
	root: {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		overflow: 'hidden',
		backgroundColor: theme.palette.background.paper
	}
});

class DashBoardComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dialogMachineTitleImageOpen: false,
			activeTab: 0,
			streamSortBy: 'name',
			streamSortOrder: 'asc',
			showStreamWizard: false,
			activeStep: '',
			filter: [],
			editStream: false,
			type: '',
			layout: localStorage.getItem(PREF_KEY_LAYOUT) || 'grid',
		};
	}

	onResourceOpen = (resource, newWindow) => {
		const path = Path.machine(resource.id);
		if (newWindow) {
			window.open(path, '_blank');
		} else {
			this.props.openPage(path);
		}
	};

	onWizardClose = (connector) => {
		if (connector) {
			this.newConnectorName = connector.name;
		}
		this.setState({ showStreamWizard: false, editStream: false });
	};

	onStreamNew = (type, row) => {
		this.setState({
			showStreamWizard: true,
			activeStep: type === 'consumer' ? 'consumername' : 'producername',
			row,
			type,
		});
	};

	onConnectorNew = () => {
		this.setState({
			showStreamWizard: true,
			activeStep: 'provider',
			row: undefined,
			type: 'connector',
		});
	};

	onStreamOpen = (row, type) => {
		this.setState({
			editStream: true,
			row,
			type,
		})
	};

	onStreamReload = (resource) => {
		this.props.reloadAllStreams([resource.name]);
	};

	onStreamDelete = (resource) => {
		this.props.setDeleteDialogOpen(true, resource.id);
	};

	getConnector() {
		switch (this.state.type) {
		case 'connector':
			return undefined;
		case 'consumer':
		case 'producer':
			return StreamHelper.getConnectorConfig(this.state.row, this.props.streams.connectors)
		default:
		}

		return undefined;
	}

	onCloseDialogMachineTitleImage = () => {
		this.setState({
			dialogMachineTitleImageOpen: false
		});
	};

	onSubmitDialogMachineTitleImage = (result) => {
		this.setState({
			dialogMachineTitleImageOpen: false
		});
		if (result.imgSrc) {
			this.props.setTitleImage(this.state.currentMachine, result.imgSrc);
			this.props.openDashboard(this.state.currentMachine.id);
		}
	};

	handleNew = () => {
		this.props.getDataStores().then(() =>
			this.props.setAppState({
				showNewDialog: true
			})
		);
	};

	handleMenuSelect = async (optionIndex, resourceId) => {
		const findMachineToActivate = (id) => {
			const machine = this.props.machines.find((m) => m.id === id);
			return { ...machine, progressing: !machine.progressing };
		};
		switch (optionIndex) {
			case Constants.RESOURCE_MENU_IDS.CLONE: {
				const response = await this.props.cloneMachine(resourceId);
				if (response && response.clonedMachine) {
					window.open(Path.machine(response.clonedMachine.id), '_blank');
				}
				break;
			}
			case Constants.RESOURCE_MENU_IDS.OPEN:
				window.open(Path.machine(resourceId), '_blank');
				break;
			case Constants.RESOURCE_MENU_IDS.DELETE: {
				const machine = this.props.machines.find((m) => m.id === resourceId);
				this.props.setMachineActive({ ...machine });
				this.forceUpdate();
				this.props.setAppState({
					showDeleteMachineDialog: true
				});
				break;
			}
			case Constants.RESOURCE_MENU_IDS.SET_TITLE_IMAGE: {
				const machine = this.props.machines.find((m) => m.id === resourceId);
				this.props.setMachineActive({ ...machine });
				this.setState({
					dialogMachineTitleImageOpen: true,
					currentMachine: machine
				});
				this.props.openDashboard(machine);
				break;
			}
			case Constants.RESOURCE_MENU_IDS.START: {
				this.props.setMachineActive(findMachineToActivate(resourceId));
				this.forceUpdate();
				this.props
					.start(resourceId)
					.then(() => {
						this.props.openDashboard(resourceId);
						this.props.setMachineActive(findMachineToActivate(resourceId));
					})
					.catch((error) => {
						this.props.setMachineActive(findMachineToActivate(resourceId));
						console.error(error);
					});
				break;
			}
			case Constants.RESOURCE_MENU_IDS.STOP: {
				this.props.setMachineActive(findMachineToActivate(resourceId));
				this.forceUpdate();
				this.props
					.stop(resourceId)
					.then(() => this.props.openDashboard(resourceId))
					.catch((/* error */) => {
						// TODO: handle error
					});
				break;
			}
			case Constants.RESOURCE_MENU_IDS.PAUSE: {
				this.props.setMachineActive(findMachineToActivate(resourceId));
				this.forceUpdate();
				this.props
					.pause(resourceId)
					.then(() => this.props.openDashboard(resourceId))
					.catch((/* error */) => {
						// TODO: handle error
					});
				break;
			}
			case Constants.RESOURCE_MENU_IDS.EXPORT: {
				this.forceUpdate();
				this.props.setAppState({ drawerOpen: false });
				this.props.openExport(resourceId);
				break;
			}
			default:
		}
	};

	handleTabChange = (event, value) => {
		this.setState({ activeTab: value });
		this.props.onUpdateFilter('');
	};

	onFieldToggle(field, state) {
		if (state) {
			if (field.name === 'Admin.#all_provs') {
				this.state.filter = [];
			} else {
				const index = this.state.filter.indexOf(field.name);
				if (index !== -1) {
					this.state.filter.splice(index, 1);
				}
			}
		} else if (field.name === 'Admin.#all_provs') {
			this.props.streams.providers.forEach((provider) => {
				this.state.filter.push(provider.name);
			});
		} else {
			this.state.filter.push(field.name);
		}

		this.setState({ filter: this.state.filter });
	}

	getCells() {
		const fields = [];

		fields.push({ name: 'Admin.#all_provs', selected: this.state.filter.length === 0 });

		this.props.streams.providers.forEach((provider) => {
			fields.push({ name: provider.name, selected: !this.state.filter.includes(provider.name) });
		});

		return [
			{ id: 'out', numeric: false, disablePadding: true, sort: false, label: '', width: '58px' },
			{ id: 'name', numeric: false, disablePadding: true, sort: true, label: 'Streams.Name', width: '12%' },
			{
				id: 'provider',
				numeric: false,
				disablePadding: true,
				sort: true,
				label: 'Streams.Provider',
				width: '10%',
				fields
			},
			{ id: 'url', numeric: false, disablePadding: true, sort: true, label: 'Streams.URL', width: '15%' },
			{ id: 'topic', numeric: false, disablePadding: true, sort: true, label: 'Streams.Topic' },
			{
				id: 'lastModified',
				numeric: false,
				disablePadding: true,
				sort: true,
				label: 'Streams.LastModified',
				width: '10%'
			},
			{ id: 'action', numeric: false, disablePadding: true, sort: false, label: 'Streams.Actions', width: '10%' }
		];
	}

	getRows() {
		const rows = [];
		const filter = (connector, consumers, producers) => {
			if (this.props.filter.length === 0) {
				return 1;
			}
			let result = connector.name.toLowerCase().includes(this.props.filter.toLowerCase()) ? 1 : 0;
			result = consumers.some((consumer) => consumer.name.toLowerCase().includes(this.props.filter.toLowerCase())) ? 2 : result;
			result = producers.some((producer) => producer.name.toLowerCase().includes(this.props.filter.toLowerCase())) ? 2 : result;
			return result;
		};

		if (this.props.streams && this.props.streams.connectors && this.props.streams.connectors.length) {
			this.props.streams.connectors.forEach((connector) => {
				const provider = StreamHelper.getProviderOfConnector(connector, this.props.streams);
				const consumers = StreamHelper.getConsumersUsingConnector(connector.id, this.props.streams.consumers);
				const producers = StreamHelper.getProducersUsingConnector(connector.id, this.props.streams.producers);
				const index = this.state.filter.indexOf(provider.name);
				let result = filter(connector, consumers, producers)
				if (this.newConnectorName !== undefined && connector.name === this.newConnectorName) {
					result = 2;
					this.newConnectorName = undefined;
				}
				if (index === -1 && result) {
					const row = {
						id: connector.id,
						name: connector.name,
						provider,
						topic: connector.baseTopic || '',
						url: connector.baseUrl || connector.url || '',
						disabled: !!connector.disabled,
						lastModifiedDate: new Date(connector.lastModified).toISOString(),
						lastModified: formatDateString(new Date(connector.lastModified).toISOString()),
						resource: connector,
						consumers: [],
						producers: [],
						open: result === 2,
					};
					if (provider.canConsume) {
						consumers.forEach((consumer) => {
							if (consumer.name.toLowerCase().includes(this.props.filter.toLowerCase())) {
								row.consumers.push({
									id: consumer.id,
									name: consumer.name,
									provider: row.provider,
									disabled: !!consumer.disabled,
									topic: consumer.topics ? consumer.topics.toString() : '',
									url: consumer.url ? consumer.url : '',
									lastModifiedDate: new Date(consumer.lastModified).toISOString(),
									lastModified: formatDateString(new Date(consumer.lastModified).toISOString()),
									resource: consumer,
									state: StreamHelper.getStreamState(consumer)
								});
							}
						});
					}
					if (provider.canProduce) {
						producers.forEach((producer) => {
							if (producer.name.toLowerCase().includes(this.props.filter.toLowerCase())) {
								row.producers.push({
									id: producer.id,
									name: producer.name,
									provider: row.provider,
									disabled: !!producer.disabled,
									topic: producer.pubTopic ? producer.pubTopic : '',
									url: producer.url ? producer.url : '',
									lastModifiedDate: new Date(producer.lastModified).toISOString(),
									lastModified: formatDateString(new Date(producer.lastModified).toISOString()),
									resource: producer,
									state: StreamHelper.getStreamState(producer)
								});
							}
						});
					}
					rows.push(row);
				}
			});
		}

		rows.sort((a, b) => {
			const dir = this.state.streamSortOrder === 'asc' ? 1 : -1;

			switch (this.state.streamSortBy) {
                case 'provider': {
                    const aName = a.provider.name || '';
                    const bName = b.provider.name || '';
                    if (aName.toLowerCase() > bName.toLowerCase()) {
                        return dir;
                    } else if (aName.toLowerCase() < bName.toLowerCase()) {
                        return -1 * dir;
                    }
                    return 0;
                }
				case 'url':
				case 'topic':
				case 'name': {
					const aName = a[this.state.streamSortBy] || '';
					const bName = b[this.state.streamSortBy] || '';
					if (aName.toLowerCase() > bName.toLowerCase()) {
						return dir;
					} else if (aName.toLowerCase() < bName.toLowerCase()) {
						return -1 * dir;
					}
					return 0;
				}
				case 'lastModified': {
					const aLastModified = a.lastModifiedDate || new Date().toISOString();
					const bLastModified = b.lastModifiedDate || new Date().toISOString();
					const res = new Date(aLastModified) - new Date(bLastModified);
					return dir * res;
				}
				default:
					return 0;
			}
		});

		return rows;
	}

	getMachines() {
		return this.props.machines.map((machine) => {
			const lastModified = machine.metadata.lastModified || Date.now();
			return {
				...machine,
				lastModified, // needed by SortSelector
				lastModified_formatted: formatDateString(new Date(lastModified).toISOString())
			};
		});
	}

	handleStreamsSort = (event, property) => {
		const orderBy = property;
		const order =
			(this.state.streamSortBy === property && this.state.streamSortOrder === 'desc') ||
			this.state.streamSortBy !== property
				? 'asc'
				: 'desc';

		this.setState({
			streamSortBy: orderBy,
			streamSortOrder: order
		});
	};

	handleExport = () => {
		this.props.openExport();
	};

	handleImport = () => {
		this.props.showStartImportDialog();
	};

	updateLayout(layout) {
		this.setState({
			layout,
		})
	}

	render() {
		const canControl = this.props.rights.includes('machine.edit');
		const canDelete = this.props.rights.includes('machine.edit');
		const canView = this.props.rights.includes('machine.view');
		const canEdit = this.props.rights.includes('machine.edit');
		const menuOptions = [];
		if (canEdit) {
			menuOptions.push({
				label: <FormattedMessage id="Copy" defaultMessage="Copy" />,
				value: Constants.RESOURCE_MENU_IDS.CLONE
			});
		}
		if (canDelete) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.delete" defaultMessage="Delete" />,
				value: Constants.RESOURCE_MENU_IDS.DELETE
			});
		}
		if (canView) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.export" defaultMessage="Export" />,
				value: Constants.RESOURCE_MENU_IDS.EXPORT
			});
		}
		if (canEdit) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.setTitleImage" defaultMessage="Set image" />,
				value: Constants.RESOURCE_MENU_IDS.SET_TITLE_IMAGE
			});
		}
		return (
			<div style={{ height: '100%' }}>
				<div style={{ backgroundColor: this.props.theme.wall.backgroundColor }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<Tabs
							indicatorColor="primary"
							textColor="primary"
							value={this.state.activeTab}
							onChange={this.handleTabChange}
						>
							<Tab
								style={{ fontSize: '11pt' }}
								label={<FormattedMessage value={0} id="Dashboard" defaultMessage="Apps and Services" />}
							/>
							{this.props.rights.includes('stream') ? (
							<Tab
								style={{ fontSize: '11pt' }}
								label={<FormattedMessage value={1} id="Dashboard.manage" defaultMessage="Streams" />}
							/>) : null}
						</Tabs>
						<div style={{display: 'flex'}}>
							{ canEdit ?
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="Import.Button.Import" defaultMessage="Import" />}
							>
								<IconButton color="primary" aria-label="Menu" onClick={this.handleImport}>
									<SvgIcon>
										<path
											d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"
										/>
									</SvgIcon>
								</IconButton>
							</Tooltip> : null}
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="Dashboard.export" defaultMessage="Export" />}
							>
								<IconButton color="primary" aria-label="Menu" onClick={this.handleExport}>
									<SvgIcon>
										<path
											d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"
										/>
									</SvgIcon>
								</IconButton>
							</Tooltip>
							{this.state.activeTab === 0 ?
								<GridViewButton onUpdateLayout={(layout) => this.updateLayout(layout)}/> : null}
						</div>
					</div>
				</div>
				{this.state.activeTab === 0 ? (
					<div style={{ height: 'calc(100% - 49px)' }}>
						<ImportDropzone>
							<CombinedResourceListing
								images
								titleAttribute="name"
								resources={this.getMachines()}
								menuOptions={menuOptions}
								headerIcons={[
									{
										icon: IconStop,
										menuId: Constants.RESOURCE_MENU_IDS.STOP,
										state: 'stopped',
										label: <FormattedMessage id="Tooltip.StopHeader" defaultMessage="Stop" />,
										disabled: !canControl
									},
									{
										icon: IconPause,
										menuId: Constants.RESOURCE_MENU_IDS.PAUSE,
										state: 'paused',
										label: <FormattedMessage id="Tooltip.PauseHeader" defaultMessage="Pause" />,
										disabled: !canControl
									},
									{
										icon: IconPlay,
										menuId: Constants.RESOURCE_MENU_IDS.START,
										state: 'running',
										label: <FormattedMessage id="Tooltip.StartHeader" defaultMessage="Start" />,
										disabled: !canControl
									}
								]}
								layout={this.state.layout}
								onMenuSelect={this.handleMenuSelect}
								onResourceOpen={this.onResourceOpen}
								handleNew={this.props.rights.includes('machine.edit') ? this.handleNew : undefined}
								filter={this.props.filter}
								canEdit={canEdit}
							/>
							<ImageUploadDialog
								open={this.state.dialogMachineTitleImageOpen}
								onClose={this.onCloseDialogMachineTitleImage}
								onSubmit={this.onSubmitDialogMachineTitleImage}
							/>
						</ImportDropzone>
					</div>
				) : null}
				{this.state.activeTab === 1 ? (
					<div
						style={{
							backgroundColor: this.props.theme.palette.background.default,
							height: 'calc(100% - 49px)',
							overflowY: 'auto'
						}}
					>
						<StreamDeleteDialog />
						{this.state.showStreamWizard ? (
						<StreamWizard
							onClose={this.onWizardClose}
							initialStep={this.state.activeStep}
							connector={this.getConnector()}
							type={this.state.type}
							open={this.state.showStreamWizard}
							streams={this.props.streams}
						/>) : null}
						{this.state.editStream ? (
							<StreamSettings
								onClose={this.onWizardClose}
								stream={this.state.row.resource}
								type={this.state.type}
								open={this.state.editStream}
								streams={this.props.streams}
							/>) : null}
						<Tooltip
							enterDelay={300}
							title={<FormattedMessage id="Tooltip.AddConnector" defaultMessage="Add Connector" />}
						>
							<Fab
								id="add"
								aria-label="add"
								size="medium"
								color="primary"
								style={{
									position: 'absolute',
									zIndex: 1200,
									right: '30px',
									bottom: '26px'
								}}
								onClick={this.onConnectorNew}
							>
								<Add />
							</Fab>
						</Tooltip>
						<Table size="small" aria-label="collapsible table">
							<TableSortHeader
								height={48}
								cells={this.getCells()}
								orderBy={this.state.streamSortBy}
								order={this.state.streamSortOrder}
								onRequestSort={this.handleStreamsSort}
								onFieldToggle={(field, state) => this.onFieldToggle(field, state)}
							/>
							<TableBody>
								{this.getRows().map((row) => (
									<StreamTableRow
										key={row.name}
										row={row}
										onStreamNew={(type, resource) => this.onStreamNew(type, resource)}
										onStreamOpen={(resource, type) => this.onStreamOpen(resource, type)}
										onStreamDelete={(resource, type) => this.onStreamDelete(resource, type)}
										onStreamReload={(resource) => this.onStreamReload(resource)}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				) : null}
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		streams: state.streams,
		machine: state.monitor.machine,
		machines: state.machines.data,
		rights: state.user.rights
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, { withTheme: true })(DashBoardComponent))
);
