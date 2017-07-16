const Router = require('koa-router');

const Busboy = require('busboy');
const DevNull = require('dev-null');

const crypto = require('crypto');
const util = require('util');
const fs = require('fs');
const path = require('path');

const randomBytes = util.promisify(crypto.randomBytes);
const unlink = util.promisify(fs.unlink);

const config = require('../config');

const { File } = require('../db');
const Util = require('../util');

const router = new Router();

function getFilePath(id) {
  return path.resolve(__dirname, '..', config.file.store, `./${id}`);
}

router.get('/', async ctx => {
  const page = ctx.request.query.page || 1;

  const skip = (page - 1) * config.file.pagelen;
  const limit = config.file.pagelen;

  const search = ctx.request.query.search || '';
  const criteria = {
    user: ctx.session.user._id,
  };

  if(serach !== '') criteria['$text'] = { $search: search };

  const files = await File
    .find(criteria, {
      _id: 1,
      name: 1,
      mime: 1,
      by: 1,
      time: 1,
    })
    .skip(skip)
    .limit(limit)
    .sort({ time: -1 })
    .populate('by')
    .exec();

  ctx.body = files.toObject();
});

router.get('/:id', async ctx => {
  // Ignores name
  const id = ctx.params.id;

  // TODO: filename

  const file = await File.findById(id, {
    _id: 0,
    path: 1,
    public: 1,
    user: 1,
    mime: 1,
  }).exec();

  if(!file) return ctx.status = 404;

  // Check ownership
  if(!file.public)
    if(file.user != ctx.session.user)
      return ctx.status = 403;

  ctx.type = file.mime;
  
  const readStream = fs.createReadStream(getFilePath(file.path));
  ctx.body = readStream;
});

router.post('/', async ctx => {
  if(!ctx.request.is('multipart/*'))
    return ctx.status = 406;

  const busboy = new Busboy({ headers: ctx.request.headers });
  const file = new Promise(resolve => {
    let f;
    busboy.on('file', (fieldname, file, name, enc, mime) => {
      if(fieldname !== 'file') return file.pipe(DevNull());

      randomBytes(48).then(bytes => {
        const realname = bytes.toString('hex')
        const realpath = getFilePath(realname);

        file.pipe(fs.createWriteStream(realpath));

        f = new File({
          name,
          path: realname,
          time: new Date(),
          user: ctx.session.user._id,
          mime,
        });
      });
    });

    busboy.on('finish', () => {
      resolve(realname);
    });
  });

  if(!file)
    return ctx.status = 400;

  try {
    const _id = await file.save();
    return { success: true, _id };
  } catch(e) {
    // Rollback
    await unlink(getFilePath(file.path));
    return {
      success: false,
      err: e,
    };
  }
});

router.post('/:id/public', async ctx => {
  // Just make it public
  const file = await File.findById(ctx.params.id, {
    user: 1,
    public: 1,
  });

  if(file.user !== ctx.session.user) return ctx.status = 403;

  file.public = true;
  await file.save();

  return ctx.body = { success: true };
});

router.post('/:id/share', async ctx => {
  const file = await File.findById(ctx.params.id, {
    user: 1,
    mime: 1,
    path: 1,
    name: 1,
  });

  if(file.user !== ctx.session.user._id) return ctx.status = 403;

  const to = ctx.body.to;
  const text = ctx.body.text;
  if(text === undefined) text = "";

  const u = await User.findOne(to).select('_id').lean().exec();
  if(!u) return ctx.status = 400;

  const newfile = new File({
    user: to,
    from: file.user,
    mime: file.mime,
    path: file.path,
    name: file.name,
    time: new Date(),
  });

  const _id = await newfile.save();

  Util.Message.file(file.user, to, _id, text);
});

module.exports = router;
