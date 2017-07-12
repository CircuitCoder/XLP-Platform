const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const crypto = require('crypto');
const util = require('util');
const randomBytes = util.promisify(crypto.randomBytes);

const UserSchema = new Schema({
  _id: String,

  name: {
    type: String,
    required: true,
  },

  pass: {
    type: String,
    required: true,
  },

  salt: {
    type: String,
    required: true,
  },

  isGroup: {
    type: Boolean,
    required: true,
  },

  balance: Number,

  /* For users */

  group: {
    type: String, 
    ref: 'User',
  },

  grants: {
    message: Boolean,
    transfer: Boolean,
    sell: Boolean,
  },
});

UserSchema.methods.setPasswd = async function(unhashed) {
  const result = await randomBytes(32)
  this.salt = result.toString('hex');
  this.pass = crypto.createHmac('sha256', 'xlp').update(unhashed + this.salt).digest('hex');
}

UserSchema.methods.testPasswd = function(unhashed) {
  const hashed = crypto.createHmac('sha256', 'xlp').update(unhashed + this.salt).digest('hex');
  return hashed === this.pass;
};

const User = mongoose.model('User', UserSchema);

const MessageSchema = new Schema({
  from: {
    type: String,
    ref: 'User',
    required: true,
  },

  to: {
    type: String,
    ref: 'User',
    required: true,
  },

  type: {
    type: String,
    required: true,
    enum: [
      'transfer',
      'file',
      'text',
    ],
  },

  text: String,
  fileRef: {
    type: ObjectId,
    ref: 'File',
  },
  transQTY: Number,
  
  time: {
    type: Date,
    required: true,
  }
});

MessageSchema.index({
  from: 'hashed',
  to: 'hashed',
  text: 'text',
  time: -1,
});

MessageSchema.index({
  from: 'hashed',
  to: 'hashed',
});

const Message = mongoose.model('Message', MessageSchema);

const ItemSchema = new Schema({
  owner: {
    type: String,
    ref: 'User',
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  
  desc: {
    type: String,
    required: true,
  },

  left: Number,

  pics: [{
    type: ObjectId,
    ref: 'File',
  }],
});

ItemSchema.index({
  title: 'text',
  desc: 'text',
}, {
  weights: {
    title: 10,
    desc: 5,
  }
});

const Item = mongoose.model('Item', ItemSchema);

const FileSchema = new Schema({
  owner: {
    type: String,
    ref: 'User',
    required: true,
  },

  allowed: [{
    type: String,
    ref: 'User',
  }],

  name: {
    type: String,
    required: true,
  },

  mime: {
    type: String,
    required: true,
  },

  time: {
    type: Date,
    required: true,
  },

  path: {
    type: String,
    required: true,
  },
});

FileSchema.index({
  name: 'text',
  time: -1,
});

const File = mongoose.model('File', FileSchema);

const ArticleSchema = new Schema({
  /* Must be posted by admin */
  time: {
    type: Date,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  content: {
    type: String, /* Markdown */
    required: true,
  }
});

ArticleSchema.index({
  title: 'text',
  content: 'text',
}, {
  weight: {
    title: 10,
    content: 5,
  }
});

const Article = mongoose.model('Article', ArticleSchema);

const Session = mongoose.model('Session', {
  _id: String,

  data: {
    user: {
      type: String,
      ref: 'User',
    },
  },
});

module.exports = {
  User,
  Message,
  Item,
  File,
  Article,
  Session,
};
