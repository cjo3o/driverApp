const express = require('express');
const router = express.Router();

router.get('',(req, res, next) => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[now.getDay()];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    console.log(month);
    console.log(date);
    console.log(dayOfWeek);
    res.render('main', {title: '메인페이지', user: req.session.user, month, date, dayOfWeek});
})


module.exports = router;