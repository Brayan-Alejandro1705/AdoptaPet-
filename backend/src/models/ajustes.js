import mongoose from "mongoose";

const AjustesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  privacidadPorDefecto: { type: String, default: "publico" },
  permitirComentarios: { type: Boolean, default: true },
  permitirCompartir: { type: Boolean, default: true },
  guardarBorradores: { type: Boolean, default: true },
  ocultarLikes: { type: Boolean, default: false },
  archivarAutomatico: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Ajustes", AjustesSchema);
