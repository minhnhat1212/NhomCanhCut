var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');
let { CheckLogin, checkRole } = require('../utils/authHandler');

router.get('/', CheckLogin, checkRole('ADMIN', 'MODERATOR'), async function (req, res, next) {
  try {
    let list = await inventoryModel.find({}).populate('product').sort({ updatedAt: -1 });
    res.send(list);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get('/product/:productId', CheckLogin, async function (req, res, next) {
  try {
    let inv = await inventoryModel.findOne({ product: req.params.productId }).populate('product');
    if (!inv) {
      res.status(404).send({ message: 'khong tim thay ton kho' });
      return;
    }
    res.send(inv);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get('/:id', CheckLogin, checkRole('ADMIN', 'MODERATOR'), async function (req, res, next) {
  try {
    let inv = await inventoryModel.findById(req.params.id).populate('product');
    if (!inv) {
      res.status(404).send({ message: 'khong tim thay ton kho' });
      return;
    }
    res.send(inv);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.put('/:id', CheckLogin, checkRole('ADMIN', 'MODERATOR'), async function (req, res, next) {
  try {
    let allowed = ['stock', 'reserved', 'soldCount'];
    let patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    let inv = await inventoryModel.findByIdAndUpdate(req.params.id, patch, { new: true }).populate('product');
    if (!inv) {
      res.status(404).send({ message: 'khong tim thay ton kho' });
      return;
    }
    res.send(inv);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
