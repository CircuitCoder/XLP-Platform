const Router = require('koa-router');

const { User } = require('../db');

const router = new Router();

router.get('/', async ctx => {
  if(!ctx.session.user) return ctx.body = {};

  return ctx.body = await User.findById(ctx.session.user)
    .select("name group balance grants _id title avatar")
    .populate("group", "name balance avatar")
    .lean()
    .exec();
});

router.post('/', async ctx => {
  const { username, pass } = ctx.request.body;
  if(!username || !pass) return ctx.status = 400;

  const user = await User.findById(username)
    .select("name group balance grants _id title avatar")
    .populate("group", "name balance avatar")
    .exec();

  if(!user) return ctx.body = { success: false };
  if(!user.validate(pass)) return ctx.body = { success: false };

  ctx.session = { user };
  return ctx.body = { success: true, user: user.toObject() };
});

router.delete('/', async ctx => {
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
