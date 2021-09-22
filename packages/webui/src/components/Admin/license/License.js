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
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import {
	getLicenseInstallationsInfo,
	getLicenseStreamsheetsInfo,
	getLicenseValidUntil,
	getPremium,
	isPremiumLicense
} from '../../../helper/license';

const useStyles = makeStyles(() => ({
	tableContainer: {
		'& td:first-child': {
			width: '30%'
		}
	},
}));

const License = (props) => {
	const classes = useStyles();
	const { licenseInfo } = props;

	return (
		<div style={{ padding: '24px' }}>
			<Paper>
				{licenseInfo && (
					<TableContainer component={Paper} className={classes.tableContainer}>
							<Table size="medium">
								<TableBody>
									<TableRow>
										<TableCell>
											<b>
												<FormattedMessage
													id="Product.name.header"
													defaultMessage="Name"
												/>
											</b>
										</TableCell>
										<TableCell>
											<FormattedMessage
												id="Product.name"
												defaultMessage="Streamsheets"
											/>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											<b>
												<FormattedMessage
													id="License.edition"
													defaultMessage="Edition"
												/>
											</b>
										</TableCell>
										<TableCell>{isPremiumLicense(licenseInfo) ? getPremium() : licenseInfo.edition}</TableCell>
									</TableRow>
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.validUntil"
														defaultMessage="License valid until"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseValidUntil(licenseInfo.daysLeft)}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.issuedBy"
														defaultMessage="Issued by"
													/>
												</b>
											</TableCell>
											<TableCell>{licenseInfo.issuedBy}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.issuedTo"
														defaultMessage="Issued to"
													/>
												</b>
											</TableCell>
											<TableCell>{licenseInfo.issuedTo}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.maxInstallations"
														defaultMessage="Maximum installations"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseInstallationsInfo(licenseInfo)}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.Info.Streamsheets.max"
														defaultMessage="Maximum number of Streamsheets"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseStreamsheetsInfo(licenseInfo)}</TableCell>
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
		// meta: state.meta,
		licenseInfo: state.meta.licenseInfo,
	};
}

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(License);
