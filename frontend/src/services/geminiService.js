// =====================================================
// 🐾 SERVICIO GOOGLE GEMINI - CommonJS
// Para estructura frontend
// =====================================================

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// =====================================================
// 1️⃣ CHATBOT DE ASESORAMIENTO ANIMAL
// =====================================================

async function chatbotAnimalAdvisor(message, petType = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres un experto veterinario amable y servicial especializado en cuidado de mascotas.
    Tu objetivo es proporcionar consejos prácticos sobre:
    - Cuidados básicos (alimentación, higiene, vacunas)
    - Comportamiento y adiestramiento
    - Salud y bienestar
    - Consejos para nuevos adoptantes
    - Proceso de adopción
    
    IMPORTANTE:
    - Siempre sé empático y motivador
    - Para problemas médicos serios, recomienda ir al veterinario
    - Responde en español
    - Usa un tono amigable y accesible`;

    const userMessage = petType
      ? `${message} (Tipo de mascota: ${petType})`
      : message;

    const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      reply: text,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error en chatbot:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// 2️⃣ ANÁLISIS DE IMAGEN + CONSEJOS DE CUIDADO
// =====================================================

async function analyzeAnimalImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `Eres un experto en identificación de animales.
    Analiza la imagen y proporciona:
    1. Especie y raza aproximada
    2. Señales de salud visibles
    3. Consejo de cuidado específico
    4. ¿Es apto para adopción? (Sí/No y por qué)
    
    Responde en español de forma clara y amigable.`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl),
        },
      },
      "Analiza esta imagen de mascota:",
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      analysis: text,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error en análisis de imagen:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// 3️⃣ MODERACIÓN: Detectar contenido inapropiado
// =====================================================

async function moderateImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `Eres un moderador de contenido para una red social de adopción de animales.
    
    ANALIZA LA IMAGEN Y DETERMINA:
    1. ¿Contiene contenido sexual/pornográfico? (Sí/No)
    2. ¿Contiene violencia o abuso animal? (Sí/No)
    3. ¿Está relacionada con adopción/mascotas? (Sí/No)
    4. ¿Es apropiada para la plataforma? (Sí/No)
    5. Razón de la decisión
    
    RESPONDE ÚNICAMENTE EN JSON (sin explicación adicional):
    {
      "isAppropriate": boolean,
      "containsAdult": boolean,
      "containsViolence": boolean,
      "isRelatedToPets": boolean,
      "reason": "explicación clara"
    }`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl),
        },
      },
      "Modera esta imagen:",
    ]);

    const response = await result.response;
    const content = response.text();

    // Extraer JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result_json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!result_json) {
      throw new Error("No se pudo parsear la respuesta");
    }

    return {
      success: true,
      moderation: result_json,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error en moderación:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// 4️⃣ VALIDAR PUBLICACIÓN (Imagen + Descripción)
// =====================================================

async function validatePetPosting(imageUrl, petDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `Eres un validador de publicaciones para una red social de adopción.
    
    VERIFICA:
    1. La imagen es de una mascota real (no AI, no meme)
    2. La descripción es coherente con la imagen
    3. El contenido es apropiado y legal
    4. No contiene spam o contenido inapropiado
    
    RESPONDE ÚNICAMENTE EN JSON:
    {
      "isValid": boolean,
      "imageQuality": "buena/media/mala",
      "isRealPet": boolean,
      "descriptionMatches": boolean,
      "hasRedFlags": boolean,
      "feedback": "mensaje al usuario"
    }`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl),
        },
      },
      `Valida esta publicación:\n\nDescripción: "${petDescription}"\n\nImagen:`,
    ]);

    const response = await result.response;
    const content = response.text();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result_json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!result_json) {
      throw new Error("No se pudo validar la publicación");
    }

    return {
      success: true,
      validation: result_json,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error en validación:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// 5️⃣ GENERAR DESCRIPCIÓN AUTOMÁTICA
// =====================================================

async function generatePetDescription(imageUrl, petName, petType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl),
        },
      },
      `Eres un escritor profesional especializado en crear descripciones atractivas de mascotas en adopción.
      Crea una descripción para ${petName}, un/a ${petType} que ves en esta imagen.
      
      La descripción debe ser:
      - Corta (100-150 palabras)
      - Atractiva y emotiva
      - Con detalles del carácter del animal
      - Que anime a la adopción
      - En español`,
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      description: text,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error generando descripción:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// 6️⃣ DETECTAR FOTOS DUPLICADAS (Anti-scam)
// =====================================================

async function checkImageSimilarity(imageUrl1, imageUrl2) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl1),
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: await fetchImageAsBase64(imageUrl2),
        },
      },
      `Compara estas dos imágenes de mascotas y determina si son:
      1. La misma foto (posible duplicado/scam)
      2. El mismo animal en diferentes momentos
      3. Animales diferentes
      
      Responde ÚNICAMENTE en JSON:
      {
        "isSamePet": boolean,
        "isSamePhoto": boolean,
        "similarity": "alta/media/baja",
        "riskLevel": "bajo/medio/alto"
      }`,
    ]);

    const response = await result.response;
    const content = response.text();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result_json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return {
      success: true,
      comparison: result_json,
      tokensUsed: result.response.usageMetadata?.promptTokenCount || 0,
    };
  } catch (error) {
    console.error("❌ Error en comparación:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// FUNCIÓN AUXILIAR: Convertir URL a Base64
// =====================================================

async function fetchImageAsBase64(imageUrl) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error al descargar imagen:", error);
    throw error;
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  chatbotAnimalAdvisor,
  analyzeAnimalImage,
  moderateImage,
  validatePetPosting,
  generatePetDescription,
  checkImageSimilarity,
};