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
'use strict';

const bodyParser = require('body-parser');
const MessageRoute = require('./routes/MessageRoute');
const { Router } = require('express');

module.exports = class APIRouter extends Router {
	constructor(opts = APIRouter.defaultOptions()) {
		super(opts);
		this.all(
			['/*', '/v1.0/*'],
			bodyParser.json({ inflate: true, strict: true }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			MessageRoute.handleMessage
		);
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
