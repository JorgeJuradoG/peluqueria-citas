export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  // Error de validación de Mongoose (campo requerido, min, enum...)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Datos inválidos", errors });
  }

  // Id con formato incorrecto (no es un ObjectId válido)
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Identificador inválido" });
  }

  // Valor duplicado en un campo unique (por ejemplo, email repetido)
  if (err.code === 11000) {
    return res.status(409).json({ message: "Ya existe un registro con ese valor" });
  }

  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
}