import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';

export const ViewModePropTypes = PropTypes.shape({
	view: PropTypes.string,
	hidegrid: PropTypes.string,
	viewMode: PropTypes.string,
	hideheader: PropTypes.string,
});

function ViewModeHandlerComponent(props) {
	const { searchParams } = props;
	const params = new URLSearchParams(searchParams);
	// set properties to undefined to keep currently set app state (e.g. in SharedMachinePage)
	const viewMode = {
		view: params.get('view') || undefined,
		hidegrid: params.get('hidegrid') || undefined,
		viewMode: params.get('viewmode') || undefined,
		hideheader: params.get('hideheader') || undefined
	};
	// use effect to prevent endless update loop...
	useEffect(() => props.setAppState({ viewMode }), []);
	return null;
}

const mapStateToProps = (state) => ({
	searchParams: state.router.location.search,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ ...Actions }, dispatch);

export const ViewModeHandler = connect(
	mapStateToProps,
	mapDispatchToProps,
)(ViewModeHandlerComponent);
