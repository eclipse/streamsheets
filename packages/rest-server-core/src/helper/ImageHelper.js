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

const fs = require('fs-extra');

module.exports = class ImageHelper {
	static async saveImage(
		{
			content,
			targetPath,
			imagePath
		}
	) {
		await fs.mkdirs(targetPath);
		const base64Data = content.replace(/^data:image\/png;base64,/, '');
		await fs.writeFile(imagePath, base64Data, 'base64');
	}
};
