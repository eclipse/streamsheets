import React from 'react';
import PropTypes from 'prop-types';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import { injectIntl } from 'react-intl';
import Popover from '@material-ui/core/Popover';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';

class TableSortHeader extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null
		};
	}

	createSortHandler = (property) => (event) => {
		this.props.onRequestSort(event, property);
	};

	handleClick = (event) => {
		this.setState({
			anchorEl: event.currentTarget
		});
	};

	handleToggle = (field, checked) => {
		this.props.onFieldToggle(field, checked);
	};

	handleClose = () => {
		// this.props.onUpdateSelected(this.state.selectedOptions, this.state.dirty);
		// isSet = true;
		this.setState({
			anchorEl: null,
		});
	};


	render() {
		const { order, orderBy } = this.props;

		return (
			<TableHead>
				<TableRow
					style={{
						height: `${this.props.height}px`
					}}
				>
					{this.props.cells.map(
						(row) => (
							<TableCell
								style={{
									width: row.width,
									minWidth: row.minWidth,
								}}
								key={row.id}
								align={row.numeric ? 'right' : 'left'}
								padding={row.disablePadding ? 'none' : 'default'}
								sortDirection={orderBy === row.id ? order : false}
							>
								{/* eslint-disable-next-line no-nested-ternary */}
								{row.sort !== false ? (
									<TableSortLabel
										active={orderBy === row.id}
										direction={order}
										onClick={this.createSortHandler(row.id)}
									>
										{this.props.intl.formatMessage({
													id: row.label,
													defaultMessage: 'title'
											  })}
									</TableSortLabel>
								) : row.label ? (
									this.props.intl.formatMessage({
										id: row.label,
										defaultMessage: 'title'
									})
								) : (
									''
								)}
								{row.fields ? (
									<IconButton style={{padding: '0px'}} size="small" onClick={this.handleClick}>
										<ArrowDropDown />
									</IconButton>
								) : null}
								{row.fields ? (
									<Popover
										open={Boolean(this.state.anchorEl)}
										anchorEl={this.state.anchorEl}
										onClose={this.handleClose}
										anchorOrigin={{
											vertical: 'bottom',
											horizontal: 'left'
										}}
										transformOrigin={{
											vertical: 'top',
											horizontal: 'left'
										}}
									>
										<List dense>
											<div style={{ maxHeight: '250px', overflowY: 'scroll' }}>
												{row.fields.map((field) => (
													<ListItem
														key={field.name}
														style={{padding: '0px'}}
														dense
														button
														onClick={(event) => this.handleToggle(field, event.target.checked)}
													>
														<Checkbox
															checked={field.selected}
															tabIndex={-1}
															disableRipple
														/>
														<ListItemText
															primary={field.name === 'Admin.#all_provs' ? this.props.intl.formatMessage({
															id: field.name,
															defaultMessage: field.name}) : field.name}
														/>
													</ListItem>
												))}
											</div>
										</List>
									</Popover>
								) : null}
							</TableCell>
						),
						this
					)}
				</TableRow>
			</TableHead>
		);
	}
}

TableSortHeader.propTypes = {
	onRequestSort: PropTypes.func.isRequired,
	order: PropTypes.string.isRequired,
	cells: PropTypes.array.isRequired,
	orderBy: PropTypes.string.isRequired,
	height: PropTypes.number
};

TableSortHeader.defaultProps = {
	height: 25
};

export default injectIntl(TableSortHeader);
