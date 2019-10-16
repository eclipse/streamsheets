import en from './en.json';
import de from './de.json';

const defLocale = () => {
	let lang = window.navigator.userLanguage || window.navigator.language;
	if (lang.indexOf('-') !== -1) {
		// eslint-disable-next-line prefer-destructuring
		lang = lang.split('-')[0];
	}
	if (lang.indexOf('_') !== -1) {
		// eslint-disable-next-line prefer-destructuring
		lang = lang.split('_')[0];
	}
	return lang;
};

export const DEFAULT_LOCALE = defLocale() || 'en';

export const messages = {
	de,
	en,
};
