const process = require('process');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const config = require('../config');
const { User, Group } = require('../db');

const groups = require(process.env.INPUT);

mongoose.connect(config.db.uri, {
  useMongoClient: true,
}).then(async () => {
  for(let g of groups) {
    const group = new Group({
      name: g.name,
      balance: g.balance,
    });

    const groupSaved = await group.save();

    console.log(groupSaved);

    const gid = groupSaved._id;

    await Promise.all(Object.keys(g.members).map(uid => {
      return new Promise(resolve => {
        const user = new User({
          _id: uid,
          name: g.members[uid],
          group: gid,
        });

        console.log(user);

        if(uid === g.admin)
          user.grants.admin = true;

        user.setPasswd('123456').then(() => {
          user.save().then(resolve);
        });
      });
    }));
  }
}).then(() => {
  process.exit(0);
});
