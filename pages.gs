// ===== 페이지 HTML 생성 함수 =====

// 대시보드 페이지
function getDashboardPageHTML() {
  const data = getDashboardData();
  
  return `
    <div class="page-header">
      <h1 class="page-title">대시보드</h1>
    </div>
    
    <!-- 상단 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card-new">
        <div class="stat-header">
          <span class="stat-title">길드자금 현황</span>
          <span class="stat-badge green">+15% 증가</span>
        </div>
        <div class="stat-value-large">${formatNumber(data.guildBalance)}원</div>
        <div class="stat-icon-bg blue">
          <span class="material-icons">account_balance_wallet</span>
        </div>
      </div>
      
      <div class="stat-card-new">
        <div class="stat-header">
          <span class="stat-title">이번 주 보스 참여</span>
          <span class="stat-badge orange">+8% 증가</span>
        </div>
        <div class="stat-value-large">32회</div>
        <div class="stat-icon-bg yellow">
          <span class="material-icons">emoji_events</span>
        </div>
      </div>
      
      <div class="stat-card-new">
        <div class="stat-header">
          <span class="stat-title">이번 주 판매금액</span>
          <span class="stat-badge red">-5% 감소</span>
        </div>
        <div class="stat-value-large">45,320,000원</div>
        <div class="stat-icon-bg red">
          <span class="material-icons">trending_up</span>
        </div>
      </div>
      
      <div class="stat-card-new">
        <div class="stat-header">
          <span class="stat-title">활성 회원 수</span>
          <span class="stat-badge">총 ${data.totalMembers}명 중</span>
        </div>
        <div class="stat-value-large">${data.activeMembers}명</div>
        <div class="stat-icon-bg purple">
          <span class="material-icons">group</span>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
      <!-- 보스/컨텐츠 목록 -->
      <div class="card dashboard-card">
        <div class="card-header">
          <h3>보스/컨텐츠 목록</h3>
          <button class="btn btn-sm btn-primary" onclick="showPage('boss-record')">
            <span class="material-icons">add</span>
            새 참여 등록
          </button>
        </div>
        <div class="table-responsive">
          <table class="modern-table">
            <thead>
              <tr>
                <th>일자</th>
                <th>보스/컨텐츠</th>
                <th>참여자</th>
                <th>아이템</th>
                <th>판매상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody id="recentBossRecords">
              <tr>
                <td>2025-06-16</td>
                <td>발탄 하드</td>
                <td>
                  <div class="participant-badges">
                    <span class="badge-circle bg-green">김</span>
                    <span class="badge-circle bg-yellow">이</span>
                    <span class="badge-circle bg-blue">박</span>
                    <span class="badge-circle bg-purple">최</span>
                    <span class="badge-more">+8</span>
                  </div>
                </td>
                <td>마수의 뼈 외 3개</td>
                <td><span class="status-badge pending">미판매</span></td>
                <td>
                  <button class="btn-icon"><span class="material-icons">edit</span></button>
                  <button class="btn-icon"><span class="material-icons">visibility</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <button class="btn-text" onclick="showPage('boss-history')">더 보기 →</button>
        </div>
      </div>
      
      <!-- 오른쪽 사이드바 -->
      <div class="dashboard-sidebar">
        <!-- 길드자금 현황 -->
        <div class="card">
          <div class="card-header">
            <h3>길드자금 현황</h3>
          </div>
          <div class="fund-chart">
            <canvas id="fundChart" width="200" height="200"></canvas>
            <div class="chart-center">
              <div class="chart-value">${formatNumber(data.guildBalance)}</div>
              <div class="chart-label">원</div>
            </div>
          </div>
          <div class="fund-details">
            <div class="fund-item">
              <span class="fund-icon down">↓</span>
              <div>
                <div class="fund-label">아이템 판매 수익</div>
                <div class="fund-date">2025-06-15</div>
              </div>
              <div class="fund-amount green">+12,450,000</div>
            </div>
            <div class="fund-item">
              <span class="fund-icon up">↑</span>
              <div>
                <div class="fund-label">주급 분배</div>
                <div class="fund-date">2025-06-14</div>
              </div>
              <div class="fund-amount red">-8,750,000</div>
            </div>
            <div class="fund-item">
              <span class="fund-icon down">↓</span>
              <div>
                <div class="fund-label">아이템 판매 수익</div>
                <div class="fund-date">2025-06-13</div>
              </div>
              <div class="fund-amount green">+5,870,000</div>
            </div>
          </div>
          <button class="btn-text full-width" onclick="showPage('guild-funds')">모든 거래내역 보기</button>
        </div>
        
        <!-- 주간 참여율 TOP 5 -->
        <div class="card">
          <div class="card-header">
            <h3>주간 참여율 TOP 5</h3>
          </div>
          <div class="top-participants">
            <div class="participant-rank">
              <div class="rank-info">
                <span class="rank-badge first">1</span>
                <span class="rank-name">길드페이드</span>
              </div>
              <div class="rank-bar">
                <div class="bar-fill" style="width: 92%"></div>
              </div>
              <span class="rank-percent">92%</span>
            </div>
            <div class="participant-rank">
              <div class="rank-info">
                <span class="rank-badge second">2</span>
                <span class="rank-name">아워로드</span>
              </div>
              <div class="rank-bar">
                <div class="bar-fill" style="width: 85%"></div>
              </div>
              <span class="rank-percent">85%</span>
            </div>
            <div class="participant-rank">
              <div class="rank-info">
                <span class="rank-badge third">3</span>
                <span class="rank-name">박건슬링어</span>
              </div>
              <div class="rank-bar">
                <div class="bar-fill" style="width: 78%"></div>
              </div>
              <span class="rank-percent">78%</span>
            </div>
          </div>
        </div>
        
        <!-- 빠른 메뉴 -->
        <div class="card">
          <div class="card-header">
            <h3>빠른 메뉴</h3>
          </div>
          <div class="quick-menu">
            <button class="quick-btn" onclick="showPage('boss-record')">
              <span class="material-icons">add_circle</span>
              <span>보스참여 등록</span>
            </button>
            <button class="quick-btn" onclick="showPage('item-sales')">
              <span class="material-icons">sell</span>
              <span>아이템 판매</span>
            </button>
            <button class="quick-btn" onclick="showPage('distribution')">
              <span class="material-icons">payments</span>
              <span>주급 분배</span>
            </button>
            <button class="quick-btn" onclick="showPage('statistics')">
              <span class="material-icons">bar_chart</span>
              <span>통계 보기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      setTimeout(function() {
        const canvas = document.getElementById('fundChart');
        if (canvas) {
          drawDoughnutChart(canvas);
        }
      }, 100);
    </script>
  `;
}

// 보스 참여 등록 페이지
function getBossRecordPageHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">보스 참여 등록</h1>
      <p class="page-subtitle">보스 레이드 참여자를 등록하세요</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">sports_esports</span>
        <span>보스 정보 입력</span>
      </div>
      
      <form id="bossRecordForm">
        <div class="form-group">
          <label class="form-label" for="bossNameInput">보스/컨텐츠명</label>
          <input type="text" class="form-input" id="bossNameInput" required 
                 placeholder="예: 발탄 하드, 비아키스 노말">
        </div>
        
        <div class="form-group">
          <label class="form-label" for="participantImageInput">참여자 스크린샷</label>
          <div class="upload-area" onclick="document.getElementById('participantImageInput').click()">
            <input type="file" id="participantImageInput" accept="image/*" style="display: none;" 
                   onchange="handleImageUpload(this)">
            <span class="material-icons upload-icon">cloud_upload</span>
            <div class="upload-text">클릭하여 이미지 업로드</div>
            <div class="upload-subtext">참여자 목록 스크린샷을 업로드하세요</div>
          </div>
        </div>
        
        <div class="form-group" id="extractedParticipants" style="display: none;">
          <label class="form-label">추출된 참여자 목록</label>
          <div class="participant-list" id="participantList"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="additionalParticipantsInput">추가 참여자</label>
          <input type="text" class="form-input" id="additionalParticipantsInput" 
                 placeholder="콤마로 구분하여 입력 (예: 닉네임1, 닉네임2)">
        </div>
        
        <div class="form-group">
          <label class="form-label" for="itemNameInput">획득 아이템</label>
          <input type="text" class="form-input" id="itemNameInput" 
                 placeholder="예: 각인서, 보석, 골드">
        </div>
        
        <div class="form-group">
          <label class="form-label" for="itemCountInput">아이템 개수</label>
          <input type="number" class="form-input" id="itemCountInput" min="0" value="0">
        </div>
        
        <div class="participant-summary">
          <span>총 참여자: </span>
          <span id="totalParticipants" class="badge">0명</span>
        </div>
        
        <button type="submit" class="btn btn-primary">
          <span class="material-icons">save</span>
          <span>저장하기</span>
        </button>
      </form>
    </div>
  `;
}

// ===== 수정된 길드원 목록 페이지 =====
function getMembersPageHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">길드원 목록</h1>
      <p class="page-subtitle">전체 길드원 현황 및 참여 통계</p>
    </div>
    
    <!-- 상단 통계 요약 -->
    <div class="members-stats">
      <div class="member-stat-card">
        <span class="stat-icon"><span class="material-icons">people</span></span>
        <div>
          <div class="stat-number" id="totalMembersCount">로딩중...</div>
          <div class="stat-label">전체 길드원</div>
        </div>
      </div>
      <div class="member-stat-card active">
        <span class="stat-icon"><span class="material-icons">check_circle</span></span>
        <div>
          <div class="stat-number" id="activeMembersCount">로딩중...</div>
          <div class="stat-label">활성 길드원</div>
        </div>
      </div>
      <div class="member-stat-card inactive">
        <span class="stat-icon"><span class="material-icons">cancel</span></span>
        <div>
          <div class="stat-number" id="inactiveMembersCount">로딩중...</div>
          <div class="stat-label">비활성 길드원</div>
        </div>
      </div>
      <div class="member-stat-card participation">
        <span class="stat-icon"><span class="material-icons">sports_esports</span></span>
        <div>
          <div class="stat-number" id="totalParticipationCount">로딩중...</div>
          <div class="stat-label">총 보스 참여</div>
        </div>
      </div>
    </div>
    
    <!-- 검색 및 필터 -->
    <div class="card">
      <div class="card-header">
        <h3>길드원 검색 및 필터</h3>
      </div>
      <div class="members-filter-section">
        <div class="filter-group">
          <label for="memberSearchInput">닉네임 검색</label>
          <input type="text" class="search-input" id="memberSearchInput" placeholder="닉네임을 입력하세요..." onkeyup="searchMembers(this.value)">
        </div>
        <div class="filter-group">
          <label for="statusFilterSelect">상태 필터</label>
          <select class="filter-select" id="statusFilterSelect" onchange="filterMembers(this.value)">
            <option value="all">전체</option>
            <option value="활성">활성</option>
            <option value="비활성">비활성</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="jobFilterSelect">직업 필터</label>
          <select class="filter-select" id="jobFilterSelect" onchange="filterMembersByJob(this.value)">
            <option value="all">모든 직업</option>
            <option value="버서커">버서커</option>
            <option value="바드">바드</option>
            <option value="건슬링어">건슬링어</option>
            <option value="소서리스">소서리스</option>
            <option value="워로드">워로드</option>
            <option value="인파이터">인파이터</option>
            <option value="데빌헌터">데빌헌터</option>
            <option value="아르카나">아르카나</option>
            <option value="블레이드">블레이드</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="sortFilterSelect">정렬 기준</label>
          <select class="filter-select" id="sortFilterSelect" onchange="sortMembers(this.value)">
            <option value="participation">참여횟수 순</option>
            <option value="name">닉네임 순</option>
            <option value="joinDate">가입일 순</option>
            <option value="lastActivity">최근 활동 순</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 길드원 목록 테이블 -->
    <div class="card">
      <div class="card-header">
        <h3>길드원 목록</h3>
        <div class="header-actions">
          <button class="btn btn-sm btn-secondary" onclick="forceRefreshMembersData()">
            <span class="material-icons">refresh</span>
            새로고침
          </button>
          <button class="btn btn-sm btn-primary" onclick="exportMembersList()">
            <span class="material-icons">download</span>
            목록 내보내기
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table class="modern-table" id="membersTable">
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>길드명</th>
              <th>서버</th>
              <th>직업</th>
              <th>가입일</th>
              <th>상태</th>
              <th>총 참여횟수</th>
              <th>참여율</th>
              <th>최근 참여</th>
              <th>권한</th>
            </tr>
          </thead>
          <tbody id="membersTableBody">
            <tr>
              <td colspan="11" style="text-align: center; padding: 40px; color: #00BCD4;">
                <div class="loading-members">
                  <span class="material-icons" style="font-size: 48px; margin-bottom: 16px; animation: spin 2s linear infinite;">refresh</span>
                  <p><strong>길드원 정보를 불러오는 중...</strong></p>
                  <p style="font-size: 14px; color: #999; margin-top: 8px;">잠시만 기다려주세요</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 참여율 통계 차트 -->
    <div class="card">
      <div class="card-header">
        <h3>참여율 분포</h3>
      </div>
      <div class="participation-chart">
        <canvas id="participationChart" width="400" height="200"></canvas>
      </div>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-members {
        animation: fadeIn 0.5s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
}

// 보스참여 히스토리 페이지
function getBossHistoryPageHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">보스참여 히스토리</h1>
      <p class="page-subtitle">보스별 참여율 및 참여자 통계</p>
    </div>
    
    <div class="filter-bar">
      <div class="filter-group">
        <label for="periodFilterSelect">기간</label>
        <select id="periodFilterSelect" class="filter-select" onchange="filterBossHistory()">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="all">전체</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="bossFilterSelect">보스명</label>
        <select id="bossFilterSelect" class="filter-select" onchange="filterBossHistory()">
          <option value="all">전체</option>
          <option value="발탄">발탄</option>
          <option value="비아키스">비아키스</option>
          <option value="쿠크세이튼">쿠크세이튼</option>
          <option value="아브렐슈드">아브렐슈드</option>
          <option value="일리아칸">일리아칸</option>
          <option value="카양겔">카양겔</option>
          <option value="상아탑">상아탑</option>
        </select>
      </div>
      <div class="export-buttons">
        <button class="btn btn-sm btn-secondary" onclick="exportBossHistory()">
          <span class="material-icons">download</span>
          내보내기
        </button>
      </div>
    </div>
    
    <div class="boss-stats-grid">
      <div class="card">
        <div class="card-header">
          <span class="material-icons">leaderboard</span>
          <span>보스별 참여 통계</span>
        </div>
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>보스명</th>
                <th>총 레이드 횟수</th>
                <th>평균 참여 인원</th>
                <th>최다 참여자</th>
                <th>총 아이템 획득</th>
              </tr>
            </thead>
            <tbody id="bossStatsTable">
              <!-- 보스별 통계가 여기에 표시됩니다 -->
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="material-icons">people</span>
          <span>길드원 참여율 순위</span>
        </div>
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>닉네임</th>
                <th>직업</th>
                <th>참여 횟수</th>
                <th>참여율</th>
                <th>최근 참여</th>
              </tr>
            </thead>
            <tbody id="participationRankingTable">
              <!-- 참여율 순위가 여기에 표시됩니다 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">history</span>
        <span>최근 보스 레이드 기록</span>
      </div>
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>보스/컨텐츠</th>
              <th>참여자</th>
              <th>아이템</th>
              <th>판매상태</th>
              <th>판매금액</th>
            </tr>
          </thead>
          <tbody id="recentBossHistory">
            <!-- 최근 기록이 여기에 표시됩니다 -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 아이템 판매/분배 페이지
function getItemSalesPageHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">아이템 판매/분배</h1>
      <p class="page-subtitle">획득한 아이템을 판매하고 분배하세요</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">inventory_2</span>
        <span>미판매 아이템 목록</span>
      </div>
      
      <div class="table-container">
        <table id="unsoldItemsTable">
          <thead>
            <tr>
              <th>날짜</th>
              <th>보스명</th>
              <th>아이템</th>
              <th>수량</th>
              <th>획득자</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
    
    <div id="sellModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>아이템 판매</h3>
          <button class="close-btn" onclick="closeSellModal()">×</button>
        </div>
        <form id="sellForm">
          <input type="hidden" id="sellRecordId">
          
          <div class="form-group">
            <label class="form-label" for="salePriceInput">판매 금액</label>
            <input type="number" class="form-input" id="salePriceInput" min="0" required>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="buyerNicknameInput">구매자 닉네임</label>
            <input type="text" class="form-input" id="buyerNicknameInput">
          </div>
          
          <div class="commission-info">
            <div class="info-row">
              <span>판매 금액:</span>
              <span id="displayPrice">0원</span>
            </div>
            <div class="info-row">
              <span>수수료 (8%):</span>
              <span id="displayCommission">0원</span>
            </div>
            <div class="info-row total">
              <span>실수령액:</span>
              <span id="displayNet">0원</span>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary">판매 완료</button>
        </form>
      </div>
    </div>
  `;
}

// 길드 자금 관리 페이지
function getGuildFundsPageHTML() {
  const balance = getGuildBalance();
  
  return `
    <div class="page-header">
      <h1 class="page-title">길드 자금 관리</h1>
      <p class="page-subtitle">길드 자금을 관리하고 거래내역을 확인하세요</p>
    </div>
    
    <div class="fund-balance-card">
      <div class="balance-icon">
        <span class="material-icons">account_balance</span>
      </div>
      <div class="balance-content">
        <div class="balance-label">현재 길드 자금</div>
        <div class="balance-amount">${formatNumber(balance)}원</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">add_circle</span>
        <span>자금 입/출금</span>
      </div>
      
      <form id="fundTransactionForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="transactionTypeSelect">구분</label>
            <select class="form-input" id="transactionTypeSelect" required>
              <option value="입금">입금</option>
              <option value="출금">출금</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="transactionAmountInput">금액</label>
            <input type="number" class="form-input" id="transactionAmountInput" min="0" required>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="transactionDescriptionInput">내역</label>
          <input type="text" class="form-input" id="transactionDescriptionInput" required
                 placeholder="예: 길드 이벤트 상금, 운영비 지출">
        </div>
        
        <button type="submit" class="btn btn-primary">등록하기</button>
      </form>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">history</span>
        <span>거래 내역</span>
      </div>
      
      <div class="table-container">
        <table id="transactionHistory">
          <thead>
            <tr>
              <th>날짜</th>
              <th>구분</th>
              <th>금액</th>
              <th>내역</th>
              <th>잔액</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;
}

// 주급 분배 페이지
function getDistributionPageHTML() {
  const currentWeek = Utilities.formatDate(new Date(), 'GMT+9', 'w');
  
  return `
    <div class="page-header">
      <h1 class="page-title">주급 분배</h1>
      <p class="page-subtitle">참여율에 따라 주급을 분배하세요</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">paid</span>
        <span>분배 설정</span>
      </div>
      
      <form id="distributionForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="targetWeekSelect">대상 주차</label>
            <select class="form-input" id="targetWeekSelect">
              <option value="${currentWeek}">${currentWeek}주차 (이번주)</option>
              <option value="${currentWeek - 1}">${currentWeek - 1}주차 (지난주)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="distributionAmountInput">분배 총액</label>
            <input type="number" class="form-input" id="distributionAmountInput" min="0" required placeholder="분배할 총 금액을 입력하세요">
          </div>
        </div>
        
        <button type="button" class="btn btn-secondary" onclick="previewDistribution()">
          <span class="material-icons">preview</span>
          <span>분배 미리보기</span>
        </button>
      </form>
    </div>
    
    <div class="card" id="distributionPreview" style="display: none;">
      <div class="card-header">
        <span class="material-icons">visibility</span>
        <span>분배 시뮬레이션</span>
      </div>
      
      <div class="table-container">
        <table id="previewTable">
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>참여횟수</th>
              <th>참여율</th>
              <th>기본분배금</th>
              <th>총 분배금</th>
            </tr>
          </thead>
          <tbody>
            <!-- 분배 미리보기가 여기에 표시됩니다 -->
          </tbody>
        </table>
      </div>
      
      <div class="distribution-actions">
        <button class="btn btn-primary" onclick="executeDistribution()">
          <span class="material-icons">check_circle</span>
          <span>분배 실행</span>
        </button>
      </div>
    </div>
  `;
}

// ===== 통계/보고서 페이지 =====
function getStatisticsPageHTML() {
  return `
    <div class="page-header">
      <h1 class="page-title">통계/보고서</h1>
      <p class="page-subtitle">길드 활동 통계를 확인하세요</p>
    </div>
    
    <div class="stat-filters">
      <div class="filter-group">
        <label for="statPeriodSelect">기간 선택</label>
        <select class="form-input" id="statPeriodSelect" onchange="loadStatisticsData()">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="all">전체</option>
        </select>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">leaderboard</span>
        <span>참여율 순위</span>
      </div>
      
      <div class="table-container">
        <table id="participationRanking">
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>직업</th>
              <th>참여횟수</th>
              <th>참여율</th>
              <th>획득아이템</th>
            </tr>
          </thead>
          <tbody id="participationRankingBody">
            <tr><td colspan="6" style="text-align: center; color: #999;">데이터를 불러오는 중...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <span class="material-icons">analytics</span>
        <span>보스별 통계</span>
      </div>
      
      <div id="bossStatistics">
        <p style="text-align: center; color: #999; padding: 40px;">통계 데이터를 불러오는 중...</p>
      </div>
    </div>
  `;
}

// ===== 숫자 포맷 함수 =====
function formatNumber(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return new Intl.NumberFormat('ko-KR').format(num);
}
