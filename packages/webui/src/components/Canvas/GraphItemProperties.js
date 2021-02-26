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
	IconButton,
	MenuItem,
	Paper,
	Slide,
	// FormControl,
	TextField
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
import {intl} from "../../helper/IntlGlobalProvider";
import {StreamChartProperties} from "./StreamChartProperties";
import {GeometryProperties} from "./GeometryProperties";

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

export class GraphItemProperties extends Component {
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
		document.addEventListener('keydown', this.escFunction, false);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.PLOT_DOUBLE_CLICK_NOTIFICATION,
			'onPlotDoubleClicked',
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION,
			'onGraphSelectionChanged',
		);
	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(this, JSG.PLOT_DOUBLE_CLICK_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION);
		document.removeEventListener('keydown', this.escFunction, false);
	}

	onGraphSelectionChanged() {
		const viewer = graphManager.getGraphViewer();
		const controller = viewer.getSelectionProvider().getFirstSelection();
		if (!controller) {
			return;
		}

		this.setState({dummy: String(Math.random())});
	}

	onPlotDoubleClicked(notification) {
		if (notification.object && notification.object.open) {
			this.props.setAppState({showStreamChartProperties: true});
		}

		this.onGraphSelectionChanged();
	}

	static getDerivedStateFromProps(props, state) {
		if (props.showStreamChartProperties === true) {
			const view = GraphItemProperties.getView();
			if (view && view !== state.view) {
				// const item = view.getItem();
				return {
					...state,
					view
				};
			}
		}
		return null;
	}

	getSelectedCategory() {
		const selection = this.state.view.getSelectedPropertyCategory();
		if (selection !== undefined) {
			return selection;
		}
		if (this.state.category === '' || !this.state.view.isValidPropertyCategory(this.state.category)) {
			return this.state.view.getDefaultPropertyCategory();
		}

		return this.state.category;
	}

	handleCategoryChange = (event) => {
		const item = this.state.view.getItem();
		const view = this.state.view;
		const data = event.target.value.split(';');

		view.setSelectedPropertyCategory(data);

		if (view.isValidPropertyCategory(data[0])) {
			this.setState({
				category: data[0]
			})
		} else {
			// this.updateState();
			JSG.NotificationCenter.getInstance().send(
				new JSG.Notification(JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION, item)
			);
			graphManager.redraw();
		}
	};

	getSheetView() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}

		let controller = selection[0].getParent();
		while (controller && !(controller.getModel() instanceof JSG.StreamSheet)) {
			controller = controller.getParent();
		}

		return controller ? controller.getView() : undefined;
	}

	static getView() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}
		return selection[0].getView();
	}

	getSheet(chart) {
		let ws = chart.getParent();
		while (ws && !(ws instanceof JSG.StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	escFunction(event) {
		if (event.keyCode === 27 && event.target && event.target.contentEditable !== 'true') {
			// this.props.setAppState({ showStreamChartProperties: false });
		}
	}

	handleClose = () => {
		this.props.setAppState({ showStreamChartProperties: false });
	};

	updateState() {
		const view = GraphItemProperties.getView();
		if (view === undefined) {
			return;
		}

		this.setState({
			view
		});
	}

	handleX = () => {};

	getFormula(index) {
		const item = GraphItemProperties.getView().getItem();
		const attr = item.getItemAttributes().getAttribute('sheetformula');

		if (attr && attr.getExpression()) {
			const term = attr.getExpression().getTerm();
			if (term && term.params && term.params.length > index) {
				const param = term.params[index];
				if (param.isStatic) {
					return `${param.toString()}`;
				} else {
					return `=${param.toString()}`;
				}
			}
		}
		return '';
	}

	getProperties() {
		const category = this.getSelectedCategory() || this.state.category;
		switch (category) {
			case 'general':
				return <GeometryProperties view={this.state.view}/>;
			default:
				if (this.state.view.isNewChart) {
					return <StreamChartProperties view={this.state.view}/>;
				}
		}

		return null;
	}

	render() {
		if (!this.state.view) {
			return <div />;
		}
		const item = this.state.view.getItem();
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const classes = this.props.classes;
		return (
			<Slide direction="left" in={this.props.showStreamChartProperties} mountOnEnter unmountOnExit>
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
						visibility: this.props.showStreamChartProperties ? 'visible' : 'hidden',
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
						<TextField
							size="small"
							margin="normal"
							color="secondary"
							select
							value={this.getSelectedCategory()}
							onChange={this.handleCategoryChange}
							style={{
								margin: '13px'
							}}
							InputProps={{
								classes: {
									underline: classes.underline
								},
								style: {
									color: 'white'
								}
							}}
							SelectProps={{
								classes: {
									icon: classes.icon
								},
								style: {
									color: 'white'
								}
							}}
						>
							{item.getPropertyCategories().map(category => (
									<MenuItem value={category.key} key={category.key}>
										{`${intl.formatMessage({ id: category.label }, {})} ${category.name}`}
									</MenuItem>
								)
							)}
						</TextField>
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
						{this.getProperties()}
					</div>
				</Paper>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		showStreamChartProperties: state.appState.showStreamChartProperties
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(GraphItemProperties));
