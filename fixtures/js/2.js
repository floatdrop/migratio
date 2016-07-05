exports.up = function * (db) {
	yield db.query(`
		CREATE TABLE test2 (
			id serial PRIMARY KEY,
			test int REFERENCES test (id)
		)
	`);
};

exports.down = function * (db) {
	yield db.query(`
		DROP TABLE IF EXISTS test2;
	`);
};
