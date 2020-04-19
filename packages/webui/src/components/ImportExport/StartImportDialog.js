import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import * as Actions from '../../actions/actions';
import ImportDropzone from './ImportDropzone';

function StartImportDialog(props) {
	return (
		<Dialog fullWidth open={props.open} onClose={props.closeImportDialog}>
			<DialogTitle>
				<FormattedMessage id="DialogImport.title" defaultMessage="Import" />
			</DialogTitle>
			<DialogContent>
				<ImportDropzone enableClick>
					<div
						style={{
							minWidth: 300,
							minHeight: 300,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							margin: '16px 0px',
							border: 'dashed',
						}}
					>
						<FormattedMessage
							id="Import.StartDialog.DropZone.Message"
							defaultMessage="Drop file or click to select."
						/>
					</div>
				</ImportDropzone>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.closeImportDialog}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
			</DialogActions>
		</Dialog>
	);
}

StartImportDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	closeImportDialog: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
	return {
		open: state.import.showStartImportDialog,
	};
}

export default connect(
	mapStateToProps,
	Actions,
)(StartImportDialog);
