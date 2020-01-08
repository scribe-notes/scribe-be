const updateFields = (fields, body, doc) => {
  fields.forEach(field => {
    if(body[field] !== undefined && (typeof body[field] !== 'string' || body[field].trim())) {
      doc[field] = body[field];
    }
  })
}

module.exports = updateFields;