const Router = require('koa-router');

const assert = require('assert');

const { Session, User } = require('../db');

const router = new Router();

router.get('/:id', async ctx => {
  // FIXME: impl
});

router.post('/:id/pass', async ctx => {
  if(ctx.params.id !== ctx.session.user._id)
    return ctx.status = 403;
  if(!ctx.request.body.pass)
    return ctx.status = 400;
  if(!ctx.request.body.new)
    return ctx.status = 400;

  const user = await User.findById(ctx.params.id).exec();

  assert(user);

  if(!user.testPasswd(ctx.request.body.pass))
    return ctx.body = { success: false, err: 'WRONG_PASS' };

  await user.setPasswd(ctx.request.body.new);
  await user.save();

  await Session.remove({ 'data.user': ctx.params.id }).exec();

  return ctx.body = { success: true };
});

router.post('/:id/membership', async ctx => {
  if(!ctx.session.user.grants.admin)
    return ctx.status = 403;

  const user = await User.findById(ctx.params.id).exec();
  if(user.group.toString() !== ctx.session.user.group._id.toString())
    return ctx.status = 403;

  const { title, grants: { message, transfer, sell, publish } } = ctx.request.body;

  const update = {
    title,
    grants: {
      admin: user.grants.admin,
      message,
      transfer,
      sell,
      publish,
    }
  };

  await user.update({ $set: update }).exec();
  return ctx.body = { success: true };
});

module.exports = router;
