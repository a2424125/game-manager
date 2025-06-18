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
  const sheet = getSheet(SHEET_NAMES.MEMBERS);
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
  
  sheet.appendRow([
    newId,
    userData.nickname,
    userData.guild,
    userData.server,
    hashedPassword,
    today,
    '활성',
    'N'
  ]);
  
  return { success: true, message: '회원가입이 완료되었습니다.' };
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