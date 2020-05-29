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
/* eslint-disable react/prop-types, react/forbid-prop-types */
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import JSG from '@cedalo/jsg-ui';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { deleteStreamSheet, setAppState } from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { intl } from '../../helper/IntlGlobalProvider';



const { ButtonNode, NotificationCenter, WorksheetView, Notification } = JSG;

class SheetDeleteDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sheet: null,
			sheetName: '',
		};
	}

	componentDidMount() {
		NotificationCenter.getInstance().register(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION, 'onButtonClicked');
	}

	componentWillUnmount() {
		NotificationCenter.getInstance().unregister(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION);
	}

	onButtonClicked(notification) {
		if (notification.object) {
			const info = notification.object;
			const item = info.button;
			const cnt = graphManager.getGraph().getStreamSheetContainerCount();
			if (item && item.getName().getValue() === 'delete') {
				if (cnt === 1) {
					NotificationCenter.getInstance().send(
						new Notification(WorksheetView.SHEET_MESSAGE_NOTIFICATION, {
							view: this,
							message: { message: intl.formatMessage({ id: 'Alert.SheetDelete' }, {}) },
						}),
					);
				} else {
					this.setState({ sheet: info.container });
					this.setState({
						sheetName: info.container
							.getStreamSheet()
							.getName()
							.getValue(),
					});
					this.props.openDialog();
				}
			}
		}
	}

	handleSubmitDeleteSheet = () => {
		const processContainer = this.state.sheet;
		processContainer.getGraph().setViewMode(processContainer, 0);
		const streamsheetId = processContainer
			.getStreamSheetContainerAttributes()
			.getSheetId()
			.getValue();
		this.props.deleteStreamSheet(this.props.machineId, streamsheetId);
		this.props.closeDialog();
	};

	render() {
		return (
			<Dialog open={this.props.open} onClose={this.handleClose}>
				<DialogTitle>
					<FormattedMessage id="DeleteSheetDialog" defaultMessage="Delete StreamSheet" />
				</DialogTitle>
				<DialogContent
					style={{
						margin: '20px',
					}}
				>
					<DialogContentText>
						<FormattedMessage
							id="DeleteSheetDialog.message"
							defaultMessage="This action can not be undone. Are you sure, you want to delete
								the StreamSheet: '{sheet}' ?"
							values={{ sheet: this.state.sheetName }}
						/>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color="primary" autoFocus onClick={this.props.closeDialog}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button color="primary" onClick={this.handleSubmitDeleteSheet}>
						<FormattedMessage id="OK" defaultMessage="OK" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

SheetDeleteDialog.propTypes = {
	machineId: PropTypes.string.isRequired,
	open: PropTypes.bool.isRequired,
	closeDialog: PropTypes.func.isRequired,
	openDialog: PropTypes.func.isRequired,
	deleteStreamSheet: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
	return {
		machineId: state.monitor.machine.id,
		open: state.appState.showDeleteSheetDialog,
	};
}

const mapDispatchToProps = {
	closeDialog: () => setAppState({ showDeleteSheetDialog: false }),
	openDialog: () => setAppState({ showDeleteSheetDialog: true }),
	deleteStreamSheet,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(SheetDeleteDialog);
