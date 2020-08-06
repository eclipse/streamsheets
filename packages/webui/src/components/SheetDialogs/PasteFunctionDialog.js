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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';
import { FormattedMessage } from 'react-intl';
import JSG from '@cedalo/jsg-ui';
import HelpIcon from '@material-ui/icons/HelpOutline';

import { graphManager } from '../../GraphManager';
import { functionStrings } from '../../languages/FunctionStrings';

const { Expression } = require('@cedalo/jsg-core');

const { SetCellDataCommand } = require('@cedalo/jsg-core');

let tableData = [];
let categories = [];
let uniqueId = 0;

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export default class PasteFunctionDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
		experimental: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			category: 'all',
			filter: '',
		};
	}

	onFilter = (event) => {
		this.setState({
			filter: event.target.value,
		});
	};

	updateData(cat) {
		if (!this.props.open) {
			return;
		}

		uniqueId = 0;
		tableData = [];
		categories = [];
		functionStrings.enumerateCategories((id, name) => {
			categories.push(
				<MenuItem value={id} key={id}>
					{name}
				</MenuItem>,
			);
		});

		functionStrings.enumerateFunctions(
			cat,
			(name, category, parameters, description, experimental) => {
				if (this.state.filter.length) {
					if (
						!name
							.toLowerCase()
							.includes(this.state.filter.toLowerCase())
					) {
						return;
					}
				}

				if (experimental === true && !this.props.experimental) {
					return;
				}

				let argumentList = '';
				const params = parameters.split(',');
				const {
					parameter,
				} = graphManager.getLocaleSettings().separators;

				if (params.length && params[0].length) {
					params.forEach((param, index) => {
						argumentList +=
							params.length === index + 1
								? `${param}`
								: `${param}${parameter}`;
					});
				}

				tableData.push({
					name,
					category,
					argumentList,
					description,
					selected: false,
					id: uniqueId,
				});
				uniqueId += 1;
			},
		);

		console.log('Undocumented Functions:');

		Object.keys(JSG.FormulaParser.context.functions).forEach((func) => {
			if (functionStrings.getStrings()[func] === undefined) {
				if (!func.startsWith('OLAP')) {
					console.log(func);
				}
			}
		});
	}

	handleCancel = () => {
		this.props.stateHandler({ showPasteFunctionsDialog: false });
	};

	handleChange = (event) => {
		this.setState({ category: event.target.value });
	};

	handleFunctionSelection = (key) => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView === undefined || key === -1) {
			return;
		}
		const item = sheetView.getItem();
		const pos = item.getOwnSelection().getActiveCell();
		if (pos === undefined) {
			return;
		}

		// put all params in "" to avoid parameters to be identified as known attribute name
		let paramsToInsert = '';
		const { parameter } = graphManager.getLocaleSettings().separators;
		const params = tableData[key].argumentList.split(parameter);

		if (params.length && params[0].length) {
			params.forEach((param, index) => {
				paramsToInsert +=
					params.length === index + 1 ? `"${param}"` : `"${param}",`;
			});
		}

		const formula = `${tableData[key].name}(${paramsToInsert})`;
		const div = JSG.editDiv;
		if (div && (div.contentEditable === 'true' || div.tagName === 'INPUT')) {
			div.append(document.createTextNode(formula));
		} else {
			const expr = new Expression(0, formula);
			expr.evaluate(item);
			expr.correctFormula(item);
			const ref = item.getOwnSelection().activeCellToString();
			const cmd = new SetCellDataCommand(item, ref, expr, false);
			graphManager.synchronizedExecute(cmd);
			sheetView.notify();
		}

		this.props.stateHandler({ showPasteFunctionsDialog: false });
	};

	handleFunctionHelp = (key) => {
		const url = `https://docs.cedalo.com/functions/${tableData[key].category}/${
			tableData[key].name.replace(/\./g, '')
		}.html`;
		window.open(url.toLowerCase(), '_blank');
	};

	render() {
		this.updateData(this.state.category);
		return (
			<Dialog
				open={this.props.open}
				onClose={this.handleCancel}
				maxWidth={false}
			>
				<DialogTitle>
					<FormattedMessage
						id="InsertFunctionHeader"
						defaultMessage="Insert Function"
					/>
				</DialogTitle>
				<DialogContent
					style={{
						height: '515px',
						width: '800px',
					}}
				>
					<div
						style={{
							display: 'inline-flex',
							justifyContent: 'space-between',
							width: '100%',
						}}
					>
						<FormControl
							style={{
								width: '200px',
								marginLeft: '18px',
								marginTop: '20px',
								marginBottom: '20px',
							}}
						>
							<InputLabel htmlFor="functions-insert">
								<FormattedMessage
									id="Category"
									defaultMessage="Category"
								/>
							</InputLabel>
							<Select
								value={this.state.category}
								onChange={this.handleChange}
								input={
									<Input
										name="functions-insert"
										id="functions-insert"
									/>
								}
							>
								{categories}
							</Select>
						</FormControl>
						<FormControl
							style={{
								width: '200px',
								marginTop: '16x',
								marginBottom: '20px',
							}}
						>
							<TextField
								type="search"
								label={
									<FormattedMessage
										id="Filter"
										defaultMessage="Filter"
									/>
								}
								autoFocus
								defaultValue={this.state.filter}
								onChange={this.onFilter}
							/>
						</FormControl>
					</div>
					<div
						style={{
							height: '425px',
							overflowY: 'scroll',
						}}
					>
						<List dense disablePadding>
							{tableData.map((row) => (
								<ListItem
									key={row.id}
									button
									onClick={() =>
										this.handleFunctionSelection(row.id)
									}
								>
									<ListItemText
										primary={`${row.name}(${
											row.argumentList
										})`}
										secondary={row.description}
									/>
									<ListItemSecondaryAction
										onClick={() =>
											this.handleFunctionHelp(row.id)
										}
									>
										<IconButton aria-label="Help">
											<HelpIcon />
										</IconButton>
									</ListItemSecondaryAction>
								</ListItem>
							))}
						</List>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color="primary"  onClick={this.handleCancel}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}
