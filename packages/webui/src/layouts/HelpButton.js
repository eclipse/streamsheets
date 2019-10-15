import { IconButton, Tooltip } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import React from 'react';
import { FormattedMessage } from 'react-intl';

export default function HelpButton() {
	const onHelp = () => {
		window.open('https://docs.cedalo.com', '_blank');
	};
	return (
		<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.Help" defaultMessage="Help" />}>
			<div>
				<IconButton onClick={onHelp}>
					<HelpIcon style={{ color: 'white' }} />
				</IconButton>
			</div>
		</Tooltip>
	);
}
