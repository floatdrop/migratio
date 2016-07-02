'use strict';

const path = require('path');
const co = require('co');
const fs = require('mz/fs');
const pgp = require('pg-promise')({noWarnings: true});
const pkgConf = require('pkg-conf');

function parseSql(str) {
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
}

function lockup(db, options) {
	return db.query(`
		CREATE TABLE IF NOT EXISTS $1~ (
			id serial PRIMARY KEY,
			name text,
			revision integer,
			migration_time timestamp with time zone DEFAULT timezone('msk'::text, now()) NOT NULL,
			batch integer
		);

		LOCK TABLE $1~;
	`, [options.tableName]);
}

function transactio(work) {
	return function (options) {
		options = Object.assign({
			connection: process.env.DATABASE_URL,
			directory: './migrations',
			tableName: 'migratio'
		}, pkgConf.sync('migratio'), options);

		const db = pgp(options.connection);
		try {
			return db.tx(t => lockup(t, options).then(() => work(t, options)));
		} finally {
			pgp.end();
		}
	};
}

function validFileName(file) {
	const ext = path.extname(file);
	if (ext !== '.js' && ext !== '.sql') {
		return false;
	}

	return /^\d+/.test(file);
}

function byRevision(a, b) {
	const aRev = parseInt(a, 10);
	const bRev = parseInt(b, 10);

	return aRev - bRev;
}

function * up(t, options) {
	const latestMigration = ((yield current(t, Object.assign({}, options, {revision: undefined, verbose: false}))).pop() || {}).revision || 0;
	const currentBatch = ((latestMigration || {}).batch || 0);

	const files = (yield fs.readdir(options.directory))
		.filter(validFileName)
		.filter(file => parseInt(file, 10) > latestMigration)
		.filter(file => parseInt(file, 10) <= (options.revision || Infinity))
		.sort(byRevision);

	if (files.length === 0 && options.verbose) {
		console.log(`    Database is up to date`);
	}

	for (let file of files) {
		const filePath = path.resolve(path.join(options.directory, file));
		const ext = path.extname(file);
		const revision = parseInt(file, 10);

		if (options.verbose) {
			console.log(`  ↑  ${file}    (batch:${currentBatch + 1})`);
		}

		if (ext === '.js') {
			const migration = require(filePath);
			yield migration.up(t);
		}

		if (ext === '.sql') {
			const content = yield fs.readFile(filePath, 'utf8');
			const up = parseSql(content).up;
			yield t.query(up);
		}

		yield t.query(`INSERT INTO $1~ (name, revision, batch) VALUES ($2, $3, $4)`, [options.tableName, file, revision, currentBatch + 1]);
	}
}

function * down(t, options) {
	const currentBatch = yield current(t, Object.assign({}, options, {verbose: false}));

	if (currentBatch.length === 0 && options.verbose) {
		console.log(`    No migrations found in database`);
	}

	if (options.revision !== undefined) {
		// Remove migration with revision from be removed
		currentBatch.pop();
	}

	for (let migration of currentBatch) {
		const filePath = path.resolve(path.join(options.directory, migration.name));
		const ext = path.extname(migration.name);

		if (options.verbose) {
			console.log(`  ↓  ${migration.name}    (batch:${migration.batch})`);
		}

		if (ext === '.js') {
			const migration = require(filePath);
			yield migration.down(t);
		}

		if (ext === '.sql') {
			const content = yield fs.readFile(filePath, 'utf8');
			const down = parseSql(content).down;
			yield t.query(down);
		}

		yield t.query('DELETE FROM $1~ WHERE id = $2', [options.tableName, migration.id]);
	}
}

function * current(t, options) {
	let migrations;

	if (options.revision === undefined) {
		const lastBatch = (yield t.one(`SELECT coalesce(MAX(batch), 0) AS max FROM $1~`, [options.tableName])).max;
		migrations = yield t.query('SELECT * FROM $1~ WHERE batch = $2 ORDER BY id ASC', [options.tableName, lastBatch]);
	} else {
		migrations = yield t.query('SELECT * FROM $1~ WHERE revision >= $2 ORDER BY id ASC', [options.tableName, options.revision]);
	}

	if (options.verbose) {
		migrations.forEach(m => console.log(`    ${m.name}    (batch:${m.batch})`));

		if (migrations.length === 0) {
			console.log(`    No migrations were applied`);
		}
	}

	return migrations;
}

module.exports.up = transactio(co.wrap(up));
module.exports.down = transactio(co.wrap(down));
module.exports.current = transactio(co.wrap(current));
