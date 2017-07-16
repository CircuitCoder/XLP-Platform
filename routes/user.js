const Router = require('koa-router');

const { User } = require('../db');

const router = new Router();

router.get('/:id', async ctx => {
  // FIXME: impl
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
