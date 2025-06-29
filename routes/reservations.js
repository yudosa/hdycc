const express = require('express');
const router = express.Router();
const db = require('../database/database');
const moment = require('moment');

// 모든 예약 조회
router.get('/', (req, res) => {
    const query = `
        SELECT * FROM reservations 
        ORDER BY date DESC, start_time ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 특정 날짜의 예약 조회
router.get('/date/:date', (req, res) => {
    const date = req.params.date;
    const query = `
        SELECT * FROM reservations 
        WHERE date = ? 
        ORDER BY start_time ASC
    `;
    
    db.all(query, [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 새로운 예약 생성
router.post('/', (req, res) => {
    console.log('예약 생성 요청 받음:', req.body);
    
    const { name, phone, facility, detail, date, start_time, end_time, purpose } = req.body;
    
    // 필수 필드 검증 (phone은 선택사항으로 변경)
    if (!name || !facility || !date || !start_time || !end_time) {
        console.log('필수 필드 누락:', { name, facility, date, start_time, end_time });
        return res.status(400).json({ error: '필수 필드를 입력해주세요. (이름, 시설, 날짜, 시작시간, 종료시간)' });
    }
    
    // 전화번호가 없으면 기본값 설정
    const phoneNumber = phone || '미입력';
    
    // 날짜 형식 검증
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        console.log('잘못된 날짜 형식:', date);
        return res.status(400).json({ error: '올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD).' });
    }
    
    // 시간 형식 검증
    if (!moment(start_time, 'HH:mm', true).isValid() || !moment(end_time, 'HH:mm', true).isValid()) {
        console.log('잘못된 시간 형식:', { start_time, end_time });
        return res.status(400).json({ error: '올바른 시간 형식을 입력해주세요 (HH:mm).' });
    }
    
    // 과거 날짜 예약 방지 (오늘 날짜는 예약 가능)
    const today = moment().startOf('day');
    const selectedDate = moment(date).startOf('day');
    
    if (selectedDate.isBefore(today)) {
        console.log('과거 날짜 예약 시도:', date);
        return res.status(400).json({ error: '과거 날짜는 예약할 수 없습니다.' });
    }
    
    // 시간 순서 검증
    if (moment(start_time, 'HH:mm').isSameOrAfter(moment(end_time, 'HH:mm'))) {
        console.log('잘못된 시간 순서:', { start_time, end_time });
        return res.status(400).json({ error: '종료 시간은 시작 시간보다 늦어야 합니다.' });
    }
    
    // 중복 예약 확인 (세부선택까지 고려)
    const checkQuery = `
        SELECT * FROM reservations 
        WHERE facility = ? AND detail = ? AND date = ? 
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))
    `;
    
    console.log('중복 예약 확인 쿼리 실행:', { facility, detail: detail || '-', date, start_time, end_time });
    
    db.get(checkQuery, [facility, detail || '-', date, start_time, start_time, end_time, end_time, start_time, end_time], (err, row) => {
        if (err) {
            console.error('중복 예약 확인 중 DB 오류:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            console.log('중복 예약 발견:', row);
            return res.status(400).json({ error: '해당 시간에 이미 예약이 있습니다.' });
        }
        
        // 예약 생성
        const insertQuery = `
            INSERT INTO reservations (name, phone, facility, detail, date, start_time, end_time, purpose)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [name, phoneNumber, facility, detail || '-', date, start_time, end_time, purpose];
        console.log('예약 생성 쿼리 실행:', insertParams);
        
        db.run(insertQuery, insertParams, function(err) {
            if (err) {
                console.error('예약 생성 중 DB 오류:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            
            console.log('예약 생성 성공, ID:', this.lastID);
            res.json({
                id: this.lastID,
                message: '예약이 성공적으로 생성되었습니다.',
                reservation: {
                    id: this.lastID,
                    name, phone: phoneNumber, facility, detail, date, start_time, end_time, purpose
                }
            });
        });
    });
});

// 예약 수정
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, facility, date, start_time, end_time, purpose } = req.body;
    
    const updateQuery = `
        UPDATE reservations 
        SET name = ?, phone = ?, facility = ?, date = ?, start_time = ?, end_time = ?, purpose = ?
        WHERE id = ?
    `;
    
    db.run(updateQuery, [name, phone, facility, date, start_time, end_time, purpose, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: '해당 예약을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '예약이 성공적으로 수정되었습니다.' });
    });
});

// 예약 삭제
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    const deleteQuery = 'DELETE FROM reservations WHERE id = ?';
    
    db.run(deleteQuery, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: '해당 예약을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '예약이 성공적으로 삭제되었습니다.' });
    });
});

// 시설 목록 조회
router.get('/facilities', (req, res) => {
    const query = 'SELECT * FROM facilities ORDER BY name';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 기간별 예약 조회
router.get('/range', (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
        return res.status(400).json({ error: '시작일과 종료일을 입력하세요.' });
    }
    const query = `
        SELECT * FROM reservations
        WHERE date >= ? AND date <= ?
        ORDER BY date ASC, start_time ASC
    `;
    db.all(query, [start, end], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

module.exports = router; 