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

export class AttributeProperties extends Component {
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
		const attr = item.getItemAttributes().getAttribute(name);
		return attr.getExpression().toLocaleString(JSG.getParserLocaleSettings(), {
			item: this.getSheet(item),
			useName: true,
		});
	}

	getExpression(item, event) {
		return this.getSheet(item).textToExpression(String(event.target.textContent), item);
	}

	getAttributeHandler(label, item, name, options) {
		const sheetView = this.getSheetView();

		return (
			<TextField
				key={name}
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
						onlyReference: false,
						inputEditorType: options instanceof Array ? 'string' : options,
						inputEditorOptions: options instanceof Array ? options : undefined,
						sheetView,
						range: this.getFormula(name)
					}
				}}
			/>
		)
	}

	handleAttribute(event, item, name) {
		const expr = this.getExpression(item, event);
		const path = JSG.AttributeUtils.createPath(JSG.ItemAttributes.NAME, name);
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
				{this.getAttributeHandler("GraphItemProperties.Container", item, JSG.ItemAttributes.CONTAINER)}
				{this.getAttributeHandler("GraphItemProperties.Selection", item, JSG.ItemAttributes.SELECTIONMODE,  [
					{ value: '0', 'label': 'Not selectable'},
					{ value: '1', 'label': 'On Border'},
					{ value: '2', 'label': 'On Area'},
					{ value: '4', 'label': 'Default'},
				])}
				{this.getAttributeHandler("GraphItemProperties.Clip", item, JSG.ItemAttributes.CLIPCHILDREN)}
				{this.getAttributeHandler("GraphItemProperties.Closed", item, JSG.ItemAttributes.CLOSED)}
				{this.getAttributeHandler("GraphItemProperties.Visible", item, JSG.ItemAttributes.VISIBLE)}
				{this.getAttributeHandler("GraphItemProperties.Sizeable", item, JSG.ItemAttributes.SIZEABLE)}
				{this.getAttributeHandler("GraphItemProperties.Deletable", item, JSG.ItemAttributes.DELETEABLE)}
				{this.getAttributeHandler("GraphItemProperties.Moveable", item, JSG.ItemAttributes.MOVEABLE,  [
					{ value: '0', 'label': 'Not moveable'},
					{ value: '1', 'label': 'Only vertical'},
					{ value: '2', 'label': 'Only horizontal'},
					{ value: '3', 'label': 'Move free'},
					])}
			</FormGroup>
		);
	}
}

export default AttributeProperties;
