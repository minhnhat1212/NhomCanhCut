var express = require("express");
var router = express.Router();
let mongoose = require('mongoose')
let reservationModel = require('../schemas/reservation')
let cartModel = require('../schemas/carts')
let inventoryModel = require('../schemas/inventories')
let { CheckLogin, checkRole } = require('../utils/authHandler')

router.get("/", CheckLogin, async function (req, res, next) {
    let query = { user: req.user._id };
    if (["ADMIN", "MODERATOR"].includes(req.user.role.name)) {
        query = {};
    }
    let reservations = await reservationModel.find(query).sort({ createdAt: -1 });
    res.send(reservations);
});

router.get("/:id", CheckLogin, async function (req, res, next) {
    try {
        let reservation = await reservationModel.findById(req.params.id).populate('user items.product');
        if (!reservation) {
            res.status(404).send({ message: "reservation not found" });
            return;
        }
        let isOwner = reservation.user._id.toString() === req.user._id.toString();
        let isStaff = ["ADMIN", "MODERATOR"].includes(req.user.role.name);
        if (!isOwner && !isStaff) {
            res.status(403).send({ message: "ban khong co quyen" });
            return;
        }
        res.send(reservation);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post("/", CheckLogin, async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let cart = await cartModel.findOne({ user: req.user._id }).session(session).populate('items.product');
        if (!cart || cart.items.length === 0) {
            throw new Error("gio hang rong");
        }

        let reservationItems = [];
        let amount = 0;
        for (const item of cart.items) {
            let inventory = await inventoryModel.findOne({ product: item.product._id }).session(session);
            if (!inventory) throw new Error("khong tim thay ton kho");
            let available = inventory.stock - inventory.reserved;
            if (available < item.quantity) throw new Error(`khong du hang cho ${item.product.title}`);

            inventory.reserved += item.quantity;
            await inventory.save({ session });

            let subtotal = item.quantity * item.product.price;
            amount += subtotal;
            reservationItems.push({
                product: item.product._id,
                title: item.product.title,
                quantity: item.quantity,
                price: item.product.price,
                subtotal: subtotal
            });
        }

        let reservation = new reservationModel({
            user: req.user._id,
            items: reservationItems,
            amount: amount,
            expiredIn: new Date(Date.now() + 15 * 60 * 1000)
        });
        reservation = await reservation.save({ session });

        cart.items = [];
        await cart.save({ session });

        await session.commitTransaction();
        await session.endSession();
        res.send(reservation);
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        res.status(400).send({ message: error.message });
    }
});

router.put("/:id/status", CheckLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    try {
        let allowedStatus = ["cancelled", "paid", "expired", "actived"];
        let nextStatus = req.body.status;
        if (!allowedStatus.includes(nextStatus)) {
            res.status(400).send({ message: "status khong hop le" });
            return;
        }
        let reservation = await reservationModel.findByIdAndUpdate(
            req.params.id,
            { status: nextStatus },
            { new: true }
        );
        if (!reservation) {
            res.status(404).send({ message: "reservation not found" });
            return;
        }
        res.send(reservation);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post("/:id/cancel", CheckLogin, async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let reservation = await reservationModel.findById(req.params.id).session(session);
        if (!reservation) throw new Error("reservation not found");

        let isOwner = reservation.user.toString() === req.user._id.toString();
        let isStaff = ["ADMIN", "MODERATOR"].includes(req.user.role.name);
        if (!isOwner && !isStaff) throw new Error("ban khong co quyen");
        if (reservation.status !== "actived") throw new Error("chi huy duoc reservation dang actived");

        for (const item of reservation.items) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (inventory) {
                inventory.reserved = Math.max(0, inventory.reserved - item.quantity);
                await inventory.save({ session });
            }
        }

        reservation.status = "cancelled";
        await reservation.save({ session });

        await session.commitTransaction();
        await session.endSession();
        res.send(reservation);
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;