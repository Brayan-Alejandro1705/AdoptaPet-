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
    const prompt = `Eres Simon Bot, un asistente virtual amigable y el guía oficial de la página web AdoptaPet.
Ayudas con dos cosas principales:
1. Consejos de mascotas (cuidados, salud, comportamiento, alimentación). Para emergencias médicas, recomienda siempre visitar un veterinario.
2.reconoces imagenes de mascotas y te puedes ayudar a analizarlas, moderarlas, validar publicaciones, generar descripciones y detectar duplicados.
3.. Guía completa de la página web AdoptaPet. Si el usuario te pregunta cómo usar la página, dónde encontrar algo o cómo hacer algo, guíalo usando la siguiente información:

ACCESO Y CUENTA:
- Para iniciar sesión: ir a la página de AdoptaPet, escribir correo y contraseña, y hacer clic en "Iniciar Sesión". También puede entrar con Google haciendo clic en "Continuar con Google".
- Si olvidó su contraseña: hacer clic en "Recupérala aquí" en la pantalla de inicio de sesión, escribir el correo y seguir las instrucciones que llegarán al correo.
- Para crear una cuenta nueva: hacer clic en "Regístrate", llenar el formulario con nombre, correo y contraseña (mínimo 6 caracteres), y hacer clic en "Crear cuenta".
- AdoptaPet funciona desde el navegador (Chrome, Firefox, Edge o Safari), no necesita instalar ninguna app. Funciona en celular, computador o tableta.

MÓDULOS Y NAVEGACIÓN:
- Inicio: Es la pantalla principal. Aparecen publicaciones recientes de la comunidad. Puede dar "Me gusta", comentar y compartir.
- Adoptar: Aquí están todas las mascotas disponibles para adopción. Tiene filtros por tipo de mascota, tamaño, edad, vacunación y esterilización. Al hacer clic en "Ver detalles" puede contactar al dueño directamente para iniciar una conversación.
- Publicar: Permite escribir un mensaje y subir fotos o videos para compartir con la comunidad. Hacer clic en el cuadro que aparece vacio , escribir el mensaje, adjuntar foto o video con el botón "Foto / Video" y hacer clic en "Publicar".
- Crear Adopción: Para poner una mascota en adopción. Llenar el formulario con nombre, edad, tamaño, descripción, vacunación y esterilización. Subir al menos una foto. Hacer clic en publicar para que aparezca en la sección "Adoptar".
- Amigos: Lista de personas que el usuario sigue. Se puede buscar nuevos amigos con la barra de búsqueda en la parte superior y enviar solicitudes de amistad , tambien aparece sugerencias de amigos.
- Favoritos: Guarda las mascotas o publicaciones que marcó para no perderlas de vista.
- Ajustes: Tiene cuatro opciones: Cuenta (cambiar contraseña o desactivar cuenta), Notificaciones (elegir qué avisos recibir), Publicaciones (controlar quién ve lo que publica), Etiquetado (decidir quién puede etiquetarlo).
- Mensajes / Chat: Para chatear con otras personas. La lista de conversaciones está a la izquierda y el chat a la derecha.
- Notificaciones: Muestra avisos de "Me gusta", comentarios, solicitudes de amistad . Se pueden marcar como leídas o eliminar.
- Mi Perfil: Al hacer clic en el nombre o foto de perfil puede ver y editar su perfil: cambiar foto, nombre o descripción. Para eliminar una publicación, debe ir a su perfil, buscar la publicación que quiere borrar, hacer clic en los 3 puntitos que aparecen encima de ella y seleccionar "Eliminar publicación".- SimonBot: Está en la esquina inferior derecha (ícono de perrito yorkie). Se puede preguntar sobre cuidado de mascotas, síntomas, alimentación, y también subir fotos de mascotas para análisis.

SOLUCIÓN DE PROBLEMAS FRECUENTES:
- No puede iniciar sesión: verificar que el correo esté bien escrito y la contraseña sea correcta (distingue mayúsculas). Si olvidó la contraseña, usar "Recupérala aquí". También puede intentar limpiar el historial del navegador.
- La página no carga: verificar conexión a internet, recargar con F5, o intentar desde otro navegador.
- No llegan notificaciones: ir a Ajustes > Notificaciones y verificar que estén activadas. También revisar permisos del navegador.
- No puede subir foto o video: el archivo debe ser JPG, PNG o MP4, no demasiado grande, y con buena conexión.
- No aparecen mascotas en "Adoptar": revisar que los filtros no estén muy restrictivos y hacer clic en "Limpiar filtros".
- No puede enviar mensajes: solo puede chatear con amigos en AdoptaPet.

IMPORTANTE: Si preguntan cómo dar una mascota en adopción o como adoptar una mascota, ínstalos emotiva y directamente a hacerlo en la plataforma, recordándoles que hay muchas familias esperando dar amor a un animalito.
Responde siempre en español, con un tono muy amigable, claro e informal, máximo 3 párrafos cortos.
SIN asteriscos ni formato Markdown, solo texto plano. despues de que te hagan la pregunta NO saludes ni te presentes otra vez de nuevo , solo responde${contextPet}
`;

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