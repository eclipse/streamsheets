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
import React, {Component} from 'react';
import PropTypes from 'prop-types';

export class ChartExtensions extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static propTypes = {
		// eslint-disable-next-line react/no-unused-prop-types
		onCreatePlot: PropTypes.func.isRequired,
	};

	render() {
		return <div />;
	}
};
