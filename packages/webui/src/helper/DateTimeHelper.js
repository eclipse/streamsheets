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
import moment from 'moment';

export default class DateTimeHelper {
	static getCurrentTime() {
		return moment().format('h:mm A');
	}

	static formatTimestamp(timestamp) {
		return moment(timestamp).format('hh:mm:ss');
	}
}
