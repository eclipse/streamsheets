/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';

export const ViewModePropTypes = PropTypes.shape({
	view: PropTypes.string,
	hidegrid: PropTypes.string,
	viewMode: PropTypes.string,
	hideheader: PropTypes.string,
	zoomdisabled: PropTypes.string
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
			hideheader: params.get('hideheader'),
			zoomdisabled: params.get('zoomdisabled')
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
