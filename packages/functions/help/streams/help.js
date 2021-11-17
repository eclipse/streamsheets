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
		'FILE.WRITE': {
			default: {
				category: 'Streams',
				description: 'Write a given range as comma separated values to a file. You can use the Function Wizard for this function. The mounted root path is set in the .YML file. E.g.: `C:rootfolder:/filefeeder`. Add /filefeeder to the "Root Directory" field in the Connector to connect it to the root folder.',
				inlineDescription: 'Write a given range as comma separated values to a file.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'File Producer to use for writing the file.',
						optional: false
					},
					{
						type: '',
						name: 'Range',
						description: 'The range to write to a file. Can also be a single value.',
						optional: false
					},
					{
						type: '',
						name: 'Filename',
						description: 'Name of the file that is written.',
						optional: false
					},
					{
						type: '',
						name: 'Directory',
						description: 'The directory of the file that is written. Defaults to the root directory of the File Producer.',
						optional: true
					},
					{
						type: '',
						name: 'Mode',
						description: 'Has to be "create" or "append". Defaults to "append". "create" replaces an existing file with the same name, "append" appends instead.',
						optional: true
					},
					{
						type: '',
						name: 'Separator',
						description: 'Separator to use when writing range to file. Defaults to ",".',
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
							formula: '=FILE.WRITE(&#124;File Producer,"Message","file.csv","directory")',
							result: 'TRUE',
							comment: 'Write the text “Message” to the file located at “{rootDirectory}/directory/file.csv” using the “File Producer”'
						},
						{
							formula: '=FILE.WRITE(&#124;File Producer, A2:C3,"file.csv",,"create",";") <br />   <br /> <img src={require("../../_images/FILE.WRITE.png").default} width="100%"/>',
							result: 'TRUE',
							comment: 'Writes the content of the range A2:C3 to the field located at “{rootDirectory}/file.csv” using “;” as separator and replacing an already existing file with the same name. The resulting content of the file is:  <br />`Example1;Example2;Example3` <br /> `Example4;Example5;Example6 `'
						}
					]
				}
			}
		},
		'HTTP.REQUEST': {
			status: 'deprecated',
			default: {
				category: 'Streams',
				description: 'Create an HTTP request. The result, of the request, if any, will be added to the inbox of the given target sheet. You can use the Function Wizard for this function.',
				inlineDescription: 'Create an HTTP request.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for submitting the HTTP.request.',
						optional: false
					},
					{
						type: '',
						name: 'Path',
						description: 'Path extending the base URL of the connector.',
						optional: false
					},
					{
						type: '',
						name: 'Method',
						description: 'HTTP method of the request.',
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
						description: 'Limit the result to the specified JSON Keys',
						optional: true
					},
					{
						type: '',
						name: 'Body',
						description: 'Data to use as the body of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'Headers',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Number of ms after the request times out and an error is returned.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.REQUEST() always returns a unique random request ID, which is automatically generated when the service is called. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.REQUEST(&#124;Rest,"/path","GET",INBOX())',
							result: 'generated Request id',
							comment: 'This makes a GET request to "{ConnectorBaseURL}/path" and writes the response to the Inbox.'
						},
						{
							formula: '=HTTP.REQUEST(&#124;Rest,"/path","POST",INBOX("S2"),,"hello",A2:B3) <br /> <img src={require("../../_images/REST.REQUEST.png").default} width="100%"/>',
							result: 'generated Request id',
							comment: 'This makes a POST request to “{ConnectorBaseURL}/path” with “hello” as body and “Content-Type: text/plain” and “Custom-Header: example” as headers. The response is placed in the Inbox of S2'
						}
					]
				}
			}
		},
		'HTTP.RESPOND': {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Sends either arbitrary JSON data or a message from the outbox to specified Producer. Usually this function is used to respond to a previously received *request*-message. You can use the Function Wizard for this function.',
				inlineDescription: 'Sends either arbitrary JSON data or a message from the outbox to specified Producer',
				arguments: [
					{
						type: '',
						name: 'Consumer',
						description: 'Name of the Consumer to use for sending respond.',
						optional: false
					},
					{
						type: '',
						name: 'RequestId',
						description: 'The *requestId* as provided by a previously received *request*-message',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'Data to send as response.',
						optional: false
					},
					{
						type: '',
						name: 'StatusCode',
						description: 'Defaults to 200. HTTP status code of the response.',
						optional: true
					},
					{
						type: '',
						name: 'Headers',
						description: 'Headers of the response.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE on success or [error](../../other#error-codes) code otherwise.'
				},
				examples: {
					infoStart: 'We assume that a *request*-message was received and that it provides a *requestId* which we store to cell B1 by using the read function as follows: `READ(INBOXMETADATA(,,"requestId"), B1, "String")` ',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.RESPOND(&#124;Rest,B1,DICTIONARY(A3:C5))',
							result: 'TRUE',
							comment: 'Sends the JSON data provided by the DICTIONARY function to the Consumer named Rest using the requestId in B1'
						},
						{
							formula: '=HTTP.RESPOND(&#124;Rest,B1,"Not Found",404,A2:B2) <br /> <img src={require("../../_images/REST.RESPOND.png").default} width="100%"/>',
							result: 'TRUE',
							comment: 'Responds to the request corresponding to requestId with the body “Not Found”, status code “404” and the header “Content-Type: text/plain”.'
						}
					]
				}
			}
		},
		'KAFKA.COMMAND': {
			default: {
				category: 'Streams',
				description: 'Allows KSQL commands to be used. You can use the Function Wizard for this function.',
				inlineDescription: 'Allows KSQL commands to be used. You can use the Function Wizard for this function.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use.',
						optional: false
					},
					{
						type: '',
						name: 'Command',
						description: 'Any command allowed in KSQL table.',
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
						description: 'The time to wait for an answer. When left empty a 20 second timeout is being used.',
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
							formula: '=KAFKA.COMMAND(&#124;KafkaProducer, "CREATE TABLE ksqltable201 (random BIGINT, type VARCHAR) WITH (kafka_topic=\'cedalo\', value_format=\'JSON\', key = \'random\')", INBOX ())',
							result: 'TRUE',
							comment: 'A KSQL table will be created with the name ksqltable201.'
						}
					]
				}
			}
		},
		'KAFKA.PUBLISH': {
			default: {
				category: 'Streams',
				description: 'Publishes either a message or an arbitrary value using a specified Producer and topic. To reference a message from the outbox use the outbox function and to reference a message from the inbox use INBOX. You can use the Function Wizard for this function.',
				inlineDescription: 'Publishes either a message or an arbitrary value using a specified Producer and topic.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for publishing.',
						optional: false
					},
					{
						type: '',
						name: 'Message',
						description: 'Either an existing message from the outbox a JSON or a primitive value to publish.',
						optional: false
					},
					{
						type: '',
						name: 'Topic',
						description: 'Topic the message is published to.',
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
							formula: '=KAFKA.PUBLISH(&#124;Kafka Producer,"Message","test")',
							result: 'TRUE',
							comment: 'This publishes the string value "Message" using the "Kafka Producer" to the topic "test"'
						}
					]
				}
			}
		},
		'KAFKA.QUERY': {
			default: {
				category: 'Streams',
				description: 'Allows KSQL queries to be used. You can use the Function Wizard for this function.',
				inlineDescription: 'Allows KSQL queries to be used. You can use the Function Wizard for this function.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use.',
						optional: false
					},
					{
						type: '',
						name: 'Query',
						description: 'Any query allowed on a KSQL table.',
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
						description: 'The time to wait for an answer. When left empty a 20 second timeout is being used.',
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
							formula: '=KAFKA.Query(&#124;Kafka Producer, "select * from ksqltable200", INBOX())',
							result: 'TRUE',
							comment: 'The complete data from ksqltable200 will be shown in the inbox.'
						}
					]
				}
			}
		},
		'MAIL.SEND': {
			default: {
				category: 'Streams',
				description: 'Send a mail using the given producer and parameters. You can use the Function Wizard for this function.',
				inlineDescription: 'Send a mail using the given producer and parameters.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Mail Producer to use for sending mail.',
						optional: false
					},
					{
						type: '',
						name: 'Message',
						description: 'Simple text used as content of the mail',
						optional: false
					},
					{
						type: '',
						name: 'Subject',
						description: 'Simple text',
						optional: false
					},
					{
						type: '',
						name: 'TO',
						description: 'Single mail address or range of mail addresses.',
						optional: false
					},
					{
						type: '',
						name: 'CC',
						description: 'Single mail address or range of mail addresses.',
						optional: false
					},
					{
						type: '',
						name: 'BCC',
						description: 'Single mail address or range of mail addresses.',
						optional: false
					},
					{
						type: '',
						name: 'Attachments',
						description: 'Range of Attachments, see example below.',
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
							formula: '=MAIL.SEND(&#124;Mail Produer,“Message”,“Subject”,“user@example.org”)',
							result: 'TRUE',
							comment: 'Send a mail with the content “Message” and the subject “Subject” to “user@example.org” using the “Mail Producer”'
						},
						{
							formula: '=MAIL.SEND(&#124;Mail Producer,“Message”,“Subject”,A1:B2, “user2@example.org”,“user3@example.org”)',
							result: 'TRUE',
							comment: 'Send a mail with the content “Message” and the subject “Subject” to all mail addresses in the A1:B2 range and with “user2@example.org” in CC and “user3@example.org” in BCC using the “Mail Producer”.'
						},
						{
							formula: '=MAIL.SEND(&#124;Mail Prodcuer,"Message","Subject","user@example.org",,,A3:D4)  <br /> <img src={require("../../_images/MAIL.SEND.png").default} width="100%"/>',
							result: 'TRUE',
							comment: 'Send a mail with two attachments. <br />The first attachment is text file name “file.txt” with “A text” as content. The second attachment is an image named “image.jpeg” with the base64 value of the image as content. <br />The encoding defaults to “utf-8” and could be omitted for “file.txt”. The “Content-Type” column is optional and not required in most cases since the Content-Type will be determined from the file extension.'
						}
					]
				}
			}
		},
		'MQTT.PUBLISH': {
			default: {
				category: 'Streams',
				description: 'Publishes either a message or an arbitrary value using a specified Producer and topic. To reference a message from the outbox use the outbox function and to reference a message from the inbox use INBOX. You can use the Function Wizard for this function.',
				inlineDescription: 'Publishes a referenced Outbox or Inbox message or a JSON via MQTT',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for publishing.',
						optional: false
					},
					{
						type: '',
						name: 'MessageOrValue',
						description: 'Either an existing message from the outbox or a value to publish.',
						optional: false
					},
					{
						type: '',
						name: 'Topic',
						description: 'Topic that is appended to the base topic defined in the Connector.',
						optional: false
					},
					{
						type: '',
						name: 'QoS',
						description: 'Quality of Service. This option defines the reliability of the publish operation. It depends on the used protocol.',
						optional: true
					},
					{
						type: '',
						name: 'User Properties',
						description: 'Define Metadata.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: 'All examples assume a base topic with the value "/cedalo" in the connector. \n\n<img src={require("../../_images/mqttpub.png").default} width="50%"/>\n\n     ',
					infoEnd: '  ',
					formulas: [
						{
							formula: '=MQTT.PUBLISH(&#124;MQTT Producer,JSON(A1:B2),"test")',
							result: 'TRUE',
							comment: 'This publishes a JSON object created by the json function using the "MQTT Producer" and topic "cedalo/test"'
						},
						{
							formula: '=MQTT.PUBLISH(&#124;MQTT Producer,"Message","test")',
							result: 'TRUE',
							comment: 'This publishes the string value "Message" using the "MQTT Producer" under the topic "cedalo/test"'
						},
						{
							formula: '=MQTT.PUBLISH(&#124;MQTT Producer,OUTBOX("Message"),"test")',
							result: 'TRUE',
							comment: 'This publishes the outbox message with id "Message" using the "MQTT Producer" and topic "cedalo/test"'
						}
					]
				}
			}
		},
		'OPCUA.READ': {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Reads a value from an OPC UA Server. You can use the Function Wizard for this function.',
				inlineDescription: 'Reads a value from an OPC UA Server.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for publishing.',
						optional: false
					},
					{
						type: '',
						name: 'Node',
						description: 'Path of the node to read or node id.',
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
						description: 'Limit the result to the specified JSON Keys.',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'The time to wait for an answer. When left empty a 20 second timeout is being used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function OPCUA.READ always returns a unique random request ID, which can be used with requestinfo to check the state of the request, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: ' ![READPayload](../../_images/OPCUAPayloadRead.png) ',
					infoEnd: '',
					formulas: [
						{
							formula: '=OPCUA.READ(&#124;OPCUAProducer,A5,INBOX())',
							result: 'The request ID',
							comment: 'This reads the node and places the result into the inbox.'
						},
						{
							formula: '=OPCUA.READ(&#124;OPCUAProducer,"/Objects/1:Machines/1:H1mrblX0X/name",C5:G9)',
							result: 'The request ID',
							comment: 'This reads the name of the app with the id "H1mrblX0X" and places the result into the inbox.'
						}
					]
				}
			}
		},
		'OPCUA.RESPOND': {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Sends a response directly, i.e. without any Consumer, to an OPC UA service. The data to be send can be either arbitrary JSON data or a message from the outbox or inbox. Usually this function is used to respond to a previously received *request*-message. \n\n:::info\n A *request*-message must provide a requestId property within its *Metadata* object. \n:::\n',
				inlineDescription: 'Sends a response directly, i.e. without any Consumer, to an OPC UA service.',
				arguments: [
					{
						type: '',
						name: 'requestId',
						description: 'The *requestId* as provided by a previously received *request*-message',
						optional: false
					},
					{
						type: '',
						name: 'MessageOrJSON',
						description: 'Data to send as response.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Color switch to blue on success. Otherwise to red with an [error](../../other#error-codes) code.'
				},
				examples: {
					infoStart: 'We assume that a *request*-message was received and that it provides a *requestId* which we store to cell B1 by using the read function as follows: ` READ(INBOXMETADATA(,,"requestId"), B1, "String")` ',
					infoEnd: '',
					formulas: [
						{
							formula: '=OPCUA.RESPOND(B1,OUTBOX("Message"))',
							result: 'TRUE',
							comment: 'Sends the message with id *Message* from the outbox to an OPCUA Service using the *requestId* in B1'
						},
						{
							formula: '=OPCUA.RESPOND(B1,DICTIONARY(A3:C5))',
							result: 'TRUE',
							comment: 'Sends the JSON data provided by the Dictionary function to an OPCUA Service using the *requestId* in B1'
						}
					]
				}
			}
		},
		'OPCUA.VARIABLES': {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Creates variables on an OPC UA Server. You are able to create single or multiple variables and if needed arrange them in a folder structure. \n\n:::info\n Before using OPCUA.VARIABLES() enable OPCUA Server in Stream Machine settings. Only one OPCUA.VARIABLES() per Streamsheet possible. Always use a parent element in the OPCUA.JSON() Range. \n:::\n\n',
				inlineDescription: 'Creates variables on an OPC UA Server.',
				arguments: [
					{
						type: '',
						name: 'Range',
						description: 'An OPCUA.JSON range covering the variables and folders, which should be hosted by the OPCUA Server. OPCUA Variables have the following parameters (2 optional): key, value, [datatype, typedefinition]. **Supported datatypes:** <br />“String” <br />“Int32” <br />“XmlElement”<br />“ByteString”<br />“Double”<br />“Int64”<br />“UInt32”<br />“UInt16”<br />“Int16”<br />“Boolean” <br /> **Supported typedefinitions:** <br />“folder” <br />“variable”  <br /> If an empty column is included in range then the system assumes for optional parameters that they are NOT given and it shall go to default. By default the system assumes the data type for each node, depending on the value.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The OPCUA.VARIABLES function always switches to blue, if the inserted range is accepted. Otherwise to red with an [error](../../other#error-codes) code.'
				},
				examples: {
					infoStart: '![Serverhost](../../_images/opcuavariables.png) ',
					infoEnd: '',
					formulas: [
						{
							formula: '=OPCUA.VARIABLES(OPCUA.JSON(B3:C8))',
							result: '"TRUE"',
							comment: 'The two rows are needed to define the variable name and its value. The amount of columns is flexible, depending on the amount and structure of the variables needed. The Range will automatically assume a structure and settings.'
						},
						{
							formula: undefined,
							result: undefined,
							comment: undefined
						}
					]
				}
			}
		},
		'OPCUA.WRITE': {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Sends a write request of a value to an OPC UA Server. The Server will respond, if the write was successful or not. You can use the Function Wizard for this function. Click here for a more detailed tutorial on opcua functions.',
				inlineDescription: 'Sends a write request of a value to an OPC UA Server.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for publishing.',
						optional: false
					},
					{
						type: '',
						name: 'Node',
						description: 'Path of the node to write to or node id.',
						optional: false
					},
					{
						type: '',
						name: 'ValueJSON',
						description: 'JSON with a "value" and a "dataType" field containing the value to write and the data type of the value.',
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
						description: 'Limit the result to the specified JSON Keys',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'The time to wait for an answer. When left empty a 20 second timeout is being used.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function OPCUA.WRITE always returns a unique random request ID, which can be used with requestinfo to check the state of the request, if no [error](../../other#error-codes).'
				},
				examples: {
					infoStart: ' ![WritePayload](../../_images/OPCUA.WRITEEx.png) ',
					infoEnd: '',
					formulas: [
						{
							formula: '=OPCUA.WRITE(&#124;OPCUAProducer,”ns=1;s=S1GXQxFYZP.rkN-uZ8aI.example.param1”, JSON(A6:B7), INBOX())',
							result: 'TRUE',
							comment: 'Writes 13 as data type UInt32 into the given node id.'
						}
					]
				}
			}
		},
		PRODUCE: {
			default: {
				category: 'Streams',
				description: 'Produces a message using the specified Producer and a JSON configuration. Use JSON to create a configuration object or reference an existing configuration from the outbox using the outbox function or from the inbox using INBOX.',
				inlineDescription: 'Produces a message using the specified Producer and a JSON configuration.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for producing.',
						optional: false
					},
					{
						type: '',
						name: 'JSONConfiguration',
						description: 'A JSON that is either an existing message from the outbox or inbox, or created with JSON or DICTIONARY. A "message" field is required, all other fields depend on the used Producer.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if no [error](../../other#error-codes).'
				}
			}
		},
		REQUEST: {
			default: {
				category: 'Streams',
				description: 'Create an https request. The request parameters are defined by creating a message. The parameter definition can be derived from: <https://github.com/request/request#requestoptions-callback> . The result, of the request, if any, will be added to the inbox of the given target sheet.',
				inlineDescription: 'Create an https request. The request parameters are defined by creating a message.',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for submitting the request.',
						optional: false
					},
					{
						type: '',
						name: 'ParameterJSON',
						description: 'Message with JSON Structure defining the request parameters.',
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
						description: 'Limit the result to the specified JSON Keys',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Number of ms after the request times out and an error is returned.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function REQUEST() always returns a unique random request ID, which is automatically generated when the service is called. Otherwise an [error](../../other#error-codes) is returned.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=REQUEST(&#124;Rest,OUTBOX("Message"),INBOX("S2"))',
							result: 'generated Request id',
							comment: 'The message must exist before calling REQUEST. It is created like a normal message, which you would like to publish, using the WRITE formula.'
						}
					]
				}
			}
		},
		REQUESTINFO: {
			default: {
				category: 'Streams',
				description: 'This function returns the current status of a previously executed REQUEST function.',
				inlineDescription: 'This function returns the current status of a previously executed REQUEST function.',
				arguments: [
					{
						type: '',
						name: 'RequestId',
						description: 'Unique id returned from REQUEST function, that you want to be informed about.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE, if request has been executed successfully and the result is in the target location. FALSE, if the request has not delivered a response yet. Error value (e.g. #ERR!), if the request ended with an error (e.g. timeout, invalid URL, etc.) → an error object has been transferred to the target.'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=REQUESTINFO(A1)',
							result: 'TRUE',
							comment: 'A1 contains a successful REQUEST call.'
						}
					]
				}
			}
		},
		RESPOND: {
			license: 'enterprise',
			default: {
				category: 'Streams',
				description: 'Sends either arbitrary JSON data or a message to specified producer. Usually this function is used to respond to a previously received *request*-message. A *request*-message must provide a requestId property within its *Metadata* object.',
				inlineDescription: 'Sends either arbitrary JSON data or a message to specified producer.',
				arguments: [
					{
						type: '',
						name: 'MessageOrJSON',
						description: 'Data to send as response.',
						optional: false
					},
					{
						type: '',
						name: 'Producer',
						description: 'Name of the Producer to use for sending respond.',
						optional: false
					},
					{
						type: '',
						name: 'requestId',
						description: 'The *requestId* as provided by a previously received *request*-message',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'TRUE on success or [error](../../other#error-codes) code otherwise.'
				},
				examples: {
					infoStart: 'We assume that a *request*-message was received and that it provides a *requestId* which we store to cell B1 by using the READ function as follows: `READ(INBOXMETADATA(,,"requestId"), B1, "String")` ',
					infoEnd: '',
					formulas: [
						{
							formula: '=RESPOND(OUTBOX("Message"), "Rest", B1)',
							result: 'TRUE',
							comment: 'Sends the message with id *Message* from the outbox to the producer named *Rest* using the *requestId* in B1'
						},
						{
							formula: 'RESPOND(DICTIONARY(A3:C5), "Rest", B1)',
							result: 'TRUE',
							comment: 'Sends the JSON data provided by the dictionary function to the producer named *Rest* using the *requestId* in B1'
						}
					]
				}
			}
		},
		'REST.REQUEST': {
			status: 'deprecated',
			default: {
				category: 'Streams',
				description: 'This is a legacy function and was replaced by HTTP.REQUEST() Create an https request. The result, of the request, if any, will be added to the inbox of the given target sheet. You can use the Function Wizard for this function.',
				inlineDescription: 'This is a legacy function and was replaced by HTTP.REQUEST()',
				arguments: [
					{
						type: '',
						name: 'Producer',
						description: 'Producer to use for submitting the rest.request.',
						optional: false
					},
					{
						type: '',
						name: 'Path',
						description: 'Path extending the base URL of the connector.',
						optional: false
					},
					{
						type: '',
						name: 'Method',
						description: 'HTTP method of the request.',
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
						description: 'Limit the result to the specified JSON Keys',
						optional: true
					},
					{
						type: '',
						name: 'Body',
						description: 'Data to use as the body of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'Headers',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'Timeout',
						description: 'Number of ms after the request times out and an error is returned.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function REST.REQUEST() always returns a unique random request ID, which is automatically generated when the service is called. Otherwise an [error](../../other#error-codes) is returned.'
				}
			}
		},
		'REST.RESPOND': {
			license: 'enterprise',
			status: 'deprecated',
			default: {
				category: 'Streams',
				description: 'This is a legacy function and was replaced by HTTP.RESPOND() This is a legacy function and was replaced by HTTP.RESPOND() Sends either arbitrary JSON data or a message from the outbox to specified Producer. Usually this function is used to respond to a previously received *request*-message. You can use the Function Wizard for this function.',
				inlineDescription: 'This is a legacy function and was replaced by HTTP.RESPOND().',
				arguments: [
					{
						type: '',
						name: 'Consumer',
						description: 'Name of the Consumer to use for sending respond.',
						optional: false
					},
					{
						type: '',
						name: 'RequestId',
						description: 'The *requestId* as provided by a previously received *request*-message',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'Data to send as response.',
						optional: false
					},
					{
						type: '',
						name: 'StatusCode',
						description: 'Defaults to 200. HTTP status code of the response.',
						optional: true
					},
					{
						type: '',
						name: 'Headers',
						description: 'Headers of the response.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'TRUE on success or [error](../../other#error-codes) code otherwise.'
				}
			}
		},
	}};
