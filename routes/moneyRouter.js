const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment');

router.get('/money', async (req, res, next) => {
    const driverId = req.session.driver_id || 'TEST_DRIVER_ID';

    const selectedYear = req.query.year || moment().format('YYYY');
    const selectedMonth = req.query.month || moment().format('MM').padStart(2, '0');
    const selectedYM = `${selectedYear}.${selectedMonth}`;

    // 기사명 조회
    const { data: driverData, error: driverError } = await supabase
        .from('DriverList')
        .select('driver_name')
        .eq('driver_id', driverId)
        .single();

    if (driverError) return next(driverError);

    // 배송 데이터 조회
    const { data, error } = await supabase
        .from('deliveryList')
        .select('f_time, price')
        .eq('driver_id', driverId)
        .not('f_time', 'is', null);

    if (error) return next(error);

   // 일별/월별 집계
   const dailyCount = {};
   const monthlyCount = {};
   let totalAmount = 0;

   data.forEach(row => {
       const date = moment(row.f_time);
       const monthKey = date.format('YYYY.MM');
       const dayKey = date.format('YYYY.MM.DD');

        // 월별 건수
        monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;

        // 선택한 월에 해당하면 일별 건수 + 정산 누적
       if (monthKey === selectedYM) {
            dailyCount[dayKey] = (dailyCount[dayKey] || 0) + 1;
            totalAmount += (row.price || 0) * 0.5;
        }
    });

    // 총 건수
    const totalCount = monthlyCount[selectedYM] || 0;

    // 기사명
    const driverName = driverData?.driver_name || '기사';

    res.render('money.html', {
        title: '정산페이지',
        driverName,
        totalAmount,
        totalCount,
        dailyCount,
        selectedYear,
        selectedMonth,
    });
});

module.exports = router;