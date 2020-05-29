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
const WebpageRoute = require('./routes/WebpageRoute');
const { Router } = require('express');

module.exports = class WebpageRouter extends Router {
	constructor(opts = WebpageRouter.defaultOptions()) {
		super(opts);
		this.all(
			'/*',
			bodyParser.json({ 'inflate': true, 'strict': true }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			WebpageRoute.handleMessage
		  );
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
