// ===== 관리자 페이지 HTML 생성 함수 =====

// 관리자 메인 페이지
function getAdminHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">관리자 설정</h1>
      <p class="page-subtitle">시스템 관리 및 설정</p>
    </div>
    
    <div class="admin-tabs">
      <button class="tab-btn active" onclick="showAdminTab('dashboard')">대시보드</button>
      <button class="tab-btn" onclick="showAdminTab('boss')">보스 관리</button>
      <button class="tab-btn" onclick="showAdminTab('members')">회원 관리</button>
      <button class="tab-btn" onclick="showAdminTab('roles')">권한 설정</button>
      <button class="tab-btn" onclick="showAdminTab('settings')">시스템 설정</button>
    </div>
    
    ${getAdminDashboardTab()}
    ${getAdminBossTab()}
    ${getAdminMembersTab()}
    ${getAdminRolesTab()}
    ${getAdminSettingsTab()}
    ${getAdminModals()}
  `;
}

// 관리자 대시보드 탭
function getAdminDashboardTab() {
  return `
    <div id="dashboard-tab" class="tab-content active">
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="stat-icon-wrapper blue">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-info">
            <h3>전체 회원</h3>
            <p class="stat-number">35명</p>
            <span class="stat-change positive">+3 이번주</span>
          </div>
        </div>
        
        <div class="admin-stat-card">
          <div class="stat-icon-wrapper green">
            <span class="material-icons">sports_esports</span>
          </div>
          <div class="stat-info">
            <h3>등록된 보스</h3>
            <p class="stat-number">12개</p>
            <span class="stat-change">활성: 10개</span>
          </div>
        </div>
        
        <div class="admin-stat-card">
          <div class="stat-icon-wrapper orange">
            <span class="material-icons">trending_up</span>
          </div>
          <div class="stat-info">
            <h3>주간 활동</h3>
            <p class="stat-number">245건</p>
            <span class="stat-change positive">+12%</span>
          </div>
        </div>
        
        <div class="admin-stat-card">
          <div class="stat-icon-wrapper red">
            <span class="material-icons">error_outline</span>
          </div>
          <div class="stat-info">
            <h3>시스템 오류</h3>
            <p class="stat-number">0건</p>
            <span class="stat-change">정상 작동중</span>
          </div>
        </div>
      </div>
      
      <div class="admin-actions">
        <div class="card">
          <div class="card-header">
            <span class="material-icons">flash_on</span>
            <span>빠른 작업</span>
          </div>
          <div class="quick-actions-grid">
            <button class="quick-action-btn" onclick="createBackup()">
              <span class="material-icons">backup</span>
              <span>백업 실행</span>
            </button>
            <button class="quick-action-btn" onclick="runDataValidation()">
              <span class="material-icons">fact_check</span>
              <span>데이터 검증</span>
            </button>
            <button class="quick-action-btn" onclick="updateInactiveMembers()">
              <span class="material-icons">person_off</span>
              <span>비활성 회원 처리</span>
            </button>
            <button class="quick-action-btn" onclick="initializeAllSheets()">
              <span class="material-icons">settings_backup_restore</span>
              <span>시트 초기화</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 보스 관리 탭
function getAdminBossTab() {
  return `
    <div id="boss-tab" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <span class="material-icons">sports_esports</span>
          <span>보스 목록 관리</span>
          <button class="btn btn-sm btn-primary" onclick="openAddBossModal()">
            <span class="material-icons">add</span>
            보스 추가
          </button>
        </div>
        
        <div class="boss-schedule-view">
          <h4>오늘의 보스 출현 시간표</h4>
          <div id="todayBossSchedule" class="schedule-timeline"></div>
        </div>
        
        <div class="table-container">
          <table id="bossListTable">
            <thead>
              <tr>
                <th>보스ID</th>
                <th>보스명</th>
                <th>레벨</th>
                <th>출현시간</th>
                <th>상태</th>
                <th>등록일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 회원 관리 탭
function getAdminMembersTab() {
  return `
    <div id="members-tab" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <span class="material-icons">people</span>
          <span>전체 회원 목록</span>
          <div class="header-actions">
            <input type="text" class="search-input" placeholder="회원 검색..." onkeyup="searchAdminMembers(this.value)">
            <button class="btn btn-sm btn-primary" onclick="exportMembers()">
              <span class="material-icons">download</span>
              내보내기
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table id="adminMemberTable">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" id="selectAllMembers" onchange="toggleAllMembers(this)">
                </th>
                <th>ID</th>
                <th>닉네임</th>
                <th>길드</th>
                <th>서버</th>
                <th>직업</th>
                <th>가입일</th>
                <th>상태</th>
                <th>권한</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        
        <div class="bulk-actions">
          <select id="bulkAction" class="form-input">
            <option value="">일괄 작업 선택</option>
            <option value="activate">활성화</option>
            <option value="deactivate">비활성화</option>
            <option value="delete">삭제</option>
          </select>
          <button class="btn btn-secondary" onclick="executeBulkAction()">실행</button>
        </div>
      </div>
    </div>
  `;
}

// 권한 설정 탭
function getAdminRolesTab() {
  return `
    <div id="roles-tab" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <span class="material-icons">security</span>
          <span>권한 관리</span>
        </div>
        
        <div class="role-management">
          <div class="role-section">
            <div class="role-header">
              <h4>관리자 (Admin)</h4>
              <span class="role-count">2명</span>
            </div>
            <p class="role-description">모든 기능에 접근 가능한 최고 권한</p>
            <div id="adminList" class="member-chips"></div>
          </div>
          
          <div class="role-section">
            <div class="role-header">
              <h4>부관리자 (Sub-Admin)</h4>
              <span class="role-count">3명</span>
            </div>
            <p class="role-description">일부 관리 기능에 접근 가능</p>
            <div id="subAdminList" class="member-chips"></div>
            <button class="btn btn-secondary" onclick="openAssignRoleModal('subadmin')">
              <span class="material-icons">add</span>
              부관리자 추가
            </button>
          </div>
          
          <div class="role-section">
            <div class="role-header">
              <h4>운영진 (Moderator)</h4>
              <span class="role-count">5명</span>
            </div>
            <p class="role-description">보스 참여 등록 및 기본 관리 가능</p>
            <div id="moderatorList" class="member-chips"></div>
            <button class="btn btn-secondary" onclick="openAssignRoleModal('moderator')">
              <span class="material-icons">add</span>
              운영진 추가
            </button>
          </div>
          
          <div class="role-section">
            <div class="role-header">
              <h4>일반 회원 (Member)</h4>
              <span class="role-count">25명</span>
            </div>
            <p class="role-description">기본 기능만 사용 가능</p>
          </div>
        </div>
        
        <div class="permission-matrix">
          <h4>권한별 접근 가능 메뉴</h4>
          <table class="permission-table">
            <thead>
              <tr>
                <th>메뉴</th>
                <th>관리자</th>
                <th>부관리자</th>
                <th>운영진</th>
                <th>일반회원</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>대시보드</td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
              </tr>
              <tr>
                <td>보스 참여 등록</td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons">cancel</span></td>
              </tr>
              <tr>
                <td>주급 분배</td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons">cancel</span></td>
                <td><span class="material-icons">cancel</span></td>
              </tr>
              <tr>
                <td>관리자 설정</td>
                <td><span class="material-icons check">check_circle</span></td>
                <td><span class="material-icons">cancel</span></td>
                <td><span class="material-icons">cancel</span></td>
                <td><span class="material-icons">cancel</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 시스템 설정 탭
function getAdminSettingsTab() {
  return `
    <div id="settings-tab" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <span class="material-icons">settings</span>
          <span>시스템 설정</span>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h4>일반 설정</h4>
            
            <div class="setting-item">
              <div class="setting-info">
                <label>수수료율</label>
                <p class="setting-description">아이템 판매 시 적용되는 수수료율입니다.</p>
              </div>
              <div class="setting-control">
                <input type="number" id="commissionRate" class="form-input" value="8" min="0" max="100">
                <span>%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <label>자동 백업</label>
                <p class="setting-description">매일 자정에 자동으로 백업을 실행합니다.</p>
              </div>
              <div class="setting-control">
                <label class="switch">
                  <input type="checkbox" id="autoBackup">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <label>보스 출현 알림</label>
                <p class="setting-description">보스 출현 10분 전 알림을 발송합니다.</p>
              </div>
              <div class="setting-control">
                <label class="switch">
                  <input type="checkbox" id="bossNotification" checked>
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>유지보수</h4>
            
            <div class="setting-item">
              <label>데이터 정리</label>
              <button class="btn btn-secondary" onclick="cleanupOldData()">
                90일 이상 데이터 정리
              </button>
            </div>
            
            <div class="setting-item">
              <label>캐시 초기화</label>
              <button class="btn btn-secondary" onclick="clearCache()">
                캐시 지우기
              </button>
            </div>
            
            <div class="setting-item">
              <label>시스템 로그</label>
              <button class="btn btn-secondary" onclick="downloadLogs()">
                로그 다운로드
              </button>
            </div>
          </div>
          
          <div class="settings-actions">
            <button class="btn btn-primary" onclick="saveSystemSettings()">
              <span class="material-icons">save</span>
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 관리자 모달들
function getAdminModals() {
  return `
    <div id="bossModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="bossModalTitle">보스 추가</h3>
          <button class="close-btn" onclick="closeBossModal()">×</button>
        </div>
        <form id="bossForm">
          <input type="hidden" id="bossId">
          
          <div class="form-group">
            <label class="form-label">보스명</label>
            <input type="text" class="form-input" id="bossName" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">보스 레벨</label>
            <input type="number" class="form-input" id="bossLevel" min="1" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">출현 시간</label>
            <div class="time-inputs">
              <div id="timeInputs">
                <input type="time" class="form-input time-input" name="spawnTime">
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addTimeInput()">
                <span class="material-icons">add</span>
                시간 추가
              </button>
            </div>
            <small class="form-hint">여러 시간은 추가 버튼으로 입력하세요</small>
          </div>
          
          <div class="form-group">
            <label class="form-label">상태</label>
            <select class="form-input" id="bossStatus">
              <option value="활성">활성</option>
              <option value="비활성">비활성</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeBossModal()">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
    
    <div id="roleModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="roleModalTitle">권한 할당</h3>
          <button class="close-btn" onclick="closeRoleModal()">×</button>
        </div>
        
        <div class="member-select-list">
          <input type="text" class="search-input" placeholder="회원 검색..." onkeyup="filterRoleMembers(this.value)">
          <div id="roleAssignList" class="member-checkbox-list"></div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeRoleModal()">취소</button>
          <button type="button" class="btn btn-primary" onclick="assignSelectedRole()">권한 부여</button>
        </div>
      </div>
    </div>
  `;
}

// ===== 권한별 회원 조회 함수 - 수정된 버전 =====
function getMembersByRole() {
  console.log('권한별 회원 조회 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      console.log('회원 정보 시트를 찾을 수 없습니다');
      return {
        admin: [],
        subadmin: [],
        moderator: [],
        member: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const roles = {
      admin: [],
      subadmin: [],
      moderator: [],
      member: []
    };
    
    for (let i = 1; i < data.length; i++) {
      // 빈 행이나 비활성 회원 건너뛰기
      if (!data[i][0] || !data[i][1] || data[i][7] !== '활성') {
        continue;
      }
      
      const member = {
        id: data[i][0],
        nickname: data[i][1],
        guild: data[i][2],
        server: data[i][3],
        job: data[i][4]  // 직업 필드 추가
      };
      
      // 권한에 따른 분류 (인덱스 8이 관리자 여부)
      if (data[i][8] === 'Y') {
        roles.admin.push(member);
      } else if (data[i][8] === 'S') {
        roles.subadmin.push(member);
      } else if (data[i][8] === 'M') {
        roles.moderator.push(member);
      } else {
        roles.member.push(member);
      }
    }
    
    console.log('권한별 회원 조회 완료:', roles);
    return roles;
    
  } catch (error) {
    console.error('권한별 회원 조회 오류:', error);
    return {
      admin: [],
      subadmin: [],
      moderator: [],
      member: []
    };
  }
}

// ===== 회원 권한 업데이트 - 수정된 버전 =====
function updateMemberPermission(memberId, permissionLevel) {
  console.log('회원 권한 업데이트:', memberId, permissionLevel);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === memberId) {
        let adminStatus = 'N';
        if (permissionLevel === 1) adminStatus = 'Y';       // 관리자
        else if (permissionLevel === 2) adminStatus = 'S';  // 부관리자
        else if (permissionLevel === 3) adminStatus = 'M';  // 운영진
        
        // 인덱스 8이 관리자 여부 필드
        sheet.getRange(i + 1, 9).setValue(adminStatus);
        
        console.log('권한 변경 완료:', memberId, adminStatus);
        return { success: true, message: '권한이 변경되었습니다.' };
      }
    }
    
    return { success: false, message: '회원을 찾을 수 없습니다.' };
    
  } catch (error) {
    console.error('회원 권한 업데이트 오류:', error);
    return { success: false, message: '권한 변경 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 일괄 작업 함수 - 수정된 버전 =====
function executeBulkMemberAction(memberIds, action) {
  console.log('일괄 작업 실행:', memberIds, action);
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    let successCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (memberIds.includes(data[i][0])) {
        switch(action) {
          case 'activate':
            // 인덱스 7이 상태 필드
            sheet.getRange(i + 1, 8).setValue('활성');
            successCount++;
            break;
          case 'deactivate':
            sheet.getRange(i + 1, 8).setValue('비활성');
            successCount++;
            break;
          case 'delete':
            sheet.getRange(i + 1, 8).setValue('삭제');
            successCount++;
            break;
        }
      }
    }
    
    console.log('일괄 작업 완료:', successCount);
    return { 
      success: true, 
      message: successCount + '명의 회원에 대해 작업이 완료되었습니다.' 
    };
    
  } catch (error) {
    console.error('일괄 작업 오류:', error);
    return { success: false, message: '일괄 작업 중 오류가 발생했습니다: ' + error.message };
  }
}

// ===== 회원의 마지막 활동 날짜 조회 =====
function getLastActivityDate(nickname) {
  try {
    const sheet = getSheet(SHEET_NAMES.BOSS_RECORDS);
    if (!sheet) {
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    let lastDate = null;
    
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][3] === nickname) {
        lastDate = new Date(data[i][1]);
        break;
      }
    }
    
    return lastDate;
    
  } catch (error) {
    console.error('마지막 활동 날짜 조회 오류:', error);
    return null;
  }
}

// ===== 비활성 회원 처리 함수 - 수정된 버전 =====
function batchUpdateMemberStatus() {
  console.log('비활성 회원 처리 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.MEMBERS);
    if (!sheet) {
      return { success: false, message: '회원 정보 시트를 찾을 수 없습니다.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    let updatedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0] || !data[i][1]) continue;
      
      const lastActivity = getLastActivityDate(data[i][1]);
      
      if (lastActivity && lastActivity < thirtyDaysAgo && data[i][7] === '활성') {
        // 인덱스 7이 상태 필드
        sheet.getRange(i + 1, 8).setValue('비활성');
        updatedCount++;
      }
    }
    
    console.log('비활성 회원 처리 완료:', updatedCount);
    return { 
      success: true, 
      message: updatedCount + '명의 회원이 비활성 상태로 변경되었습니다.' 
    };
    
  } catch (error) {
    console.error('비활성 회원 처리 오류:', error);
    return { success: false, message: '비활성 회원 처리 중 오류가 발생했습니다: ' + error.message };
  }
}
