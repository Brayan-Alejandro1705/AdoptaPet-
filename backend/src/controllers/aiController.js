// backend/src/controllers/aiController.js
const Groq = require('groq-sdk');

// Inicializar Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// 1. IDENTIFICAR RAZA DE MASCOTA POR IMAGEN
const identifyPetBreed = async (req, res) => {
  try {
    console.log('🔍 Identificando raza de mascota...');

    const { imageUrl, imageBase64 } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere imageUrl o imageBase64'
      });
    }

    // Groq no soporta imágenes directamente
    return res.json({
      success: true,
      data: {
        animal: 'desconocido',
        raza: 'Función de visión en desarrollo',
        razasProbables: [],
        confianza: 0,
        edad: 'desconocida',
        tamaño: 'desconocido',
        caracteristicas: ['Por favor describe la mascota en el chat']
      }
    });

  } catch (error) {
    console.error('❌ Error identificando mascota:', error);
    res.status(500).json({
      success: false,
      message: 'Error al identificar la mascota',
      error: error.message
    });
  }
};

// 2. OBTENER CONSEJOS SOBRE UNA MASCOTA
const getPetAdvice = async (req, res) => {
  try {
    console.log('💡 Generando consejos para mascota...');

    const { species, breed, age, size, healthIssues, temperament } = req.body;

    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el tipo de animal'
      });
    }

    const prompt = `Eres un veterinario experto. Dame consejos detallados sobre esta mascota:

Animal: ${species}
Raza: ${breed || 'Mestizo'}
Edad: ${age || 'Desconocida'}
Tamaño: ${size || 'Desconocido'}
${healthIssues ? 'Problemas de salud: ' + healthIssues : ''}
${temperament ? 'Temperamento: ' + temperament : ''}

Responde SOLO en formato JSON válido:
{
  "cuidadoGeneral": {
    "alimentacion": "consejos",
    "ejercicio": "necesidades",
    "aseo": "cuidados"
  },
  "salud": {
    "vacunas": "recomendadas",
    "chequeos": "frecuencia",
    "prevencion": "prevención"
  },
  "comportamiento": {
    "socializacion": "consejos",
    "entrenamiento": "tips",
    "enriquecimiento": "actividades"
  },
  "advertencias": ["advertencia1", "advertencia2"],
  "consejosEspecificos": ["consejo1", "consejo2", "consejo3"]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let advice;
    try {
      advice = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la respuesta de la IA',
        rawResponse: text
      });
    }

    console.log('✅ Consejos generados');

    res.json({
      success: true,
      data: advice
    });

  } catch (error) {
    console.error('❌ Error generando consejos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar consejos',
      error: error.message
    });
  }
};

// 3. CHAT CON IA SOBRE MASCOTAS - ✅ CON MEMORIA
const chatWithAI = async (req, res) => {
  try {
    console.log('💬 Chat con IA...');

    const { message, petContext, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un mensaje'
      });
    }

    const contextInfo = petContext ? '\n\nContexto: ' + JSON.stringify(petContext) : '';
    
    const systemPrompt = `Eres Simon Bot, un asistente veterinario profesional y amigable de AdoptaPet. 

PERSONALIDAD:
- Presentate solo la PRIMERA vez como "Simon Bot"
- Pregunta el nombre del usuario SOLO si aún no lo sabes
- Una vez sepas el nombre, úsalo naturalmente en la conversación
- Tono profesional pero cercano, como un veterinario amable
- Respuestas claras y directas de máximo 3 párrafos cortos

FORMATO:
- SIN asteriscos, SIN negritas, SIN formato Markdown
- Solo texto plano con saltos de línea
- Consejos prácticos y bien fundamentados
- Si algo requiere veterinario presencial, recomendarlo
- IMPORTANTE: Si el usuario pregunta cómo dar en adopción un animal, anímalo felizmente a que publique el perfil de la mascota directamente aquí en la plataforma web de AdoptaPet.${contextInfo}`;

    // Construir historial de mensajes
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Agregar historial si existe (últimos 10 mensajes para no saturar)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
    }

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 350
    });

    let responseText = chatCompletion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    
    // Limpiar formato Markdown
    responseText = responseText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .trim();

    console.log('✅ Respuesta generada con memoria');

    res.json({
      success: true,
      data: {
        message: responseText,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error en chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el mensaje',
      error: error.message
    });
  }
};

// 4. ANALIZAR COMPATIBILIDAD MASCOTA-ADOPTANTE
const analyzeCompatibility = async (req, res) => {
  try {
    console.log('🔄 Analizando compatibilidad...');

    const { pet, adopter } = req.body;

    if (!pet || !adopter) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere información de la mascota y el adoptante'
      });
    }

    const prompt = `Analiza la compatibilidad entre esta mascota y este posible adoptante:

MASCOTA: ${JSON.stringify(pet, null, 2)}
ADOPTANTE: ${JSON.stringify(adopter, null, 2)}

Responde SOLO en formato JSON:
{
  "puntuacion": 0-100,
  "nivel": "excelente/buena/regular/baja",
  "factoresPositivos": ["factor1", "factor2"],
  "factoresNegativos": ["factor1", "factor2"],
  "recomendaciones": ["recomendación1", "recomendación2"],
  "advertencias": ["advertencia1", "advertencia2"],
  "resumen": "resumen en 2-3 frases"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let compatibility;
    try {
      compatibility = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la respuesta',
        rawResponse: text
      });
    }

    console.log('✅ Compatibilidad analizada:', compatibility.puntuacion);

    res.json({
      success: true,
      data: compatibility
    });

  } catch (error) {
    console.error('❌ Error analizando compatibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al analizar compatibilidad',
      error: error.message
    });
  }
};

// 5. GENERAR DESCRIPCIÓN AUTOMÁTICA DE MASCOTA
const generatePetDescription = async (req, res) => {
  try {
    console.log('📝 Generando descripción de mascota...');

    const { species, breed, age, size, temperament } = req.body;

    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el tipo de animal'
      });
    }

    const prompt = `Genera una descripción atractiva y emotiva para una mascota en adopción (100-150 palabras):

Animal: ${species}
Raza: ${breed || 'Mestizo'}
Edad: ${age || 'Desconocida'}
Tamaño: ${size || 'Desconocido'}
Temperamento: ${temperament || 'Amigable'}

La descripción debe:
- Ser emotiva pero realista
- Destacar cualidades positivas
- Mencionar el hogar ideal
- Ser persuasiva para adopción

Responde SOLO con la descripción, sin formato JSON.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
      max_tokens: 300
    });

    const description = chatCompletion.choices[0]?.message?.content?.trim() || '';

    console.log('✅ Descripción generada');

    res.json({
      success: true,
      data: { description }
    });

  } catch (error) {
    console.error('❌ Error generando descripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar descripción',
      error: error.message
    });
  }
};

module.exports = {
  identifyPetBreed,
  getPetAdvice,
  chatWithAI,
  analyzeCompatibility,
  generatePetDescription
};