const Router = require('koa-router');

const Util = require('../util');

const { Purchase } = require('../db');

const router = new Router();

router.get('/', async ctx => {
  // FIXME: impl
});

router.get('/:id', async ctx => {
  // FIXME: impl
});

router.post('/', async ctx => {
  if(!ctx.session.user.grants.transfer)
    return ctx.status = 403;
  const payer = ctx.session.user.group._id;
  const payee = ctx.request.body.payee;
  const qty = ctx.request.body.qty;
  const pass = ctx.request.body.pass;

  if(!Number.isFinite(qty) || qty <= 0 || !payee)
    return ctx.status = 400;

  const text = `${ctx.request.body.text}`;
  const purchase = ctx.request.body.purchase;

  if(!await Util.Transfer.chkpwd(payer, pass))
    return ctx.status = 403;

  try {
    await Util.Transfer.transfer(payer, payee, qty);
  } catch(e) {
    return ctx.body = {
      success: false,
      err: e
    };
  }

  if(purchase) {
    const p = await Purchase.findById(purchase).select("user price from");
    if(p.user !== payer) return ctx.status = 403;
    if(p.from !== payee) return ctx.status = 403;

    if(Util.Misc.isPaymentSufficient(qty, p.price)) {
      // Resolve now
      await Util.Purchase.complete(p._id);
      await Util.Message.purchase(payer, payee, p._id);
      return ctx.body = {
        success: true,
      };
    }
  }

  // Else: not a valid purchase resolve
  await Util.Message.transfer(payer, payee, qty, text);

  return ctx.body = {
    success: true,
  };

  // TODO: maybe? generate a code for payer and payee
});

module.exports = router;
