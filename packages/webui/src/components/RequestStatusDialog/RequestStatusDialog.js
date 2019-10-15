import { Dialog, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

function RequestStatusDialog(props) {
	const { open, error } = props;

	return (
		<Dialog fullWidth open={open} maxWidth="md">
			<DialogTitle>{error && error.message}</DialogTitle>
			<DialogContent style={{ textAlign: 'center' }}>
				<DialogContentText>{error.stack}</DialogContentText>
			</DialogContent>
		</Dialog>
	);
}

RequestStatusDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	error: PropTypes.shape({
		message: PropTypes.string,
		stack: PropTypes.string,
	}),
};

RequestStatusDialog.defaultProps = {
	error: {},
};

function mapStateToProps(state) {
	return {
		open: state.monitor.requestFailed,
		error: state.monitor.error.error,
	};
}

export default connect(mapStateToProps)(RequestStatusDialog);
