import React, { useEffect } from 'react';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { accessManager } from '../../helper/AccessManager';
import qs from 'query-string';

const isAuthenticated = () => !!accessManager.authToken;
const urlLogin = (location) => {
	const { token, userId } = qs.parse(location.search);
	return token && userId;
};

const RedirectLogin = (props) => {
	useEffect(() => {
		window.location.href = `${window.location.origin}/login?redirect=${encodeURIComponent(
			props.location.pathname + props.location.search
		)}`;
	}, []);
	return null;
};

const PrivateRoute = ({ component: Component, ...rest }) => (
	<Route
		{...rest}
		render={(props) => {
			if (isAuthenticated() || urlLogin(props.location)) {
				return <Component {...props} />;
			}
			return <RedirectLogin location={props.location} />;
		}}
	/>
);

PrivateRoute.propTypes = {
	component: PropTypes.func.isRequired
};
export default PrivateRoute;
