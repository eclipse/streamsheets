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
	AppBar,
	Checkbox,
	FormControlLabel,
	FormGroup,
	IconButton,
	MenuItem,
	Paper,
	Slide,
	TextField,
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
import { FormattedMessage } from 'react-intl';
import { graphManager } from '../../GraphManager';
// import {intl} from "../../helper/IntlGlobalProvider";

const styles = {};

const debounce = (f) => {
	let timeoutId = null;
	return (...args) =>{
		clearTimeout(timeoutId);
		timeoutId = setTimeout(f, 300, ...args)
	}
}

export class ViewModeProperties extends Component {
	handleClose = () => {
		this.props.setAppState({ showViewModeProperties: false });
	};

	handleOutboxChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.showOutbox = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleHeaderChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.showHeader = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleGridChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.showGrid = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleInboxChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.showInbox = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleScrollChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.allowScroll = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleZoomChange = (event, state) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.allowZoom = state;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	handleMaximizeChange = (event) => {
		const viewMode = { ...this.props.viewMode };
		viewMode.maximize = event.target.value;
		this.props.setAppState({ viewMode });
		this.saveViewMode(viewMode);
	};

	saveViewMode = debounce((viewMode) => {
		const { active, ...view } = viewMode;
		this.props.updateMachineSettings(this.props.machineId, { view })
	})

	render() {
		const sheetNames = graphManager.getGraph().getStreamSheetNames();
		const { viewMode } = this.props;
		setTimeout(() => {
			window.dispatchEvent(new Event('resize'));
		},0);

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
								color: 'white'
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
									<FormattedMessage
										id="ViewModeProperties.DisplaySheet"
										defaultMessage="Display Sheet"
									/>
								}
								select
								fullWidth
								id="templates"
								value={viewMode.maximize}
								onChange={(event) => this.handleMaximizeChange(event)}
							>
								{sheetNames.map((key) => (
									<MenuItem value={key} key={key}>
										{key}
									</MenuItem>
								))}
							</TextField>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.showHeader}
										onChange={(event, state) => this.handleHeaderChange(event, state)}
									/>
								}
								label={<FormattedMessage id="ViewModeProperties.Header" defaultMessage="Show Header" />}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.showGrid}
										onChange={(event, state) => this.handleGridChange(event, state)}
									/>
								}
								label={<FormattedMessage id="ViewModeProperties.Grid" defaultMessage="Show Grid" />}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.showInbox}
										onChange={(event, state) => this.handleInboxChange(event, state)}
									/>
								}
								label={<FormattedMessage id="ViewModeProperties.Inbox" defaultMessage="Show Inbox" />}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.showOutbox}
										onChange={(event, state) => this.handleOutboxChange(event, state)}
									/>
								}
								label={
									<FormattedMessage id="ViewModeProperties.ShowOutbox" defaultMessage="Show Outbox" />
								}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.allowScroll}
										onChange={(event, state) => this.handleScrollChange(event, state)}
									/>
								}
								label={
									<FormattedMessage
										id="ViewModeProperties.Scrollbars"
										defaultMessage="Allow Scrolling"
									/>
								}
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={viewMode.allowZoom}
										onChange={(event, state) => this.handleZoomChange(event, state)}
									/>
								}
								label={<FormattedMessage id="ViewModeProperties.Zoom" defaultMessage="Allow Zooming" />}
							/>
						</FormGroup>
					</div>
				</Paper>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		showViewModeProperties: state.appState.showViewModeProperties,
		machineId: state.monitor.machine.id,
		viewMode: state.appState.viewMode
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(
	connect(
		mapStateToProps,
		mapDispatchToProps
	)(ViewModeProperties)
);
