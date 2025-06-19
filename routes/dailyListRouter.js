const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');

router.get('/detail', async (req, res) => {
    const user = req.session.user;

    if (!user || !user.id) {
        console.error('🚫 세션에 로그인 정보 없음');
        return res.status(401).send('로그인이 필요합니다.');
    }

    const selectedDate = req.query.date; // 예: '2025.06.17'
    if (!selectedDate) {
        return res.status(400).send('날짜 파라미터가 필요합니다.');
    }

    const queryDate = selectedDate.replace(/\./g, '-'); // '2025-06-17'
    const driverId = user.id;

    const { data, error } = await supabase
        .from('deliveryList')
        .select(`
            dl_id,
            re_num,
            delivery_start,
            delivery_arrive,
            s_time,
            f_time,
            price
        `)
        .eq('driver_id', driverId)
        .eq('delivery_date', queryDate);

    if (error || !Array.isArray(data)) {
        console.error('❗ Supabase 조회 에러:', error?.message || error);
        return res.status(500).send('배송 데이터를 불러올 수 없습니다.');
    }

    res.render('dailyList.html', {
        title: `${selectedDate} 배송 상세`,
        selectedDate,
        deliveryList: data
    });
});

module.exports = router;
