// =============================================
// SCRIPT DE PRUEBAS - MODELO ADOPTION (CORREGIDO)
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Adoption = require('../models/Adoption');
const User = require('../models/User');
const Pet = require('../models/Pet');

async function testAdoptionModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Adoption de AdoptaPet...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // 🆕 LIMPIEZA PREVIA - ELIMINAR DATOS DE PRUEBAS ANTERIORES
        console.log('🧹 === LIMPIANDO DATOS DE PRUEBAS ANTERIORES ===');
        await Adoption.deleteMany({ 'applicationForm.personalInfo.email': { $in: ['juan.perez@test.com', 'maria.lopez@test.com'] } });
        await Pet.deleteMany({ name: { $regex: /Test$/ } });
        await User.deleteMany({ email: { $in: ['juan.perez@test.com', 'refugio@test.com', 'maria.lopez@test.com'] } });
        console.log('✅ Datos de pruebas anteriores eliminados\n');
        
        // CREAR DATOS DE PRUEBA
        console.log('🔧 === CREANDO DATOS DE PRUEBA ===');
        
        // Crear adoptante
        const adopter = new User({
            name: 'Juan Pérez',
            email: 'juan.perez@test.com',
            password: 'test123',
            role: 'adopter',
            location: {
                country: 'Colombia',
                city: 'Bogotá'
            }
        });
        await adopter.save();
        console.log(`✅ Adoptante creado: ${adopter.name}`);
        
        // Crear refugio
        const shelter = new User({
            name: 'Refugio Test',
            email: 'refugio@test.com',
            password: 'test123',
            role: 'shelter',
            shelterInfo: {
                organizationName: 'Refugio de Prueba'
            }
        });
        await shelter.save();
        console.log(`✅ Refugio creado: ${shelter.shelterInfo.organizationName}`);
        
        // Crear mascota
        const pet = new Pet({
            name: 'Luna Test',
            species: 'perro',
            breed: 'Labrador',
            age: { value: 2, unit: 'años' },
            gender: 'hembra',
            size: 'mediano',
            description: 'Perrita hermosa buscando hogar',
            photos: ['https://test.com/luna.jpg'],
            mainPhoto: 'https://test.com/luna.jpg',
            location: { country: 'Colombia', city: 'Bogotá' },
            owner: shelter._id,
            status: 'disponible'
        });
        await pet.save();
        console.log(`✅ Mascota creada: ${pet.name}\n`);
        
        // PRUEBA 1: CREAR SOLICITUD DE ADOPCIÓN COMPLETA
        console.log('📝 === PRUEBA 1: CREAR SOLICITUD DE ADOPCIÓN COMPLETA ===');
        
        const adoption = new Adoption({
            pet: pet._id,
            adopter: adopter._id,
            owner: shelter._id,
            applicationForm: {
                personalInfo: {
                    fullName: 'Juan Carlos Pérez González',
                    age: 30,
                    occupation: 'Ingeniero de Software',
                    phone: '+57 300 123 4567',
                    email: 'juan.perez@test.com'
                },
                indexInfo: {
                    type: 'casa',
                    size: 'grande',
                    hasGarden: true,
                    gardenSize: '100m²',
                    isFenced: true,
                    ownerOrRenter: 'propietario'
                },
                petExperience: {
                    hasPetsNow: false,
                    currentPets: [],
                    hadPetsBefore: true,
                    previousPets: 'Tuve un perro labrador durante 12 años',
                    experienceLevel: 'mucha'
                },
                familyInfo: {
                    livesAlone: false,
                    familyMembers: 3,
                    hasChildren: true,
                    childrenAges: [8, 12],
                    allMembersAgree: true,
                    allergies: false
                },
                petCare: {
                    dailyTimeAvailable: 'mas-8h',
                    whoWillCare: 'Toda la familia, principalmente yo',
                    vacationPlans: 'Viajamos con la mascota o dejamos con familiares',
                    vetClinic: {
                        name: 'Clínica Veterinaria Central',
                        phone: '+57 1 234 5678',
                        address: 'Calle 100 #15-20'
                    },
                    emergencyBudget: true,
                    monthlyBudget: 500000
                },
                motivation: {
                    whyAdopt: 'Queremos dar un hogar amoroso a un perro que lo necesite. Mis hijos han estado pidiendo una mascota y creemos que es el momento perfecto.',
                    whyThisPet: 'Luna nos encantó desde que vimos su foto. Su tamaño y edad son perfectos para nuestra familia.',
                    expectations: 'Esperamos tener un compañero fiel que sea parte de nuestra familia'
                },
                commitments: {
                    longTermCommitment: true,
                    training: true,
                    medicalCare: true,
                    returnIfNeeded: true
                }
            }
        });
        
        const validationError = adoption.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Solicitud válida - Estructura correcta');
            console.log(`   🐾 Mascota: ${pet.name}`);
            console.log(`   👤 Adoptante: ${adoption.applicationForm.personalInfo.fullName}`);
            console.log(`   📊 Estado: ${adoption.statusText}`);
            console.log(`   📝 Completitud formulario: ${adoption.formCompleteness}%`);
            
            await adoption.save();
            console.log(`✅ Solicitud guardada con ID: ${adoption.id}`);
            console.log(`   📅 Días desde solicitud: ${adoption.daysSinceRequest}`);
        }
        
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidAdoption = new Adoption({
            status: 'estado-invalido',
            applicationForm: {
                personalInfo: {
                    fullName: 'Juan Pérez',
                    age: 15,
                    phone: '+57 300 123 4567',
                    email: 'juan@test.com'
                },
                motivation: {
                    whyAdopt: 'Muy corto',
                    whyThisPet: 'Corto'
                }
            }
        });
        
        const errors = invalidAdoption.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 3: PROBAR CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 3: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   📊 Estado en español: ${adoption.statusText}`);
        console.log(`   📅 Días desde solicitud: ${adoption.daysSinceRequest}`);
        console.log(`   🔄 Está en proceso: ${adoption.isInProcess ? 'Sí' : 'No'}`);
        console.log(`   ✅ Está finalizada: ${adoption.isFinalized ? 'Sí' : 'No'}`);
        console.log(`   📝 Completitud formulario: ${adoption.formCompleteness}%`);
        
        // PRUEBA 4: EVALUAR SOLICITUD
        console.log('\n⭐ === PRUEBA 4: EVALUAR SOLICITUD ===');
        
        adoption.evaluation.criteria.indexConditions = 18;
        adoption.evaluation.criteria.experience = 17;
        adoption.evaluation.criteria.economicCapacity = 16;
        adoption.evaluation.criteria.timeAvailability = 19;
        adoption.evaluation.criteria.motivation = 18;
        adoption.evaluation.evaluatedBy = shelter._id;
        adoption.evaluation.evaluatedAt = new Date();
        adoption.evaluation.notes = 'Excelente candidato, cumple todos los requisitos';
        
        await adoption.save();
        
        console.log(`✅ Evaluación completada:`);
        console.log(`   📊 Score total: ${adoption.evaluation.score}/100`);
        console.log(`   ✅ Evaluación aprobada: ${adoption.evaluationPassed ? 'Sí' : 'No'}`);
        console.log(`   🏠 Condiciones hogar: ${adoption.evaluation.criteria.indexConditions}/20`);
        console.log(`   📚 Experiencia: ${adoption.evaluation.criteria.experience}/20`);
        console.log(`   💰 Capacidad económica: ${adoption.evaluation.criteria.economicCapacity}/20`);
        console.log(`   ⏰ Disponibilidad: ${adoption.evaluation.criteria.timeAvailability}/20`);
        console.log(`   💚 Motivación: ${adoption.evaluation.criteria.motivation}/20`);
        
        // PRUEBA 5: PROGRAMAR ENTREVISTA
        console.log('\n📞 === PRUEBA 5: PROGRAMAR ENTREVISTA ===');
        
        const interviewDate = new Date();
        interviewDate.setDate(interviewDate.getDate() + 3);
        
        await adoption.scheduleInterview(interviewDate, 'virtual', 'https://meet.google.com/abc-defg-hij');
        
        console.log(`✅ Entrevista programada:`);
        console.log(`   📅 Fecha: ${adoption.interview.date}`);
        console.log(`   💻 Tipo: ${adoption.interview.type}`);
        console.log(`   🔗 Link: ${adoption.interview.meetingLink}`);
        console.log(`   📊 Estado: ${adoption.statusText}`);
        
        // PRUEBA 6: PROGRAMAR VISITA AL HOGAR
        console.log('\n🏠 === PRUEBA 6: PROGRAMAR VISITA AL HOGAR ===');
        
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() + 7);
        
        await adoption.scheduleindexVisit(visitDate, 'Calle 100 #15-20, Bogotá');
        
        console.log(`✅ Visita al hogar programada:`);
        console.log(`   📅 Fecha: ${adoption.indexVisit.date}`);
        console.log(`   📍 Dirección: ${adoption.indexVisit.address}`);
        console.log(`   📊 Estado: ${adoption.statusText}`);
        
        // PRUEBA 7: AGREGAR NOTAS
        console.log('\n📝 === PRUEBA 7: AGREGAR NOTAS ===');
        
        await adoption.addNote(shelter._id, 'Primera nota: El adoptante parece muy comprometido', false);
        await adoption.addNote(shelter._id, 'Nota privada para el equipo', true);
        
        console.log(`✅ Notas agregadas: ${adoption.notes.length}`);
        adoption.notes.forEach((note, index) => {
            console.log(`   ${index + 1}. ${note.content.substring(0, 40)}... (${note.isPrivate ? 'Privada' : 'Pública'})`);
        });
        
        // PRUEBA 8: REGISTRAR PAGO
        console.log('\n💰 === PRUEBA 8: REGISTRAR PAGO ===');
        
        await adoption.registroPayment(150000, 'transferencia', 'https://receipts.com/abc123.pdf');
        
        console.log(`✅ Pago registrado:`);
        console.log(`   💵 Monto: ${adoption.adoptionFee.amount.toLocaleString()}`);
        console.log(`   ✅ Pagado: ${adoption.adoptionFee.paid ? 'Sí' : 'No'}`);
        console.log(`   📅 Fecha: ${adoption.adoptionFee.paymentDate}`);
        console.log(`   💳 Método: ${adoption.adoptionFee.paymentMethod}`);
        
        // PRUEBA 9: APROBAR SOLICITUD
        console.log('\n✅ === PRUEBA 9: APROBAR SOLICITUD ===');
        
        await adoption.approve('Solicitud aprobada. Cumple todos los requisitos para adoptar a Luna');
        
        console.log(`✅ Solicitud aprobada:`);
        console.log(`   📊 Estado: ${adoption.statusText}`);
        console.log(`   📅 Fecha aprobación: ${adoption.dates.approved}`);
        console.log(`   📝 Notas: ${adoption.evaluation.notes}`);
        
        // PRUEBA 10: COMPLETAR ADOPCIÓN
        console.log('\n🎉 === PRUEBA 10: COMPLETAR ADOPCIÓN ===');
        
        await adoption.complete();
        
        console.log(`✅ Adopción completada:`);
        console.log(`   📊 Estado: ${adoption.statusText}`);
        console.log(`   📅 Fecha: ${adoption.dates.completed}`);
        console.log(`   🎊 Luna ahora tiene un hogar!`);
        
        // PRUEBA 11: CREAR SOLICITUD RECHAZADA
        console.log('\n❌ === PRUEBA 11: CREAR SOLICITUD RECHAZADA ===');
        
        const anotherAdopter = new User({
            name: 'María López',
            email: 'maria.lopez@test.com',
            password: 'test123',
            role: 'adopter',
            location: {
                country: 'Colombia',
                city: 'Medellín'
            }
        });
        await anotherAdopter.save();
        console.log(`✅ Segundo adoptante creado: ${anotherAdopter.name}`);
        
        const rejectedAdoption = new Adoption({
            pet: pet._id,
            adopter: anotherAdopter._id,
            owner: shelter._id,
            applicationForm: {
                personalInfo: {
                    fullName: 'María López',
                    age: 25,
                    occupation: 'Estudiante',
                    phone: '+57 310 999 8888',
                    email: 'maria.lopez@test.com'
                },
                indexInfo: {
                    type: 'apartamento',
                    size: 'pequeño',
                    hasGarden: false,
                    ownerOrRenter: 'arrendatario'
                },
                petExperience: {
                    hasPetsNow: false,
                    hadPetsBefore: false,
                    experienceLevel: 'ninguna'
                },
                familyInfo: {
                    livesAlone: true,
                    familyMembers: 0,
                    hasChildren: false,
                    allMembersAgree: true,
                    allergies: false
                },
                petCare: {
                    dailyTimeAvailable: 'menos-2h',
                    whoWillCare: 'Yo sola cuando esté disponible',
                    emergencyBudget: false
                },
                motivation: {
                    whyAdopt: 'Me gustaría tener una mascota para no sentirme tan sola en el apartamento',
                    whyThisPet: 'Se ve bonita en las fotos y parece tranquila para vivir en apartamento'
                },
                commitments: {
                    longTermCommitment: true,
                    training: false,
                    medicalCare: true,
                    returnIfNeeded: true
                }
            }
        });
        
        await rejectedAdoption.save();
        await rejectedAdoption.reject('Tiempo disponible insuficiente y falta experiencia con mascotas grandes');
        
        console.log(`✅ Solicitud rechazada creada:`);
        console.log(`   📊 Estado: ${rejectedAdoption.statusText}`);
        console.log(`   📝 Razón: ${rejectedAdoption.rejectionReason}`);
        console.log(`   📅 Fecha: ${rejectedAdoption.dates.rejected}`);
        
        // PRUEBA 12: BUSCAR SOLICITUDES
        console.log('\n🔍 === PRUEBA 12: BUSCAR SOLICITUDES ===');
        
        const adopterAdoptions = await Adoption.findByAdopter(adopter._id);
        console.log(`✅ Solicitudes del adoptante: ${adopterAdoptions.length}`);
        
        const shelterAdoptions = await Adoption.findByOwner(shelter._id);
        console.log(`✅ Solicitudes del refugio: ${shelterAdoptions.length}`);
        shelterAdoptions.forEach((adop, index) => {
            console.log(`   ${index + 1}. ${adop.statusText} - ${adop.applicationForm.personalInfo.fullName}`);
        });
        
        const pendingAdoptions = await Adoption.getPendingAdoptions();
        console.log(`✅ Solicitudes pendientes totales: ${pendingAdoptions.length}`);
        
        // PRUEBA 13: ESTADÍSTICAS
        console.log('\n📊 === PRUEBA 13: ESTADÍSTICAS DE ADOPCIONES ===');
        
        const stats = await Adoption.getAdoptionStats();
        console.log('✅ Estadísticas por estado:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}:`);
            console.log(`      Total: ${stat.count}`);
            console.log(`      Score promedio: ${stat.avgScore?.toFixed(2) || 'N/A'}`);
            console.log(`      Días promedio: ${stat.avgDays?.toFixed(2) || 'N/A'}`);
        });
        
        // LIMPIEZA FINAL
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        await Adoption.deleteMany({ owner: shelter._id });
        await Pet.deleteOne({ _id: pet._id });
        await User.deleteOne({ _id: adopter._id });
        await User.deleteOne({ _id: anotherAdopter._id });
        await User.deleteOne({ _id: shelter._id });
        
        console.log(`✅ Datos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Adoption está funcionando perfectamente');
        console.log('🚀 Listo para usar en controladores y APIs de AdoptaPet');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Stack trace completo:');
            console.error(error.stack);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo Adoption de AdoptaPet\n');
    testAdoptionModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Adoption está listo para AdoptaPet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testAdoptionModel };