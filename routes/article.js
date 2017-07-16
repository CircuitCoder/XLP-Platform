const Router = require('koa-router');

const config = require('../config');

const { Article } = require('../db');

const router = new Router();

router.get('/', async ctx => {
  const page = ctx.request.query.page || 1;
  const search = ctx.request.query.search;

  /* Only */
  const official = ctx.request.query.official || false;
  // TODO: pinned?

  const pagelen = pinned ? config.article.pinnedlen : config.article.pagelen;

  const skip = (page - 1) * pagelen;
  const limit = pagelen;

  const criteria = { };
  if(search) criteria['$text'] = { $search: search };
  if(official) criteria.group = { $in: config.article.officials };

  const articles = await Article
    .find(criteria, {
      group: 1,
      _id: 1,
      title: 1,
      time: 1,
    })
    .sort({ time: -1 })
    .skip(skip)
    .limit(limit)
    .populate("group", "_id name")
    .lean()
    .exec();

  return ctx.body = articles;
});

router.get('/:id', async ctx => {
  const id = ctx.params.id;

  const article = await Article.findById(id, {
    group: 1,
    title: 1,
    content: 1,
    time: 1,
    _id: 0,
  }).populate("group", "_id name").lean().exec();

  if(!article) return ctx.status = 404;
  return ctx.body = article;
});

router.post('/', async ctx => {
  if(!ctx.session.user.grants.publish)
    return ctx.status = 403;

  const title = ctx.body.title;
  const content = ctx.content.title;

  if(!title || !content)
    return ctx.status = 400;

  const art = new Article({
    group: ctx.session.user.group._id,
    title, content,
    time: new Date(),
  });

  const _id = await art.save();
  return ctx.body = { success: true, _id };
});

module.exports = router;
