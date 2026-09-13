function paginate(req, rows, total, perPage = 15) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  return {
    data: rows,
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total,
    from: total === 0 ? null : (page - 1) * perPage + 1,
    to: total === 0 ? null : (page - 1) * perPage + rows.length,
  };
}

function sortClause(req, columns, defaultSort = 'created_at', defaultDir = 'DESC') {
  const key = Object.prototype.hasOwnProperty.call(columns, req.query.sort)
    ? req.query.sort
    : defaultSort;
  const dir =
    req.query.direction === 'asc'
      ? 'ASC'
      : String(defaultDir).toUpperCase() === 'ASC'
        ? 'ASC'
        : 'DESC';
  return ` ORDER BY ${columns[key]} ${dir}`;
}

module.exports = { paginate, sortClause };