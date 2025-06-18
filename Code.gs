// ===== 구글 시트 설정 =====
const SPREADSHEET_ID = '1wPVjCv19E-jET1woQwvoJGH4KKa3-yvK_SXrCaBmKoI';
const GEMINI_API_KEY = 'AIzaSyDCsasfBH5Ak26nagkpPiItQjTWP-Dk4CE';

// 시트 이름 상수
const SHEET_NAMES = {
  MEMBERS: '회원정보',
  BOSS_RECORDS: '보스참여기록',
  GUILD_FUNDS: '길드자금',
  DISTRIBUTION: '분배내역',
  WEEKLY_STATS: '주간통계',
  BOSS_LIST: '보스목록',
  PERMISSIONS: '권한설정',
  SYSTEM_SETTINGS: '시스템설정'
}
// ===== 캐시 초기화 함수 =====
function clearCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['guild_members', 'boss_statistics', 'guild_balance']);
    
    return { 
      success: true, 
      message: '캐시가 초기화되었습니다.' 
    };
    
  } catch (error) {
    console.error('캐시 초기화 오류:', error);
    return { 
      success: false, 
      message: '캐시 초기화 중 오류가 발생했습니다: ' + error.message 
    };
  }
};

// ===== 웹 앱 진입점 =====
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setTitle('길드 관리 시스템')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// HTML 파일 include 함수
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== 시트 접근 함수 =====
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

// ===== 비밀번호 해시 함수 =====
function hashPassword(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return Utilities.base64Encode(hash);
}

// ===== 인증 관련 함수 =====
function login(nickname, password) {
  console.log('로그인 시도:', nickname);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const hashedPassword = hashPassword(password);
    
    for (let i = 1; i < data.length; i++) {
      // 인덱스 조정: 직업 필드가 추가되어 비밀번호는 5번째(인덱스 5), 상태는 7번째(인덱스 7), 관리자는 8번째(인덱스 8)
      if (data[i][1] === nickname && data[i][5] === hashedPassword && data[i][7] === '활성') {
        console.log('로그인 성공:', nickname);
        return {
          success: true,
          user: {
            id: data[i][0],
            nickname: data[i][1],
            guild: data[i][2],
            server: data[i][3],
            job: data[i][4],           // 직업 필드 추가
            isAdmin: data[i][8] === 'Y'
          }
        };
      }
    }
    
    console.log('로그인 실패:', nickname);
    return { success: false, message: '닉네임 또는 비밀번호가 일치하지 않습니다.' };
    
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, message: '로그인 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 세션 유효성 검증 함수 =====
function validateSession(userId, nickname) {
  console.log('세션 유효성 검증:', userId, nickname);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // ID와 닉네임이 일치하고 활성 상태인지 확인
      if (data[i][0] === userId && data[i][1] === nickname && data[i][7] === '활성') {
        console.log('세션 유효성 확인됨:', nickname);
        return {
          success: true,
          user: {
            id: data[i][0],
            nickname: data[i][1],
            guild: data[i][2],
            server: data[i][3],
            job: data[i][4],
            isAdmin: data[i][8] === 'Y'
          }
        };
      }
    }
    
    console.log('세션 유효성 검증 실패:', nickname);
    return { success: false, message: '세션이 만료되었거나 유효하지 않습니다.' };
    
  } catch (error) {
    console.error('세션 검증 오류:', error);
    return { success: false, message: '세션 검증 중 오류가 발생했습니다: ' + error.message };
  }
}

function register(userData) {
  console.log('회원가입 시작:', userData);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 중복 닉네임 체크
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userData.nickname) {
        return { success: false, message: '이미 존재하는 닉네임입니다.' };
      }
    }
    
    // 필수 필드 검증
    if (!userData.nickname || !userData.guild || !userData.server || !userData.job || !userData.password) {
      return { success: false, message: '모든 필드를 입력해주세요.' };
    }
    
    const lastRow = sheet.getLastRow();
    const newId = 'M' + String(lastRow).padStart(4, '0');
    const today = new Date();
    const hashedPassword = hashPassword(userData.password);
    
    // 새로운 회원 정보 추가 (직업 필드 포함)
    sheet.appendRow([
      newId,                    // 회원ID
      userData.nickname,        // 닉네임
      userData.guild,          // 길드명
      userData.server,         // 서버
      userData.job,            // 직업 (추가됨)
      hashedPassword,          // 비밀번호 (해시)
      today,                   // 가입일
      '활성',                  // 상태
      'N'                      // 관리자 여부
    ]);
    
    console.log('회원가입 성공:', newId, userData.nickname, userData.job);
    return { 
      success: true, 
      message: '회원가입이 완료되었습니다!\n\n닉네임: ' + userData.nickname + 
               '\n직업: ' + userData.job + 
               '\n길드: ' + userData.guild + 
               '\n서버: ' + userData.server +
               '\n\n이제 로그인할 수 있습니다.'
    };
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 관리자 HTML 페이지 생성 함수 =====
function getAdminHTML() {
  console.log('관리자 HTML 생성 시작');
  
  try {
    // admin-pages.gs에서 관리자 HTML을 가져옴
    return getAdminPageHTML();
  } catch (error) {
    console.error('관리자 HTML 생성 오류:', error);
    return `
      <div class="page-header">
        <h1 class="page-title">관리자 설정</h1>
        <p class="page-subtitle">시스템 관리 및 설정</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="material-icons">error</span>
          <span>오류 발생</span>
        </div>
        <p>관리자 페이지를 로드하는 중 오류가 발생했습니다: ${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <span class="material-icons">refresh</span>
          새로고침
        </button>
      </div>
    `;
  }
}

// ===== 회원 정보 시트 초기화 함수도 수정 =====
function initializeMembersSheet() {
  console.log('회원 정보 시트 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    
    if (!sheet) {
      console.log('회원 정보 시트 생성');
      sheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
    }
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() < 1) {
      console.log('회원 정보 시트 헤더 추가');
      sheet.appendRow([
        '회원ID', '닉네임', '길드', '서버', '직업', 
        '비밀번호', '가입일', '상태', '관리자'
      ]);
    }
    
    return { success: true, message: '회원 정보 시트 초기화 완료' };
    
  } catch (error) {
    console.error('회원 정보 시트 초기화 오류:', error);
    return { success: false, message: '회원 정보 시트 초기화 실패: ' + error.message };
  }
}

// ===== 보스 기록 시트 초기화 =====
function initializeBossRecordsSheet() {
  console.log('보스 기록 시트 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAMES.BOSS_RECORDS);
    
    if (!sheet) {
      console.log('보스 기록 시트 생성');
      sheet = ss.insertSheet(SHEET_NAMES.BOSS_RECORDS);
    }
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() < 1) {
      console.log('보스 기록 시트 헤더 추가');
      sheet.appendRow([
        '기록ID', '날짜', '보스명', '참여자', '아이템', 
        '아이템수량', '판매상태', '판매가격', '수수료', '실수령액', '주차'
      ]);
    }
    
    return { success: true, message: '보스 기록 시트 초기화 완료' };
    
  } catch (error) {
    console.error('보스 기록 시트 초기화 오류:', error);
    return { success: false, message: '보스 기록 시트 초기화 실패: ' + error.message };
  }
}

function getMembers() {
  console.log('회원 목록 조회 시작');
  
  try {
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      console.log('회원 정보 시트를 찾을 수 없습니다');
      return [];
    }
    
    // 시트에 데이터가 있는지 확인
    const lastRow = memberSheet.getLastRow();
    console.log('시트 마지막 행:', lastRow);
    
    if (lastRow < 2) {
      console.log('시트에 데이터가 없습니다 (헤더만 존재)');
      return [];
    }
    
    const memberData = memberSheet.getDataRange().getValues();
    console.log('읽어온 전체 데이터 행 수:', memberData.length);
    
    const members = [];
    
    // 보스 참여 기록 가져오기
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    let bossData = [];
    if (bossSheet && bossSheet.getLastRow() > 1) {
      bossData = bossSheet.getDataRange().getValues();
      console.log('보스 참여 기록 행 수:', bossData.length);
    }
    
    // 각 회원 데이터 처리
    for (let i = 1; i < memberData.length; i++) {
      // 디버깅을 위한 로그
      console.log(`행 ${i + 1} 처리 중:`, memberData[i]);
      
      // 회원ID와 닉네임이 있는 행만 처리
      if (!memberData[i][0] || !memberData[i][1]) {
        console.log(`행 ${i + 1}: 빈 데이터로 건너뜀`);
        continue;
      }
      
      // 닉네임이 빈 문자열이거나 공백만 있는 경우 건너뛰기
      const nickname = String(memberData[i][1]).trim();
      if (!nickname) {
        console.log(`행 ${i + 1}: 닉네임이 비어있어 건너뜀`);
        continue;
      }
      
      console.log(`처리할 회원: ${nickname}`);
      
      // 해당 회원의 보스 참여횟수 계산
      let participationCount = 0;
      let lastParticipation = null;
      
      for (let j = 1; j < bossData.length; j++) {
        if (bossData[j][3] === nickname) { // 참여자 컬럼 확인
          participationCount++;
          const participationDate = new Date(bossData[j][1]);
          if (!lastParticipation || participationDate > lastParticipation) {
            lastParticipation = participationDate;
          }
        }
      }
      
      // 회원 정보 객체 생성
      const memberInfo = {
        id: String(memberData[i][0] || ''),
        nickname: nickname,
        guild: String(memberData[i][2] || ''),
        server: String(memberData[i][3] || ''),
        job: String(memberData[i][4] || ''),              
        joinDate: memberData[i][6] || new Date(),         
        status: String(memberData[i][7] || '활성'),           
        isAdmin: String(memberData[i][8] || 'N') === 'Y',
        participationCount: participationCount,
        lastParticipation: lastParticipation
      };
      
      members.push(memberInfo);
      console.log(`회원 추가됨: ${memberInfo.nickname}, 참여횟수: ${participationCount}`);
    }
    
    // 참여횟수 순으로 정렬
    members.sort(function(a, b) {
      return b.participationCount - a.participationCount;
    });
    
    console.log('회원 목록 조회 완료, 총 인원:', members.length);
    console.log('조회된 회원들:', members.map(m => m.nickname));
    
    return members;
    
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    console.error('오류 스택:', error.stack);
    return [];
  }
}

// ===== 디버깅을 위한 추가 함수 =====
function debugMemberSheet() {
  console.log('=== 회원 시트 디버깅 시작 ===');
  
  try {
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      console.log('❌ 회원 정보 시트를 찾을 수 없습니다');
      console.log('시트 이름 확인:', SHEET_NAMES.MEMBERS);
      return;
    }
    
    console.log('✅ 회원 정보 시트 찾음');
    console.log('시트 이름:', memberSheet.getName());
    console.log('마지막 행:', memberSheet.getLastRow());
    console.log('마지막 열:', memberSheet.getLastColumn());
    
    // 헤더 확인
    if (memberSheet.getLastRow() >= 1) {
      const headers = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
      console.log('헤더:', headers);
    }
    
    // 실제 데이터 몇 개 확인
    if (memberSheet.getLastRow() >= 2) {
      const sampleData = memberSheet.getRange(2, 1, Math.min(5, memberSheet.getLastRow() - 1), memberSheet.getLastColumn()).getValues();
      console.log('샘플 데이터:');
      sampleData.forEach((row, index) => {
        console.log(`행 ${index + 2}:`, row);
      });
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
  
  console.log('=== 회원 시트 디버깅 완료 ===');
}

// ===== 시트 이름 확인 함수 =====
function checkAllSheets() {
  console.log('=== 모든 시트 확인 ===');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets();
    
    console.log('전체 시트 수:', sheets.length);
    sheets.forEach((sheet, index) => {
      console.log(`시트 ${index + 1}: "${sheet.getName()}" (행: ${sheet.getLastRow()}, 열: ${sheet.getLastColumn()})`);
    });
    
    console.log('설정된 시트 이름들:');
    Object.keys(SHEET_NAMES).forEach(key => {
      console.log(`${key}: "${SHEET_NAMES[key]}"`);
    });
    
  } catch (error) {
    console.error('시트 확인 중 오류:', error);
  }
}

// ===== 강제로 회원 목록 새로고침 =====
function forceRefreshMembers() {
  console.log('=== 강제 회원 목록 새로고침 ===');
  
  // 캐시 초기화
  const cache = CacheService.getScriptCache();
  cache.removeAll(['guild_members']);
  
  // 회원 목록 다시 조회
  const members = getMembers();
  console.log('새로고침 결과:', members.length, '명');
  
  return members;
}

// ===== 보스 참여 기록 함수 =====
function saveBossRecord(recordData) {
  const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const lastRow = sheet.getLastRow();
  const weekNum = Utilities.formatDate(new Date(), 'GMT+9', 'w');
  
  recordData.participants.forEach(function(participant, index) {
    const recordId = 'BR' + String(lastRow + index).padStart(5, '0');
    sheet.appendRow([
      recordId,
      new Date(),
      recordData.bossName,
      participant,
      recordData.item || '',
      recordData.itemCount || 0,
      '미판매',
      0,
      0,
      0,
      weekNum
    ]);
  });
  
  return { success: true, message: '보스 참여 기록이 저장되었습니다.' };
}

// ===== Gemini API 함수 =====
function extractParticipantsFromImage(imageBase64) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;
  
  const requestBody = {
    contents: [{
      parts: [
        {
          text: "이 이미지에서 게임 닉네임만 추출해주세요. 다른 텍스트는 무시하고 닉네임만 한 줄에 하나씩 나열해주세요."
        },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64
          }
        }
      ]
    }]
  };
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody)
    });
    
    const result = JSON.parse(response.getContentText());
    const text = result.candidates[0].content.parts[0].text;
    const nicknames = text.split('\n').filter(function(name) {
      return name.trim() !== '';
    });
    
    return { success: true, nicknames: nicknames };
  } catch (error) {
    return { success: false, message: '이미지 처리 중 오류가 발생했습니다.' };
  }
}

// ===== 길드 자금 관리 함수 =====
function getGuildBalance() {
  const sheet = getSheet(SHEET_NAMES.GUILD_FUNDS);
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return 0;
  
  const balance = sheet.getRange(lastRow, 6).getValue();
  return balance || 0;
}

function addGuildTransaction(type, amount, description) {
  const sheet = getSheet(SHEET_NAMES.GUILD_FUNDS);
  const lastRow = sheet.getLastRow();
  const currentBalance = getGuildBalance();
  
  const transactionId = 'GF' + String(lastRow).padStart(5, '0');
  const newBalance = type === '입금' ? currentBalance + amount : currentBalance - amount;
  
  sheet.appendRow([
    transactionId,
    new Date(),
    type,
    amount,
    description,
    newBalance,
    ''
  ]);
  
  return { success: true, balance: newBalance };
}

// ===== 아이템 판매 함수 =====
function sellItem(recordId, salePrice, buyerNickname) {
  const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === recordId) {
      const commission = salePrice * 0.08;
      const netAmount = salePrice - commission;
      
      sheet.getRange(i + 1, 7).setValue('판매완료');
      sheet.getRange(i + 1, 8).setValue(salePrice);
      sheet.getRange(i + 1, 9).setValue(commission);
      sheet.getRange(i + 1, 10).setValue(netAmount);
      
      addGuildTransaction('입금', netAmount, '아이템 판매 - ' + data[i][4]);
      
      return { success: true, message: '아이템이 판매되었습니다.' };
    }
  }
  
  return { success: false, message: '아이템을 찾을 수 없습니다.' };
}

// ===== 주급 분배 함수 =====
function calculateWeeklyDistribution(weekNum) {
  const recordSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
  
  const recordData = recordSheet.getDataRange().getValues();
  const members = memberSheet.getDataRange().getValues();
  
  const participation = {};
  let totalParticipation = 0;
  
  for (let i = 1; i < recordData.length; i++) {
    if (recordData[i][10] == weekNum) {
      const nickname = recordData[i][3];
      participation[nickname] = (participation[nickname] || 0) + 1;
      totalParticipation++;
    }
  }
  
  const distributions = [];
  for (const nickname in participation) {
    const count = participation[nickname];
    const rate = (count / totalParticipation) * 100;
    
    distributions.push({
      nickname: nickname,
      count: count,
      rate: rate.toFixed(2)
    });
  }
  
  distributions.sort(function(a, b) {
    return b.rate - a.rate;
  });
  
  return distributions;
}

// ===== 대시보드 데이터 함수 =====
function getDashboardData() {
  const currentWeek = Utilities.formatDate(new Date(), 'GMT+9', 'w');
  const guildBalance = getGuildBalance();
  const members = getMembers();
  const weeklyStats = getWeeklyStats(currentWeek);
  
  const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const bossData = bossSheet.getDataRange().getValues();
  let unsoldItems = 0;
  
  for (let i = 1; i < bossData.length; i++) {
    if (bossData[i][6] === '미판매') {
      unsoldItems++;
    }
  }
  
  return {
    currentWeek: currentWeek,
    guildBalance: guildBalance,
    totalMembers: members.length,
    activeMembers: members.filter(function(m) { return m.status === '활성'; }).length,
    unsoldItems: unsoldItems,
    weeklyParticipants: Object.keys(weeklyStats).length
  };
}

// ===== 통계 함수 =====
function getWeeklyStats(weekNum) {
  const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const data = sheet.getDataRange().getValues();
  
  const stats = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][10] == weekNum) {
      const nickname = data[i][3];
      
      if (!stats[nickname]) {
        stats[nickname] = {
          participationCount: 0,
          itemCount: 0,
          salesAmount: 0
        };
      }
      
      stats[nickname].participationCount++;
      stats[nickname].itemCount += data[i][5] || 0;
      stats[nickname].salesAmount += data[i][9] || 0;
    }
  }
  
  return stats;
}

// ===== 초기 데이터 설정 함수 =====
function initializeSystemData() {
  const permSheet = getSheet(SHEET_NAMES.PERMISSIONS);
  if (permSheet.getLastRow() < 2) {
    permSheet.appendRow(['P001', '관리자', 1, '모든 기능에 접근 가능한 최고 권한', '모든메뉴', new Date()]);
    permSheet.appendRow(['P002', '부관리자', 2, '일부 관리 기능에 접근 가능', '대시보드,보스관리,아이템판매,길드자금,주급분배,통계', new Date()]);
    permSheet.appendRow(['P003', '운영진', 3, '보스 참여 등록 및 기본 관리 가능', '대시보드,보스참여등록,통계', new Date()]);
    permSheet.appendRow(['P004', '일반회원', 4, '기본 기능만 사용 가능', '대시보드,길드원목록,보스히스토리,통계', new Date()]);
  }
  
  const settingsSheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
  if (settingsSheet.getLastRow() < 2) {
    settingsSheet.appendRow(['commissionRate', '8', 'number', '아이템 판매 수수료율(%)', new Date()]);
    settingsSheet.appendRow(['autoBackupEnabled', 'false', 'boolean', '자동 백업 활성화 여부', new Date()]);
    settingsSheet.appendRow(['notificationEnabled', 'true', 'boolean', '알림 활성화 여부', new Date()]);
    settingsSheet.appendRow(['maxInactiveDays', '30', 'number', '비활성 처리 기준 일수', new Date()]);
  }
  
  const bossSheet = getSheet(SHEET_NAMES.BOSS_LIST);
  if (bossSheet.getLastRow() < 2) {
    bossSheet.appendRow(['B001', '발탄', 1415, '12:00, 19:00, 22:00', '활성', new Date()]);
    bossSheet.appendRow(['B002', '비아키스', 1430, '20:00, 23:00', '활성', new Date()]);
    bossSheet.appendRow(['B003', '쿠크세이튼', 1475, '21:00', '활성', new Date()]);
    bossSheet.appendRow(['B004', '아브렐슈드', 1490, '21:00, 23:30', '활성', new Date()]);
    bossSheet.appendRow(['B005', '일리아칸', 1580, '22:00', '활성', new Date()]);
  }
  
  return { success: true, message: '시스템 초기 데이터가 설정되었습니다.' };
}

// ===== 보스 히스토리 관련 함수들 =====
function getBossRecords(filter) {
  const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
  const data = sheet.getDataRange().getValues();
  const records = [];
  
  // 헤더가 없거나 데이터가 없는 경우
  if (data.length < 2) {
    return [];
  }
  
  for (let i = 1; i < data.length; i++) {
    const record = {
      id: data[i][0],
      date: data[i][1],
      bossName: data[i][2],
      participant: data[i][3],
      item: data[i][4] || '',
      itemCount: data[i][5] || 0,
      soldStatus: data[i][6] || '미판매',
      salePrice: data[i][7] || 0,
      commission: data[i][8] || 0,
      netAmount: data[i][9] || 0,
      week: data[i][10]
    };
    
    // 필터 적용 (선택사항)
    if (filter) {
      if (filter.boss && filter.boss !== 'all' && record.bossName !== filter.boss) {
        continue;
      }
      if (filter.period) {
        const recordDate = new Date(record.date);
        const now = new Date();
        
        if (filter.period === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (recordDate < weekAgo) continue;
        } else if (filter.period === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (recordDate < monthAgo) continue;
        }
      }
    }
    
    records.push(record);
  }
  
  // 날짜 역순 정렬
  records.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  
  return records;
}

function getBossStatistics() {
  const records = getBossRecords();
  const stats = {};
  const memberStats = {};
  
  // 보스별 통계 계산
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // 보스별 통계
    if (!stats[record.bossName]) {
      stats[record.bossName] = {
        totalRaids: 0,
        totalParticipants: 0,
        participants: new Set(),
        totalItems: 0,
        raidDates: new Set()
      };
    }
    
    const raidKey = record.date.toDateString() + '_' + record.bossName;
    stats[record.bossName].raidDates.add(raidKey);
    stats[record.bossName].participants.add(record.participant);
    stats[record.bossName].totalItems += record.itemCount;
    
    // 멤버별 통계
    if (!memberStats[record.participant]) {
      memberStats[record.participant] = {
        nickname: record.participant,
        totalParticipation: 0,
        lastParticipation: record.date
      };
    }
    
    memberStats[record.participant].totalParticipation++;
    if (new Date(record.date) > new Date(memberStats[record.participant].lastParticipation)) {
      memberStats[record.participant].lastParticipation = record.date;
    }
  }
  
  // 보스별 통계 최종 계산
  const bossStats = [];
  for (const bossName in stats) {
    const stat = stats[bossName];
    bossStats.push({
      bossName: bossName,
      totalRaids: stat.raidDates.size,
      averageParticipants: Math.round(stat.totalParticipants / stat.raidDates.size) || 0,
      uniqueParticipants: stat.participants.size,
      totalItems: stat.totalItems
    });
  }
  
  // 멤버별 통계를 배열로 변환 및 정렬
  const memberStatsArray = Object.values(memberStats);
  memberStatsArray.sort(function(a, b) {
    return b.totalParticipation - a.totalParticipation;
  });
  
  return {
    bossStats: bossStats,
    memberStats: memberStatsArray
  };
}

function getRecentBossRecords(limit) {
  const records = getBossRecords();
  const recentRecords = [];
  const processedRaids = new Set();
  
  for (let i = 0; i < records.length && recentRecords.length < (limit || 10); i++) {
    const record = records[i];
    const raidKey = record.date.toDateString() + '_' + record.bossName;
    
    if (!processedRaids.has(raidKey)) {
      // 같은 보스, 같은 날짜의 모든 참여자 찾기
      const participants = [];
      for (let j = 0; j < records.length; j++) {
        const otherRecord = records[j];
        const otherRaidKey = otherRecord.date.toDateString() + '_' + otherRecord.bossName;
        if (otherRaidKey === raidKey) {
          participants.push(otherRecord.participant);
        }
      }
      
      recentRecords.push({
        date: record.date,
        bossName: record.bossName,
        participants: participants,
        item: record.item,
        soldStatus: record.soldStatus,
        salePrice: record.salePrice
      });
      
      processedRaids.add(raidKey);
    }
  }
  
  return recentRecords;
}

// 숫자 포맷 함수
function formatNumber(num) {
  return new Intl.NumberFormat('ko-KR').format(num);
}

// ===== 시스템 초기화 함수 개선 =====
function initializeAllSheets() {
  console.log('전체 시스템 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const results = [];
    
    // 1. 회원 정보 시트 초기화
    let memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      memberSheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
      memberSheet.appendRow([
        '회원ID', '닉네임', '길드', '서버', '직업', 
        '비밀번호', '가입일', '상태', '관리자'
      ]);
      
      // 테스트 관리자 계정 추가
      const testAdminPassword = hashPassword('admin123');
      memberSheet.appendRow([
        'M0001', '관리자', '테스트길드', '테스트서버', '관리자',
        testAdminPassword, new Date(), '활성', 'Y'
      ]);
      
      results.push('회원정보: 시트 생성 및 테스트 관리자 계정 추가 완료');
    } else {
      results.push('회원정보: 기존 시트 확인됨');
    }
    
    // 2. 보스 기록 시트 초기화
    let bossSheet = ss.getSheetByName(SHEET_NAMES.BOSS_RECORDS);
    if (!bossSheet) {
      bossSheet = ss.insertSheet(SHEET_NAMES.BOSS_RECORDS);
      bossSheet.appendRow([
        '기록ID', '날짜', '보스명', '참여자', '아이템', 
        '아이템수량', '판매상태', '판매가격', '수수료', '실수령액', '주차'
      ]);
      results.push('보스기록: 시트 생성 완료');
    } else {
      results.push('보스기록: 기존 시트 확인됨');
    }
    
    // 3. 길드 자금 시트 초기화
    let fundsSheet = ss.getSheetByName(SHEET_NAMES.GUILD_FUNDS);
    if (!fundsSheet) {
      fundsSheet = ss.insertSheet(SHEET_NAMES.GUILD_FUNDS);
      fundsSheet.appendRow([
        '거래ID', '날짜', '구분', '금액', '내역', '잔액', '비고'
      ]);
      fundsSheet.appendRow([
        'GF0001', new Date(), '초기설정', 0, '시스템 초기화', 0, '자동생성'
      ]);
      results.push('길드자금: 시트 생성 완료');
    } else {
      results.push('길드자금: 기존 시트 확인됨');
    }
    
    // 4. 분배 내역 시트 초기화
    let distributionSheet = ss.getSheetByName(SHEET_NAMES.DISTRIBUTION);
    if (!distributionSheet) {
      distributionSheet = ss.insertSheet(SHEET_NAMES.DISTRIBUTION);
      distributionSheet.appendRow([
        '분배ID', '날짜', '주차', '닉네임', '참여횟수', '참여율', '분배금액', '비고'
      ]);
      results.push('분배내역: 시트 생성 완료');
    } else {
      results.push('분배내역: 기존 시트 확인됨');
    }
    
    // 5. 보스 목록 시트 초기화 (샘플 데이터 포함)
    let bossListSheet = ss.getSheetByName(SHEET_NAMES.BOSS_LIST);
    if (!bossListSheet) {
      bossListSheet = ss.insertSheet(SHEET_NAMES.BOSS_LIST);
      bossListSheet.appendRow(['보스ID', '보스명', '레벨', '출현시간', '상태', '등록일']);
      
      // 샘플 보스 데이터 추가
      const bosses = [
        ['B001', '발탄', 1415, '12:00, 19:00, 22:00', '활성', new Date()],
        ['B002', '비아키스', 1430, '20:00, 23:00', '활성', new Date()],
        ['B003', '쿠크세이튼', 1475, '21:00', '활성', new Date()],
        ['B004', '아브렐슈드', 1490, '21:00, 23:30', '활성', new Date()],
        ['B005', '일리아칸', 1580, '22:00', '활성', new Date()],
        ['B006', '카양겔', 1540, '20:30', '활성', new Date()],
        ['B007', '상아탑', 1600, '21:30', '활성', new Date()]
      ];
      
      for (let i = 0; i < bosses.length; i++) {
        bossListSheet.appendRow(bosses[i]);
      }
      
      results.push('보스목록: 시트 생성 및 샘플 데이터 추가 완료');
    } else {
      results.push('보스목록: 기존 시트 확인됨');
    }
    
    console.log('전체 시스템 초기화 완료');
    return { 
      success: true, 
      message: '시스템 초기화 완료!\n\n' + results.join('\n') + 
               '\n\n🔑 테스트 관리자 계정:\n• 닉네임: 관리자\n• 비밀번호: admin123'
    };
    
  } catch (error) {
    console.error('전체 시스템 초기화 오류:', error);
    return { 
      success: false, 
      message: '시스템 초기화 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 길드 자금 시트 초기화 =====
function initializeGuildFundsSheet() {
  console.log('길드 자금 시트 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAMES.GUILD_FUNDS);
    
    if (!sheet) {
      console.log('길드 자금 시트 생성');
      sheet = ss.insertSheet(SHEET_NAMES.GUILD_FUNDS);
    }
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() < 1) {
      console.log('길드 자금 시트 헤더 추가');
      sheet.appendRow([
        '거래ID', '날짜', '구분', '금액', '내역', '잔액', '비고'
      ]);
      
      // 초기 자금 0원으로 설정
      sheet.appendRow([
        'GF0001', new Date(), '초기설정', 0, '시스템 초기화', 0, '자동생성'
      ]);
    }
    
    return { success: true, message: '길드 자금 시트 초기화 완료' };
    
  } catch (error) {
    console.error('길드 자금 시트 초기화 오류:', error);
    return { success: false, message: '길드 자금 시트 초기화 실패: ' + error.message };
  }
}

// ===== 분배 내역 시트 초기화 =====
function initializeDistributionSheet() {
  console.log('분배 내역 시트 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAMES.DISTRIBUTION);
    
    if (!sheet) {
      console.log('분배 내역 시트 생성');
      sheet = ss.insertSheet(SHEET_NAMES.DISTRIBUTION);
    }
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() < 1) {
      console.log('분배 내역 시트 헤더 추가');
      sheet.appendRow([
        '분배ID', '날짜', '주차', '닉네임', '참여횟수', '참여율', '분배금액', '비고'
      ]);
    }
    
    return { success: true, message: '분배 내역 시트 초기화 완료' };
    
  } catch (error) {
    console.error('분배 내역 시트 초기화 오류:', error);
    return { success: false, message: '분배 내역 시트 초기화 실패: ' + error.message };
  }
}

// ===== 주간 통계 시트 초기화 =====
function initializeWeeklyStatsSheet() {
  console.log('주간 통계 시트 초기화 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAMES.WEEKLY_STATS);
    
    if (!sheet) {
      console.log('주간 통계 시트 생성');
      sheet = ss.insertSheet(SHEET_NAMES.WEEKLY_STATS);
    }
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() < 1) {
      console.log('주간 통계 시트 헤더 추가');
      sheet.appendRow([
        '주차', '년도', '닉네임', '참여횟수', '아이템수', '판매금액', '생성일'
      ]);
    }
    
    return { success: true, message: '주간 통계 시트 초기화 완료' };
    
  } catch (error) {
    console.error('주간 통계 시트 초기화 오류:', error);
    return { success: false, message: '주간 통계 시트 초기화 실패: ' + error.message };
  }
}

// ===== 시스템 상태 체크 함수 =====
function checkSystemStatus() {
  console.log('시스템 상태 체크 시작');
  
  try {
    const status = {
      sheets: {},
      data: {},
      errors: []
    };
    
    // 1. 시트 존재 여부 확인
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetNames = Object.values(SHEET_NAMES);
    
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      const sheet = ss.getSheetByName(sheetName);
      
      if (sheet) {
        status.sheets[sheetName] = {
          exists: true,
          rows: sheet.getLastRow(),
          cols: sheet.getLastColumn()
        };
      } else {
        status.sheets[sheetName] = {
          exists: false,
          rows: 0,
          cols: 0
        };
        status.errors.push(sheetName + ' 시트가 없습니다');
      }
    }
    
    // 2. 데이터 유효성 검사
    status.data.members = getMembers().length;
    status.data.bossRecords = getBossRecords().length;
    status.data.guildBalance = getGuildBalance();
    
    // 3. API 키 확인
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      status.errors.push('Gemini API 키가 설정되지 않았습니다');
    }
    
    console.log('시스템 상태 체크 완료:', status);
    return status;
    
  } catch (error) {
    console.error('시스템 상태 체크 오류:', error);
    return {
      sheets: {},
      data: {},
      errors: ['시스템 상태 체크 실패: ' + error.message]
    };
  }
}

// ===== 데이터 검증 개선 함수 =====
function validateData() {
  console.log('데이터 검증 시작');
  
  try {
    const errors = [];
    
    // 1. 중복 회원 체크
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (memberSheet) {
      const members = memberSheet.getDataRange().getValues();
      const nicknames = new Set();
      
      for (let i = 1; i < members.length; i++) {
        if (!members[i][1]) continue;
        
        if (nicknames.has(members[i][1])) {
          errors.push('중복 닉네임: ' + members[i][1]);
        }
        nicknames.add(members[i][1]);
      }
    }
    
    // 2. 자금 잔액 검증
    const fundsSheet = getSheet(SHEET_NAMES.GUILD_FUNDS);
    if (fundsSheet) {
      const fundsData = fundsSheet.getDataRange().getValues();
      let calculatedBalance = 0;
      
      for (let i = 1; i < fundsData.length; i++) {
        if (!fundsData[i][0]) continue;
        
        if (fundsData[i][2] === '입금') {
          calculatedBalance += fundsData[i][3] || 0;
        } else {
          calculatedBalance -= fundsData[i][3] || 0;
        }
        
        const recordedBalance = fundsData[i][5] || 0;
        if (Math.abs(calculatedBalance - recordedBalance) > 1) {
          errors.push('자금 잔액 오류 (행 ' + (i + 1) + '): 계산=' + calculatedBalance + ', 기록=' + recordedBalance);
        }
      }
    }
    
    // 3. 보스 기록 검증
    const bossRecords = getBossRecords();
    const invalidRecords = bossRecords.filter(record => 
      !record.bossName || !record.participant || !record.date
    );
    
    if (invalidRecords.length > 0) {
      errors.push('불완전한 보스 기록 ' + invalidRecords.length + '건 발견');
    }
    
    console.log('데이터 검증 완료, 오류 수:', errors.length);
    return errors;
    
  } catch (error) {
    console.error('데이터 검증 오류:', error);
    return ['데이터 검증 중 오류 발생: ' + error.message];
  }
}

// ===== 백업 개선 함수 =====
function createBackup() {
  console.log('백업 생성 시작');
  
  try {
    const sourceSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const backupName = '길드관리_백업_' + Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd_HHmm');
    
    // 백업 생성
    const backup = sourceSpreadsheet.copy(backupName);
    
    // 백업 폴더로 이동 (선택사항)
    const backupFolder = DriveApp.getFoldersByName('길드관리_백업');
    if (backupFolder.hasNext()) {
      const folder = backupFolder.next();
      const file = DriveApp.getFileById(backup.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    console.log('백업 생성 완료:', backupName);
    return { 
      success: true, 
      message: '백업이 생성되었습니다: ' + backupName,
      fileId: backup.getId()
    };
    
  } catch (error) {
    console.error('백업 생성 오류:', error);
    return { 
      success: false, 
      message: '백업 생성 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 관리자 계정 생성 함수 =====
function createAdminAccount() {
  console.log('관리자 계정 생성 시작');
  
  try {
    const adminData = {
      nickname: '관리자',
      guild: '길드명',
      server: '서버명',
      job: '관리자',
      password: 'admin123!'
    };
    
    // 기존 관리자 계정 확인
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트가 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === adminData.nickname) {
        return { success: false, message: '관리자 계정이 이미 존재합니다.' };
      }
    }
    
    // 관리자 계정 생성
    const lastRow = sheet.getLastRow();
    const newId = 'M' + String(lastRow).padStart(4, '0');
    const today = new Date();
    const hashedPassword = hashPassword(adminData.password);
    
    sheet.appendRow([
      newId,
      adminData.nickname,
      adminData.guild,
      adminData.server,
      adminData.job,
      hashedPassword,
      today,
      '활성',
      'Y'  // 관리자 권한
    ]);
    
    console.log('관리자 계정 생성 완료');
    return { 
      success: true, 
      message: '관리자 계정이 생성되었습니다.\n아이디: ' + adminData.nickname + '\n비밀번호: ' + adminData.password 
    };
    
  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
    return { 
      success: false, 
      message: '관리자 계정 생성 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 시스템 설정 함수들 =====
function getSystemSettings() {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    if (!sheet) {
      return {
        commissionRate: 8,
        autoBackupEnabled: false,
        notificationEnabled: true,
        maxInactiveDays: 30
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[data[i][0]] = {
          value: data[i][1],
          type: data[i][2],
          description: data[i][3],
          lastModified: data[i][4]
        };
      }
    }
    
    return {
      commissionRate: parseInt(settings.commissionRate?.value) || 8,
      autoBackupEnabled: settings.autoBackupEnabled?.value === 'true',
      notificationEnabled: settings.notificationEnabled?.value !== 'false',
      maxInactiveDays: parseInt(settings.maxInactiveDays?.value) || 30
    };
    
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    return {
      commissionRate: 8,
      autoBackupEnabled: false,
      notificationEnabled: true,
      maxInactiveDays: 30
    };
  }
}

function updateSystemSettings(key, value) {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    if (!sheet) {
      return { success: false, message: '시스템 설정 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 5).setValue(now);
        return { success: true, message: '설정이 업데이트되었습니다.' };
      }
    }
    
    // 새 설정 추가
    sheet.appendRow([key, value, typeof value, '', now]);
    return { success: true, message: '새 설정이 추가되었습니다.' };
    
  } catch (error) {
    console.error('시스템 설정 업데이트 오류:', error);
    return { success: false, message: '설정 업데이트 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 데이터 정리 함수 =====
function cleanupOldData() {
  console.log('오래된 데이터 정리 시작');
  
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    let cleanedCount = 0;
    
    // 보스 기록 정리
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    if (bossSheet) {
      const data = bossSheet.getDataRange().getValues();
      
      for (let i = data.length - 1; i >= 1; i--) {
        const recordDate = new Date(data[i][1]);
        if (recordDate < ninetyDaysAgo) {
          bossSheet.deleteRow(i + 1);
          cleanedCount++;
        }
      }
    }
    
    console.log('데이터 정리 완료, 정리된 기록 수:', cleanedCount);
    return { 
      success: true, 
      message: cleanedCount + '건의 오래된 기록이 정리되었습니다.' 
    };
    
  } catch (error) {
    console.error('데이터 정리 오류:', error);
    return { 
      success: false, 
      message: '데이터 정리 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 테스트 데이터 생성 함수 =====
function createTestData() {
  console.log('테스트 데이터 생성 시작');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. 테스트 회원 데이터 추가
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    if (memberSheet) {
      const testMembers = [
        ['M0002', '길드페이드', '바람의언덕', '루페온', '바드', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0003', '아워로드', '바람의언덕', '루페온', '워로드', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0004', '박건슬링어', '바람의언덕', '루페온', '건슬링어', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0005', '김버서커', '바람의언덕', '루페온', '버서커', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0006', '이소서리스', '바람의언덕', '루페온', '소서리스', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0007', '최인파이터', '바람의언덕', '루페온', '인파이터', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0008', '정데빌헌터', '바람의언덕', '루페온', '데빌헌터', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0009', '강아르카나', '바람의언덕', '루페온', '아르카나', hashPassword('test123'), new Date(), '활성', 'N'],
        ['M0010', '홍블레이드', '바람의언덕', '루페온', '블레이드', hashPassword('test123'), new Date(), '비활성', 'N']
      ];
      
      for (let i = 0; i < testMembers.length; i++) {
        memberSheet.appendRow(testMembers[i]);
      }
    }
    
    // 2. 테스트 보스 참여 기록 추가
    const bossSheet = ss.getSheetByName(SHEET_NAMES.BOSS_RECORDS);
    if (bossSheet) {
      const testRecords = [];
      const members = ['길드페이드', '아워로드', '박건슬링어', '김버서커', '이소서리스', '최인파이터', '정데빌헌터', '강아르카나'];
      const bosses = ['발탄', '비아키스', '쿠크세이튼', '아브렐슈드', '일리아칸', '카양겔', '상아탑'];
      const items = ['마수의 뼈', '광기의 돌', '파멸의 돌', '질서의 돌', '카오스 돌', '신비한 보석', '영혼의 결정'];
      
      let recordId = 1;
      
      // 최근 2주간의 데이터 생성
      for (let day = 14; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const weekNum = Math.ceil((date.getDate()) / 7);
        
        // 하루에 2-4개의 보스 레이드 (더 활발한 길드로 설정)
        const dailyRaids = Math.floor(Math.random() * 3) + 2;
        
        for (let raid = 0; raid < dailyRaids; raid++) {
          const boss = bosses[Math.floor(Math.random() * bosses.length)];
          const item = items[Math.floor(Math.random() * items.length)];
          const participantCount = Math.floor(Math.random() * 4) + 4; // 4-8명 참여
          
          // 길드페이드와 아워로드는 더 자주 참여하도록 가중치 적용
          const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
          // 상위 참여자들에게 가중치 부여
          if (Math.random() > 0.3) {
            if (!shuffledMembers.includes('길드페이드')) shuffledMembers.unshift('길드페이드');
          }
          if (Math.random() > 0.4) {
            if (!shuffledMembers.includes('아워로드')) shuffledMembers.unshift('아워로드');
          }
          
          const participants = shuffledMembers.slice(0, participantCount);
          
          // 각 참여자별로 기록 추가
          for (let p = 0; p < participants.length; p++) {
            const id = 'BR' + String(recordId).padStart(5, '0');
            // 판매 확률을 높이고 가격 범위 조정
            const salePrice = Math.random() > 0.5 ? Math.floor(Math.random() * 8000000) + 500000 : 0;
            const soldStatus = salePrice > 0 ? '판매완료' : '미판매';
            const commission = salePrice * 0.08;
            const netAmount = salePrice - commission;
            
            testRecords.push([
              id, date, boss, participants[p], item, 1, 
              soldStatus, salePrice, commission, netAmount, weekNum
            ]);
            recordId++;
          }
        }
      }
      
      // 배치로 기록 추가
      if (testRecords.length > 0) {
        const range = bossSheet.getRange(bossSheet.getLastRow() + 1, 1, testRecords.length, testRecords[0].length);
        range.setValues(testRecords);
      }
    }
    
    // 3. 테스트 길드 자금 거래 내역 추가
    const fundsSheet = ss.getSheetByName(SHEET_NAMES.GUILD_FUNDS);
    if (fundsSheet) {
      let balance = 0;
      let transactionId = 2;
      
      const fundTransactions = [
        ['입금', 15000000, '아이템 판매 수익'],
        ['출금', 8000000, '주급 분배'],
        ['입금', 12000000, '아이템 판매 수익'],
        ['입금', 7500000, '아이템 판매 수익'],
        ['출금', 6500000, '주급 분배'],
        ['입금', 20000000, '고가 아이템 판매']
      ];
      
      for (let i = 0; i < fundTransactions.length; i++) {
        const [type, amount, description] = fundTransactions[i];
        const date = new Date();
        date.setDate(date.getDate() - (fundTransactions.length - i) * 2);
        
        if (type === '입금') {
          balance += amount;
        } else {
          balance -= amount;
        }
        
        const id = 'GF' + String(transactionId).padStart(4, '0');
        fundsSheet.appendRow([id, date, type, amount, description, balance, '']);
        transactionId++;
      }
    }
    
    console.log('테스트 데이터 생성 완료');
    return { 
      success: true, 
      message: '테스트 데이터 생성 완료!\n\n• 테스트 회원 8명 추가\n• 보스 참여 기록 ' + 
               (recordId - 1) + '건 추가\n• 길드 자금 거래 내역 6건 추가\n\n이제 길드원 목록에서 실제 데이터를 확인할 수 있습니다.'
    };
    
  } catch (error) {
    console.error('테스트 데이터 생성 오류:', error);
    return { 
      success: false, 
      message: '테스트 데이터 생성 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 관리자용 테스트 함수 - 초기화 + 테스트 데이터 =====
function setupCompleteTestEnvironment() {
  console.log('완전한 테스트 환경 설정 시작');
  
  try {
    // 1. 시트 초기화
    const initResult = initializeAllSheets();
    if (!initResult.success) {
      return initResult;
    }
    
    // 2. 테스트 데이터 생성
    const testResult = createTestData();
    if (!testResult.success) {
      return testResult;
    }
    
    return {
      success: true,
      message: '완전한 테스트 환경 설정 완료!\n\n' + 
               '✅ 시스템 초기화 완료\n' +
               '✅ 테스트 데이터 생성 완료\n\n' +
               '🔑 관리자 계정:\n• 닉네임: 관리자\n• 비밀번호: admin123\n\n' +
               '🔑 테스트 회원 계정들:\n• 닉네임: 길드페이드 (고참여자)\n• 닉네임: 아워로드 (고참여자)\n• 비밀번호: test123 (모든 테스트 계정 공통)\n\n' +
               '📊 생성된 데이터:\n• 회원 9명 (관리자 포함)\n• 보스 참여 기록 다수\n• 길드 자금 거래 내역\n• 샘플 보스 목록\n\n' +
               '🚀 이제 모든 기능을 테스트할 수 있습니다!\n길드원 목록에서 실제 데이터를 확인해보세요.'
    };
    
  } catch (error) {
    console.error('테스트 환경 설정 오류:', error);
    return {
      success: false,
      message: '테스트 환경 설정 중 오류가 발생했습니다: ' + error.message
    };
  }
}
function getMembersWithParticipation() {
  console.log('참여 정보 포함 회원 목록 조회 시작');
  
  try {
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      console.log('회원 정보 시트를 찾을 수 없습니다');
      return [];
    }
    
    const memberData = memberSheet.getDataRange().getValues();
    const members = [];
    
    // 보스 참여 기록 가져오기
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    let bossData = [];
    if (bossSheet && bossSheet.getLastRow() > 1) {
      bossData = bossSheet.getDataRange().getValues();
    }
    
    for (let i = 1; i < memberData.length; i++) {
      // 빈 행 건너뛰기
      if (!memberData[i][0] || !memberData[i][1]) {
        continue;
      }
      
      const nickname = memberData[i][1];
      
      // 해당 회원의 보스 참여 통계 계산
      let participationCount = 0;
      let lastParticipation = null;
      let totalItemsObtained = 0;
      let totalSalesAmount = 0;
      
      for (let j = 1; j < bossData.length; j++) {
        if (bossData[j][3] === nickname) { // 참여자 컬럼 확인
          participationCount++;
          const participationDate = new Date(bossData[j][1]);
          if (!lastParticipation || participationDate > lastParticipation) {
            lastParticipation = participationDate;
          }
          
          // 아이템 개수 누적
          totalItemsObtained += (bossData[j][5] || 0);
          
          // 판매 금액 누적 (실수령액 기준)
          totalSalesAmount += (bossData[j][9] || 0);
        }
      }
      
      members.push({
        id: memberData[i][0],
        nickname: nickname,
        guild: memberData[i][2],
        server: memberData[i][3],
        job: memberData[i][4],              
        joinDate: memberData[i][6],         
        status: memberData[i][7],           
        isAdmin: memberData[i][8] === 'Y',  
        
        // 참여 통계
        participationCount: participationCount,
        lastParticipation: lastParticipation,
        totalItemsObtained: totalItemsObtained,
        totalSalesAmount: totalSalesAmount,
        
        // 활동 점수 계산 (참여도 기반)
        activityScore: calculateActivityScore(participationCount, lastParticipation, memberData[i][6])
      });
    }
    
    // 참여횟수 순으로 정렬
    members.sort(function(a, b) {
      return b.participationCount - a.participationCount;
    });
    
    console.log('참여 정보 포함 회원 목록 조회 완료, 총 인원:', members.length);
    return members;
    
  } catch (error) {
    console.error('참여 정보 포함 회원 목록 조회 오류:', error);
    return [];
  }
}

// 활동 점수 계산 함수
function calculateActivityScore(participationCount, lastParticipation, joinDate) {
  try {
    let score = 0;
    
    // 기본 참여 점수 (참여 1회당 10점)
    score += participationCount * 10;
    
    // 최근 활동 보너스
    if (lastParticipation) {
      const daysSinceLastActivity = Math.floor((new Date() - new Date(lastParticipation)) / (1000 * 60 * 60 * 24));
      if (daysSinceLastActivity <= 7) {
        score += 50; // 일주일 이내 활동
      } else if (daysSinceLastActivity <= 30) {
        score += 20; // 한달 이내 활동
      }
    }
    
    // 가입 기간 보너스
    const daysSinceJoin = Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceJoin >= 30) {
      score += Math.min(daysSinceJoin / 30 * 5, 50); // 최대 50점
    }
    
    return Math.round(score);
    
  } catch (error) {
    console.error('활동 점수 계산 오류:', error);
    return 0;
  }
}

// 회원 상세 정보 조회
function getMemberDetails(nickname) {
  console.log('회원 상세 정보 조회:', nickname);
  
  try {
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const memberData = memberSheet.getDataRange().getValues();
    let memberInfo = null;
    
    // 회원 기본 정보 찾기
    for (let i = 1; i < memberData.length; i++) {
      if (memberData[i][1] === nickname) {
        memberInfo = {
          id: memberData[i][0],
          nickname: memberData[i][1],
          guild: memberData[i][2],
          server: memberData[i][3],
          job: memberData[i][4],
          joinDate: memberData[i][6],
          status: memberData[i][7],
          isAdmin: memberData[i][8] === 'Y'
        };
        break;
      }
    }
    
    if (!memberInfo) {
      return { success: false, message: '해당 회원을 찾을 수 없습니다.' };
    }
    
    // 보스 참여 기록 조회
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    const participationHistory = [];
    
    if (bossSheet && bossSheet.getLastRow() > 1) {
      const bossData = bossSheet.getDataRange().getValues();
      
      for (let i = 1; i < bossData.length; i++) {
        if (bossData[i][3] === nickname) {
          participationHistory.push({
            date: bossData[i][1],
            bossName: bossData[i][2],
            item: bossData[i][4] || '',
            itemCount: bossData[i][5] || 0,
            soldStatus: bossData[i][6] || '미판매',
            salePrice: bossData[i][7] || 0,
            netAmount: bossData[i][9] || 0
          });
        }
      }
    }
    
    // 최근 30일 참여 통계
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentParticipation = participationHistory.filter(function(record) {
      return new Date(record.date) >= thirtyDaysAgo;
    });
    
    return {
      success: true,
      memberInfo: memberInfo,
      participationHistory: participationHistory,
      recentStats: {
        totalParticipation: participationHistory.length,
        recentParticipation: recentParticipation.length,
        totalEarnings: participationHistory.reduce(function(sum, record) {
          return sum + (record.netAmount || 0);
        }, 0)
      }
    };
    
  } catch (error) {
    console.error('회원 상세 정보 조회 오류:', error);
    return { success: false, message: '회원 정보 조회 중 오류가 발생했습니다: ' + error.message };
  }
}

// 회원 통계 대시보드 데이터
function getMembersDashboardStats() {
  console.log('회원 통계 대시보드 데이터 조회');
  
  try {
    const members = getMembers();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // 기본 통계
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === '활성').length;
    const inactiveMembers = totalMembers - activeMembers;
    
    // 최근 가입자
    const recentJoins = members.filter(function(m) {
      return new Date(m.joinDate) >= oneWeekAgo;
    }).length;
    
    // 보스 참여 통계
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    let weeklyParticipation = 0;
    let monthlyParticipation = 0;
    
    if (bossSheet && bossSheet.getLastRow() > 1) {
      const bossData = bossSheet.getDataRange().getValues();
      
      for (let i = 1; i < bossData.length; i++) {
        const recordDate = new Date(bossData[i][1]);
        if (recordDate >= oneWeekAgo) {
          weeklyParticipation++;
        }
        if (recordDate >= oneMonthAgo) {
          monthlyParticipation++;
        }
      }
    }
    
    // 직업별 분포
    const jobDistribution = {};
    members.forEach(function(member) {
      const job = member.job || '미분류';
      jobDistribution[job] = (jobDistribution[job] || 0) + 1;
    });
    
    // 상위 참여자 (TOP 5)
    const topParticipants = members
      .filter(m => m.participationCount > 0)
      .sort((a, b) => b.participationCount - a.participationCount)
      .slice(0, 5)
      .map(function(member, index) {
        return {
          rank: index + 1,
          nickname: member.nickname,
          participationCount: member.participationCount,
          lastParticipation: member.lastParticipation
        };
      });
    
    return {
      basic: {
        totalMembers: totalMembers,
        activeMembers: activeMembers,
        inactiveMembers: inactiveMembers,
        recentJoins: recentJoins
      },
      participation: {
        weeklyParticipation: weeklyParticipation,
        monthlyParticipation: monthlyParticipation,
        averageParticipationPerMember: totalMembers > 0 ? Math.round(monthlyParticipation / totalMembers) : 0
      },
      jobDistribution: jobDistribution,
      topParticipants: topParticipants
    };
    
  } catch (error) {
    console.error('회원 통계 대시보드 데이터 조회 오류:', error);
    return {
      basic: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, recentJoins: 0 },
      participation: { weeklyParticipation: 0, monthlyParticipation: 0, averageParticipationPerMember: 0 },
      jobDistribution: {},
      topParticipants: []
    };
  }
}

// 회원 상태 일괄 업데이트
function batchUpdateMemberStatus(memberIds, newStatus) {
  console.log('회원 상태 일괄 업데이트:', memberIds, newStatus);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    let updatedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (memberIds.includes(data[i][0])) {
        // 상태 컬럼 업데이트 (인덱스 7)
        sheet.getRange(i + 1, 8).setValue(newStatus);
        updatedCount++;
      }
    }
    
    console.log('회원 상태 일괄 업데이트 완료:', updatedCount);
    return { 
      success: true, 
      message: updatedCount + '명의 회원 상태가 "' + newStatus + '"로 변경되었습니다.',
      updatedCount: updatedCount
    };
    
  } catch (error) {
    console.error('회원 상태 일괄 업데이트 오류:', error);
    return { success: false, message: '상태 업데이트 중 오류가 발생했습니다: ' + error.message };
  }
}

// 비활성 회원 자동 처리
function autoUpdateInactiveMembers() {
  console.log('비활성 회원 자동 처리 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const memberData = sheet.getDataRange().getValues();
    const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    let bossData = [];
    
    if (bossSheet && bossSheet.getLastRow() > 1) {
      bossData = bossSheet.getDataRange().getValues();
    }
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    let updatedCount = 0;
    
    for (let i = 1; i < memberData.length; i++) {
      if (!memberData[i][0] || !memberData[i][1] || memberData[i][7] !== '활성') {
        continue;
      }
      
      const nickname = memberData[i][1];
      let hasRecentActivity = false;
      
      // 최근 30일 내 참여 기록 확인
      for (let j = 1; j < bossData.length; j++) {
        if (bossData[j][3] === nickname) {
          const activityDate = new Date(bossData[j][1]);
          if (activityDate >= thirtyDaysAgo) {
            hasRecentActivity = true;
            break;
          }
        }
      }
      
      // 30일 이상 미참여 시 비활성 처리
      if (!hasRecentActivity) {
        sheet.getRange(i + 1, 8).setValue('비활성');
        updatedCount++;
      }
    }
    
    console.log('비활성 회원 자동 처리 완료:', updatedCount);
    return { 
      success: true, 
      message: updatedCount + '명이 비활성 상태로 변경되었습니다.',
      updatedCount: updatedCount
    };
    
  } catch (error) {
    console.error('비활성 회원 자동 처리 오류:', error);
    return { success: false, message: '비활성 회원 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

// 회원 정보 업데이트
function updateMemberInfo(memberId, updateData) {
  console.log('회원 정보 업데이트:', memberId, updateData);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === memberId) {
        // 업데이트 가능한 필드들
        if (updateData.guild) sheet.getRange(i + 1, 3).setValue(updateData.guild);
        if (updateData.server) sheet.getRange(i + 1, 4).setValue(updateData.server);
        if (updateData.job) sheet.getRange(i + 1, 5).setValue(updateData.job);
        if (updateData.status) sheet.getRange(i + 1, 8).setValue(updateData.status);
        if (updateData.hasOwnProperty('isAdmin')) {
          sheet.getRange(i + 1, 9).setValue(updateData.isAdmin ? 'Y' : 'N');
        }
        
        console.log('회원 정보 업데이트 완료:', memberId);
        return { success: true, message: '회원 정보가 업데이트되었습니다.' };
      }
    }
    
    return { success: false, message: '해당 회원을 찾을 수 없습니다.' };
    
  } catch (error) {
    console.error('회원 정보 업데이트 오류:', error);
    return { success: false, message: '회원 정보 업데이트 중 오류가 발생했습니다: ' + error.message };
  }
}

// 회원 데이터 검증
function validateMemberData() {
  console.log('회원 데이터 검증 시작');
  
  try {
    const errors = [];
    const warnings = [];
    
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const nicknames = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const row = i + 1; // 실제 시트 행 번호
      
      // 필수 필드 체크
      if (!data[i][0]) {
        errors.push(`행 ${row}: 회원ID가 없습니다.`);
      }
      if (!data[i][1]) {
        errors.push(`행 ${row}: 닉네임이 없습니다.`);
      }
      if (!data[i][2]) {
        warnings.push(`행 ${row}: 길드명이 없습니다.`);
      }
      if (!data[i][4]) {
        warnings.push(`행 ${row}: 직업이 없습니다.`);
      }
      
      // 중복 닉네임 체크
      if (data[i][1]) {
        if (nicknames.has(data[i][1])) {
          errors.push(`행 ${row}: 중복된 닉네임입니다 - ${data[i][1]}`);
        }
        nicknames.add(data[i][1]);
      }
      
      // 상태 값 체크
      if (data[i][7] && !['활성', '비활성', '삭제'].includes(data[i][7])) {
        warnings.push(`행 ${row}: 잘못된 상태 값입니다 - ${data[i][7]}`);
      }
      
      // 관리자 여부 체크
      if (data[i][8] && !['Y', 'N'].includes(data[i][8])) {
        warnings.push(`행 ${row}: 잘못된 관리자 여부 값입니다 - ${data[i][8]}`);
      }
    }
    
    console.log('회원 데이터 검증 완료. 오류:', errors.length, '경고:', warnings.length);
    
    return {
      success: true,
      errors: errors,
      warnings: warnings,
      summary: `총 ${data.length - 1}명 검증 완료. 오류 ${errors.length}건, 경고 ${warnings.length}건`
    };
    
  } catch (error) {
    console.error('회원 데이터 검증 오류:', error);
    return { success: false, message: '데이터 검증 중 오류가 발생했습니다: ' + error.message };
  }
}

// 회원 목록 내보내기 (CSV 형태의 데이터 준비)
function exportMembersData() {
  console.log('회원 목록 내보내기 데이터 준비');
  
  try {
    const members = getMembersWithParticipation();
    const csvData = [];
    
    // 헤더 추가
    csvData.push([
      '회원ID', '닉네임', '길드', '서버', '직업', '가입일', '상태', '관리자여부',
      '총참여횟수', '최근참여일', '총아이템획득', '총판매수익', '활동점수'
    ]);
    
    // 데이터 추가
    members.forEach(function(member) {
      csvData.push([
        member.id,
        member.nickname,
        member.guild,
        member.server,
        member.job,
        member.joinDate ? Utilities.formatDate(new Date(member.joinDate), 'GMT+9', 'yyyy-MM-dd') : '',
        member.status,
        member.isAdmin ? '관리자' : '일반회원',
        member.participationCount,
        member.lastParticipation ? Utilities.formatDate(new Date(member.lastParticipation), 'GMT+9', 'yyyy-MM-dd') : '없음',
        member.totalItemsObtained,
        member.totalSalesAmount,
        member.activityScore
      ]);
    });
    
    console.log('회원 목록 내보내기 데이터 준비 완료:', csvData.length - 1, '명');
    
    return {
      success: true,
      data: csvData,
      filename: '길드원목록_' + Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd') + '.csv'
    };
    
  } catch (error) {
    console.error('회원 목록 내보내기 데이터 준비 오류:', error);
    return { success: false, message: '데이터 준비 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 기존 getMembers 함수 개선 (기존 함수를 대체) =====
function getMembers() {
  console.log('회원 목록 조회 시작');
  
  try {
    // getMembersWithParticipation 함수 사용
    return getMembersWithParticipation();
    
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    return [];
  }
}

// ===== 유틸리티 함수들 =====

// 닉네임으로 회원 ID 찾기
function getMemberIdByNickname(nickname) {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === nickname) {
        return data[i][0];
      }
    }
    return null;
    
  } catch (error) {
    console.error('닉네임으로 회원 ID 찾기 오류:', error);
    return null;
  }
}

// 회원 존재 여부 확인
function checkMemberExists(nickname) {
  return getMemberIdByNickname(nickname) !== null;
}

// 활성 회원 수 조회
function getActiveMemberCount() {
  try {
    const members = getMembers();
    return members.filter(m => m.status === '활성').length;
    
  } catch (error) {
    console.error('활성 회원 수 조회 오류:', error);
    return 0;
  }
}

// 주간 신규 가입자 수 조회
function getWeeklyNewMemberCount() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const members = getMembers();
    return members.filter(function(member) {
      return new Date(member.joinDate) >= oneWeekAgo;
    }).length;
    
  } catch (error) {
    console.error('주간 신규 가입자 수 조회 오류:', error);
    return 0;
  }
}
