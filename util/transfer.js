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
  }, { new: true }).select('balance').exec();

  if(!fromG) throw { err: "FROM_NOT_FOUND" };
  else if(fromG.balance < 0) {
    // Rollback
    await fromG.update({
      $inc: { balance: qty },
    }).exec();

    throw { err: "INSUFFICIENT_FUND", balance: fromG.balance + qty };
  }

  // If there is no to group or its balance is undefined, the money just goes to nowhere
  const toG = await Group.findByIdAndUpdate(to, {
    $inc: { balance: qty }
  }, { new: true }).select('balance').exec();

  return { from: fromG.balance, toG: to.balance };
}

module.exports = {
  chkpwd,
  transfer,
};
