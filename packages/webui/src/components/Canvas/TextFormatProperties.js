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
import {FormGroup, TextField} from '@material-ui/core';
// import PropTypes from 'prop-types' ;
// import { FormattedMessage } from 'react-intl';
import JSG from '@cedalo/jsg-ui';

import { graphManager } from '../../GraphManager';
import CellRangeComponent from './CellRangeComponent';
import {intl} from "../../helper/IntlGlobalProvider";
// import {FormattedMessage} from "react-intl";

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement `InputElement` interface
	React.useImperativeHandle(inputRef, () => ({
		focus: () => {}
	}));

	return <CellRangeComponent {...other} />;
}

export class TextFormatProperties extends Component {
	state = {
		fillStyle: 0,
		gradientType: 0,
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
		const attr = item.getTextFormat().getAttribute(name);
		return attr.getExpression().toLocaleString(JSG.getParserLocaleSettings(), {
			item: this.getSheet(item),
			useName: true,
		});
	}

	getAttributesFormula(name) {
		const item = this.props.view.getItem();
		const attr = item.getItemAttributes().getAttribute(name);
		return attr.getExpression().toLocaleString(JSG.getParserLocaleSettings(), {
			item: this.getSheet(item),
			useName: true,
		});
	}

	getExpression(item, event) {
		return this.getSheet(item).textToExpression(String(event.target.textContent));
	}

	getAttributeHandler(label, item, name, itemAttribute, options) {
		const sheetView = this.getSheetView();

		return (
			<TextField
				key={name}
				variant="outlined"
				size="small"
				margin="normal"
				label={intl.formatMessage({ id: label })}
				onBlur={(event) => this.handleAttribute(event, item, name, itemAttribute)}
				InputLabelProps={{shrink: true}}
				InputProps={{
					inputComponent: MyInputComponent,
					inputProps: {
						component: CellRangeComponent,
						onlyReference: false,
						inputEditorType: options instanceof Array ? 'string' : options,
						inputEditorOptions: options instanceof Array ? options : undefined,
						sheetView,
						range: itemAttribute ? this.getAttributesFormula(name) : this.getFormula(name)
					}
				}}
			/>
		)
	}

	handleAttribute(event, item, name, itemAttribute) {
		const expr = this.getExpression(item, event);
		const path = JSG.AttributeUtils.createPath(itemAttribute ? JSG.ItemAttributes.NAME : JSG.TextFormatAttributes.NAME, name);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, expr.expression);

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
				{this.getAttributeHandler("GraphItemProperties.FontName", item, JSG.TextFormatAttributes.FONTNAME, false, [
					{ value: 'Arial'},
					{ value: 'Courier New'},
					{ value: 'Georgia'},
					{ value: 'Lucida'},
					{ value: 'Lucida Console'},
					{ value: 'Palatino'},
					{ value: 'Tahoma'},
					{ value: 'Trebuchet MS'},
					{ value: 'Verdana'},
					])}
				{this.getAttributeHandler("GraphItemProperties.FontSize", item, JSG.TextFormatAttributes.FONTSIZE, false, [
					{ value: '7'},
					{ value: '8'},
					{ value: '9'},
					{ value: '10'},
					{ value: '11'},
					{ value: '12'},
					{ value: '14'},
					{ value: '18'},
					{ value: '24'},
					{ value: '36'},
				])}
				{this.getAttributeHandler("GraphItemProperties.FontColor", item, JSG.TextFormatAttributes.FONTCOLOR, false, 'color')}
				{this.getAttributeHandler("GraphItemProperties.FontStyle", item, JSG.TextFormatAttributes.FONTSTYLE, false, [
					{ value: '0', label: 'GraphItemProperties.Normal'},
					{ value: '1', label: 'GraphItemProperties.Bold'},
					{ value: '2', label: 'GraphItemProperties.Italic'},
					{ value: '3', label: 'GraphItemProperties.BoldItalic'},
				])}
				{this.getAttributeHandler("GraphItemProperties.Alignment", item, JSG.TextFormatAttributes.HORIZONTALALIGN, false, [
					{ value: '0', label: 'GraphItemProperties.Left'},
					{ value: '1', label: 'GraphItemProperties.AlignCenter'},
					{ value: '2', label: 'GraphItemProperties.Right'},
				])}
				{this.getAttributeHandler("GraphItemProperties.HorizontalPosition", item, JSG.TextFormatAttributes.HORIZONTALPOSITION, false, [
					{ value: '0', label: 'GraphItemProperties.Custom'},
					{ value: '1', label: 'GraphItemProperties.LeftOutside'},
					{ value: '2', label: 'GraphItemProperties.Left'},
					{ value: '3', label: 'GraphItemProperties.Center'},
					{ value: '4', label: 'GraphItemProperties.Right'},
					{ value: '5', label: 'GraphItemProperties.RightOutSide'},
				])}
				{this.getAttributeHandler("GraphItemProperties.VerticalPosition", item, JSG.TextFormatAttributes.VERTICALPOSITION, false, [
					{ value: '0', label: 'GraphItemProperties.Custom'},
					{ value: '1', label: 'GraphItemProperties.Above'},
					{ value: '2', label: 'GraphItemProperties.Top'},
					{ value: '3', label: 'GraphItemProperties.Center'},
					{ value: '4', label: 'GraphItemProperties.Bottom'},
					{ value: '5', label: 'GraphItemProperties.Below'},
				])}
				{this.getAttributeHandler("GraphItemProperties.LeftMargin", item, JSG.ItemAttributes.MARGINLEFT, true)}
				{this.getAttributeHandler("GraphItemProperties.RightMargin", item, JSG.ItemAttributes.MARGINRIGHT, true)}
				{this.getAttributeHandler("GraphItemProperties.TopMargin", item, JSG.ItemAttributes.MARGINTOP, true)}
				{this.getAttributeHandler("GraphItemProperties.BottomMargin", item, JSG.ItemAttributes.MARGINBOTTOM, true)}
			</FormGroup>
		);
	}
}

export default TextFormatProperties;
