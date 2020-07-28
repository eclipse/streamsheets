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
/* eslint-disable no-unused-vars,react/prop-types,react/no-unused-state */
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';
import {FormattedMessage} from 'react-intl';
import {formatDateString}
	from '../../base/listing/Utils';
import NotAuthorizedComponent from '../../Errors/NotAuthorizedComponent';
import CombinedResourceListing from '../../base/listing/CombinedResourceListing';
import * as Actions from '../../../actions/actions';
import {accessManager} from '../../../helper/AccessManager';
import styles from '../styles';
import { /* IconPlay, */ IconReload, IconStop} from '../../icons';
import Constants from '../../../constants/Constants';
import AdminConstants from '../../../constants/AdminConstants';
import StreamHelper from '../../../helper/StreamHelper';
import { Path } from '../../../helper/Path';

const {RESOURCE_TYPES, RESOURCE_ACTIONS} = accessManager;
const getTopics = (config) => {
	if(config.topic) {
		if(config.connector && typeof config.connector.baseTopic === 'string') {
			return [config.connector.baseTopic + config.topic];
		}
		return [config.topic];
	}
	if(config.topics && Array.isArray(config.topics) && config.topics.length>0) {
		if(config.connector && typeof config.connector.baseTopic === 'string') {
			return config.topics.map(t => config.connector.baseTopic + t)
		}
		return config.topics;
	}
	if(config.connector.baseTopic) {
		return [config.connector.baseTopic];
	}
	return [];
};

class Consumers extends Component {
	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null,
		};
	}

	onResourceOpen = (resource) => {
		this.props.openStream(resource);
	};

	handleMenuSelect = (optionIndex, resourceId) => {
		this.props.setConfigurationActive(resourceId, 'consumers');
		this.forceUpdate();
		switch (optionIndex) {
		case 0:
			window.open(Path.stream(resourceId));
			break;
		case 1: {
			const {deleteDialogOpen} = this.props;
			this.props.setDeleteDialogOpen(!deleteDialogOpen);
			break;
		}
		default:
			StreamHelper.handleDSMenuAction(optionIndex, resourceId, this.props);
		}
		this.setState({anchorEl: null});
	};

	handleNew = (event) => {
		event.preventDefault();
		this.props.toggleDialogAddConfiguration(event);
	};

	handleReloadAll = consumers => () => {
		this.props.reloadAllStreams(consumers.map(f => f.name));
	};

	render() {
		if (!accessManager.canViewUI(accessManager.PERMISSIONS.STREAM_VIEW)) {
			return <NotAuthorizedComponent target={accessManager.PERMISSIONS.STREAM_VIEW}/>;
		}
		const canControl = accessManager.can(RESOURCE_TYPES.CONSUMER, RESOURCE_ACTIONS.CONTROL);
		const canEdit = accessManager.can(RESOURCE_TYPES.CONSUMER,
			RESOURCE_ACTIONS.EDIT);
		const canDelete = accessManager.can(RESOURCE_TYPES.CONSUMER,
			RESOURCE_ACTIONS.DELETE);
		const options = [];
		if (canEdit) {
			options.push({
				label: <FormattedMessage id="Admin.edit" defaultMessage="Edit"/>,
				value: Constants.RESOURCE_MENU_IDS.EDIT,
			});
		}
		if (canDelete) {
			options.push({
				label: <FormattedMessage id="Admin.delete" defaultMessage="Delete"/>,
				value: Constants.RESOURCE_MENU_IDS.DELETE,
			});
		}
		const fields = [
			{label: 'State', key: 'state'},
			{label: 'Owner', key: 'owner'},
			{label: 'Disabled', key: 'disabled'},
			{
				label: <FormattedMessage id="Admin.lastModified" defaultMessage="Last Modified"/>,
				key: 'lastModified_formatted'
			},
			{label: <FormattedMessage id="Admin.connector" defaultMessage="Connector"/>, key: 'connector.name'},
			{label: 'Provider', key: 'connector.provider.name'},
			{label: 'Topics', key: 'topics'},
			{label: 'dataFormat', key: 'dataFormat'},
			{label: 'labelAttribute', key: 'labelAttribute'},
			{label: 'idAttribute', key: 'idAttribute'},
		];
		const getProvider = stream => this.props.streams.providers.find((p) => {
			const connector = this.props.streams.connectors.find(c => c.id === stream.connector.id);
			return p.id === connector.provider.id;
		});
		const consumers = this.props.streams.consumers.filter(getProvider).map((stream_) => {
			const stream = Object.assign({}, stream_);
			stream.state = StreamHelper.getResourceState(stream, this.props.streams.statusMap);
			stream.state = StreamHelper.getStatusFor(stream.state);
			stream.lastModified_formatted = formatDateString(stream.lastModified);
			const connector = this.props.streams.connectors.find(p => p.id === stream.connector.id);
			const provider = this.props.streams.providers
				.find(p => connector && connector.provider && p.id === connector.provider.id);
			const config = {
				...stream,
				connector: connector ? {
					...connector,
					provider: {
						...provider,
						name: (provider) ?
							provider.name : {
								error:
									<FormattedMessage
										id="Admin.providerNotAvailable"
										defaultMessage="Provider {providerId} not available"
										values={{providerId: connector.provider.id}}
									/>,
							},
					},
				} : {},
			};
			const topics = getTopics(config);
			config.topics = topics;
			return config;
		});

		return (
			<CombinedResourceListing
				type="admin"
				layout={this.props.layout}
				fields={fields}
				handleNew={accessManager.canViewUI(accessManager.PERMISSIONS.STREAM_ADD) ? this.handleNew : false}
				titleAttribute="name"
				resources={consumers}
				menuOptions={options}
				onMenuSelect={this.handleMenuSelect}
				onResourceOpen={this.onResourceOpen}
				handleReload={canControl ? this.handleReloadAll(consumers) : undefined}
				headerIcons={[
					//					{ icon: IconPlay, menuId: StreamHelper.BUTTONS.START, state: ['dispose']
					// },
					{
						icon: IconStop,
						menuId: StreamHelper.BUTTONS.STOP,
						state: 'dispose',
						label: <FormattedMessage id="Tooltip.Stop" defaultMessage="Stop" />,
						disabled: !canControl
					},
					{
						icon: IconReload,
						menuId: StreamHelper.BUTTONS.RELOAD,
						state: 'progress',
						label: <FormattedMessage id="Tooltip.Reload" defaultMessage="Reload" />,
						disabled: !canControl
					},
				]}
				filterName
				toggleResourceProgress={(res) => this.props.timeoutStreamControlEvent(res)}
			/>
		);
	}
}

function mapStateToProps(state) {
	return {
		deleteDialogOpen: state.appState.deleteDialogOpen,
		streams: state.streams,
		adminSecurity: state.adminSecurity,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({...Actions}, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(Consumers));
