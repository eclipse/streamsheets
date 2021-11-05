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
		STACKADD: {
			default: {
				category: 'Stack',
				description: 'This function adds the cells in a SourceRange to a StackRange.The Stack range is a range of cells on the `sheet <Streamsheet>`, which will be filled by using STACKADD. If the range is filled with cells, the existing cells will be moved defined by the direction parameter and the new cells will be added to the list. Values added to the StackRange have to use identical headers in both the Stack- and SourceRange. The STACKADD function automatically indexes the added items in the correct columns.',
				inlineDescription: 'This function adds a row to the stack at the defined direction and copies the removed cells to the target range',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Range, where the source range items are added to. The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'SourceRange',
						description: 'Range, where the source data is taken from and copied into the StackRange.The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'Direction',
						description: 'If you set Direction to TRUE the new data is added behind the last empty row on the SourceRange.<br />If the StackRange is full, the first row (after the columns row) is dropped from the stack and all rows move up to make room for the new data in the last row. Analog, if Direction is set to FALSE rows are added at top of the stack and dropped from the bottom. By default Direction is TRUE.',
						optional: true
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'If TargetRange is specified and if a row has to be dropped, the row is copied to the TargetRange.<br />TargetRange must have two rows, the first row has labels also found in Stackrange (not necessarily all and maybe not in the same order!). The dropped values are copied to the matching columns in the TargetRange.<br />If no row is dropped, the values in the second row of TargetRange are blanked out.<br /><strong>Important:</strong> Before copying to the TargetRange all existing values in TargetRange are deleted (not the labels row!)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise [error](../../other#error-codes)  value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKADD(<span class="blue">A5:D9</span>,<span class="red">A2:D3</span>,TRUE) <br /> <img src={require("../../_images/STACKADD1.png").default} width="80%"/>',
							result: 'After calling STACKADD the first time:  <br />  <img src={require("../../_images/STACKADD2.png").default} width="80%"/>'
						}
					]
				}
			}
		},
		STACKDROP: {
			default: {
				category: 'Stack',
				description: 'This function removes one row from the Stack. All rows below move one row up.',
				inlineDescription: 'This function removes one row from the Stack. All rows below move one row up.',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Range, where the source range items are added to. The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'Position',
						description: 'Position defines, which row is dropped.<br />If Position = -1 all rows (except the title row) are dropped.<br />If Position = 0 the last used row is dropped.<br /> If Position = 1 the first row (after the title row) is dropped.<br />Any value between 2 and N (last row) can also be specified. Pos defaults to 1.',
						optional: true
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'If TargetRange is specified and if a row has to be dropped, the row is copied to the TargetRange. TargetRange must have two rows, the first row has labels also found in Stackrange (not necessarily all and maybe not in the same order!). The dropped values are copied to the matching columns in the TargetRange. If no row is dropped, the values in the second row of TargetRange are blanked out. **Important:** Before copying to the TargetRange all existing values in TargetRange are deleted (not the labels row!)',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKDROP(A2:D3, 1) <br /> <img src={require("../../_images/STACKDROP1.png").default} width="90%"/>',
							result: 'After calling STACKDROP  <br /> <img src={require("../../_images/STACKDROP2.png").default} width="90%"/>'
						}
					]
				}
			}
		},
		STACKFIND: {
			default: {
				category: 'Stack',
				description: 'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange. Optionally it deletes all found records after the extract operation (remaining rows all move up!)',
				inlineDescription: 'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange.',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Range, where the source range items are added to. The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'The CriteriaRange has at least 2 rows, the first one is the labels row with labels also found in StackRange (not necessarily all and maybe not in the same order!), the second to nth row contain filter settings. Note: criteria values can start with a comparison-operator like, `>, >=, <, <=, =` or `<>` Settings in the same row are combined using AND, multiple rows are OR.',
						optional: false
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'If specified, TargetRange must have two rows minimum, the first row has labels also found in StackRange (not necessarily all and maybe not in the same order!). The result of the filter is copied to the matching columns in the TargetRange. Note: TargetRange can have more than 2 rows. If it has more than 2 rows the additional rows can take the additional hits of the filter extract.',
						optional: true
					},
					{
						type: '',
						name: 'Drop',
						description: 'If set to TRUE it drops the selected rows from the stack. Drop defaults to FALSE.',
						optional: true
					},
					{
						type: '',
						name: 'Unique',
						description: 'If set to TRUE it drops or copies equal rows only once. Two rows are equal if they have same value in each column. Unique defaults to FALSE.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if at least one matching value was found, otherwise FALSE. In case of an error the corresponding [error](../../other#error-codes) value is returned.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKFIND(A5:D9,A2:D3,A11:B13) <br />  <img src={require("../../_images/STACKFIND1.png").default} alt="select" />',
							result: 'After calling STACKFIND  <br />   <img src={require("../../_images/STACKFIND2.png").default} alt="select" />'
						}
					]
				}
			}
		},
		STACKROTATE: {
			default: {
				category: 'Stack',
				description: 'This function rotates the complete stack by Pos positions up or down.',
				inlineDescription: 'This function rotates the complete stack by Position positions up or down.',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Range, where the source range items are added to. The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'Position',
						description: 'Position defines, which row is dropped.<br />If Position = -1 all rows (except the title row) are dropped.<br />If Position = 0 the last used row is dropped.<br /> If Position = 1 the first row (after the title row) is dropped.<br />Any value between 2 and N (last row) can also be specified. Pos defaults to 1.',
						optional: true
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'If TargetRange is specified and if a row has to be dropped, the row is copied to the TargetRange. TargetRange must have two rows, the first row has labels also found in Stackrange (not necessarily all and maybe not in the same order!). The dropped values are copied to the matching columns in the TargetRange. If no row is dropped, the values in the second row of TargetRange are blanked out. **Important:** Before copying to the TargetRange all existing values in TargetRange are deleted (not the labels row!)',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKROTATE(A2:D6, 1) <br /> <img src={require("../../_images/STACKROTATE1.png").default} width="80%"/>',
							result: 'After calling STACKROTATE  <br /> <img src={require("../../_images/STACKROTATE2.png").default} width="80%"/>'
						}
					]
				}
			}
		},
		STACKSORT: {
			default: {
				category: 'Stack',
				description: 'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange. Optionally it deletes all found records after the extract operation (remaining rows all move up!)',
				inlineDescription: 'This function sorts the Stack according to the Settings in the SortSettingsRange.',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Range, where the source range items are added to. The first row of the StackRange is a title range and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'SortSettingsRange',
						description: 'The SortSettingsRange has two rows. In the first row you have all or part of the labels of the StackRange (may be in another order). The cells in the second row either contain TRUE or FALSE. TRUE is ascending, FALSE is descending. If you have more than two rows in the SortSettingsRange then it is first sorted after the field name in the second row, then after the field name in the third row, etc.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKSORT(A5:D9,A2:D3) <br /> <img src={require("../../_images/STACKSORT1.png").default} width="90%"/>',
							result: 'After calling STACKDROP  <br /> <img src={require("../../_images/STACKSORT2.png").default} width="90%"/>'
						}
					]
				}
			}
		},
		STACKUPSERT: {
			default: {
				category: 'Stack',
				description: 'The STACKUPSERT function is like a combination of STACKADD and STACKFIND, i.e. it can add and update matching cell values from a given SourceRange. Like STACKADD cell values are copied from SourceRange to a specified StackRange if they are not already contained, otherwise they are updated. Analog to STACKFIND, a CriteriaRange is used to determine the cell values to copy or update. Updating is done either by replacing the cell value or by using a simple text based arithmetic rule, like "+1" or by specifying an arbitrary formula.',
				inlineDescription: 'This function adds and updates rows in StackRange depending on specified Source- and CriteriaRange.',
				arguments: [
					{
						type: '',
						name: 'StackRange',
						description: 'Cell range, to copy SourceRange cells to or to update matching cells. The first row of the StackRange always contains the cell labels and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'SourceRange',
						description: 'Cell range, where the source data or update rules are taken from. Analog to StackRange the first row contains the cell labels and remains unchanged.',
						optional: false
					},
					{
						type: '',
						name: 'CriteriaRange',
						description: 'The CriteriaRange has at least 2 rows, the first one is the labels row with labels also found in StackRange and SourceRange (not necessarily all and maybe not in the same order!), the second to nth row contain filter settings. Note: criteria values can start with a comparison-operator like, `>, >=, <, <=, = or <>`. Settings in the same row are combined using AND, multiple rows are OR.',
						optional: false
					},
					{
						type: '',
						name: 'AddIfNotFound',
						description: 'If a matching source row is not found in StackRange it will be added. Specify FALSE to prevent this behaviour. Defaults to TRUE.',
						optional: true
					},
					{
						type: '',
						name: 'Direction',
						description: 'If you set Direction to TRUE the new data is added behind the last empty row on the StackRange. If the StackRange is full, the first row (after the columns row) is dropped from the stack and all rows move up to make room for the new data in the last row. Analog, if Direction is set to FALSE rows are added at top of the stack and dropped from the bottom. By default Direction is TRUE.',
						optional: true
					},
					{
						type: '',
						name: 'Unique',
						description: 'If set to TRUE equal rows are updated or added only once to StackRange. Two rows are equal if they have same value in each column. Unique defaults to FALSE.',
						optional: true
					},
					{
						type: '',
						name: 'TargetRange',
						description: 'If TargetRange is specified and if a row has to be dropped, the row is copied to the TargetRange. TargetRange must have two rows, the first row has labels also found in StackRange (not necessarily all and maybe not in the same order!). The dropped values are copied to the matching columns in the TargetRange. If no row is dropped, the values in the second row of TargetRange are blanked out. Important: Before copying to the TargetRange all existing values in TargetRange are deleted (not the labels row!)',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no error occurred, otherwise an [error](../../other#error-codes) value.'
				},
				examples: {
					infoStart: '\n| | A | B | C | D | E |\n|---|---|---|---|---|---|\n|4|ItemNumber|Quantity|Price|VAT|Total|\n|5|1234|+1|=23|0.19|=B5 \\* C5 \\* (1 + D5)|\n ',
					infoEnd: '',
					formulas: [
						{
							formula: '=STACKUPSERT(A1:E3,A5:E5,A4:A5)',
							result: 'After calling STACKUPSERT the first time the row in A1 will contains following values: 1234, 1, 23, 0.19, 27.37 i.e. Quantity is initialized with 1  and Price with 23 and the Total value is 27.37 which was calculated by specified formula.'
						},
						{
							formula: '=STACKUPSERT(A1:E3,A5:E5,A4:A5)',
							result: 'Calling STACKUPSERT again will update the row in A1 to following values: 1234, 2, 23, 0.19, 54.74 i.e. +1 is used to update Quantity. The Price remains unchanged since it already exists. And again the Total value is calculated by a formula and results to 54.74.'
						}
					]
				}
			}
		}
	},
};
