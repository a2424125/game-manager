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
    return { 
      success: false, 
      message: '캐시 초기화 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

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
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return null;
    }
    return sheet;
  } catch (error) {
    return null;
  }
}

// ===== 비밀번호 해시 함수 =====
function hashPassword(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return Utilities.base64Encode(hash);
}

// ===== 수정된 인증 관련 함수 =====
function login(nickname, password) {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const hashedPassword = hashPassword(password);
    
    for (let i = 1; i < data.length; i++) {
      // 유효한 회원 데이터인지 확인 (회원ID가 M으로 시작하고 닉네임이 있는지)
      if (!data[i][0] || !data[i][0].toString().startsWith('M') || !data[i][1]) {
        continue;
      }
      
      // 인덱스 조정: 직업 필드가 추가되어 비밀번호는 5번째(인덱스 5), 상태는 7번째(인덱스 7), 관리자는 8번째(인덱스 8)
      if (data[i][1] === nickname && data[i][5] === hashedPassword && data[i][7] === '활성') {
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
    
    return { success: false, message: '닉네임 또는 비밀번호가 일치하지 않습니다.' };
    
  } catch (error) {
    return { success: false, message: '로그인 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 비밀번호 변경 함수 추가 =====
function changePassword(userId, currentPassword, newPassword) {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const currentHashedPassword = hashPassword(currentPassword);
    const newHashedPassword = hashPassword(newPassword);
    
    for (let i = 1; i < data.length; i++) {
      // 유효한 회원 데이터인지 확인
      if (!data[i][0] || !data[i][0].toString().startsWith('M') || !data[i][1]) {
        continue;
      }
      
      // 사용자 ID가 일치하는지 확인
      if (data[i][0] === userId) {
        // 현재 비밀번호가 일치하는지 확인 (인덱스 5가 비밀번호)
        if (data[i][5] !== currentHashedPassword) {
          return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
        }
        
        // 새 비밀번호로 업데이트
        sheet.getRange(i + 1, 6).setValue(newHashedPassword); // 6번째 열(인덱스 5)이 비밀번호
        
        // 캐시 클리어
        clearCache();
        
        return { 
          success: true, 
          message: '비밀번호가 성공적으로 변경되었습니다.' 
        };
      }
    }
    
    return { success: false, message: '사용자를 찾을 수 없습니다.' };
    
  } catch (error) {
    return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 세션 유효성 검증 함수 =====
function validateSession(userId, nickname) {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // 유효한 회원 데이터인지 확인
      if (!data[i][0] || !data[i][0].toString().startsWith('M') || !data[i][1]) {
        continue;
      }
      
      // ID와 닉네임이 일치하고 활성 상태인지 확인
      if (data[i][0] === userId && data[i][1] === nickname && data[i][7] === '활성') {
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
    
    return { success: false, message: '세션이 만료되었거나 유효하지 않습니다.' };
    
  } catch (error) {
    return { success: false, message: '세션 검증 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 수정된 회원가입 함수 =====
function register(userData) {
  try {
    // 시트 초기화 먼저 실행
    const initResult = initializeMembersSheet();
    if (!initResult.success) {
      // 시트 초기화 실패는 경고만 표시하고 진행
    }
    
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
    
    // 닉네임 길이 검증
    if (userData.nickname.length < 2 || userData.nickname.length > 20) {
      return { success: false, message: '닉네임은 2-20자 사이로 입력해주세요.' };
    }
    
    // 비밀번호 길이 검증
    if (userData.password.length < 6) {
      return { success: false, message: '비밀번호는 6자 이상이어야 합니다.' };
    }
    
    // 실제 회원 수를 계산하여 새로운 ID 생성
    let memberCount = 0;
    for (let i = 1; i < data.length; i++) {
      // 회원ID와 닉네임이 모두 있는 행만 회원으로 간주
      if (data[i][0] && data[i][1] && data[i][0].toString().startsWith('M')) {
        memberCount++;
      }
    }
    
    const newId = 'M' + String(memberCount + 1).padStart(4, '0');
    const today = new Date();
    const hashedPassword = hashPassword(userData.password);
    
    // 새 행에 데이터 추가
    const newMemberData = [
      newId,                    // 회원ID
      userData.nickname,        // 닉네임
      userData.guild,          // 길드명
      userData.server,         // 서버
      userData.job,            // 직업
      hashedPassword,          // 비밀번호 (해시)
      today,                   // 가입일
      '활성',                  // 상태
      'N'                      // 관리자 여부
    ];
    
    // 데이터 추가
    sheet.appendRow(newMemberData);
    
    // 캐시 클리어
    clearCache();
    
    return { 
      success: true, 
      message: '회원가입이 완료되었습니다!\n\n닉네임: ' + userData.nickname + 
               '\n직업: ' + userData.job + 
               '\n길드: ' + userData.guild + 
               '\n서버: ' + userData.server +
               '\n\n이제 로그인할 수 있습니다.',
      newMember: {
        id: newId,
        nickname: userData.nickname,
        guild: userData.guild,
        server: userData.server,
        job: userData.job
      }
    };
    
  } catch (error) {
    return { success: false, message: '회원가입 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 회원 시트 초기화 함수 추가 =====
function initializeMembersSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    
    if (!memberSheet) {
      memberSheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
      memberSheet.appendRow([
        '회원ID', '닉네임', '길드', '서버', '직업', 
        '비밀번호', '가입일', '상태', '관리자'
      ]);
      
      // 강화된 관리자 계정 생성 (더 복잡한 비밀번호 사용)
      const strongAdminPassword = 'Admin#2025!Safe';
      const adminPasswordHash = hashPassword(strongAdminPassword);
      
      memberSheet.appendRow([
        'M0001', '관리자', '시스템', '관리자', '시스템관리자',
        adminPasswordHash, new Date(), '활성', 'Y'
      ]);
      
      return { 
        success: true, 
        message: '회원정보 시트가 생성되었습니다.\n\n🔑 관리자 계정 정보:\n• 닉네임: 관리자\n• 비밀번호: ' + strongAdminPassword 
      };
    }
    
    // 기존 시트가 있다면 관리자 계정 확인
    const data = memberSheet.getDataRange().getValues();
    let hasAdmin = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === '관리자' && data[i][8] === 'Y') {
        hasAdmin = true;
        break;
      }
    }
    
    // 관리자 계정이 없으면 생성
    if (!hasAdmin) {
      const strongAdminPassword = 'Admin#2025!Safe';
      const adminPasswordHash = hashPassword(strongAdminPassword);
      
      memberSheet.appendRow([
        'M0001', '관리자', '시스템', '관리자', '시스템관리자',
        adminPasswordHash, new Date(), '활성', 'Y'
      ]);
      
      return { 
        success: true, 
        message: '관리자 계정이 생성되었습니다.\n\n🔑 관리자 계정 정보:\n• 닉네임: 관리자\n• 비밀번호: ' + strongAdminPassword 
      };
    }
    
    return { success: true, message: '회원정보 시트가 이미 존재합니다.' };
    
  } catch (error) {
    return { success: false, message: '회원정보 시트 초기화 중 오류: ' + error.message };
  }
}

// ===== 관리자 HTML 페이지 생성 함수 =====
function getAdminHTML() {
  try {
    // admin-pages.gs에서 관리자 HTML을 가져옴
    return getAdminPageHTML();
  } catch (error) {
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

// ===== 수정된 회원 목록 조회 함수 =====
function getMembers() {
  console.log('=== getMembers 함수 시작 ===');
  
  try {
    // 회원 정보 시트 접근
    const memberSheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!memberSheet) {
      console.log('❌ 회원 정보 시트를 찾을 수 없음');
      return [];
    }
    
    console.log('✅ 회원 정보 시트 접근 성공');
    
    // 시트에 데이터가 있는지 확인
    const lastRow = memberSheet.getLastRow();
    console.log('마지막 행 번호:', lastRow);
    
    if (lastRow < 2) {
      console.log('❌ 데이터 없음 (헤더만 존재)');
      return [];
    }
    
    // 회원 데이터 조회
    const memberData = memberSheet.getDataRange().getValues();
    console.log('조회된 데이터 행 수:', memberData.length);
    console.log('헤더:', memberData[0]);
    
    const members = [];
    
    console.log('=== 회원 데이터 처리 시작 ===');
    
    // 각 회원 데이터 처리 (헤더 제외)
    for (let i = 1; i < memberData.length; i++) {
      try {
        const row = memberData[i];
        console.log(`${i}행 처리 중:`, row);
        
        // 빈 행 체크
        if (!row || row.length === 0 || (!row[0] && !row[1])) {
          console.log(`${i}행 스킵: 빈 행`);
          continue;
        }
        
        // 회원ID 검증
        const memberId = row[0] ? String(row[0]).trim() : '';
        if (!memberId) {
          console.log(`${i}행 스킵: 회원ID 없음`);
          continue;
        }
        
        // 닉네임 검증
        const nickname = row[1] ? String(row[1]).trim() : '';
        if (!nickname) {
          console.log(`${i}행 스킵: 닉네임 없음`);
          continue;
        }
        
        // 회원 정보 객체 생성 (보스 참여 기록은 나중에 처리)
        const memberInfo = {
          id: memberId,
          nickname: nickname,
          guild: row[2] ? String(row[2]).trim() : '미지정',
          server: row[3] ? String(row[3]).trim() : '미지정',
          job: row[4] ? String(row[4]).trim() : '미지정',
          joinDate: row[6] || new Date(),
          status: row[7] ? String(row[7]).trim() : '활성',
          isAdmin: row[8] ? (String(row[8]).trim() === 'Y') : false,
          participationCount: 0, // 기본값
          lastParticipation: null
        };
        
        members.push(memberInfo);
        console.log(`✅ ${i}행 처리 완료:`, memberInfo.nickname);
        
      } catch (rowError) {
        console.log(`${i}행 처리 중 오류 발생:`, rowError.message);
        continue; // 개별 행 오류는 무시하고 계속 진행
      }
    }
    
    console.log(`=== 기본 회원 정보 처리 완료: ${members.length}명 ===`);
    
    // 보스 참여 기록 조회 (안전하게 처리)
    try {
      console.log('=== 보스 참여 기록 조회 시작 ===');
      const bossSheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
      
      if (bossSheet && bossSheet.getLastRow() > 1) {
        console.log('✅ 보스 기록 시트 존재');
        const bossData = bossSheet.getDataRange().getValues();
        console.log('보스 기록 행 수:', bossData.length);
        
        // 각 회원의 보스 참여횟수 계산
        for (let i = 0; i < members.length; i++) {
          const member = members[i];
          let participationCount = 0;
          let lastParticipation = null;
          
          for (let j = 1; j < bossData.length; j++) {
            if (bossData[j] && bossData[j][3] === member.nickname) {
              participationCount++;
              try {
                const participationDate = new Date(bossData[j][1]);
                if (!lastParticipation || participationDate > lastParticipation) {
                  lastParticipation = participationDate;
                }
              } catch (dateError) {
                // 날짜 파싱 오류는 무시
              }
            }
          }
          
          member.participationCount = participationCount;
          member.lastParticipation = lastParticipation;
          
          console.log(`${member.nickname}: 참여 ${participationCount}회`);
        }
        
        console.log('✅ 보스 참여 기록 처리 완료');
      } else {
        console.log('⚠️ 보스 기록 시트가 없거나 데이터가 없음');
      }
    } catch (bossError) {
      console.log('⚠️ 보스 기록 처리 중 오류 (무시하고 진행):', bossError.message);
      // 보스 기록 오류는 무시하고 회원 목록은 반환
    }
    
    // 참여횟수 순으로 정렬
    members.sort(function(a, b) {
      return b.participationCount - a.participationCount;
    });
    
    console.log(`=== getMembers 완료: 총 ${members.length}명 반환 ===`);
    return members;
    
  } catch (error) {
    console.log('❌ getMembers 전체 오류:', error.message);
    console.log('오류 스택:', error.stack);
    // 오류 발생시에도 빈 배열 대신 기본 데이터라도 반환 시도
    return [];
  }
}

// ===== 강제 새로고침 함수 =====
function forceRefreshMembers() {
  console.log('=== 강제 새로고침 시작 ===');
  
  // 캐시 초기화
  const cache = CacheService.getScriptCache();
  cache.removeAll(['guild_members']);
  
  // 회원 목록 다시 조회
  const members = getMembers();
  console.log('강제 새로고침 결과:', members.length, '명');
  return members;
}

// ===== 데이터 검증 함수 =====
function validateMemberData() {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { 
        success: false, 
        message: '회원 시트를 찾을 수 없습니다.',
        errors: ['회원 시트 없음'],
        warnings: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const errors = [];
    const warnings = [];
    let validMembers = 0;
    
    // 헤더 검증
    if (data.length === 0) {
      errors.push('시트가 완전히 비어있습니다');
    } else if (data[0][0] !== '회원ID' || data[0][1] !== '닉네임') {
      warnings.push('헤더가 올바르지 않을 수 있습니다');
    }
    
    // 데이터 검증
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 빈 행 체크
      if (!row[0] && !row[1] && !row[2]) {
        continue; // 완전히 빈 행은 무시
      }
      
      // 회원ID 검증
      if (!row[0] || !row[0].toString().startsWith('M')) {
        warnings.push(`행 ${i + 1}: 잘못된 회원ID (${row[0]})`);
        continue;
      }
      
      // 닉네임 검증
      if (!row[1] || !row[1].toString().trim()) {
        errors.push(`행 ${i + 1}: 닉네임이 비어있음`);
        continue;
      }
      
      // 필수 필드 검증
      if (!row[2] || !row[3] || !row[4]) {
        warnings.push(`행 ${i + 1}: 일부 필수 필드가 비어있음 (${row[1]})`);
      }
      
      validMembers++;
    }
    
    const summary = `검증 완료: ${validMembers}명의 유효한 회원 발견`;
    
    return {
      success: true,
      summary: summary,
      errors: errors,
      warnings: warnings,
      validMembers: validMembers,
      totalRows: data.length - 1
    };
    
  } catch (error) {
    return {
      success: false,
      message: '데이터 검증 중 오류 발생: ' + error.message,
      errors: [error.message],
      warnings: []
    };
  }
}

// ===== 보스 기록 조회 함수 =====
function getBossRecords(filter) {
  try {
    const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    if (!sheet || sheet.getLastRow() < 2) return [];
    
    const data = sheet.getDataRange().getValues();
    const records = [];
    
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
      
      if (filter) {
        if (filter.boss && filter.boss !== 'all' && record.bossName !== filter.boss) continue;
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
    
    records.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    
    return records;
  } catch (error) {
    console.log('보스 기록 조회 오류:', error.message);
    return [];
  }
}

// ===== 보스 통계 함수 =====
function getBossStatistics() {
  try {
    const records = getBossRecords();
    const stats = {};
    const memberStats = {};
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
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
    
    const memberStatsArray = Object.values(memberStats);
    memberStatsArray.sort(function(a, b) {
      return b.totalParticipation - a.totalParticipation;
    });
    
    return {
      bossStats: bossStats,
      memberStats: memberStatsArray
    };
  } catch (error) {
    console.log('보스 통계 조회 오류:', error.message);
    return {
      bossStats: [],
      memberStats: []
    };
  }
}

// ===== 대시보드 데이터 함수 =====
function getDashboardData() {
  try {
    const currentWeek = Utilities.formatDate(new Date(), 'GMT+9', 'w');
    const guildBalance = getGuildBalance();
    const members = getMembers();
    
    return {
      currentWeek: currentWeek,
      guildBalance: guildBalance,
      totalMembers: members.length,
      activeMembers: members.filter(function(m) { return m.status === '활성'; }).length,
      unsoldItems: 0,
      weeklyParticipants: 0
    };
  } catch (error) {
    console.log('대시보드 데이터 조회 오류:', error.message);
    return {
      currentWeek: 0,
      guildBalance: 0,
      totalMembers: 0,
      activeMembers: 0,
      unsoldItems: 0,
      weeklyParticipants: 0
    };
  }
}

// ===== 길드 잔액 조회 함수 =====
function getGuildBalance() {
  try {
    const sheet = getSheet(SHEET_NAMES.GUILD_FUNDS);
    if (!sheet || sheet.getLastRow() < 2) return 0;
    
    const lastRow = sheet.getLastRow();
    const balance = sheet.getRange(lastRow, 6).getValue();
    return balance || 0;
  } catch (error) {
    console.log('길드 잔액 조회 오류:', error.message);
    return 0;
  }
}

// ===== 초기화 관련 함수들 =====
function initializeAllSheets() {
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
      
      // 강화된 관리자 계정 추가
      const strongAdminPassword = 'Admin#2025!Safe';
      const testAdminPassword = hashPassword(strongAdminPassword);
      memberSheet.appendRow([
        'M0001', '관리자', '시스템', '관리자', '시스템관리자',
        testAdminPassword, new Date(), '활성', 'Y'
      ]);
      
      results.push('회원정보: 시트 생성 및 관리자 계정 추가 완료');
      results.push('🔑 관리자 계정 - 닉네임: 관리자, 비밀번호: ' + strongAdminPassword);
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
    
    return { 
      success: true, 
      message: '시스템 초기화 완료!\n\n' + results.join('\n')
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: '시스템 초기화 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 페이지 HTML 함수들 =====
function getDashboardHTML() {
  return getDashboardPageHTML();
}

function getBossRecordHTML() {
  return getBossRecordPageHTML();
}

function getMembersHTML() {
  return getMembersPageHTML();
}

function getBossHistoryHTML() {
  return getBossHistoryPageHTML();
}

function getItemSalesHTML() {
  return getItemSalesPageHTML();
}

function getGuildFundsHTML() {
  return getGuildFundsPageHTML();
}

function getDistributionHTML() {
  return getDistributionPageHTML();
}

function getStatisticsHTML() {
  return getStatisticsPageHTML();
}

// 숫자 포맷 함수
function formatNumber(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return new Intl.NumberFormat('ko-KR').format(num);
}

// ===== 관리자 계정 확인 및 생성 함수 =====
function ensureAdminAccount() {
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      initializeMembersSheet();
    }
    
    const data = sheet.getDataRange().getValues();
    let hasAdmin = false;
    
    // 기존 관리자 계정 확인
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === '관리자' && data[i][8] === 'Y') {
        hasAdmin = true;
        break;
      }
    }
    
    // 관리자 계정이 없으면 생성
    if (!hasAdmin) {
      const strongAdminPassword = 'Admin#2025!Safe';
      const adminPassword = hashPassword(strongAdminPassword);
      const adminData = [
        'M0001',
        '관리자', 
        '시스템',
        '관리자',
        '시스템관리자',
        adminPassword,
        new Date(),
        '활성',
        'Y'
      ];
      
      sheet.appendRow(adminData);
      
      return { 
        success: true, 
        message: '관리자 계정이 생성되었습니다.\n닉네임: 관리자\n비밀번호: ' + strongAdminPassword 
      };
    } else {
      return { 
        success: true, 
        message: '관리자 계정이 이미 존재합니다.' 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      message: '관리자 계정 확인 중 오류가 발생했습니다: ' + error.message 
    };
  }
}

// ===== 테스트 회원 데이터 함수 (디버깅용) =====
function getTestMembers() {
  console.log('=== getTestMembers 호출 (디버깅용) ===');
  
  return [
    {
      id: 'M0001',
      nickname: '관리자',
      guild: '시스템',
      server: '관리자',
      job: '시스템관리자',
      joinDate: new Date(),
      status: '활성',
      isAdmin: true,
      participationCount: 0,
      lastParticipation: null
    },
    {
      id: 'M0002',
      nickname: '길드페이드',
      guild: '바람의언덕',
      server: '루페온',
      job: '바드',
      joinDate: new Date(),
      status: '활성',
      isAdmin: false,
      participationCount: 15,
      lastParticipation: new Date()
    },
    {
      id: 'M0003',
      nickname: '아워로드',
      guild: '바람의언덕',
      server: '루페온',
      job: '워로드',
      joinDate: new Date(),
      status: '활성',
      isAdmin: false,
      participationCount: 12,
      lastParticipation: new Date()
    }
  ];
}

// ===== 회원 데이터 디버깅 함수 =====
function testMemberData() {
  console.log('=== 회원 데이터 테스트 시작 ===');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ 스프레드시트 열기 성공:', ss.getName());
    
    const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      console.log('❌ 회원정보 시트를 찾을 수 없음');
      return false;
    }
    
    console.log('✅ 회원정보 시트 접근 성공');
    
    const range = sheet.getDataRange();
    console.log('데이터 범위:', range.getNumRows() + '행 x ' + range.getNumColumns() + '열');
    
    const data = range.getValues();
    console.log('헤더 행:', data[0]);
    console.log('총', data.length, '행의 데이터 (헤더 포함)');
    
    // 처음 몇 행의 데이터 타입 확인
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      console.log(`${i}행 데이터:`, data[i]);
      console.log(`${i}행 타입:`, data[i].map(cell => typeof cell));
    }
    
    // 첫 번째 유효한 행 상세 분석
    if (data.length > 1) {
      const firstRow = data[1];
      console.log('첫 번째 유효한 행 상세:');
      console.log('- 회원ID (0열):', `"${firstRow[0]}"`, typeof firstRow[0]);
      console.log('- 닉네임 (1열):', `"${firstRow[1]}"`, typeof firstRow[1]);
      console.log('- 길드명 (2열):', `"${firstRow[2]}"`, typeof firstRow[2]);
      console.log('- 서버 (3열):', `"${firstRow[3]}"`, typeof firstRow[3]);
      console.log('- 직업 (4열):', `"${firstRow[4]}"`, typeof firstRow[4]);
      console.log('- 전체 행:', firstRow);
    }
    
    // 유효한 회원 수 계산
    let validCount = 0;
    let emptyCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        validCount++;
      } else {
        emptyCount++;
      }
    }
    
    console.log(`✅ 분석 완료: 유효한 행 ${validCount}개, 빈 행 ${emptyCount}개`);
    
    return true;
    
  } catch (error) {
    console.log('❌ 테스트 중 오류:', error.message);
    console.log('오류 스택:', error.stack);
    return false;
  }
}
