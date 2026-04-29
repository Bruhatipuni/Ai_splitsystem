async function getAISplitSuggestion(title, amount) {
  const splitAmount = amount / 3;

  return JSON.stringify([
    { name: "A", amount: splitAmount },
    { name: "B", amount: splitAmount },
    { name: "C", amount: splitAmount }
  ]);
}

module.exports = { getAISplitSuggestion };