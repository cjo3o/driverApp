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
            console.log('로그인 성공:', data);
            return res.status(200).json({ success: true, message: '로그인 성공' });
        } else {
            console.log('아이디 또는 비밀번호를 확인해주세요.');
            return res.status(401).json({ error: '아이디 또는 비밀번호를 확인해주세요.' });
        }
    } catch (error) {
        console.log('로그인 에러:', error);
        return res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
    }
})

module.exports = router;