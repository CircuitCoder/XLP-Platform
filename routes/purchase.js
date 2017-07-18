const Router = require('koa-router');

const { Item, Purchase } = require('../db');

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

  let owner, _id, price;

  try {
    ({ owner, _id, price } = await Util.Purchase.create(buyer, items));
  } catch(e) {
    if(e.err) {
      return ctx.body = { success: false, err: e.err, items: e.items };
    }
    else
      throw e;
  }

  let left;

  // Temporary
  try{
    const balances = await Util.Transfer.transfer(buyer, owner, price);
    left = balances.from;
  } catch(e) {
    if(e.err === 'INSUFFICIENT_FUND')
      Util.Purchase.cancel(_id);

    if(e.err)
      return ctx.body = { success: false, err: e.err, balance: e.balance };
    else
      throw e;
  }

  console.log(`\n${ctx.session.user.group.name} purchased:`);
  const withNames = await Promise.all(items.map(i => new Promise(resolve => {
    Item.findById(i.item).select("name").lean().exec().then(dbi => {
      i.name = dbi.name;
      resolve(i);
    });
  })));
  console.log(withNames);

  return ctx.body = { success: true, owner, _id, price, balance: left };
});

router.delete('/:id', async ctx => {
  // FIXME: impl
});

module.exports = router;
