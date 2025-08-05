// API管理文件 - 处理所有数据请求功能

const binIdMap = new Map([
  ['lanbb', '68919b1aae596e708fc1da23'],
  ['knine', '68919d64f7e7a370d1f412ca'],
  ['kayla', '68919d3bae596e708fc1dc8e'],
  ['echo', '68919d4fae596e708fc1dcb1'],
  ['adam', '6891c7bb7b4b8670d8ad9851'],
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
    console.log('✅ 从API获取数据成功');
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
      console.log('💡 请先运行 create-data.js 创建数据，或手动设置 BIN_ID');
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
    console.log('✅ 数据更新成功:', result);
    return true;
  } catch (error) {
    console.error('❌ 更新数据失败:', error);
    return false;
  }
}

// 创建新的JSONBin
async function createNewJSONBin(data) {
  try {
    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('✅ JSONBin创建成功！');
    console.log('📋 Bin ID:', result.metadata.id);
    console.log('🔗 访问URL:', `https://api.jsonbin.io/v3/b/${result.metadata.id}`);

    // 保存Bin ID到本地存储
    localStorage.setItem('jsonbinId', result.metadata.id);

    return result.metadata.id;
  } catch (error) {
    console.error('❌ 创建JSONBin失败:', error);
    return null;
  }
}

// 添加新用户数据
async function addUserData(userId, userData, currentData) {
  try {
    currentData[userId] = userData;
    const success = await updateDataInAPI(currentData);
    if (success) {
      console.log(`✅ 用户 ${userId} 数据添加成功`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ 添加用户数据失败:', error);
    return false;
  }
}

// 更新用户数据
async function updateUserData(userId, userData, currentData) {
  try {
    currentData[userId] = userData;
    const success = await updateDataInAPI(currentData);
    if (success) {
      console.log(`✅ 用户 ${userId} 数据更新成功`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ 更新用户数据失败:', error);
    return false;
  }
}

// 删除用户数据
async function deleteUserData(userId, currentData) {
  try {
    if (currentData[userId]) {
      delete currentData[userId];
      const success = await updateDataInAPI(currentData);
      if (success) {
        console.log(`✅ 用户 ${userId} 数据删除成功`);
        return true;
      }
      return false;
    }
    return false;
  } catch (error) {
    console.error('❌ 删除用户数据失败:', error);
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

    // 保存到API（API会返回更新后的数据）
    const success = await updateDataInAPI(mockData);

    if (success) {
      console.log(`✅ 用户 ${userId} 的 ${configKey} 配置更新成功:`, configValue);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 更新用户配置失败:`, error);
    return false;
  }
}

// 日历显示模式切换
async function toggleCalendarDisplay() {
  const newMode = window.calendarDisplayMode === 'claimable' ? 'score' : 'claimable';

  // 显示加载状态
  const btn = document.querySelector('.icon-btn[onclick="API.toggleCalendarDisplay()"]');
  if (!btn) {
    console.error('❌ 找不到日历显示切换按钮');
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span>⏳</span>';
  btn.disabled = true;

  try {
    // 通过API更新配置
    const success = await updateUserConfig(window.currentUser, 'calendarDisplayMode', newMode);

    if (success) {
      window.calendarDisplayMode = newMode;
      console.log('✅ API: calendarDisplayMode 已更新为:', newMode);

      if (window.updateCalendarDisplayIcon) {
        window.updateCalendarDisplayIcon();
      }

      if (window.renderCalendar) {
        console.log('🔄 API: 开始重新渲染日历');
        window.renderCalendar(); // 重新渲染日历以更新显示
      } else {
        console.error('❌ API: renderCalendar 函数未找到');
      }
    } else {
      // 恢复原始状态
      if (window.updateCalendarDisplayIcon) {
        window.updateCalendarDisplayIcon();
      }
    }
  } catch (error) {
    console.error('❌ 日历显示模式更新出错:', error);
    // 恢复原始状态
    if (window.updateCalendarDisplayIcon) {
      window.updateCalendarDisplayIcon();
    }
  } finally {
    // 恢复按钮状态
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// 主题切换
async function toggleTheme() {
  const newTheme = window.currentTheme === 'light' ? 'dark' : 'light';

  // 显示加载状态
  const btn = document.querySelector('.icon-btn[onclick="API.toggleTheme()"]');
  if (!btn) {
    console.error('❌ 找不到主题切换按钮');
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span>⏳</span>';
  btn.disabled = true;

  try {
    // 通过API更新配置
    const success = await updateUserConfig(window.currentUser, 'theme', newTheme);

    if (success) {
      window.currentTheme = newTheme;
      document.documentElement.setAttribute('data-theme', window.currentTheme);
      if (window.updateThemeIcon) {
        window.updateThemeIcon();
      }
    } else {
      // 恢复原始状态
      if (window.updateThemeIcon) {
        window.updateThemeIcon();
      }
    }
  } catch (error) {
    console.error('❌ 主题更新出错:', error);
    // 恢复原始状态
    if (window.updateThemeIcon) {
      window.updateThemeIcon();
    }
  } finally {
    // 恢复按钮状态
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// 导出所有API函数
window.API = {
  fetchDataFromAPI,
  updateDataInAPI,
  createNewJSONBin,
  addUserData,
  updateUserData,
  deleteUserData,
  updateUserConfig,
  toggleCalendarDisplay,
  toggleTheme,
  JSONBIN_CONFIG
}; 