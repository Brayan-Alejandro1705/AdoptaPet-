import express from "express";
import Ajustes from "../models/Ajustes.js";
import auth from "../middleware/auth.js"; // middleware de autenticación

const router = express.Router();


// ⭐ GET → Obtener configuración del usuario
router.get("/", auth, async (req, res) => {
  try {
    let ajustes = await Ajustes.findOne({ userId: req.user.id });

    // Si no existen, creamos un documento con valores default
    if (!ajustes) {
      ajustes = await Ajustes.create({ userId: req.user.id });
    }

    res.json(ajustes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ajustes" });
  }
});


// ⭐ PUT → Guardar cambios
router.put("/", auth, async (req, res) => {
  try {
    const ajustesActualizados = await Ajustes.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true }
    );

    res.json({ ok: true, ajustes: ajustesActualizados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar ajustes" });
  }
});


export default router;
