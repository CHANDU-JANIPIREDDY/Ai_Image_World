'use strict';

/**
 * config/db.js — MongoDB connection manager.
 *
 * Owns the Mongoose connection lifecycle: production-tuned options, connection
 * event listeners, and connect/disconnect helpers. Kept separate from
 * server.js so the DB layer is reusable by tests and the seed script.
 */

const mongoose = require('mongoose');
const env = require('./env');

// Fail loudly on queries against fields not in the schema.
mongoose.set('strictQuery', true);

/**
 * Connection options tuned for production.
 * - maxPoolSize: cap concurrent sockets to protect the cluster
 * - serverSelectionTimeoutMS: fail fast if no node is reachable
 * - socketTimeoutMS: drop stuck operations
 */
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // prefer IPv4 to avoid slow IPv6 resolution on some hosts
};

// True while an initial connect attempt is in flight — used to suppress the
// duplicate error-event log when connectDB() is already handling the failure
// (e.g. during the in-memory fallback).
let connecting = false;

// ---- Connection event listeners (registered once) ----
mongoose.connection.on('connected', () => {
  // eslint-disable-next-line no-console
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  if (connecting) return; // handled by connectDB's try/catch
  // eslint-disable-next-line no-console
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.warn('⚠️  MongoDB disconnected');
});

/**
 * Establish the MongoDB connection.
 * Throws on failure so the caller (server.js) can fail-fast on startup.
 * @returns {Promise<typeof mongoose>}
 */
let memoryServer;

/** Spin up an ephemeral in-memory MongoDB and connect to it. */
async function startMemoryServer() {
  // eslint-disable-next-line global-require
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri(), connectionOptions);
  // eslint-disable-next-line no-console
  console.log('🧪 Using in-memory MongoDB (ephemeral — data resets on restart)');
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose; // already connected
  }

  // Explicit dev flag — go straight to in-memory.
  if (env.useMemoryDb) {
    await startMemoryServer();
    return mongoose;
  }

  try {
    connecting = true; // suppress duplicate error-event logging while connecting
    await mongoose.connect(env.MONGO_URI, connectionOptions);
  } catch (err) {
    // Production must fail fast; development falls back to in-memory so the
    // app runs without a local MongoDB install.
    if (env.isProd) throw err;
    // eslint-disable-next-line no-console
    console.warn(`⚠️  Could not reach MongoDB (${err.message}).`);
    // eslint-disable-next-line no-console
    console.warn('↪️  Falling back to in-memory MongoDB for development.');
    await startMemoryServer();
  } finally {
    connecting = false;
  }
  return mongoose;
}

/** Whether the active connection is the ephemeral in-memory server. */
function isMemoryActive() {
  return Boolean(memoryServer);
}

/**
 * Cleanly close the MongoDB connection (used on graceful shutdown / tests).
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}

module.exports = { connectDB, disconnectDB, isMemoryActive, mongoose };
