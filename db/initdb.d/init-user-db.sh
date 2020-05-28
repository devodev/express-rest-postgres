#!/bin/bash
set -e

psql \
    -v ON_ERROR_STOP=1 \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    <<-EOF
    CREATE USER docker WITH ENCRYPTED PASSWORD 'docker';
    CREATE DATABASE docker;
    GRANT ALL PRIVILEGES ON DATABASE docker TO docker;

    CREATE TABLE test (
        id SERIAL PRIMARY KEY,
        important_field TEXT UNIQUE
    );
    GRANT ALL PRIVILEGES ON TABLE test TO docker;
EOF

psql \
    -v ON_ERROR_STOP=1 \
    -U "docker" \
    -d "docker" \
    <<-EOF
    CREATE TABLE test (
        id SERIAL PRIMARY KEY,
        important_field TEXT UNIQUE
    );
    GRANT ALL PRIVILEGES ON TABLE test TO docker;
EOF
