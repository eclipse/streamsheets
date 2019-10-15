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
