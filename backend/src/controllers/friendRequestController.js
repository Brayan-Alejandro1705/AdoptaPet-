const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const fromUserId = req.user._id;

    if (fromUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviarte una solicitud a ti mismo'
      });
    }

    const toUser = await User.findById(userId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya son amigos
    const areAlreadyFriends = await User.findOne({
      _id: fromUserId,
      friends: userId
    });

    if (areAlreadyFriends) {
      return res.status(400).json({
        success: false,
        message: 'Ya son amigos'
      });
    }

    // Verificar cualquier solicitud previa (independientemente del estado)
    let friendRequest = await FriendRequest.findOne({
      from: fromUserId,
      to: userId
    });

    if (friendRequest) {
      if (friendRequest.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una solicitud pendiente'
        });
      } else if (friendRequest.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Ya son amigos'
        });
      } else if (friendRequest.status === 'rejected') {
        // ✅ Si fue rechazada, la reactivamos
        friendRequest.status = 'pending';
        friendRequest.message = req.body.message || '';
        await friendRequest.save();
      }
    } else {
      // 🕵️ Verificar si hay una solicitud inversa pendiente
      const reverseRequest = await FriendRequest.findOne({
        from: userId,
        to: fromUserId,
        status: 'pending'
      });

      if (reverseRequest) {
        return res.status(400).json({
          success: false,
          message: 'Este usuario ya te envió una solicitud. Búscala en tus solicitudes recibidas.'
        });
      }

      // ✅ Solo crear si no existe ninguna en esa dirección
      friendRequest = await FriendRequest.create({
        from: fromUserId,
        to: userId,
        message: req.body.message || ''
      });
    }

    // Crear notificación
    await Notification.create({
      recipient: userId,
      sender: fromUserId,
      type: 'friend_request',
      message: `Te ha enviado una solicitud de amistad`,
      relatedId: friendRequest._id,
      relatedModel: 'FriendRequest' // Actualizaremos el modelo Notification.js luego
    });

    await friendRequest.populate('from', 'name nombre email avatar');
    await friendRequest.populate('to', 'name nombre email avatar');

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada',
      data: friendRequest
    });
  } catch (error) {
    console.error('❌ ERROR FATAL en sendFriendRequest:', {
      error: error.message,
      stack: error.stack,
      from: req.user._id,
      to: req.params.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al enviar solicitud de amistad',
      error: error.message
    });
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user._id,
      status: 'pending'
    })
      .populate('from', 'name nombre email avatar bio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      from: req.user._id,
      status: 'pending'
    })
      .populate('to', 'name nombre email avatar bio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      to: req.user._id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.from, {
      $addToSet: { friends: friendRequest.to }
    });

    await User.findByIdAndUpdate(friendRequest.to, {
      $addToSet: { friends: friendRequest.from }
    });

    await Notification.create({
      recipient: friendRequest.from,
      sender: req.user._id,
      type: 'friend_accept',
      message: 'Ha aceptado tu solicitud de amistad',
      relatedId: friendRequest._id
    });

    res.json({
      success: true,
      message: 'Solicitud aceptada',
      data: friendRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      to: req.user._id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Solicitud rechazada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await FriendRequest.findOneAndDelete({
      from: req.user._id,
      to: userId,
      status: 'pending'
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Solicitud cancelada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const checkFriendshipStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const areFriends = await User.findOne({
      _id: currentUserId,
      friends: userId
    });

    if (areFriends) {
      return res.json({
        success: true,
        status: 'friends'
      });
    }

    const sentRequest = await FriendRequest.findOne({
      from: currentUserId,
      to: userId,
      status: 'pending'
    });

    if (sentRequest) {
      return res.json({
        success: true,
        status: 'sent'
      });
    }

    const receivedRequest = await FriendRequest.findOne({
      from: userId,
      to: currentUserId,
      status: 'pending'
    });

    if (receivedRequest) {
      return res.json({
        success: true,
        status: 'received'
      });
    }

    res.json({
      success: true,
      status: 'none'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const user = await User.findById(userId)
      .populate('friends', 'name nombre email avatar bio location createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user.friends || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error.message
    });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no proporcionado'
      });
    }

    // 1. Quitar de la lista de amigos de ambos
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { friends: currentUserId }
    });

    // 2. Eliminar cualquier solicitud de amistad previa (limpiar historial para permitir nuevas solicitudes)
    await FriendRequest.deleteMany({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ]
    });

    res.json({
      success: true,
      message: 'Amigo eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar amigo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al eliminar amigo',
      error: error.message
    });
  }
};

module.exports = {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  checkFriendshipStatus,
  getFriends,
  removeFriend
};