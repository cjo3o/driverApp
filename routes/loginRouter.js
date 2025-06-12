const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa.js');

router.get('/', async (req, res, next) => {
    const {data, error} = await supabase.from('DriverList').select();
    console.log(data);
    res.render('login', {title: '로그인', data});
})

router.post('/', (req, res, next) => {
    console.log(req.body);
})

module.exports = router;