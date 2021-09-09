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
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import TourIcon from '@material-ui/icons/Slideshow';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { setAppState } from '../actions/actions';

export default function TourButton(props) {

	const handleStartTour = () => {
		setAppState({
			tour: props.context
		})
	}

	return (
		<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.StartTour" defaultMessage="Start Tour" />}>
			<div>
				<IconButton onClick={handleStartTour}>
					<TourIcon style={{ color: 'white' }} />
				</IconButton>
			</div>
		</Tooltip>
	);
}
