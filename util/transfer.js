const { Group } = require('../db');

async function chkpwd(group, pass) {
  const g = await Group.findById(group, {
    _id: 0,
    pass: 1,
  });

  return g.pass && g.pass === pass;
}

async function transfer(from, to, qty) {
  // Assumes TO user is there
  const fromG = await Group.findByIdAndUpdate(from, {
    $inc: { balance: -qty },
  }, { new: true }).exec();

  if(!fromG) throw { err: "FROM_NOT_FOUND" };
  else if(fromG.balance < 0) {
    // Rollback
    await fromG.update({
      $inc: { balance: qty },
    }).exec();

    throw { err: "INSUFFICIENT_FUND" };
  }

  // If there is no to user, the money just goes to nowhere
  await Group.update({ _id: to, }, {
    $inc: { balance: qty }
  }).exec();

  return;
}

module.exports = {
  chkpwd,
  transfer,
};
