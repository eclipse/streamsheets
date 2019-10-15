export function getUrlScheme() {
	return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
}
export function getUrl(path = '/', host = window.location.host) {
	return `${getUrlScheme()}//${host}${path}`;
}
