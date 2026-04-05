var express = require('express');
var router = express.Router();
let { CheckLogin } = require('../utils/authHandler')
let messageSchema = require('../schemas/messages')
let userSchema = require('../schemas/users')
let { uploadImage } = require('../utils/uploadHandler')

router.post('/', CheckLogin, uploadImage.single('file'), async function (req, res, next) {
    let userFromId = req.user._id;
    let userToId = req.body.to;
    let getUser = await userSchema.findById(userToId);
    if (!getUser) {
        res.status(404).send({
            message: "user khong ton tai"
        })
    }
    let message = {};
    if (req.file) {
        message.type = "file";
        message.text = req.file.path
    } else {
        message.type = "text";
        message.text = req.body.text
    }
    let newMess = new messageSchema({
        from: userFromId,
        to: userToId,
        messageContent: message
    })
    await newMess.save();
    res.send(newMess)
})
router.get('/:userID', CheckLogin, async function (req, res, next) {
    let user01 = req.user._id;
    let user02 = req.params.userID;
    let getUser = await userSchema.findById(user02);
    if (!getUser) {
        res.status(404).send({
            message: "user khong ton tai"
        })
    }
    let messages = await messageSchema.find({
        $or: [{
            from: user01,
            to: user02
        }, {
            from: user02,
            to: user01
        }]
    }).sort({
        createdAt: -1
    }).populate('from to')
    res.send(messages)
})

router.get('/', CheckLogin, async function (req, res, next) {
    let user01 = req.user._id;
    let messages = await messageSchema.find({
        $or: [{
            from: user01
        }, {
            to: user01
        }]
    }).sort({
        createdAt: -1
    })
    let messageMap = new Map();
    for (const message of messages) {
        let user02 = user01.toString() == message.from.toString() ? message.to.toString() : message.from.toString();
        if (!messageMap.has(user02)) {
            messageMap.set(user02, message)
        }
    }
    let result = [];
    messageMap.forEach(function (value, key) {
        result.push({
            user: key,
            message: value
        })
    })
    res.send(result)
})

module.exports = router;