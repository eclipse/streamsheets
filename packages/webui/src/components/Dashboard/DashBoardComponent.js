/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types */
/* eslint-disable react/prop-types */
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import Constants from '../../constants/Constants';
import { accessManager } from '../../helper/AccessManager';
import CombinedResourceListing from '../base/listing/CombinedResourceListing';
import { IconPause, IconPlay, IconStop } from '../icons';
import ImportDropzone from '../ImportExport/ImportDropzone';
import FilterMachineStatus from './FilterMachineStatus';
import { formatDateString } from '../base/listing/Utils';

const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

const styles = (theme) => ({
	root: {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		overflow: 'hidden',
		backgroundColor: theme.palette.background.paper,
	},
});

class DashBoardComponent extends Component {

	onResourceOpen = (resource, newWindow) => {
		if (newWindow) {
			window.open(`/machines/${resource.id}`, '_blank');
		} else {
			this.props.openPage(`/machines/${resource.id}`);
		}
	};

	handleNew = () => {
		this.props.setAppState({
			showNewDialog: true,
		});
	};

	handleMenuSelect = async (optionIndex, resourceId) => {
		const findMachineToActivate = (id) => {
			const machine = this.props.machines.find((m) => m.id === id);
			return { ...machine, progressing: !machine.progressing };
		};
		switch (optionIndex) {
			case Constants.RESOURCE_MENU_IDS.CLONE: {
				const response = await this.props.cloneMachine(resourceId);
				if(response && response.machine) {
					window.open(`/machines/${response.machine.id}`, '_blank');
				}
				break;
			}
			case Constants.RESOURCE_MENU_IDS.OPEN:
				window.open(`/machines/${resourceId}`, '_blank');
				break;
			case Constants.RESOURCE_MENU_IDS.DELETE: {
				const machine = this.props.machines.find((m) => m.id === resourceId);
				this.props.setMachineActive({...machine});
				this.forceUpdate();
				this.props.setAppState({
					showDeleteMachineDialog: true,
				});
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

	render() {
		const machines = this.props.machines.map((machine) => {
			const lastModified = machine.metadata.lastModified || Date.now();
			return {
				...machine,
				lastModified,	// needed by SortSelector
				lastModified_formatted: formatDateString(new Date(lastModified).toISOString()),
			};
		});
		const canControl = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.CONTROL);
		const canDelete = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.DELETE);
		const canView = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.VIEW);
		const canEdit = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.EDIT);
		const menuOptions =[];
		if (canView) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.open" defaultMessage="Open"/>,
				value: Constants.RESOURCE_MENU_IDS.OPEN,
			});
		}
		if (canEdit) {
			menuOptions.push({
				label: <FormattedMessage id="Copy" defaultMessage="Copy"/>,
				value: Constants.RESOURCE_MENU_IDS.CLONE,
			});
		}
		if (canDelete) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.delete" defaultMessage="Delete"/>,
				value: Constants.RESOURCE_MENU_IDS.DELETE,
			});
		}
		if (canView) {
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.export" defaultMessage="Export"/>,
				value: Constants.RESOURCE_MENU_IDS.EXPORT,
			});
		}
		if (canControl) {
			menuOptions.push('divider');
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.start" defaultMessage="Start"/>,
				value: Constants.RESOURCE_MENU_IDS.START,
			});
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.stop" defaultMessage="Stop"/>,
				value: Constants.RESOURCE_MENU_IDS.STOP,
			});
			menuOptions.push({
				label: <FormattedMessage id="Dashboard.pause" defaultMessage="Pause"/>,
				value: Constants.RESOURCE_MENU_IDS.PAUSE,
			});
		}
		return (
			<ImportDropzone>
				<CombinedResourceListing
					fields={[
						{
							label: this.props.intl.formatMessage({
								id: 'Dashboard.sheets',
								defaultMessage: 'Sheets',
							}),
							key: 'streamsheets.length',
						},
						{
							// eslint-disable-next-line
							label: this.props.intl.formatMessage({
								id: 'Dashboard.streams',
								defaultMessage: 'Streams',
							}),
							key: 'streamsheets[*].inbox.stream.name',
						},
						{
							label: this.props.intl.formatMessage({
								id: 'Admin.provideOwner',
								defaultMessage: 'Owner',
							}),
							key: 'owner',
						},
						{ label: <FormattedMessage id="Admin.lastModified" defaultMessage="Last Modified" />, key: 'lastModified_formatted' },
					]}
					label={<FormattedMessage id="Dashboard.processes" defaultMessage="Processes" />}
					images
					titleAttribute="name"
					resources={machines}
					headerIcons={[
						{
							icon: IconStop,
							menuId: Constants.RESOURCE_MENU_IDS.STOP,
							state: 'stopped',
							label: <FormattedMessage id="Tooltip.Stop" defaultMessage="Stop" />,
						  	disabled: !canControl
						},
						{
							icon: IconPause,
							menuId: Constants.RESOURCE_MENU_IDS.PAUSE,
							state: 'paused',
							label: <FormattedMessage id="Tooltip.Pause" defaultMessage="Pause" />,
							disabled: !canControl
						},
						{
							icon: IconPlay,
							menuId: Constants.RESOURCE_MENU_IDS.START,
							state: 'running',
							label: <FormattedMessage id="Tooltip.Start" defaultMessage="Start" />,
							disabled: !canControl
						},
					]}
					menuOptions={menuOptions}
					onFilter={this.onFilter}
					handleFilter={this.handleFilter}
					onMenuSelect={this.handleMenuSelect}
					onResourceOpen={this.onResourceOpen}
					handleNew={
						accessManager.canViewUI(accessManager.PERMISSIONS.MACHINE_ADD) ? this.handleNew : undefined
					}
					headerBackgroundColor="#6C6C70"
					filters={[FilterMachineStatus]}
					filterName
				/>
			</ImportDropzone>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
		streams: state.streams,
		machine: state.monitor.machine,
		machines: state.machines.data,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	connect(
		mapStateToProps,
		mapDispatchToProps,
	)(withStyles(styles)(DashBoardComponent)),
);
