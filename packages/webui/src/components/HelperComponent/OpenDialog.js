/* eslint-disable react/prop-types */
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import MachineListComponent from '../MachineListComponent/MachineListComponent';

// eslint-disable-next-line react/prefer-stateless-function
export function OpenDialog(props) {
	const { open } = props;

	const handleClose = () => {
		props.setAppState({ showOpenDialog: false });
	};

	return (
		<Dialog fullWidth open={open} onClose={handleClose}>
			<DialogTitle>
				<FormattedMessage id="DialogOpen.title" defaultMessage="Load Process" />
			</DialogTitle>
			<DialogContent>
				<MachineListComponent onItemClick={handleClose} />
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function mapStateToProps(state) {
	return {
		open: state.appState.showOpenDialog,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(OpenDialog);
