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

function ViewModeHandlerComponent(props) {
	const { searchParams } = props;
	const params = new URLSearchParams(searchParams);
	// if no params passed we keep those currently in app-state
	if (searchParams) {
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
	searchParams: state.router.location.search,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ ...Actions }, dispatch);

export const ViewModeHandler = connect(
	mapStateToProps,
	mapDispatchToProps,
)(ViewModeHandlerComponent);
