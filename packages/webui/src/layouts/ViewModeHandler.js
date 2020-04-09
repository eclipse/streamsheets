import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';

export const ViewModePropTypes = PropTypes.shape({
	view: PropTypes.string,
	hidegrid: PropTypes.string,
	viewMode: PropTypes.string,
	hideheader: PropTypes.string,
});

const toSearchString = (str) => (str.startsWith('#') ? str.substring(1) : str);

function ViewModeHandlerComponent(props) {
	// DL-3962 hash-symbol in URL will lead to  empty searchParams...
	const { hash, searchParams } = props;
	const searchStr = toSearchString(searchParams || hash);
	// if no params passed we keep those currently in app-state
	if (searchStr) {
		const params = new URLSearchParams(searchStr);
		const viewMode = {
			view: params.get('view'),
			hidegrid: params.get('hidegrid'),
			viewMode: params.get('viewmode'),
			hideheader: params.get('hideheader')
		};
		props.setAppState({ viewMode });
	}
	return null;
}

const mapStateToProps = (state) => ({
	hash: state.router.location.hash,
	location: state.router.location,
	searchParams: state.router.location.search,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ ...Actions }, dispatch);

export const ViewModeHandler = connect(
	mapStateToProps,
	mapDispatchToProps,
)(ViewModeHandlerComponent);
