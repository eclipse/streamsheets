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
	en: 'HTTP',
	de: 'HTTP',
	functions: {
		'HTTP.REQUEST2': {
			en: {
				argumentList: 'URL,method,body,headers,config,target',
				description: 'Executes an HTTP request'
			},
			de: {
				argumentList: 'URL,Methode,Body,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage aus'
			}
		}, 
		'HTTP.GET': {
			en: {
				argumentList: 'URL,headers,config,target',
				description: 'Executes an HTTP GET request'
			},
			de: {
				argumentList: 'URL,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode GET aus'
			}
		}, 
		'HTTP.POST': {
			en: {
				argumentList: 'URL,body,headers,config,target',
				description: 'Executes an HTTP POST request'
			},
			de: {
				argumentList: 'URL,Body,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode POST aus'
			}
		}, 
		'HTTP.PUT': {
			en: {
				argumentList: 'URL,body,headers,config,target',
				description: 'Executes an HTTP PUT request'
			},
			de: {
				argumentList: 'URL,Body,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode PUT aus'
			}
		}, 
		'HTTP.DELETE': {
			en: {
				argumentList: 'URL,headers,config,target',
				description: 'Executes an HTTP DELETE request'
			},
			de: {
				argumentList: 'URL,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode DELETE aus'
			}
		}, 
		'HTTP.OPTIONS': {
			en: {
				argumentList: 'URL,headers,config,target',
				description: 'Executes an HTTP OPTIONS request'
			},
			de: {
				argumentList: 'URL,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode OPTIONS aus'
			}
		}, 
		'HTTP.HEAD': {
			en: {
				argumentList: 'URL,headers,config,target',
				description: 'Executes an HTTP HEAD request'
			},
			de: {
				argumentList: 'URL,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode HEAD aus'
			}
		}, 
		'HTTP.PATCH': {
			en: {
				argumentList: 'URL,body,header,config,target',
				description: 'Executes an HTTP PATCH request'
			},
			de: {
				argumentList: 'URL,Body,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode PATCH aus'
			}
		}, 
		'HTTP.TRACE': {
			en: {
				argumentList: 'URL,header,config,target',
				description: 'Executes an HTTP TRACE request'
			},
			de: {
				argumentList: 'URL,Header,Konfiguration,Ziel',
				description:
					'Führt eine HTTP-Anfrage über die HTTP-Methode TRACE aus'
			}
		}
	}
};
