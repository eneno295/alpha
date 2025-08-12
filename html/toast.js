// 公共Toast提示系统
const Toast = {
  // 显示成功提示
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  },

  // 显示错误提示
  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  },

  // 显示警告提示
  warning(message, duration = 4000) {
    this.show(message, 'warning', duration);
  },

  // 显示信息提示
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  },

  // 核心显示方法
  show(message, type = 'info', duration = 3000) {
    // 创建toast容器
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // 设置图标
    const icon = this.getIcon(type);

    // 设置内容
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // 自动隐藏
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, duration);
  },

  // 获取图标
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  },

  // 清除所有toast
  clearAll() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    });
  }
};

// 暴露到全局
window.Toast = Toast; 