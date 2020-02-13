/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import StreamHelper from '../../helper/StreamHelper';
import { AdminNavigation } from '../../layouts/AdminNavigation';
import Database from './security/Database';
import Connectors from './streams/Connectors';
import Consumers from './streams/Consumers';
import NewStreamDialog from './streams/NewStreamDialog';
import Producers from './streams/Producers';
import StreamDeleteDialog from './streams/StreamDeleteDialog';
import StreamFormContainer from './streams/StreamFormContainer';
import Streams from './streams/Streams';
import { PluginExtensions } from '@cedalo/webui-extensions';


import { Restricted, NotAllowed } from '../HelperComponent/Restricted';

const getSelectedPage = (match, streams) => {
	const parts = match.url.split('/');
	const relevantPart = parts[parts.indexOf('administration') + 1];
	if (relevantPart === 'stream') {
		const configuration = StreamHelper.getConfiguration(streams, match.params.configId);
		return configuration ? StreamHelper.getPageFromClass(configuration.className) : 'connectors';
	}
	return relevantPart;
};

const RestrictedWrapper = (props) => (
	<Restricted oneOf={[props.right]}>
		<NotAllowed>
			<div
				style={{
					fontSize: '2rem',
					textAlign: 'center',
					color: 'red',
					// border: 'red dotted',
					padding: '5px',
					margin: '50px'
				}}
			>
				<FormattedMessage id="Admin.notAuthorized" defaultMessage="Not Authorized" />
			</div>
		</NotAllowed>
		{props.children}
	</Restricted>
);

export class AdminContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	getUserId = () => decodeURIComponent(this.props.location.pathname.replace('/administration/user/', ''));

	render() {
		return (
			<div
				style={{
					display: 'flex',
					height: '100%'
				}}
			>
				<div
					style={{
						width: '200px',
						borderRight: '1px solid grey'
					}}
				>
					<div
						style={{
							zIndex: '1100',
							height: '100%'
						}}
					>
						<AdminNavigation selection={getSelectedPage(this.props.match, this.props.streams)} />
					</div>
				</div>
				<div
					style={{
						width: 'calc(100% - 200px)',
						overflowY:
							this.props.location.pathname.startsWith('/administration/stream/') ||
							this.props.location.pathname.startsWith('/administration/user/')
								? 'auto'
								: 'none',
						height: '100%',
						backgroundColor: '#EEEEEE'
					}}
				>
					{this.props.location.pathname === '/administration/database' ? (
						<RestrictedWrapper right="database">
							<Database />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname === '/administration/streams' ? (
						<RestrictedWrapper right="stream">
							<Streams />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname === '/administration/consumers' ? (
						<RestrictedWrapper right="stream">
							<Consumers />
							<StreamDeleteDialog />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname === '/administration/producers' ? (
						<RestrictedWrapper right="stream">
							<Producers />
							<StreamDeleteDialog />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname === '/administration/connectors' ? (
						<RestrictedWrapper right="stream">
							<Connectors />
							<StreamDeleteDialog />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname.startsWith('/administration/stream/') ? (
						<RestrictedWrapper right="stream">
							<StreamFormContainer match={this.props.match} />
						</RestrictedWrapper>
					) : null}
					{this.props.location.pathname.startsWith('/administration/plugins/') ? (
						<PluginExtensions location={this.props.location} />
					) : null}
				</div>
				<Restricted oneOf={['stream']}>
					<NewStreamDialog />
				</Restricted>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		adminSecurity: state.adminSecurity,
		myUser: state.user.user,
		streams: {
			providers: state.streams.providers,
			connectors: state.streams.connectors,
			consumers: state.streams.consumers,
			producers: state.streams.producers
		}
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminContainer);
