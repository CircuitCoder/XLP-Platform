const Router = require('koa-router');

const router = new Router();

const auth = require('./auth');

router
  .use('/auth', auth.routes())
  .use('/auth', auth.allowedMethods());

router.get('/', async ctx => {
});

module.exports = router;
