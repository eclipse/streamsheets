/* eslint-disable react/no-unused-state */
/* eslint-disable react/prop-types */
import * as Colors from '@material-ui/core/colors';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import ImportIcon from '@material-ui/icons/CloudDownload';
import ExportIcon from '@material-ui/icons/CloudUpload';
import AdminAppIcon from '@material-ui/icons/Security';
import DashboardIcon from '@material-ui/icons/ViewList';
import NewIcon from '@material-ui/icons/NoteAdd';
import CloneIcon from '@material-ui/icons/FileCopy';
import OpenIcon from '@material-ui/icons/OpenInBrowser';
import SettingsIcon from '@material-ui/icons/Settings';
import MenuItem from '@material-ui/core/MenuItem';
import Drawer from '@material-ui/core/Drawer';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FormattedMessage } from 'react-intl';
import { accessManager, RESOURCE_ACTIONS, RESOURCE_TYPES, PERMISSIONS } from '../../helper/AccessManager';
import * as Actions from '../../actions/actions';
import { Restricted } from '../HelperComponent/Restricted';

export class MainDrawer extends Component {
	state = {
		adminOpen: false,
	};

	setAppState(state) {
		this.props.setAppState(state);
	}

	handleNew = () => {
			this.props.getDataStores()
			.then(() =>
				this.setAppState({
					drawerOpen: false,
					showNewDialog: true,
				}),
			);
	};

	handleExport = () => {
		this.setAppState({
			drawerOpen: false,
		});
		this.props.openExport(this.props.machineId);
	};

	handleOpen = () => {
		this.props.getMachines().then(() =>
			this.setAppState({
				drawerOpen: false,
				showOpenDialog: true,
			}),
		);
	};

	handleImport = () => {
		this.props.showStartImportDialog();
		this.setAppState({
			drawerOpen: false,
		});
	};

	handleOpenDashboard = () => {
		this.props.openDashboard(this.props.machineId);
		this.setAppState({
			drawerOpen: false,
		});
	};

	handleOpenAdmin = () => {
		this.setAppState({
			drawerOpen: false,
		});
		window.open('/administration');
	};

	handleSaveAs = () => {
		this.setAppState({
			drawerOpen: false,
			showSaveAsDialog: true,
		});
	};

	handleAdminMenu = () => {
		this.setState({ adminOpen: !this.state.adminOpen });
	};

	showSettingsDialog = () => {
		this.setAppState({
			drawerOpen: false,
			openSettings: true,
		});
	};

	showDeleteMachineDialog = () => {
		this.setAppState({
			drawerOpen: false,
			showDeleteMachineDialog: true,
		});
	};

	render() {
		const { user } = this.props.user;
		const canEdit = accessManager.canViewUI(accessManager.PERMISSIONS.MACHINE_EDIT);
		if (!user) return null;
		return (
			<Drawer
				width={300}
				open={this.props.open}
				onClose={() => this.setAppState({ drawerOpen: false })}
			>
				<div
					style={{
						height: '18px',
						padding: '20px',
						backgroundColor: Colors.blue[800],
					}}
				>
					<span
						style={{
							color: 'white',
						}}
					>
						<FormattedMessage id="MainTitle" defaultMessage="Stream Machine" />
					</span>
				</div>
				<Restricted permission={PERMISSIONS.MACHINE_ADD}>
					<MenuItem onClick={this.handleNew}>
						<ListItemIcon>
							<NewIcon />
						</ListItemIcon>
						<FormattedMessage id="New" defaultMessage="New" />
					</MenuItem>
				</Restricted>
				<Restricted permission={PERMISSIONS.MACHINE_VIEW}>
					<MenuItem onClick={this.handleOpen}>
						<ListItemIcon>
							<OpenIcon />
						</ListItemIcon>
						<FormattedMessage id="Open" defaultMessage="Open" />
					</MenuItem>
				</Restricted>
				{this.props.isMachineDetailPage ? (
					<div>
						<Restricted permission={PERMISSIONS.MACHINE_ADD}>
							<MenuItem onClick={() => this.handleSaveAs()}>
								<ListItemIcon>
									<CloneIcon />
								</ListItemIcon>
								<FormattedMessage id="SaveCopyAs" defaultMessage="Save Copy As" />
							</MenuItem>
						</Restricted>
					</div>
				) : null}
				<Restricted type={RESOURCE_TYPES.MACHINE} action={RESOURCE_ACTIONS.DELETE}>
					{this.props.isMachineDetailPage && canEdit ? (
						<MenuItem onClick={() => this.showDeleteMachineDialog()}>
							<ListItemIcon>
								<DeleteIcon />
							</ListItemIcon>
							<FormattedMessage id="DeleteMenu" defaultMessage="Delete..." />
						</MenuItem>
					) : null}
				</Restricted>
				<Divider />
				<Restricted
					oneOf={[
						{ type: RESOURCE_TYPES.STREAM, action: RESOURCE_ACTIONS.CREATE },
						{ type: RESOURCE_TYPES.MACHINE, action: RESOURCE_ACTIONS.CREATE },
					]}
				>
					<MenuItem onClick={() => this.handleImport()}>
						<ListItemIcon>
							<ImportIcon />
						</ListItemIcon>
						<FormattedMessage id="Import" defaultMessage="Import" />
					</MenuItem>
				</Restricted>
				<Restricted
					oneOf={[
						{ type: RESOURCE_TYPES.STREAM, action: RESOURCE_ACTIONS.VIEW },
						{ type: RESOURCE_TYPES.MACHINE, action: RESOURCE_ACTIONS.VIEW },
					]}
				>
					<MenuItem onClick={() => this.handleExport()}>
						<ListItemIcon>
							<ExportIcon />
						</ListItemIcon>
						<FormattedMessage id="Export" defaultMessage="Export" />
					</MenuItem>
				</Restricted>
				{this.props.isMachineDetailPage && canEdit ? (
					<div>
						<Divider />
						<MenuItem onClick={() => this.showSettingsDialog()}>
							<ListItemIcon>
								<SettingsIcon />
							</ListItemIcon>
							<FormattedMessage id="Preferences" defaultMessage="Preferences" />
						</MenuItem>
					</div>
				) : null}
				<Divider />
				<MenuItem onClick={this.handleOpenDashboard}>
					<ListItemIcon>
						<DashboardIcon />
					</ListItemIcon>
					<FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
				</MenuItem>
				{!accessManager.canViewCompositeUI(accessManager.PERMISSIONS.ADMINISTRATION) || process.env.REACT_APP_HIDE_ADMIN ? null : (
					<MenuItem onClick={this.handleOpenAdmin}>
						<ListItemIcon>
							<AdminAppIcon />
						</ListItemIcon>
						<FormattedMessage id="Administration" defaultMessage="Administration" />
					</MenuItem>
				)}
			</Drawer>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.drawerOpen,
		machineId: state.monitor.machine.id,
		user: state.user,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(MainDrawer);
