/* eslint-disable */

import React from 'react';
export default class Secret extends React.Component {
	render() {
		localStorage.setItem('jwtToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJtYWNoaW5lc2VydmVyIiwiaWF0IjoxNTEwODYwODQwLCJleHAiOjE1NDIzOTY4NDB9.jtfbgAntb1bXG6-VLRu43erj7PISyYLMLwvHQ-p1qd4');
		return <p>Secret stored</p>;
	}
}
