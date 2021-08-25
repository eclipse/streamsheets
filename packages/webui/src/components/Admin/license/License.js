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
/* eslint-disable react/prop-types */
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import PremiumVersionIcon from '@material-ui/icons/VerifiedUser';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

const isPremiumLicense = (license) => license && license.edition === 'pro';

const getPremium = () => {
	return (
		<span>
			<PremiumVersionIcon fontSize="small" style={{ color: '#ffc107', verticalAlign: 'middle' }} /> Premium
		</span>
	);
};

const getLicenseValidUntil = (daysLeft) => {
	const date = new Date();
	date.setDate(date.getDate() + daysLeft);
	return date.toLocaleDateString();
}

const useStyles = makeStyles(() => ({
	tableContainer: {
		minHeight: '500px',
		'& td:nth-child(2)': {
			minWidth: '100%'
		}
	},
}));

const License = (props) => {
	const classes = useStyles();

	return (
		<div style={{ padding: '24px' }}>
			<Paper>
				{props.meta.licenseInfo && (
					<TableContainer component={Paper} className={classes.tableContainer}>
							<Table size="medium">
								<TableBody>
									{isPremiumLicense(props.meta.licenseInfo) && (
									<TableRow>
										<TableCell>
											<b>
												<FormattedMessage
													id="License.edition"
													defaultMessage="Edition"
												/>
											</b>
										</TableCell>
										<TableCell>{isPremiumLicense(props.meta.licenseInfo) ? getPremium() : props.meta.licenseInfo.edition}</TableCell>
									</TableRow>
									)}
									{isPremiumLicense(props.meta.licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.validUntil"
														defaultMessage="License valid until"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseValidUntil(props.meta.licenseInfo.daysLeft)}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(props.meta.licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.issuedBy"
														defaultMessage="Issued by"
													/>
												</b>
											</TableCell>
											<TableCell>{props.meta.licenseInfo.issuedBy}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(props.meta.licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.issuedTo"
														defaultMessage="Issued to"
													/>
												</b>
											</TableCell>
											<TableCell>{props.meta.licenseInfo.issuedTo}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(props.meta.licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.maxInstallations"
														defaultMessage="Maximum installations"
													/>
												</b>
											</TableCell>
											<TableCell>{props.meta.licenseInfo.maxInstallations}</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}
			</Paper>
		</div>
	);
}

function mapStateToProps(state) {
	return {
		meta: state.meta,
	};
}

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(License);
