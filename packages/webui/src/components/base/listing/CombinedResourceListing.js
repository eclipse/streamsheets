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
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Add from '@material-ui/icons/Add';
import Autorenew from '@material-ui/icons/Autorenew';
import IconViewList from '@material-ui/icons/ViewList';
import IconViewGrid from '@material-ui/icons/ViewModule';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import ResourceFilter from './ResourceFilter';
import ResourcesGrid from './ResourcesGrid';
import ResourcesList from './ResourcesList';
import SortSelector from '../sortSelector/SortSelector';
import styles from './styles';

const PREF_KEY_LAYOUT = 'streamsheets-prefs-listing-layout';
const PREF_KEY_SORTQUERY = 'streamsheets-prefs-listing-sortby';

let filterFunction;

class CombinedResourceListing extends Component {
	static propTypes = {
		type: PropTypes.string,
		label: PropTypes.object.isRequired,
		fields: PropTypes.array.isRequired,
		menuOptions: PropTypes.array,
		resources: PropTypes.array.isRequired,
		filters: PropTypes.array,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		handleNew: PropTypes.func,
		classes: PropTypes.object.isRequired,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		headerBackgroundColor: PropTypes.string,
		defaultLayout: PropTypes.string,
		images: PropTypes.bool,
		handleReload: PropTypes.func,
		onChecked: PropTypes.func,
		enrichResources: PropTypes.func,
		checked: PropTypes.arrayOf(PropTypes.string),
		filterName: PropTypes.bool,
		disabled: PropTypes.bool,
		sortQuery: PropTypes.string,
	};

	static defaultProps = {
		type: 'dashboard',
		disabled: false,
		headerBackgroundColor: '#8BC34A',
		defaultLayout: 'grid',
		handleNew: null,
		images: false,
		filters: [],
		handleResourceDetails: undefined,
		icon: undefined,
		handleReload: undefined,
		headerIcons: [],
		enrichResources: (resources) => resources,
		onChecked: undefined,
		checked: [],
		filterName: false,
		menuOptions: [],
		sortQuery: 'name_asc',
		onMenuSelect: undefined,
	};

	static getDerivedStateFromProps(nextProps, prevState) {
		const resources = Array.isArray(nextProps.resources) ? nextProps.resources : [];
		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || prevState.sortQuery;
		const filteredResources = SortSelector.sort(filterFunction(nextProps.enrichResources(resources)), sortQuery);
		return {
			...prevState,
			filteredResources,
		};
	}

	constructor(props) {
		super(props);
		const resources = Array.isArray(props.resources) ? props.resources : [];
		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || props.sortQuery;
		this.state = {
			filteredResources: SortSelector.sort(props.enrichResources(resources), props.sortQuery),
			layout: localStorage.getItem(PREF_KEY_LAYOUT) || props.defaultLayout,
			sortQuery,
		};
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
		filterFunction = (r) => r;
	}

	onFilter = (filterFunc) => {
		const { sortQuery } = this.state;
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
		filterFunction = filterFunc;
		const resources = this.props.enrichResources(this.props.resources);
		let filteredResources = filterFunction(resources);
		filteredResources = SortSelector.sort(resources, sortQuery);
		this.setState({
			filteredResources,
		});
	};

	getFilteredResources = () => this.props.resources;

	handleSort = (event, sortedResources, sortQuery) => {
		this.setState({
			filteredResources: sortedResources,
			sortQuery,
		});
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
	};

	handleLayoutChange = (layout) => {
		this.setState({ layout });
		localStorage.setItem(PREF_KEY_LAYOUT, layout);
	};



	render() {
		const { label, handleNew, handleReload, classes, disabled } = this.props;
		const { filteredResources } = this.state;
		const showFilter = this.props.filters.length > 0 || this.props.filterName;
		const sortFields = ['name', 'lastModified'];
		if(filteredResources.length>0) {
			if(filteredResources[0].state) {
				sortFields.push('state')
			}
		}
		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || this.state.sortQuery;
		const sortObj = SortSelector.parseSortQuery(sortQuery);
		return (
			<div
				style={{
					color: '#444444',
					padding: '0px',
					display: 'flex',
					height: '100%',
					flexDirection: 'column',
				}}
			>
				{showFilter ? (
					<ResourceFilter
						onUpdateFilter={this.onFilter}
						filters={this.props.filters}
						filterName={this.props.filterName}
					/>
				) : null}
				<div
					style={{
						background: '#EEEEEE',
						width: 'inherit',
						height: 'calc(100% - 64px)',
						padding: '0px 0px 0px 20px',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<div>
							<h2 style={{marginBottom: '3px'}}>{label}</h2>
							{ filteredResources.length === 0 ? null: <SortSelector
								onSort={this.handleSort}
								getResources={this.getFilteredResources}
								sortFields={sortFields}
								withFilter={false}
								defaultSortBy={sortObj.sortBy}
								defaultSortDir={sortObj.sortDir}
							/>
							}
						</div>
						<div
							style={{
								marginTop: '8px',
							}}
						>

							{typeof handleReload === 'undefined' ? null : (
								<Tooltip
									enterDelay={300}
									title={
										<FormattedMessage
											id="Tooltip.ReloadStreams"
											defaultMessage="Reload and validate Streams"
										/>
									}
								>
									<Button disabled={disabled} className={classes.toolIconDark} onClick={handleReload}>
										<Autorenew />
									</Button>
								</Tooltip>
							)}
							{!handleNew ? null : (
								<Tooltip
									enterDelay={300}
									title={<FormattedMessage id="Tooltip.Add" defaultMessage="Add" />}
								>
									<Button
										className={classes.toolIconDark}
										onClick={handleNew}
										disabled={disabled}
										style={{
											minWidth: '20px',
										}}
									>
										<Add />
									</Button>
								</Tooltip>
							)}
							{this.state.layout === 'list' ? (
								<Tooltip
									enterDelay={300}
									title={<FormattedMessage id="Tooltip.ViewGrid" defaultMessage="View Grid" />}
								>
									<Button
										className={classes.toolIconDark}
										disabled={disabled}
										onClick={() => this.handleLayoutChange( 'grid' )}
										style={{
											minWidth: '20px',
										}}
									>
										<IconViewGrid />
									</Button>
								</Tooltip>
							) : null}
							{this.state.layout === 'grid' ? (
								<Tooltip
									enterDelay={300}
									title={<FormattedMessage id="Tooltip.ViewList" defaultMessage="View List" />}
								>
									<Button
										className={classes.toolIconDark}
										disabled={disabled}
										onClick={() => this.handleLayoutChange('list')}
										style={{
											minWidth: '20px',
										}}
									>
										<IconViewList />
									</Button>
								</Tooltip>
							) : null}
						</div>

					</div>
					<div
						style={{
							height: 'calc(100% - 77px)',
						}}
					>
						{this.state.layout === 'grid' ? (
							<ResourcesGrid {...this.props} resources={filteredResources} />
						) : null}
						{this.state.layout === 'list' ? (
							<ResourcesList {...this.props} resources={filteredResources} />
						) : null}
					</div>
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(CombinedResourceListing);
