exports.up = function * (db) {
	yield db.query(`
		CREATE TABLE test (
			id serial PRIMARY KEY
		)
	`);
};

exports.down = function * (db) {
	yield db.query(`
		DROP TABLE IF EXISTS test;
	`);
};
