import { lazy } from 'react';

export const readDroppedFile = (file /* , readAs */) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('load', () => /* ev */ resolve(reader.result), false);
		reader.addEventListener('error', () => /* ev */ reject(reader.error), false);
		// base64 encoded:
		reader.readAsDataURL(file);
		// or use alternative => maybe specify by readAs param...
		// reader.readAsArrayBuffer(file);
		// reader.readAsText(file);
		// reader.readAsBinaryString(file);
	});

// lazy => must be wrapped inside React.Suspense!!
export const lazyLoadDropHandler = (type) =>
	lazy(() => {
		import(`./handlers/${type}`).catch(() => undefined);
	});
