module.exports.parseSql = function parseSql(str) {
	const lines = str.split('\n');

	const result = {
		up: '',
		down: '',
		trash: ''
	};

	let current = 'trash';

	for (let line of lines) {
		if (line.indexOf('-- +migrate Up') === 0) {
			current = 'up';
			continue;
		}

		if (line.indexOf('-- +migrate Down') === 0) {
			current = 'down';
			continue;
		}

		result[current] = result[current] + line + '\n';
	}

	return result;
};
