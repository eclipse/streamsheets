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
import { FormGroup, TextField } from '@material-ui/core';
// import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import JSG from '@cedalo/jsg-ui';

import { graphManager } from '../../GraphManager';
import CellRangeComponent from './CellRangeComponent';

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement `InputElement` interface
	React.useImperativeHandle(inputRef, () => ({
		focus: () => {}
	}));

	return <CellRangeComponent {...other} />;
}

export class GeometryProperties extends Component {
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

	handleX = () => {};

	getFormula(index) {
		const item = this.props.view.getItem();
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

	render() {
		const sheetView = this.props.view;
		if (!sheetView) {
			return <div />;
		}
		return (
			<FormGroup>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={
						<FormattedMessage
							id="GraphItemProperties.HorizontalPosition"
							defaultMessage="Horizontal Position"
						/>
					}
					onBlur={(event) => this.handleX(event)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleX(event);
						}
					}}
					value={this.getFormula(3)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(3)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={
						<FormattedMessage
							id="GraphItemProperties.VerticalPosition"
							defaultMessage="Vertical Position"
						/>
					}
					onBlur={(event) => this.handleX(event)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleX(event);
						}
					}}
					value={this.getFormula(4)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(4)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Width" defaultMessage="Width" />}
					onBlur={(event) => this.handleX(event)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleX(event);
						}
					}}
					value={this.getFormula(5)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(5)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Height" defaultMessage="Height" />}
					onBlur={(event) => this.handleX(event)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleX(event);
						}
					}}
					value={this.getFormula(6)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(6)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Rotation" defaultMessage="Rotation" />}
					onBlur={(event) => this.handleX(event)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleX(event);
						}
					}}
					value={this.getFormula(12)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(12)
						}
					}}
				/>
			</FormGroup>
		);
	}
}

export default GeometryProperties;
