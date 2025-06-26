const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const axios = require('axios');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
});

router.get('/', async (req, res) => {
    console.log('req.query:', req.query);
    const { re_num, dl_id } = req.query;

    let deliveryData = null;
    let deliveryStatus = null;
    let s_time = null;
    let f_time = null;
    let actualReNum = re_num;
    let dl_photo = null;

    try {
        // dl_id만 있는 경우 → deliveryList에서 re_num 추출
        if (!actualReNum && dl_id) {
            const { data: dlData, error: dlError } = await supabase
                .from('deliveryList')
                .select('re_num')
                .eq('dl_id', dl_id)
                .single();

            if (dlError || !dlData) {
                return res.status(404).send('해당 dl_id에 대한 re_num을 찾을 수 없습니다.');
            }
            actualReNum = dlData.re_num;
            
        }

        // re_num으로 delivery 조회
        const { data, error } = await supabase
            .from('delivery')
            .select('*')
            .eq('re_num', actualReNum)
            .single();

        if (error || !data) {
            return res.status(404).send('해당 re_num의 배송 정보를 찾을 수 없습니다.');
        }

        deliveryData = data;
        deliveryStatus = data.situation;

        // 접수 상태 아니면 deliveryList 조회해서 시간 파싱
        if (deliveryStatus !== '접수') {
            const { data: listData, error: listError } = await supabase
                .from('deliveryList')
                .select('*')
                .eq('re_num', actualReNum)
                .single();

            if (listError || !listData) {
                console.error('deliveryList 조회 실패:', listError);
            } else {
                const format = (isoStr) => {
                    if (!isoStr) return '-';
                    const [date, time] = isoStr.split('T');
                    const [h, m] = time.split(':');
                    return `${date} ${h}:${m}`;
                };
                s_time = format(listData.s_time);
                f_time = format(listData.f_time);
                dl_photo = listData.photo_url;
            }
        }

        res.render('detail', {
            title: '상세보기',
            deliveryData,
            user: req.session.user,
            s_time,
            f_time,
            dl_photo
        });

    } catch (error) {
        console.error('서버 오류:', error.message);
        res.status(500).send('서버 내부 오류 발생');
    }
});

// 상태 변경 및 마이리스트 추가
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

    let nextStatus = '';
    if (status === '접수') nextStatus = '배송대기';
    else if (status === '배송대기') nextStatus = '배송중';
    else if (status === '배송중') nextStatus = '배송완료';

    if (!nextStatus) {
        return res.status(400).json({ error: '올바르지 않은 상태입니다.' });
    }

    // 1. 배송 상태 업데이트
    await supabase
        .from('delivery')
        .update({ situation: nextStatus })
        .eq('re_num', re_num)
        .single();

    // 2. 상태 로그 저장
    await supabase
        .from('status_logs')
        .insert({
            table_name: "delivery",
            key_value: re_num,
            prev_status: status,
            new_status: nextStatus,
            updated_at: new Date().toISOString(),
            operator: driver_name,
        });

    // 3. 사진 업로드 및 photo_url 생성
    let photo_url = null;
    if (status === '배송중' && req.file) {
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${re_num}_${Date.now()}.${fileExt}`;
        // 1. Storage 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('deliveryconfilm')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });
        if (uploadError) {
            console.error('사진 업로드 실패:', uploadError);
            return res.status(500).json({ error: '사진 업로드 실패' });
        }
        // 2. public url 생성
        const { data: publicUrlData } = supabase
            .storage
            .from('deliveryconfilm')
            .getPublicUrl(fileName);
        console.log('publicUrlData:', publicUrlData);
        if (publicUrlData && publicUrlData.publicUrl) {
            photo_url = publicUrlData.publicUrl;
        } else {
            console.error('publicUrl이 null입니다. publicUrlData:', publicUrlData);
            photo_url = null;
        }
        console.log('photo_url:', photo_url);
    }

    // 4. 마이리스트 upsert 전에 reservation 조회
    const { data: reservation } = await supabase
        .from('delivery')
        .select('*')
        .eq('re_num', re_num)
        .single();

    // 5. 마이리스트 추가 || 상태 업데이트 (photo_url이 할당된 후!)
    const { error: deliveryError } = await supabase
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
        }, { onConflict: 're_num' });

    if (deliveryError) {
        console.log('Supabase 오류:', deliveryError);
    }

    // 알림 전송
    const { data: foundDL, error: findError } = await supabase
        .from('deliveryList')
        .select('dl_id')
        .eq('re_num', re_num)
        .limit(1)
        .maybeSingle();

    if (findError || !foundDL) {
        console.error('deliveryList에서 dl_id를 찾을 수 없습니다.');
    } else {
        const dl_id = foundDL.dl_id;
        try {
            console.log('📡 /alert POST 요청 보냄:', dl_id, nextStatus);
            const alertRes = await axios.post('http://localhost:7777/alert', {
                dl_id,
                status: nextStatus
            });
            console.log('✅ 알림 전송 성공:', alertRes.data.message);
        } catch (err) {
            console.error('❌ 알림 전송 실패:', err.message);
        }
    }

    res.json({ redirectTo: '/' });
});

module.exports = router;