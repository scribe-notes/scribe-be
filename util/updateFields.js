const updateFields = (fields, body, doc) => {
  fields.forEach(field => {
    if(body[field] && (typeof body[field] !== String || body[field].trim())) {
      doc[field] = body[field];
    }
  })
}

module.exports = updateFields;