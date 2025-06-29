// DOM 요소들
const reservationForm = document.getElementById('reservationForm');
const facilitySelect = document.getElementById('facility');
const statusDateInput = document.getElementById('statusDate');
const loadReservationsBtn = document.getElementById('loadReservations');
const reservationsList = document.getElementById('reservationsList');
const facilitiesList = document.getElementById('facilitiesList');
const notification = document.getElementById('notification');

// API 기본 URL
const API_BASE_URL = '/api/reservations';

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();

    // 탭 전환 기능 (이벤트 안에서만 실행)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabSections.forEach(s => s.style.display = 'none');
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            const section = document.getElementById('tab-' + tab);
            if (section) section.style.display = 'block';
        });
    });

    // 페이지 로드시 첫 번째 탭 활성화
    if (tabBtns.length > 0) {
        tabBtns[0].classList.add('active');
        const firstTab = tabBtns[0].getAttribute('data-tab');
        const firstSection = document.getElementById('tab-' + firstTab);
        if (firstSection) firstSection.style.display = 'block';
    }
});

// 앱 초기화
async function initializeApp() {
    try {
        // 오늘 날짜를 기본값으로 설정 (로컬 시간대 사용)
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        statusDateInput.value = todayStr;
        
        // 시설 목록 로드
        await loadFacilities();
        
        // 오늘 날짜의 예약 현황 로드
        await loadReservationsByDate(todayStr);
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
    } catch (error) {
        showNotification('앱 초기화 중 오류가 발생했습니다.', 'error');
        console.error('초기화 오류:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 예약 폼 제출
    reservationForm.addEventListener('submit', handleReservationSubmit);
    
    // 예약 현황 조회 버튼
    loadReservationsBtn.addEventListener('click', handleLoadReservations);
    
    // 날짜 입력 시 자동 조회
    statusDateInput.addEventListener('change', function() {
        if (this.value) {
            loadReservationsByDate(this.value);
        }
    });
}

// 시설 목록 로드
async function loadFacilities() {
    try {
        const response = await fetch(`${API_BASE_URL}/facilities`);
        if (!response.ok) {
            throw new Error('시설 정보를 불러올 수 없습니다.');
        }
        
        const facilities = await response.json();
        
        // 시설 선택 옵션 추가
        facilitySelect.innerHTML = '<option value="">시설을 선택하세요</option>';
        facilities.forEach(facility => {
            const option = document.createElement('option');
            option.value = facility.name;
            option.textContent = facility.name;
            facilitySelect.appendChild(option);
        });
        
        // 시설 정보 카드 생성
        displayFacilities(facilities);
        
    } catch (error) {
        showNotification('시설 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        console.error('시설 로드 오류:', error);
    }
}

// 시설 정보 표시
function displayFacilities(facilities) {
    facilitiesList.innerHTML = '';
    
    facilities.forEach(facility => {
        const facilityCard = document.createElement('div');
        facilityCard.className = 'facility-card';
        facilityCard.innerHTML = `
            <h4>${facility.name}</h4>
            <div class="facility-info">${facility.description}</div>
            <div class="facility-info">수용 인원: ${facility.max_capacity}명</div>
            <div class="facility-rate">시간당 요금: ${facility.hourly_rate.toLocaleString()}원</div>
        `;
        facilitiesList.appendChild(facilityCard);
    });
}

// 예약 폼 제출 처리
async function handleReservationSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(reservationForm);
    const reservationData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        facility: formData.get('facility'),
        date: formData.get('date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        purpose: formData.get('purpose') || ''
    };
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '예약 생성에 실패했습니다.');
        }
        
        showNotification('예약이 성공적으로 완료되었습니다!', 'success');
        reservationForm.reset();
        
        // 예약 현황 새로고침
        if (statusDateInput.value === reservationData.date) {
            await loadReservationsByDate(reservationData.date);
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('예약 제출 오류:', error);
    }
}

// 예약 현황 조회 버튼 처리
async function handleLoadReservations() {
    const selectedDate = statusDateInput.value;
    if (!selectedDate) {
        showNotification('날짜를 선택해주세요.', 'error');
        return;
    }
    
    await loadReservationsByDate(selectedDate);
}

// 특정 날짜의 예약 현황 로드
async function loadReservationsByDate(date) {
    try {
        reservationsList.innerHTML = '<div class="loading">예약 현황을 불러오는 중...</div>';
        
        const response = await fetch(`${API_BASE_URL}/date/${date}`);
        if (!response.ok) {
            throw new Error('예약 현황을 불러올 수 없습니다.');
        }
        
        const reservations = await response.json();
        displayReservations(reservations, date);
        
    } catch (error) {
        showNotification('예약 현황을 불러오는 중 오류가 발생했습니다.', 'error');
        console.error('예약 로드 오류:', error);
        reservationsList.innerHTML = '<div class="error">예약 현황을 불러올 수 없습니다.</div>';
    }
}

// 예약 목록 표시
function displayReservations(reservations, date) {
    if (reservations.length === 0) {
        reservationsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6c757d;">
                ${formatDate(date)}에는 예약이 없습니다.
            </div>
        `;
        return;
    }
    
    reservationsList.innerHTML = '';
    
    // 예약을 시간순으로 정렬
    reservations.sort((a, b) => {
        if (a.start_time < b.start_time) return -1;
        if (a.start_time > b.start_time) return 1;
        return 0;
    });
    
    reservations.forEach((reservation, index) => {
        const reservationItem = document.createElement('div');
        reservationItem.className = 'reservation-item';
        reservationItem.style.border = '1px solid #ddd';
        reservationItem.style.margin = '10px 0';
        reservationItem.style.padding = '15px';
        reservationItem.style.borderRadius = '8px';
        reservationItem.style.backgroundColor = '#f8f9fa';
        
        reservationItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #333;">${reservation.name} (${reservation.phone})</h4>
                <span style="background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    예약 #${reservation.id}
                </span>
            </div>
            <div class="reservation-details" style="line-height: 1.6;">
                <div><strong>시설:</strong> ${reservation.facility} ${reservation.detail && reservation.detail !== '-' ? `(${reservation.detail})` : ''}</div>
                <div><strong>날짜:</strong> ${formatDate(reservation.date)}</div>
                <div class="reservation-time" style="color: #007bff; font-weight: bold;">
                    <strong>시간:</strong> ${reservation.start_time} ~ ${reservation.end_time}
                </div>
                ${reservation.purpose ? `<div><strong>목적:</strong> ${reservation.purpose}</div>` : ''}
                <div style="font-size: 12px; color: #6c757d; margin-top: 8px;">
                    예약일시: ${new Date(reservation.created_at).toLocaleString('ko-KR')}
                </div>
            </div>
        `;
        reservationsList.appendChild(reservationItem);
    });
    
    // 총 예약 수 표시
    const summaryDiv = document.createElement('div');
    summaryDiv.style.textAlign = 'center';
    summaryDiv.style.padding = '10px';
    summaryDiv.style.backgroundColor = '#e9ecef';
    summaryDiv.style.borderRadius = '4px';
    summaryDiv.style.marginTop = '15px';
    summaryDiv.innerHTML = `<strong>총 ${reservations.length}개의 예약이 있습니다.</strong>`;
    reservationsList.appendChild(summaryDiv);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 전화번호 형식 검증
function validatePhone(phone) {
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    return phoneRegex.test(phone);
}

// 폼 유효성 검사
function validateForm(formData) {
    const errors = [];
    
    if (!formData.get('name').trim()) {
        errors.push('예약자명을 입력해주세요.');
    }
    
    if (!validatePhone(formData.get('phone'))) {
        errors.push('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
    }
    
    if (!formData.get('facility')) {
        errors.push('이용 시설을 선택해주세요.');
    }
    
    if (!formData.get('date')) {
        errors.push('이용 날짜를 선택해주세요.');
    }
    
    if (!formData.get('start_time') || !formData.get('end_time')) {
        errors.push('시작 시간과 종료 시간을 모두 입력해주세요.');
    }
    
    return errors;
}

// 전화번호 자동 포맷팅
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 3 && value.length <= 6) {
        value = value.replace(/(\d{3})(\d{0,3})/, '$1-$2');
    } else if (value.length >= 7) {
        value = value.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1-$2-$3');
    }
    
    e.target.value = value;
});

// 예약 신청 버튼 클릭 시 예약 메인 표시
const startReservationBtn = document.getElementById('startReservationBtn');
const reservationMain = document.getElementById('reservationMain');

if (startReservationBtn && reservationMain) {
    startReservationBtn.addEventListener('click', function() {
        document.querySelector('header').style.display = 'none';
        reservationMain.style.display = 'block';
    });
} 