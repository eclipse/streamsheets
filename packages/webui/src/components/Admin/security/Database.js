/* eslint-disable react/prop-types */
import FormGroup from '@material-ui/core/FormGroup';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import ImportIcon from '@material-ui/icons/CloudDownload';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../../actions/actions';
import { RESOURCE_ACTIONS, RESOURCE_TYPES } from '../../../helper/AccessManager';
import NotAuthorizedComponent from '../../Errors/NotAuthorizedComponent';
import { NotAllowed, Restricted } from '../../HelperComponent/Restricted';
import styles from './styles';
import ConfirmDialog from '../../base/confirmDialog/ConfirmDialog';

class Database extends Component {
	constructor(props) {
		super(props);
		this.dropzoneRef = React.createRef();
		this.state = {
			restoreFile: null,
		};
	}
	onRestoreFileSelected = (acceptedFiles) => {
		if (acceptedFiles.length === 1) {
			this.setState({ restoreFile: acceptedFiles[0] });
		} else if (acceptedFiles.length > 1) {
			// Only one file at a time can be restored
			this.props.showErrorDialog('Restore.Error.OnlyOneFile.Title', 'Restore.Error.OnlyOneFile.Message');
		}
	};

	handleDatabaseBackup = () => this.props.backup();

	handleDatabaseRestore = () => {
		this.props.restore(this.state.restoreFile);
		this.clearRestoreFile();
	};

	clearRestoreFile = () => this.setState({ restoreFile: null });

	render() {
		return (
			<Restricted oneOf={[{ type: RESOURCE_TYPES.SECURITY, action: RESOURCE_ACTIONS.EDIT }]}>
				<NotAllowed>
					<NotAuthorizedComponent />
				</NotAllowed>
				<div
					style={{
						// padding: '20px',
						height: '100%',
					}}
				>
					<ConfirmDialog
						onConfirm={this.handleDatabaseRestore}
						onCancel={this.clearRestoreFile}
						open={!!this.state.restoreFile}
						title={
							<FormattedMessage
								id="Database.Restore.Dialog.Confirm.Title"
								defaultMessage="Restore Database"
							/>
						}
						content={
							<FormattedMessage
								id="Database.Restore.Dialog.Confirm.Message"
								defaultMessage="Please confirm to restore the database"
							/>
						}
					/>
					<Dropzone
						ref={this.dropzoneRef}
						disableClick
						accept="application/json"
						onDropAccepted={this.onRestoreFileSelected}
						style={{ width: '100%', height: '100%' }}
					>
						{({ isDragAccept }) => (
							<div style={{ width: '100%', height: '100%' }}>
								{isDragAccept ? (
									<div
										style={{
											position: 'absolute',
											width: '100%',
											height: '100%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											backgroundColor: 'rgba(255, 255, 255, 0.3)',
											zIndex: 1,
										}}
									>
										<ImportIcon
											style={{
												color: 'rgba(0, 0, 0, 0.7)',
												fontSize: '100pt',
											}}
										/>
									</div>
								) : null}
								<FormGroup
									style={{
										margin: '10px',
									}}
								>
									<FormControl
										style={{
											marginTop: '10px',
											width: '200px',
											marginBottom: '10px',
											backgroundColor: 'rgb(255, 255, 255)'
										}}
									>
										<Button variant="outlined" onClick={this.props.backup}>
											<FormattedMessage id="Database.Backup" defaultMessage="Backup database" />
										</Button>
									</FormControl>
									<FormControl
										style={{
											marginTop: '10px',
											width: '200px',
											marginBottom: '10px',
											backgroundColor: 'rgb(255, 255, 255)'
										}}
									>
										<Button variant="outlined" onClick={() => this.dropzoneRef.current.open()}>
											<FormattedMessage id="Database.Restore" defaultMessage="Restore database" />
										</Button>
									</FormControl>
								</FormGroup>
							</div>
						)}
					</Dropzone>
				</div>
			</Restricted>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(
	connect(
		null,
		mapDispatchToProps,
	)(Database),
);
