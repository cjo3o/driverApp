const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment');

// 알림 등록
router.get('/', async (req, res) => {
    const { dl_id, status } = req.body;

    if (!dl_id || !status) {
        return res.status(400).json({ error: 'dl_id와 status는 필수입니다.' });
    }

    try {
        // 1. deliveryList에서 re_num 조회
        const { data: deliveryList, error: dlError } = await supabase
            .from('deliveryList')
            .select('re_num')
            .eq('dl_id', dl_id)
            .single();

        if (dlError || !deliveryList) {
            return res.status(404).json({ error: 'deliveryList에서 re_num 조회 실패' });
        }

        const re_num = deliveryList.re_num;

        // 2. 알림 메시지 생성 (앞 8글자만 + ···)
        const shortReNum = re_num.slice(0, 8);
        const message = `${shortReNum}···가 ${status} 상태입니다.`;

        // 3. alerts 테이블에 삽입
        const { error: insertError } = await supabase
            .from('alerts')
            .insert({
                dl_id,
                status,
                created_at: new Date().toISOString(),
                update_at: new Date().toISOString()
            });

        if (insertError) {
            return res.status(500).json({ error: '알림 삽입 실패', detail: insertError.message });
        }

        // 4. 응답 반환
        return res.status(200).json({
            success: true,
            re_num,
            shortReNum,
            message
        });

    } catch (err) {
        console.error('서버 오류:', err.message);
        return res.status(500).json({ error: '서버 내부 오류', detail: err.message });
    }
});

// 알림 리스트 조회
router.get('/list', async (req, res) => {
    try {
        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('created_at, status, dl_id')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: '알림 조회 실패', detail: error.message });
        }

        const groupedAlerts = {};

        alerts.forEach(alert => {
            const date = moment(alert.created_at).format('YYYY-MM-DD');
            const today = moment().format('YYYY-MM-DD');
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

            let label;
            if (date === today) {
                label = '오늘';
            } else if (date === yesterday) {
                label = '어제';
            } else {
                label = moment(date).format('YYYY.MM.DD');
            }

            if (!groupedAlerts[label]) {
                groupedAlerts[label] = [];
            }

            groupedAlerts[label].push({
                message: `${alert.dl_id.slice(0, 8)}···가 ${alert.status} 상태입니다.`,
                created_at: moment(alert.created_at).format('HH:mm')
            });
        });

        return res.status(200).json(groupedAlerts);
    } catch (err) {
        console.error('서버 오류:', err.message);
        return res.status(500).json({ error: '서버 내부 오류', detail: err.message });
    }
});

module.exports = router;
