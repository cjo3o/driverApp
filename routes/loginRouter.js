const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa.js');

router.get('/', async (req, res, next) => {
    const {data, error} = await supabase.from('DriverList').select();
    console.log(data);
    res.render('login', {title: '로그인', data});
})

router.post('/', async (req, res, next) => {
    console.log(req.body);
    const {id, pw} = req.body;

    try {
        const {data, error} = await supabase
            .from('DriverList')
            .select()
            .eq('driver_id', id)
            .eq('password', pw)
            .single();

        console.log(data);

        if (data) {
            req.session.user = data;
        } else {
            console.log('아이디 또는 비밀번호를 확인해주세요.');
        }
    } catch (error) {
        console.log(error);
    }

})

module.exports = router;