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
const ImageRoute = require('./routes/ImageRoute');
const { Router } = require('express');

module.exports = class ImageRouter extends Router {
	constructor(opts = ImageRouter.defaultOptions()) {
		super(opts);
		this.all(
			'/*',
			bodyParser.json({ 'inflate': true, 'strict': true, limit: '5mb' }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			ImageRoute.handleMessage
		  );
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
