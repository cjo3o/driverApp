const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
});

router.get('/', async (req, res) => {
    console.log('req.query:', req.query);
    const {re_num} = req.query;

    let deliveryData = null;
    let deliveryStatus = null;
    let s_time = null;
    let f_time = null;

    if (re_num) {
        try {
            const {data, error} = await supabase
                .from('delivery')
                .select('*')
                .eq('re_num', re_num)
                .single();

            if (error) {
                console.error('Supabase 오류:', error);
            } else {
                deliveryData = data;
                deliveryStatus = data.situation;
                console.log('배송 데이터:', deliveryData);
                console.log('배송 상태:', deliveryStatus);
            }
        } catch (error) {
            console.error('서버 오류:', error);
        }
    }

    if (deliveryStatus !== '접수') {
        const {data, error} = await supabase
            .from('deliveryList')
            .select('*')
            .eq('re_num', re_num)
            .single();

        data.s_time === null ? s_time = '-' : s_time = data.s_time.split('T')[0] + ' ' + data.s_time.split('T')[1].split(':')[0] + ':' + data.s_time.split('T')[1].split(':')[1];
        data.f_time === null ? f_time = '-' : f_time = data.f_time.split('T')[0] + ' ' + data.f_time.split('T')[1].split(':')[0] + ':' + data.f_time.split('T')[1].split(':')[1];
        console.log('s_time:', s_time);
        console.log('f_time:', f_time);
        if (error) {
            console.error('Supabase 오류:', error);
        }
    }

    res.render('detail', {
        title: '상세보기',
        deliveryData,
        user: req.session.user,
        s_time,
        f_time
    });
});

router.post('/', upload.single('delivery_photo'), async (req, res) => {
    const {
        re_num,
        driver_id,
        status,
        driver_name,
        driver_phone,
        start_time,
        finish_time,
    } = req.body;

    let photo_url = null;

    if (status === '배송중') {
        if (req.file) {
            const file = req.file;
            const fileName = `${re_num}_${Date.now()}`;
            const {
                error: uploadError
            } = await supabase.storage
                .from('deliveryconfilm')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                });

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
            } else {
                const {
                    data: urlData
                } = supabase.storage.from('deliveryconfilm').getPublicUrl(fileName);
                photo_url = urlData.publicUrl;
            }
        }
    }

    if (status === '접수') {
        const {data, error} = await supabase
            .from('delivery')
            .update({
                situation: '배송대기'
            })
            .eq('re_num', re_num)
            .single();

        const {data: statLogs, error: logError} = await supabase
            .from('status_logs')
            .insert({
                table_name: "delivery",
                key_value: re_num,
                prev_status: status,
                new_status: "배송대기",
                updated_at: new Date().toISOString(),
                operator: driver_name,
            });
        
    } else if (status === '배송대기') {
        const {data, error} = await supabase
            .from('delivery')
            .update({
                situation: '배송중'
            })
            .eq('re_num', re_num)
            .single();

        const {data: statLogs, error: logError} = await supabase
            .from('status_logs')
            .insert({
                table_name: "delivery",
                key_value: re_num,
                prev_status: status,
                new_status: "배송중",
                updated_at: new Date().toISOString(),
                operator: driver_name,
            });

    } else if (status === '배송중') {
        const {data, error} = await supabase
            .from('delivery')
            .update({
                situation: '배송완료'
            })
            .eq('re_num', re_num)
            .single();

        const {data: statLogs, error: logError} = await supabase
            .from('status_logs')
            .insert({
                table_name: "delivery",
                key_value: re_num,
                prev_status: status,
                new_status: "배송완료",
                updated_at: new Date().toISOString(),
                operator: driver_name,
            });

    }

    // 예약정보 조회
    const {data: reservation, error: reservationError} = await supabase
        .from('delivery')
        .select('*')
        .eq('re_num', re_num)
        .single();

    // 마이리스트 추가 || 상태 업데이트
    const {data: delivery, error: deliveryError} = await supabase
        .from('deliveryList')
        .upsert({
            re_num: re_num,
            driver_id: driver_id,
            status: reservation.situation,
            delivery_date: reservation.delivery_date,
            delivery_start: reservation.delivery_start,
            delivery_arrive: reservation.delivery_arrive,
            price: reservation.price,
            under: reservation.under,
            over: reservation.over,
            customer_name: reservation.name,
            customer_phone: reservation.phone,
            driver_name: driver_name,
            driver_phone: driver_phone,
            s_time: start_time,
            f_time: finish_time,
            photo_url: photo_url
        }, {onConflict: 're_num'})

    if (deliveryError) {
        console.log('Supabase 오류:', deliveryError);
    }
    res.json({redirectTo: '/'});
});

module.exports = router;