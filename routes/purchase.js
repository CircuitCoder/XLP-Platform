const Router = require('koa-router');

const { Purchase } = require('../db');

const Util = require('../util');

const router = new Router();

router.post('/', async ctx => {
  const items = ctx.request.body.items;
  const buyer = ctx.session.user.group._id;

  if(!buyer
    || !Array.isArray(items)
    || items.some(k => !k.item
      || !k.qty
      || !Number.isInteger(k.qty)
      || k.qty <= 0
      || (typeof k.item !== 'string' && !(k.item instanceof String))))
    return ctx.status = 400;

  const { user, _id, price } = await Util.Purchase.create(buyer, items);

  return ctx.body = { user, _id, price };
});

router.delete('/:id', async ctx => {
  // FIXME: impl
});

module.exports = router;
