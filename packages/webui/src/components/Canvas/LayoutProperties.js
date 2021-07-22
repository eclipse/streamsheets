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
import JSG from '@cedalo/jsg-ui';

import { graphManager } from '../../GraphManager';
import CellRangeComponent from './CellRangeComponent';
import {intl} from "../../helper/IntlGlobalProvider";
import { FormattedMessage } from 'react-intl';
import MenuItem from '@material-ui/core/MenuItem';

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement `InputElement` interface
	React.useImperativeHandle(inputRef, () => ({
		focus: () => {}
	}));

	return <CellRangeComponent {...other} />;
}

export class LayoutProperties extends Component {
	state = {
		dummy: 0,
	}

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
		try {
			return this.getSheet(item).textToExpression(String(event.target.textContent));
		} catch (e) {
			this.getSheetView().notifyMessage({
				message: e.message,
				focusIndex: e.index !== undefined ? e.index + 1 : 1
			});
			return false;
		}
	}

	getAttributeHandler(label, item, name, options) {
		const sheetView = this.getSheetView();

		return (
			<TextField
				key={name}
				variant="outlined"
				size="small"
				fullWidth
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
		if (!expr) {
			return;
		}
		const path = JSG.AttributeUtils.createPath(JSG.ItemAttributes.NAME, name);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, expr.expression);

		graphManager.synchronizedExecute(cmd);
	}

	getLayoutType() {
		const item = this.props.view.getItem();

		return item.getLayoutCellAttributes().getLayout().getValue();
	}

	handleLayoutType = (event) => {
		const item = this.props.view.getItem();
		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.LAYOUT);
		const cmp = new JSG.CompoundCommand();
		cmp.add(new JSG.SetAttributeAtPathCommand(item, path, event.target.value));
		item.handleLayoutTypeChange(event.target.value, cmp);

		graphManager.synchronizedExecute(cmp);
		this.setState({
			dummy: Math.random()
		})
	};

	handleLayoutColumns = (event) => {
		const item = this.props.view.getItem();
		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.SECTIONS);
		const cmp = new JSG.CompoundCommand();
		cmp.add(new JSG.SetAttributeAtPathCommand(item, path, Number(event.target.value)));
		item.handleLayoutColumnChange(Number(event.target.value), cmp);

		graphManager.synchronizedExecute(cmp);
		this.setState({
			dummy: Math.random()
		})
	};

	handleLayoutMargin = (event) => {
		const margin = Number(event.target.value);

		if (Number.isNaN(margin) || margin < 0 || margin > 5000) {
			return;
		}

		const item = this.props.view.getItem();
		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.MARGIN);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, event.target.value);

		graphManager.synchronizedExecute(cmd);
		this.setState({
			dummy: Math.random()
		})
	};

	handleLayoutGap = (event) => {
		const gap = Number(event.target.value);

		if (Number.isNaN(gap) || gap < 0 || gap > 5000) {
			return;
		}

		const item = this.props.view.getItem();
		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.GAP);
		const cmd = new JSG.SetAttributeAtPathCommand(item, path, event.target.value);

		graphManager.synchronizedExecute(cmd);
		this.setState({
			dummy: Math.random()
		})
	};

	render() {
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const item = this.props.view.getItem();
		const line = item.getShape().getType() === JSG.LineShape.TYPE;
		return (
			<FormGroup id={this.props.dummy}
			   style={{
				   width: '100%'
			   }}
			>
				{line ? null : (
					<TextField
						variant="outlined"
						size="small"
						margin="normal"
						select
						value={this.getLayoutType()}
						onChange={event => this.handleLayoutType(event)}
						label={
							<FormattedMessage id="GraphItemProperties.Layout" defaultMessage="Layout" />
						}
					>
						<MenuItem value="none">
							<FormattedMessage id="GraphItemProperties.None" defaultMessage="None"/>
						</MenuItem>
						<MenuItem value="row">
							<FormattedMessage id="GraphItemProperties.RowLayout" defaultMessage="Row Layout"/>
						</MenuItem>
						<MenuItem value="column">
							<FormattedMessage id="GraphItemProperties.ColumnLayout" defaultMessage="Column Layout"/>
						</MenuItem>
					</TextField>
				)}
				{
					item.getLayoutCellAttributes().getLayout().getValue() === 'column' ? [
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							select
							value={item.getLayoutCellAttributes().getSections().getValue()}
							onChange={event => this.handleLayoutColumns(event)}
							label={
								<FormattedMessage id="GraphItemProperties.LayoutColumns" defaultMessage="Layout Columns" />
							}
						>
							<MenuItem value="2">
								2
							</MenuItem>
							<MenuItem value="3">
								3
							</MenuItem>
							<MenuItem value="4">
								4
							</MenuItem>
							<MenuItem value="5">
								5
							</MenuItem>
							<MenuItem value="6">
								6
							</MenuItem>
							<MenuItem value="7">
								7
							</MenuItem>
							<MenuItem value="8">
								8
							</MenuItem>
							<MenuItem value="9">
								9
							</MenuItem>
							<MenuItem value="10">
								10
							</MenuItem>
						</TextField>,
					] : null}
				{
					item.getLayoutCellAttributes().getLayout().getValue() === 'row' ? [
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							value={item.getLayoutCellAttributes().getMargin().getValue()}
							onChange={event => this.handleLayoutMargin(event)}
							label={
								<FormattedMessage id="GraphItemProperties.LayoutMargin" defaultMessage="Layout Margin" />
							}
						/>,
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							value={item.getLayoutCellAttributes().getGap().getValue()}
							onChange={event => this.handleLayoutGap(event)}
							label={
								<FormattedMessage id="GraphItemProperties.LayoutGap" defaultMessage="Layout Gap" />
							}
						/>
					] : null
				}
			</FormGroup>
		);
	}
}

export default LayoutProperties;
