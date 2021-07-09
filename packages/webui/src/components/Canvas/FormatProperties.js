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
import {FormGroup, TextField, Typography} from '@material-ui/core';
// import PropTypes from 'prop-types' ;
// import { FormattedMessage } from 'react-intl';
import JSG from '@cedalo/jsg-ui';

import { graphManager } from '../../GraphManager';
import CellRangeComponent from './CellRangeComponent';
import {intl} from "../../helper/IntlGlobalProvider";
import {FormattedMessage} from "react-intl";

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement `InputElement` interface
	React.useImperativeHandle(inputRef, () => ({
		focus: () => {}
	}));

	return <CellRangeComponent {...other} />;
}

export class FormatProperties extends Component {
	state = {
		fillStyle: 0,
		gradientType: 0,
		dummy: 0,
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

	getSheet(item) {
		let ws = item.getParent();
		while (ws && !(ws instanceof JSG.StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	getFormula(name) {
		const item = this.props.view.getItem();
		const attr = item.getFormat().getAttribute(name);
		return attr.getExpression().toLocaleString(JSG.getParserLocaleSettings(), {
			item: this.getSheet(item),
			useName: true,
		});
	}

	getExpression(item, value) {
		return this.getSheet(item).textToExpression(String(value));
	}

	getAttributeHandler(label, item, name, options = 'none') {
		const sheetView = this.getSheetView();

		return (
			<TextField
				key={name}
				variant="outlined"
				fullWidth
				size="small"
				margin="normal"
				label={intl.formatMessage({ id: label })}
				InputLabelProps={{shrink: true}}
				InputProps={{
					inputComponent: MyInputComponent,
					inputProps: {
						component: CellRangeComponent,
						onlyReference: false,
						onValueChange: (value) => this.handleAttribute(value, item, name),
						inputEditorType: options instanceof Array ? 'string' : options,
						inputEditorOptions: options instanceof Array ? options : undefined,
						sheetView,
						range: this.getFormula(name)
					}
				}}
			/>
		)
	}

	handleAttribute(value, item, name) {
		const expr = this.getExpression(item, value);
		const path = JSG.AttributeUtils.createPath(JSG.FormatAttributes.NAME, name);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, expr.expression);

		graphManager.synchronizedExecute(cmd);

		if (name === JSG.FormatAttributes.FILLSTYLE) {
			this.setState({fillStyle: item.getFormat().getFillStyle().getValue()});
		}
		if (name === JSG.FormatAttributes.GRADIENTTYPE) {
			this.setState({gradientType: item.getFormat().getGradientType().getValue()});
		}
		this.setState({dummy: Math.random()});
	}

	render() {
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const item = this.props.view.getItem();
		return (
			<FormGroup
				style={{
					width: '100%'
				}}
			>
				<Typography variant="subtitle1" style={{marginTop: '5px', marginBottom: '5px'}}>
					<FormattedMessage id="GraphItemProperties.Line" defaultMessage="Line" />
				</Typography>
				{this.getAttributeHandler("GraphItemProperties.LineColor", item, JSG.FormatAttributes.LINECOLOR, 'color')}
				{this.getAttributeHandler("GraphItemProperties.LineWidth", item, JSG.FormatAttributes.LINEWIDTH)}
				{this.getAttributeHandler("GraphItemProperties.LineStyle", item, JSG.FormatAttributes.LINESTYLE, [
					{ value: '0', label: 'GraphItemProperties.NoLS' },
					{ value: '1', label: 'GraphItemProperties.SolidLS' },
					{ value: '2', label: 'GraphItemProperties.Dot' },
					{ value: '3', label: 'GraphItemProperties.Dash' },
					{ value: '4', label: 'GraphItemProperties.DashDot' },
					{ value: '5', label: 'GraphItemProperties.DashDotDot' },
					{ value: '6', label: 'GraphItemProperties.ShortDash' },
					{ value: '7', label: 'GraphItemProperties.LongDash' },
					])}
				{item.getItemAttributes().getClosed().getValue() === false ? (
					this.getAttributeHandler("GraphItemProperties.StartArrow", item, JSG.FormatAttributes.LINEARROWSTART, [
							{ value: '0', label: 'GraphItemProperties.NoArrow' },
							{ value: '1', label: 'GraphItemProperties.ArrowFilled' },
							{ value: '2', label: 'GraphItemProperties.ArrowFilledSmall' },
							{ value: '7', label: 'GraphItemProperties.ArrowDoubleFilled' },
							{ value: '14', label: 'GraphItemProperties.ArrowReverse' },
							{ value: '22', label: 'GraphItemProperties.ArrowCircle' },
							{ value: '24', label: 'GraphItemProperties.ArrowDiamond' },
							{ value: '29', label: 'GraphItemProperties.ArrowDoubleLine' },
							{ value: '30', label: 'GraphItemProperties.ArrowSquare' },
						])
				) : null}
				{item.getItemAttributes().getClosed().getValue() === false ? (
					this.getAttributeHandler("GraphItemProperties.EndArrow", item, JSG.FormatAttributes.LINEARROWEND, [
						{ value: '0', label: 'GraphItemProperties.NoArrow' },
						{ value: '1', label: 'GraphItemProperties.ArrowFilled' },
						{ value: '2', label: 'GraphItemProperties.ArrowFilledSmall' },
						{ value: '7', label: 'GraphItemProperties.ArrowDoubleFilled' },
						{ value: '14', label: 'GraphItemProperties.ArrowReverse' },
						{ value: '22', label: 'GraphItemProperties.ArrowCircle' },
						{ value: '24', label: 'GraphItemProperties.ArrowDiamond' },
						{ value: '29', label: 'GraphItemProperties.ArrowDoubleLine' },
						{ value: '30', label: 'GraphItemProperties.ArrowSquare' },
					])
				) : null}
				{this.getAttributeHandler("GraphItemProperties.LineCorner", item, JSG.FormatAttributes.LINECORNER)}
				<Typography variant="subtitle1" style={{marginTop: '8px', marginBottom: '5px'}}>

					<FormattedMessage id="GraphItemProperties.Fill" defaultMessage="Fill" />
				</Typography>
				{this.getAttributeHandler("GraphItemProperties.FillStyle", item, JSG.FormatAttributes.FILLSTYLE,[
					{ value: '0', label: 'GraphItemProperties.None' },
					{ value: '1', label: 'GraphItemProperties.Solid' },
					{ value: '2', label: 'GraphItemProperties.Gradient' },
					{ value: '3', label: 'GraphItemProperties.Pattern' },
				])}
				{item.getFormat().getFillStyle().getValue() ?  (
					this.getAttributeHandler("GraphItemProperties.FillColor", item, JSG.FormatAttributes.FILLCOLOR, 'color')
				) : null}
				{item.getFormat().getFillStyle().getValue() === 2 ?  [
					this.getAttributeHandler("GraphItemProperties.FillColorBack", item, JSG.FormatAttributes.GRADIENTCOLOR, 'color'),
					this.getAttributeHandler("GraphItemProperties.GradientStyle", item, JSG.FormatAttributes.GRADIENTTYPE,[
						{ value: '0', label: 'GraphItemProperties.Linear' },
						{ value: '1', label: 'GraphItemProperties.Radial' },
					])
				]
				: null}
				{item.getFormat().getFillStyle().getValue() === 2 && item.getFormat().getGradientType().getValue() === 0 ?  (
						this.getAttributeHandler("GraphItemProperties.GradientAngle", item, JSG.FormatAttributes.GRADIENTANGLE)
					)
					: null}
				{item.getFormat().getFillStyle().getValue() === 2 && item.getFormat().getGradientType().getValue() === 1 ?  [
						this.getAttributeHandler("GraphItemProperties.XOFFSET", item, JSG.FormatAttributes.GRADIENTOFFSET_X),
						this.getAttributeHandler("GraphItemProperties.YOFFSET", item, JSG.FormatAttributes.GRADIENTOFFSET_Y)
					]
					: null}
				{item.getFormat().getFillStyle().getValue() === 3 ?  (
						this.getAttributeHandler("GraphItemProperties.Pattern", item, JSG.FormatAttributes.PATTERN)
					)
					: null}
			</FormGroup>
		);
	}
}

export default FormatProperties;
