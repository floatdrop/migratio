exports.up = async function (db) {
	await db.query(`
		CREATE TABLE test2 (
			id serial PRIMARY KEY,
			test int REFERENCES test (id)
		)
	`);
};

exports.down = async function (db) {
	await db.query(`
		DROP TABLE IF EXISTS test2;
	`);
};
