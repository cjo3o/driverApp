const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');
const moment = require('moment');
const webpush = require("web-push");

router.get('/', (req, res) => {
    res.render('alert');
});


// 알림 등록
router.post('/', async (req, res) => {
    const { dl_id, status } = req.body;

    if (!dl_id || !status) {
        return res.status(400).json({ error: 'dl_id와 status는 필수입니다.' });
    }

    try {
        // 1-1. deliveryList에서 re_num 조회
        const { data: deliveryList, error: dlError } = await supabase
            .from('deliveryList')
            .select('re_num')
            .eq('dl_id', dl_id)
            .single();

        if (dlError || !deliveryList) {
            console.error('❌ re_num 조회 실패:', dlError?.message || '데이터 없음');
            return res.status(404).json({ error: 'deliveryList에서 re_num 조회 실패' });
        }

        const re_num = deliveryList.re_num;

        //1-2. delivery에서 user_id 조회
        const { data: delivery, error: dError } = await supabase
        .from("delivery")
        .select("user_id")
        .eq("re_num", re_num)
        .single();
      if (dError || !delivery) {
        return res.status(404).json({ error: "user_id 조회 실패" });
      }

        const user_id = delivery.user_id;

        // 2. 알림 메시지 생성 (앞 8글자만 + ···)
        const shortReNum = re_num.slice(0, 8);
        const message = `${shortReNum}···가 ${status} 상태입니다.`;

        // 3. alerts 테이블에 삽입
        await supabase.from("alerts").insert({
            dl_id,
            status,
            created_at: new Date().toISOString(),
            update_at: new Date().toISOString()
          });
      
          // 4. subscription에서 해당 user_id의 푸시 구독 정보 조회
          const { data: subscriptions, error: subError } = await supabase
            .from("subscription")
            .select("subscription")
            .eq("user_id", user_id);
      
          if (subError || !subscriptions || subscriptions.length === 0) {
            return res.status(200).json({
              message: "알림 기록은 성공했으나, 해당 user_id의 푸시 구독 정보가 없습니다.",
            });
          }
      
          const payload = JSON.stringify({
            title: "짐보관 배송 상태 알림",
            body: message,
          });
      
          // 5. 알림 전송
          const results = await Promise.allSettled(
            subscriptions.map((s, idx) => {
              let subObj = s.subscription;
              try {
                if (typeof subObj === "string") {
                  subObj = JSON.parse(subObj);
                  if (typeof subObj === "string") {
                    subObj = JSON.parse(subObj);
                  }
                }
              } catch (e) {
                console.error(`❌ [${idx}] JSON 파싱 실패`, e);
                return Promise.reject(e);
              }
      
              return webpush.sendNotification(subObj, payload)
                .then(() => console.log(`✅ [${idx}] 푸시 전송 성공`))
                .catch((err) => {
                  console.error(`🚨 [${idx}] 푸시 전송 실패`, err);
                  return Promise.reject(err);
                });
            })
          );
      results();
          return res.status(200).json({
            success: true,
            message: "알림 기록 및 푸시 전송 완료",
            results,
          });
      
        } catch (err) {
          console.error("❌ 서버 오류:", err.message);
          return res.status(500).json({ error: "서버 내부 오류", detail: err.message });
        }
      });

      router.post("/subscribe", async (req, res) => {
        console.log("✅ POST /subscribe 호출됨");
      
        if (!req.body) {
          console.error("❌ body가 없음");
          return res.status(400).json({ message: "body 없음" });
        }
      
        const { user_id, subscription } = req.body;
      
        if (!user_id || !subscription) {
          console.error("❌ 필수 항목 누락됨", req.body);
          return res.status(400).json({ message: "user_id 또는 subscription 누락" });
        }
      
        console.log("💬 받은 구독 데이터:", user_id, subscription);
      
        const { error } = await supabase
            .from("subscription")
            .insert({
              user_id,
              subscription, // ✅ JSON.stringify 제거: Supabase가 json으로 인식
              created_at: getKstISOString(),
            });
      
        if (error) {
          console.error("❌ Supabase insert error:", error);
          return res.status(400).json({ message: "DB insert 실패", error: error.message });
        }
      
        res.status(200).json({ message: "구독 성공", received: true });
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
                dl_id: alert.dl_id,
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

// /alert/detail-info?dl_id=xxxx → re_num 조회용
router.get('/detail-info', async (req, res) => {
    const { dl_id } = req.query;

    if (!dl_id) {
        return res.status(400).json({ error: 'dl_id가 필요합니다.' });
    }

    try {
        const { data, error } = await supabase
            .from('deliveryList')
            .select('re_num')
            .eq('dl_id', dl_id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: '해당 dl_id에 대한 re_num을 찾을 수 없습니다.' });
        }

        return res.status(200).json({ re_num: data.re_num });

    } catch (err) {
        console.error('❌ /alert/detail-info 서버 오류:', err.message);
        return res.status(500).json({ error: '서버 내부 오류 발생' });
    }
});

// test postman용 send
router.post("/send", async (req, res) => {
    const { title, body, url } = req.body;
    const payload = JSON.stringify({ title, body, url });
  
    const { data: subscribers, error } = await supabase
        .from("subscription")
        .select("*");
    console.log("알람 송신 전 조회 결과 : ",subscribers);
    if (error) {
      console.error("❌ Supabase SELECT 실패", error);
      return res.status(500).json({ error: error.message });
    }
  
    if (!subscribers || subscribers.length === 0) {
      return res.status(400).json({ error: "등록된 구독 정보가 없습니다." });
    }
  
    const results = await Promise.allSettled(
        subscribers.map((s, idx) => {
          let subObj = s.subscription;
            console.log("subObj",subObj);
          try {
            if (typeof subObj === "string") {
              subObj = JSON.parse(subObj);
              if (typeof subObj === "string") {
                subObj = JSON.parse(subObj);
              }
            }
          } catch (e) {
            console.error(`❌ [${idx}] JSON 파싱 실패:`, e);
            return Promise.reject(e);
          }
  
          return webpush.sendNotification(subObj, payload).then(res=>console.log("알림전송성공:",res)).catch((err) => {
            console.error(`🚨 [${idx}] 푸시 전송 실패:`, err);
            return Promise.reject(err);
          });
        })
    );
  
    console.log("✅ 푸시 전송 결과:", results);
  
    res.status(200).json({ message: "알림 전송 완료", results });
  });

module.exports = router;
