const process = require('process');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const config = require('../config');
const { Item } = require('../db');

const items = require(process.env.INPUT);

mongoose.connect(config.db.uri, {
  useMongoClient: true,
}).then(() =>
  Promise.all(Object.keys(items).map(itemobj => new Promise(resolve => {
    const i = new Item({
      name: items[itemobj].name,
      price: items[itemobj].price,
      left: 20,
      group: process.env.OWNER,
    });

    console.log(i);

    i.save().then(resolve);
  })))
).then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(-1);
});
