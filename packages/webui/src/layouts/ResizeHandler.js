import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { setAppState } from '../actions/actions';
import { graphManager } from '../GraphManager';

const getToolsVisibility = () => {
	const container = graphManager.getMachineContainer();
	const attr = container && container.getMachineContainerAttributes();
	const showTools = attr == null || window.innerWidth > attr.getHideToolbarThreshold().getValue();
	return showTools;
};

function ResizeHandlerComponent(props) {
	useEffect(() => {
		const handleResize = () => {
			console.log('resize');
			props.setAppState({ showTools: getToolsVisibility() });
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return null;
}

ResizeHandlerComponent.propTypes = {
	setAppState: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
	setAppState,
};

export const ResizeHandler = connect(
	null,
	mapDispatchToProps,
)(ResizeHandlerComponent);
