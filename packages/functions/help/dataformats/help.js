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
module.exports = {
	functions: {
		'PARSE.CSV': {
			default: {
				category: 'Dataformats',
				description: 'Parses a string to CSV',
				inlineDescription: 'Parses a string to CSV',
				arguments: [{
					type: '',
					name: 'String',
					description: 'The string containing the CSV to parse.',
					optional: false
				}],
				return: {
					type: '',
					description: 'The parsed CSV object model.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [{
						formula: '',
						result: '',
						comment: ''
					}]
				}
			}
		},
		'PARSE.XML': {
			default: {
				category: 'Dataformats',
				description: 'Parses a string to XML',
				inlineDescription: 'Parses a string to XML',
				arguments: [{
					type: '',
					name: 'String',
					description: 'The string containing the XML to parse.',
					optional: false
				}],
				return: {
					type: '',
					description: 'The parsed XML tree.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [{
						formula: '',
						result: '',
						comment: ''
					}]
				}
			}
		},
	},
};
