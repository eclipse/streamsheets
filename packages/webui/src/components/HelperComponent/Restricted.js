import React from 'react';
import { connect } from 'react-redux';
import { accessManager } from '../../helper/AccessManager';

export function NotAllowed(props) {
	return props.children;
}

function RestrictedComponent(props) {
	const { type, action, oneOf = [], permission } = props;
	const hasAccess =
		(type && action && accessManager.can(type, action)) ||
		(permission && !accessManager.isAccessDisabled(permission, false)) ||
		oneOf.reduce((prev, current) => prev || accessManager.can(current.type, current.action), false) ||
		(!action && !permission  && oneOf.length === 0 );

	return React.Children.map(props.children, (child) => {
		const { name } = child.type;
		if ((!hasAccess && name === 'NotAllowed') || (hasAccess && name !== 'NotAllowed')) {
			return child;
		}
		return null;
	});
}

// Trigger rerender on permission change
const mapStateToProps = (state) => ({
	adminSecurity: state.adminSecurity
});

export const Restricted = connect(mapStateToProps)(RestrictedComponent);
