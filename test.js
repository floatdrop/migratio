process.env.DATABASE_URL = 'postgres://localhost:5432/test';

import test from 'ava';
import migratio from './';

test.serial('up to revision', async t => {
	await migratio.up({
		directory: './fixtures/js',
		revision: 1
	});

	let batch = await migratio.current();
	t.is(batch.length, 1);

	await migratio.down({
		directory: './fixtures/js'
	});
});

test.serial('down to revision', async t => {
	await migratio.up({
		directory: './fixtures/js'
	});

	let batch = await migratio.current();
	t.is(batch.length, 2);

	await migratio.down({
		directory: './fixtures/js',
		revision: 1
	});

	batch = await migratio.current();
	t.is(batch.length, 1);

	await migratio.down({
		directory: './fixtures/js'
	});
});

test.serial('js', async t => {
	await migratio.up({
		directory: './fixtures/js'
	});

	let batch = await migratio.current();
	t.is(batch.length, 2);

	await migratio.down({
		directory: './fixtures/js'
	});

	batch = await migratio.current();
	t.is(batch.length, 0);
});

test.serial('sql', async t => {
	await migratio.up({
		directory: './fixtures/sql'
	});

	let batch = await migratio.current();
	t.is(batch.length, 1);

	await migratio.down({
		directory: './fixtures/sql'
	});

	batch = await migratio.current();
	t.is(batch.length, 0);
});
