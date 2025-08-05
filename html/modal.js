// 弹出框相关变量
let selectedDate = null;
let isEditing = false;

// 弹出框功能
function openAddRecordModal(dateStr, day, currentUser, mockData, callbacks) {
  selectedDate = dateStr;

  // 检查该日期是否已有数据
  const userData = mockData.data?.[currentUser] || { date: [] };
  const existingData = userData.date.filter(item => item.date === dateStr);

  isEditing = existingData.length > 0;

  console.log('🔍 编辑模式检测:', {
    dateStr,
    currentUser,
    existingDataCount: existingData.length,
    isEditing,
    existingData
  });

  // 更新标题
  const modalTitle = document.getElementById('modalTitle');
  const date = new Date(dateStr);
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  modalTitle.textContent = isEditing ? `修改 ${formattedDate} 的记录` : `新建 ${formattedDate} 的记录`;

  // 清空表单
  clearForm();

  // 如果是编辑模式，填充现有数据
  if (isEditing) {
    fillFormWithExistingData(existingData);
  }

  // 显示弹出框
  const modal = document.getElementById('addRecordModal');
  modal.classList.add('show');

  // 聚焦到第一个输入框
  setTimeout(() => {
    const firstInput = modal.querySelector('.airdrop-name');
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);

  // 添加空投数量变化监听器
  addAirdropChangeListeners();
}

function closeAddRecordModal() {
  const modal = document.getElementById('addRecordModal');
  modal.classList.remove('show');
  selectedDate = null;
  isEditing = false;
}

function clearForm() {
  // 清空空投列表，只保留一个
  const airdropList = document.getElementById('airdropList');
  airdropList.innerHTML = `
    <div class="airdrop-item">
      <input type="text" class="airdrop-name" placeholder="输入空投名称" required>
      <input type="number" class="airdrop-income" step="0.01" placeholder="收入" required>
      <button type="button" class="remove-airdrop" onclick="Modal.removeAirdrop(this)">×</button>
    </div>
  `;

  // 清空其他字段
  document.getElementById('curScore').value = '';
  document.getElementById('todayScore').value = '';
  document.getElementById('fee').value = '';
  document.getElementById('remarks').value = '';

  // 更新消耗积分（会自动设置禁用状态）
  updateConsumptionScore();
}

function addAirdropField() {
  const airdropList = document.getElementById('airdropList');
  const newItem = document.createElement('div');
  newItem.className = 'airdrop-item';
  newItem.innerHTML = `
    <input type="text" class="airdrop-name" placeholder="输入空投名称" required>
    <input type="number" class="airdrop-income" step="0.01" placeholder="收入" required>
    <button type="button" class="remove-airdrop" onclick="Modal.removeAirdrop(this)">×</button>
  `;
  airdropList.appendChild(newItem);

  // 聚焦到新添加的输入框
  const newInput = newItem.querySelector('.airdrop-name');
  newInput.focus();

  // 更新消耗积分
  updateConsumptionScore();
}

function removeAirdrop(button) {
  const airdropList = document.getElementById('airdropList');
  const items = airdropList.querySelectorAll('.airdrop-item');

  // 至少保留一个空投字段
  if (items.length > 1) {
    button.closest('.airdrop-item').remove();
  }

  // 更新消耗积分
  updateConsumptionScore();
}

// 添加空投数量变化监听器
function addAirdropChangeListeners() {
  // 监听空投列表的变化
  const airdropList = document.getElementById('airdropList');
  if (airdropList) {
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      updateConsumptionScore();
    });

    observer.observe(airdropList, {
      childList: true,
      subtree: true
    });
  }
}

// 计算并更新消耗积分
function updateConsumptionScore() {
  const airdropItems = document.querySelectorAll('.airdrop-item');
  const airdropCount = airdropItems.length;
  const consumptionScore = airdropCount * 15;

  const consumptionInput = document.getElementById('ConsumptionScore');
  consumptionInput.value = consumptionScore;

  // 确保字段保持禁用状态
  consumptionInput.disabled = true;
  consumptionInput.readOnly = true;
}

// 填充现有数据到表单
function fillFormWithExistingData(existingData) {
  console.log('📝 填充现有数据:', existingData);

  const airdropList = document.getElementById('airdropList');

  // 清空现有列表
  airdropList.innerHTML = '';

  // 添加所有有空投名称的数据（包括没有收益的）
  const airdropData = existingData.filter(item => item.coin && item.coin.trim() !== '');

  console.log('💰 空投数据:', airdropData);

  airdropData.forEach((item, index) => {
    const newItem = document.createElement('div');
    newItem.className = 'airdrop-item';
    newItem.innerHTML = `
      <input type="text" class="airdrop-name" placeholder="输入空投名称" required value="${item.coin || ''}">
      <input type="number" class="airdrop-income" step="0.01" placeholder="收入" required value="${item.amount || ''}">
      <button type="button" class="remove-airdrop" onclick="Modal.removeAirdrop(this)">×</button>
    `;
    airdropList.appendChild(newItem);
  });

  // 如果没有空投数据，至少保留一个空字段
  if (airdropData.length === 0) {
    const newItem = document.createElement('div');
    newItem.className = 'airdrop-item';
    newItem.innerHTML = `
      <input type="text" class="airdrop-name" placeholder="输入空投名称" required>
      <input type="number" class="airdrop-income" step="0.01" placeholder="收入" required>
      <button type="button" class="remove-airdrop" onclick="Modal.removeAirdrop(this)">×</button>
    `;
    airdropList.appendChild(newItem);
  }

  // 填充手续费（取第一个有手续费的记录）
  const feeData = existingData.find(item => item.fee > 0);
  if (feeData) {
    document.getElementById('fee').value = feeData.fee || '';
  }

  // 填充备注（取第一个记录的备注）
  const firstRecord = existingData[0];
  if (firstRecord && firstRecord.remark) {
    document.getElementById('remarks').value = firstRecord.remark || '';
  }

  // 填充积分信息
  if (firstRecord) {
    document.getElementById('curScore').value = firstRecord.curScore || '';
    document.getElementById('todayScore').value = firstRecord.todayScore || '';
  }

  // 更新消耗积分（会自动设置禁用状态和值）
  updateConsumptionScore();
}

async function saveRecord(currentUser, mockData, callbacks) {
  if (!selectedDate) {
    alert('请选择日期');
    return;
  }

  // 获取表单数据
  const airdropItems = Array.from(document.querySelectorAll('.airdrop-item'));
  const airdropData = [];

  // 收集每个空投的数据（包括没有收益的）
  airdropItems.forEach(item => {
    const name = item.querySelector('.airdrop-name').value.trim();
    const income = parseFloat(item.querySelector('.airdrop-income').value) || 0;
    airdropData.push({ name, income });
  });

  const fee = parseFloat(document.getElementById('fee').value) || 0;
  const remarks = document.getElementById('remarks').value.trim();
  const curScore = parseInt(document.getElementById('curScore').value) || 0;
  const todayScore = parseInt(document.getElementById('todayScore').value) || 0;
  const consumptionScore = parseInt(document.getElementById('ConsumptionScore').value) || 0;

  // 检查是否所有字段都为空
  const allFieldsEmpty = airdropData.every(item => !item.name && item.income === 0) &&
    fee === 0 && curScore === 0 && todayScore === 0 && !remarks;

  // 如果所有字段都为空，直接清空该日期的数据
  if (allFieldsEmpty) {
    await clearCurrentDayData(currentUser, mockData, callbacks);
    return;
  }

  try {
    // 获取当前用户数据
    const userData = mockData.data?.[currentUser] || { date: [] };

    // 如果是编辑模式，先删除该日期的所有记录
    if (isEditing) {
      userData.date = userData.date.filter(item => item.date !== selectedDate);
    }

    // 为每个空投创建记录
    airdropData.forEach(({ name, income }) => {
      const newRecord = {
        date: selectedDate,
        coin: name,
        amount: income,
        fee: fee,
        curScore: curScore,
        todayScore: todayScore,
        ConsumptionScore: consumptionScore,
        remark: remarks
      };

      // 添加记录
      userData.date.push(newRecord);
    });

    // 更新数据
    mockData.data[currentUser] = userData;

    // 调试信息：打印组装的数据
    console.log('📊 准备保存的数据:', {
      selectedDate,
      currentUser,
      isEditing,
      airdropData,
      fee,
      remarks,
      curScore,
      todayScore,
      consumptionScore,
      userData: userData,
      fullMockData: mockData
    });

    // 保存到API
    const success = await API.updateDataInAPI(mockData);

    if (success) {
      // 调用回调函数更新界面
      if (callbacks && callbacks.onSuccess) {
        callbacks.onSuccess();
      }

      // 关闭弹出框
      closeAddRecordModal();

      // 显示成功提示
      const message = isEditing ? '记录修改成功！' : '记录保存成功！';
      showSuccessMessage(message);
    } else {
      alert('保存失败，请重试');
    }
  } catch (error) {
    console.error('保存记录失败:', error);
    alert('保存失败，请重试');
  }
}

async function clearCurrentDayData(currentUser, mockData, callbacks) {
  if (!selectedDate) {
    alert('请选择日期');
    return;
  }

  // 确认是否要清空
  if (!confirm(`确定要清空 ${selectedDate} 的所有数据吗？`)) {
    return;
  }

  try {
    // 获取当前用户数据
    const userData = mockData.data?.[currentUser] || { date: [] };

    // 删除该日期的所有记录
    userData.date = userData.date.filter(item => item.date !== selectedDate);

    // 更新数据
    mockData.data[currentUser] = userData;

    console.log('🗑️ 清空数据:', {
      selectedDate,
      currentUser,
      remainingData: userData.date
    });

    // 保存到API
    const success = await API.updateDataInAPI(mockData);

    if (success) {
      // 调用回调函数更新界面
      if (callbacks && callbacks.onSuccess) {
        callbacks.onSuccess();
      }

      // 关闭弹出框
      closeAddRecordModal();

      // 显示成功提示
      showSuccessMessage('数据清空成功！');
    } else {
      alert('清空失败，请重试');
    }
  } catch (error) {
    console.error('清空数据失败:', error);
    alert('清空失败，请重试');
  }
}

function showSuccessMessage(message) {
  // 创建成功提示
  const toast = document.createElement('div');
  toast.className = 'success-toast';

  // 检查是否包含换行符，如果是则使用 innerHTML
  if (message.includes('\n')) {
    toast.innerHTML = message.replace(/\n/g, '<br>');
  } else {
    toast.textContent = message;
  }

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 10001;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    line-height: 1.4;
    font-size: 14px;
  `;

  document.body.appendChild(toast);

  // 根据消息长度调整显示时间
  const displayTime = message.includes('\n') ? 5000 : 3000;
  setTimeout(() => {
    toast.remove();
  }, displayTime);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// 导入导出功能
function openImportExportModal() {
  const modal = document.getElementById('importExportModal');
  modal.classList.add('show');

  // 默认显示导入标签
  switchTab('import');
}

function closeImportExportModal() {
  const modal = document.getElementById('importExportModal');
  modal.classList.remove('show');

  // 清空表单
  document.getElementById('importFile').value = '';
  document.getElementById('importTextarea').value = '';

  // 重置文件上传区域显示
  resetFileUploadDisplay();
}

function switchTab(tab) {
  // 更新按钮状态
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.querySelector(`.tab-btn[onclick="Modal.switchTab('${tab}')"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // 更新内容显示
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));

  const activeContent = document.getElementById(`${tab}Content`);
  if (activeContent) {
    activeContent.classList.add('active');
  }

  // 如果是导出标签，预填充当前数据
  if (tab === 'export') {
    const exportTextarea = document.getElementById('exportTextarea');
    exportTextarea.value = JSON.stringify(window.mockData, null, 2);
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 更新文件上传区域的显示
  updateFileUploadDisplay(file.name);

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      document.getElementById('importTextarea').value = JSON.stringify(data, null, 2);
      showSuccessMessage('✅ 文件读取成功！');
    } catch (error) {
      alert('❌ 文件格式错误，请选择有效的 JSON 文件');
      resetFileUploadDisplay();
    }
  };
  reader.readAsText(file);
}

function updateFileUploadDisplay(fileName) {
  const uploadArea = document.querySelector('.file-upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <span class="file-upload-icon">✅</span>
      <div class="file-upload-text">已选择文件</div>
      <div class="file-upload-hint">${fileName}</div>
    `;
    uploadArea.style.borderColor = 'var(--success)';
    uploadArea.style.background = 'rgba(16, 185, 129, 0.1)';
  }
}

function resetFileUploadDisplay() {
  const uploadArea = document.querySelector('.file-upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <span class="file-upload-icon">📄</span>
      <div class="file-upload-text">点击选择文件或拖拽到此处</div>
      <div class="file-upload-hint">支持 .json 格式文件</div>
    `;
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
  }
}

function loadTemplateData() {
  const templateData = {
    "用户1": {
      "config": {
        "theme": "light",
        "calendarDisplayMode": "claimable",
        "todayFastScore": 0,
        "showMockScoreIcon": true,
        "showThemeIcon": true,
        "showCalendarDisplayIcon": true,
        "showImportExportIcon": true
      },
      "date": [
        {
          "date": "2025-08-05",
          "coin": "BTC",
          "amount": 150.50,
          "fee": 5.00,
          "curScore": 300,
          "todayScore": 20,
          "ConsumptionScore": 15,
          "remark": "备注信息"
        }
      ]
    }
  };

  const textarea = document.getElementById('importTextarea');
  textarea.value = JSON.stringify(templateData, null, 2);

  // 显示成功提示
  showSuccessMessage('📝 模板数据已加载！');
}

async function importData() {
  const textarea = document.getElementById('importTextarea');
  const data = textarea.value.trim();

  if (!data) {
    alert('请输入要导入的数据');
    return;
  }

  try {
    const importedData = JSON.parse(data);

    // 验证数据结构 - 新的格式：直接以用户名为键
    if (typeof importedData !== 'object' || importedData === null) {
      alert('数据格式错误，请确保是有效的 JSON 对象');
      return;
    }

    // 检查是否包含用户数据
    const userKeys = Object.keys(importedData);
    if (userKeys.length === 0) {
      alert('数据格式错误，请确保包含用户数据');
      return;
    }

    // 验证每个用户的数据结构
    for (const userId of userKeys) {
      const userData = importedData[userId];
      if (!userData || typeof userData !== 'object') {
        alert(`用户 ${userId} 的数据格式错误`);
        return;
      }

      // 检查是否包含 date 数组
      if (!userData.date || !Array.isArray(userData.date)) {
        alert(`用户 ${userId} 缺少 date 数组`);
        return;
      }
    }

    // 将导入的数据追加到现有数据中
    const currentData = window.mockData.data || {};
    const currentUsers = window.mockData.users || [];

    // 检查是否有已存在的用户
    const existingUsers = [];
    const newUsers = [];

    for (const userId of userKeys) {
      if (currentData[userId]) {
        existingUsers.push(userId);
      } else {
        newUsers.push(userId);
      }
    }

    // 如果有已存在的用户，询问是否更新
    if (existingUsers.length > 0) {
      const userList = existingUsers.join('、');
      const confirmMessage = `用户 ${userList} 已存在，是否更新该用户的数据？\n\n注意：这将合并新数据到现有数据中。`;

      if (!confirm(confirmMessage)) {
        showSuccessMessage('❌ 导入已取消');
        return;
      }
    }

    // 合并用户数据
    const updateResults = [];

    for (const userId of userKeys) {
      if (currentData[userId]) {
        // 如果用户已存在，合并数据
        const existingDates = new Set(currentData[userId].date.map(item => item.date));
        const newDates = importedData[userId].date.filter(item => !existingDates.has(item.date));

        currentData[userId].date = [...currentData[userId].date, ...newDates];

        // 合并配置（如果存在）
        if (importedData[userId].config) {
          currentData[userId].config = {
            ...currentData[userId].config,
            ...importedData[userId].config
          };
        }

        updateResults.push({
          userId,
          type: 'update',
          newRecords: newDates.length,
          totalRecords: currentData[userId].date.length
        });

        console.log(`✅ 用户 ${userId} 数据已更新，新增 ${newDates.length} 条记录`);
      } else {
        // 如果用户不存在，直接添加
        currentData[userId] = importedData[userId];
        if (!currentUsers.includes(userId)) {
          currentUsers.push(userId);
        }

        updateResults.push({
          userId,
          type: 'add',
          newRecords: importedData[userId].date.length,
          totalRecords: importedData[userId].date.length
        });

        console.log(`✅ 新用户 ${userId} 已添加`);
      }
    }

    // 更新全局数据
    window.mockData.users = currentUsers;
    window.mockData.data = currentData;

    // 保存到API
    const success = await API.updateDataInAPI(window.mockData);

    if (success) {
      // 更新界面
      if (window.updateUI) {
        window.updateUI();
      }

      // 关闭弹窗
      closeImportExportModal();

      // 显示成功提示
      const totalNewRecords = updateResults.reduce((total, result) => total + result.newRecords, 0);

      // 构建详细的成功消息
      let successMessage = '🚀 数据导入成功！\n\n';

      for (const result of updateResults) {
        if (result.type === 'add') {
          successMessage += `✅ ${result.userId}：新增用户，${result.newRecords} 条记录\n`;
        } else {
          successMessage += `🔄 ${result.userId}：数据更新，新增 ${result.newRecords} 条记录（总计 ${result.totalRecords} 条）\n`;
        }
      }

      successMessage += `\n📊 总计：${totalNewRecords} 条新记录`;

      showSuccessMessage(successMessage);

      console.log('✅ 数据导入成功:', {
        updateResults,
        totalNewRecords,
        finalData: window.mockData
      });
    } else {
      alert('导入失败，请重试');
    }
  } catch (error) {
    console.error('导入数据失败:', error);
    alert('数据格式错误，请检查 JSON 格式');
  }
}

function exportData() {
  const data = JSON.stringify(window.mockData, null, 2);

  // 创建下载链接
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `crypto-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  showSuccessMessage('💾 数据导出成功！');
}

// 导出所有Modal函数
window.Modal = {
  openAddRecordModal,
  closeAddRecordModal,
  addAirdropField,
  removeAirdrop,
  saveRecord,
  clearCurrentDayData,
  updateConsumptionScore,
  openImportExportModal,
  closeImportExportModal,
  switchTab,
  handleFileSelect,
  importData,
  exportData,
  loadTemplateData
}; 