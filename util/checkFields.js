const checkFields = (requiredFields, body) => {
  let error;
  requiredFields.forEach(field => {
    if(!body[field] || (typeof body[field] === String && !body[field].trim())) {
      error = `The '${field}' field is required!`;
    }
  })
  return error;
}

module.exports = checkFields;