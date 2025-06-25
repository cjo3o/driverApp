import express from "express";
import webpush from "web-push";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

// 1️⃣ Supabase 클라이언트 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // SERVICE KEY여야 전체 접근 가능
);

// 2️⃣ VAPID 정보 설정
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 3️⃣ 푸시 알림 전송 API
app.post("/send-push", async (req, res) => {
  console.log("🔥 요청 본문:", req.body);
  const { userId, title, body } = req.body;
  console.log("📦 req.body:", req.body);
  if (!userId || !title || !body) {
    return res.status(400).json({ error: "userId, title, body는 필수입니다." });
  }

  // ① Supabase에서 구독 정보 찾기
  const { data, error } = await supabase
    .from("subscription")
    .select("subscription")
    .eq("user_id", userId)
    .maybeSingle();

    if (error) {
      console.error("❌ Supabase 에러:", error.message);
      return res.status(500).json({ error: "Supabase 오류" });
    }
  
    if (!data) {
      return res.status(404).json({ error: "구독 정보 없음" });
    }
  
    const subscription = data.subscription;
console.log("🔥 subscription:", subscription);
  // ② 푸시 발송
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
    console.log("✅ 푸시 발송 성공");
    return res.status(200).json({ success: true, message: "푸시 발송 완료" });
  } catch (err) {
    console.error("❌ 푸시 발송 실패:", err);
    return res.status(500).json({ error: "푸시 발송 실패", detail: err.message });
  }
});

// 4️⃣ 서버 실행
const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
  console.log(`🚀 푸시 서버 실행 중: http://localhost:${PORT}`);
});
