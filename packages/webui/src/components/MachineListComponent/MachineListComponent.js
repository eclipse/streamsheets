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
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
// import PlayIcon from '@material-ui/icons/PlayArrow';
// import StopIcon from '@material-ui/icons/Stop';
// import PauseIcon from '@material-ui/icons/Pause';
// import CircleIcon from '@material-ui/icons/Brightness1';
import SortSelector from '../base/sortSelector/SortSelector';
import { useGraphQL } from '../../helper/Hooks';
import FormLabel from '@material-ui/core/FormLabel';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconSearch from '@material-ui/icons/Search';
import Table from '@material-ui/core/Table';
import TableSortHeader from '../base/addNewDialog/TableSortHeader';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

// const getColorForMachineState = (state) => {
// 	switch (state) {
// 		case 'running':
// 			return <PlayIcon aria-label="running" />;
// 		case 'stopped':
// 			return <StopIcon aria-label="stopped" />;
// 		case 'paused':
// 			return <PauseIcon aria-label="paused" />;
// 		default:
// 			return <CircleIcon aria-label="unknown" />;
// 	}
// };

const getPlaceholder = () => (
	<TableRow
		style={ {
			height: '35px'
		}}
		hover
		tabIndex={-1}
		key='placeholder'
	>
		<TableCell component="th" scope="row" padding="none">
			<FormattedMessage id="Placeholder.noMachinesAvailable" defaultMessage="No Machines Available" />
		</TableCell>
	</TableRow>
);

const getFormattedDateString = (date) => {
	const d = new Date(date);
	return `${d.toLocaleDateString(undefined, {year: '2-digit', month: '2-digit', day: '2-digit'})} ${d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}`;
};

const buildList = (machines, sortField, sortDir, filter, onItemClick) => {
	const items = SortSelector.sort(machines, `${sortField}_${sortDir}`, filter);

	return items.map((machine) => (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
			<TableRow
				style={ {
					height: '35px',
					cursor: 'pointer'
				}}
				hover
				onClick={() => onItemClick(machine)}
				// selected={machine.id === selected.id}
				tabIndex={-1}
				key={`${machine.className}-${machine.id}`}
			>
				<TableCell component="th" scope="row" padding="none">
					{machine.name}
				</TableCell>
				<TableCell>{machine.state}</TableCell>
				<TableCell>{getFormattedDateString(machine.metadata.lastModified)}</TableCell>
			</TableRow>
	));
}

const QUERY = `query Machines($scope: ScopeInput!) {
	scoped(scope: $scope) {
		machines {
			name
			id
			state
			metadata {
				lastModified
			}
		}
	}
}`;


function MachineList(props) {
	// const { onItemClick } = props;
	const { data, loading } = useGraphQL(QUERY, { scope: { id: props.scopeId } }, [props.scopeId]);
	const { onItemClick } = props;
	const [sortField, setSortField] = useState('lastModified');
	const [sortDir, setSortDir] = useState('desc');
	const [filter, setFilter] = useState('');
	const handleTableSort = (event, property) => {
		setSortField(property);
		let order = 'desc';

		if (sortField === property && sortDir === 'desc') {
			order = 'asc';
		}
		setSortDir(order);
	};
	const handleFilter = (event) => {
		setFilter(event.target.value);
	};

	const machines = data ? data.scoped.machines : [];
	return (
		<div>
			<div
				style={{
					margin: '20px 0px 0px 0px',
					textAlign: 'right'
				}}
			>
				<div
					style={{
						width: '100%',
						display: 'flex',
						justifyContent: 'space-between',
						verticalAlign: 'middle',
					}}
				>
					<FormLabel
						style={{
							marginTop: '10px',
							fontSize: '13px',
							display: 'inline-block'
						}}
					>
						<FormattedMessage id="DialogOpen.open" defaultMessage="Select Machine:" />
					</FormLabel>
					<Input
						onChange={handleFilter}
						style={{ marginBottom: '8px', width: '250px' }}
						startAdornment={
							<InputAdornment position="start">
								<IconSearch />
							</InputAdornment>
						}
						defaultValue={filter}
						value={filter}
						type="search"
					/>
				</div>

				<div
					style={{
						border: '1px solid grey',
						height: '410px',
						overflow: 'auto',
						padding: '5px'
					}}
				>
					<Table stickyHeader>
						<TableSortHeader
							cells={[
								{ id: 'name', numeric: false, disablePadding: true, label: 'Name', width: '58%' },
								{ id: 'state', numeric: false, disablePadding: false, label: 'State', width: '14%' },
								{ id: 'lastModified', numeric: false, disablePadding: false, label: 'LastModified', width: '28%' },
							]}
							orderBy={sortField}
							order={sortDir}
							onRequestSort={handleTableSort}
						/>
						<TableBody>
							{
								loading ? getPlaceholder() : buildList(machines, sortField, sortDir, filter, onItemClick)
							}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
MachineList.propTypes = {
	onItemClick: PropTypes.func
};

MachineList.defaultProps = {
	onItemClick: () => {}
};
function mapStateToProps(state) {
	return { scopeId: state.user.user.scope ? state.user.user.scope.id : null };
}
export default connect(mapStateToProps)(MachineList);
