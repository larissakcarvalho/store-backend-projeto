const express = require('express')
const controller = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.post('/', controller.create)
router.post('/token', controller.createToken)
router.get('/:id', controller.show)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.remove)

module.exports = router
