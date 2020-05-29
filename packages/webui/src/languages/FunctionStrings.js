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
// import { appStrings } from './i18n';
import JSG from '@cedalo/jsg-ui';
import help from '@cedalo/functions/help';
import store from '../store';

const { CellEditor } = JSG;

// setup help:
const reduceCategories = (categories, [name, category]) => {
	if (category) {
		const { en, de } = category;
		categories[name] = { en, de };
	}
	return categories;
};
const reduceFunctions = (fns, [catName, category = {}]) => {
	const { functions = {} } = category;
	Object.entries(functions).forEach(([key, fn]) => {
		fns[key] = { category: catName, ...fn };
	});
	return fns;
};
const create = (reduceFn) => (fnsHelp, base = {}) => Object.entries(fnsHelp).reduce(reduceFn, base);
const createStrings = create(reduceFunctions);
const createCategories = create(reduceCategories);

const Strings = createStrings(help);
const Categories = createCategories(help, { all: { en: 'All', de: 'Alle' } });

export default class FunctionStrings {
	addFunctionsHelp(fnsHelp = {}) {
		createStrings(fnsHelp, Strings);
		createCategories(fnsHelp, Categories);
	}

	enumerateFunctions(category, callback) {
		const items = Object.keys(Strings).sort();
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
		const items = Object.keys(Categories).sort();
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
