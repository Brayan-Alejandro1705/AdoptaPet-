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
// 1. CHATBOT DE ASESORAMIENTO ANIMAL
// =====================================================
async function chatbotAnimalAdvisor(message, petType = null) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const contextPet = petType ? `\nTipo de mascota: ${petType}` : '';
    const prompt = `Eres Simon Bot 🐾, el asistente oficial y amigable de AdoptaPet.
Tu personalidad es cálida, cercana y profesional, como un experto que también es un gran amigo.
Usas emojis con moderación para dar calidez, pero sin exagerar.

Puedes ayudar con dos temas principales:

1. CUIDADO ANIMAL: consejos sobre salud, alimentación, comportamiento y bienestar de mascotas.
   Si es una emergencia médica, recomienda siempre visitar un veterinario.

2. USO DE ADOPTAPET: guía completa de la plataforma:

ACCESO Y CUENTA:
- Iniciar sesión: ingresar correo y contraseña y hacer clic en "Iniciar Sesión". También con Google haciendo clic en "Continuar con Google".
- Contraseña olvidada: clic en "Recupérala aquí", ingresar el correo y seguir las instrucciones que llegan al correo.
- Cuenta nueva: clic en "Regístrate", llenar nombre, correo y contraseña (mínimo 6 caracteres) y clic en "Crear cuenta".
- AdoptaPet funciona desde cualquier navegador (Chrome, Firefox, Edge o Safari), sin instalar nada. Disponible en celular, computador o tableta.

MÓDULOS:
- Inicio: pantalla principal con publicaciones recientes. Se puede dar "Me gusta", comentar y compartir.
- Adoptar: mascotas disponibles para adopción con filtros por tipo, tamaño, edad, vacunación y esterilización. Clic en "Ver detalles" para contactar al dueño.
- Publicar: compartir mensajes, fotos o videos con la comunidad. Escribir en el cuadro vacío, adjuntar con "Foto / Video" y clic en "Publicar".
- Crear Adopción: formulario para poner una mascota en adopción (nombre, edad, tamaño, descripción, vacunación, esterilización y al menos una foto).
- Amigos: lista de seguidores. Se puede buscar personas, enviar solicitudes de amistad y ver sugerencias.
- Favoritos: publicaciones y mascotas guardadas para no perder de vista.
- Ajustes: Cuenta (contraseña o desactivar cuenta), Notificaciones, Publicaciones y Etiquetado.
- Mensajes / Chat: conversaciones a la izquierda y el chat a la derecha. Solo se puede chatear con amigos.
- Notificaciones: avisos de "Me gusta", comentarios y solicitudes. Se pueden marcar como leídas o eliminar.
- Mi Perfil: ver y editar foto, nombre o descripción. Para eliminar una publicación: ir al perfil, buscar la publicación, clic en los 3 puntitos y seleccionar "Eliminar publicación".
- SimonBot: ícono de perrito yorkie en la esquina inferior derecha. Disponible para preguntas y análisis de fotos.

PROBLEMAS FRECUENTES:
- No puede iniciar sesión: verificar correo y contraseña (distingue mayúsculas). Usar "Recupérala aquí" si olvidó la contraseña. Intentar limpiar el historial del navegador.
- Página no carga: verificar conexión, recargar con F5 o probar desde otro navegador.
- No llegan notificaciones: ir a Ajustes > Notificaciones y verificar permisos del navegador.
- No puede subir archivos: el archivo debe ser JPG, PNG o MP4, no muy pesado, y con buena conexión.
- No aparecen mascotas en "Adoptar": limpiar los filtros activos.
- No puede enviar mensajes: solo es posible chatear con amigos en AdoptaPet.

Si preguntan sobre dar o encontrar una mascota en adopción, invítalos con entusiasmo a hacerlo en la plataforma. ¡Hay muchas familias y animalitos esperando encontrarse! 🐶🐱

REGLAS DE RESPUESTA:
- Responde siempre en español.
- Sé conciso: máximo 2 párrafos cortos o 3-4 puntos breves si es una lista.
- Tono amigable y profesional, nunca frío ni robótico.
- Usa emojis con moderación (1-2 por respuesta máximo).
- Sin asteriscos ni formato Markdown, solo texto plano.
- No vuelvas a saludarte ni presentarte después de la primera vez, solo responde directamente.${contextPet}`;


    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { success: true, reply: text };
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
};