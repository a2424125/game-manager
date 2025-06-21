// ===== 관리자 페이지 HTML 생성 함수 =====

// 관리자 메인 페이지
function getAdminPageHTML() {
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
            <button class="quick-action-btn" onclick="setupCompleteTestEnvironment()">
              <span class="material-icons">psychology</span>
              <span>테스트 환경 설정</span>
            </button>
            <button class="quick-action-btn" onclick="validateMemberData()">
              <span class="material-icons">search</span>
              <span>시스템 진단</span>
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
            <label for="adminMemberSearchInput" class="sr-only">회원 검색</label>
            <input type="text" class="search-input" id="adminMemberSearchInput" placeholder="회원 검색..." onkeyup="searchAdminMembers(this.value)">
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
                  <label for="selectAllMembers" class="sr-only">모든 회원 선택</label>
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
          <label for="bulkAction" class="sr-only">일괄 작업 선택</label>
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
                <label for="commissionRate">수수료율</label>
                <p class="setting-description">아이템 판매 시 적용되는 수수료율입니다.</p>
              </div>
              <div class="setting-control">
                <input type="number" id="commissionRate" class="form-input" value="8" min="0" max="100">
                <span>%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <label for="autoBackup">자동 백업</label>
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
                <label for="bossNotification">보스 출현 알림</label>
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
            <h4>시스템 관리</h4>
            
            <div class="setting-item">
              <div class="setting-info">
                <span>회원 데이터 검증</span>
                <p class="setting-description">회원 데이터의 무결성을 검증합니다.</p>
              </div>
              <div class="setting-control">
                <button class="btn btn-secondary" onclick="validateMemberData()">
                  데이터 검증 실행
                </button>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <span>캐시 초기화</span>
                <p class="setting-description">시스템 캐시를 초기화합니다.</p>
              </div>
              <div class="setting-control">
                <button class="btn btn-secondary" onclick="clearCache()">
                  캐시 지우기
                </button>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <span>테스트 환경 설정</span>
                <p class="setting-description">완전한 테스트 환경을 구성합니다.</p>
              </div>
              <div class="setting-control">
                <button class="btn btn-secondary" onclick="setupCompleteTestEnvironment()">
                  완전한 테스트 환경 구성
                </button>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <span>시스템 로그</span>
                <p class="setting-description">시스템 로그를 다운로드합니다.</p>
              </div>
              <div class="setting-control">
                <button class="btn btn-secondary" onclick="downloadLogs()">
                  로그 다운로드
                </button>
              </div>
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
            <label class="form-label" for="bossNameModalInput">보스명</label>
            <input type="text" class="form-input" id="bossNameModalInput" required>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bossLevelInput">보스 레벨</label>
            <input type="number" class="form-input" id="bossLevelInput" min="1" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">출현 시간</label>
            <div class="time-inputs">
              <div id="timeInputs">
                <label for="spawnTime1" class="sr-only">출현 시간 1</label>
                <input type="time" class="form-input time-input" id="spawnTime1" name="spawnTime">
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addTimeInput()">
                <span class="material-icons">add</span>
                시간 추가
              </button>
            </div>
            <small class="form-hint">여러 시간은 추가 버튼으로 입력하세요</small>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bossStatusSelect">상태</label>
            <select class="form-input" id="bossStatusSelect">
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
          <label for="roleSearchInput" class="sr-only">회원 검색</label>
          <input type="text" class="search-input" id="roleSearchInput" placeholder="회원 검색..." onkeyup="filterRoleMembers(this.value)">
          <div id="roleAssignList" class="member-checkbox-list"></div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeRoleModal()">취소</button>
          <button type="button" class="btn btn-primary" onclick="assignSelectedRole()">권한 부여</button>
        </div>
      </div>
    </div>
    
    <style>
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .admin-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 24px;
        border-bottom: 1px solid var(--border-color);
        background: white;
        border-radius: 12px 12px 0 0;
        padding: 0 20px;
      }
      
      .tab-btn {
        background: none;
        border: none;
        padding: 16px 20px;
        font-size: 14px;
        font-weight: 500;
        color: var(--light-text);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .tab-btn:hover {
        color: var(--primary-color);
      }
      
      .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }
      
      .tab-content {
        display: none;
      }
      
      .tab-content.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      
      .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .admin-stat-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: var(--shadow);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
      }
      
      .admin-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-hover);
      }
      
      .stat-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      
      .stat-icon-wrapper.blue { background: #3B82F6; }
      .stat-icon-wrapper.green { background: #10B981; }
      .stat-icon-wrapper.orange { background: #F59E0B; }
      .stat-icon-wrapper.red { background: #EF4444; }
      
      .stat-info h3 {
        font-size: 14px;
        margin-bottom: 4px;
        color: var(--dark-text);
        font-weight: 500;
      }
      
      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: var(--dark-text);
        margin-bottom: 2px;
      }
      
      .stat-change {
        font-size: 11px;
        font-weight: 500;
        color: var(--light-text);
      }
      
      .stat-change.positive {
        color: var(--success-color);
      }
      
      .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        padding: 16px;
      }
      
      .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        color: var(--dark-text);
        font-size: 13px;
      }
      
      .quick-action-btn:hover {
        border-color: var(--primary-color);
        background: #EBF8FF;
        transform: translateY(-2px);
      }
      
      .quick-action-btn .material-icons {
        font-size: 24px;
        color: var(--primary-color);
      }
      
      .settings-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .settings-section {
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 24px;
      }
      
      .settings-section:last-child {
        border-bottom: none;
      }
      
      .settings-section h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--dark-text);
        margin-bottom: 16px;
      }
      
      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #F1F5F9;
      }
      
      .setting-item:last-child {
        border-bottom: none;
      }
      
      .setting-info {
        flex: 1;
      }
      
      .setting-info label {
        font-weight: 500;
        color: var(--dark-text);
        margin-bottom: 4px;
        display: block;
      }
      
      .setting-description {
        font-size: 13px;
        color: var(--light-text);
        margin: 0;
      }
      
      .setting-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .settings-actions {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
      }
      
      .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 20px;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .slider {
        background-color: var(--primary-color);
      }
      
      input:checked + .slider:before {
        transform: translateX(20px);
      }
      
      .role-management {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 24px;
      }
      
      .role-section {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        background: #F8FAFC;
      }
      
      .role-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .role-header h4 {
        margin: 0;
        color: var(--dark-text);
      }
      
      .role-count {
        font-size: 12px;
        color: var(--light-text);
        background: white;
        padding: 4px 8px;
        border-radius: 12px;
      }
      
      .role-description {
        font-size: 13px;
        color: var(--light-text);
        margin-bottom: 12px;
      }
      
      .permission-matrix {
        margin-top: 24px;
      }
      
      .permission-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }
      
      .permission-table th,
      .permission-table td {
        padding: 12px;
        text-align: center;
        border: 1px solid var(--border-color);
      }
      
      .permission-table th {
        background: #F8FAFC;
        font-weight: 600;
        color: var(--dark-text);
      }
      
      .permission-table td:first-child {
        text-align: left;
        font-weight: 500;
      }
      
      .permission-table .material-icons.check {
        color: var(--success-color);
      }
      
      .permission-table .material-icons:not(.check) {
        color: var(--danger-color);
      }
      
      .bulk-actions {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 16px;
        border-top: 1px solid var(--border-color);
        background: #F8FAFC;
        border-radius: 0 0 12px 12px;
      }
    </style>
  `;
}

// ===== 수정된 권한별 회원 조회 함수 =====
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
        job: data[i][4]
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

// ===== 회원 권한 업데이트 =====
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

// ===== 일괄 작업 함수 =====
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

// ===== 비활성 회원 처리 함수 =====
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

// ===== 테스트 환경 완전 설정 함수 =====
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
               '🔑 관리자 계정:\n• 닉네임: 관리자\n• 비밀번호: Admin#2025!Safe\n\n' +
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
        ['M0009', '강아르카나', '바람의언덕', '루페온', '아르카나', hashPassword('test123'), new Date(), '활성', 'N']
      ];
      
      // 기존 데이터 확인 후 추가
      const existingData = memberSheet.getDataRange().getValues();
      const existingNicknames = existingData.map(row => row[1]).filter(n => n);
      
      for (let i = 0; i < testMembers.length; i++) {
        if (!existingNicknames.includes(testMembers[i][1])) {
          memberSheet.appendRow(testMembers[i]);
        }
      }
    }
    
    // 2. 테스트 보스 참여 기록 추가
    const bossSheet = ss.getSheetByName(SHEET_NAMES.BOSS_RECORDS);
    if (bossSheet) {
      const testRecords = [];
      const members = ['길드페이드', '아워로드', '박건슬링어', '김버서커', '이소서리스', '최인파이터', '정데빌헌터', '강아르카나'];
      const bosses = ['발탄', '비아키스', '쿠크세이튼', '아브렐슈드', '일리아칸', '카양겔', '상아탑'];
      const items = ['마수의 뼈', '광기의 돌', '파멸의 돌', '질서의 돌', '카오스 돌', '신비한 보석', '영혼의 결정'];
      
      let recordId = bossSheet.getLastRow(); // 기존 데이터 고려
      
      // 최근 2주간의 데이터 생성
      for (let day = 14; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const weekNum = Math.ceil((date.getDate()) / 7);
        
        // 하루에 2-4개의 보스 레이드
        const dailyRaids = Math.floor(Math.random() * 3) + 2;
        
        for (let raid = 0; raid < dailyRaids; raid++) {
          const boss = bosses[Math.floor(Math.random() * bosses.length)];
          const item = items[Math.floor(Math.random() * items.length)];
          const participantCount = Math.floor(Math.random() * 4) + 4; // 4-8명 참여
          
          // 길드페이드와 아워로드는 더 자주 참여하도록 가중치 적용
          const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
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
    
    SpreadsheetApp.flush();
    
    console.log('테스트 데이터 생성 완료');
    return { 
      success: true, 
      message: '테스트 데이터 생성 완료!'
    };
    
  } catch (error) {
    console.error('테스트 데이터 생성 오류:', error);
    return { 
      success: false, 
      message: '테스트 데이터 생성 중 오류가 발생했습니다: ' + error.message 
    };
  }
}
