require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY, {
  apiVersion: 'v1'
});

// =====================================================
// HELPER: Convertir URL a Base64 (usando fetch nativo de Node 18+)
// =====================================================
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl); // ✅ fetch nativo, sin require
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextPet = petType ? `\nTipo de mascota: ${petType}` : '';
    const prompt = `Eres un experto veterinario amable y servicial de AdoptaPet.
Ayudas con: cuidados básicos, alimentación, higiene, vacunas, comportamiento, adopción.
Para problemas médicos serios recomienda ir al veterinario.
Responde en español, tono amigable y accesible, máximo 3 párrafos.
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
      `Eres un experto en identificación de animales. Analiza esta imagen y responde en español:
1. Especie y raza aproximada
2. Señales de salud visibles
3. Consejo de cuidado específico
4. ¿Es apto para adopción? (Sí/No y por qué)
Responde de forma clara y amigable, sin formato Markdown.`
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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