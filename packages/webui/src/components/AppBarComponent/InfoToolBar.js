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
/* eslint-disable react/prop-types */
/* eslint-disable react/forbid-prop-types */
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PropTypes from 'prop-types';
import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import MachineHelper from '../../helper/MachineHelper';
import MachineNameComponent from '../MachineNameComponent/MachineNameComponent';

export function InfoToolBar(props) {
	const {
		machineId,
		toggleDrawer,
		openDashboard,
		goBackPage,
		title,
		canEditMachine,
		hideDrawer = false
	} = props;

	const goBack = () => (history.length > 0 ? openDashboard() : goBackPage());

	return (
		<Toolbar
			style={{
				height: '58px',
				minHeight: '58px',
				maxHeight: '58px',
				paddingLeft: '5px',
				width: props.width
			}}
		>
			<div>
				{hideDrawer ? (
					<IconButton style={{ color: 'white' }} onClick={goBack}>
						<ArrowBackIcon />
					</IconButton>
				) : (
					<IconButton style={{ color: 'white' }} aria-label="Menu" onClick={toggleDrawer}>
						<MenuIcon />
					</IconButton>
				)}
			</div>
			{title ? (
				<Typography
					type="title"
					color="inherit"
					onClick={openDashboard}
					style={{
						color: '#FFFFFF',
						marginLeft: '5px',
						marginTop: '2px',
						marginRight: '8px',
						cursor: 'pointer',
						fontSize: '1.2rem',
						whiteSpace: 'nowrap'
					}}
				>
					{title}
				</Typography>
			) : null}
			
			{MachineHelper.isMachineDetailsPage() && machineId ? (
				<MachineNameComponent disabled={!canEditMachine} />
			) : null}
		</Toolbar>
	);
}

InfoToolBar.propTypes = {
	machineId: PropTypes.string,
	title: PropTypes.node,
	width: PropTypes.string,
	toggleDrawer: PropTypes.func.isRequired,
	openDashboard: PropTypes.func.isRequired
};

InfoToolBar.defaultProps = {
	machineId: null,
	title: undefined,
	width: undefined
};

function mapStateToProps(state) {
	return {
		machineId: state.monitor.machine.id,
		drawerOpen: state.appState.drawerOpen
	};
}

function mapDispatchToProps(dispatch) {
	return { ...bindActionCreators({ ...Actions }, dispatch), dispatch };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
	return {
		...ownProps,
		...stateProps,
		...dispatchProps,
		toggleDrawer: () => dispatchProps.setAppState({ drawerOpen: !stateProps.drawerOpen }),
		openDashboard: () => dispatchProps.openDashboard(stateProps.machineId)
	};
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(InfoToolBar);
