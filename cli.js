#!/usr/bin/env node
'use strict';
const meow = require('meow');
const chalk = require('chalk');
const migratio = require('./');

const cli = meow(`
    Usage
      migratio [command] [options]

    Options
      -d, --directory    Directory with migrations files [Default: ./migrations]
      -c, --connection   Connection string to Postgres [Default: $DATABASE_URL]
      -r, --revision     Specify revision to up/down to
      -t, --tableName    Table name for metadata [Default: migratio]
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
          000005-images.sql  (batch:3)

      $ migratio down

        ↓ 000005-images.sql  (batch:3)
        ↓ 000004-files.sql   (batch:3)
        ↓ 000003-stats.sql   (batch:3)

      $ migratio up

        ↑ 000003-stats.sql   (batch:3)
        ↑ 000004-files.sql   (batch:3)
        ↑ 000005-images.sql  (batch:3)
        ↑ 000006-posts.sql   (batch:3)
`, {
	alias: {
		d: 'directory',
		c: 'connection',
		r: 'revision',
		t: 'tableName',
		s: 'schema',
		h: 'help'
	}
	// Do not set defaults, it will unset values in package.json
});

const command = cli.input[0] || 'current';

console.log();

function error(err) {
	console.error();
	console.error(`  💥  ${chalk.red(err.message)}`);
	console.error();
	console.error(chalk.gray(err.stack));
	console.error();
	process.exit(1);
}

const options = cli.flags;
options.verbose = true;

if (command === 'current') {
	console.log(`  ${chalk.gray('Current batch:')}`);
	migratio.current(options).catch(error);
} else if (command === 'up') {
	migratio.up(options).catch(error);
} else if (command === 'down') {
	migratio.down(options).catch(error);
}
