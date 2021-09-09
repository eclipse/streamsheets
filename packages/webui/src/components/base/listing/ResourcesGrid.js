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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types,jsx-a11y/click-events-have-key-events  */
import React from 'react';
import PropTypes from 'prop-types';
import jsonpath from 'jsonpath';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import ResourceCardHeader from './ResourceCardHeader';
import SortSelector from '../sortSelector/SortSelector';
import { injectIntl } from 'react-intl';
import { withStyles} from "@material-ui/core/styles";
import grey from '@material-ui/core/colors/grey';
import { getImageByResource } from './Utils';

const PREF_KEY_SORTQUERY = 'streamsheets-prefs-listing-sortby';

const styles = ( /* theme */ ) => ({
	card: {
		borderRadius: '5px',
		border: 'thin solid #e5e5e5',
		margin: '3px',
		transition: 'all 0.2s ease-out',
		'&:hover': {
			backgroundColor: grey[100],
			border: `thin solid ${grey[400]}`,
		    transform: 'scale(1.02)'
		}
	}
});

class ResourcesGrid extends React.Component {
	static propTypes = {
		disabled: PropTypes.bool,
		menuOptions: PropTypes.array.isRequired,
		resources: PropTypes.array.isRequired,
		recent: PropTypes.array,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		icon: PropTypes.element,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		dummy: PropTypes.number
	};

	static defaultProps = {
		dummy: -1,
		disabled: false,
		handleResourceDetails: undefined,
		headerIcons: [],
		icon: undefined,
		recent: [],
		onMenuSelect: undefined
	};

	constructor(props) {
		super(props);
		this.state = {
			sortQuery: localStorage.getItem(PREF_KEY_SORTQUERY)
		};
		this.gridRef = React.createRef();
	}

	handleOpenClick = (resource) => {
		if (this.props.onResourceOpen) {
			this.props.onResourceOpen(resource, true);
		}
	};

	handleContextMenu = (event, resource) => {
		this.props.onResourceOpen(resource, true);
		event.stopPropagation();
		event.preventDefault();
	};

	createDescription(resource) {
		if (!resource) {
			return '';
		}
		switch (resource.className) {
			case 'ConnectorConfiguration':
				return ``;
			case 'ConsumerConfiguration':
				return ``;
			case 'ProducerConfiguration':
				return ``;
			default:
		}
		let cons = '';
		resource.streamsheets.forEach((sheet) => {
			if (sheet.inbox.stream) {
				if (cons.length) {
					cons += ', ';
				}
				cons += sheet.inbox.stream.name;
			}
		});
		if (!cons.length) {
			cons = this.props.intl.formatMessage({ id: 'Dashboard.noConsumers' }, {});
		}
		return this.props.intl.formatMessage(
			{ id: 'Dashboard.description' },
			{
				amount: resource.streamsheets.length,
				amountext: resource.streamsheets.length > 1 ? 's' : '',
				consumers: cons
			}
		);
	}

	getTiles(resources, columns) {
		const { classes, menuOptions, icon, titleAttribute, onMenuSelect } = this.props;
		let cnt = 0;
		const result = [];

		resources.some((resource) => {
			if (columns !== undefined && cnt >= columns) {
				return true;
			}
			cnt += 1;
			result.push(
				<GridListTile
					className={classes.tile}
					key={`${resource.id}`}
					cols={1}
					spacing={5}
					style={{
						height: 'auto',
						width: '330px'
					}}
				>
					<Card
						elevation={2}
						square
						className={classes.card}
					>
						<CardContent
							style={{
								cursor: 'pointer',
								padding: '0px'
							}}
							onContextMenu={(event) => this.handleContextMenu(event, resource)}
						>
							<div>
								<div
									onClick={() => this.handleOpenClick(resource)}
									style={{
										width: '300px',
										height: '155px',
										backgroundImage: `url(${getImageByResource(resource)})`,
										backgroundSize: '300px 155px'
									}}
								/>
								<div
									style={{
										borderTop: '1px solid lightgrey',
										display: 'flex',
										alignItems: 'baseline',
										justifyContent: 'space-between',
										padding: '3px 10px 0px 10px'
									}}
									onClick={() => this.handleOpenClick(resource)}
								>
									<Typography
										component="div"
										style={{
											textOverflow: 'ellipsis',
											fontSize: '9pt',
											fontWeight: 'bold',
											whiteSpace: 'nowrap',
											color: this.props.theme.palette.primary.main,
											overflow: 'hidden',
											maxWidth: '200px'
										}}
									>
										{jsonpath.query(resource, titleAttribute)}
									</Typography>
									<Typography
										component="div"
										color="textSecondary"
										style={{
											textOverflow: 'ellipsis',
											overflow: 'hidden',
											maxWidth: '130px',
											fontSize: '8pt'
										}}
									>
										{jsonpath.query(resource, 'lastModified_formatted')}
									</Typography>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										padding: '0px 10px 0px 10px',
										height: '45px'
									}}
								>
									<Typography
										component="div"
										color="textSecondary"
										onClick={() => this.handleOpenClick(resource)}
										style={{
											textOverflow: 'ellipsis',
											overflow: 'hidden',
											maxWidth: '130px',
											fontSize: '8pt'
										}}
									>
										{jsonpath.query(resource, 'description').length
											? jsonpath.query(resource, 'description')
											: this.createDescription(resource)}
									</Typography>
									<div
										style={{
											marginTop: '8px',
											marginRight: '-8px'
										}}
									>
										<ResourceCardHeader
											{...this.props}
											handleClicked={onMenuSelect}
											resource={resource}
											titleAttribute={titleAttribute}
											icon={icon}
											menuOptions={menuOptions}
											onMenuSelect={onMenuSelect}
											titleMaxLength={15}
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</GridListTile>
			);
			return false;
		});

		return result;
	}

	handleSort = (event, sortedResources, sortQuery) => {
		this.setState({
			sortQuery
		});
		localStorage.setItem(PREF_KEY_SORTQUERY, sortQuery);
	};

	render() {
		const { resources } = this.props;

		const resGrid = document.getElementById('resGrid');
		let width = resGrid ? resGrid.clientWidth - 1 : 500;
		const resList = document.getElementById('combinedResourceList');
		const resListWidth = resList ? resList.clientWidth : 500;
		if (resListWidth - width < 2) {
			width -= 20;
		}

		const sortQuery = localStorage.getItem(PREF_KEY_SORTQUERY) || this.state.sortQuery || 'lastModified_desc';
		const sortFields = ['name', 'lastModified', 'state'];
		const sortObj = SortSelector.parseSortQuery(sortQuery);
		const filteredResources = SortSelector.sort(resources, sortQuery, '');
		const columns = Math.floor(width / 330);

		// const recent = resources.length < columns || this.props.filter.length ? undefined : this.props.recent;

		if (filteredResources.length === 0) {
			return <div />;
		}

		return (
			<div
				id="resGrid"
				style={{
					height: '100%',
					overflowY: 'auto'
				}}
			>
				
				<div
					style={{
						marginLeft: `${Math.max(0, Math.floor((width - columns * 330) / 2))}px`,
						marginRight: `${Math.max(0, Math.floor((width - columns * 330) / 2))}px`
					}}
				>
					<div
						key="rg2"
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginTop: '15px'
						}}
					>
						<div
							style={{
								marginTop: '5px',
								marginLeft: '5px',
							}}
						/>
						<div
						style={{
							display: 'flex',
							flexFlow: 'row'
						}}
					>
						<SortSelector
							onSort={this.handleSort}
							getResources={this.getFilteredResources}
							sortFields={sortFields}
							withFilter={false}
							defaultSortBy={sortObj.sortBy}
							defaultSortDir={sortObj.sortDir}
						/>
					</div>
					</div>
					<GridList
						ref={this.gridRef}
						cols={5}
						key="coreGrid"
						id="coreGrid"
						spacing={25}
						style={{
							margin: '0px'
						}}
					>
						{!resources ? null : this.getTiles(filteredResources)}
					</GridList>
				</div>
			</div>
		);
	}
}

export default injectIntl(withStyles(styles, { withTheme: true })( ResourcesGrid));
