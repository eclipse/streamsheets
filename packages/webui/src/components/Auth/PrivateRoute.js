import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { accessManager } from '../../helper/AccessManager';

const isAuthenticated = () => !!accessManager.authToken;

const PrivateRoute = ({ component: Component, ...rest }) => 
	(<Route
			{...rest}
			render={(props) => {
				if (isAuthenticated()) {
					return <Component {...props} />;
				}
				return (
					<Redirect
						to={{
							pathname: '/login',
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
