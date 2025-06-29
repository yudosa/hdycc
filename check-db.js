const db = require('./database/database');

console.log('=== 데이터베이스 상태 확인 ===');

// 예약 테이블 구조 확인
db.all("PRAGMA table_info(reservations)", [], (err, columns) => {
    if (err) {
        console.error('테이블 정보 조회 오류:', err);
    } else {
        console.log('예약 테이블 구조:');
        console.log(columns);
    }
    
    // 예약 데이터 확인
    db.all('SELECT * FROM reservations ORDER BY date, start_time', [], (err, rows) => {
        if (err) {
            console.error('예약 데이터 조회 오류:', err);
        } else {
            console.log('\n현재 예약 데이터:');
            console.log(JSON.stringify(rows, null, 2));
            
            // 키 생성 테스트
            console.log('\n=== 키 생성 테스트 ===');
            rows.forEach(row => {
                const key = row.facility + '||' + (row.detail || '-');
                console.log(`facility: "${row.facility}", detail: "${row.detail}" → key: "${key}"`);
            });
        }
        process.exit();
    });
}); 