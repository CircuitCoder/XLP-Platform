const Router = require('koa-router');

const config = require('../config');

const { Item } = require('../db');

const router = new Router();

router.get('/', async ctx => {
  const official = ctx.request.query.official;
  const search = ctx.request.query.search;
  const page = ctx.request.query.page || 1;
  const all = ctx.request.query.all || false;

  const criteria = { };
  if(official) criteria.group = { $in: config.item.officials };

  if(!all) criteria.left = { $not: 0 };

  if(serach) criteria['$text'] = { $search: search };

  const skip = (page - 1) * config.item.pagelen;
  const limit = config.item.pagelen;

  const items = await Item.find(criteria, {
    _id: 1,
    name: 1,
    price: 1,
    'pics.0': 1,
  })
  .sort({ time: -1, })
  .skip(skip)
  .limit(limit)
  .lean()
  .exec();

  return ctx.body = items.toObject();
});

router.post('/', async ctx => {
  if(!ctx.session.user.grants.sell)
    return ctx.status = 403;

  const group = ctx.body.user.group._id;

  const _id = await new Item({
    name: ctx.body.name,
    group,
  }).save();

  return ctx.body = { success: true, _id };
});

router.put('/:id', async ctx => {
  if(!ctx.session.user.grants.sell)
    return ctx.status = 403;

  const item = await Item.findById(ctx.parmas.id);

  if(ctx.session.user.group._id != item.group)
    return ctx.status = 403;

  if(ctx.body.group) delete ctx.body.group;

  // TODO: anti injection

  await item.update({ $set: ctx.body }).exec();

  return ctx.body = { success: true };
});

router.get('/:id', async ctx => {
  const item = await Item.findById(ctx.params.id, {
    group: 1,
    name: 1,
    desc: 1,
    price: 1,
    left: 1,
    pics: 1,
  })
    .populate("group", "_id name")
    .lean()
    .exec();

  if(!item) return ctx.status = 404;

  else return ctx.body = item;
});

module.exports = router;
