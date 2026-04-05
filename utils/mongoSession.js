const mongoose = require('mongoose');

let cachedSupportsTx = null;

/**
 * MongoDB multi-document transactions require a replica set or mongos.
 * Standalone mongod throws "Transaction numbers are only allowed on a replica set member or mongos".
 */
async function supportsMongoTransactions() {
    if (cachedSupportsTx !== null) return cachedSupportsTx;
    try {
        const db = mongoose.connection.db;
        if (!db) {
            cachedSupportsTx = false;
            return false;
        }
        let info;
        try {
            info = await db.admin().command({ hello: 1 });
        } catch {
            info = await db.admin().command({ isMaster: 1 });
        }
        cachedSupportsTx = Boolean(info.setName);
        return cachedSupportsTx;
    } catch {
        cachedSupportsTx = false;
        return false;
    }
}

function withSession(query, session) {
    return session ? query.session(session) : query;
}

module.exports = { supportsMongoTransactions, withSession };
