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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types,jsx-a11y/click-events-have-key-events,react/no-find-dom-node,max-len */
import Tooltip from '@material-ui/core/Tooltip';
import Add from '@material-ui/icons/Add';
import {Fab } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import ResourcesGrid from './ResourcesGrid';
import ResourcesList from './ResourcesList';
import SortSelector from '../sortSelector/SortSelector';
import Wall from '../../HelperComponent/Wall';
import {formatDateString} from "./Utils";

class CombinedResourceListing extends Component {
	static propTypes = {
		type: PropTypes.string,
		menuOptions: PropTypes.array,
		nameFilter: PropTypes.string,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		handleNew: PropTypes.func,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		layout: PropTypes.string,
		images: PropTypes.bool,
		handleReload: PropTypes.func,
		checked: PropTypes.arrayOf(PropTypes.string),
		disabled: PropTypes.bool,
		canEdit: PropTypes.bool,
		sortQuery: PropTypes.string
	};

	static defaultProps = {
		canEdit: true,
		type: 'dashboard',
		disabled: false,
		handleNew: undefined,
		layout: 'grid',
		images: false,
		handleResourceDetails: undefined,
		icon: undefined,
		handleReload: undefined,
		headerIcons: [],
		checked: [],
		nameFilter: undefined,
		menuOptions: [],
		sortQuery: 'name_asc',
		onMenuSelect: undefined
	};

	constructor() {
		super();
		this.state = {
			dummy: -1,
		}
	}

	componentDidMount() {
		window.addEventListener('resize', () => this.updateDimensions());
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateDimensions);
	}

	updateDimensions() {
		this.setState({
			dummy: Math.random(),
		});
	}

	filterMachines() {
		const machines = [];

		if (this.props.resources && this.props.resources.length) {
			this.props.resources.forEach((machine) => {
				if (machine.name.toLowerCase().includes(this.props.filter.toLowerCase())) {
					machine.lastModifiedFormatted = formatDateString(new Date(machine.lastModified).toISOString());
					machines.push(machine);
				} else {
					machine.streamsheets.forEach((sheet) => {
						if (sheet.inbox.stream && sheet.inbox.stream.name && sheet.inbox.stream.name.toLowerCase().includes(this.props.filter.toLowerCase())) {
							machine.lastModifiedFormatted = formatDateString(new Date(machine.lastModified).toISOString());
							machines.push(machine);
						}
					});
				}
			});
		}

		return machines;
	}


	render() {
		const { handleNew, resources } = this.props;
		const filteredMachines = this.filterMachines(resources);
		const recentResources = SortSelector.sort(filteredMachines, 'lastModified_desc', '');
		return (
			<Wall
				id="combinedResourceList"
			>
				<div
					style={{
						height: '100%'
					}}
				>
					{this.props.layout === 'grid' ? (
						<ResourcesGrid {...this.props} recent={recentResources} resources={filteredMachines} dummy={this.state.dummy}/>
					) : null}
					{this.props.layout === 'list' ? (
						<ResourcesList {...this.props} resources={filteredMachines} />
					) : null}
					{handleNew === undefined ? null : (
						<Tooltip
							enterDelay={300}
							title={<FormattedMessage id="Tooltip.Add" defaultMessage="Add" />}
						>
							<Fab
								id="add"
								aria-label="add"
								size="medium"
								color="primary"
								style={{
									position: 'absolute',
									zIndex: 1200,
									right: '30px',
									bottom: '26px',
								}}
								onClick={handleNew}
							>
								<Add/>
							</Fab>
						</Tooltip>
					)}
				</div>
			</Wall>
		);
	}
}

export default CombinedResourceListing;
