const Router = require('koa-router');

const router = new Router();

const auth = require('./auth');

router
  .use('/auth', auth.routes())
  .use('/auth', auth.allowedMethods());

// Need to login for all remaining routes
router.use(async (ctx, next) => {
  if(!ctx.session || !ctx.session.user)
    return ctx.status = 403;
  return await next();
});

const user = require('./user');

router
  .use('/user', user.routes())
  .use('/user', user.allowedMethods());

const group = require('./group');

router
  .use('/group', group.routes())
  .use('/group', group.allowedMethods());

const file = require('./file');

router
  .use('/file', file.routes())
  .use('/file', file.allowedMethods());

const article = require('./article');

router
  .use('/article', article.routes())
  .use('/article', article.allowedMethods());

const item = require('./item');

router
  .use('/item', item.routes())
  .use('/item', item.allowedMethods());

const transfer = require('./transfer');

router
  .use('/transfer', transfer.routes())
  .use('/transfer', transfer.allowedMethods());

const purchase = require('./purchase');

router
  .use('/purchase', purchase.routes())
  .use('/purchase', purchase.allowedMethods());

/*
const message = require('./message');

router
  .use('/message', message.routes())
  .use('/message', message.allowedMethods());

*/

module.exports = router;
