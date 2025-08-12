// 配置弹窗管理
const Config = {
  // 打开配置弹窗
  openConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadConfig();
    }
  },

  // 关闭配置弹窗
  closeConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // 加载配置
  loadConfig() {
    const userConfig = this.getUserConfig();
    const fastConfig = userConfig.fastConfig;

    // 加载fastConfig配置
    if (fastConfig) {
      document.getElementById('configFee').value = fastConfig.fee || '';
      document.getElementById('configScore').value = fastConfig.todayScore || '';
      document.getElementById('configAutoCalculate').checked = fastConfig.autoCalcCurScore === true;
      document.getElementById('configFastAddRecord').checked = fastConfig.fastAddRecord === true;
    }

    // 加载用户配置
    document.getElementById('configShowThemeIcon').checked = userConfig.showThemeIcon === true;
    document.getElementById('configShowCalendarDisplayModeIcon').checked = userConfig.showCalendarDisplayModeIcon === true;
    document.getElementById('configShowImportExportIcon').checked = userConfig.showImportExportIcon === true;
  },

  // 保存配置
  async saveConfig() {
    try {
      // 保存fastConfig配置
      const fastConfig = {
        fee: document.getElementById('configFee').value,
        todayScore: document.getElementById('configScore').value,
        autoCalcCurScore: document.getElementById('configAutoCalculate').checked,
        fastAddRecord: document.getElementById('configFastAddRecord').checked
      };

      // 保存用户配置
      const userConfig = {
        showThemeIcon: document.getElementById('configShowThemeIcon').checked,
        showCalendarDisplayModeIcon: document.getElementById('configShowCalendarDisplayModeIcon').checked,
        showImportExportIcon: document.getElementById('configShowImportExportIcon').checked
      };

      // 通过API更新配置
      if (window.API && window.API.updateUserConfigBatch) {
        // 组装完整的配置数据，一次性批量更新
        const allConfigUpdates = {
          fastConfig: fastConfig,
          showThemeIcon: userConfig.showThemeIcon,
          showCalendarDisplayModeIcon: userConfig.showCalendarDisplayModeIcon,
          showImportExportIcon: userConfig.showImportExportIcon
        };

        // 一次性批量更新所有配置
        await window.API.updateUserConfigBatch(window.currentUser, allConfigUpdates);

        this.closeConfigModal();
        window.Toast?.success('配置已保存');

        // 刷新页面配置显示
        if (window.updateConfigVisibility) {
          window.updateConfigVisibility();
        }

        // 刷新日历显示（以更新新建按钮的显示状态）
        if (window.renderCalendar) {
          window.renderCalendar();
        }
      } else {
        throw new Error('API不可用');
      }
    } catch (error) {
      window.Toast?.error('配置保存失败，请重试');
    }
  },

  // 获取用户配置
  getUserConfig() {
    // 从全局的mockData中获取当前用户的配置
    if (window.mockData && window.mockData.data && window.currentUser) {
      const userData = window.mockData.data[window.currentUser];
      if (userData && userData.config) {
        return userData.config;
      }
    }
    return {};
  },

  // 清空配置
  clearConfig() {
    // 清空本地显示
    document.getElementById('configFee').value = '';
    document.getElementById('configScore').value = '';
    document.getElementById('configAutoCalculate').checked = false;
    document.getElementById('configFastAddRecord').checked = false;
    document.getElementById('configShowThemeIcon').checked = false;
    document.getElementById('configShowCalendarDisplayModeIcon').checked = false;
    document.getElementById('configShowImportExportIcon').checked = false;

    window.Toast?.success('配置已清空');
  }
};

// 点击弹窗外部关闭弹窗
document.addEventListener('DOMContentLoaded', function () {
  const configModal = document.getElementById('configModal');
  if (configModal) {
    configModal.addEventListener('click', function (e) {
      if (e.target === configModal) {
        Config.closeConfigModal();
      }
    });
  }
});