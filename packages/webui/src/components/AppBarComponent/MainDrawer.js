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
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SvgIcon from '@material-ui/core/SvgIcon';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import DashboardIcon from '@material-ui/icons/ViewList';
import NewIcon from '@material-ui/icons/NoteAdd';
import CloneIcon from '@material-ui/icons/FileCopy';
import OpenIcon from '@material-ui/icons/OpenInBrowser';
import SettingsIcon from '@material-ui/icons/Settings';
import MenuItem from '@material-ui/core/MenuItem';
import Drawer from '@material-ui/core/Drawer';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FormattedMessage } from 'react-intl';
import * as Actions from '../../actions/actions';
import Utils from '../../helper/Utils';
import { Restricted } from '../HelperComponent/Restricted';
import { withStyles } from '@material-ui/core/styles';
import ListItemText from '@material-ui/core/ListItemText';
import { MainDrawerExtensions } from '@cedalo/webui-extensions';
import MenuItemWithTooltip from '../HelperComponent/MenuItemWithTooltip';

export class MainDrawer extends Component {
	setAppState(state) {
		this.props.setAppState(state);
	}

	handleNew = () => {
		this.props.getDataStores().then(() =>
			this.setAppState({
				drawerOpen: false,
				showNewDialog: true
			})
		);
	};

	handleExport = () => {
		this.setAppState({
			drawerOpen: false
		});
		this.props.openExport(this.props.machineId);
	};

	handleOpen = () => {
		this.setAppState({
			drawerOpen: false,
			showOpenDialog: true
		});
	};

	handleImport = () => {
		this.props.showStartImportDialog();
		this.setAppState({
			drawerOpen: false
		});
	};

	handleOpenPreview = () => {
		this.setAppState({
			drawerOpen: false,
			showViewMode: true
		});
	};

	handleSaveAs = () => {
		this.setAppState({
			drawerOpen: false,
			showSaveAsDialog: true
		});
	};

	handleOpenDashboard = () => {
		this.props.openDashboard(this.props.machineId, this.props.isMachineDetailPage);
		this.setAppState({
			drawerOpen: false
		});
	};

	showSettingsDialog = () => {
		this.setAppState({
			drawerOpen: false,
			openSettings: true
		});
	};

	showDeleteMachineDialog = () => {
		this.setAppState({
			drawerOpen: false,
			showDeleteMachineDialog: true
		});
	};

	render() {
		const { user } = this.props.user;
		const { open, isAdminPage, isMachineDetailPage } = this.props;
		const canAddMachine = Utils.areSheetsAvailable(this.props.licenseInfo);
		if (!user || !open) return null;
		return (
			<Drawer width={300} open={open} onClose={() => this.setAppState({ drawerOpen: false })}>
				<div
					style={{
						height: '18px',
						padding: '20px',
						backgroundColor: this.props.theme.overrides.MuiAppBar.colorPrimary.backgroundColor
					}}
				>
					<span
						style={{
							color: 'white'
						}}
					>
						<FormattedMessage id="MainTitle" defaultMessage="Stream Machine" />
					</span>
				</div>
				{isAdminPage ? null : (
					<React.Fragment>
						<Restricted all={['machine.edit']}>
							<MenuItemWithTooltip
								tooltipTitle={canAddMachine ? null : <FormattedMessage id="License.Info.Streamsheets.max.reached"/>}
								MenuItemProps={{dense: true, disabled: !canAddMachine}}
								onClick={this.handleNew}>
								<ListItemIcon>
									<NewIcon />
								</ListItemIcon>
								<ListItemText primary={<FormattedMessage id="New" defaultMessage="New" />} />
							</MenuItemWithTooltip>
						</Restricted>
						<Restricted all={['machine.view']}>
							<MenuItem dense onClick={this.handleOpen}>
								<ListItemIcon>
									<OpenIcon />
								</ListItemIcon>
								<ListItemText primary={<FormattedMessage id="Open" defaultMessage="Open" />} />
							</MenuItem>
						</Restricted>
						<Restricted all={['machine.edit']}>
							{isMachineDetailPage ? (
								<div>
								<MenuItemWithTooltip
									tooltipTitle={canAddMachine ? null : <FormattedMessage id="License.Info.Streamsheets.max.reached"/>}
									MenuItemProps={{dense: true, disabled: !canAddMachine}}
									onClick={this.handleSaveAs}>
									<ListItemIcon>
										<CloneIcon />
									</ListItemIcon>
									<ListItemText
										primary={<FormattedMessage id="SaveCopyAs" defaultMessage="Save Copy As" />}
									/>
								</MenuItemWithTooltip>
								</div>
							) : null}
						</Restricted>
						<Restricted all={['machine.edit']}>
							{isMachineDetailPage && this.props.canEditMachine ? (
								<MenuItem dense onClick={() => this.showDeleteMachineDialog()}>
									<ListItemIcon>
										<DeleteIcon />
									</ListItemIcon>
									<ListItemText
										primary={<FormattedMessage id="DeleteMenu" defaultMessage="Delete..." />}
									/>
								</MenuItem>
							) : null}
						</Restricted>
						<MainDrawerExtensions.FileSection isMachineDetailPage={isMachineDetailPage} />
						<Divider />
						<Restricted all={['machine.edit', 'stream']}>
							<MenuItemWithTooltip
								tooltipTitle={canAddMachine ? null : <FormattedMessage id="License.Info.Streamsheets.max.reached"/>}
								MenuItemProps={{dense: true, disabled: !canAddMachine}}
								onClick={this.handleImport}>
								<ListItemIcon>
									<SvgIcon>
										<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
									</SvgIcon>
								</ListItemIcon>
								<ListItemText primary={<FormattedMessage id="Import" defaultMessage="Import" />} />
							</MenuItemWithTooltip>
						</Restricted>
						<Restricted oneOf={['machine.view', 'stream']}>
							<MenuItem dense onClick={() => this.handleExport()}>
								<ListItemIcon>
									<SvgIcon>
										<path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
									</SvgIcon>
								</ListItemIcon>
								<ListItemText primary={<FormattedMessage id="Export" defaultMessage="Export" />} />
							</MenuItem>
						</Restricted>
						<MainDrawerExtensions.ImportSection isMachineDetailPage={isMachineDetailPage} />
					</React.Fragment>
				)}
				<MainDrawerExtensions.StreamSection isMachineDetailPage={isMachineDetailPage} />
				{isMachineDetailPage && this.props.canEditMachine ? (
					<div>
						<Divider />
						<MenuItem dense onClick={() => this.showSettingsDialog()}>
							<ListItemIcon>
								<SettingsIcon />
							</ListItemIcon>
							<ListItemText
								primary={<FormattedMessage id="Preferences" defaultMessage="Preferences" />}
							/>
						</MenuItem>
					</div>
				) : null}
				<Divider />
				{isMachineDetailPage || isAdminPage ? (
					<MenuItem dense onClick={this.handleOpenDashboard}>
						<ListItemIcon>
							<DashboardIcon />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Dashboard" defaultMessage="Dashboard" />} />
					</MenuItem>
				) : null}
				{isMachineDetailPage ? (
					<MenuItem dense onClick={this.handleOpenPreview}>
						<ListItemIcon>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M12 5.5L10 8H14L12 5.5M18 10V14L20.5 12L18 10M6 10L3.5 12L6 14V10M14 16H10L12 18.5L14 16M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3M21 19H3V5H21V19Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="UserPreview" defaultMessage="User Preview" />} />
					</MenuItem>
				) : null}
				<MainDrawerExtensions.PreviewSection isMachineDetailPage={isMachineDetailPage} />
			</Drawer>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.drawerOpen,
		machineId: state.monitor.machine.id,
		licenseInfo: state.meta.licenseInfo,
		user: state.user
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles({}, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(MainDrawer));
