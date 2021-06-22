import * as Actions from '@cedalo/webui/src/actions/actions';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { WebhookServerSettingsDialog } from './webhook-server/WebhookServerSettingsDialog';

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export const DialogExtensions = connect(
	(state) => ({
		appState: state.appState
	}),
	mapDispatchToProps
)(({ appState }) => {
	return (
		<React.Fragment>
			{appState.showWebhookServerSettingsDialog ? (
				<WebhookServerSettingsDialog open={appState.showWebhookServerSettingsDialog} />
			) : null}
		</React.Fragment>
	);
});
