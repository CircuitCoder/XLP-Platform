const Router = require('koa-router');
const crypto = require('crypto');

const { User } = require('../db');

const router = new Router();

router.get('/', async ctx => {
  if(!ctx.session.user) return ctx.body = {};

  const user = await User.findOne({ _id: ctx.session.user })
    .select("name isGroup group -_id")
    .populate("group")
    .exec();
  ctx.body = user.toObject();
});

router.post('/login', async ctx => {
  const { username, pass } = ctx.request.body;
  if(!username || !pass) return ctx.status = 400;

  const user = await User.findOne({ _id: username }).exec();
  if(!user) return ctx.body = { success: false };
  if(!user.validate(pass)) return ctx.body = { success: false };

  ctx.session = { user };
  return ctx.body = { success: true };
});

router.get('/logout', async ctx => {
  ctx.session = null;

  return ctx.body = { success: true };
});

router.post('/new', async ctx => {
  const u = new User({
    name: ctx.request.body.name,
    _id: ctx.request.body.username,
    isGroup: false,
  });

  await u.setPasswd(ctx.request.body.pass);
  await u.save();

  return ctx.body = 'Done';
});

module.exports = router;
