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
/* eslint-disable */

import React from 'react';
export default class Secret extends React.Component {
	render() {
		localStorage.setItem('jwtToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJtYWNoaW5lc2VydmVyIiwiaWF0IjoxNTEwODYwODQwLCJleHAiOjE1NDIzOTY4NDB9.jtfbgAntb1bXG6-VLRu43erj7PISyYLMLwvHQ-p1qd4');
		return <p>Secret stored</p>;
	}
}
