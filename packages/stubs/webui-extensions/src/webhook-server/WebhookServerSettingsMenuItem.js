import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HttpIcon from '@material-ui/icons/Http';
import { setAppState } from '@cedalo/webui/src/actions/actions';

export default connect(null, {
	setOpen: (open) => setAppState({ showWebhookServerSettingsDialog: open })
})((props) => {
	return (
		<MenuItem dense onClick={() => props.setOpen(true)}>
			<ListItemIcon>
				<HttpIcon fontSize="default" />
			</ListItemIcon>
			<ListItemText
				primary={<FormattedMessage id="Extensions.WebhookServer.Tooltip" defaultMessage="Webhook Server" />}
			/>
		</MenuItem>
	);
});
