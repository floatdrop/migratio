-- +migrate Up

CREATE TABLE test2 (
	id serial PRIMARY KEY
);

-- +migrate Down

DROP TABLE IF EXISTS test2;
