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
import Checkbox from '@material-ui/core/Checkbox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import PropTypes from 'prop-types';
import React from 'react';

const selectionArray = (selectionObject) =>
	Object.entries(selectionObject)
		.filter(([, v]) => v === true)
		.map(([k]) => k);

const selectionCount = (selectionObject) => selectionArray(selectionObject).length;

export default function ExportTable(props) {
	const numResources = props.resources.length;
	const numSelected = selectionCount(props.selected);
	return (
		<Table style={{ overflowY: 'auto' }}>
			<TableHead>
				<TableRow>
					<TableCell padding="checkbox">
						<Checkbox
							indeterminate={numSelected > 0 && numSelected < numResources}
							checked={numSelected > 0 && numSelected >= numResources}
							onChange={props.onSelectAll}
						/>
					</TableCell>
					<TableCell>Name</TableCell>
					{props.columns.map((column) => column.header)}
				</TableRow>
			</TableHead>
			<TableBody>
				{props.resources.map((resource) => {
					const isSelected = !!props.selected[resource.id];
					return (
						<TableRow
							onClick={() => props.onSelect(resource.id)}
							selected={isSelected}
							role="checkbox"
							aria-checked={isSelected}
							key={resource.id}
						>
							<TableCell padding="checkbox">
								<Checkbox checked={isSelected} />
							</TableCell>
							<TableCell>{resource.name}</TableCell>
							{props.columns.map((column) => column.cellCreator(resource))}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

ExportTable.propTypes = {
	onSelectAll: PropTypes.func.isRequired,
	// onSelect: PropTypes.func.isRequired,
	resources: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string,
			name: PropTypes.string,
		}),
	).isRequired,
	selected: PropTypes.objectOf(PropTypes.bool).isRequired,
	columns: PropTypes.arrayOf(
		PropTypes.shape({
			header: PropTypes.element,
			cellCreator: PropTypes.func,
		}),
	),
};

ExportTable.defaultProps = {
	columns: [],
};
