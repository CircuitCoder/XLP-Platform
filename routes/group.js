const Router = require('koa-router');

const { Group, User } = require('../db');

const router = new Router();

router.get('/:id', async ctx => {
  // FIXME: impl
});

router.get('/:id/detail', async ctx => {
  if(ctx.params.id !== ctx.session.user.group._id.toString())
    return ctx.status = 403;
  if(!ctx.session.user.grants.admin)
    return ctx.status = 403;

  const group = await Group.findById(ctx.params.id).select('-_id name').lean().exec();

  const members = await User.find({
    group: ctx.params.id
  })
    .select("title grants name _id avatar")
    .lean()
    .exec();

  return ctx.body = {
    group,
    members,
  }
});

router.post('/:id/name', async ctx => {
  if(ctx.params.id !== ctx.session.user.group._id.toString())
    return ctx.status = 403;
  if(!ctx.session.user.grants.admin)
    return ctx.status = 403;

  if(!ctx.request.body.name)
    return ctx.status = 400;

  const g = await Group
    .updateOne(ctx.params.id, { $set: { name: ctx.request.body.name.toString() }})
    .exec();

  return ctx.body = { success: true };
});

router.post('/:id/pass', async ctx => {
  if(ctx.params.id !== ctx.session.user.group._id.toString())
    return ctx.status = 403;
  if(!ctx.session.user.grants.admin)
    return ctx.status = 403;

  const g = await Group
    .findById(ctx.params.id)
    .select('_id pass')
    .exec();

  let matched = false;
  if(g.pass === undefined) matched = ctx.body.original === '';
  else matched = g.pass === ctx.request.body.original

  if(!matched)
    return ctx.body = { success: false, err: 'PASS_MISMATCH' };

  const np = ctx.request.body.pass;
  if(np.indexOf(' ') !== -1 || np.length === 0)
    return ctx.body = { success: false, err: 'WRONG_FORMAT' };

  g.pass = np;
  await g.save();

  return ctx.body = { success: true };
});

module.exports = router;
