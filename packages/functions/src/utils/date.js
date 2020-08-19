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
const TZ_OFFSET_IN_MS = new Date().getTimezoneOffset() * 60000;

const localNow = () => Date.now() - TZ_OFFSET_IN_MS;

module.exports = {
	localNow
};
