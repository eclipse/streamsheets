const request = require('request');
const ERROR = require('./errors');
const logger = require('../logger').create({ name: 'ImageHelper' });


const saveImage = ({ name, content, path }) => {
	// eslint-disable-next-line
	const url = `${process.env.IMAGE_SERVER_URL}/images/${path}`;
	request(
		{
			url,
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: {
				name,
				content
			},
			json: true
		},
		(error /* , response, body */) => {
			logger.error('Error', error);
		}
	);
	return `${url}/${name}`;
};


const savedrawing = (sheet, ...terms) => {
	let error = (!sheet || terms.length < 5) ? ERROR.ARGS : undefined;
	let url = null;
	const drawings = sheet.getDrawings && sheet.getDrawings();
	if (!error && sheet.isProcessing) {
		const name = String(terms[0].value);
		if (drawings.hasDrawing(name)) {
			const drawing = drawings.getDrawing(name);
			if (drawing) {
				const fileName = String(terms[1].value);
				const path = String(terms[2].value);
				const content = '';
				url = saveImage({
					name: fileName,
					content,
					path
				});
			}
		} else {
			error = ERROR.INVALID_PARAM;
		}
	}
	if (error) {
		return error;
	}
	return url;
};

module.exports = savedrawing;
