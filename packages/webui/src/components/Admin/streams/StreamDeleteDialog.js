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
/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles/index';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Warning from '@material-ui/icons/Warning';
import { FormattedMessage } from 'react-intl';

import StreamHelper from '../../../helper/StreamHelper';
import AdminConstants from '../../../constants/AdminConstants';
import styles from '../styles';
import * as Actions from '../../../actions/actions';
import { IconMachine, IconStream, IconProducer } from '../../icons';
import { intl } from '../../../helper/IntlGlobalProvider';
import { Path } from '../../../helper/Path';

class StreamDeleteDialog extends React.Component {
	static propTypes = {
		onDelete: PropTypes.func
	};

	static defaultProps = {
		onDelete: undefined
	};

	getListOfConflicts(conflicts) {
		return (
			<div>
				<DialogContentText>
					<p>
						<FormattedMessage
							id="Admin.Stream.WillAlsoDelete"
							defaultMessage="Following streams depend on this connector and will also be deleted:"
						/>
					</p>
				</DialogContentText>
				<List>
					{conflicts.map((c) => (
						<ListItem key={c.id}>
							<ListItemIcon>
								{c.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration ? (
									<IconStream />
								) : (
									<IconProducer />
								)}
							</ListItemIcon>
							<ListItemText primary={c.name} />
						</ListItem>
					))}
				</List>
			</div>
		);
	}

	handleConflictClick(conflict) {
		if (conflict && conflict.id && conflict.className) {
			window.open(Path.stream(conflict.id));
		} else if (conflict && conflict.id) {
			window.open(Path.machine(conflict.id));
		}
	}

	onDelete = async (event) => {
		const action = event.currentTarget.getAttribute('data-action');
		if (action) {
			const configuration = StreamHelper.getActiveConfiguration(this.props);
			const resp = await this.props.deleteActiveConfiguration(configuration.id);
			if (resp && resp.response && resp.response.result === 1) {
				this.forceUpdate();
				if (typeof this.props.onDelete === 'function') {
					this.props.onDelete(true);
					this.closeDeleteDialog();
				}
			} else {
				this.props.setFormFeedback({
					title: 'Delete ',
					error: 'STREAM_DELETE_FAILED',
					message: intl.formatMessage({ id: 'STREAM_DELETE_FAILED', defaultMessage: 'Delete failed' })
				});
			}
		}
	};

	closeDeleteDialog = () => {
		this.props.setDeleteDialogOpen(false);
	};

	render() {
		const { open } = this.props;
		const stream = StreamHelper.getActiveConfiguration(this.props);
		if (!stream) return null;
		const conflicts = StreamHelper.getConficts(this.props);
		return (
			<div>
				<Dialog open={open}>
					<DialogTitle>
						<FormattedMessage
							id="Admin.deleteStream"
							defaultMessage="Delete Stream: {streamName}"
							values={{ streamName: stream && stream.name }}
						/>
					</DialogTitle>
					<DialogContent
						style={{
							marginTop: '20px'
						}}
					>
						<DialogContentText>
							<FormattedMessage
								id="Admin.deleteStreamInfo"
								defaultMessage="You are about to delete the active data source."
							/>
							{conflicts.length > 0 ? this.getListOfConflicts(conflicts) : null}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={this.closeDeleteDialog} color="primary">
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							// disabled={conflicts.length>0}
							data-action="delete"
							onClick={this.onDelete}
							color="primary"
							autoFocus
						>
							{conflicts.length > 0 ? (
								<FormattedMessage id="Admin.Stream.DeleteAll" defaultMessage="Delete all" />
							) : (
								<FormattedMessage id="Delete" defaultMessage="Delete" />
							)}
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}
function mapStateToProps(state) {
	return {
		open: state.appState.streamDeleteDialog.open,
		activeConfigurationId: state.appState.streamDeleteDialog.configId,
		providers: state.streams.providers,
		connectors: state.streams.connectors,
		consumers: state.streams.consumers,
		producers: state.streams.producers
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(StreamDeleteDialog));
