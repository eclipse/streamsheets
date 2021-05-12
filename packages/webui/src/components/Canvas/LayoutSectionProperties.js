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
	AppBar, IconButton, Paper, Slide, TextField // FormControl,
	// TextField
	// Typography
} from '@material-ui/core';
// import PropTypes from 'prop-types';
// import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import JSG from '@cedalo/jsg-ui';
import PropTypes from 'prop-types';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { withStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
// import {intl} from "../../helper/IntlGlobalProvider";

const styles = {
	icon: {
		color: 'white'
	},
	underline: {
		'&::before': {
			borderColor: 'white'
		},
		'&::after': {
			borderColor: 'white'
		},
		'&&&&:hover:before': {
			borderBottom: '2px solid white'
		}
	}
};

export class LayoutSectionProperties extends Component {
	static propTypes = {
		// title: PropTypes.string.isRequired,
		dummy: PropTypes.string
	};

	static defaultProps = {
		dummy: ''
	};

	state = {
		view: undefined,
		category: ''
	};

	componentDidMount() {
		// JSG.NotificationCenter.getInstance().register(
		// 	this,
		// 	JSG.PLOT_DOUBLE_CLICK_NOTIFICATION,
		// 	'onPlotDoubleClicked',
		// );
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION,
			'onGraphSelectionChanged',
		);
	}

	componentWillUnmount() {
		// JSG.NotificationCenter.getInstance().unregister(this, JSG.PLOT_DOUBLE_CLICK_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION);
	}

	onGraphSelectionChanged() {
		const viewer = graphManager.getGraphViewer();
		const context = viewer.getSelectionProvider().getSelectionContext();
		if (!context || context.obj !== 'layoutsection') {
			this.props.setAppState({showLayoutSectionProperties: false});
		}
		this.setState({dummy: String(Math.random())});
	}

	getSection() {
		const viewer = graphManager.getGraphViewer();
		const context = viewer.getSelectionProvider().getSelectionContext();
		if (context && context.obj === 'layoutsection') {
			return context.data;
		}
		return undefined;
	}

	// onPlotDoubleClicked(notification) {
	// 	if (notification.object && notification.object.open) {
	// 		this.props.setAppState({showLayoutSectionProperties: true});
	// 	}
	//
	// 	this.onGraphSelectionChanged();
	// }
	//
	handleClose = () => {
		this.props.setAppState({ showLayoutSectionProperties: false });
	};

	handleSize = (event, data) => {
		data.size = Number(event.target.value);
	};

	updateState() {
		// const view = LayoutSectionProperties.getView();
		// if (view === undefined) {
		// 	return;
		// }
		//
		// this.setState({
		// 	view
		// });
	}

	render() {
		if (!this.props.showLayoutSectionProperties) {
			return <div />;
		}
		const data = this.getSection();
		if (!data) {
			return null;
		}
		// const classes = this.props.classes;
		return (
			<Slide direction="left" in={this.props.showLayoutSectionProperties} mountOnEnter unmountOnExit>
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
						visibility: this.props.showLayoutSectionProperties ? 'visible' : 'hidden',
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
							<FormattedMessage id="LayoutSection" defaultMessage="Layout Section Settings" />
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
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							defaultValue={data.size}
							onBlur={event => this.handleSize(event, data)}
							label={
							<FormattedMessage id="GraphItemProperties.MinimumWidth" defaultMessage="Minimum Width" />}
						/>
					</div>
				</Paper>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		showLayoutSectionProperties: state.appState.showLayoutSectionProperties
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(LayoutSectionProperties));
