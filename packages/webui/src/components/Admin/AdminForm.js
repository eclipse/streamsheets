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
/* eslint-disable react/prop-types,react/forbid-prop-types */
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {withStyles} from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import styles from './styles';
import ConfirmDialog from '../base/confirmDialog/ConfirmDialog';
import CustomPrompt from '../base/customPrompt/CustomPrompt';
import * as Actions from '../../actions/actions';
import {
	IconClose,
	IconDelete,
	IconSave,
	IconSecurity,
} from '../icons';
import {intl} from '../../helper/IntlGlobalProvider';
import ResourceCardHeader from '../base/listing/ResourceCardHeader';
import AdminConstants from '../../constants/AdminConstants';
import { Path } from '../../helper/Path';

let loading = false;

class AdminForm extends Component {
	static propTypes = {
		resource: PropTypes.object.isRequired,
		headerBackgroundColor: PropTypes.string.isRequired,
		icon: PropTypes.element,
		cardHeader: PropTypes.element,
		isDirty: PropTypes.bool,
		canDelete: PropTypes.bool,
		canClose: PropTypes.bool,
		handleAction: PropTypes.func,
		showState: PropTypes.bool,
	};

	static defaultProps = {
		icon: <IconSecurity/>,
		cardHeader: undefined,
		isDirty: false,
		canDelete: true,
		canClose: true,
		handleAction: undefined,
		showState: false,
	};

	static getDerivedStateFromProps(nextProps, prevState) {
		if (!loading && !nextProps.resource) {
			loading = true;
		}
		if (!loading && nextProps.resource.progressing !== prevState.resource.progressing) {
			return {...prevState, resource: nextProps.resource};
		}
		if (loading && nextProps.resource) {
			loading = false;
		}
		return {...prevState, resource: nextProps.resource};
	}

	constructor(props) {
		super(props);
		this.state = {
			resource: props.resource,
		};
	}

	afterConfirm = () => {
		console.log('done');
	};
	openDeleteDialog = () => {
		this.setState({openDialog: true});
	};

	closeDeleteDialog = () => {
		this.setState({openDialog: false});
	};

	remove = async () => {
		this.closeDeleteDialog();
		this.handleAction(AdminConstants.SECURITY_BUTTONS.DELETE, this.state.resource.id);
	};

	handleAction = (optionIndex, resourceId) => {
		switch (optionIndex) {
		case AdminConstants.SECURITY_BUTTONS.CLOSE: {
			return this.props.openPage(Path[this.props.listingPage]());
		}
		case AdminConstants.SECURITY_BUTTONS.DELETE: {
			if (this.props.handleAction) {
				if (!this.state.openDialog) {
					return this.openDeleteDialog()
				}
				return this.props.handleAction(optionIndex, resourceId);
			}
			break;
		}
		default: {
			//
		}
		}
		if (this.props.handleAction) {
			return this.props.handleAction(optionIndex, resourceId);
		}
		return false;
	};


	render() {
		const {
			headerBackgroundColor,
			icon,
			cardHeader,
			isDirty,
			canDelete,
			titleAttribute,
			canSave,
			canClose,
			showState
		} = this.props;
		const {
			resource,
		} = this.state;
		return (
			<div>
				<CustomPrompt
					when={isDirty}
					title={intl.formatMessage(
						{
							id: 'Dialog.UnsavedChanges.Title',
							defaultMessage: 'Unsaved Changes',
						},
					)}
					message={intl.formatMessage(
						{
							id: 'Dialog.UnsavedChanges.Message',
							defaultMessage: 'Are you sure you want to leave without saving your changes?',
						},
					)}
					afterConfirm={this.afterConfirm}
				/>
				<ConfirmDialog
					onConfirm={this.remove}
					onCancel={this.closeDeleteDialog}
					open={this.state.openDialog}
					title={<FormattedMessage
						id="Admin.resourceDelete"
						defaultMessage="Delete resource"
					/>}
					content={<FormattedMessage
						id="Admin.deleteResourceMessage"
						defaultMessage="Please confirm to delete this resource."
					/>}
				/>

				<Card style={{
					minWidth: '200px',
					maxHeight: 'none',
					margin: '10px',
					borderColor: headerBackgroundColor,
					borderStyle: 'solid',
					borderWidth: '3px',
				}}
				>
					{cardHeader || <ResourceCardHeader
						showProgressing
						showState={showState}
						handleClicked={this.handleAction}
						resource={resource}
						titleAttribute="name"
						headerBackgroundColor={headerBackgroundColor}
						headerIcons={[
							{
								icon: IconSave,
								menuId: AdminConstants.SECURITY_BUTTONS.SAVE,
								state: '',
								label: <FormattedMessage id="Tooltip.Save" defaultMessage="Save" />,
								disabled: !canSave
							},
							{
								icon: IconDelete,
								menuId: AdminConstants.SECURITY_BUTTONS.DELETE,
								state: 'delete',
								label: <FormattedMessage id="Tooltip.Delete" defaultMessage="Delete" />,
								disabled: !canDelete
							},
							{
								icon: IconClose,
								menuId: AdminConstants.SECURITY_BUTTONS.CLOSE,
								state: 'min',
								label: <FormattedMessage id="Tooltip.Close" defaultMessage="Close" />,
								onDisabled: true,
								disabled: !canClose
							},
						]}
						icon={icon}
						titleMaxLength={titleAttribute}
						toggleResourceProgress={(res) => this.props.timeoutStreamControlEvent(res)}
					/>
					}

					<CardContent>
						{(this.state.error && this.state.error.length > 0) ? (
							<div style={{
								padding: '20px',
								backgroundColor: '#f44336',
								color: 'white',
								marginBottom: '15px',
							}}
							>
								{this.state.error}
							</div>) : null}
						{!resource ? null : (
							<form style={{
								minWidth: '200px',
							}}
							>

								{this.props.children}
							</form>
						)}

					</CardContent>
				</Card>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		security: state.adminSecurity,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({...Actions}, dispatch);
}

export default withStyles(styles, {withTheme: true})(
	connect(mapStateToProps, mapDispatchToProps)(AdminForm));
