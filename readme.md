<h1 align="center">
	<br>
	<img width="400" src="https://rawgit.com/floatdrop/migratio/master/media/logotype.png" alt="migratio">
	<br>
	<br>
	<br>
</h1>

> Automated migrations for Postgres

[![Build Status](https://travis-ci.org/floatdrop/migratio.svg?branch=master)](https://travis-ci.org/floatdrop/migratio)

## Install

```
$ npm install --save migratio
```


## Usage

Create directory `migrations` with [migrations](#migrations-format) and use migratio:

```js
const migratio = require('migratio');

await migratio.current({
	connection: 'postgres://localhost/db',
	verbose: true
});
//   000005-images.sql  (batch:3)
//   000004-files.sql   (batch:3)
//   000003-stats.sql   (batch:3)

await migratio.up({
	connection: 'postgres://localhost/db',
	verbose: true
});
// ↑ 000006-posts.sql   (batch:4)

await migratio.down({
	connection: 'postgres://localhost/db',
	verbose: true
});
// ↓ 000005-images.sql  (batch:3)
// ↓ 000004-files.sql   (batch:3)
// ↓ 000003-stats.sql   (batch:3)
```

## Migrations format

All migrations files should start with _revision_ (digits) followed by `-` and name of migration. For example `000001-init.js` and `000002-users.sql` is valid file names.

Migrations will be applied in order of numbers in front of filename.

Migration process is running in transaction with lock on `migrations` table. If one of migrations failed – all batch will be reverted.

### JavaScript format

Migration file with extension `.js` is treated as module, that exports two functions:

- `up` – contains code to apply migration
- `down` – contains code to revert migration

These functions must return Promise. If these functions are generators, they will be wrapped in `co`.

```js
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
```

### SQL format

Migration file with extension `.sql` is treated as file with SQL instructions. Instructions to apply migration should be placed after `-- +migrate Up` and instructions to revert migration should be placed after `-- +migrate Down`.

```sql
-- +migrate Up

CREATE TABLE test (
	id serial PRIMARY KEY
);

-- +migrate Down

DROP TABLE IF EXISTS test;
```

## Configuring defaults

Migratio supports overriding default values with `migraio` section in `package.json`:

```js
{
	"migratio": {
		"directory": "migrations",
		"tableName": "migrations"
	}
}
```

## API

### up(options)

Applies all migrations from current to latest available.

#### options

##### connection

Type: `string`<br>
Default: `process.env.DATABASE_URL`

Connection string to Postgres database.


##### db

Type: `Database`

[Database](http://vitaly-t.github.io/pg-promise/Database.html) object. Will be used _instead_ of `connection`.


##### directory

Type: `string`<br>
Default: `./migrations`

Directory with migrations.

##### revision

Type: `Number`<br>
Default: `Infinity`

Latest revision to up to.

##### unsafe

Type: `Boolean`<br>
Default: `false`

Disables meta-table locking.

##### verbose

Type: `boolean`<br>
Default: `false`

Enables output.

##### tableName

Type: `string`<br>
Default: `migratio`

Table in which migratio will store metadata.

### down(options)

Rollbacks migrations in current batch.

#### options

##### connection

Type: `string`<br>
Default: `process.env.DATABASE_URL`

Connection string to Postgres database.

##### directory

Type: `string`<br>
Default: `./migrations`

Directory with migrations.

##### unsafe

Type: `Boolean`<br>
Default: `false`

Disables meta-table locking.

##### verbose

Type: `boolean`<br>
Default: `false`

Enables output.

##### tableName

Type: `string`<br>
Default: `migratio`

Table in which migratio will store metadata.

### current(options)

Shows current batch.

##### connection

Type: `string`<br>
Default: `process.env.DATABASE_URL`

Connection string to Postgres database.

##### unsafe

Type: `Boolean`<br>
Default: `false`

Disables meta-table locking.

##### verbose

Type: `boolean`<br>
Default: `false`

Enables output.

##### revision

Type: `Number`<br>
Default: `Infinity`

First revision to show info about.

##### tableName

Type: `string`<br>
Default: `migratio`

Table in which migratio will store metadata.

## CLI

```
$ npm install --global migratio
```

```
$ migratio --help

  Usage
    migratio [command] [options]

  Options
    -d, --directory    Directory with migrations files [Default: ./migrations]
    -c, --connection   Connection string to Postgres [Default: $DATABASE_URL]
    -r, --revision     Specify revision to up/down to
    -t, --table        Table name for metadata [Default: migratio]
    -s, --schema       Schema name for table with metadata [Default: public]
    --unsafe           Skip transaction and table locking

  Commands

    up             Applies all migrations from current to latest
    down           Rollbacks all migrations in current batch
    current        Shows migrations in current batch

  Examples
    $ migratio

      Current batch:
        000005-images.sql  (batch:3)
        000004-files.sql   (batch:3)
        000003-stats.sql   (batch:3)

    $ migratio down

      ↓ 000005-images.sql  (batch:3)
      ↓ 000004-files.sql   (batch:3)
      ↓ 000003-stats.sql   (batch:3)

    $ migratio up

      ↑ 000003-stats.sql   (batch:3)
      ↑ 000004-files.sql   (batch:3)
      ↑ 000005-images.sql  (batch:3)
      ↑ 000006-posts.sql   (batch:3)
```


## License

MIT © [Vsevolod Strukchinsky](http://github.com/floatdrop)
