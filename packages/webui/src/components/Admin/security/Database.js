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
/* eslint-disable react/prop-types */
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import { withStyles } from '@material-ui/core/styles';
import ImportIcon from '@material-ui/icons/CloudDownload';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { showErrorDialog, backup, restore } from '../../../actions/actions';
import ConfirmDialog from '../../base/confirmDialog/ConfirmDialog';
import NotAuthorizedComponent from '../../Errors/NotAuthorizedComponent';
import { NotAllowed, Restricted } from '../../HelperComponent/Restricted';
import styles from './styles';

const AfterRestoreInfoDialog = (props) => {
	const { open } = props;
	return (
		<div>
			<Dialog open={open}>
				<DialogTitle>
					<FormattedMessage id="Database.Restore.Dialog.Success.Title" defaultMessage="Restore Success" />
				</DialogTitle>
				<DialogContent
					style={{
						margin: '20px 10px 10px 5px'
					}}
				>
					<FormattedMessage
						id="Database.Restore.Dialog.Success.Message"
						defaultMessage="Database restored successfully. Please restart Streamsheets to complete the process."
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
};

class Database extends Component {
	constructor(props) {
		super(props);
		this.dropzoneRef = React.createRef();
		this.state = {
			restoreFile: null,
			restoreDone: false
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

	handleDatabaseRestore = async () => {
		try {
			await this.props.restore(this.state.restoreFile);
			this.setState({ restoreDone: true });
		} catch (error) {
			// TODO: Handle error
		}
		this.clearRestoreFile();
	};

	clearRestoreFile = () => this.setState({ restoreFile: null });

	render() {
		return (
			<Restricted oneOf={['database']}>
				<NotAllowed>
					<NotAuthorizedComponent />
				</NotAllowed>
				<div
					style={{
						// padding: '20px',
						height: '100%'
					}}
				>
					<AfterRestoreInfoDialog open={this.state.restoreDone} />
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
								values={{
									restoreFileName: this.state.restoreFile && this.state.restoreFile.name
								}}
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
											zIndex: 1
										}}
									>
										<ImportIcon
											style={{
												color: 'rgba(0, 0, 0, 0.7)',
												fontSize: '100pt'
											}}
										/>
									</div>
								) : null}
								<FormGroup
									style={{
										margin: '10px'
									}}
								>
									<FormControl
										style={{
											marginTop: '10px',
											width: '200px',
											marginBottom: '10px',
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

const mapDispatchToProps = {
	showErrorDialog,
	backup,
	restore
};

export default withStyles(styles)(connect(null, mapDispatchToProps)(Database));
