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
// import { FormattedMessage } from 'react-intl';
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

export class EventProperties extends Component {
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
		const attr = item.getEvents().getAttribute(name);
		const val = attr.getValue();
		if (val === '') {
			return '';
		}

		return `=${attr.getValue()}`;
	}

	getExpression(item, event) {
		let formula = String(event.target.textContent);
		const asText = formula.charAt(0) === "=";
		if (asText) formula = formula.substring(1);
		return new JSG.StringExpression(formula);
	}

	getAttributeHandler(label, item, name) {
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
						onlyReference: false,
						component: CellRangeComponent,
						sheetView,
						range: this.getFormula(name)
					}
				}}
			/>
		)
	}

	handleAttribute(event, item, name) {
		const expr = this.getExpression(item, event);
		const path = JSG.AttributeUtils.createPath(JSG.EventAttributes.NAME, name);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, expr);

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
				{this.getAttributeHandler("GraphItemProperties.OnClick", item, JSG.EventAttributes.ONCLICK)}
				{this.getAttributeHandler("GraphItemProperties.OnDoubleClick", item, JSG.EventAttributes.ONDOUBLECLICK)}
				{this.getAttributeHandler("GraphItemProperties.OnMouseDown", item, JSG.EventAttributes.ONMOUSEDOWN)}
				{this.getAttributeHandler("GraphItemProperties.OnMouseUp", item, JSG.EventAttributes.ONMOUSEUP)}
				{
				(item instanceof JSG.SheetKnobNode) ||
				(item instanceof JSG.SheetSliderNode) ? [
					this.getAttributeHandler("GraphItemProperties.OnValueChange", item, JSG.EventAttributes.ONVALUECHANGE),
				] : null}
			</FormGroup>
		);
	}
}

export default EventProperties;
