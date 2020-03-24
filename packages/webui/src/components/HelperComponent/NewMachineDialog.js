import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ListItemText from '@material-ui/core/ListItemText';
import * as Actions from '../../actions/actions';
import AddNewDialog from '../base/addNewDialog/AddNewDialog';
import StreamHelper from '../../helper/StreamHelper';

export class NewMachineDialog extends Component {
	constructor(props) {
		super(props);
		this.resources = [];
	}

	getListElement = (stream) => (
		<React.Fragment>
			<ListItemText primary={`${stream.name}`} />,
			<img
				style={{ float: 'right' }}
				width={15}
				height={15}
				src={StreamHelper.getStreamStateIcon(stream)}
				alt="state"
			/>
		</React.Fragment>
	);

	handleClose = () => {
		this.props.setAppState({
			showNewDialog: false
		});
	};

	isNameUnique = (name) => !this.props.machines.find((c) => c.name.toLowerCase() === name.toLowerCase());

	isNameValid = (name) => name.length > 0;

	handleSubmit = ({ selected, error, name }) => {
		if (!error) {
			let url = '/machines/base_machine';
			if (selected && selected.id) {
				url += `?streamId=${selected.id}&streamName=${selected.name}&machineName=${name}`;
			} else {
				url += `?machineName=${name}`;
			}
			url += `&scope=${this.props.scopeId}`
			window.open(url);
			this.handleClose();
		}
	};

	render() {
		return (
			<AddNewDialog
				open={this.props.open}
				onClose={this.handleClose}
				resources={this.props.consumers}
				title={<FormattedMessage id="DialogNew.title" defaultMessage="New" />}
				listTitle={<FormattedMessage id="DialogNew.consumer" defaultMessage="Please select a consumer" />}
				isUnique={this.isNameUnique}
				sortFields={['name', 'state', 'lastModified']}
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
		consumers: state.streams.consumers.map((s) => ({ ...s, state: StreamHelper.getStreamState(s) })),
		scopeId: state.user.user.scope.id
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(NewMachineDialog));
