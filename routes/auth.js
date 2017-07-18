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
    .select("name group balance grants _id title avatar pass salt")
    .populate("group", "name balance avatar")
    .exec();

  if(!user) return ctx.body = { success: false };
  if(!user.testPasswd(pass)) return ctx.body = { success: false };

  ctx.session = { user };

  const uobj = user.toObject();
  delete uobj.pass;
  delete uobj.salt;
  return ctx.body = { success: true, user: uobj };
});

router.delete('/', async ctx => {
  ctx.session = null;

  return ctx.body = { success: true };
});

module.exports = router;
