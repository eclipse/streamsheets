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
		'HTTP.DELETE': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP DELETE request. Delete a resource from the server. May change server status. The DELETE method is defined to be idempotent, which means that sending the same HTTP DELETE request multiple times will have the same effect on the server and will not additionally affect the state or cause additional side effects.',
				inlineDescription: 'Executes an HTTP DELETE request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.DELETE() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.DELETE("<span />www.example.api",,,INBOX())',
							result: 'Request to the API',
							comment: 'A request has been made and put the response into the inbox.'
						}
					]
				}
			}
		},
		'HTTP.GET': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP GET request. Retrieve information from the server. Should not modify the data on the server. The HTTP GET method requests a representation of the specified resource.',
				inlineDescription: 'Executes an HTTP GET request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.GET() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.GET(" h<span />ttps://anapioficeandfire.com/api/characters/583 ",,,INBOX())',
							result: 'Request to the API',
							comment: 'A request has been made and put the response into the inbox.'
						}
					]
				}
			}
		},
		'HTTP.HEAD': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP HEAD request. The HTTP HEAD method requests HTTP headers from the server as if the document was requested using the HTTP GET method. The only difference between HTTP HEAD and GET requests is that for HTTP HEAD, the server only returns headers without body.',
				inlineDescription: 'Executes an HTTP HEAD request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.HEAD() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.HEAD(" h<span />ttps://anapioficeandfire.com/api/characters/583 ",,,INBOX())',
							result: 'Request to the API',
							comment: 'A request has been made and put the response into the inbox. the response will only return header.'
						}
					]
				}
			}
		},
		'HTTP.OPTIONS': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP OPTIONS request. The HTTP OPTIONS method is used to describe communication options for the target resource. Browsers send an HTTP OPTIONS request to find out the supported HTTP methods and other options supported for the target resource before sending the actual request.',
				inlineDescription: 'Executes an HTTP OPTIONS request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.OPTIONS() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: [
						{
							formula: '=HTTP.OPTIONS("w<span />ww.example.api" ,,,INBOX())',
							result: 'Request to the API',
							comment: 'A request has been made and put the response into the inbox.'
						}
					]
				}
			}
		},
		'HTTP.PATCH': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP PATCH request. Partially modify the specified resource on the server. It is faster and requires less resources than the PUT method.',
				inlineDescription: 'Executes an HTTP PATCH request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'The body of the request.',
						optional: true
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.PATCH() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: []
				}
			}
		},
		'HTTP.POST': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP POST request. Use if you want to push data onto a server from an HTTP client. Use the body parameter to specify what you want to post.',
				inlineDescription: 'Executes an HTTP POST request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'The body of the request',
						optional: true
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.POST() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: []
				}
			}
		},
		'HTTP.PUT': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP PUT request. The HTTP PUT method is used to update an existing resource on the server, while the POST method creates or adds a resource on the server.',
				inlineDescription: 'Executes an HTTP PUT request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'The body of the request.',
						optional: true
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.OPTIONS() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: []
				}
			}
		},
		'HTTP.REQUEST2': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP request. Universal function to use for all HTTP methods.',
				inlineDescription: 'Executes an HTTP request',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'Method',
						description: 'The HTTP-method of the request.',
						optional: false
					},
					{
						type: '',
						name: 'Body',
						description: 'The body of the request.',
						optional: true
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.OPTIONS() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: []
				}
			}
		},
		'HTTP.TRACE': {
			default: {
				category: 'HTTP',
				description: 'Create an HTTP TRACE request. The HTTP TRACE method is used to debug web server connections by returning the full HTTP request to the client for proxy-debugging purposes.',
				inlineDescription: 'Create an HTTP TRACE request.',
				arguments: [
					{
						type: '',
						name: 'URL',
						description: 'The URL to request.',
						optional: false
					},
					{
						type: '',
						name: 'HeadersJSON',
						description: 'Headers of the HTTP request.',
						optional: true
					},
					{
						type: '',
						name: 'ConfigJSON',
						description: 'A JSON configuration for the HTTP request. Possible configurations are: "baseURL","timeout","auth: { username: \'secret\', password: \'tops3cret\' }","proxy: {protocol: \'https\',host: \'127.0.0.1\',port: 9000, auth: {username: \'secret\', password: \'tops3cret\'  }   "',
						optional: true
					},
					{
						type: '',
						name: 'Target',
						description: 'INBOX(), OUTBOX("MsgID") or a cell range where the result will be placed. Make sure the cell range is big enough or not everything is displayed.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The function HTTP.TRACE() always returns a unique random request ID. Otherwise an [error](../../other#error-codes) is displayed.'
				},
				examples: {
					infoStart: '![Select](../../_images/HTTPConfigHeader.png) \n\nExamples for using the config and header parameter. Use a JSON() function around the cell range.  ',
					infoEnd: '',
					formulas: []
				}
			},
		},
	'URL.HASH': {
		default: {
			category: 'HTTP',
			description: 'Gets the fragment of an URL.',
			inlineDescription: 'Gets the fragment of an URL.',
			arguments: [{
				type: '',
				name: 'URL',
				description: '',
				optional: false
			}, {
				type: '',
				name: 'Target',
				description: '',
				optional: false
			},
			],
			return: {
				type: '',
				description: ''
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
	'URL.HOST': {
			default: {
				category: 'HTTP',
				description: 'Gets the host of an URL.',
				inlineDescription: 'Gets the host of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
	'URL.HOSTNAME': {
			default: {
				category: 'HTTP',
				description: 'Gets the host name of an URL.',
				inlineDescription: 'Gets the host name of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.ORIGIN': {
			default: {
				category: 'HTTP',
				description: 'Gets the origin of an URL.',
				inlineDescription: 'Gets the origin of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.PASSWORD': {
			default: {
				category: 'HTTP',
				description: 'Gets the password portion of an URL.',
				inlineDescription: 'Gets the password portion of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.PATHNAME': {
			default: {
				category: 'HTTP',
				description: 'Gets the path portion of an URL.',
				inlineDescription: 'Gets the path portion of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.PORT': {
			default: {
				category: 'HTTP',
				description: 'Gets the port of an URL.',
				inlineDescription: 'Gets the port of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.PROTOCOL': {
			default: {
				category: 'HTTP',
				description: 'Gets the protocol of an URL.',
				inlineDescription: 'Gets the protocol of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.QUERY': {
			default: {
				category: 'HTTP',
				description: 'Gets the query string  of an URL.',
				inlineDescription: 'Gets the query string  of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
		'URL.USERNAME': {
			default: {
				category: 'HTTP',
				description: 'Gets the username portion of an URL.',
				inlineDescription: 'Gets the username portion of an URL.',
				arguments: [{
					type: '',
					name: 'URL',
					description: '',
					optional: false
				}, {
					type: '',
					name: 'Target',
					description: '',
					optional: false
				},
				],
				return: {
					type: '',
					description: ''
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
