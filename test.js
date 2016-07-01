import test from 'ava';
import migratio from './';

test.serial('up', async t => {
	await migratio.up({
		directory: './fixtures',
		connection: 'postgres://localhost:5432/test'
	});

	const batch = await migratio.current({
		directory: './fixtures',
		connection: 'postgres://localhost:5432/test'
	});

	t.is(batch.length, 2);
});

test.serial('down', async t => {
	await migratio.down({
		directory: './fixtures',
		connection: 'postgres://localhost:5432/test'
	});

	const batch = await migratio.current({
		directory: './fixtures',
		connection: 'postgres://localhost:5432/test'
	});

	t.is(batch.length, 0);
});
