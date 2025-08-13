// API管理文件 - 处理所有数据请求功能

const binIdMap = new Map([
  ['lanbb', '68919b1aae596e708fc1da23'],
  ['knine', '68919d64f7e7a370d1f412ca'],
  ['kayla', '68919d3bae596e708fc1dc8e'],
  ['echo', '68919d4fae596e708fc1dcb1'],
  ['adam', '6892fc5af7e7a370d1f50b35'],
  ['mm', '68939dfbf7e7a370d1f59af1'],
  ['look', '6891ba4d7b4b8670d8ad8f65'],
  ['ces', '6891a9a77b4b8670d8ad84da']
]);
const currentBinId = binIdMap.get(location.href.split('?')[1]) || null;

// JSONBin配置
const JSONBIN_CONFIG = {
  // BINS 里面对应数据的 Bin ID
  BIN_ID: localStorage.getItem('jsonbinId') || currentBinId || '6891ba4d7b4b8670d8ad8f65',
  // API KEYS 里面对应的 X-Master-Key
  MASTER_KEY: '$2a$10$3cSkdp7.76Y.JUeZ/ymCe.A6ZPUmIPfeF1hTH7ii9h13BeRMU/a0.',
  // 数据源
  DATA_SOURCE: 'https://api.jsonbin.io/v3/b/'
};

// 从JSONBin获取数据
async function fetchDataFromAPI() {
  try {
    const url = `${JSONBIN_CONFIG.DATA_SOURCE}${JSONBIN_CONFIG.BIN_ID}`;

    const headers = {
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.record;
  } catch (error) {
    console.error('❌ 从API获取数据失败:', error);
  }
}

// 更新JSONBin中的数据
async function updateDataInAPI(newData) {
  try {
    // 检查是否有有效的 BIN_ID
    if (!JSONBIN_CONFIG.BIN_ID) {
      console.warn('⚠️ 没有配置 BIN_ID，无法发送到服务器');
      return false;
    }

    const url = `${JSONBIN_CONFIG.DATA_SOURCE}${JSONBIN_CONFIG.BIN_ID}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(newData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return true;
  } catch (error) {
    console.error('❌ 更新数据失败:', error);
    return false;
  }
}

// 更新用户配置
async function updateUserConfig(userId, configKey, configValue) {
  try {
    // 直接更新本地数据
    if (!mockData.data) {
      mockData.data = {};
    }
    if (!mockData.data[userId]) {
      mockData.data[userId] = { config: {}, date: [] };
    }

    if (!mockData.data[userId].config) {
      mockData.data[userId].config = {};
    }

    // 更新配置
    mockData.data[userId].config[configKey] = configValue;

    // 同步更新全局变量
    if (window.mockData && window.mockData.data && window.mockData.data[userId]) {
      window.mockData.data[userId].config[configKey] = configValue;
    }

    // 保存到API（API会返回更新后的数据）
    const success = await updateDataInAPI(mockData);

    if (success) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// 批量更新用户配置
async function updateUserConfigBatch(userId, configUpdates) {
  try {
    // 直接更新本地数据
    if (!mockData.data) {
      mockData.data = {};
    }
    if (!mockData.data[userId]) {
      mockData.data[userId] = { config: {}, date: [] };
    }

    if (!mockData.data[userId].config) {
      mockData.data[userId].config = {};
    }

    // 保留现有配置，只更新传入的配置项
    const currentConfig = mockData.data[userId].config;
    const updatedConfig = { ...currentConfig, ...configUpdates };

    // 批量更新配置
    mockData.data[userId].config = updatedConfig;

    // 同步更新全局变量
    if (window.mockData && window.mockData.data && window.mockData.data[userId]) {
      window.mockData.data[userId].config = updatedConfig;
    }

    // 保存到API（API会返回更新后的数据）
    const success = await updateDataInAPI(mockData);

    if (success) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function toggleCalendarDisplay() {
  const newMode = window.calendarDisplayMode === 'claimable' ? 'score' : 'claimable';

  // 显示加载状态
  const btn = document.querySelector('.icon-btn[onclick="API.toggleCalendarDisplay()"]');
  if (!btn) return;

  btn.innerHTML = '<span class="calendar-display-icon">⏳</span>';
  btn.disabled = true;

  try {
    // 通过API更新配置
    const success = await updateUserConfig(window.currentUser, 'calendarDisplayMode', newMode);

    if (success) {
      window.calendarDisplayMode = newMode;

      // 重新渲染日历以更新显示
      if (window.renderCalendar) {
        window.renderCalendar();
      }
    }
  } catch (error) {
    console.error('❌ 日历显示模式更新出错:', error);
  } finally {
    // 恢复原始状态
    if (window.updateCalendarDisplayIcon) {
      window.updateCalendarDisplayIcon();
    }

    // 更新模拟图标显示状态
    if (window.updateSimulationIconVisibility) {
      window.updateSimulationIconVisibility();
    }

    // 恢复按钮状态
    btn.disabled = false;
  }
}

// 主题切换
async function toggleTheme() {
  const newTheme = window.currentTheme === 'light' ? 'dark' : 'light';

  // 显示加载状态
  const btn = document.querySelector('.icon-btn[onclick="API.toggleTheme()"]');
  if (!btn) return;

  btn.innerHTML = '<span class="theme-icon">⏳</span>';
  btn.disabled = true;

  try {
    // 通过API更新配置
    const success = await updateUserConfig(window.currentUser, 'theme', newTheme);

    if (success) {
      window.currentTheme = newTheme;
      document.documentElement.setAttribute('data-theme', window.currentTheme);
    }
  } catch (error) {
    console.error('❌ 主题更新出错:', error);
  } finally {
    // 更新主题图标
    if (window.updateThemeIcon) {
      window.updateThemeIcon();
    }
    // 恢复按钮状态
    btn.disabled = false;
  }
}

// 导出所有API函数
window.API = {
  fetchDataFromAPI,
  updateDataInAPI,
  updateUserConfig,
  updateUserConfigBatch,
  toggleCalendarDisplay,
  toggleTheme
}; 