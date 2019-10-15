import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import LinearProgress from '@material-ui/core/LinearProgress';

import theme from '../../theme';
import { openPage, logout } from '../../actions/actions';

class LogoutPage extends React.Component {
	static propTypes = {
		logout: PropTypes.func.isRequired,
		openPage: PropTypes.func.isRequired,
	};

	componentDidMount() {
		this.props.logout();
		this.props.openPage('/login');
	}

	render() {
		return (
			<MuiThemeProvider theme={theme}>
				<div
					style={{
						width: '100vw',
						height: '100vh',
						backgroundSize: '100% 100%',
						backgroundImage: 'url(images/mainbg.jpg)',
					}}
				>
					<LinearProgress />
				</div>
			</MuiThemeProvider>
		);
	}
}
function mapStateToProps(state) {
	return {
		appState: state.appState,
		user: state.user,
	};
}

const mapDispatchToProps = {
	logout,
	openPage,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(LogoutPage);
