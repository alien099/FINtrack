import "../styles/DateRangeFilter.css";

function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange
}) {
  return (
    <div className="date-filter">

      <div className="date-group">
        <label>С</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>

      <div className="date-group">
        <label>По</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>

    </div>
  );
}

export default DateRangeFilter;