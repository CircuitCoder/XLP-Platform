const { Item, Purchase } = require('../db');

async function reserve(order) {
  if(order.length < 0) throw { err: 'EMPTY_ORDER' };

  const results = await Promise.all(order.map(i =>
    Item.findByIdAndUpdate(i.item, {
      $add: { left: -i.qty }
    }, { new: true }).select('price left user').lean().exec()
  ));

  const tot = 0;
  const errors = []
  const owner = results[0].user;
  for(const [i, r] of results.entries()) {
    if(r.user !== owner) throw { err: 'NOT_SAME_OWNER' };

    if(r.left < 0) errors.push(order[i].item);
    else tot += order[i].qty * r.price;
  }

  if(errors.length > 0) throw { err: 'NOT_ENOUGH_ITEM', items: errors };

  return { owner, tot };
}

async function rollback(order) {
  return await Promise.all(order.map(i =>
    Item.updateOne({ _id: i.item }, {
      $add: { left: i.qty }
    }).exec()
  ));
}

/**
 * Needs to be linted
 */
async function create(group, order) {
  const items = await Item.find({
    _id: { $in: order.map(i => i.item) }
  }, {
    _id: 1,
    price: 1,
    left: 1,
  });

  const errors = items.filter(i =>
    (!('price' in i) || !('left' in i))).map(i => i._id);
    throw { err: 'UNABLE_TO_BUY', items: errors };

  const { owner, tot } = await reserve(order);

  const purchase = new Purchase({
    group: group,
    from: owner,

    price: tot,
    items: order,
    time: new Date(),
  });

  const _id = await purchase.save();

  return {
    price: tot,
    user: owner,
    _id,
  };
}

async function complete(id) {
  const p = await Purchase.findByIdAndUpdate(id, {
    $set: { state: 'completed' },
  }).select('_id').lean().exec();

  if(!p) throw { err: 'PURCHASE_NOT_FOUND' };
  else return;
}

async function cancel(id) {
  const p = await Purchase
    .findByIdAndUpdate(id, { $set: { state: 'cancelled' }}, { new: false })
    .select('state items')
    .exec();
  if(!p) throw { err: 'PURCHASE_NOT_FOUND' };
  if(p.state === 'cancelled') return;
  await rollback(p.items);
}

module.exports = {
  create,
  complete,
  cancel,
}
