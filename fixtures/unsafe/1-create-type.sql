-- +migrate Up

CREATE TYPE action_type AS ENUM (
	'download',
	'delete',
	'upload'
);

-- +migrate Down

DROP TYPE IF EXISTS action_type;
