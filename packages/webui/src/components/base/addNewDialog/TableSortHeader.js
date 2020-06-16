
import React from 'react';
import PropTypes from 'prop-types';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { injectIntl } from 'react-intl';

class TableSortHeader extends React.Component {
	createSortHandler = property => event => {
		this.props.onRequestSort(event, property);
	};

	render() {
		const { order, orderBy } = this.props;
		const rows = this.props.showState ? [
			{ id: 'name', numeric: false, disablePadding: true, label: 'Name' },
			{ id: 'state', numeric: false, disablePadding: false, label: 'State' },
			{ id: 'lastModified', numeric: false, disablePadding: false, label: 'LastModified' },
		] : [
			{ id: 'name', numeric: false, disablePadding: true, label: 'Name' },
			{ id: 'lastModified', numeric: false, disablePadding: false, label: 'LastModified' },
		];

		return (
			<TableHead>
				<TableRow
					style={ {
						height: '25px'
					}}
				>
					{rows.map(
						row => (
							<TableCell
								style={{
									width: row.id === 'name' ? '280px' : '110px'
								}}
								key={row.id}
								align={row.numeric ? 'right' : 'left'}
								padding={row.disablePadding ? 'none' : 'default'}
								sortDirection={orderBy === row.id ? order : false}
							>
								<Tooltip
									title="Sort"
									placement={row.numeric ? 'bottom-end' : 'bottom-start'}
									enterDelay={300}
								>
									<TableSortLabel
										active={orderBy === row.id}
										direction={order}
										onClick={this.createSortHandler(row.id)}
									>
										{
											this.props.intl.formatMessage({
												id: row.label,
												defaultMessage: 'title'
											})
										}
									</TableSortLabel>
								</Tooltip>
							</TableCell>
						),
						this,
					)}
				</TableRow>
			</TableHead>
		);
	}
}

TableSortHeader.propTypes = {
	onRequestSort: PropTypes.func.isRequired,
	order: PropTypes.string.isRequired,
	showState: PropTypes.bool.isRequired,
	orderBy: PropTypes.string.isRequired,
};

export default injectIntl(TableSortHeader);
