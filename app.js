const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// 예약 관련 라우트 가져오기
const reservationRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors()); // 다른 도메인에서의 요청 허용
app.use(bodyParser.json()); // JSON 데이터 파싱
app.use(bodyParser.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 정적 파일 제공 (HTML, CSS, JS 파일들)
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 설정
app.use('/api/reservations', reservationRoutes);

// 기본 라우트 - 예약 페이지 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다!`);
    console.log(`http://localhost:${PORT} 에서 확인하세요.`);
}); 