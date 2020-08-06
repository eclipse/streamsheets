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
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const FILE_EXTENSION = '.json';

export default class ExportDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			fileName: props.fileName,
		};
	}

	onChange = (event) => {
		this.setState({ fileName: event.target.value });
	};

	handleKeyPressed = (event) => {
		switch (event.key) {
			case 'Enter':
				return this.props.onConfirm(event, `${this.state.fileName}${FILE_EXTENSION}`);
			case 'Escape':
				return this.props.onCancel();
			default:
		}
		return false;
	};

	render() {
		const { open, onCancel, onConfirm } = this.props;
		return (
			<Dialog open={open} onKeyDown={this.handleKeyPressed}>
				<DialogTitle>
					<FormattedMessage id="Export.Dialog.Title" defaultMessage="Export" />
				</DialogTitle>
				<DialogContent
					style={{
						margin: '20px',
						width: '300px',
					}}
				>
					<TextField
						autoFocus
						margin="dense"
						label={<FormattedMessage id="Export.Dialog.FileName" defaultMessage="File Name" />}
						fullWidth
						onChange={this.onChange}
						value={this.state.fileName}
						InputProps={{
							endAdornment: <InputAdornment position="end">{FILE_EXTENSION}</InputAdornment>,
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={onCancel}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button
						color="primary"
						onClick={(event) => onConfirm(event, `${this.state.fileName}${FILE_EXTENSION}`)}
					>
						<FormattedMessage id="Export.Dialog.Confirm" defaultMessage="Export" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

ExportDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	onCancel: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	fileName: PropTypes.string,
};

ExportDialog.defaultProps = {
	fileName: 'export',
};
