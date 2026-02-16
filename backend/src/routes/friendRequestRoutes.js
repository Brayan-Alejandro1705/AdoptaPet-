const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/friendRequestController');

router.use(protect);

router.post('/send/:userId', controller.sendFriendRequest);
router.get('/received', controller.getReceivedRequests);
router.get('/sent', controller.getSentRequests);
router.put('/accept/:requestId', controller.acceptFriendRequest);
router.put('/reject/:requestId', controller.rejectFriendRequest);
router.delete('/cancel/:userId', controller.cancelFriendRequest);
router.get('/status/:userId', controller.checkFriendshipStatus);
router.get('/friends/:userId', controller.getFriends);
router.get('/friends', controller.getFriends);

module.exports = router;