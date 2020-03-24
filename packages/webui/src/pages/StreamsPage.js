import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AdminContainer from '../components/Admin/AdminContainer';
import { intl } from '../helper/IntlGlobalProvider';
import { AdminPageLayout } from '../layouts/AdminPageLayout';
import * as Actions from '../actions/actions';
import StreamHelper from '../helper/StreamHelper';

const getSelectedPage = (match, streams) => {
	const parts = match.url.split('/');
	const relevantPart = parts[parts.indexOf('administration') + 1];
	if (relevantPart === 'stream') {
		const configuration = StreamHelper.getConfiguration(streams, match.params.configId);
		return configuration ? StreamHelper.getPageFromClass(configuration.className) : 'connectors';
	}
	return relevantPart;
};

const isEditStreamPage = (match) => {
	const parts = match.url.split('/');
	const relevantPart = parts[parts.indexOf('administration') + 1];
	return relevantPart.indexOf('stream') !== -1;
}

export const StreamsPageComponent = (props) => {
	const { scopeId, match, location, streams } = props;
	useEffect(() => {
		if (scopeId) {
			props.getDataStores();
		}
	}, [scopeId]);
	const getDocumentTitle = () => {
		switch (match.path) {
			case '/administration/connectors':
				return intl.formatMessage({ id: 'TitleConnectors' }, {});
			case '/administration/consumers':
				return intl.formatMessage({ id: 'TitleConsumers' }, {});
			case '/administration/producers':
				return intl.formatMessage({ id: 'TitleProducers' }, {});
			default:
				if (match.path.startsWith('/administration/stream')) {
					const configuration = StreamHelper.getConfiguration(streams, match.params.configId);
					return configuration
						? intl.formatMessage({ id: 'TitleStream' }, { streamName: configuration.name })
						: intl.formatMessage({ id: 'TitleStreamUnknown' }, {});
				} else {
					return intl.formatMessage({ id: 'TitlePage' }, {});
				}
		}
	};

	return (
		<AdminPageLayout
			page={getSelectedPage(match, streams)}
			documentTitle={getDocumentTitle()}
			workspaceSelect={!isEditStreamPage(match)}
			requireStreams
		>
			<div
				style={{
					position: 'relative',
					height: 'calc(100% - 59px)',
					outline: 'none',
					overflow: 'hidden'
				}}
			>
				<AdminContainer location={location} match={match} />
			</div>
		</AdminPageLayout>
	);
};

function mapStateToProps(state) {
	return {
		scopeId: state.user.user ? state.user.user.scope.id : null,
		streams: {
			providers: state.streams.providers,
			connectors: state.streams.connectors,
			consumers: state.streams.consumers,
			producers: state.streams.producers
		}
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}
export const StreamsPage = connect(mapStateToProps, mapDispatchToProps)(StreamsPageComponent);
