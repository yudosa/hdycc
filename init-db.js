const db = require('./database/database');

console.log('데이터베이스 초기화 시작...');

// 데이터베이스 연결 확인
db.get('SELECT 1', (err, row) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
        process.exit(1);
    }
    
    console.log('데이터베이스 연결 성공');
    
    // 테이블 존재 확인
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'", (err, row) => {
        if (err) {
            console.error('테이블 확인 중 오류:', err.message);
            process.exit(1);
        }
        
        if (row) {
            console.log('예약 테이블이 존재합니다.');
        } else {
            console.log('예약 테이블이 존재하지 않습니다. 생성 중...');
        }
        
        // 시설 테이블 확인
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='facilities'", (err, row) => {
            if (err) {
                console.error('시설 테이블 확인 중 오류:', err.message);
                process.exit(1);
            }
            
            if (row) {
                console.log('시설 테이블이 존재합니다.');
            } else {
                console.log('시설 테이블이 존재하지 않습니다. 생성 중...');
            }
            
            console.log('데이터베이스 초기화 완료');
            process.exit(0);
        });
    });
}); 