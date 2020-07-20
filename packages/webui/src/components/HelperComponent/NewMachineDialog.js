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
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ListItemText from '@material-ui/core/ListItemText';
import * as Actions from '../../actions/actions';
import AddNewDialog from '../base/addNewDialog/AddNewDialog';
import StreamHelper from '../../helper/StreamHelper';
import { Path } from '../../helper/Path';

export class NewMachineDialog extends Component {
	constructor(props) {
		super(props);
		this.resources = [];
	}

	getListElement = (stream) => (
		<React.Fragment>
			<ListItemText primary={`${stream.name}`} />
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
			const query = {
				scope: this.props.scopeId,
				machineName: name
			};
			if (selected && selected.id) {
				query.streamId = selected.id;
				query.streamName = selected.name;
			}
			window.open(Path.machine('base_machine', query));
			this.handleClose();
		}
	};

	render() {
		return (
			<AddNewDialog
				open={this.props.open}
				showState
				onClose={this.handleClose}
				resources={this.props.consumers}
				streams={this.props.streams}
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
		streams: state.streams,
		scopeId: state.user.user.scope.id
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(NewMachineDialog));
