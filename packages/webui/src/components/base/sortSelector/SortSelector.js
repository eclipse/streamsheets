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
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconAsc from '@material-ui/icons/ArrowDropDown';
import IconDesc from '@material-ui/icons/ArrowDropUp';
import IconSearch from '@material-ui/icons/Search';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { sortResources } from './Utils';

const messages = new Map();
messages.set('name', <FormattedMessage id="SortBy.name" defaultMessage="Name" />);
messages.set('state', <FormattedMessage id="SortBy.state" defaultMessage="State" />);
messages.set('lastModified', <FormattedMessage id="SortBy.lastModified" defaultMessage="LastModified" />);
// eslint-disable-next-line react/prop-types
const DirectionIcon = ({ name, direction, sortBy }) => {
	if (name === sortBy) {
		if (direction === 'desc') {
			return <IconAsc />;
		}
		return <IconDesc />;
	}
	return <span style={{ width: '4px' }}>&nbsp;</span>;
};
// eslint-disable-next-line react/prop-types
const SortElement = ({ id, direction, sortBy, onClick, style }) => (
	<Button onClick={onClick} style={style}>
		{messages.get(id)}
		<DirectionIcon name={id} direction={direction} sortBy={sortBy} />
	</Button>
);
const toogleDirection = (dir) => (dir === 'asc' ? 'desc' : 'asc');

class SortSelector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: props.defaultSortBy,
			direction: props.defaultSortDir,
			filter: props.defaultFilter
		};
		const { sortBy, direction, filter } = this.state;
		const { onSort, getResources } = this.props;
		const resources = getResources();
		const sortQuery = `${sortBy}_${direction}`;
		onSort({ target: {} }, SortSelector.sort(resources, sortQuery, filter), sortQuery, filter);
	}

	handleClick = (id) => (event) => {
		const { onSort, getResources } = this.props;
		const { sortBy, direction, filter } = this.state;
		const resources = getResources();
		const dir = sortBy === id ? toogleDirection(direction) : direction;
		const sortQuery = `${id}_${dir}`;
		onSort(event, SortSelector.sort(resources, sortQuery, filter), sortQuery, filter);
		this.setState({ direction: dir, sortBy: id });
	};

	handleFilter = (event) => {
		const filter = event.target.value;
		this.doFilter(filter, event);
	};

	doFilter = (filter, event) => {
		const { sortBy, direction } = this.state;
		const { onSort, getResources } = this.props;
		const resources = getResources();
		const sortQuery = `${sortBy}_${direction}`;
		onSort(event, SortSelector.sort(resources, sortQuery, filter), sortQuery, filter);
		this.setState({ filter });
	};

	render() {
		const { sortFields, style, withFilter } = this.props;
		const { sortBy, direction, filter } = this.state;
		return (
			<div style={style.wrapper}>
				{sortFields.map((field) => (
					<SortElement
						key={field}
						id={field}
						direction={direction}
						sortBy={sortBy}
						onClick={this.handleClick(field)}
						style={style.button}
					/>
				))}
				{withFilter === false ? null : (
					<Input
						onChange={this.handleFilter}
						style={{ flexGrow: 1 }}
						startAdornment={
							<InputAdornment position="start">
								<IconSearch />
							</InputAdornment>
						}
						defaultValue={filter}
						type="search"
					/>
				)}
			</div>
		);
	}
}

SortSelector.sort = (resources, sortQuery, filter = '') => {
	const filteredResources =
		filter.length > 0
			? resources.filter((resource) => resource.name.toLowerCase().includes(filter.toLowerCase()))
			: resources;
	return sortResources(filteredResources, sortQuery);
};

SortSelector.parseSortQuery = (q) => {
	const parts = q.split('_');
	return {
		sortBy: parts[0],
		sortDir: parts[1]
	};
};

SortSelector.DEFAULT_STYLE = {
	wrapper: { display: 'flex', alignItems: 'center' },
	label: { marginRight: '4px', fontWeight: '120%', fontSize: '10pt' },
	button: {
		fontSize: '8pt',
		minWidth: '2px',
		minHeight: '5px',
		padding: '1px 3px'
	}
};
SortSelector.propTypes = {
	getResources: PropTypes.func,
	onSort: PropTypes.func,
	sortFields: PropTypes.arrayOf(PropTypes.string),
	style: PropTypes.shape({
		wrapper: PropTypes.object,
		label: PropTypes.object,
		button: PropTypes.object
	}),
	defaultSortBy: PropTypes.string,
	defaultSortDir: PropTypes.string,
	withFilter: PropTypes.bool,
	defaultFilter: PropTypes.string
};

SortSelector.defaultProps = {
	onSort: () => {},
	getResources: () => [],
	sortFields: ['name', 'state', 'lastModified'],
	style: SortSelector.DEFAULT_STYLE,
	defaultSortBy: 'name',
	defaultSortDir: 'asc',
	withFilter: true,
	defaultFilter: ''
};

export default SortSelector;
