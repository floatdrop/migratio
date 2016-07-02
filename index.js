'use strict';

const path = require('path');
const co = require('co');
const fs = require('mz/fs');
const pgp = require('pg-promise')({noWarnings: true});
const parseSql = require('./utils').parseSql;

function lockup(db) {
	return db.query(`
		CREATE TABLE IF NOT EXISTS migrations (
			id serial PRIMARY KEY,
			name text,
			revision integer,
			migration_time timestamp with time zone DEFAULT timezone('msk'::text, now()) NOT NULL,
			batch integer
		);

		LOCK TABLE migrations;
	`);
}

function transactio(work) {
	return function (options) {
		const db = pgp(options.connection);
		try {
			return db.tx(t => lockup(t).then(() => work(t, options)));
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

function greaterThan(revision) {
	return function (file) {
		const fileRevision = parseInt(file, 10);

		return fileRevision > revision;
	};
}

function byRevision(a, b) {
	const aRev = parseInt(a, 10);
	const bRev = parseInt(b, 10);

	return aRev - bRev;
}

function * up(t, options) {
	const latestMigration = (yield current(t, {verbose: false})).pop();
	const currentBatch = ((latestMigration || {}).batch || 0);

	const files = (yield fs.readdir(options.directory))
		.filter(validFileName)
		.filter(greaterThan(currentBatch))
		.sort(byRevision);

	if (files.length === 0 && options.verbose) {
		console.log(`    Database is up to date`);
	}

	for (let file of files) {
		const filePath = path.resolve(path.join(options.directory, file));
		const ext = path.extname(file);
		const revision = parseInt(file, 10);

		if (options.verbose) {
			console.log(`  ⬆  ${file}    (batch:${currentBatch + 1})`);
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

		yield t.query('INSERT INTO migrations (name, revision, batch) VALUES ($1, $2, $3)', [file, revision, currentBatch + 1]);
	}
}

function * down(t, options) {
	const currentBatch = yield current(t, {verbose: false});

	if (currentBatch.length === 0 && options.verbose) {
		console.log(`    No migrations found in database`);
	}

	for (let migration of currentBatch) {
		const filePath = path.resolve(path.join(options.directory, migration.name));
		const ext = path.extname(migration.name);

		if (options.verbose) {
			console.log(`  ⬇  ${migration.name}    (batch:${migration.batch})`);
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

		yield t.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
	}
}

function * current(t, options) {
	const lastBatch = (yield t.one(`SELECT coalesce(MAX(batch), 0) AS max FROM migrations`)).max;
	const migrations = yield t.query('SELECT * FROM migrations WHERE batch = $1 ORDER BY id ASC', [lastBatch]);

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
