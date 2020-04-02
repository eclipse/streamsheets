/* eslint-disable react/prop-types,react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';
import {withStyles} from '@material-ui/core/styles';
import {NotificationManager} from 'react-notifications';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl} from 'react-intl';
import styles from '../styles';
import * as Actions from '../../../actions/actions';
import StreamHelper from '../../../helper/StreamHelper';
import ResourceCardHeader from '../../base/listing/ResourceCardHeader';
import { /* IconPlay, */IconStream, IconReload, IconStop, IconDelete, IconClose, IconSave} from '../../icons';
import {accessManager} from '../../../helper/AccessManager';

const {RESOURCE_TYPES, RESOURCE_ACTIONS} = accessManager;

let errorsDone = [];

class StreamToolBar extends React.PureComponent {
	static propTypes = {
		icon: PropTypes.element,
		headerBackgroundColor: PropTypes.string,
		isDirty: PropTypes.bool,
		listingPage: PropTypes.string,
		model: PropTypes.object
	};

	static defaultProps = {
		headerBackgroundColor: '#0CC34A',
		icon: <IconStream/>,
		listingPage: 'consumers',
		isDirty: false,
		model: {}
	};
	onUndo = () => {
		this.props.undo();
	};

	canUndo = () => {
		const {prevState} = this.props;
		return (typeof prevState === 'object') && prevState !== null;
	};

	handleClickAddDialogOpen = (event) => {
		event.preventDefault();
		this.props.toggleDialogAddConfiguration(event);
	};

	handleAction = (optionIndex, resourceId) => {
		switch (optionIndex) {
		case 0: {
			this.props.openPage(`/administration/${this.props.listingPage}`);
			break;
		}
		default:
			StreamHelper.handleDSMenuAction(optionIndex, resourceId, this.props);
		}
	};

	render() {
		const {
			icon,
			headerBackgroundColor,
			// dirty,
			// classes,
			savePending,
			isDirty,
			errors,
			reloadStreamsPending,
			model
			// activeConfigurationId,
		} = this.props;
		const canEdit = accessManager.can(RESOURCE_TYPES.STREAM, RESOURCE_ACTIONS.EDIT);
		const canControl = accessManager.can(RESOURCE_TYPES.STREAM, RESOURCE_ACTIONS.CONTROL);
		const canDelete = accessManager.can(RESOURCE_TYPES.STREAM, RESOURCE_ACTIONS.DELETE);
		// const config = StreamHelper.getConfiguration(this.props, activeConfigurationId);
		const canSave = canEdit && isDirty;
		if (reloadStreamsPending) {
			errorsDone = [];
		}
		errors.forEach((err) => {
			if (!errorsDone.includes(err)) {
				NotificationManager.error(err, 'Streams validation', 0);
				errorsDone.push(err);
			}
		});
		const resource = {...model};
		resource.state = savePending ? 'progress' : resource.state;

		if(StreamHelper.isConnector(resource)) {
			const connectedStreams = [...StreamHelper.getProducersUsingConnector(resource.id, this.props.streams.producers),
				...StreamHelper.getConsumersUsingConnector(resource.id, this.props.streams.consumers)];
			if(connectedStreams.length>0) {
				resource.state = StreamHelper.getResourceState(resource, this.props.streams.statusMap);
				resource.state = StreamHelper.getStatusFor(resource.state);
			} else {
				resource.state = StreamHelper.NO_STREAM;
			}
		} else {
			resource.state = StreamHelper.getResourceState(resource, this.props.streams.statusMap);
			resource.state = StreamHelper.getStatusFor(resource.state);
		}
		return (<ResourceCardHeader
			{...this.props}
			handleClicked={this.handleAction}
			resource={resource}
			titleAttribute="name"
			headerBackgroundColor={headerBackgroundColor}
			headerIcons={[
				//		{ icon: IconPlay, menuId: StreamHelper.BUTTONS.START, state: ['dispose'] },
				{icon: IconSave, menuId: StreamHelper.BUTTONS.SAVE, state: '', disabled: !canSave},
				{
					icon: IconReload,
					menuId: StreamHelper.BUTTONS.RELOAD,
					state: 'progress',
					label: <FormattedMessage id="Tooltip.Reload" defaultMessage="Reload" />,
					disabled: !canControl || canSave || resource.state === StreamHelper.NO_STREAM
				},
				{
					icon: IconStop,
					menuId: StreamHelper.BUTTONS.STOP,
					state: 'dispose',
					label: <FormattedMessage id="Tooltip.Stop" defaultMessage="Stop" />,
					disabled: !canControl || resource.state === 'disconnected' || resource.state === StreamHelper.NO_STREAM
				},
				{
					icon: IconDelete,
					menuId: StreamHelper.BUTTONS.DELETE,
					state: 'delete',
					label: <FormattedMessage id="Tooltip.Delete" defaultMessage="Delete" />,
					disabled: !canDelete
				},
				{
					icon: IconClose,
					menuId: StreamHelper.BUTTONS.CLOSE,
					state: 'min',
					label: <FormattedMessage id="Tooltip.Close" defaultMessage="Close" />,
					onDisabled: true
				},
			]}
			icon={icon}
			titleMaxLength={200}
		/>);
	}
}

function mapStateToProps(state) {
	return {
		streams: state.streams,
		deleteDialogOpen: state.appState.deleteDialogOpen,
		savePending: state.streams.savePending,
		fetching: state.streams.fetching,
		activeConfigurationId: state.streams.activeConfigurationId,
		providers: state.streams.providers,
		connectors: state.streams.connectors,
		consumers: state.streams.consumers,
		producers: state.streams.producers,
		tempConfig: state.streams.tempConfig,
		addDialogOpen: state.appState.addDialogOpen,
		popupMenuE: state.appState.popupMenuE,
		tempConfiguration: state.streams.tempConfiguration,
		errors: state.streams.errors,
		reloadResponse: state.streams.reloadResponse,
		reloadStreamsPending: state.streams.reloadStreamsPending,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({...Actions}, dispatch);
}

// export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(StreamToolBar));
export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(StreamToolBar)));
