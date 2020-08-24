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
/* eslint-disable  */
import React  from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {Table, Paper, IconButton} from '@material-ui/core';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import styles from './styles';
import ResourceMenu from './ResourceMenu';
import TableSortHeader from '../addNewDialog/TableSortHeader';
import {injectIntl} from 'react-intl';
import {formatDateString} from './Utils';
import { IconPause, IconPlay, IconStop } from '../../icons';
import Constants from '../../../constants/Constants';

const MAX_LENGTH = 20;

class ResourcesList extends React.Component {
	static propTypes = {
		label: PropTypes.element.isRequired,
		menuOptions: PropTypes.array.isRequired,
		fields: PropTypes.array.isRequired,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		headerBackgroundColor: PropTypes.string,
		disabled: PropTypes.bool,
	};

	static defaultProps = {
		headerBackgroundColor: '#8BC34A',
		handleResourceDetails: undefined,
		disabled: false,
		icon: undefined,
		onMenuSelect: undefined,
	};

	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null,
			resourceId: null,
			streamSortBy: 'name',
			streamSortOrder: 'asc',
		};
	}

	shorten(value) {
		let ret = Array.isArray(value) ? value.join() : value;
		if (ret.length > MAX_LENGTH) {
			ret = `${ret.substr(0, MAX_LENGTH - 3)}...`;
		}
		return ret;
	}

	getMachines() {
		const rows = [];

		if (this.props.resources) {
			this.props.resources.forEach((machine) => {
				rows.push(machine);
			});
		}

		rows.sort((a, b) => {
			const dir = this.state.streamSortOrder === 'asc' ? 1 : -1;

			switch (this.state.streamSortBy) {
			case 'consumers': {
				const aName = this.getConsumers(a)
				const bName = this.getConsumers(b)
				if (aName.toLowerCase() > bName.toLowerCase()) {
					return dir;
				} else if (aName.toLowerCase() < bName.toLowerCase()) {
					return -1 * dir;
				}
				return 0;
			}
			case 'name': {
				const aName = a[this.state.streamSortBy] || '';
				const bName = b[this.state.streamSortBy] || '';
				if (aName.toLowerCase() > bName.toLowerCase()) {
					return dir;
				} else if (aName.toLowerCase() < bName.toLowerCase()) {
					return -1 * dir;
				}
				return 0;
			}
			case 'action': {
				const aState = a.state || '';
				const bState = b.state || '';
				const stateValues = {
					'running': 0,
					'paused': 1,
					'stopped': 2
				}
				if (stateValues[aState] > stateValues[bState]) {
					return dir;
				} else if (stateValues[aState] < stateValues[bState]) {
					return -1 * dir;
				}
				return 0;
			}
			case 'lastModified': {
				const aLastModified = a.lastModified || new Date().toISOString();
				const bLastModified = b.lastModified || new Date().toISOString();
				const res = new Date(aLastModified) - new Date(bLastModified);
				return dir * res;
			}
			default:
				return 0;
			}
		});

		return rows;
	}

	handleTableSort = (event, property) => {
		const orderBy = property;
		const order =
			(this.state.streamSortBy === property && this.state.streamSortOrder === 'desc') ||
			this.state.streamSortBy !== property
				? 'asc'
				: 'desc';

		this.setState({
			streamSortBy: orderBy,
			streamSortOrder: order
		});
	};

	handleSelection = (resource) => {
		this.props.onResourceOpen(resource, true);
	};

	getConsumers(resource) {
		if (!resource) {
			return '';
		}
		let cons = '';
		resource.streamsheets.forEach((sheet) => {
			if (sheet.inbox.stream) {
				if (cons.length) {
					cons += ', ';
				}
				cons += sheet.inbox.stream.name
			}
		});
		if (!cons.length) {
			cons = this.props.intl.formatMessage({ id: 'Dashboard.NoneConsumers' }, {});
		}

		return cons;
	}

	render() {
		const {
			menuOptions,
			onMenuSelect,
			canEdit,
		} = this.props;
		return (
			<Paper
				style={{
					height: '100%',
					overflowY: 'overlay',
				}}
				square
			>
				<Table
					style={{ minWidth: '700'}}
				>
					<TableSortHeader
						height={48}
						cells={[
							{ id: 'name', numeric: false, disablePadding: false, label: 'Name', width: '25%' },
							{ id: 'sheets', numeric: false, disablePadding: true, sort: false, label: 'Dashboard.sheets', width: '5%' },
							{ id: 'consumers', numeric: false, disablePadding: true, label: 'Dashboard.consumers', width: '40%' },
							{ id: 'lastModified', numeric: false, disablePadding: true, label: 'LastModified', width: '17%' },
							// { id: 'state', numeric: false, disablePadding: false, label: 'State', width: '14%' },
							{ id: 'action', numeric: false, disablePadding: true, sort: true, label: 'Streams.Actions', width: '15%', minWidth: '150px' }
						]}
						orderBy={this.state.streamSortBy}
						order={this.state.streamSortOrder}
						onRequestSort={this.handleTableSort}
					/>
					<TableBody>
						{this.getMachines().map((resource) => (
							<TableRow
								style={ {
									height: '40px',
									cursor: 'pointer',
								}}
								hover
								tabIndex={-1}
								key={`${resource.className}-${resource.id}`}
							>
								<TableCell onClick={() => this.handleSelection(resource)} component="th" scope="row">
									{resource.name}
								</TableCell>
								<TableCell onClick={() => this.handleSelection(resource)} padding="none">{resource.streamsheets.length}</TableCell>
								<TableCell onClick={() => this.handleSelection(resource)} padding="none">{this.getConsumers(resource)}</TableCell>
								<TableCell onClick={() => this.handleSelection(resource)} padding="none">{resource.lastModifiedFormatted}</TableCell>
								<TableCell padding="none">
								{!canEdit ? null : [
										<IconButton
											style={{ padding: '4px' }}
											size="small"
											disabled={resource.state === 'running'}
											onClick={() => this.props.onMenuSelect(Constants.RESOURCE_MENU_IDS.START, resource.id)}
										>
											<IconPlay />
										</IconButton>,
										<IconButton
											style={{ padding: '4px' }}
											size="small"
											disabled={resource.state === 'stopped'}
											onClick={() => this.props.onMenuSelect(Constants.RESOURCE_MENU_IDS.STOP, resource.id)}
										>
											<IconStop />
										</IconButton>,
										<IconButton
											style={{ padding: '4px' }}
											disabled={resource.state !== 'running'}
											size="small"
											onClick={() => this.props.onMenuSelect(Constants.RESOURCE_MENU_IDS.PAUSE, resource.id)}
										>
											<IconPause />
										</IconButton>
										]}
									{!menuOptions ? null : (
										<ResourceMenu
											menuOptions={menuOptions}
											resourceId={resource.id}
											onMenuSelect={onMenuSelect}
										/>
								)}
									</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>
		);
	}
}

export default injectIntl(withStyles(styles)(ResourcesList));
