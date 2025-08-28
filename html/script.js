// 全局变量
const defaultUser = 'lan';
let currentDate = new Date();
let currentUser = localStorage.getItem('selectedUser') || defaultUser;

// 默认配置
const defaultConfig = {
  theme: 'light',
  calendarDisplayMode: 'claimable'
};

let currentTheme = defaultConfig.theme;
let calendarDisplayMode = defaultConfig.calendarDisplayMode;

// 数据存储
let mockData = { users: [], data: {} };

// 立即导出全局变量供API使用
window.currentUser = currentUser;
window.currentTheme = currentTheme;
window.calendarDisplayMode = calendarDisplayMode;
window.mockData = mockData;

// 初始化应用
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
});

async function initializeApp() {
  // 显示加载状态
  showLoadingState();

  try {
    // 从API获取数据
    mockData = await API.fetchDataFromAPI();
  } catch (error) {
    console.error('数据加载失败:', error);
  }

  // 检查当前用户是否在API数据中存在，如果不存在则使用第一个可用用户
  const availableUsers = Object.keys(mockData.data || {});
  if (availableUsers.length > 0 && !availableUsers.includes(currentUser)) {
    currentUser = availableUsers[0];
    localStorage.setItem('selectedUser', currentUser);
  }

  // 应用用户配置
  applyUserConfig();

  // 更新全局变量
  window.currentUser = currentUser;
  window.currentTheme = currentTheme;
  window.calendarDisplayMode = calendarDisplayMode;
  window.mockData = mockData;

  // 设置主题
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  updateCalendarDisplayIcon();

  // 更新用户显示和配置可见性
  updateUserDisplay();
  updateConfigVisibility();

  // 更新悬浮模拟图标显示状态
  updateSimulationIconVisibility();

  // 渲染日历
  renderCalendar();

  // 更新统计数据
  updateStats();

  // 更新每日摘要
  updateDailySummary();

  // 绑定事件监听器
  bindEventListeners();

  // 初始化箭头状态
  updateArrowStates();

  // 隐藏加载状态
  hideLoadingState();
}

// 显示加载状态
function showLoadingState() {
  const body = document.body;
  if (!body.querySelector('.loading-overlay')) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载数据中...</p>
      </div>
    `;
    body.appendChild(loadingOverlay);
  }
}

// 隐藏加载状态
function hideLoadingState() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

// 界面更新回调函数
function updateUI() {
  renderCalendar();
  updateStats();
  updateDailySummary();
}

// 绑定事件监听器
function bindEventListeners() {
  // 点击外部关闭用户菜单
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.user-profile')) {
      const userMenu = document.getElementById('userMenu');
      if (userMenu) {
        userMenu.classList.remove('show');
      }
    }
  });

  // 点击外部关闭弹出框
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
      Modal.closeAddRecordModal();
    }
  });

  // ESC键关闭弹出框
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      Modal.closeAddRecordModal();
    }
  });
}

// 更新日历显示图标
function updateCalendarDisplayIcon() {
  const icon = document.querySelector('.calendar-display-icon');
  if (icon) {
    icon.textContent = window.calendarDisplayMode === 'claimable' ? '📊' : '🎯';
  }
}

// 更新主题图标
function updateThemeIcon() {
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = window.currentTheme === 'light' ? '☀️' : '🌙';
  }
}

// 用户菜单
function toggleUserMenu() {
  const userMenu = document.getElementById('userMenu');
  const availableUsers = Object.keys(mockData.data || {});

  // 只有当用户数量大于1时才允许切换菜单
  if (userMenu && availableUsers.length > 1) {
    userMenu.classList.toggle('show');
  }
}

// 切换用户
function selectUser(userId) {
  currentUser = userId;
  localStorage.setItem('selectedUser', userId);

  // 应用新用户的配置
  applyUserConfig();

  // 更新UI
  updateUserDisplay();
  toggleUserMenu();

  // 更新全局变量
  window.currentUser = currentUser;
  window.currentTheme = currentTheme;
  window.calendarDisplayMode = calendarDisplayMode;
  window.mockData = mockData;

  // 应用主题和日历显示模式
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  updateCalendarDisplayIcon();

  renderCalendar();
  updateStats();
  updateDailySummary();
}

// 更新用户显示
function updateUserDisplay() {
  const profileBtn = document.querySelector('.profile-btn');
  const userMenu = document.getElementById('userMenu');

  if (profileBtn) {
    // 从 mockData 中动态获取用户名称
    const availableUsers = Object.keys(mockData.data || {});
    const displayName = availableUsers.includes(currentUser) ? currentUser : defaultUser;

    // 默认不显示下拉箭头，只有多条数据时才显示
    const showDropdown = availableUsers.length > 1;

    profileBtn.innerHTML = `
      <span class="profile-icon">👤</span>
      <span>${displayName}</span>
      ${showDropdown ? '<span class="dropdown-arrow">▼</span>' : ''}
    `;

    // 根据用户数量决定是否启用点击功能
    if (showDropdown) {
      profileBtn.onclick = toggleUserMenu;
      profileBtn.style.cursor = 'pointer';
    } else {
      profileBtn.onclick = null;
      profileBtn.style.cursor = 'default';
    }
  }

  // 动态生成用户菜单
  if (userMenu) {
    const availableUsers = Object.keys(mockData.data || {});
    if (availableUsers.length > 1) {
      userMenu.innerHTML = availableUsers.map(userId =>
        `<div class="menu-item" onclick="selectUser('${userId}')">${userId}</div>`
      ).join('');
    } else {
      userMenu.innerHTML = '';
    }
  }

  // 更新配置开关显示状态
  updateConfigVisibility();

  // 更新悬浮模拟图标显示状态
  updateSimulationIconVisibility();
}

// 更新悬浮模拟图标显示状态
function updateSimulationIconVisibility() {
  const simulationIcon = document.getElementById('simulationIcon');
  if (simulationIcon) {
    const userData = mockData.data?.[currentUser];
    // 必须同时满足两个条件：模拟功能开启 且 日历显示模式为score
    if (userData &&
      userData.config &&
      userData.config.showSimulationScore === true &&
      window.calendarDisplayMode === 'score') {
      simulationIcon.style.display = 'flex';
    } else {
      simulationIcon.style.display = 'none';
    }
  }
}

// 应用用户配置
function applyUserConfig() {
  const userData = mockData.data?.[currentUser];

  if (!userData || !userData.config) {
    return;
  }

  const config = userData.config;

  // 合并用户配置和默认配置
  const mergedConfig = { ...defaultConfig, ...config };

  // 应用合并后的配置
  currentTheme = mergedConfig.theme;
  calendarDisplayMode = mergedConfig.calendarDisplayMode;

  // 更新图标显示
  updateThemeIcon();
  updateCalendarDisplayIcon();
}

// 更新配置开关的显示状态
function updateConfigVisibility() {
  const userData = mockData.data?.[currentUser];
  if (!userData || !userData.config) return;

  const config = userData.config;

  // 主题切换按钮
  const themeBtn = document.querySelector('.icon-btn[onclick="API.toggleTheme()"]');
  if (themeBtn) {
    themeBtn.style.display = config.showThemeIcon === true ? 'block' : 'none';
  }

  // 日历显示切换按钮
  const calendarDisplayBtn = document.querySelector('.icon-btn[onclick="API.toggleCalendarDisplay()"]');
  if (calendarDisplayBtn) {
    calendarDisplayBtn.style.display = config.showCalendarDisplayModeIcon === true ? 'block' : 'none';
  }

  // 导入导出按钮
  const importExportBtn = document.querySelector('.icon-btn[onclick="Modal.openImportExportModal()"]');
  if (importExportBtn) {
    importExportBtn.style.display = config.showImportExportIcon === true ? 'block' : 'none';
  }

  // 快捷配置按钮
  const fastConfigBtn = document.querySelector('.icon-btn[onclick="Config.openConfigModal()"]');
  if (fastConfigBtn) {
    fastConfigBtn.style.display = config.showFastConfig === true ? 'block' : 'none';
  }
}

// 检查是否有下个月的数据
function hasNextMonthData() {
  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  const year = nextMonthDate.getFullYear();
  const month = nextMonthDate.getMonth();

  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  const dateData = userData.date || [];

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  return dateData.some(item => item.date?.startsWith(monthStr));
}

// 日历导航
function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateDailySummary();
}

function nextMonth() {
  // 允许查看未来月份，不限制当前时间
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateDailySummary();
}

// 更新箭头状态
function updateArrowStates() {
  const nextArrow = document.querySelector('.nav-arrow:last-child');

  if (nextArrow) {
    // 允许查看未来月份，不禁用右箭头
    nextArrow.classList.remove('disabled');
    nextArrow.style.cursor = 'pointer';
  }
}

// 渲染日历
function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const monthYear = document.getElementById('monthYear');

  if (!calendarGrid || !monthYear) return;

  // 更新月份年份显示
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = `${year}年${month + 1}月`;

  // 更新箭头状态
  updateArrowStates();

  // 清空日历网格
  calendarGrid.innerHTML = '';

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 获取当月第一天是星期几（0是星期日）
  const firstDayWeekday = firstDay.getDay();

  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0);
  const prevMonthDays = firstDayWeekday;

  // 获取当前用户的数据
  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  const dateData = userData.date || [];

  // 创建数据映射
  const dataMap = {};

  // 处理新的数据结构
  dateData.forEach(item => {
    dataMap[item.date] = { ...item };
  });

  // 渲染上个月的日期
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i;
    const dayElement = createDayElement(day, 'other-month');
    calendarGrid.appendChild(dayElement);
  }

  // 渲染当月的日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = dataMap[dateStr];

    let className = '';

    // 检查是否是今天的日期
    const today = new Date();
    const isToday = today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    // 检查是否有数据
    const hasEarnings = dayData && dayData.coin && dayData.coin.trim() !== '';
    const hasFees = dayData && dayData.fee > 0;

    if (hasEarnings) {
      className += ' has-data';
    }
    if (hasFees) {
      className += ' has-fee';
    }
    if (isToday) {
      className += ' today';
    }

    const dayElement = createDayElement(day, className, dateStr);
    calendarGrid.appendChild(dayElement);
  }

  // 渲染下个月的日期（智能填充）
  const totalDays = prevMonthDays + lastDay.getDate();

  // 计算需要多少行来显示所有日期
  const totalRows = Math.ceil(totalDays / 7);

  // 智能填充：确保最后一行被填满，但避免多余的整行
  let targetCells = 42;
  if (totalRows <= 5) {
    // 如果5行足够，填充到35个格子（5行×7列）
    targetCells = 35;
  }
  const nextMonthDays = targetCells - totalDays;

  for (let day = 1; day <= nextMonthDays; day++) {
    const dayElement = createDayElement(day, 'other-month');
    calendarGrid.appendChild(dayElement);
  }
}

// 检查是否应该显示新建按钮
function shouldShowNewButton(dateStr) {
  try {
    // 检查快捷新建记录是否开启
    if (window.mockData && window.mockData.data && window.currentUser) {
      const userData = window.mockData.data[window.currentUser];
      if (userData && userData.config && userData.config.fastConfig) {
        const fastConfig = userData.config.fastConfig;
        if (fastConfig.fastAddRecord !== true) {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }

    // 检查该日期是否有记录
    const userData = window.mockData.data?.[currentUser] || window.mockData.data?.[defaultUser];
    const dateData = userData.date || [];
    const hasRecord = dateData.some(item => item.date === dateStr);

    // 只在没有记录的日期上显示新建按钮
    return !hasRecord;
  } catch (error) {
    console.error('检查是否显示新建按钮时出错:', error);
    return false;
  }
}

// 根据快捷配置创建记录
async function createRecordFromFastConfig(dateStr) {
  try {
    // 获取快捷配置
    const userData = window.mockData.data?.[currentUser] || window.mockData.data?.[defaultUser];
    if (!userData || !userData.config || !userData.config.fastConfig) {
      console.error('❌ 未找到快捷配置');
      return;
    }

    const fastConfig = userData.config.fastConfig;

    // 检查是否有有效的配置数据
    const hasValidData = (fastConfig.fee && parseFloat(fastConfig.fee) > 0) ||
      (fastConfig.todayScore && parseInt(fastConfig.todayScore) > 0);

    if (!hasValidData) {
      window.Toast?.warning('快捷配置中没有有效数据，跳过创建');
      return;
    }

    // 创建记录数据
    const newRecord = {
      date: dateStr,
      coin: '', // 默认空投名称
      amount: 0, // 默认收入为0
      fee: parseFloat(fastConfig.fee) || 0,
      curScore: 0, // 当前积分默认为0
      todayScore: parseInt(fastConfig.todayScore) || 0,
      ConsumptionScore: 0, // 消耗积分默认为0
      remark: '通过快捷配置自动创建'
    };

    // 添加到用户数据
    if (!userData.date) {
      userData.date = [];
    }
    userData.date.push(newRecord);

    // 更新全局数据
    window.mockData.data[currentUser] = userData;

    // 保存到API
    if (window.API && window.API.updateDataInAPI) {
      const success = await window.API.updateDataInAPI(window.mockData);
      if (success) {
        // 刷新UI
        if (window.updateUI) {
          window.updateUI();
        }

        // 重新渲染日历
        if (window.renderCalendar) {
          window.renderCalendar();
        }

        // 显示成功提示
        window.Toast?.success('快捷记录创建成功！');
      } else {
        window.Toast?.error('创建失败，请重试');
      }
    }
  } catch (error) {
    window.Toast?.error('创建失败，请重试');
  }
}

// 创建新建按钮
function createNewButton(dateStr) {
  const newButton = document.createElement('button');
  newButton.className = 'new-record-btn';
  newButton.innerHTML = '<span>+</span>';
  newButton.title = '快捷新建记录';

  // 添加点击事件
  newButton.addEventListener('click', function (e) {
    e.stopPropagation(); // 阻止事件冒泡，避免触发日期点击事件
    createRecordFromFastConfig(dateStr);
  });

  return newButton;
}

// 创建日期元素
function createDayElement(day, className = '', dateStr = null) {
  const dayElement = document.createElement('div');
  dayElement.className = `calendar-day ${className}`;

  // 添加点击事件
  dayElement.addEventListener('click', function () {
    if (!className.includes('other-month')) {
      // 如果该日期显示新建按钮，则不弹出新建框
      if (!shouldShowNewButton(dateStr)) {
        Modal.openAddRecordModal(dateStr, day, currentUser, mockData, { onSuccess: updateUI });
      }
    }
  });

  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = day;
  dayElement.appendChild(dayNumber);

  // 如果是其他月份的日期，不显示数据
  if (className.includes('other-month')) {
    return dayElement;
  }

  // 获取当前用户的数据
  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  const dateData = userData.date || [];

  // 如果没有传递日期字符串，则构建一个（用于其他月份的日期）
  if (!dateStr) {
    dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // 获取当天的所有数据
  const dayDataList = dateData.filter(item => item.date === dateStr);

  // 检查是否有抢到币的数据，如果有则添加has-data样式
  const hasData = dayDataList.some(item => (item.coin && item.coin.trim() !== ''));
  if (hasData) {
    dayElement.classList.add('has-data');
  }

  // 检查是否有手续费，如果有则添加has-fee样式
  const hasFee = dayDataList.some(item => item.fee);
  if (hasFee) {
    dayElement.classList.add('has-fee');
  }

  // 检查是否是已领取时间+15天后的日期
  const isClaimableDate = checkIfClaimableDate(dateStr, dateData);

  // 创建数据容器
  const dataContainer = document.createElement('div');
  dataContainer.className = 'day-data-container';

  // 显示所有收益数据
  dayDataList.forEach(dayData => {
    if (dayData.coin && dayData.coin.trim() !== '') {
      const earningsDataEl = document.createElement('div');
      earningsDataEl.className = 'day-data claimed-data';
      earningsDataEl.textContent = `${dayData.coin}: ${dayData.amount}`;
      dataContainer.appendChild(earningsDataEl);
    }
  });

  // 显示手续费数据（只显示一次，取第一个有手续费的记录）
  const feeData = dayDataList.find(item => item.fee);
  if (feeData) {
    const feesDataEl = document.createElement('div');
    feesDataEl.className = 'day-data fee-data';
    feesDataEl.textContent = `fee: ${feeData.fee}`;
    dataContainer.appendChild(feesDataEl);
  }

  // 如果有数据，添加到日历单元格
  if (dataContainer.children.length > 0) {
    dayElement.appendChild(dataContainer);
  }

  // 检查是否应该显示新建按钮（从今天开始的日期，且快捷新建记录开启）
  if (shouldShowNewButton(dateStr)) {
    const newButton = createNewButton(dateStr);
    dayElement.appendChild(newButton);
  }

  // 显示模拟积分（如果启用且该日期没有积分记录）
  if (shouldShowSimulationScore(dateStr)) {
    const simulationScore = calculateSimulationScore(dateStr);
    if (simulationScore > 0) {
      const simulationIndicator = document.createElement('div');
      simulationIndicator.className = 'simulation-score-indicator';
      simulationIndicator.textContent = `模拟: ${simulationScore}`;

      // 创建提示框，显示模拟积分详情
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';

      tooltip.innerHTML = `${simulationScore}<br>基于(${getDateRangeText(dateStr)})计算`;
      dayElement.appendChild(tooltip);

      dayElement.appendChild(simulationIndicator);
    }
  }

  // 根据显示模式添加右上角标识
  const currentDisplayMode = window.calendarDisplayMode || calendarDisplayMode;
  if (currentDisplayMode === 'claimable' && isClaimableDate) {
    // 显示15天前有空投的数据
    const claimableIndicator = document.createElement('div');
    claimableIndicator.className = 'claimable-indicator';

    // 获取15天前的数据
    const originalDate = new Date(dateStr);
    originalDate.setDate(originalDate.getDate() - 15);
    const originalDateStr = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;

    // 显示15天前的月/日
    const originalMonth = originalDate.getMonth() + 1;
    const originalDay = originalDate.getDate();
    claimableIndicator.textContent = `${originalMonth}/${originalDay}`;

    const originalDataList = dateData.filter(item => item.date === originalDateStr);

    // 构建提示内容
    let tooltipContent = `${originalDateStr}<br>`;

    // 显示所有收益数据
    originalDataList.forEach(originalData => {
      if (originalData.coin && originalData.coin.trim() !== '') {
        tooltipContent += `${originalData.coin}: ${originalData.amount}<br>`;
      }
    });

    // 显示手续费数据（只显示一次）
    const feeData = originalDataList.find(item => item.fee);
    if (feeData) {
      tooltipContent += `fee: ${feeData.fee}<br>`;
    }

    // 移除最后一个换行符
    tooltipContent = tooltipContent.replace(/<br>$/, '');

    // 创建自定义提示框
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';

    tooltip.innerHTML = tooltipContent;
    dayElement.appendChild(tooltip);

    dayElement.appendChild(claimableIndicator);
  } else if (currentDisplayMode === 'score') {
    // 在积分模式下，总是显示积分弹窗
    // 但是如果有模拟积分弹窗，则不显示普通积分弹窗
    const hasSimulationScore = shouldShowSimulationScore(dateStr);

    if (!hasSimulationScore) {
      const scoreData = dayDataList.find(item => item.curScore > 0);
      const todayScoreData = dayDataList.find(item => item.todayScore > 0);
      const consumptionData = dayDataList.find(item => item.ConsumptionScore > 0);

      // 创建提示框，显示三个积分数据
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';

      tooltip.innerHTML = `
        当前积分: ${scoreData?.curScore || 0}<br>
        刷的积分: ${todayScoreData?.todayScore || 0}<br>
        消耗积分: ${consumptionData?.ConsumptionScore || 0}
      `;
      dayElement.appendChild(tooltip);
    }

    // 如果有积分数据，显示积分指示器
    const scoreData = dayDataList.find(item => item.curScore > 0);
    if (scoreData && scoreData.curScore > 0) {
      const scoreIndicator = document.createElement('div');
      scoreIndicator.className = 'score-indicator';
      scoreIndicator.textContent = `${scoreData.curScore}`;
      dayElement.appendChild(scoreIndicator);
    }
  }

  return dayElement;
}

// 检查是否是已领取时间+15天后的日期
function checkIfClaimableDate(dateStr, dateData) {
  const currentDate = new Date(dateStr);

  // 遍历所有数据，检查是否有15天前的收益
  for (const item of dateData) {
    if (item.coin && item.coin.trim() !== '') {
      const earningDate = new Date(item.date);
      const daysDiff = Math.floor((currentDate - earningDate) / (1000 * 60 * 60 * 24));

      // 如果当前日期是收益日期+15天，则显示标识
      if (daysDiff === 15) {
        return true;
      }
    }
  }

  return false;
}

// 更新统计数据
function updateStats() {
  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  const dateData = userData.date || [];

  let totalIncome = 0;
  let totalProjects = 0;
  let totalFees = 0;

  dateData.forEach(item => {
    if (item.coin && item.amount > 0) {
      totalIncome += item.amount || 0;
      totalProjects += 1;
    }
    totalFees += item.fee || 0;
  });

  // 利润 = 收入 - 手续费
  let totalProfit = totalIncome - totalFees;

  // 更新DOM
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalProjectsEl = document.getElementById('totalProjects');
  const totalProfitEl = document.getElementById('totalProfit');
  const totalFeesEl = document.getElementById('totalFees');

  if (totalIncomeEl) totalIncomeEl.textContent = `$${totalIncome.toFixed(1)}`;
  if (totalProjectsEl) totalProjectsEl.textContent = totalProjects;
  if (totalProfitEl) totalProfitEl.textContent = `$${totalProfit.toFixed(1)}`;
  if (totalFeesEl) totalFeesEl.textContent = `$${totalFees.toFixed(1)}`;
}

// 更新每月统计数据
function updateDailySummary() {
  const dailySummary = document.getElementById('dailySummary');
  if (!dailySummary) return;

  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  const dateData = userData.date || [];

  // 计算当前月份的数据
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  let monthlyIncome = 0;
  let monthlyProjects = 0;
  let monthlyFees = 0;

  dateData.forEach(item => {
    if (item.date?.startsWith(monthStr)) {
      if (item.coin && item.amount > 0) {
        monthlyIncome += item.amount || 0;
        monthlyProjects += 1;
      }
      monthlyFees += item.fee || 0;
    }
  });

  // 月度利润 = 月度收入 - 月度手续费
  let monthlyProfit = monthlyIncome - monthlyFees;

  dailySummary.innerHTML = `
    项目 <span style="color: var(--primary);">${monthlyProjects}</span> 
    收入 <span style="color: var(--success);">${monthlyIncome.toFixed(1)}</span>
    手续费 <span style="color: var(--error);">${monthlyFees.toFixed(1)}</span>
    利润 <span style="color: var(--warning);">${monthlyProfit.toFixed(1)}</span> 
  `;
}

// 导出函数供HTML调用
// 导出函数到全局
window.toggleUserMenu = toggleUserMenu;
window.selectUser = selectUser;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.updateThemeIcon = updateThemeIcon;
window.updateCalendarDisplayIcon = updateCalendarDisplayIcon;
window.renderCalendar = renderCalendar;
window.updateSimulationIconVisibility = updateSimulationIconVisibility;
window.toggleSimulationMode = toggleSimulationMode;

// 模拟积分模式开关
window.isSimulationMode = false;

// 切换模拟积分模式
function toggleSimulationMode() {
  window.isSimulationMode = !window.isSimulationMode;

  // 更新按钮状态
  const simulationIcon = document.getElementById('simulationIcon');
  if (simulationIcon) {
    if (window.isSimulationMode) {
      simulationIcon.classList.add('active');
      simulationIcon.querySelector('.simulation-tooltip').textContent = '关闭模拟';
    } else {
      simulationIcon.classList.remove('active');
      simulationIcon.querySelector('.simulation-tooltip').textContent = '模拟计算积分';
    }
  }

  // 重新渲染日历以显示/隐藏模拟积分
  renderCalendar();
}

// 计算模拟积分
function calculateSimulationScore(targetDate) {
  try {
    const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
    if (!userData || !userData.date) return 0;

    const dateData = userData.date;
    const targetDateObj = new Date(targetDate);

    // 获取配置的刷的积分
    const configScore = userData.config?.fastConfig?.todayScore || 0;

    let totalEarnedScore = 0;  // 前15天刷的积分总和
    let totalConsumedScore = 0; // 前15天扣的积分总和

    // 计算前15天的积分
    for (let i = 1; i <= 15; i++) {
      const checkDate = new Date(targetDateObj);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      // 查找该日期的记录
      const dayRecords = dateData.filter(item => item.date === checkDateStr);

      if (dayRecords.length > 0) {
        // 有记录，累加刷的积分和扣的积分
        dayRecords.forEach(record => {
          const earnedScore = parseFloat(record.todayScore) || 0;
          const consumedScore = parseFloat(record.ConsumptionScore) || 0;

          totalEarnedScore += earnedScore;
          totalConsumedScore += consumedScore;
        });
      } else {
        // 没有记录，使用配置的刷的积分
        totalEarnedScore += parseFloat(configScore) || 0;
      }
    }

    // 模拟积分 = 前15天刷的积分总和 - 前15天扣的积分总和
    const simulationScore = totalEarnedScore - totalConsumedScore;

    // 检查积分是否合理
    if (simulationScore > 1000000) {
      return 0;
    }

    return Math.max(0, simulationScore); // 积分不能为负数

  } catch (error) {
    console.error('计算模拟积分时出错:', error);
    return 0;
  }
}

// 检查是否应该显示模拟积分
function shouldShowSimulationScore(dateStr) {
  if (!window.isSimulationMode) return false;

  const userData = mockData.data?.[currentUser] || mockData.data?.[defaultUser];
  if (!userData || !userData.date) return false;

  // 检查当前显示模式，只有在积分模式下才显示模拟积分
  const currentDisplayMode = window.calendarDisplayMode || 'score';
  if (currentDisplayMode !== 'score') return false;

  // 检查该日期是否已有积分记录
  const hasScoreRecord = userData.date.some(item =>
    item.date === dateStr && (item.curScore > 0 || item.todayScore > 0)
  );

  // 如果没有积分记录，显示模拟积分
  return !hasScoreRecord;
}

// 获取前15天的日期范围文字
function getDateRangeText(targetDate) {
  try {
    const targetDateObj = new Date(targetDate);
    const endDate = new Date(targetDateObj);
    endDate.setDate(endDate.getDate() - 1); // 前一天
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 14); // 再往前14天

    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;

    return `${startStr}-${endStr}`;
  } catch (error) {
    return '前15天';
  }
} 