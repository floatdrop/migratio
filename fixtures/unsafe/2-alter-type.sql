-- +migrate NoTransaction
-- +migrate Up

ALTER TYPE action_type ADD VALUE 'restore';

-- +migrate Down

-- Removing value from type is not supported in postgres
-- See: http://stackoverflow.com/questions/25811017/how-to-delete-an-enum-type-in-postgres
