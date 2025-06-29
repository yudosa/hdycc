const db = require('./database/database');

db.all('SELECT * FROM reservations', [], (err, rows) => {
    if (err) {
        console.error('오류:', err);
    } else {
        console.log('현재 예약 데이터:');
        console.log(JSON.stringify(rows, null, 2));
    }
    process.exit();
}); 