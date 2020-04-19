/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types,jsx-a11y/click-events-have-key-events,react/no-find-dom-node,max-len */
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FilterName from './FilterName';
import { chainFilters } from './Utils';

const noopFilter = (resources) => resources;

class ResourceFilter extends Component {
	static propTypes = {
		onUpdateFilter: PropTypes.func.isRequired,
		filters: PropTypes.array,
		filterName: PropTypes.bool,
	};

	static defaultProps = {
		filters: [],
		filterName: true,
	};

	constructor(props) {
		super(props);
		this.otherFilters = this.props.filters.map(() => noopFilter);
		this.nameFilter = noopFilter;
	}

	doUpdateFilter = () => {
		const filter = chainFilters([this.nameFilter, ...this.otherFilters]);
		this.props.onUpdateFilter(filter);
	};

	updateOtherFilter = (index, updatedFilter) => {
		this.otherFilters[index] = updatedFilter;
		this.doUpdateFilter();
	};

	updateNameFilter = (nameFilter) => {
		this.nameFilter = nameFilter;
		this.doUpdateFilter();
	};

	render() {
		return (
			<Paper elevation={4} style={{
				minHeight: '64px',
				zIndex: 1000,
				borderRadius: '0px',
			}}>
				<div style={{ padding: '8px 16px 0px 16px' }}>
					<Grid
						style={{
							flexWrap: 'nowrap',
						}}
						container
						spacing={16}
						direction="row"
					>
						{this.props.filterName ? (
							<Grid item style={{ flexGrow: 1 }}>
								<FilterName onUpdateFilter={this.updateNameFilter} />
							</Grid>
						) : null}
						{this.props.filters.map((OtherFilter, index) => (
							// eslint-disable-next-line
							<Grid item key={index}>
								<OtherFilter
									onUpdateFilter={(updatedFilter) => this.updateOtherFilter(index, updatedFilter)}
								/>
							</Grid>
						))}
					</Grid>
				</div>
			</Paper>
		);
	}
}

export default ResourceFilter;
