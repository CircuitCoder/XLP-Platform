const { Item, Purchase } = require('../db');

async function reserve(order) {
  if(order.length < 0) throw { err: 'EMPTY_ORDER' };

  const results = await Promise.all(order.map(i =>
    Item.findByIdAndUpdate(i.item, {
      $inc: { left: -i.qty }
    }, { new: true }).select('price left group').lean().exec()
  ));

  let tot = 0;
  const errors = []
  const owner = results[0].group.toString();
  for(const [i, r] of results.entries()) {
    if(r.group.toString() !== owner) throw { err: 'NOT_SAME_OWNER' };

    if(r.left < 0) errors.push({ _id: order[i].item, left: r.left + order[i].qty });
    else tot += order[i].qty * r.price;
  }

  if(errors.length > 0) throw { err: 'NOT_ENOUGH_ITEM', items: errors };

  return { owner, tot };
}

async function rollback(order) {
  return await Promise.all(order.map(i =>
    Item.updateOne({ _id: i.item }, {
      $inc: { left: i.qty }
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

  if(errors.length > 0)
    throw { err: 'UNABLE_TO_BUY', items: errors };

  let owner, tot;
  try {
    ({ owner, tot } = await reserve(order));
  } catch(e) {
    rollback(order);
    throw e;
  }

  const purchase = new Purchase({
    group: group,
    from: owner,

    price: tot,
    items: order,
    time: new Date(),
  });

  const purchaseSaved = await purchase.save();

  return {
    price: tot,
    owner,
    _id: purchaseSaved._id,
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
