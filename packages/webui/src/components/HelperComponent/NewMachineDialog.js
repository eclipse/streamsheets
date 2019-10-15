/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ListItemText from '@material-ui/core/ListItemText';
import * as Actions from '../../actions/actions';
import AddNewDialog from '../base/addNewDialog/AddNewDialog';
import StreamHelper from '../../helper/StreamHelper';
import SortSelector from '../base/sortSelector/SortSelector';

export class NewMachineDialog extends Component {
	constructor(props) {
		super(props)
		this.initialized = false;
		this.resources = [];
	}

	componentDidUpdate(props) {
		if(!this.initialized && props.consumers.length>0) {
			this.initialized = true;
			this.resources = SortSelector.sort(props.consumers.map(resource => {
				resource.state = StreamHelper.getStreamState(resource);
				return resource;
			}));
			this.forceUpdate();
		}
	}

	getResources = () => this.resources;

	getListElement = (stream) => [
			<ListItemText primary={`${stream.name}`}/>,
			<img style={{ float: 'right' }} width={15} height={15}
			     src={StreamHelper.getStreamStateIcon(stream)} alt="state"/>,
		];

	handleClose = () => {
		this.props.setAppState({
			showNewDialog: false,
		});
	};

	isNameUnique = (name) => !this.props.machines.find(
		c => c.name.toLowerCase() === name.toLowerCase());

	isNameValid = (name) => name.length > 0;

	handleSubmit = ({ selected, error, name }) => {
		if (!error) {
			let url = '/machines/base_machine';
			if (selected && selected.id) {
				url += `?streamId=${selected.id}&streamName=${selected.name}&machineName=${name}`;
			} else {
				url += `?machineName=${name}`;
			}
			window.open(url);
			this.handleClose();
		}
	};

	render() {
		return (
			<AddNewDialog
				open={this.props.open}
				onClose={this.handleClose}
				resources={this.getResources()}
				title={<FormattedMessage
					id="DialogNew.title"
					defaultMessage="New"
				/>}
				listTitle={<FormattedMessage
					id="DialogNew.consumer"
					defaultMessage="Please select a consumer"
				/>}
				isUnique={this.isNameUnique}
				isValid={this.isNameValid}
				onSubmit={this.handleSubmit}
				getListElement={this.getListElement}
			/>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.showNewDialog,
		machines: state.machines.data,
		consumers: state.streams.consumers,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	connect(mapStateToProps, mapDispatchToProps)(NewMachineDialog));
