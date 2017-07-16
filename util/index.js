function isPaymentSufficient(paid, price) {
  return paid >= price - 0.01; // Considered sufficient
}

module.exports = {
  Transfer: require('./transfer'),
  Message: require('./message'),
  Purchase: require('./purchase'),
  Misc: {
    isPaymentSufficient,
  }
};
