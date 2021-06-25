import Divider from '@material-ui/core/Divider';
import React from 'react';
import WebhookServerSettingsMenuItem from '../webhook-server/WebhookServerSettingsMenuItem';

function StreamSection({ isMachineDetailPage }) {
	return isMachineDetailPage ? (
		<React.Fragment>
			<Divider />
			<WebhookServerSettingsMenuItem />
		</React.Fragment>
	) : null;
}

export default StreamSection;
