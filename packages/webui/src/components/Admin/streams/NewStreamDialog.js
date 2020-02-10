/* eslint-disable react/forbid-prop-types,react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles/index';
import { FormattedMessage, injectIntl } from 'react-intl';

import StreamHelper from '../../../helper/StreamHelper';
import styles from '../styles';
import * as Actions from '../../../actions/actions';
import AdminConstants from '../../../constants/AdminConstants';
import AddNewDialog from '../../base/addNewDialog/AddNewDialog';

const getPageSelected = () => {
	const parts = window.location.href.split('/');
	return parts[parts.indexOf('administration') + 1];
};

const MESSAGES = {
	connectors:  <FormattedMessage
		id="Admin.addConnector"
		defaultMessage="New Connector"
	/>,
	consumers:  <FormattedMessage
		id="Admin.addConsumer"
		defaultMessage="New Consumer"
	/>,
	producers:  <FormattedMessage
		id="Admin.addProducer"
		defaultMessage="New Producer"
	/>,
};
const HINT_MESSAGES = {
	connectors:  <FormattedMessage
		id="Admin.selectProviderHint"
		defaultMessage="Select Provider"
	/>,
	consumers:  <FormattedMessage
		id="Admin.selectConnectorHint"
		defaultMessage="Select Connector"
	/>,
	producers:  <FormattedMessage
		id="Admin.selectConnectorHint"
		defaultMessage="Select Connector"
	/>,
};
class NewStreamDialog extends React.Component {

	constructor(props) {
		super(props);
		this.state = MESSAGES.connectors;
		this.listTitle = HINT_MESSAGES.connectors;
	}

	componentWillReceiveProps(nextProps) {
		const pageSelected = getPageSelected();
		this.title = MESSAGES[pageSelected];
		this.listTitle = HINT_MESSAGES[pageSelected];
		this.resources = [
			...nextProps[AdminConstants.CONFIG_TYPE.ConnectorConfiguration],
			...nextProps[AdminConstants.CONFIG_TYPE.ProducerConfiguration],
			...nextProps[AdminConstants.CONFIG_TYPE.ConsumerConfiguration],
		];
	}

	getResources = () => this.resources;

	getAddBasedOnOptions = () => {
		const parts = window.location.href.split('/');
		const selected = parts[parts.indexOf('administration') + 1];
		switch (selected) {
		case AdminConstants.CONFIG_TYPE.ConnectorConfiguration: {
			return this.props[AdminConstants.CONFIG_TYPE.ProviderConfiguration].slice(0);
		}
		case AdminConstants.CONFIG_TYPE.ConsumerConfiguration: {
			return this.props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.slice(0)
				.filter((c) => {
					const provider = StreamHelper.getProviderForModel(c, this.props);
					return provider && provider.canConsume !== false;
				});
		}
		case AdminConstants.CONFIG_TYPE.ProducerConfiguration: {
			return this.props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.slice(0)
				.filter((c) => {
					const provider = StreamHelper.getProviderForModel(c, this.props);
					return provider && provider.canProduce !== false;
				});
		}
		default:
			return [];
		}
	};

	handleSubmit = async ({selected, error, name}) => {
		if(!error){
			const { user } = this.props;
			const pageSelected = getPageSelected();
			const baseClassJson = Object.assign({}, selected);
			const newConfiguration = StreamHelper.createNewConfiguration(pageSelected, baseClassJson, this.props);
			newConfiguration.owner = user.userId;
			newConfiguration.name = name;
			const resp = await this.props.saveConfiguration(newConfiguration);
			if (!resp.error && resp.response && !resp.response.result.error) {
				this.props.pushPage(`/administration/stream/${newConfiguration.id}`);
			}
		}
	};

	handleUpdateName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

	handleClose= () => {
		this.props.toggleDialogAddConfiguration();
	};

	isNameUnique = (name) => !this.resources.find(c => c.name.toLowerCase() === name.toLowerCase());

	isNameValid = (name) => name.length > 0;

	render() {
		const { addStreamDialogOpen } = this.props;
		return (
			<AddNewDialog
				open={addStreamDialogOpen}
				onClose={this.handleClose}
				resources={this.getAddBasedOnOptions()}
				title={this.title}
				listTitle={this.listTitle}
				isUnique={this.isNameUnique}
				isValid={this.isNameValid}
				onUpdateName={this.handleUpdateName}
				onSubmit={this.handleSubmit}
				baseRequired
			/>
		);
	}
}
function mapStateToProps(state) {
	return {
		addStreamDialogOpen: state.appState.addStreamDialogOpen,
		activeConfigurationId: state.streams.activeConfigurationId,
		providers: state.streams.providers,
		connectors: state.streams.connectors,
		consumers: state.streams.consumers,
		producers: state.streams.producers,
		user: state.user.user,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(NewStreamDialog)));
