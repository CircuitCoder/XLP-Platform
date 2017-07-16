const config = require('./config');

const Koa = require('koa');
const IO = require('socket.io');
const KoaSession = require('koa-session');
const KoaBodyparser = require('koa-bodyparser');
const KCORS = require('kcors');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const process = require('process');

const app = new Koa();
const io = new IO();

app.keys = config.web.keys;

const routes = require('./routes');

const { User, Group, Session } = require('./db');

const store = {
  async get(key, maxAge, { rolling }) {
    let sess = await Session
      .findById(key)
      .populate("data.user", "_id group grants")
      .exec();
    if(!sess) return null;
    sess.data.user = await sess.data.user
      .populate({ path: "group", select: "_id name" })
      .execPopulate();
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

app.use(KCORS({
  credentials: true,
}));

app.use(KoaSession({
  store,
  key: config.cookiekey
}, app));

app.use(KoaBodyparser());

app.use(routes.routes()).use(routes.allowedMethods());

/* Bootstrap */

mongoose.connect(config.db.uri, {
  useMongoClient: true,
}).then(() => {
  app.listen(config.web.listen);
  console.log(`Server started at: ${config.web.listen}`);
}).catch(e => {
  console.error(e);
  process.exit(-1);
});
