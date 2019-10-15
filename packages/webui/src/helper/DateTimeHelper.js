import moment from 'moment';

export default class DateTimeHelper {
	static getCurrentTime() {
		return moment().format('h:mm A');
	}

	static formatTimestamp(timestamp) {
		return moment(timestamp).format('hh:mm:ss');
	}
}
