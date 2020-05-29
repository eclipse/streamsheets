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
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const createMachineStatusFilter = (statusToFilter) => (resources) => {
	if (statusToFilter && statusToFilter.length > 0) {
		return resources.filter(
			(resource) => resource.state.indexOf(statusToFilter) >= 0,
		);
	}
	return resources;
};

class FilterMachineStatus extends React.Component {
	static propTypes = {
		onUpdateFilter: PropTypes.func.isRequired,
	};

	state = {
		selectedStatus: '',
	};

	onSelectionChange = (selectedStatus) => {
		this.setState({ selectedStatus });
		this.props.onUpdateFilter(createMachineStatusFilter(selectedStatus));
	};

	render() {
		return (
			<FormControl fullWidth>
				<InputLabel htmlFor="machine-status">
					<FormattedMessage
						id="Dashboard.state"
						defaultMessage="State"
					/>
				</InputLabel>
				<Select
					value={this.state.selectedStatus}
					onChange={(event) =>
						this.onSelectionChange(event.target.value)
					}
					inputProps={{
						name: 'machine-status',
						id: 'machine-status',
					}}
					style={{ width: '200px' }}
				>
					<MenuItem value="">
						<em>
							<FormattedMessage
								id="Dashboard.any"
								defaultMessage="Any"
							/>
						</em>
					</MenuItem>
					<MenuItem value="running">
						<FormattedMessage
							id="Dashboard.running"
							defaultMessage="Running"
						/>
					</MenuItem>
					<MenuItem value="paused">
						<FormattedMessage
							id="Dashboard.paused"
							defaultMessage="Paused"
						/>
					</MenuItem>
					<MenuItem value="stopped">
						<FormattedMessage
							id="Dashboard.stopped"
							defaultMessage="Stopped"
						/>
					</MenuItem>
				</Select>
			</FormControl>
		);
	}
}

export default FilterMachineStatus;
