const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');

router.get('/', async (req, res, next) => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[now.getDay()];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    let resData = [];

    if (!req.session.user) {
        return res.redirect('/login');
    }

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

    const { data: myList, error: myListError } = await supabase
        .from('deliveryList')
        .select('*')
        .eq('driver_id', req.session.user?.id);
    console.log('myList', myList);

    const myList_waiting = myList?.filter(item => item.status === '배송대기');
    const myList_delivering = myList?.filter(item => item.status === '배송중');
    const myList_complete = myList?.filter(item => {
        if (item.status === '배송완료' && item.f_time.split('T')[0] === now.toISOString().split('T')[0]) {
            console.log('배송완료', item);
            return item;
        }
    });

    res.render('main', {
        title: '메인페이지',
        user: req.session.user,
        month,
        date,
        dayOfWeek,
        resData,
        myList_waiting,
        myList_delivering,
        myList_complete
    });
});


module.exports = router;