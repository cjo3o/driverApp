const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');

router.get('/', async (req, res) => {
    console.log('req.query:', req.query);
    const { re_num } = req.query;

    let deliveryData = null;

    if (re_num) {
        try {
            const { data, error } = await supabase
                .from('delivery')
                .select('*')
                .eq('re_num', re_num)
                .single();

            if (error) {
                console.error('Supabase 오류:', error);
            } else {
                deliveryData = data;
                console.log('배송 데이터:', deliveryData);
            }
        } catch (error) {
            console.error('서버 오류:', error);
        }
    }

    res.render('detail', {
        title: '상세보기',
        deliveryData
    });
});

router.post('/', async (req, res) => {
    const {re_num} = req.body;
    const {data, error} = await supabase
        .from('delivery')
        .update({
            situation: '배송대기'
        })
        .eq('re_num', re_num);
    console.log('data', data);
});

module.exports = router;