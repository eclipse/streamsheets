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
		'MONGO.AGGREGATE': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Gets aggregated data from your Mongo database. You can use the Function Wizard to create this function. Operators for the query aggregations can be found [here](https://docs.mongodb.com/manual/reference/operator/).',
				inlineDescription: 'Execute the Aggregation Pipeline defined by AggregateJSON',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for aggregating. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Choose an existing collection, where the items are stored.',
						optional: false
					},
					{
						type: '',
						name: 'Aggregate JSON',
						description: 'Define an aggregation using a JSON cell range.',
						optional: false
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: false
					},
					{
						type: '',
						name: 'Result Keys',
						description: 'Filter the result.',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Define Timeout.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '\n\n<img src={require("../../_images/MongoAggregate.png").default} width="90%"/>\n\n',
					infoEnd: '  ',
					formulas: [
						{
							formula: '=MONGO.AGGREGATE(&#124;MongoProd,B66, JSON(E67:F76),A73:C78)',
							result: 'In A73:C78',
							comment: 'Divides the result in two groups, which calculate the total sales above 1500 Euro.'
						}
					]
				}
			}
		},
		'MONGO.COUNT': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Counts the amount of elements in a Mongo database. You can use the Function Wizard for this function.',
				inlineDescription: 'Count matching objects from MongoDB',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for counting. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Choose an existing collection, where the item is stored.',
						optional: false
					},
					{
						type: '',
						name: 'Query',
						description: 'Define a query using a JSON cell range, which defines the object(s) to be counted.',
						optional: false
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: false
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Define Timeout.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '\n\n<img src={require("../../_images/MongoCount2.png").default} width="40%"/>\n\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONGO.COUNT(&#124;MongoProd ,A23,JSON(G26:H26),G28:G29)',
							result: 'TRUE',
							comment: 'Counts all males in a collection'
						}
					]
				}
			}
		},
		'MONGO.DELETE': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Stores data on a Mongo database. You can use the Function Wizard for this function.',
				inlineDescription: 'Deletes matching objects from MongoDB',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for deleting. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Choose an existing collection, where the item is stored.',
						optional: false
					},
					{
						type: '',
						name: 'QueryJSON',
						description: 'Define a query using a JSON cell range, which defines the object(s) to be deleted.',
						optional: false
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: false
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Define Timeout.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONGO.DELETE(&#124;Producer, "TestCollection", JSON(A1:B4))',
							result: 'TRUE',
							comment: 'This deletes all documents in the database with the values from A1:B4 using the "Producer" in the collection "TestCollection".'
						}
					]
				}
			}
		},
		'MONGO.QUERY': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Gets data from your Mongo database. You can use the Function Wizard for this function.',
				inlineDescription: 'Finds objects in MongoDB that math QueryJSON. REQUESTINFO can be used to check the status of the query',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for deleting. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Choose an existing collection, where the item is stored.',
						optional: false
					},
					{
						type: '',
						name: 'QueryJSON',
						description: 'Define a query using a JSON cell range, which defines the object(s) to searched for.',
						optional: false
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: false
					},
					{
						type: '',
						name: 'ResultKeys',
						description: 'Filter the query result.',
						optional: true
					},
					{
						type: '',
						name: 'PageSize',
						description: 'Number of Documents to return per page.',
						optional: true
					},
					{
						type: '',
						name: 'Page',
						description: 'Index of page to return.',
						optional: true
					},
					{
						type: '',
						name: 'Sort',
						description: 'Sort query result ascending or descending. Use 1 and -1 to sort by creation time, or use a JSON cell range.',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Define Timeout.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '\n\n<img src={require("../../_images/MongoQuery2.png").default} width="100%"/>\n\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONGO.QUERY(&#124;MongoProd, H13,JSON(F16:G16),F18:N21)',
							result: 'TRUE',
							comment: 'All documents in the database with the "Gender" male in the collection "TestCollection" will be shown in the range F18:N21 of the current Streamsheet. Use INBOX() as a "Target" to prevent space issues.'
						}
					]
				}
			}
		},
		'MONGO.REPLACE': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Replaces elements in a Mongo database. You can use the Function Wizard for this function. Only replaces one entry at a time.',
				inlineDescription: 'Replace a JSON object matching the query in MongoDB',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for counting. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Choose an existing collection, where the item is stored.',
						optional: false
					},
					{
						type: '',
						name: 'Query',
						description: 'Define a query using a JSON cell range, which defines the document to be replaced.',
						optional: false
					},
					{
						type: '',
						name: 'Document',
						description: 'Defines the key-value pair(s) to be replacing the old entry.',
						optional: false
					},
					{
						type: '',
						name: 'Upsert',
						description: 'Optional Parameter to define, if a new document will be created when the query can not find a document to be replaced. Default = FALSE',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONGO.REPLACE(&#124;Producer, "TestCollection", JSON(A1:B4), JSON(C1:D4))',
							result: 'TRUE',
							comment: 'The Query looks for a document in the collection which matches the A1:B4 key-value pairs. The found document will be deleted and the new document takes its place. If nothing is found to be replaced, no action will occur.'
						}
					]
				}
			}
		},
		'MONGO.STORE': {
			default: {
				category: 'Databases,Timeseries,Streams',
				description: 'Stores data on a Mongo database. You can use the Function Wizard for this function.',
				inlineDescription: 'Stores a JSON object in MongoDB',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for storing. The database name is configured in the affiliated Connector.',
						optional: false
					},
					{
						type: '',
						name: 'Collection',
						description: 'Use an existing collection or type in any new collection name you need.',
						optional: false
					},
					{
						type: '',
						name: 'Document',
						description: 'Define the payload of your document by using a JSON cell range.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: '\n\n<img src={require("../../_images/MongoStore2.png").default} width="40%"/>\n\n',
					infoEnd: '',
					formulas: [
						{
							formula: '=MONGO.STORE(&#124;MongoProd, H13,JSON(H6:I11))',
							result: 'TRUE',
							comment: 'This stores the values in H6:I11 in the collection in H13'
						}
					]
				}
			}
		},
	},
};
