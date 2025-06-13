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
    const { id, pw } = req.body;
    
    try {
        // DriverList 테이블에서 입력된 아이디와 비밀번호가 일치하는 데이터 조회
        const { data, error } = await supabase
            .from('DriverList')
            .select('*')
            .eq('driver_id', id)
            .eq('password', pw)
            .single();
        
        if (error) {
            console.log('로그인 실패:', error);
            return res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
        
        if (data) {
            console.log('로그인 성공:', data);
            const responseData = { 
                success: true, 
                message: '로그인되었습니다.',
                userData: data
            };
            console.log('응답 데이터:', responseData);
            return res.json(responseData);
        } else {
            console.log('일치하는 데이터 없음');
            return res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    } catch (error) {
        console.log('서버 오류:', error);
        return res.json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
})

module.exports = router;