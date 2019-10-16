/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Actions from '../../actions/actions';
import {AdminNavigation} from '../../layouts/AdminNavigation';
import Consumers from './streams/Consumers';
import Connectors from './streams/Connectors';
import Database from './security/Database';
import NewStreamDialog from './streams/NewStreamDialog';
import StreamDeleteDialog from './streams/StreamDeleteDialog';
import StreamFormContainer from './streams/StreamFormContainer';
import { accessManager } from '../../helper/AccessManager';
import NotAuthorizedComponent from '../Errors/NotAuthorizedComponent';
import Producers from './streams/Producers';
import Streams from './streams/Streams';

let initiated = false;

export class AdminContainer extends Component {
	static getDerivedStateFromProps(props /* , state */) {
		if (!initiated) {
			initiated = true;
			const { location } = props;
			let selectedPage = 'connectors';
			switch (location.pathname) {
				case '/administration/streams':
					selectedPage = 'streams';
					break;
				case '/administration/consumers':
					selectedPage = 'consumers';
					break;
				case '/administration/producers':
					selectedPage = 'producers';
					break;
				case '/administration/connectors':
					selectedPage = 'connectors';
					break;
				case '/administration/users':
					selectedPage = 'users';
					break;
				case '/administration/user':
					selectedPage = 'user';
					break;
				case '/administration/database':
					selectedPage = 'database';
					break;
				default:
					selectedPage = 'connectors';
			}
			props.setPageSelected(selectedPage);
		}

		return null;
	}

	constructor(props) {
		super(props);
		this.state = {};
	}

	getUserId = () => decodeURIComponent(this.props.location.pathname.replace('/administration/user/', ''));

	render() {
		if (!accessManager.canViewCompositeUI(accessManager.PERMISSIONS.ADMINISTRATION)) {
			return <NotAuthorizedComponent target={accessManager.PERMISSIONS.ADMINISTRATION} />;
		}
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
						<AdminNavigation match={this.props.match} />
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
					{this.props.location.pathname === '/administration/streams' ? <Streams /> : null}
					{this.props.location.pathname === '/administration/database' ? <Database /> : null}
					{this.props.location.pathname === '/administration/consumers'
						? [<Consumers />, <StreamDeleteDialog />]
						: null}
					{this.props.location.pathname === '/administration/producers'
						? [<Producers />, <StreamDeleteDialog />]
						: null}
					{this.props.location.pathname === '/administration/connectors'
						? [<Connectors />, <StreamDeleteDialog />]
						: null}
					{this.props.location.pathname.startsWith('/administration/stream/') ? (
						<StreamFormContainer match={this.props.match} />
					) : null}
				</div>
				<NewStreamDialog />
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
		adminSecurity: state.adminSecurity,
		myUser: state.user.user
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(AdminContainer);
