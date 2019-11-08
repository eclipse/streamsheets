// import { appStrings } from './i18n';
import JSG from '@cedalo/jsg-ui';
import { help } from '@cedalo/functions';
import store from '../store';

const { CellEditor } = JSG;

// setup help:
const alphabetical = (a,b) => a[0].localeCompare(b[0]);
const createCategories = (categories, [name, category]) => {
	const { en, de } = category;
	categories[name] = { en, de };
	return categories;
};
const createFunctions = (fns, [catName, category]) => {
	const { functions } = category;
	Object.entries(functions).forEach(([key, fn]) => {
		fns[key] = { category: catName, ...fn };
	});
	return fns;
};
const createStrings = (strings, [name, fn]) => {
	strings[name] = fn;
	return strings;
};
const Categories = Object.entries(help)
	.sort(alphabetical)
	.reduce(createCategories, { all: { en: 'All', de: 'Alle' } });
const Strings = Object.entries(Object.entries(help).reduce(createFunctions, {}))
	.sort(alphabetical)
	.reduce(createStrings, {});


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
