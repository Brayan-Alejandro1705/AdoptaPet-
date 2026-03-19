require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ✅ Modelo compatible con free tier
// Modelos disponibles: "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"
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
1. Consejos de mascotas (cuidados, salud, comportamiento). Para emergencias, recomienda veterinario.
2. Guía de la página web AdoptaPet: Si el usuario te pregunta cómo usar la página, dónde encontrar algo o cómo hacer algo, guíalo usando este manual:
   - Para dar en adopción: Dile que vaya al  botón "crear adopcion, luego llene el formulario con la informacion del animal y que en la parte inferior encontrara un boton para subir imagenes o video , luego presione el boton publicar.
   - Para adoptar: Dile que vaya al boton "adoptar" para ver los animalitos disponibles , tambien que hay un boton de "ver detalles" donde podra escribir mensage al dueño de la publicacion para iniciar una conversacion .Ademas hay un filtro de busqueda para encontrar el animalito que desea.
   - Para ver mensajes de chat: Dile que vaya a la sección de "Chat" o ícono de mensajes para hablar con otros usuarios.
   - Perfil y configuración: En la sección "Perfil" puede editar su información,  y ver  sus propias publicaciones.
IMPORTANTE: Si preguntan cómo dar en adopción, ínstalos emotiva y directamente a que hagan una publicación en la plataforma.
Responde siempre en español, con un tono muy amigable, claro e informal, máximo 3 párrafos cortos.
SIN asteriscos ni formato Markdown, solo texto plano.${contextPet}

Usuario: ${message}`;

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
5. ¿quieres saber mas informacion ? si es asi responde con un si 
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
  chatbotAnimalAdvisor,
  analyzeAnimalImage,
  moderateImage,
  validatePetPosting,
  generatePetDescription,
  checkImageSimilarity,
};