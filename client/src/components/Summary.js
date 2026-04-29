function Summary({ total = 0, owe = 0, get = 0 }) {

  return (
    <div className="card summary">
      <div className="summary-card total">
        <h4>Total Expenses</h4>
        <p>₹{total}</p>
      </div>

      <div className="summary-card owe">
        <h4>You Owe</h4>
        <p>₹{owe}</p>
      </div>

      <div className="summary-card get">
        <h4>You Get</h4>
        <p>₹{get}</p>
      </div>
    </div>
  );
}

export default Summary;