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
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Button from '@material-ui/core/Button';
import JSG from '@cedalo/jsg-ui';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
// import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';

import { graphManager } from '../../GraphManager';

const styles = {
	radioButton: {
		marginBottom: 10,
	},
};

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class DeleteCellsDialog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			open: false,
			type: 'cellshorizontal',
		};

		this.handleClose = this.handleClose.bind(this);
	}

	componentDidMount() {
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.WorksheetView.SHEET_ACTION_NOTIFICATION, 'onSheetAction',
		);
	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(
			this,
			JSG.WorksheetView.SHEET_ACTION_NOTIFICATION,
		);
	}

	onSheetAction(notification) {
		if (notification.object) {
			// const item = notification.object.view.getItem();
			if (notification.object.action === 'deletecells') {
				this.setState({ open: true });
			}
		}
	}

	handleCancel = () => {
		this.setState({ open: false });
	};

	handleClose = () => {
		this.setState({ open: false });

		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.deleteCells(graphManager.getGraphEditor().getGraphViewer(), this.state.type);
		}
	};

	render() {
		return (
			<div>
				<Dialog
					open={this.state.open}
				>
					<DialogTitle>
						<FormattedMessage
							id="DeleteCellsDialog"
							defaultMessage="Delete Cells"
						/>
					</DialogTitle>
					<DialogContent>
						<RadioGroup
							name="type"
							value={this.state.type}
							onChange={(event, state) => { this.setState({ type: state }); }}
							style={{
								marginTop: '20px',
							}}
						>
							<FormControlLabel
								value="cellshorizontal"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage id="DeleteCellsDialog.moveLeft" defaultMessage="Move Left" />}
							/>
							<FormControlLabel
								value="cellsvertical"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage id="DeleteCellsDialog.moveTop" defaultMessage="Move Top" />}
							/>
							<FormControlLabel
								value="rows"
								style={styles.radioButton}
								control={<Radio />}
								// eslint-disable-next-line
								label={<FormattedMessage id="DeleteCellsDialog.deleteRows" defaultMessage="Delete Rows" />}
							/>
							<FormControlLabel
								value="columns"
								style={styles.radioButton}
								control={<Radio />}
								// eslint-disable-next-line
								label={<FormattedMessage id="DeleteCellsDialog.deleteColumns" defaultMessage="Delete Columns" />}
							/>
						</RadioGroup>
					</DialogContent>
					<DialogActions>
						<Button
							color="primary"
							onClick={this.handleCancel}
						>
							<FormattedMessage
								id="Cancel"
								defaultMessage="Cancel"
							/>
						</Button>
						<Button
							color="primary"
							onClick={this.handleClose}
							autoFocus
						>
							<FormattedMessage
								id="OK"
								defaultMessage="OK"
							/>
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default connect(null, mapDispatchToProps)(DeleteCellsDialog);
