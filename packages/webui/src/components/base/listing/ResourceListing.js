/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types,jsx-a11y/click-events-have-key-events,react/no-find-dom-node,max-len */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ResourcesGrid from './ResourcesGrid';
import ResourcesList from './ResourcesList';
import styles from './styles';

class ResourceListing extends Component {
	static propTypes = {
		type: PropTypes.string,
		label: PropTypes.object.isRequired,
		fields: PropTypes.array.isRequired,
		menuOptions: PropTypes.array.isRequired,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func.isRequired,
		onResourceOpen: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		headerBackgroundColor: PropTypes.string,
		defaultLayout: PropTypes.string,
		images: PropTypes.bool,
		handleReload: PropTypes.func,
	};

	static defaultProps = {
		type: 'dashboard',
		headerBackgroundColor: '#8BC34A',
		defaultLayout: 'grid',
		images: false,
		handleResourceDetails: undefined,
		icon: undefined,
		handleReload: undefined,
		headerIcons: [],
	};

	static getDerivedStateFromProps(nextProps, prevState) {
		const resources =
			nextProps.resources && Array.isArray(nextProps.resources)
				? nextProps.resources.slice()
				: [];
		if (resources.length > 0) {
			return { ...prevState, resources };
		}
		return { ...prevState };
	}

	constructor(props) {
		super(props);
		const resources =
			props.resources && Array.isArray(props.resources)
				? props.resources.slice()
				: [];
		this.state = {
			resources,
			layout: props.defaultLayout,
		};
	}

	render() {
		const { resources } = this.state;
		return (
			<div
				style={{
					color: '#444444',
					padding: '0px',
				}}
			>
				<div
					style={{
						background: '#EEEEEE',
						width: 'inherit',
						padding: '0px 0px 0px 20px',
						top: this.props.type === 'dashboard' ? '-60px' : '0px',
						position: 'relative',
					}}
				>
					<div>
						{this.state.layout === 'grid' ? (
							<ResourcesGrid
								{...this.props}
								resources={resources}
							/>
						) : null}
						{this.state.layout === 'list' ? (
							<ResourcesList
								{...this.props}
								resources={resources}
							/>
						) : null}
					</div>
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(ResourceListing);
