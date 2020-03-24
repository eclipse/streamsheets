import React from 'react';
import { connect } from 'react-redux';

export function NotAllowed(props) {
	return props.children;
}

function RestrictedComponent(props) {
	const { oneOf, all, rights } = props;
	const oneOfResult = oneOf ? oneOf.some((right) => rights.includes(right)) : true;
	const allResult = all ? all.every((right) => rights.includes(right)) : true;
	const hasAccess = oneOfResult && allResult;

	return React.Children.map(props.children, (child) => {
		const { name } = child.type;
		if ((!hasAccess && name === 'NotAllowed') || (hasAccess && name !== 'NotAllowed')) {
			return child;
		}
		return null;
	});
}

const mapStateToProps = (state) => ({
	rights: state.user.user && state.user.user.rights
});

export const Restricted = connect(mapStateToProps)(RestrictedComponent);
