const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa');

router.get('/', async (req, res, next) => {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[now.getDay()];
  const month = now.getMonth() + 1;
  const date = now.getDate();

  // 로그인된 유저가 있는 경우에만 데이터 조회
  let resData = [];
  let myList_waiting = [];
  let myList_delivering = [];
  let myList_complete = [];

  if (req.session.user) {
    try {
      const { data } = await supabase
        .from('delivery')
        .select('*')
        .eq('situation', '접수')
        .order('delivery_date', { ascending: true });

      resData = data;
    } catch (error) {
      console.log('delivery 조회 오류:', error);
    }

    try {
      const { data: myList } = await supabase
        .from('deliveryList')
        .select('*')
        .eq('driver_id', req.session.user.id);

      myList_waiting = myList?.filter(item => item.status === '배송대기') ?? [];
      myList_delivering = myList?.filter(item => item.status === '배송중') ?? [];
      myList_complete = myList?.filter(item => {
        return (
          item.status === '배송완료' &&
          item.f_time?.split('T')[0] === now.toISOString().split('T')[0]
        );
      }) ?? [];
    } catch (error) {
      console.log('deliveryList 조회 오류:', error);
    }
  }

  res.render('main', {
    title: '메인페이지',
    user: req.session.user ?? null,
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
