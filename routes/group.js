const Router = require('koa-router');

const { User } = require('../db');

const router = new Router();

router.get('/:id', async ctx => {
  // FIXME: impl
});

router.get('/:id/member/detail', async ctx => {
  if(ctx.params.id !== ctx.session.user.group._id.toString())
    return ctx.status = 403;
  if(!ctx.session.user.grants.admin)
    return ctx.status = 403;

  return ctx.body = await User.find({
    group: ctx.params.id
  })
    .select("title grants name _id avatar")
    .lean()
    .exec();
});

module.exports = router;
