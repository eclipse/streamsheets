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
		SHOWDIALOG: {
			default: {
				category: 'Events',
				description: 'It is possible to export data to the App Files of an App (e.g. TIMESCALE.EXPORT()). Usually it is possible to access the App Files over the left side menu. This menu is not accessible, if you only want to allow your user to be able to access a build App via the "preview" or "share App" mode. The SHOWDIALOG() function allows opening the App Files via event on a shape or object.',
				inlineDescription: 'Open the App Files via event on a shape or object.',
				arguments: [
					{
						type: '',
						name: 'No parameter',
						description: 'There are no parameter inputs necessary',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'DRAW.BUTTON("100285020360",,"Button1",22066,9182,7250,5794,,,,EVENTS(ONCLICK(SHOWDIALOG())))),,,"Button",,FALSE)',
							comment: 'If the user clicks on the button the App Files dialog will open.'
						}
					]
				}
			}
		},
		SHOWVALUES: {
			default: {
				category: 'Events',
				description: 'To display values from a query in a boxed table use the SHOWVALUES() function in an event. Select the source and the size of your table, a event should trigger. The table can be scrolled through and closed again.',
				inlineDescription: 'To display values from a query in a boxed table.',
				arguments: [
					{
						type: '',
						name: 'Datasource',
						description: 'A cell with a query (e.g. TIMESCALE.SELECT(), TIMEAGGREGATE())',
						optional: false
					},
					{
						type: '',
						name: 'Targetrange',
						description: 'A range to display the data over.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: 'DRAW.BUTTON("100285020360",,"Button1",22066,9182,7250,5794,,,,EVENTS(ONCLICK(SHOWVALUES(C6,K2:N7))),,,"Button",,FALSE)',
							comment: 'If the user clicks on the button, queried data from C6 will be shown in a table covering K2:N7.'
						}
					]
				}
			}
		}
	},
};
