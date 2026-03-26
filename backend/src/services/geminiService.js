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
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      systemInstruction: `You are Simon Bot 🐾, AdoptaPet's assistant. You speak Spanish ALWAYS.
Answer about pet care or AdoptaPet platform.
Rules: Warm, professional. 1-2 emojis max. 2 short paragraphs OR 3-4 bullet points max. Plain text, no Markdown.
For medical emergencies: recommend a veterinarian.

CRITICAL - If this is NOT the first message:
NEVER: greet, say hello, introduce yourself, ask "how can I help", ask "what do you mean", ask clarifying questions
MUST: answer directly to the user's actual question with no preamble, no introduction, no greeting`
    });

    const detectedName = extractUserName(message);
    const finalUserName = detectedName || userName;
    const isFirstMessage = messageCount <= 1;

    // Construir el mensaje de usuario según si es primer mensaje
    let userMessage;
    
    if (isFirstMessage) {
      userMessage = `${finalUserName ? `The user's name is ${finalUserName}.` : ''}
You can greet them warmly and ask what you can help with.

User: "${message}"`;
    } else {
      userMessage = `${finalUserName ? `The user's name is ${finalUserName}.` : ''}

⚠️ IMPORTANT: This is NOT the first message in the conversation.
- Do NOT start with greetings, introductions, or "Hello"
- Do NOT ask "How can I help?" or similar
- Do NOT ask generic clarifying questions like "What do you mean?"
- Answer DIRECTLY to what they ask
- Be concise, helpful, direct

User: "${message}"`;
    }

    console.log(`📨 Mensaje #${messageCount} - userName: ${finalUserName}, isFirstMessage: ${isFirstMessage}`);
    
    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    return { 
      success: true, 
      reply: text,
      detectedName: detectedName
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