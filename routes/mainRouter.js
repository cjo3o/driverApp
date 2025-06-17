const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');

router.get('/', async (req, res, next) => {
    console.log('사진', req.session.user);
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[now.getDay()];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    let resData = [];
    try {
        const { data, error } = await supabase
            .from('delivery')
            .select('*')
            .eq('situation', '접수');
        resData = data;
        console.log(resData);
    } catch (error) {
        console.log(error);
    };

    res.render('main', {
        title: '메인페이지',
        user: req.session.user,
        month,
        date,
        dayOfWeek,
        resData
    });
});


module.exports = router;