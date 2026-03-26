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
async function chatbotAnimalAdvisor(message, petType = null, userName = null, messageCount = 0, history = []) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      systemInstruction: `Eres Simon Bot 🐾, el asistente veterinario de AdoptaPet. REGLAS ESTRICTAS E INQUEBRANTABLES:
1. NUNCA saludes, ni te presentes bajo ninguna circunstancia. El historial ya incluye tu presentación. NUNCA digas "Hola", "Soy Simon", "¿En qué puedo ayudarte?", ni nada similar.
2. Responde DIRECTAMENTE a la pregunta de forma cálida, profesional y al grano.
3. Máximo 1-2 emojis. Máximo 2 párrafos cortos. Únicamente texto plano (sin asteriscos, sin Markdown, sin viñetas).
4. El chat tiene memoria: recuerda lo que el usuario ha dicho antes basándote en el historial de la conversación. No pidas que te repitan información.
5. Si hablan de un problema médico grave, recomienda siempre ir al veterinario.`
    });

    const detectedName = extractUserName(message);
    const finalUserName = detectedName || userName;

    // Sanitizar historial: debe empezar con 'user' y alternar 'user'/'model'
    let sanitizedHistory = [];
    let expectedRole = 'user';
    
    if (history && Array.isArray(history)) {
      // Ignorar mensajes iniciales del modelo
      let startIndex = 0;
      while (startIndex < history.length && history[startIndex].role === 'model') {
        startIndex++;
      }
      
      for (let i = startIndex; i < history.length; i++) {
        const msg = history[i];
        if (msg.role === expectedRole) {
          sanitizedHistory.push({
            role: msg.role,
            parts: [{ text: msg.parts[0].text }]
          });
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        } else if (sanitizedHistory.length > 0) {
          // Unir mensajes del mismo rol si se envían seguidos
          sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n\n${msg.parts[0].text}`;
        }
      }
    }

    // Iniciar chat con memoria
    const chat = model.startChat({
      history: sanitizedHistory
    });

    let contextPrefix = '';
    if (finalUserName) {
      contextPrefix = `[Contexto oculto: el usuario se llama ${finalUserName}]\n`;
    }
    
    // Concatenamos el contexto con el mensaje del usuario
    const finalMessage = `${contextPrefix}${message}`;

    console.log(`📨 Mensaje al chat - userName: ${finalUserName}, history length: ${sanitizedHistory.length}`);

    
    const result = await chat.sendMessage(finalMessage);
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