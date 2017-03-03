exports.up = async function (db) {
	await db.query(`
		CREATE TABLE test (
			id serial PRIMARY KEY
		)
	`);
};

exports.down = async function (db) {
	await db.query(`
		DROP TABLE IF EXISTS test;
	`);
};
