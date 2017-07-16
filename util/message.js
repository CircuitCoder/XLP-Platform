const { Message, User } = require('../db');

const listeners = new Map();

function onMsg(rcpt, cb) {
  const rcptIdent = `${rcpt.type}:${rcpt.user}`;

  if(listeners.has(rcptIdent))
    listeners.get(rcptIdent).add(cb);
  else
    listeners.set(rcptIdent, new Set(cb));
}

function offMsg(rcpt, cb) {
  const rcptIdent = `${rcpt.type}:${rcpt.user}`;

  const s = listeners.get(rcptIdent);
  if(!s) return false;
  return s.delete(cb);
}

function messagable(operator, from) {
  return operator._id === from
    || (operator.grants.message && operator.group._id === from);
}

async function _msg(from, to, type, content) {
  const msg = new Message(Object.assign({}, content, {
    from,
    to,
    type,
    time: new Date(),
  }));

  const _id = await msg.save();

  const rcptIdent = `${to.type}:${to.user}`;
  const senderIdent = `${from.type}:${from.user}`;

  const rs = listeners.get(rcptIdent);
  if(rs)
    for(const c of s.values())
      c('in', _id, from, type, content);

  const ss = listeners.get(senderIdent);
  if(ss)
    for(const c of s.values())
      c('out', _id, from, type, content);

  return _id;
}

async function message(from, to, text) {
  return await _msg(from, to, 'text', { text });
}

async function transfer(fg, tg, qty, text) {
  return await _msg({
    type: 'Group',
    user: fg,
  }, {
    type: 'Group',
    user: tg,
  }, 'transfer', { text, qty });
}

async function file(fu, tu, file, text) {
  return await _msg({
    type: 'User',
    user: fg,
  }, {
    type: 'User',
    user: tg,
  }, 'file', { text, fild });
}

async function purchase(fg, tg, purchase) {
  return await _msg({
    type: 'Group',
    user: fg,
  }, {
    type: 'Group',
    user: tg,
  }, 'transfer', { purchase });
}

module.exports = {
  onMsg,
  offMsg,

  messagable,

  message,
  transfer,
  file,
  purchase,
}
