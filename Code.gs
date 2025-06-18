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
  const sheet = getSheet(SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  const hashedPassword = hashPassword(password);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === nickname && data[i][5] === hashedPassword && data[i][7] === '활성') {
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
  
  return { success: false, message: '닉네임 또는 비밀번호가 일치하지 않습니다.' };
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
    
    console.log('회원가입 성공:', newId);
    return { success: true, message: '회원가입이 완료되었습니다.' };
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다: ' + error.message };
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

// ===== login 함수도 수정 (직업 필드 인덱스 조정) =====
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

// ===== getMembers 함수도 수정 (직업 필드 인덱스 조정) =====
function getMembers() {
  console.log('회원 목록 조회 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      console.log('회원 정보 시트를 찾을 수 없습니다');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const members = [];
    
    for (let i = 1; i < data.length; i++) {
      // 빈 행 건너뛰기
      if (!data[i][0] || !data[i][1]) {
        continue;
      }
      
      members.push({
        id: data[i][0],
        nickname: data[i][1],
        guild: data[i][2],
        server: data[i][3],
        job: data[i][4],              // 직업 필드 추가
        joinDate: data[i][6],         // 인덱스 조정
        status: data[i][7],           // 인덱스 조정
        isAdmin: data[i][8] === 'Y'   // 인덱스 조정
      });
    }
    
    console.log('회원 목록 조회 완료, 총 인원:', members.length);
    return members;
    
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    return [];
  }
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

// ===== 관리자 함수 =====
function getMembers() {
  const sheet = getSheet(SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  
  const members = [];
  for (let i = 1; i < data.length; i++) {
    members.push({
      id: data[i][0],
      nickname: data[i][1],
      guild: data[i][2],
      server: data[i][3],
      job: data[i][4],        // 직업 추가
      joinDate: data[i][6],   // 인덱스 조정
      status: data[i][7],     // 인덱스 조정
      isAdmin: data[i][8] === 'Y'  // 인덱스 조정
    });
  }
  
  return members;
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
// ===== 전체 시스템 초기화 함수 =====
function initializeAllSheets() {
  console.log('전체 시스템 초기화 시작');
  
  try {
    const results = [];
    
    // 1. 회원 정보 시트 초기화
    const membersResult = initializeMembersSheet();
    results.push('회원정보: ' + membersResult.message);
    
    // 2. 보스 기록 시트 초기화
    const bossRecordsResult = initializeBossRecordsSheet();
    results.push('보스기록: ' + bossRecordsResult.message);
    
    // 3. 길드 자금 시트 초기화
    const fundsResult = initializeGuildFundsSheet();
    results.push('길드자금: ' + fundsResult.message);
    
    // 4. 기타 시트들 초기화
    const systemResult = initializeSystemData();
    results.push('시스템설정: ' + systemResult.message);
    
    console.log('전체 시스템 초기화 완료');
    return { 
      success: true, 
      message: '시스템 초기화 완료:\n' + results.join('\n') 
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
}
