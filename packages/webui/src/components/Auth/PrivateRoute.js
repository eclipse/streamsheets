import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { accessManager } from '../../helper/AccessManager';
import qs from 'query-string';

const isAuthenticated = () => !!accessManager.authToken;
const urlLogin = (location) => {
	const {token, userId} = qs.parse(location.search);
	return token && userId;
}

const PrivateRoute = ({ component: Component, ...rest }) => 
	(<Route
			{...rest}
			render={(props) => {
				if (isAuthenticated() || urlLogin(props.location)) {
					return <Component {...props} />;
				}
				return (
					<Redirect
						to={{
							pathname: '/login',
							// eslint-disable-next-line
							search: `?redirect=${encodeURIComponent(props.location.pathname + props.location.search)}`
						}}
					/>
				);
			}}
		/>
	);

PrivateRoute.propTypes = {
	component: PropTypes.func.isRequired,
};
export default PrivateRoute;
