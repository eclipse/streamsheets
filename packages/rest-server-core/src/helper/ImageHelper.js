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
