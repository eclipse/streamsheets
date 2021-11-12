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
// const reduceCategories = (categories, [name, category]) => {
// 	if (name && category) {
// 		const { functions, ...locales } = category;
// 		if (categories[name] == null) categories[name] = { en: name, de: name };
// 		Object.assign(categories[name], { ...locales });
// 	}
// 	return categories;
// };
const reduceFunctions = (fns, category = {}) => {
	const { functions = {} } = category;
	Object.entries(functions).forEach(([key, fn]) => {
		fns[key] = { ...fn };
	});
	return fns;
};
const create = (reduceFn) => (fnsHelp, base = {}) => Object.values(fnsHelp).reduce(reduceFn, base);
const createStrings = create(reduceFunctions);
// const createCategories = create(reduceCategories);

const Strings = createStrings(help);
// const Categories = createCategories(help, { all: { en: 'All', de: 'Alle' } });

export default class FunctionStrings {
	addFunctionsHelp(fnsHelp = {}) {
		createStrings(fnsHelp, Strings);
		// createCategories(fnsHelp, Categories);
	}

	getArrayDescriptor(args, argsLocal, index, key) {
		const desc =  argsLocal && argsLocal[index] && argsLocal[index][key] ?
			argsLocal[index][key] :
			args[index][key];

		return desc || '';
	};

	getDescriptor(data, locale, name) {
		return data[locale] && data[locale][name] ?
			data[locale][name] :
			data.default[name];
	}

	getParameters(name, data, language) {
		let result = '';

		const paramsLocal = data[language] ? data[language].arguments : undefined;
		const params = data.default.arguments;
		const sep = JSG.getParserLocaleSettings().separators.parameter;

		if (params) {
			params.forEach((arg, index) => {
				const param = this.getArrayDescriptor(params, paramsLocal, index, 'name');
				if (param) {
					result += param;
					if (index < params.length - 1) {
						result += sep;
					}
				}
			});
		}

		return result;
	}

	enumerateFunctions(category, callback) {
		const items = Object.keys(Strings).sort();
		const { locale } = store.getState().locales;

		items.forEach((item) => {
			const data = Strings[item];
			if (!data.default) {
				return;
			}
			const cat = this.getDescriptor(data, locale, 'category');
			const cats = cat.split(',');
			let add = category === 'All';
			if (!add) {
				add = cats.some(categ => categ === category);
			}
			if (add) {
				callback.call(
					this,
					item,
					cats[0],
					this.getParameters(item, data, locale),
					this.getDescriptor(data, locale, 'inlineDescriptor'),
					false, // data.experimental
				);
			}
		});
	}

	enumerateCategories(callback) {
		const items = Object.keys(Strings);
		const { locale } = store.getState().locales;
		const categories = ['All'];

		items.forEach((item) => {
			const data = Strings[item];
			if (!data.default) {
				return;
			}
			const cat = this.getDescriptor(data, locale, 'category');
			if (cat) {
				const cats = cat.split(',');
				cats.forEach(category => {
					// split
					if (categories.indexOf(category) === -1) {
						categories.push(category);
					}
				});
			}
		});

		categories.sort();

		categories.forEach((item) => {
			callback.call(this, item, item);
		});

	}

	getStrings() {
		return Strings;
	}
}

export const functionStrings = new FunctionStrings();

CellEditor.setFunctionInfo(functionStrings);
