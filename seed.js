const config = require('./config');
const process = require('process');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

mongoose.Promise = global.Promise;

const { Group, User } = require('./db');

async function seed() {
  await mongoose.connect(config.db.uri, {
    useMongoClient: true,
  });

  const g = new Group({
    balance: 1234,
    name: '太阳科技有限公司',
    pass: 'tykj',
  });

  const gobj = await g.save();

  const u1 = new User({
    _id: 'wlj',
    group: gobj._id,
    name: '王老菊',
    grants: {
      admin: true
    },
    title: 'CEO',
  });

  await u1.setPasswd('rtrdrty');

  await u1.save();

  const u2 = new User({
    _id: 'tt',
    group: gobj._id,
    name: '兔兔',
    grants: {
      publish: true,
    },
    title: '一家之主',
  });

  await u2.setPasswd('wstt');

  await u2.save();
}

seed().then(() => {
  console.log("Complete");
}).catch(e => {
  console.error(e);
  process.exit(-1);
});
