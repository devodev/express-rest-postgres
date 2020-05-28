'use strict';

// Imports: npm
const express = require('express');
const winston = require('winston');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const compression = require('compression')
// Imports: std library
const https = require('https');
const fs = require('fs');

// Constants
const PORT = process.env.APP_PORT || 8443;
const HOST = process.env.APP_HOST || '0.0.0.0';

// Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {service: 'hub'},
  exitOnError: false,
  transports: [],
});
if (process.env.NODE_ENV === 'production') {
  logger
      .clear()
      .add(new winston.transports.File({filename: 'error.log', level: 'error'}))
      .add(new winston.transports.File({filename: 'combined.log'}));
} else {
  logger
      .clear()
      .add(new winston.transports.Console({
        timestamp: true,
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
      }));
}

// Database
const connection = {
  host: 'postgres',
  port: 5432,
  database: 'docker',
  user: 'docker',
  password: 'docker',
};

const db = pgp(connection);

async function getTests() {
  return db.task('getTests', async (d) => {
    return await d.manyOrNone('SELECT * FROM test');
  });
}

async function getTest(id) {
  return db.task('getTest', async (d) => {
    return await d.one('SELECT * FROM test WHERE id = $1', id);
  });
}

async function addTest(importantField) {
  return db.task('addTest', async (d) => {
    return await d.one('INSERT INTO test(important_field) VALUES($1) RETURNING *', importantField);
  });
}

async function deleteTest(id) {
  return db.task('deleteTest', async (d) => {
    return await d.none('DELETE FROM test WHERE id = $1', id);
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  logger.error(err.stack);
  res.status(500).render('error', {error: err});
}

// App
const app = express();
app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(errorHandler);

// App routes
function runAsyncWrapper(callback) {
  return function(req, res, next) {
    callback(req, res, next)
        .catch(next);
  };
}

app.get('/test', runAsyncWrapper(async (req, res) => {
  const users = await getTests();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(users);
}));

app.get('/test/:id', runAsyncWrapper(async (req, res) => {
  const testId = req.params.id;
  const user = await getTest(testId);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(user);
}));

app.post('/test', runAsyncWrapper(async (req, res, next) => {
  const {importantField} = req.body;
  const testObj = await addTest(importantField);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json(testObj);
}));

app.delete('/test/:id', runAsyncWrapper(async (req, res, next) => {
  const testId = req.params.id;
  await deleteTest(testId);
  res.status(204).send('deleted');
}));

// Server
const options = {
  key: fs.readFileSync('tls/server.key'),
  cert: fs.readFileSync('tls/server.pem'),
};

https.createServer(options, app).listen(PORT, HOST, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info(`Listening on https://${HOST}:${PORT}`);
  }
});
