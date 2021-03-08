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
import {intl} from "../../helper/IntlGlobalProvider";

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement  `InputElement` interface
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

	getAttributeHandler(label, item, name, round = 0) {
		const sheetView = this.getSheetView();

		return (
			<TextField
				variant="outlined"
				size="small"
				margin="normal"
				label={intl.formatMessage({ id: label })}
				onBlur={(event) => this.handleAttribute(event, item, name)}
				InputLabelProps={{shrink: true}}
				InputProps={{
					inputComponent: MyInputComponent,
					inputProps: {
						component: CellRangeComponent,
						sheetView,
						range: this.getFormula(item.getAttributeAtPath(name).getExpression(), round)
					}
				}}
			/>
		)
	}

	getPropertyHandler(label, handler, expression, round = 0) {
		const sheetView = this.getSheetView();

		return (
			<TextField
				key={label}
				variant="outlined"
				size="small"
				margin="normal"
				label={intl.formatMessage({ id: label })}
				onBlur={(event) => handler(event)}
				InputLabelProps={{shrink: true}}
				InputProps={{
					inputComponent: MyInputComponent,
					inputProps: {
						component: CellRangeComponent,
						sheetView,
						range: this.getFormula(expression, round)
					}
				}}
			/>
		)
	}

	handleAttribute(event, item, name) {
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetAttributeAtPathCommand(item, name, expr.expression);

		graphManager.synchronizedExecute(cmd);
	}

	handleX = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event).expression;
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		let cmd;

		if (line) {
			const startCoor = item.getStartCoordinate();

			if (expr.hasFormula()) {
				startCoor.setX(expr);
			} else {
				const point = new JSG.Point(expr.getValue(), 0);
				item.translateFromParent(point);
				startCoor.setX(new JSG.NumberExpression(point.x));
			}

			cmd = new JSG.SetLineCoordinateAtCommand(item, 0, startCoor);
		} else {
			item.getPin().setX(expr);
			cmd = new JSG.SetPinCommand(item, item.getPin());
		}

		graphManager.synchronizedExecute(cmd);
	}

	handleY = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event).expression;
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		let cmd;

		if (line) {
			const startCoor = item.getStartCoordinate();

			if (expr.hasFormula()) {
				startCoor.setY(expr);
			} else {
				const point = new JSG.Point(0, expr.getValue());
				item.translateFromParent(point);
				startCoor.setY(new JSG.NumberExpression(point.y));
			}

			cmd = new JSG.SetLineCoordinateAtCommand(item, 0, startCoor);
		} else {
			item.getPin().setY(expr);
			cmd = new JSG.SetPinCommand(item, item.getPin());
		}

		graphManager.synchronizedExecute(cmd);
	}

	handleWidth = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event).expression;
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		let cmd;

		if (line) {
			const endCoor = item.getEndCoordinate();

			if (expr.hasFormula()) {
				endCoor.setX(expr);
			} else {
				const point = new JSG.Point(expr.getValue(), 0);
				item.translateFromParent(point);
				endCoor.setX(new JSG.NumberExpression(point.x));
			}

			cmd = new JSG.SetLineCoordinateAtCommand(item, 1, endCoor);
		} else {
			cmd = new JSG.SetSizeCommand(item, new JSG.Size(expr, item.getHeight()));
		}
		graphManager.synchronizedExecute(cmd);
	}

	handleHeight = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event).expression;
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		let cmd;

		if (line) {
			const endCoor = item.getEndCoordinate();

			if (expr.hasFormula()) {
				endCoor.setY(expr);
			} else {
				const point = new JSG.Point(0, expr.getValue());
				item.translateFromParent(point);
				endCoor.setY(new JSG.NumberExpression(point.y));
			}

			cmd = new JSG.SetLineCoordinateAtCommand(item, 1, endCoor);
		} else {
			cmd = new JSG.SetSizeCommand(item, new JSG.Size(item.getWidth(), expr));
		}
		graphManager.synchronizedExecute(cmd);
	}

	handleRotation = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.RotateItemCommand(item, expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	handlePointRange = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetPointSourceCommand(item, expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	handleText = (event) => {
		const item = this.props.view.getItem();
		const expr = this.getExpression(item, event);
		const cmd = new JSG.SetTextCommand(item, item.getText(), expr.expression);
		graphManager.synchronizedExecute(cmd);
	}

	getX() {
		const item = this.props.view.getItem();
		const type = item.getShape().getType();
		let ret;

		if (type === JSG.LineShape.TYPE) {
			const coor = item.getStartCoordinate();
			ret = coor.getX().hasFormula() ? coor.getX() : new JSG.NumberExpression(item.getStartPoint().x);
		} else {
			ret = item.getPin().getX();
		}

		return ret;
	}

	getY() {
		const item = this.props.view.getItem();
		const type = item.getShape().getType();
		let ret;

		if (type === JSG.LineShape.TYPE) {
			const coor = item.getStartCoordinate();
			ret = coor.getY().hasFormula() ? coor.getY() : new JSG.NumberExpression(item.getStartPoint().y);
		} else {
			ret = item.getPin().getY();
		}

		return ret;
	}

	getWidth() {
		const item = this.props.view.getItem();
		const type = item.getShape().getType();
		let ret;

		if (type === JSG.LineShape.TYPE) {
			const coor = item.getEndCoordinate();
			ret = coor.getX().hasFormula() ? coor.getX() : new JSG.NumberExpression(item.getEndPoint().x);
		} else {
			ret = item.getWidth();
		}

		return ret;
	}

	getHeight() {
		const item = this.props.view.getItem();
		const type = item.getShape().getType();
		let ret;

		if (type === JSG.LineShape.TYPE) {
			const coor = item.getEndCoordinate();
			ret = coor.getY().hasFormula() ? coor.getY() : new JSG.NumberExpression(item.getEndPoint().y);
		} else {
			ret = item.getHeight();
		}

		return ret;
	}

	render() {
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const item = this.props.view.getItem();
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		return (
			<FormGroup>
				{this.getPropertyHandler(line ? "GraphItemProperties.StartX" : "GraphItemProperties.HorizontalPosition", this.handleX, this.getX())}
				{this.getPropertyHandler(line ? "GraphItemProperties.StartY" : "GraphItemProperties.VerticalPosition", this.handleY, this.getY())}
				{this.getPropertyHandler(line ? "GraphItemProperties.EndX" : "GraphItemProperties.Width", this.handleWidth, this.getWidth())}
				{this.getPropertyHandler(line ? "GraphItemProperties.EndY" : "GraphItemProperties.Height", this.handleHeight, this.getHeight())}
				{line ? null : this.getPropertyHandler("GraphItemProperties.Rotation", this.handleRotation, item.getAngle(), 2)}
				{line ? null : (
				<TextField
					variant="outlined"
					key="RotationCenter"
					size="small"
					margin="normal"
					label={
						<FormattedMessage id="GraphItemProperties.RotationCenter" defaultMessage="Rotation Center" />
					}
					// onBlur={(event) => this.handleParameter(event, 12)}
					InputLabelProps={{shrink: true}}
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
							range: ''
						}
					}}
				/>)}
				{item.getShape() instanceof JSG.PolygonShape ? (
					this.getPropertyHandler("GraphItemProperties.PointRange", this.handlePointRange, item.getShape().getSource())
				) : null}
				{item instanceof JSG.TextNode ? (
					this.getPropertyHandler("GraphItemProperties.Text", this.handleText, item.getText())
				) : null}
				{(item instanceof JSG.SheetButtonNode) ||
				(item instanceof JSG.SheetSliderNode) ||
				(item instanceof JSG.SheetKnobNode) ||
				(item instanceof JSG.SheetCheckboxNode) ? [
					this.getAttributeHandler("GraphItemProperties.Title", item, 'title'),
					this.getAttributeHandler("GraphItemProperties.Value", item, 'value'),
				] : null}
				{(item instanceof JSG.SheetKnobNode) ||
				(item instanceof JSG.SheetSliderNode) ? [
					this.getAttributeHandler("GraphItemProperties.Minimum", item, 'min', -1),
					this.getAttributeHandler("GraphItemProperties.Maximum", item, 'max', -1),
					this.getAttributeHandler("GraphItemProperties.Step", item, 'step', -1),
					this.getAttributeHandler("GraphItemProperties.Marker", item, 'marker'),
					this.getAttributeHandler("GraphItemProperties.FormatRange", item, 'formatrange'),
				] : null}
				{(item instanceof JSG.SheetKnobNode) ? [
					this.getAttributeHandler("GraphItemProperties.StartAngle", item, 'start', 2),
					this.getAttributeHandler("GraphItemProperties.EndAngle", item, 'end', 2),
				] : null}
			</FormGroup>
		);
	}
}

export default GeometryProperties;
