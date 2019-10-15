/* eslint-disable react/prop-types */
/* eslint-disable react/forbid-prop-types */
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import * as Actions from '../../actions/actions';
import MachineHelper from '../../helper/MachineHelper';
import CustomTooltip from '../base/customTooltip/CustomTooltip';
import MachineNameComponent from '../MachineNameComponent/MachineNameComponent';

export function InfoToolBar(props) {
	const { machineId, toggleDrawer, openDashboard, title } = props;
	return (
		<Toolbar
			style={{
				marginRight: 'auto',
				height: '58px',
				minHeight: '58px',
				maxHeight: '58px',
				paddingLeft: '5px',
			}}
		>
			<CustomTooltip header="Tooltip.MainMenuHeader" message="Tooltip.MainMenuMessage">
				<div>
					<IconButton color="inherit" aria-label="Menu" onClick={toggleDrawer}>
						<MenuIcon />
					</IconButton>
				</div>
			</CustomTooltip>
			<Typography
				type="title"
				color="inherit"
				style={{
					color: '#FFFFFF',
					marginLeft: '5px',
					marginRight: '8px',
					cursor: 'pointer',
					fontSize: '1.2rem',
					whiteSpace: 'nowrap'
				}}
			>
				<FormattedMessage id="Product.title" defaultMessage="Streamsheets" />
			</Typography>
			/
			<CustomTooltip header="Tooltip.MainTitleHeader" message="Tooltip.MainTitleMessage">
				<Typography
					type="title"
					color="inherit"
					onClick={openDashboard}
					style={{
						color: '#FFFFFF',
						marginLeft: '5px',
						marginRight: '8px',
						cursor: 'pointer',
						fontSize: '1.2rem',
						whiteSpace: 'nowrap',
					}}
				>
					{title}
				</Typography>
			</CustomTooltip>
			{MachineHelper.isMachineDetailsPage() && machineId ? (
				<MachineNameComponent />
			) : null}
		</Toolbar>
	);
}

InfoToolBar.propTypes = {
	machineId: PropTypes.string,
	title: PropTypes.node.isRequired,
	toggleDrawer: PropTypes.func.isRequired,
	openDashboard: PropTypes.func.isRequired,
};

InfoToolBar.defaultProps = {
	machineId: null,
};

function mapStateToProps(state) {
	return {
		machineId: state.monitor.machine.id,
		drawerOpen: state.appState.drawerOpen,
	};
}

function mergeProps(stateProps, dispatchProps, ownProps) {
	return {
		...ownProps,
		...stateProps,
		toggleDrawer: () => dispatchProps.setAppState({ drawerOpen: !stateProps.drawerOpen }),
		openDashboard: () => dispatchProps.openDashboard(stateProps.machineId),
	};
}

export default connect(
	mapStateToProps,
	Actions,
	mergeProps,
)(InfoToolBar);
