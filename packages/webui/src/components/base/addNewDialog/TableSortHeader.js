import React from 'react';
import PropTypes from 'prop-types';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import { injectIntl } from 'react-intl';

class TableSortHeader extends React.Component {
	createSortHandler = (property) => (event) => {
		this.props.onRequestSort(event, property);
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
									width: row.width
								}}
								key={row.id}
								align={row.numeric ? 'right' : 'left'}
								padding={row.disablePadding ? 'none' : 'default'}
								sortDirection={orderBy === row.id ? order : false}
							>
								{/* eslint-disable-next-line no-nested-ternary */}
								{row.sort ? (
									<TableSortLabel
										active={orderBy === row.id}
										direction={order}
										onClick={this.createSortHandler(row.id)}
									>
										{row.label
											? this.props.intl.formatMessage({
													id: row.label,
													defaultMessage: 'title'
											  })
											: ''}
									</TableSortLabel>
								) : (
										row.label ? this.props.intl.formatMessage({
											id: row.label,
											defaultMessage: 'title'
										})	: ''
								)}
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
