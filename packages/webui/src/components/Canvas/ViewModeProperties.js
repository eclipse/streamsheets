/* eslint-disable react/jsx-no-duplicate-props */
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

/* eslint-disable react/prop-types, react/forbid-prop-types */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import {
	AppBar, Checkbox, FormControlLabel, FormGroup,
	IconButton, MenuItem,
	Paper,
	Slide, TextField,
	// FormControl,
	Typography
	// Typography
} from '@material-ui/core';
// import PropTypes from 'prop-types';
// import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
// import JSG from '@cedalo/jsg-ui';

import * as Actions from '../../actions/actions';
import { withStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import {FormattedMessage} from "react-intl";
import {graphManager} from "../../GraphManager";
// import {intl} from "../../helper/IntlGlobalProvider";

const styles = {
};

export class ViewModeProperties extends Component {
	handleClose = () => {
		this.props.setAppState({ showViewModeProperties: false });
	};

	invalidate() {
		graphManager.getGraph().markDirty();
	}

	getSheet(viewMode, sheet) {
		const selSheet = viewMode.sheets.filter((vsheet) => {
			return (vsheet.sheet === sheet.sheet);
		});

		return selSheet.length ? selSheet[0] : undefined;
	}

	handleOutboxChange = (event, state) => {
		const viewMode = {...this.props.viewMode};
		viewMode.outbox = state;
		this.props.setAppState({viewMode});
		this.invalidate();
	};

	handleHeaderChange = (event, state, sheet) => {
		const viewMode = {...this.props.viewMode};
		const nsheet = this.getSheet(viewMode, sheet);
		if (nsheet) {
			nsheet.hideheader = state;
			this.props.setAppState({viewMode});
			this.invalidate();
		}
	};

	handleGridChange = (event, state, sheet) => {
		const viewMode = {...this.props.viewMode};
		const nsheet = this.getSheet(viewMode, sheet);
		if (nsheet) {
			nsheet.hidegrid = state;
			this.props.setAppState({viewMode});
			this.invalidate();
		}
	};

	handleInboxChange = (event, state, sheet) => {
		const viewMode = {...this.props.viewMode};
		const nsheet = this.getSheet(viewMode, sheet);
		if (nsheet) {
			nsheet.hideinbox = state;
			this.props.setAppState({viewMode});
			this.invalidate();
		}
	};

	handleScrollChange = (event, state, sheet) => {
		const viewMode = {...this.props.viewMode};
		const nsheet = this.getSheet(viewMode, sheet);
		if (nsheet) {
			nsheet.scrolldisabled = state;
			this.props.setAppState({viewMode});
			this.invalidate();
		}
	};

	handleMaximizeChange = (event) => {
		const viewMode = {...this.props.viewMode}
		viewMode.maximize = event.target.value;
		this.props.setAppState({viewMode});
	};

	render() {
		const sheetNames = graphManager.getGraph().getStreamSheetNames();
		const {viewMode} = this.props;

		return (
			<Slide direction="left" in={this.props.showViewModeProperties} mountOnEnter unmountOnExit>
				<Paper
					square
					elevation={0}
					style={{
						border: '1px solid grey',
						position: 'absolute',
						top: '-1px',
						right: '0px',
						width: '300px',
						height: '100%',
						visibility: this.props.showViewModeProperties ? 'visible' : 'hidden',
						overflowX: 'hidden',
						overflowY: 'auto',
						zIndex: '1250'
					}}
				>
					<AppBar
						color="inherit"
						elevation={0}
						id={this.props.dummy}
						style={{
							backgroundColor: 'dimgrey',
							width: '100%',
							height: '48px',
							display: 'flex',
							flexDirection: 'row',
							position: 'relative',
							justifyContent: 'space-between'
						}}
					>
						<Typography
							style={{
								padding: '12px 0px 12px 8px',
								display: 'inline-block',
								fontSize: '12pt',
								color: 'white',
							}}
						>
							<FormattedMessage id="ViewModeSettings" defaultMessage="View Mode Settings" />
						</Typography>
						<IconButton
							style={{
								display: 'inline',
								color: 'white',
								padding: '12px'
							}}
							onClick={() => this.handleClose()}
						>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					</AppBar>
					<div
						style={{
							position: 'relative',
							margin: '8px'
						}}
					>
						<FormGroup>
							<TextField
								variant="outlined"
								size="small"
								margin="normal"
								label={
									<FormattedMessage id="ViewModeProperties.template" defaultMessage="Maximize Sheet" />
								}
								select
								fullWidth
								id="templates"
								value={viewMode.maximize}
								onChange={(event) => this.handleMaximizeChange(event)}
							>
								<MenuItem key="none" value="none">
									<FormattedMessage id="Nones" defaultMessage="None" />
								</MenuItem>
								{sheetNames.map((key) => (
									<MenuItem value={key} key={key}>
										{key}
									</MenuItem>
								))}
							</TextField>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.outbox}
										onChange={(event, state) =>
											this.handleOutboxChange(event, state)
										}
									/>
								}
								label={<FormattedMessage id="ViewModeProperties.ShowOutbox" defaultMessage="Show Outbox" />}
							/>
						</FormGroup>
						{viewMode.sheets.map((sheet) => (
							<FormGroup style={{marginTop: '10px'}}>
								<Typography style={{fontSize: '10pt'}}>
									{sheet.sheet}
								</Typography>
								<FormControlLabel
									style={{marginLeft: '8px'}}
									control={
										<Checkbox
											checked={sheet.hideheader}
											onChange={(event, state) =>
												this.handleHeaderChange(event, state, sheet)
											}
										/>
									}
									label={<FormattedMessage id="ViewModeProperties.Header" defaultMessage="Show Header" />}
								/>
								<FormControlLabel
									style={{marginLeft: '8px'}}
									control={
										<Checkbox
											checked={sheet.hidegrid}
											onChange={(event, state) =>
												this.handleGridChange(event, state, sheet)
											}
										/>
									}
									label={<FormattedMessage id="ViewModeProperties.Grid" defaultMessage="Show Grid" />}
								/>
								<FormControlLabel
									style={{marginLeft: '8px'}}
									control={
										<Checkbox
											checked={sheet.hideinbox}
											onChange={(event, state) =>
												this.handleInboxChange(event, state, sheet)
											}
										/>
									}
									label={<FormattedMessage id="ViewModeProperties.Inbox" defaultMessage="Show Inbox" />}
								/>
								<FormControlLabel
									style={{marginLeft: '8px'}}
									control={
										<Checkbox
											checked={sheet.scrolldisabled}
											onChange={(event, state) =>
												this.handleScrollChange(event, state, sheet)
											}
										/>
									}
									label={<FormattedMessage id="ViewModeProperties.Scrollbars" defaultMessage="Show Scrollbars" />}
								/>
							</FormGroup>
						))}
					</div>
				</Paper>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		showViewModeProperties: state.appState.showViewModeProperties,
		viewMode: state.appState.viewMode,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(ViewModeProperties));
