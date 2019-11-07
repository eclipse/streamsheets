// import { appStrings } from './i18n';
import JSG from '@cedalo/jsg-ui';
import { help } from '@cedalo/functions';
import store from '../store';

const { CellEditor } = JSG;

const Strings = {};
const Categories = {
	all: {
		en: 'All',
		de: 'Alle',
	}
};

// setup help:
Object.entries(help).forEach(([catName, category]) => {
	const { en, de, functions } = category;
	Categories[catName] = { en, de };
	Object.entries(functions).forEach(([key, fn]) => {
		Strings[key] = { category: catName, ...fn };
	});
});


export default class FunctionStrings {
	enumerateFunctions(category, callback) {
		const items = Object.keys(Strings);
		const { locale } = store.getState().locales; // appStrings.getLanguage();

		items.forEach((item) => {
			const data = Strings[item];
			if (category === 'all' || data.category === category) {
				callback.call(
					this,
					item,
					data.category,
					data[locale].argumentList,
					data[locale].description,
					data.experimental,
				);
			}
		});
	}

	enumerateCategories(callback) {
		const items = Object.keys(Categories);
		const { locale } = store.getState().locales; // appStrings.getLanguage();

		items.sort((a, b) => {
			const dataA = Categories[a];
			const dataB = Categories[b];
			const textA = dataA[locale].toUpperCase();
			const textB = dataB[locale].toUpperCase();
			if (textA < textB) {
				return -1;
			}
			return textA > textB ? 1 : 0;
		});

		items.forEach((item) => {
			const data = Categories[item];
			callback.call(this, item, data[locale]);
		});
	}

	getStrings() {
		return Strings;
	}
}

export const functionStrings = new FunctionStrings();

CellEditor.setFunctionInfo(functionStrings);
