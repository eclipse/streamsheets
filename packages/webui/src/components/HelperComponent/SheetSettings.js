/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { FormattedMessage } from 'react-intl';

import JSG from '@cedalo/jsg-ui';
import { Reference } from '@cedalo/parser';
import { accessManager } from '../../helper/AccessManager';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import MachineHelper from '../../helper/MachineHelper';

const { RESOURCE_ACTIONS } = accessManager;
const {
	CompoundCommand,
	SetNameCommand,
	SetAttributeAtPathCommand,
	AttributeUtils
} = JSG;

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class SheetSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			preferences: {
				showGrid: true,
				showHeader: true,
				showInbox: true,
				greyIfRows: true,
				sheetColumns: 52,
				sheetRows: 100,
				sheetProtect: false,
				sheetShowFormulas: false,
			},
		};
		this.handleClose = this.handleClose.bind(this);
		this.handleSave = this.handleSave.bind(this);
	}

	// componentDidMount() {
	// 	NotificationCenter.getInstance().register(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION, 'onButtonClicked');
	// }
	//
	// componentWillUnmount() {
	// 	NotificationCenter.getInstance().unregister(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION);
	// }

	// onButtonClicked(notification) {
	// 	if (notification.object) {
	// 		const info = notification.object;
	// 		const item = info.button;
	// 		if (item && item.getName().getValue() === 'settings') {
	// 			const sheet = info.container.getStreamSheet();
	// 			this.processSheet = sheet;
	//
	// 			this.setState({
	// 				name: sheet.getName().getValue(),
	// 				machineId: graphManager.graphWrapper.machineId,
	// 				streamsheetId: info.container
	// 					.getProcessSheetContainerAttributes()
	// 					.getSheetId()
	// 					.getValue(),
	// 			});
	// 			// stream sheet preferences
	// 			this.setState({
	// 				preferences: {
	// 					...this.state.preferences,
	// 					hideMessages: info.container
	// 						.getProcessSheetContainerAttributes()
	// 						.getHideMessages()
	// 						.getValue(),
	// 					showInbox: info.container
	// 						.getProcessSheetContainerAttributes()
	// 						.getInboxVisible()
	// 						.getValue(),
	// 					showGrid: sheet
	// 						.getWorksheetAttributes()
	// 						.getShowGrid()
	// 						.getValue(),
	// 					greyIfRows: sheet
	// 						.getWorksheetAttributes()
	// 						.getGreyIfRows()
	// 						.getValue(),
	// 					sheetProtect: sheet
	// 						.getWorksheetAttributes()
	// 						.getProtected()
	// 						.getValue(),
	// 					sheetRows: sheet
	// 						.getWorksheetAttributes()
	// 						.getRows()
	// 						.getValue(),
	// 					sheetColumns:
	// 						sheet
	// 							.getWorksheetAttributes()
	// 							.getColumns()
	// 							.getValue() + sheet.getColumns().getInitialSection(),
	// 					showHeader: sheet
	// 						.getWorksheetAttributes()
	// 						.getShowHeader()
	// 						.getValue(),
	// 					showFormulas: sheet
	// 						.getWorksheetAttributes()
	// 						.getShowFormulas()
	// 						.getValue(),
	// 				},
	// 			});
	// 			this.props.setAppState({
	// 				showSheetSettings: true,
	// 			});
	// 		}
	// 	}
	// }
	//
	handleSave = () => {
		this.props.saveProcessSettings(Object.assign({}, { ...this.state }));

		const cmd = new CompoundCommand();
		cmd.add(new SetNameCommand(this.processSheet, this.state.name));

		let path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWGRID);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showGrid));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWHEADER);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showHeader));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWFORMULAS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showFormulas));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.PROTECTED);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.sheetProtect));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.GREYIFROWS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.greyIfRows));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.ROWS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.sheetRows));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.COLUMNS);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet,
				path,
				this.state.preferences.sheetColumns - this.processSheet.getColumns().getInitialSection(),
			),
		);

		path = AttributeUtils.createPath(
			JSG.StreamSheetContainerAttributes.NAME,
			JSG.StreamSheetContainerAttributes.HIDEMESSAGES,
		);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet.getStreamSheetContainer(),
				path,
				this.state.preferences.hideMessages,
			),
		);

		path = AttributeUtils.createPath(
			JSG.StreamSheetContainerAttributes.NAME,
			JSG.StreamSheetContainerAttributes.INBOXVISIBLE,
		);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet.getStreamSheetContainer(),
				path,
				this.state.preferences.showInbox,
			),
		);

		graphManager.synchronizedExecute(cmd);
		graphManager
			.getGraph()
			.getMachineContainer()
			.layout();
		graphManager
			.getGraph()
			.getMachineContainer()
			.setRefreshNeeded(true);
		graphManager.redraw();

		this.handleClose();
	};

	handleShowGrid = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showGrid: state,
			},
		});
	};

	handleGreyIfRows = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				greyIfRows: state,
			},
		});
	};

	handleShowHeader = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showHeader: state,
			},
		});
	};

	handleShowFormulas = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showFormulas: state,
			},
		});
	};

	handleShowInbox = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showInbox: state,
			},
		});
	};

	handleSheetProtect = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetProtect: state,
			},
		});
	};

	handleSheetName = (event) => {
		this.setState({ name: event.target.value });
	};

	handleSheetRows = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetRows: Number(event.target.value),
			},
		});
	};

	handleSheetColumns = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetColumns: Number(event.target.value),
			},
		});
	};

	handleClose = () => {
		this.props.setAppState({ showSheetSettings: false });
	};

	render() {
		const canEdit = MachineHelper.currentMachineCan(RESOURCE_ACTIONS.EDIT);
		return (
			<Dialog open={this.props.open} onClose={() => this.handleClose()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="ProcessContainerSettings.title" defaultMessage="StreamSheet Settings" />
				</DialogTitle>
				<DialogContent
					style={{
						height: 'auto',
						minHeight: '370px',
						minWidth: '380px',
					}}
				>
					<div
						style={{
							marginTop: '20px',
						}}
					>
						<FormLabel
							style={{
								marginTop: '15px',
								display: 'block',
							}}
						>
							<FormattedMessage id="Sheet" defaultMessage="Sheet" />
						</FormLabel>
						<FormGroup
							style={{
								margin: '10px',
							}}
						>
							<TextField
								label={<FormattedMessage id="Name" defaultMessage="Name" />}
								margin="normal"
								fullWidth
								onChange={this.handleSheetName}
								value={this.state.name}
								disabled={!canEdit}
								error={!Reference.isValidIdentifier(this.state.name)}
								helperText={
									!Reference.isValidIdentifier(this.state.name) ? (
										<FormattedMessage
											id="Reference.InvalidName"
											defaultMessage="Only alphanumeric characters and the underscore are allowed"
										/>
									) : (
										''
									)
								}
							/>
							<div>
								<TextField
									disabled={!canEdit}
									style={{
										marginRight: '20px',
										width: '100px',
									}}
									id="number"
									label={<FormattedMessage id="Columns" defaultMessage="Columns" />}
									inputProps={{
										min: 1,
										max: 50,
										step: 1,
									}}
									error={this.state.preferences.sheetColumns > 50}
									helperText={
										this.state.preferences.sheetColumns > 50 ? (
											<FormattedMessage
												id="ProcessContainerSettings.tooManyColumns"
												defaultMessage="Only 50 columns allowed!"
											/>
										) : (
											''
										)
									}
									value={this.state.preferences.sheetColumns}
									onChange={(event) => this.handleSheetColumns(event)}
									type="number"
									margin="normal"
								/>
								<TextField
									disabled={!canEdit}
									style={{
										width: '100px',
									}}
									id="number"
									label={<FormattedMessage id="Rows" defaultMessage="Rows" />}
									inputProps={{
										min: 1,
										max: 300,
										step: 1,
									}}
									error={this.state.preferences.sheetRows > 300}
									helperText={
										this.state.preferences.sheetRows > 300 ? (
											<FormattedMessage
												id="ProcessContainerSettings.tooManyRows"
												defaultMessage="Only 300 rows allowed!"
											/>
										) : (
											''
										)
									}
									value={this.state.preferences.sheetRows}
									onChange={(event) => this.handleSheetRows(event)}
									type="number"
									margin="normal"
								/>
							</div>
							<FormControlLabel
								disabled={!canEdit}
								style={{
									marginTop: '15px',
								}}
								control={
									<Checkbox
										checked={this.state.preferences.sheetProtect}
										onChange={this.handleSheetProtect}
									/>
								}
								label={<FormattedMessage id="ProtectSheet" defaultMessage="Protect Sheet" />}
							/>
						</FormGroup>
						<FormLabel
							disabled={!canEdit}
							style={{
								marginTop: '20px',
								display: 'block',
							}}
						>
							<FormattedMessage id="View" defaultMessage="View" />
						</FormLabel>
						<FormGroup
							style={{
								margin: '10px',
							}}
						>
							<FormControlLabel
								disabled={!canEdit}
								control={
									<Checkbox
										checked={this.state.preferences.showGrid}
										onChange={this.handleShowGrid}
									/>
								}
								label={<FormattedMessage id="ShowGrid" defaultMessage="Show Grid" />}
							/>
							<FormControlLabel
								disabled={!canEdit}
								control={
									<Checkbox
										checked={this.state.preferences.showHeader}
										onChange={this.handleShowHeader}
									/>
								}
								label={<FormattedMessage id="ShowHeaders" defaultMessage="Show Headers" />}
							/>
							<FormControlLabel
								disabled={!canEdit}
								control={
									<Checkbox
										checked={this.state.preferences.showFormulas}
										onChange={this.handleShowFormulas}
									/>
								}
								label={<FormattedMessage id="ShowFormulas" defaultMessage="Show Formulas" />}
							/>
							<FormControlLabel
								disabled={!canEdit}
								control={
									<Checkbox
										checked={this.state.preferences.showInbox}
										onChange={this.handleShowInbox}
									/>
								}
								label={<FormattedMessage id="ShowInbox" defaultMessage="Show Inbox" />}
							/>
							<FormControlLabel
								disabled={!canEdit}
								control={
									<Checkbox
										checked={this.state.preferences.greyIfRows}
										onChange={this.handleGreyIfRows}
									/>
								}
								label={<FormattedMessage id="GreyIfRows" defaultMessage="Grey IF Rows" />}
							/>
						</FormGroup>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleClose} color="primary">
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button
						onClick={this.handleSave}
						color="primary"
						disabled={
							!canEdit ||
							this.state.preferences.sheetColumns > 50 ||
							this.state.preferences.sheetRows > 300 ||
							!Reference.isValidIdentifier(this.state.name)
						}
						autoFocus={canEdit}
					>
						<FormattedMessage id="SaveButton" defaultMessage="Save" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.showSheetSettings,
	};
}

const mapDispatchToProps = Actions;

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(SheetSettings);
