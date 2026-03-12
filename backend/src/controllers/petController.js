const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// FUNCIONES BÁSICAS DEL CONTROLADOR
// ============================================

exports.getAllPets = async (req, res) => {
  try {
    const { species, gender, size, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (species) filter.species = species.toLowerCase();
    if (gender) filter.gender = gender.toLowerCase();
    if (size) filter.size = size.toLowerCase();
    if (status) filter.status = status;

    const pets = await Pet.find(filter)
      .populate('owner', 'nombre name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Pet.countDocuments(filter);

    res.json({
      success: true,
      data: pets,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al obtener mascotas' });
  }
};

exports.searchPets = async (req, res) => {
  try {
    const { q } = req.query;
    const pets = await Pet.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { breed: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('owner', 'nombre name email avatar')
    .sort({ createdAt: -1 });

    res.json({ success: true, data: pets });
  } catch (error) {
    console.error('Error al buscar mascotas:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al buscar mascotas' });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'nombre name email avatar');
    if (!pet) return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('Error al obtener mascota:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al obtener mascota' });
  }
};

exports.getPetsByShelterId = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.params.shelterId })
      .populate('owner', 'nombre name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pets });
  } catch (error) {
    console.error('Error al obtener mascotas del refugio:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al obtener mascotas' });
  }
};

exports.createPet = async (req, res) => {
  try {
    const petData = { ...req.body, owner: req.user.id, status: 'disponible' };
    const pet = await Pet.create(petData);
    res.status(201).json({ success: true, data: pet, message: 'Mascota creada exitosamente' });
  } catch (error) {
    console.error('Error al crear mascota:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Error de validación', errors });
    }
    res.status(500).json({ success: false, message: error.message || 'Error al crear mascota' });
  }
};

exports.updatePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pet) return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    res.json({ success: true, data: pet, message: 'Mascota actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al actualizar mascota' });
  }
};

exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    res.json({ success: true, message: 'Mascota eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al eliminar mascota' });
  }
};

// ============================================
// ADOPCIÓN - MULTER CON SOPORTE DE VIDEO ✅
// ============================================

const uploadsDir = path.join(__dirname, '../../uploads/pets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/pets/'); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ FIX: acepta imágenes Y video, con límites distintos por tipo
const uploadMixed = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo (cubre videos)
  },
  fileFilter: function (req, file, cb) {
    const allowedImages = /jpeg|jpg|png|gif|webp/;
    const allowedVideos = /mp4|webm|ogg|mov|avi/;

    if (file.mimetype.startsWith('image/')) {
      const ext = allowedImages.test(path.extname(file.originalname).toLowerCase());
      const mime = allowedImages.test(file.mimetype.replace('image/', ''));
      if (ext && mime) return cb(null, true);
      return cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, GIF o WEBP'));
    }

    if (file.mimetype.startsWith('video/')) {
      const ext = allowedVideos.test(path.extname(file.originalname).toLowerCase());
      if (ext || file.mimetype.startsWith('video/')) return cb(null, true);
      return cb(new Error('Formato de video no permitido. Usa MP4, WEBM o MOV'));
    }

    cb(new Error('Tipo de archivo no permitido'));
  }
}).fields([
  { name: 'imagenes', maxCount: 5 }, // ✅ hasta 5 imágenes
  { name: 'video', maxCount: 1 }     // ✅ hasta 1 video
]);

exports.getMascotasEnAdopcion = async (req, res) => {
  try {
    const pets = await Pet.find({ status: "disponible" })
      .sort({ createdAt: -1 })
      .populate("owner", "nombre name email avatar");

    console.log('✅ Mascotas en adopción encontradas:', pets.length);
    return res.json({ success: true, data: pets });
  } catch (error) {
    console.error('❌ Error al obtener mascotas:', error);
    return res.status(500).json({ success: false, message: error.message || "Error al obtener mascotas en adopción" });
  }
};

exports.publicarMascotaAdopcion = async (req, res) => {
  // ✅ FIX: usa uploadMixed en vez de upload
  uploadMixed(req, res, async function (err) {
    if (err) {
      console.error('❌ Error al subir archivos:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const {
        nombre, tipo, raza, edad, sexo, tamano,
        descripcion, vacunado, esterilizado, ubicacion, telefono
      } = req.body;

      // ✅ req.files ahora es un objeto: { imagenes: [...], video: [...] }
      const imageFiles = req.files?.imagenes || [];
      const videoFile  = req.files?.video?.[0] || null;

      console.log('📝 Datos recibidos:', {
        nombre, tipo, edad,
        imagenes: imageFiles.length,
        video: videoFile ? videoFile.filename : 'ninguno'
      });

      if (!nombre || !tipo || !edad) {
        return res.status(400).json({ success: false, message: 'Nombre, tipo y edad son obligatorios' });
      }

      if (imageFiles.length === 0) {
        return res.status(400).json({ success: false, message: 'Debes subir al menos una foto de la mascota' });
      }

      // ✅ Validar tamaño de imágenes individualmente (máx 5MB c/u)
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: `La imagen "${file.originalname}" supera 5MB`
          });
        }
      }

      const photos   = imageFiles.map(f => `/uploads/pets/${f.filename}`);
      const mainPhoto = photos[0];
      const videoUrl = videoFile ? `/uploads/pets/${videoFile.filename}` : null;

      // Parsear edad
      let ageValue = 0;
      let ageUnit  = 'años';
      if (typeof edad === 'string') {
        const num = parseInt(edad, 10);
        if (!isNaN(num)) ageValue = num;
        if (edad.toLowerCase().includes('mes')) ageUnit = 'meses';
      } else if (typeof edad === 'number') {
        ageValue = edad;
      }

      const finalDescription = descripcion && descripcion.trim().length >= 20
        ? descripcion.trim()
        : `${nombre} busca un hogar amoroso. ${descripcion || 'Es una mascota maravillosa que merece una segunda oportunidad.'} Contáctanos para conocerle.`.trim();

      const nuevaMascota = await Pet.create({
        name: nombre,
        species: (tipo || 'otro').toLowerCase(),
        breed: raza || 'Mestizo',
        age: { value: ageValue, unit: ageUnit },
        gender: sexo ? sexo.toLowerCase() : 'desconocido',
        size: tamano ? tamano.toLowerCase() : 'mediano',
        description: finalDescription,
        healthInfo: {
          vaccinated: vacunado === 'true' || vacunado === true,
          sterilized: esterilizado === 'true' || esterilizado === true,
        },
        location: {
          country: 'Colombia',
          city: ubicacion || 'No especificada',
        },
        contactInfo: { phone: telefono || '' },
        photos,
        mainPhoto,
        video: videoUrl, // ✅ guarda la URL del video
        owner: req.user.id,
        status: 'disponible',
      });

      console.log('✅ Mascota creada:', nuevaMascota._id, videoUrl ? '(con video)' : '(sin video)');
      res.status(201).json({
        success: true,
        data: nuevaMascota,
        message: 'Mascota publicada exitosamente en adopción'
      });

    } catch (error) {
      console.error('❌ Error al crear mascota:', error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: 'Error de validación', errors });
      }
      res.status(500).json({ success: false, message: error.message || 'Error al publicar mascota' });
    }
  });
};

// ============================================
// SOLICITUDES DE ADOPCIÓN
// ============================================

exports.solicitarAdopcion = async (req, res) => {
  try {
    const { message } = req.body;
    const petId = req.params.id;
    const applicantId = req.user.id;

    const pet = await Pet.findById(petId).populate('owner', 'nombre name email');
    if (!pet) return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    if (pet.status !== 'disponible') return res.status(400).json({ success: false, message: 'Esta mascota ya no está disponible para adopción' });

    const ownerId = pet.owner._id?.toString() || pet.owner.toString();
    if (ownerId === applicantId.toString()) {
      return res.status(400).json({ success: false, message: 'No puedes solicitar adoptar tu propia mascota' });
    }

    const existing = await AdoptionRequest.findOne({ pet: petId, applicant: applicantId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya enviaste una solicitud para esta mascota', data: existing });
    }

    const solicitud = await AdoptionRequest.create({
      pet: petId,
      applicant: applicantId,
      owner: ownerId,
      message: message || `Estoy interesado en adoptar a ${pet.name}.`
    });

    await solicitud.populate([
      { path: 'pet', select: 'name species mainPhoto photos' },
      { path: 'applicant', select: 'nombre name email avatar' }
    ]);

    console.log(`✅ Solicitud de adopción creada: ${solicitud._id} para mascota ${pet.name}`);
    res.status(201).json({
      success: true,
      message: `Solicitud enviada exitosamente para adoptar a ${pet.name}`,
      data: solicitud
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya enviaste una solicitud para esta mascota' });
    }
    console.error('❌ Error al crear solicitud:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al enviar solicitud' });
  }
};

exports.getMisSolicitudes = async (req, res) => {
  try {
    const solicitudes = await AdoptionRequest.find({ applicant: req.user.id })
      .populate('pet', 'name species mainPhoto photos status location')
      .populate('owner', 'nombre name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: solicitudes });
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSolicitudesRecibidas = async (req, res) => {
  try {
    const solicitudes = await AdoptionRequest.find({ owner: req.user.id })
      .populate('pet', 'name species mainPhoto photos status')
      .populate('applicant', 'nombre name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: solicitudes });
  } catch (error) {
    console.error('❌ Error al obtener solicitudes recibidas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.responderSolicitud = async (req, res) => {
  try {
    const { status, ownerResponse } = req.body;
    if (!['aceptada', 'rechazada'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido. Usa "aceptada" o "rechazada"' });
    }

    const solicitud = await AdoptionRequest.findById(req.params.requestId)
      .populate('pet')
      .populate('applicant', 'nombre name email');

    if (!solicitud) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    if (solicitud.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para responder esta solicitud' });
    }

    solicitud.status = status;
    solicitud.ownerResponse = ownerResponse || '';
    solicitud.respondedAt = new Date();
    await solicitud.save();

    if (status === 'aceptada') {
      await Pet.findByIdAndUpdate(solicitud.pet._id, { status: 'en-proceso' });
    }

    console.log(`✅ Solicitud ${solicitud._id} ${status}`);
    res.json({ success: true, message: `Solicitud ${status} correctamente`, data: solicitud });

  } catch (error) {
    console.error('❌ Error al responder solicitud:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelarSolicitud = async (req, res) => {
  try {
    const solicitud = await AdoptionRequest.findById(req.params.requestId);
    if (!solicitud) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    if (solicitud.applicant.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta solicitud' });
    }
    if (solicitud.status !== 'pendiente') {
      return res.status(400).json({ success: false, message: 'Solo puedes cancelar solicitudes pendientes' });
    }
    await AdoptionRequest.findByIdAndDelete(req.params.requestId);
    res.json({ success: true, message: 'Solicitud cancelada correctamente' });
  } catch (error) {
    console.error('❌ Error al cancelar solicitud:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;