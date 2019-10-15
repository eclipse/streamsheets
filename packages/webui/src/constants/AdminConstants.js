import React from 'react';
import { IconConnector, IconConsumer, IconProducer, IconUser } from '../components/icons';

export default {
	ADMIN_SECURITY: {
		ADMIN_USER__ID: '000000000000000000000000',
		ADMIN_USER_ID: 'admin',
		ERROR_REMOVE_DENIED: 'ADMIN_REMOVE_DENIED'
	},
	SECURITY_BUTTONS: {
		SAVE: 100,
		DELETE: 200,
		CLOSE: 0
	},
	CONFIG_TYPE: {
		ProviderConfiguration: 'providers',
		ConnectorConfiguration: 'connectors',
		ConsumerConfiguration: 'consumers',
		ProducerConfiguration: 'producers'
	},
	CONFIG_CLASS: {
		ProviderConfiguration: 'ProviderConfiguration',
		ConnectorConfiguration: 'ConnectorConfiguration',
		ConsumerConfiguration: 'ConsumerConfiguration',
		ProducerConfiguration: 'ProducerConfiguration'
	},
	qosOptions: [
		{
			value: '0',
			label: 'At most once (0)'
		},
		{
			value: '1',
			label: 'At least once (1)'
		},
		{
			value: '2',
			label: 'Exactly once (2)'
		}
	],
	GRID_CONFIG: {
		ConnectorConfiguration: {
			headerBackgroundColor: '#0c4660',
			icon: <IconConnector />
		},
		ConsumerConfiguration: {
			headerBackgroundColor: '#0CC34A',
			icon: <IconConsumer />
		},
		ProducerConfiguration: {
			headerBackgroundColor: '#5ac3b5',
			icon: <IconProducer />
		},
		User: {
			headerBackgroundColor: '#2cc3b4',
			icon: <IconUser />
		}
	}
};
