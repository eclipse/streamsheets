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
const fs = require('fs-extra');
const path = require('path');

const TARGET_JSG = path.join(__dirname, '..', 'public', 'jsg');
// const TARGET_ARAC = path.join(__dirname, '..', 'public', 'arac');
// use gulpfile since its definitely there
const pathLocation = require.resolve(path.join('jsg', 'gulpfile'));
// const pathLocationArac = require.resolve(path.join('jsg-arac', 'gulpfile'));

const SOURCE = path.join(pathLocation, '..', 'dist');
// const SOURCE_ARAC = path.join(pathLocationArac, '..', 'dist');

fs.copy(SOURCE, TARGET_JSG, (error) => {
	console.log('Installing latest version of JSG');
	console.log(`Copy from ${SOURCE}`);
	console.log(`Copy to ${TARGET_JSG}`);
	if (error) {
		console.error(error);
		process.exit(1);
	}
	console.log('Installed JSG');
	/*fs.copy(SOURCE_ARAC, TARGET_ARAC, (errorArac) => {
		console.log('Installing latest version of JSG-Arac');
		console.log(`Copy from ${SOURCE_ARAC}`);
		console.log(`Copy to ${TARGET_ARAC}`);
		if (errorArac) {
			console.error(errorArac);
			process.exit(1);
		}
		console.log('Installed JSG-Arac');
	});*/
});
