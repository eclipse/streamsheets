import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InputAdornment,
	TextField,
} from '@material-ui/core';
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
					<Button onClick={onCancel}>
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
