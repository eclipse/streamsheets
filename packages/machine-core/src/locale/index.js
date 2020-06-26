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
const convert = require('./convert');
const locales = require('./locales');
const nrFormatter = require('./numberformatter');
const { isType } = require('../utils');

// if passed only string value
// currently we support only locale code, e.g. { locale: 'de' }, but later we might add timezone etc.
// we support overriding separator characters: pass them in options e.g. { separator: { thousand: '' } } to remove
// thousand separator character...
const use = (opts) => {
	const code = isType.string(opts) ? opts : opts.locale;
	const locale = locales[code];
	const separators = Object.assign({}, locale.separators, opts.separators);
	locale.formatNr = nr => nrFormatter.format(nr, separators);
	return locale;
};

const get = (locale) => locales[locale];
const isSupported = locale => locales[locale] != null;

module.exports = {
	convert,
	get,
	isSupported,
	use
};
