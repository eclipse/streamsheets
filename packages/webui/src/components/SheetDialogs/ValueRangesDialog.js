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
// import { intl } from '../../helper/IntlGlobalProvider';

let uniqueId = 0;


/**
 * A modal dialog can only be close d by selecting one of the actis.
 */
export default class ValueRangesDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
		ranges: PropTypes.array.isRequired
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
			copyRange.from = range.from;
			copyRange.width = range.width;
			copyRange.to = range.to;
			copyRange.label = range.label;
			copyRange.format = range.format.copy();
			copyRanges.push(copyRange);
			uniqueId += 1;
		})

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
		switch (name) {
		case 'label':
			row.label = event.target.value;
			break;
		case 'from':
			row.from = event.target.value;
			break;
		case 'to':
			row.to = event.target.value;
			break;
		case 'width':
			row.width = event.target.value;
			break;
		default:
			break;
		}
	};

	handleAdd = () => {
		this.state.ranges.push({
			label: 'Label',
			from: 0,
			to: 0,
			width: 0,
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
					<Table>
						<TableHead>
							<TableRow>
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
							{this.state.ranges && this.state.ranges.map((row) =>
								(
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
												defaultValue={row.label}
												id={`${row.id}&label`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'label')}

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
												type="number"
												defaultValue={row.from}
												id={`${row.id}&from`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'from')}

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
												id={`${row.id}&to`}
												type="number"
												defaultValue={row.to}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'to')}
												onKeyPress={(ev) => {
													if (ev.key === 'Enter') {
														this.handleBlur(ev, row, 'to');
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
												type="number"
												defaultValue={row.width}
												id={`${row.id}&width`}
												onChange={this.handleChange}
												onBlur={(ev) => this.handleBlur(ev, row, 'width')}

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
												color={row.format.fillColorRGBA}
												onChange={(color) => this.onColor(color, row)}
											/>
										</TableCell>
										<TableCell
											key={6}
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
