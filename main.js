async function setup() {
  const config = require('./config');

  const mongoose = require('mongoose');
  mongoose.Promise = global.Promise;

  await mongoose.connect(config.db.uri, {
    useMongoClient: true,
  })

  const Koa = require('koa');
  const IO = require('socket.io');
  const KoaSession = require('koa-session');
  const KoaBodyparser = require('koa-bodyparser');

  const app = new Koa();
  const io = new IO();

  app.keys = config.web.keys;

  const routes = require('./routes');

  const { User, Session } = require('./db');

  const store = {
    async get(key, maxAge, { rolling }) {
      const sess = await Session.findOne({ _id: key }).exec();
      return sess.toObject().data;
    },

    async set(key, sess, maxAge, { rolling, changed }) {
      if(!changed) return;

      const sessObj = new Session({
        _id: key,
        data: sess,
      });

      sessObj.depopulate('data.user');
      return await Session.updateOne({ _id: key }, sessObj, { upsert: true });
    },

    async destroy(key) {
      return await Session.deleteOne({ _id: key });
    },
  }

  app.use(KoaSession({
    store,
    key: config.cookiekey
  }, app));

  app.use(KoaBodyparser());

  app.use(routes.routes()).use(routes.allowedMethods());

  app.listen(config.web.listen);

  console.log(`Server started at: ${config.web.listen}`);
};

setup();
