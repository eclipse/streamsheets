/* eslint-disable no-unused-vars,react/prop-types,react/no-unused-state */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';
import CombinedResourceListing
	from '../../base/listing/CombinedResourceListing';
import {formatDateString}
	from '../../base/listing/Utils';
import * as Actions from '../../../actions/actions';
import { accessManager } from '../../../helper/AccessManager';
import NotAuthorizedComponent from '../../Errors/NotAuthorizedComponent';
import styles from '../styles';
import AdminConstants from '../../../constants/AdminConstants';
import Constants from '../../../constants/Constants';
import StreamHelper from '../../../helper/StreamHelper';
import { /* IconPlay, */ IconReload, IconStop } from '../../icons';
import StreamToolBar from './StreamFormContainer';

const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;
const getTopics = (config) => {
	if(config.baseTopic) {
		return [config.baseTopic];
	}
	if(config.topic) {
		return [config.topic];
	}
	if(config.topics && Array.isArray(config.topics)) {
		return config.topics;
	}
	return [];
};
const showField = (field) => {
	if (field.type) {
		if (field.type.indexOf('SECRET') >= 0 || field.type.indexOf('PASS') >=
			0) {
			return false;
		}
	}
	return true;
};

class Connectors extends Component {
	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null,
		};
	}

	onFilter = (filter, resources) => (filter && filter.length > 0 ?
		resources.filter(stream => stream.name.toLowerCase().
			indexOf(filter.toLowerCase()) >= 0) : resources);

	onResourceOpen = (resource) => {
		this.props.openStream(resource);
	};

	handleNew = (event) => {
		event.preventDefault();
		this.props.toggleDialogAddConfiguration(event);
	};

	handleMenuSelect = (optionIndex, resourceId) => {
		this.props.setConfigurationActive(resourceId, 'connectors');
		this.forceUpdate();
		switch (optionIndex) {
			case 0:
				window.open(`/administration/stream/${resourceId}`);
				break;
			case 1: {
				const { deleteDialogOpen } = this.props.appState;
				this.props.setDeleteDialogOpen(!deleteDialogOpen);
				break;
			}
			default:
				StreamHelper.handleDSMenuAction(optionIndex, resourceId,
					this.props);
		}
		this.setState({ anchorEl: null });
	};

	handleReloadAll = connectors => () => {
		this.props.reloadAllStreams(connectors.map(f => f.name));
	};

	render() {
		if (!accessManager.canViewUI(
			accessManager.PERMISSIONS.STREAM_VIEW)) {
			return <NotAuthorizedComponent
				target={accessManager.PERMISSIONS.STREAM_VIEW}/>;
		}
		const canControl = accessManager.can(RESOURCE_TYPES.CONNECTOR,
			RESOURCE_ACTIONS.CONTROL);
		const canEdit = accessManager.can(RESOURCE_TYPES.CONNECTOR,
			RESOURCE_ACTIONS.EDIT);
		const canDelete = accessManager.can(RESOURCE_TYPES.CONNECTOR,
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
			{ label: 'State', key: 'state' },
			{ label: 'Provider', key: 'provider.name' },
			{ label: 'Topics', key: 'topics'},
			{ label: 'Owner', key: 'owner' },
			{ label: 'Disabled', key: 'disabled' },
			{ label: <FormattedMessage id="Admin.lastModified" defaultMessage="Last Modified" />, key: 'lastModified_formatted' },
		];
		const getProvider = stream => this.props.streams.providers.find(
			p => p.id === stream.provider.id);
		const connectors = this.props.streams.connectors.filter(
			getProvider).map((connector_) => {
			const connector = Object.assign({}, connector_);
			connector.state = StreamHelper.getResourceState(connector,
				this.props.streams.statusMap);
			const connectedStreams = [...StreamHelper.getProducersUsingConnector(connector.id, this.props.streams.producers),
				...StreamHelper.getConsumersUsingConnector(connector.id, this.props.streams.consumers)];
			if(connectedStreams.length>0) {
				connector.state = StreamHelper.getStatusFor(connector.state);
			} else {
				connector.state = StreamHelper.NO_STREAM;
			}
			connector.key = connector.id;
			connector.lastModified_formatted = formatDateString(connector.lastModified);
			const provider = getProvider(connector);
			const config = {
				...connector,
				name: (connector) ?
					connector.name :
					<FormattedMessage id="Admin.connectorNotAvailable"
					                  defaultMessage="Connector not available"/>,
				provider: {
					...provider,
					name: (provider) ?
						provider.name : {
							error:
								<FormattedMessage
									id="Admin.providerNotAvailable"
									defaultMessage="Provider {providerId} not available"
									values={{ providerId: connector.provider.id }}
								/>,
						},
				},
			};
			const topics = getTopics(config);
			config.topics = topics;
			return config;
		}).filter(stream => stream !== undefined);
		return (
			<CombinedResourceListing
				type="admin"
				fields={fields}
				label={<FormattedMessage
					id="Dashboard.connectors"
					defaultMessage="Connectors"
				/>}
				handleNew={accessManager.canViewUI(
					accessManager.PERMISSIONS.STREAM_ADD)
					? this.handleNew
					: false}
				titleAttribute="name"
				resources={connectors}
				icon={AdminConstants.GRID_CONFIG.ConnectorConfiguration.icon}
				menuOptions={options}
				onFilter={this.onFilter}
				onMenuSelect={this.handleMenuSelect}
				onResourceOpen={this.onResourceOpen}
				headerBackgroundColor={AdminConstants.GRID_CONFIG.ConnectorConfiguration.headerBackgroundColor}
				handleReload={canControl
					? this.handleReloadAll(connectors)
					: undefined}
				headerIcons={[
					// { icon: IconPlay, menuId: StreamHelper.BUTTONS.START, state: ['dispose'] },
					{
						icon: IconStop,
						menuId: StreamHelper.BUTTONS.STOP,
						state: 'dispose',
						label: <FormattedMessage id="Tooltip.Stop" defaultMessage="Stop" />,
						disabled: (resource) => !canControl || resource.state === StreamHelper.NO_STREAM
					},
					{
						icon: IconReload,
						menuId: StreamHelper.BUTTONS.RELOAD,
						state: 'progress',
						label: <FormattedMessage id="Tooltip.Reload" defaultMessage="Reload" />,
						disabled: (resource) => !canControl || resource.state === StreamHelper.NO_STREAM
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
		appState: state.appState,
		streams: state.streams,
		adminSecurity: state.adminSecurity,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(
	connect(mapStateToProps, mapDispatchToProps)(Connectors));
