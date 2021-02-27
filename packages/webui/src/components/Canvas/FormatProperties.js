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

	getExpression(item, event) {
		return this.getSheet(item).textToExpression(String(event.target.textContent), item);
	}

	getAttributeHandler(label, item, name, options) {
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
					inputEditorType: options ? 'string' : 'none',
					inputEditorOptions: options,
					inputProps: {
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
		const path = JSG.AttributeUtils.createPath(JSG.FormatAttributes.NAME, name);
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
				<Typography variant="subtitle1" style={{marginTop: '5px', marginBottom: '5px'}}>
					<FormattedMessage id="GraphItemProperties.Line" defaultMessage="Line" />
				</Typography>
				{this.getAttributeHandler("GraphItemProperties.LineColor", item, JSG.FormatAttributes.LINECOLOR)}
				{this.getAttributeHandler("GraphItemProperties.LineWidth", item, JSG.FormatAttributes.LINEWIDTH)}
				{this.getAttributeHandler("GraphItemProperties.LineStyle", item, JSG.FormatAttributes.LINESTYLE)}
				<Typography variant="subtitle1" style={{marginTop: '8px', marginBottom: '5px'}}>
					<FormattedMessage id="GraphItemProperties.Fill" defaultMessage="Fill" />
				</Typography>
				{this.getAttributeHandler("GraphItemProperties.FillStyle", item, JSG.FormatAttributes.FILLSTYLE,[
					{ value: '0', label: 'GraphItemProperties.None' },
					{ value: '1', label: 'GraphItemProperties.Solid' },
					{ value: '2', label: 'GraphItemProperties.Gradient' },
					{ value: '3', label: 'GraphItemProperties.Pattern' },
				])}
				{this.getAttributeHandler("GraphItemProperties.FillColor", item, JSG.FormatAttributes.FILLCOLOR)}
			</FormGroup>
		);
	}
}

export default FormatProperties;
