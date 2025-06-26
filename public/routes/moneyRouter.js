const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment');

router.get('/', async (req, res) => {
    const user = req.session.user;

    if (!user || !user.id) {
        console.error('🚫 세션에 로그인 정보 없음');
        return res.status(401).send('로그인이 필요합니다.');
    }

    const driverId = user.id;
    const selectedYear = String(req.query.year || moment().format('YYYY'));
    const selectedMonth = String(req.query.month || moment().format('MM')).padStart(2, '0');
    const selectedYM = `${selectedYear}.${selectedMonth}`;

    // deliveryList 테이블에서 필터링
    const { data, error } = await supabase
        .from('deliveryList')
        .select('f_time, price')
        .eq('driver_id', driverId)
        .not('f_time', 'is', null);

    if (error || !Array.isArray(data)) {
        console.error('❗ 배송 데이터 조회 오류:', error);
        return res.status(500).send('배송 데이터를 불러올 수 없습니다.');
    }

    const dailyCount = {};
    const dailyAmount = {};

    data.forEach(row => {
        const date = moment(row.f_time);
        const monthKey = date.format('YYYY.MM');
        const dayKey = date.format('YYYY.MM.DD');

        if (monthKey === selectedYM) {
            // 일별 건수
            dailyCount[dayKey] = (dailyCount[dayKey] || 0) + 1;

            // 일별 금액
            const amount = (row.price || 0) * 0.5;
            dailyAmount[dayKey] = (dailyAmount[dayKey] || 0) + amount;
        }
    });

    // 월별 총합 계산
    let totalCount = Object.values(dailyCount).reduce((sum, v) => sum + v, 0);
    let totalAmount = Object.values(dailyAmount).reduce((sum, v) => sum + v, 0);

    function formatNumber(num) {
        return Number(num || 0).toLocaleString('ko-KR');
    }

    Object.keys(dailyAmount).forEach(date => {
        dailyAmount[date] = formatNumber(dailyAmount[date]);
    });

    totalAmount = formatNumber(totalAmount);
    totalCount = formatNumber(totalCount);

    const daysInMonth = moment(`${selectedYear}-${selectedMonth}`, "YYYY-MM").daysInMonth();
    const fullDateList = Array.from({ length: daysInMonth }, (_, i) => {
        return moment(`${selectedYear}-${selectedMonth}-${i + 1}`, "YYYY-MM-DD").format("YYYY.MM.DD");
    });

    const dailyList = fullDateList.map(date => ({
        date,
        count: dailyCount[date] || 0,
        amount: dailyAmount[date] || '0'
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 렌더링
    res.render('money.html', {
        title: '정산페이지',
        user,
        dailyList,
        totalCount,
        totalAmount,
        selectedYear,
        selectedMonth
    });
});


module.exports = router;
