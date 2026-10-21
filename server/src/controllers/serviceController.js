import Service from "../models/Service.js";

function pickFields(body) {
  const fields = {};
  for (const key of ["name", "durationMinutes", "price", "active"]) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

export async function getServices(req, res) {
  const filter = { salon: req.salon._id };
  if (req.query.all !== "true") filter.active = true;
  const services = await Service.find(filter).sort({ name: 1 });
  res.json(services);
}

export async function getServiceById(req, res) {
  const service = await Service.findOne({ _id: req.params.id, salon: req.salon._id });
  if (!service) {
    return res.status(404).json({ message: "Servicio no encontrado" });
  }
  res.json(service);
}

export async function createService(req, res) {
  const service = await Service.create({ ...pickFields(req.body), salon: req.salon._id });
  res.status(201).json(service);
}

export async function updateService(req, res) {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, salon: req.salon._id },
    pickFields(req.body),
    { new: true, runValidators: true }
  );
  if (!service) {
    return res.status(404).json({ message: "Servicio no encontrado" });
  }
  res.json(service);
}

export async function deleteService(req, res) {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, salon: req.salon._id },
    { active: false },
    { new: true }
  );
  if (!service) {
    return res.status(404).json({ message: "Servicio no encontrado" });
  }
  res.json({ message: "Servicio desactivado" });
}