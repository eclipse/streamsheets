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
import Typography from '@material-ui/core/Typography';
import { Reference } from '@cedalo/parser';
import JSG from '@cedalo/jsg-ui';
import {
	Expression,
	DeleteSheetNameCommand,
	DeleteGraphCellCommand,
	AddSheetNameCommand,
	SetSheetNameCommand,
	SheetName,
	SheetReference,
} from '@cedalo/jsg-core';

import { graphManager } from '../../GraphManager';
import { intl } from '../../helper/IntlGlobalProvider';

function TabContainer(props) {
	return <Typography component="div">{props.children}</Typography>;
}

TabContainer.propTypes = {
	children: PropTypes.node.isRequired,
};

let globalTableData = [];
let uniqueId = 0;

const verifyNames = (valid, row) => {
	console.log(`${row.name} is valid: ${Reference.isValidIdentifier(row.name)}`);
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


/**
 * A modal dialog can only be close d by selecting one of the actis.
 */
export default class NamesDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);

		this.state = {
			open: props.open,
			closeDisabled: false,
			graphCells: false,
			globaldata: globalTableData,
		};

		this.handleClose = this.handleClose.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		if (nextProps.open === true && this.props.open === false) {
			const names = graphManager
				.getGraph()
				.getSheetNames()
				.filter((name) => !name.getName().startsWith('|'));
			globalTableData = [];
			uniqueId = 0;

			names.forEach((name) => {
				globalTableData.push({
					name: name.getName(),
					oldName: name.getName(),
					expression: name.getFormula(),
					errorName: '',
					errorExpression: '',
					id: uniqueId,
					data: name,
					deleted: false,
					changed: false,
					added: false,
				});
				uniqueId += 1;
			});
			this.setState({ graphCells: false });
		}

		this.setState({ open: nextProps.open });
	}

	// handleTabChange = (event, value) => {
	// 	this.setState({ tabSelected: value });
	// };
	//
	handleDelete = (row) => () => {
		row.deleted = true;
		this.setState({ globaldata: globalTableData });
	};

	handleChange = (event, text) => {
		this.setState({
			value: text,
		});
	};

	handleBlur = (event, row, name) => {
		const rowData = row;
		let closeDisabled = false;

		const data = globalTableData;

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
							graphManager.getGraph(),
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
			globaldata: globalTableData,
			closeDisabled,
		});
	};

	handleAdd = () => {
		globalTableData.push({
			name: `Name${uniqueId + 1}`,
			value: '',
			expression: '',
			errorName: '',
			errorExpression: '',
			id: uniqueId,
			added: true,
		});
		uniqueId += 1;
		this.setState({ globaldata: globalTableData });
	};

	handleCancel() {
		this.props.stateHandler({ showEditNamesDialog: false });
	}

	handleClick(event) {
		if (event.shiftKey) {
			const view = graphManager.getActiveSheetView();
			if (view === undefined) {
				return;
			}
			const names = view.getItem().getDataProvider().getGraphs();
			globalTableData = [];
			uniqueId = 30;
			this.setState({ globaldata: globalTableData });

			names.forEach((name) => {
				globalTableData.push({
					name: name.getName(),
					oldName: name.getName(),
					expression: name.getFormula(),
					errorName: '',
					errorExpression: '',
					id: uniqueId,
					data: name,
					deleted: false,
					changed: false,
					added: false,
				});
				uniqueId += 1;
			});
			this.setState({ graphCells: true });
			this.setState({ globaldata: globalTableData });
		}
	}

	handleClose() {
		const graph = graphManager.getGraph();
		let cmd;


		if (this.state.graphCells) {
			const view = graphManager.getActiveSheetView();
			if (view === undefined) {
				return;
			}
			cmd = new JSG.UpdateGraphCellsCommand(view.getItem());
			const data = view.getItem().getDataProvider();
			globalTableData.forEach((name) => {
				if (name.deleted) {
					const item = data.getGraph(name.name);
					if (item !== undefined) {
						cmd.add(new DeleteGraphCellCommand(view.getItem(), item));
					}
				}
			});
		} else {
			cmd = new JSG.UpdateSheetNamesCommand();
			globalTableData.forEach((name) => {
				const updateCmd = createNameUpdateCommand(name, graph);
				if (updateCmd) cmd.add(updateCmd);
			});
		}

		graphManager.synchronizedExecute(cmd);

		this.props.stateHandler({ showEditNamesDialog: false });
	}

	render() {
		return (
			<Dialog open={this.state.open} onClose={() => this.handleCancel()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="DialogNames.title" defaultMessage="Edit Names" />
				</DialogTitle>
				<DialogContent
					onClick={(event) => this.handleClick(event)}
					style={{
						height: '480px',
						width: '815px',
					}}
				>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogNames.name" defaultMessage="Name" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogNames.reference" defaultMessage="Reference" />
								</TableCell>
								<TableCell
									style={{
										width: '30px',
									}}
								/>
							</TableRow>
						</TableHead>
						<TableBody>
							{globalTableData.map((row) =>
								row.deleted ? null : (
									<TableRow key={row.id}>
										<TableCell
											key={1}
											style={{
												padding: '4px 10px 4px 10px',
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
													) : ('')
												}

											/>
										</TableCell>
										<TableCell
											key={3}
											style={{
												padding: '4px 10px 4px 10px',
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
												width: '30px',
											}}
										>
											<IconButton id={row.id} onClick={this.handleDelete(row)}>
												<DeleteIcon
													style={{
														width: '20px',
														height: '20px',
													}}
												/>
											</IconButton>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>
				</DialogContent>
				<Divider />
				<DialogActions
					style={{
						justifyContent: 'space-between',
						margin: '10px 30px',
					}}
				>
					<Button color="primary" onClick={this.handleAdd} disabled={this.state.graphCells}>
						<FormattedMessage id="DialogNames.add" defaultMessage="Add" />
					</Button>
					<div>
						<Button color="primary" onClick={() => this.handleCancel()}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							color="primary"
							disabled={this.state.closeDisabled || !globalTableData.reduce(verifyNames, true)}
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
