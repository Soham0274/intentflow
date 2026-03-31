const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Rely on global error handler to catch and format ZodError
    return next(result.error);
  }

  // Replace req.body with parsed/strongly-typed data
  req.body = result.data;
  next();
};

module.exports = validate;