const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment');

router.get('/', async (req, res) => {
    const user = req.session.user;

    if (!user || !user.driver_id) {
        console.error('🚫 세션에 로그인 정보 없음');
        return res.status(401).send('로그인이 필요합니다.');
    }

    const driverId = user.driver_id;
    const selectedYear = String(req.query.year || moment().format('YYYY'));
    const selectedMonth = String(req.query.month || moment().format('MM')).padStart(2, '0');
    const selectedYM = `${selectedYear}.${selectedMonth}`;

    // deliveryList 테이블에서 필터링
    const { data, error } = await supabase
        .from('deliveryList')
        .select('f_time, price')
        .eq('driver_id', driverId)
        .not('f_time', 'is', null);

    if (error || !data) {
        console.error('❗ 배송 데이터 조회 오류:', error);
        return res.status(500).send('배송 데이터를 불러올 수 없습니다.');
    }

    // 정산 계산 및 일/월별 집계
    const dailyCount = {};
    const monthlyCount = {};
    let totalAmount = 0;

    data.forEach(row => {
        const date = moment(row.f_time);
        const monthKey = date.format('YYYY.MM');
        const dayKey = date.format('YYYY.MM.DD');

        monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;

        if (monthKey === selectedYM) {
            dailyCount[dayKey] = (dailyCount[dayKey] || 0) + 1;
            totalAmount += (row.price || 0) * 0.5;
        }
    });

    const totalCount = monthlyCount[selectedYM] || 0;

    res.render('money.html', {
        title: '정산페이지',
        user, // user.name, user.driver_id 사용 가능
        totalAmount,
        totalCount,
        dailyCount,
        selectedYear,
        selectedMonth
    });
});

module.exports = router;
