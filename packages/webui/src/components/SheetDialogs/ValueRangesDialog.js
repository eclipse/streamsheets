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
import JSG from '@cedalo/jsg-ui';

// import { graphManager } from '../../GraphManager';
import ColorComponent from './ColorComponent';
import {Typography} from "@material-ui/core/es";
// import { intl } from '../../helper/IntlGlobalProvider';

let uniqueId = 0;


/**
 * A modal dialog can only be close d by selecting one of the actis.
 */
export default class ValueRangesDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
		ranges: PropTypes.array.isRequired,
		sheetView: PropTypes.object.isRequired
	};

	constructor(props) {
		super(props);

		this.state = {
			open: props.open,
			ranges: this.copyRanges(props.ranges),
			showColor: false,
			anchorEl: undefined,
		};

		this.handleClose = this.handleClose.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		if (nextProps.open === true && this.props.open === false) {
			this.setState({ ranges: this.copyRanges(nextProps.ranges) });
		}

		this.setState({ open: nextProps.open });
	}

	copyRanges(ranges) {
		const copyRanges = [];
		uniqueId = 0;
		ranges.forEach((range) => {
			const copyRange = {};
			copyRange.id = uniqueId;
			copyRange.formula = range.formula.copy();
			copyRange.formula.evaluate(this.props.sheetView.getItem());
			copyRange.format = range.format.copy();
			copyRanges.push(copyRange);
			uniqueId += 1;
		});

		return copyRanges;
	}

	handleDelete = (row) => () => {
		JSG.Arrays.remove(this.state.ranges, row);
		this.setState({ranges: this.state.ranges});
	};

	handleChange = (event, text) => {
		this.setState({
			value: text,
		});
	};

	handleBlur = (event, row, name) => {
		let formula;
		let label = this.getParamText(row.formula.getTerm(), 0);
		let from = this.getParamText(row.formula.getTerm(), 1);
		let to = this.getParamText(row.formula.getTerm(), 2);
		let width = this.getParamText(row.formula.getTerm(), 3);

		if (label === undefined) {
			label = '';
		}
		if (from === undefined) {
			from = 0;
		}
		if (to === undefined) {
			to = 0;
		}
		if (width === undefined) {
			width = 0;
		}

		switch (name) {
		case 'label':
			formula = new JSG.Expression(0, `VALUERANGE(${event.target.value},${from},${to},${width})`);
			break;
		case 'from':
			formula = new JSG.Expression(0, `VALUERANGE(${label},${event.target.value},${to},${width})`);
			break;
		case 'to':
			formula = new JSG.Expression(0, `VALUERANGE(${label},${from},${event.target.value},${width})`);
			break;
		case 'width':
			formula = new JSG.Expression(0, `VALUERANGE(${label},${from},${to},${event.target.value})`);
			break;
		default:
			break;
		}

		const item = this.props.sheetView.getItem();
		const graph = item.getGraph();

		try {
			JSG.FormulaParser.parse(formula, graph, item)
			formula.evaluate();
			row.formula = formula;
			// eslint-disable-next-line no-empty
		} catch (e) {

		}
	};

	getParamText(term, index) {
		if (term && term.params && term.params.length > index) {
			return term.params[index].toString({ item: this.props.sheetView.getItem(), useName: true });
		}

		return undefined;
	}

	handleAdd = () => {
		const formula = new JSG.Expression(0, `VALUERANGE("Label",A1,0,0)`);
		formula.evaluate(this.props.sheetView.getItem());

		this.state.ranges.push({
			formula,
			format: new JSG.ChartFormat(undefined, undefined, undefined, undefined, '#FF0000'),
			id: uniqueId,
		});

		uniqueId += 1;
		this.setState({ranges: this.state.ranges});
	};

	onColor = (color, row) => {
		// } else if (color.hex.toUpperCase() === '#FFFFFE') {

		row.format.fillColor = JSG.GraphUtils.colorFromRGB(color.r, color.g, color.b);
		row.format.transparency = color.a * 100;

		this.setState({
			showColor: false
		});
	};

	handleCancel() {
		this.props.stateHandler(false);
	}

	handleClose() {
		this.props.stateHandler(false, this.state.ranges);
	}

	render() {
		return (
			<Dialog open={this.state.open} onClose={() => this.handleCancel()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="DialogValueRanges.title" defaultMessage="Edit Value Ranges" />
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						width: '815px',
					}}
				>
					<div
						style={{
							overflowY: 'auto',
							border: '1px solid lightgrey',
							height: '400px',
							marginTop: '23px',
						}}
					>
					<Table>
						<TableHead>
							<TableRow
								style={{
									height: '35px',
								}}
							>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogValueRanges.label" defaultMessage="Label" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogValueRanges.from" defaultMessage="From" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogValueRanges.to" defaultMessage="To" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogValueRanges.width" defaultMessage="Width" />
								</TableCell>
								<TableCell
									style={{
										padding: '4px 10px 4px 10px',
									}}
								>
									<FormattedMessage id="DialogValueRanges.color" defaultMessage="Color" />
								</TableCell>
								<TableCell
									style={{
										width: '30px',
									}}
								/>
							</TableRow>
						</TableHead>
						<TableBody>
							{this.state.ranges && this.state.ranges.map((range) =>
								(
									<TableRow key={range.id}>
										<TableCell
											key={1}
											style={{
												padding: '4px 10px 4px 10px',
											}}
										>
											<TextField
												fullWidth
												margin="dense"
												defaultValue={this.getParamText(range.formula.getTerm(), 0)}
												id={`${range.id}&label`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, range, 'label')}

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
												defaultValue={this.getParamText(range.formula.getTerm(), 1)}
												id={`${range.id}&from`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, range, 'from')}

											/>
										</TableCell>
										<TableCell
											key={5}
											style={{
												padding: '4px 10px 4px 10px',
											}}
										>
											<TextField
												fullWidth
												margin="dense"
												id={`${range.id}&to`}
												defaultValue={this.getParamText(range.formula.getTerm(), 2)}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, range, 'to')}
												onKeyPress={(ev) => {
													if (ev.key === 'Enter') {
														this.handleBlur(ev, range, 'to');
													}
												}}
											/>
										</TableCell>
										<TableCell
											key={4}
											style={{
												padding: '4px 10px 4px 10px',
											}}
										>
											<TextField
												fullWidth
												margin="dense"
												defaultValue={this.getParamText(range.formula.getTerm(), 3)}
												id={`${range.id}&width`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, range, 'width')}

											/>
										</TableCell>
										<TableCell
											key={2}
											style={{
												padding: '4px 10px 4px 10px',
											}}
										>
											<ColorComponent
												disableAlpha={false}
												color={range.format.fillColorRGBA}
												onChange={(color) => this.onColor(color, range)}
											/>
										</TableCell>
										<TableCell
											key={6}
											style={{
												width: '30px',
											}}
										>
											<IconButton id={range.id} onClick={this.handleDelete(range)}>
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
					</div>
					<Typography style={{marginTop: '22px'}}>
						<FormattedMessage id="DialogValueRanges.hint" defaultMessage="Formula" />
					</Typography>
				</DialogContent>
				<Divider />
				<DialogActions
					style={{
						justifyContent: 'space-between',
						margin: '10px 30px',
					}}
				>
					<Button color="primary" onClick={this.handleAdd}>
						<FormattedMessage id="DialogValueRanges.add" defaultMessage="Add" />
					</Button>
					<div>
						<Button color="primary" onClick={() => this.handleCancel()}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							color="primary"
							// disabled={this.state.closeDisabled || !globalTableData.reduce(verifyNames, true)}
							onClick={this.handleClose}
							autoFocus
						>
							<FormattedMessage id="DialogValueRanges.save" defaultMessage="Save" />
						</Button>
					</div>
				</DialogActions>
			</Dialog>
		);
	}
}
