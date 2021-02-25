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

	getSheet(item) {
		let ws = item.getParent();
		while (ws && !(ws instanceof JSG.StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	getFormula(expr, round) {
		const item = this.props.view.getItem();
		return expr.toLocaleString(JSG.getParserLocaleSettings(), {
			item: this.getSheet(item),
			useName: true,
			round
		});
	}

	getExpression(item, event) {
		return this.getSheet(item).textToExpression(String(event.target.textContent), item);
	}

	handleX(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		item.getPin().setX(expr.expression);
		const cmd = new JSG.SetPinCommand(item, item.getPin());
		graphManager.synchronizedExecute(cmd);
	}

	handleY(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		item.getPin().setY(expr.expression);
		const cmd = new JSG.SetPinCommand(item, item.getPin());
		graphManager.synchronizedExecute(cmd);
	}

	handleWidth(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetSizeCommand(item, new JSG.Size(expr.expression, item.getHeight()));
		graphManager.synchronizedExecute(cmd);
	}

	handleHeight(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetSizeCommand(item, new JSG.Size(item.getWidth(), expr.expression));
		graphManager.synchronizedExecute(cmd);
	}

	handleRotation(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.RotateItemCommand(item, expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	handlePointRange(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetPointSourceCommand(item, expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	handleText(event) {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetTextCommand(item, item.getText(), expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	render() {
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const item = this.props.view.getItem();
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
					value={this.getFormula(item.getPin().getX(), 0)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(item.getPin().getX(), 0)
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
					onBlur={(event) => this.handleY(event)}
					value={this.getFormula(item.getPin().getY(), 0)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(item.getPin().getY(), 0)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Width" defaultMessage="Width" />}
					onBlur={(event) => this.handleWidth(event)}
					value={this.getFormula(item.getWidth(), 0)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(item.getWidth(), 0)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Height" defaultMessage="Height" />}
					onBlur={(event) => this.handleHeight(event)}
					value={this.getFormula(item.getHeight(), 0)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(item.getHeight(), 0)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={<FormattedMessage id="GraphItemProperties.Rotation" defaultMessage="Rotation" />}
					onBlur={(event) => this.handleRotation(event)}
					value={this.getFormula(item.getAngle(), 2)}
					InputLabelProps={{ shrink: true }}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							sheetView,
							value: {},
							range: this.getFormula(item.getAngle(), 2)
						}
					}}
				/>
				<TextField
					variant="outlined"
					size="small"
					margin="normal"
					label={
						<FormattedMessage id="GraphItemProperties.RotationCenter" defaultMessage="Rotation Center" />
					}
					// onBlur={(event) => this.handleParameter(event, 12)}
					onKeyPress={(event) => {
						if (event.key === 'Enter') {
							this.handleParameter(event, 12);
						}
					}}
					value=""
					InputLabelProps={{
						shrink: true
					}}
					InputProps={{
						inputComponent: MyInputComponent,
						inputProps: {
							component: CellRangeComponent,
							inputEditorType: 'string',
							inputEditorOptions: [
								{ value: '0', label: 'GraphItemProperties.LeftTop' },
								{ value: '1', label: 'GraphItemProperties.CenterTop' },
								{ value: '2', label: 'GraphItemProperties.RightTop' },
								{ value: '3', label: 'GraphItemProperties.LeftMiddle' },
								{ value: '4', label: 'GraphItemProperties.Center' },
								{ value: '5', label: 'GraphItemProperties.RightMiddle' },
								{ value: '6', label: 'GraphItemProperties.LeftBottom' },
								{ value: '7', label: 'GraphItemProperties.CenterBottom' },
								{ value: '8', label: 'GraphItemProperties.RightBottom' }
							],
							sheetView,
							value: {},
							range: ''
						}
					}}
				/>
				{item.getShape() instanceof JSG.PolygonShape ? (
					<TextField
						variant="outlined"
						size="small"
						margin="normal"
						label={<FormattedMessage id="GraphItemProperties.PointRange" defaultMessage="Point Range" />}
						onBlur={(event) => this.handlePointRange(event)}
						value={this.getFormula(item.getShape().getSource())}
						InputLabelProps={{ shrink: true }}
						InputProps={{
							inputComponent: MyInputComponent,
							inputProps: {
								component: CellRangeComponent,
								sheetView,
								value: {},
								range: this.getFormula(item.getShape().getSource())
							}
						}}
					/>
				) : null}
				{item instanceof JSG.TextNode ? (
					<TextField
						variant="outlined"
						size="small"
						margin="normal"
						label={<FormattedMessage id="GraphItemProperties.Text" defaultMessage="Text" />}
						onBlur={(event) => this.handleText(event)}
						value={this.getFormula(item.getText())}
						InputLabelProps={{ shrink: true }}
						InputProps={{
							inputComponent: MyInputComponent,
							inputProps: {
								component: CellRangeComponent,
								sheetView,
								value: {},
								range: this.getFormula(item.getText())
							}
						}}
					/>
				) : null}
			</FormGroup>
		);
	}
}

export default GeometryProperties;
