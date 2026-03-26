require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Modelo compatible con free tier
// Modelos disponibles: "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"
const MODEL = "gemini-2.5-flash";

// =====================================================
// HELPER: Convertir URL a Base64
// =====================================================
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('Error al descargar imagen:', error);
    throw error;
  }
}

// =====================================================
// HELPER: Detectar si el usuario da su nombre
// =====================================================
function extractUserName(message) {
  // Patrones comunes: "soy [nombre]", "me llamo [nombre]", "mi nombre es [nombre]"
  const patterns = [
    /(?:soy|me llamo|mi nombre es)\s+([A-Za-záéíóúÁÉÍÓÚñÑ]+)/i,
    // NO detectar nombres solos de una palabra - muy propenso a falsos positivos
  ];

  for (const pattern of patterns) {
    const match = message.trim().match(pattern);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }

  return null;
}

// =====================================================
// 1. CHATBOT DE ASESORAMIENTO ANIMAL
// =====================================================
async function chatbotAnimalAdvisor(message, petType = null, userName = null, messageCount = 0) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    // Detectar si el usuario proporciona su nombre en este mensaje
    const detectedName = extractUserName(message);
    const finalUserName = detectedName || userName;

    // messageCount > 1 significa que NO es el primer mensaje del usuario
    const isFirstMessage = messageCount <= 1;

    const contextPet = petType ? `\nTipo de mascota: ${petType}` : '';

    // CONSTRUIR PROMPT BASADO EN SI ES PRIMER MENSAJE O NO
    let prompt;
    
    if (isFirstMessage) {
      // PRIMER MENSAJE: Puedes saludar
      prompt = `Eres Simon Bot 🐾, el asistente oficial y amigable de AdoptaPet.
Tu personalidad es cálida, cercana y profesional.
Usas emojis con moderación (máximo 1-2).

${finalUserName ? `El usuario se llama ${finalUserName}. Úsalo para dirigirte a él.` : ''}

Puedes ayudar con:
1. CUIDADO ANIMAL: salud, alimentación, comportamiento de mascotas.
   - Para emergencias médicas, recomienda visitar un veterinario.
2. USO DE ADOPTAPET:

ACCESO Y CUENTA:
- Iniciar sesión: correo y contraseña, o continuar con Google.
- Contraseña olvidada: clic en "Recupérala aquí".
- Cuenta nueva: clic en "Regístrate" (nombre, correo, contraseña mín. 6 caracteres).
- Funciona en navegadores (Chrome, Firefox, Edge, Safari) - celular, computador, tableta.

MÓDULOS:
- Inicio: publicaciones recientes, likes, comentarios, compartir.
- Adoptar: mascotas con filtros (tipo, tamaño, edad, vacunación, esterilización). Clic en "Ver detalles".
- Publicar: mensajes, fotos, videos. Adjuntar con "Foto/Video" y clic "Publicar".
- Crear Adopción: formulario (nombre, edad, tamaño, descripción, vacunación, esterilización, foto).
- Amigos: seguidos, solicitudes de amistad, sugerencias.
- Favoritos: publicaciones y mascotas guardadas.
- Ajustes: Cuenta (contraseña/desactivar), Notificaciones, Publicaciones, Etiquetado.
- Mensajes/Chat: solo con amigos.
- Notificaciones: likes, comentarios, solicitudes.
- Mi Perfil: editar foto, nombre, descripción. Eliminar publicación: 3 puntitos > "Eliminar".
- SimonBot: ícono de perrito. Preguntas y análisis de fotos.

PROBLEMAS FRECUENTES:
- No inicia sesión: verificar mayúsculas, usar "Recupérala aquí", limpiar historial.
- Página no carga: verificar conexión, F5, otro navegador.
- Sin notificaciones: Ajustes > Notificaciones > permisos.
- Archivos no suben: JPG, PNG, MP4, tamaño moderado, buena conexión.
- Sin mascotas: limpiar filtros.
- No puede chatear: solo con amigos.

¡Adopta un animal! Familias y mascotas esperan encontrarse. 🐶🐱

RESPONDE:
- Español siempre.
- Conciso: máx 2 párrafos o 3-4 puntos.
- Amigable, profesional.
- Emojis: 1-2 máximo.
- Texto plano, sin Markdown.${contextPet}

USUARIO: "${message}"`;

    } else {
      // MENSAJES POSTERIORES: NUNCA SALUDES
      prompt = `Eres Simon Bot 🐾, el asistente de AdoptaPet.
Personalidad: cálida, cercana, profesional. Emojis moderados (1-2).

${finalUserName ? `Usuario: ${finalUserName}. Úsalo naturalmente.` : ''}

⚠️ REGLA CRÍTICA: Este NO es el primer mensaje.
- JAMÁS abras con "¡Hola!", "Hola qué placer", saludos o presentaciones.
- JAMÁS preguntes "¿En qué puedo ayudarte?" o "¿Cómo puedo ayudarte?".
- JAMÁS hagas preguntas de aclaración genéricas como "¿A qué te refieres?".
- Responde DIRECTAMENTE y CON SEGURIDAD a lo que pregunta.
- Sé conciso, útil, directo. Sin introducciones.
- Si necesitas claridad, pídela de forma natural EN el contenido, no como saludo.

Puedes ayudar con:
1. CUIDADO ANIMAL: salud, alimentación, comportamiento.
   - Emergencias: recomienda veterinario.
2. USO DE ADOPTAPET:

ACCESO Y CUENTA:
- Iniciar sesión: correo, contraseña, o Google.
- Contraseña olvidada: "Recupérala aquí".
- Cuenta nueva: "Regístrate" (nombre, correo, contraseña mín. 6).
- Funciona en navegadores - sin instalar.

MÓDULOS:
- Inicio: publicaciones, likes, comentarios, compartir.
- Adoptar: mascotas con filtros. "Ver detalles" para contactar.
- Publicar: mensajes, fotos, videos.
- Crear Adopción: formulario de mascota.
- Amigos: seguidos, solicitudes, sugerencias.
- Favoritos: guardadas.
- Ajustes: cuenta, notificaciones, publicaciones, etiquetado.
- Mensajes: solo amigos.
- Notificaciones: avisos.
- Mi Perfil: editar, eliminar publicaciones.
- SimonBot: aquí, preguntas, análisis de fotos.

PROBLEMAS:
- No inicia: verificar datos, limpiar historial.
- Página no carga: conexión, F5, otro navegador.
- Sin notificaciones: permisos.
- Archivos no suben: formato/tamaño/conexión.
- Sin mascotas: limpiar filtros.
- No chatea: solo amigos.

¡Adopta! Esperan encontrarse. 🐶🐱

RESPONDE:
- Español.
- Conciso: máx 2 párrafos o puntos.
- Amigable, profesional.
- Sin Markdown.${contextPet}

USUARIO: "${message}"`;
    }

    console.log(`📨 Mensaje #${messageCount} - userName: ${finalUserName}, firstMsg: ${isFirstMessage}`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { 
      success: true, 
      reply: text,
      detectedName: detectedName // Retornar el nombre detectado al frontend
    };
  } catch (error) {
    console.error("❌ Error en chatbot:", error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 2. ANÁLISIS DE IMAGEN DE MASCOTA
// =====================================================
async function analyzeAnimalImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
      `Eres un experto en identificación de animales. Analiza esta imagen y responde OBLIGATORIAMENTE de forma muy corta y directa (máximo 1 o 2 oraciones breves por punto):
1. Especie y raza
2. Salud visible
3. Tu mejor consejo de cuidado
4. ¿Apto para adopción? (Sí/No y por qué)
5. ¿Quieres saber más información? Si es así responde con un sí
Responde rápido, de forma amigable y sin formato Markdown.`
    ]);

    return { success: true, analysis: result.response.text() };
  } catch (error) {
    console.error("❌ Error en análisis de imagen:", error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 3. MODERACIÓN DE IMAGEN
// =====================================================
async function moderateImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
      `Eres un moderador de contenido para una red social de adopción de animales.
Analiza la imagen y responde ÚNICAMENTE en JSON válido, sin texto adicional ni backticks:
{
  "isAppropriate": true,
  "containsAdult": false,
  "containsViolence": false,
  "isRelatedToPets": true,
  "reason": "explicación clara"
}`
    ]);

    const content = result.response.text().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo parsear la respuesta");

    return { success: true, moderation: JSON.parse(jsonMatch[0]) };
  } catch (error) {
    console.error("❌ Error en moderación:", error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 4. VALIDAR PUBLICACIÓN
// =====================================================
async function validatePetPosting(imageUrl, petDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
      `Valida esta publicación de adopción. Descripción: "${petDescription}"
Responde ÚNICAMENTE en JSON válido, sin texto adicional ni backticks:
{
  "isValid": true,
  "imageQuality": "buena",
  "isRealPet": true,
  "descriptionMatches": true,
  "hasRedFlags": false,
  "feedback": "mensaje al usuario"
}`
    ]);

    const content = result.response.text().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo validar");

    return { success: true, validation: JSON.parse(jsonMatch[0]) };
  } catch (error) {
    console.error("❌ Error en validación:", error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 5. GENERAR DESCRIPCIÓN AUTOMÁTICA
// =====================================================
async function generatePetDescription(imageUrl, petName, petType) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
      `Crea una descripción atractiva y emotiva de 100-150 palabras para ${petName},
un/a ${petType} en adopción. Debe ser emotiva, destacar cualidades positivas,
mencionar el hogar ideal y animar a la adopción. En español, sin formato Markdown.`
    ]);

    return { success: true, description: result.response.text() };
  } catch (error) {
    console.error("❌ Error generando descripción:", error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 6. DETECTAR FOTOS DUPLICADAS
// =====================================================
async function checkImageSimilarity(imageUrl1, imageUrl2) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const [img1, img2] = await Promise.all([
      fetchImageAsBase64(imageUrl1),
      fetchImageAsBase64(imageUrl2)
    ]);

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: img1 } },
      { inlineData: { mimeType: "image/jpeg", data: img2 } },
      `Compara estas dos imágenes de mascotas.
Responde ÚNICAMENTE en JSON válido, sin texto adicional ni backticks:
{
  "isSamePet": false,
  "isSamePhoto": false,
  "similarity": "baja",
  "riskLevel": "bajo"
}`
    ]);

    const content = result.response.text().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo comparar");

    return { success: true, comparison: JSON.parse(jsonMatch[0]) };
  } catch (error) {
    console.error("❌ Error en comparación:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  analyzeAnimalImage,
  chatbotAnimalAdvisor,
  checkImageSimilarity,
  generatePetDescription,
  moderateImage,
  validatePetPosting,
  extractUserName, // Exportar función para usarla en frontend si es necesario
};