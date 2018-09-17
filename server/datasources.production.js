module.exports = {
  db: {
    name: 'db',
    connector: 'memory'
  },
  mongoDb: {
    url: process.env.DATABASE_URL,
    connector: 'mongodb'
  }
};
