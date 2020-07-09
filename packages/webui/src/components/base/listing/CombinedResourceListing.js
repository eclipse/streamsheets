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
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Add from '@material-ui/icons/Add';
import Autorenew from '@material-ui/icons/Autorenew';
import {Fab } from '@material-ui/core';
// import * as Colors from '@material-ui/core/colors';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import ResourcesGrid from './ResourcesGrid';
import ResourcesList from './ResourcesList';
import SortSelector from '../sortSelector/SortSelector';
import Wall from '../../HelperComponent/Wall';

const styles = (theme) => ({
	extendedIcon: {
		marginRight: theme.spacing.unit,
	},
});



const PREF_KEY_SORTQUERY = 'streamsheets-prefs-listing-sortby';

// let filterFunction;

class CombinedResourceListing extends Component {
	static propTypes = {
		type: PropTypes.string,
		label: PropTypes.object.isRequired,
		fields: PropTypes.array.isRequired,
		menuOptions: PropTypes.array,
		nameFilter: PropTypes.string,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		handleNew: PropTypes.func,
		classes: PropTypes.object.isRequired,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		layout: PropTypes.string,
		images: PropTypes.bool,
		handleReload: PropTypes.func,
		onChecked: PropTypes.func,
		enrichResources: PropTypes.func,
		checked: PropTypes.arrayOf(PropTypes.string),
		disabled: PropTypes.bool,
		sortQuery: PropTypes.string
	};

	static defaultProps = {
		type: 'dashboard',
		disabled: false,
		handleNew: null,
		layout: 'grid',
		images: false,
		handleResourceDetails: undefined,
		icon: undefined,
		handleReload: undefined,
		headerIcons: [],
		enrichResources: (resources) => resources,
		onChecked: undefined,
		checked: [],
		nameFilter: undefined,
		menuOptions: [],
		sortQuery: 'name_asc',
		onMenuSelect: undefined
	};

	constructor(props) {
		super(props);
		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || props.sortQuery;
		this.state = {
			gridWidth: 0,
			sortQuery
		};
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
		// filterFunction = (r) => r;
	}

	componentDidMount() {
		window.addEventListener('resize', () => this.updateDimensions());
		this.updateDimensions();
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateDimensions);
	}

	getDimensions() {
		let refGrid = document.getElementById('coreGrid');
		let offset = 0;
		if (!refGrid) {
			refGrid = document.getElementById('combinedResourceList');
			offset = 20;
		}
		if (refGrid) {
			const style = getComputedStyle(refGrid);
			const width = parseFloat(style.width) - offset;
			const left = parseFloat(style.marginLeft);
			const right = parseFloat(style.marginRight);
			return {
				width,
				left,
				right
			};
		}

		return undefined;
	}

	updateDimensions() {
		const dims = this.getDimensions();
		if (dims) {
			this.setState({
				gridWidth: dims.width + dims.left + dims.right
			});
		}
	}

	getFilteredResources = () => this.props.resources;

	handleSort = (event, sortedResources, sortQuery) => {
		this.setState({
			// filteredResources: sortedResources,
			sortQuery
		});
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
	};

	render() {
		let dims = this.state.gridWidth;
		dims = this.getDimensions();
		const { handleNew, handleReload, disabled, filter } = this.props;
		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || this.state.sortQuery;
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
		const resources = this.props.enrichResources(this.props.resources);
		const filteredResources = SortSelector.sort(resources, sortQuery, filter);
		const sortFields = ['name', 'lastModified'];
		if (filteredResources.length > 0) {
			if (filteredResources[0].state) {
				sortFields.push('state');
			}
		}
		const sortObj = SortSelector.parseSortQuery(sortQuery);
		const width = dims ? dims.width + dims.left + dims.right : 0;
		return (
			<Wall
				overflow
				id="combinedResourceList"
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						flexFlow: 'row',
						width: '100%'
					}}
				>
					<div
						style={{
							height: '40px',
							marginRight: `${Math.max(0, Math.floor((width - Math.floor(width / 330) * 330) / 2)) +
								23}px`
						}}
					>
						{filteredResources.length === 0 ? null : (
							<SortSelector
								onSort={this.handleSort}
								getResources={this.getFilteredResources}
								sortFields={sortFields}
								withFilter={false}
								defaultSortBy={sortObj.sortBy}
								defaultSortDir={sortObj.sortDir}
							/>
						)}
					</div>
				</div>
				<div
					style={{
						height: 'calc(100% - 40px)'
					}}
				>
					{this.props.layout === 'grid' ? (
						<ResourcesGrid {...this.props} gridWidth={width} resources={filteredResources} />
					) : null}
					{this.props.layout === 'list' ? (
						<ResourcesList {...this.props} resources={filteredResources} />
					) : null}
					{typeof handleReload === 'undefined' ? null : (
						<Tooltip
							enterDelay={300}
							title={
								<FormattedMessage
									id="Tooltip.ReloadStreams"
									defaultMessage="Reload and validate"
								/>
							}
						>
							<Fab
								id="reload"
								aria-label="reload"
								size="medium"
								disabled={disabled}
								color="primary"
								style={{
									position: 'absolute',
									zIndex: 1200,
									right: '30px',
									bottom: '85px',
								}}
								onClick={handleReload}
							>
								<Autorenew />
							</Fab>
						</Tooltip>
					)}
					{typeof handleNew === 'undefined' ? null : (
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

export default withStyles(styles)(CombinedResourceListing);
