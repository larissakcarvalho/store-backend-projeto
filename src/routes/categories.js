const express = require('express')
const controller = require('../controllers/categoryController')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.get('/search', controller.search)
router.get('/:id', controller.show)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.remove)

module.exports = router
