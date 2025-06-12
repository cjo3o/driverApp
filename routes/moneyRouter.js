const express = require('express');

router = express.Router();

router.route('')
    .get((req, res, next) => {
        res.render('money');
    })

module.exports = router;