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

// const postcss = require('postcss');
const css = require('css');
const esprima = require('esprima');
const xml2js = require('xml2js');
const csv = require('csv-parse');
const yaml = require('js-yaml');
const Markdown = require('markdown-it');
const mime = require('mime-types');

const parseCSS = async (input) => {
	// return postcss.parse(input);
	return css.parse(input);
};

const parseJavaScript = async (input) => {
	return esprima.parse(input);
};

const parseXML = (input) => {
	return new Promise((resolve, reject) => {
		xml2js.parseString(input, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
};

// const parseJSON = async (input) => {
// 	return JSON.parse(input);
// };

const parseCSV = (input) => {
	return new Promise((resolve, reject) => {
		csv(input, (error, output) => {
			if (error) {
				reject(error);
			} else {
				resolve(output);
			}
		});
	});
};

const parseYAML = (input) => {
	return new Promise((resolve, reject) => {
		const result = yaml.safeLoad(input);
		resolve(result);
	});
}

const md = new Markdown();
const parseMarkdown = (input) => {
	return new Promise((resolve, reject) => {
		const result = md.parse(input);
		resolve(result);
	});
}
const parserMap = new Map();
parserMap.set('js', parseJavaScript);
parserMap.set('xml', parseXML);
parserMap.set('svg', parseXML);
// parserMap.set('json', parseJSON);
parserMap.set('css', parseCSS);
parserMap.set('csv', parseCSV);
parserMap.set('yaml', parseYAML);
parserMap.set('markdown', parseMarkdown);

const parse = async (content, mimeType) => {
	const extension = mime.extension(mimeType);
	const result = {
		extension,
		mimeType
	};
	const parserFunction = parserMap.get(extension);
	if (parserFunction) {
		try {
			result.parsed = await parserFunction(content);
		} catch (error) {
			result.parsed = error;
		}
	}
	return result;
};

module.exports = {
	parse,
	parseCSS,
	parseCSV,
	parseJavaScript,
	parseMarkdown,
	parseXML,
	parseYAML
};
