const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const crypto = require('crypto');
const util = require('util');
const randomBytes = util.promisify(crypto.randomBytes);

const Group = mongoose.model('Group', {
  balance: {
    type: Number,
    required: true,
  },

  pass: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  avatar: {
    type: ObjectId,
    ref: 'File',
  }
})

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

  group: {
    type: ObjectId, 
    ref: 'Group',
  },

  grants: {
    admin: { type: Boolean, defualt: true },
    message: { type: Boolean, defualt: true },
    transfer: { type: Boolean, defualt: true },
    sell: { type: Boolean, defualt: true },
    publish: { type: Boolean, defualt: true },
  },

  title: {
    type: String,
    defaults: '成员',
  },

  avatar: {
    type: ObjectId,
    ref: 'File',
  }
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
    kind: {
      type: String,
      enum: [
        'User',
        'Group',
      ],
      required: true,
    },
    user: {
      type: String,
      refPath: 'from.kind',
      required: true,
    }
  },

  to: {
    kind: {
      type: String,
      enum: [
        'User',
        'Group',
      ],
      required: true,
    },
    user: {
      type: String,
      refPath: 'to.kind',
      required: true,
    }
  },

  type: {
    type: String,
    required: true,
    enum: [
      'transfer',
      'file',
      'text',
      'purchase',
    ],
  },

  text: String,
  file: {
    type: ObjectId,
    ref: 'File',
  },
  purchase: {
    type: ObjectId,
    ref: 'Purchase',
  },
  qty: Number,
  
  time: {
    type: Date,
    required: true,
  }
});

MessageSchema.index({
  time: -1,
});

MessageSchema.index({
  text: 'text',
});

MessageSchema.index({
  from: 'hashed',
  to: 'hashed',
});

const Message = mongoose.model('Message', MessageSchema);

const ItemSchema = new Schema({
  group: {
    type: ObjectId,
    ref: 'Group',
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  
  desc: String,

  left: Number,
  
  price: Number,

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

const Purchase = mongoose.model('Purchase', {
  group: {
    type: ObjectId,
    ref: 'Group',
    required: true,
  },

  from: {
    type: ObjectId,
    ref: 'Group',
    required: true,
  },

  items: [{
    item: {
      type: ObjectId,
      ref: 'Item',
      required: true,
    },
    qty: Number,
  }],

  time: {
    type: Date,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  state: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
});

const FileSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    required: true,
  },

  from: {
    type: String,
    ref: 'User',
  },

  name: {
    type: String,
    required: true,
  },

  mime: {
    type: String,
    required: true,
  },

  path: {
    type: String,
    required: true,
  },

  time: Date,

  public: {
    type: Boolean,
    required: true,
    default: false,
  },
});

FileSchema.index({
  name: 'text',
  time: -1,
});

FileSchema.index({
  time: -1,
});

const File = mongoose.model('File', FileSchema);

const ArticleSchema = new Schema({
  group: {
    type: ObjectId,
    ref: 'Group',
    required: true,
  },

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
  time: -1,
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

ArticleSchema.index({
  group: 'hashed',
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
  Group,
  User,
  Message,
  Item,
  File,
  Article,
  Session,
  Purchase,
};
