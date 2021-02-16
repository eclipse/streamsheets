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
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
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
export class DeleteCellContentDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);

		this.state = {
			open: props.open,
			type: 'values',
		};

		this.handleClose = this.handleClose.bind(this);
	}

	static getDerivedStateFromProps(props, state) {
		return { ...state, open: props.open };
	}

	onSheetAction(/* notification */) {
		// if (notification.object) {
		// 	// const item = notification.object.view.getItem();
		// 	if (notification.object.action === 'deletecells') {
		// 		this.setState({ open: true });
		// 	}
		// }
	}

	handleCancel = () => {
		this.props.stateHandler({ showDeleteCellContentDialog: false });
		this.setState({ open: false });
	};

	handleClose = () => {
		this.setState({ open: false });
		this.props.stateHandler({ showDeleteCellContentDialog: false });

		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.deleteCellContent(graphManager.getGraphEditor().getGraphViewer(), this.state.type);
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
							id="DialogDelete.title"
							defaultMessage="Delete Cell Content"
						/>
					</DialogTitle>
					<DialogContent
						style={{
							minWidth: '200px',
						}}
					>
						<RadioGroup
							name="type"
							value={this.state.type}
							onChange={(event, state) => { this.setState({ type: state }); }}
							style={{
								marginTop: '20px',
							}}
						>
							<FormControlLabel
								value="all"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.complete" defaultMessage="Complete" />}
							/>
							<FormControlLabel
								value="values"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.values" defaultMessage="Values" />}
							/>
							<FormControlLabel
								value="formats"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.formats" defaultMessage="Formats" />}
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

export default connect(null, mapDispatchToProps)(DeleteCellContentDialog);
