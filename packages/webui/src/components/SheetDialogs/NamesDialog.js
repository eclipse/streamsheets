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
/* eslint-disable react/no-unused-state */
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import { FormattedMessage } from 'react-intl';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Clear';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { Reference } from '@cedalo/parser';
import JSG from '@cedalo/jsg-ui';
import {
	Expression,
	DeleteSheetNameCommand,
	AddSheetNameCommand,
	SetSheetNameCommand,
	SheetName,
	SheetReference
} from '@cedalo/jsg-core';

import { graphManager } from '../../GraphManager';
import { intl } from '../../helper/IntlGlobalProvider';

let uniqueId = 0;

const verifyNames = (valid, row) => {
	// console.log(`${row.name} is valid: ${Reference.isValidIdentifier(row.name)}`);
	return valid && Reference.isValidIdentifier(row.name);
};

const createNameUpdateCommand = (name, graph) => {
	let cmd;
	if (name.added) {
		cmd = new AddSheetNameCommand(graph, new SheetName(name.name, new Expression(0, name.expression)));
	} else if (name.deleted) {
		const nameItem = graph.getSheetName(name.name);
		cmd = nameItem ? new DeleteSheetNameCommand(graph, nameItem) : null;
	} else if (name.changed) {
		const nameItem = graph.getSheetName(name.oldName);
		cmd = nameItem ? new SetSheetNameCommand(graph, nameItem, name.name, new Expression(0, name.expression)) : null;
	}
	return cmd;
};

export default class NamesDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired
	};

	constructor(props) {
		super(props);

		this.state = {
			open: props.open,
			closeDisabled: false,
			globalData: undefined,
		};
	}

	static getDerivedStateFromProps(props, state) {
		let data = state.globalData;

		if (state.globalData === undefined) {
			const names = graphManager
				.getGraph()
				.getSheetNames()
				.filter((name) => !name.getName().startsWith('|'));
			uniqueId = 0;
			data = [];

			names.forEach((name) => {
				data.push({
					name: name.getName(),
					oldName: name.getName(),
					expression: name.getFormula(),
					errorName: '',
					errorExpression: '',
					id: uniqueId,
					data: name,
					deleted: false,
					changed: false,
					added: false
				});
				uniqueId += 1;
			});
		}

		return {...state, open: props.open, globalData: data};
	}

	handleDelete = (row) => () => {
		row.deleted = true;
		this.setState({ globalData: this.state.globalData });
	};

	handleChange = (event, text) => {
		this.setState({
			value: text
		});
	};

	handleBlur = (event, row, name) => {
		const rowData = row;
		let closeDisabled = false;

		const data = this.state.globalData;

		switch (name) {
			case 'name': {
				const currentName = event.target.value;
				rowData.errorName = '';
				if (currentName.length === 0) {
					rowData.errorName = 'Name must be provided!';
					closeDisabled = true;
				} else {
					data.some((lrow) => {
						if (row.id !== lrow.id && currentName === lrow.name) {
							rowData.errorName = intl.formatMessage({ id: 'DialogNames.unique' }, {});
							closeDisabled = true;
							return true;
						}
						return false;
					});
				}
				if (rowData.errorName === '') {
					rowData.name = currentName;
					rowData.changed = true;
				}
				break;
			}
			case 'expression':
				try {
					const formula = String(event.target.value);
					if (formula.indexOf('!') === -1) {
						closeDisabled = true;
						rowData.errorExpression = intl.formatMessage({ id: 'DialogNames.referenceAllowed' }, {});
					} else {
						const term = JSG.FormulaParser.parse(
							event.target.value,
							graphManager.getGraph(),
							graphManager.getGraph()
						);
						if (term && term.operand instanceof SheetReference) {
							rowData.expression = event.target.value;
							rowData.errorExpression = '';
						} else {
							closeDisabled = true;
							rowData.errorExpression = intl.formatMessage({ id: 'DialogNames.referenceAllowed' }, {});
						}
					}
					rowData.changed = true;
				} catch (e) {
					rowData.errorExpression = e.message;
					closeDisabled = true;
				}

				break;
			default:
				break;
		}
		this.setState({
			globalData: data,
			closeDisabled
		});
	};

	handleAdd = () => {
		this.state.globalData.push({
			name: `Name${uniqueId + 1}`,
			value: '',
			expression: '',
			errorName: '',
			errorExpression: '',
			id: uniqueId,
			added: true
		});
		uniqueId += 1;
		this.setState({ globalData: this.state.globalData });
	};

	handleCancel() {
		this.props.stateHandler({ showEditNamesDialog: false });
		this.setState({ globalData: undefined });
	}

	handleClose = () => {
		const graph = graphManager.getGraph();
		const cmd = new JSG.UpdateSheetNamesCommand();

		this.state.globalData.forEach((name) => {
			const updateCmd = createNameUpdateCommand(name, graph);
			if (updateCmd) cmd.add(updateCmd);
		});

		graphManager.synchronizedExecute(cmd);

		this.props.stateHandler({ showEditNamesDialog: false });
		this.setState({ globalData: undefined });
	}

	render() {
		return (
			<Dialog open={this.state.open} onClose={() => this.handleCancel()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="DialogNames.title" defaultMessage="Edit Names" />
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						width: '815px'
					}}
				>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px'
									}}
								>
									<FormattedMessage id="DialogNames.name" defaultMessage="Name" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px'
									}}
								>
									<FormattedMessage id="DialogNames.reference" defaultMessage="Reference" />
								</TableCell>
								<TableCell
									style={{
										width: '30px'
									}}
								/>
							</TableRow>
						</TableHead>
						<TableBody>
							{this.state.globalData.map((row) =>
								row.deleted ? null : (
									<TableRow key={row.id}>
										<TableCell
											key={1}
											style={{
												padding: '4px 10px 4px 10px'
											}}
										>
											<TextField
												fullWidth
												margin="dense"
												id={`${row.id}&name`}
												label={row.errorName}
												defaultValue={row.name}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'name')}
												error={row.errorName !== '' || !Reference.isValidIdentifier(row.name)}
												helperText={
													!Reference.isValidIdentifier(row.name) ? (
														<FormattedMessage
															id="Reference.InvalidName"
															defaultMessage="Invalid name!"
														/>
													) : (
														''
													)
												}
											/>
										</TableCell>
										<TableCell
											key={3}
											style={{
												padding: '4px 10px 4px 10px'
											}}
										>
											<TextField
												fullWidth
												margin="dense"
												id={`${row.id}&expression`}
												error={row.errorExpression !== ''}
												label={row.errorExpression}
												defaultValue={row.expression}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'expression')}
												onKeyPress={(ev) => {
													if (ev.key === 'Enter') {
														this.handleBlur(ev, row, 'expression');
													}
												}}
											/>
										</TableCell>
										<TableCell
											key={4}
											style={{
												width: '30px'
											}}
										>
											<IconButton id={row.id} onClick={this.handleDelete(row)}>
												<DeleteIcon
													style={{
														width: '20px',
														height: '20px'
													}}
												/>
											</IconButton>
										</TableCell>
									</TableRow>
								)
							)}
						</TableBody>
					</Table>
				</DialogContent>
				<Divider />
				<DialogActions
					style={{
						justifyContent: 'space-between',
						margin: '10px 30px'
					}}
				>
					<Button color="primary" onClick={this.handleAdd}>
						<FormattedMessage id="DialogNames.add" defaultMessage="Add" />
					</Button>
					<div>
						<Button color="primary" onClick={() => this.handleCancel()}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							color="primary"
							disabled={this.state.closeDisabled || !this.state.globalData.reduce(verifyNames, true)}
							onClick={this.handleClose}
							autoFocus
						>
							<FormattedMessage id="DialogNames.save" defaultMessage="Save" />
						</Button>
					</div>
				</DialogActions>
			</Dialog>
		);
	}
}
