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
const decodeCert = (cert) => {
	let certText = null;
	if (cert && cert.value) {
		certText = cert.value;
	}
	if (certText && certText.length > 0) {
		return certText.replace(/(\r\n|\n|\\n|\r)/gm, '\n');
	}
	throw new Error('empty certificate');
};

module.exports = { decodeCert };
