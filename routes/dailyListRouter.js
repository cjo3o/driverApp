const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment'); 

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
    const nextDate = moment(queryDate).add(1, 'days').format('YYYY-MM-DD'); 
    const driverId = user.id;
    let s_time = null;
    let f_time = null;

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
        .gte('f_time', `${queryDate}T00:00:00.000`)   // 2025-06-18 00:00:00.000
        .lt('f_time', `${nextDate}T00:00:00.000`);    // 2025-06-19 00:00:00.000

        // 날짜 포맷팅 함수
        function formatTime(timeStr) {
            if (!timeStr) return '-';
            const [date, time] = timeStr.split('T');
            const [hour, minute] = time.split(':');
            return `${date} ${hour}:${minute}`;
        }
    
        // 각 row에 포맷된 시간 추가
        const formattedList = data.map(item => ({
            ...item,
            s_time_formatted: formatTime(item.s_time),
            f_time_formatted: formatTime(item.f_time),
        }));

    if (error || !Array.isArray(data)) {
        console.error('❗ Supabase 조회 에러:', error?.message || error);
        return res.status(500).send('배송 데이터를 불러올 수 없습니다.');
    }

    res.render('dailyList.html', {
        title: `${selectedDate} 배송 상세`,
        selectedDate,
        deliveryList: formattedList,
    });
});

module.exports = router;
