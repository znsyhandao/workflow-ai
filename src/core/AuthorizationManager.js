/**
 * 通用授权管理器 - 管理多平台授权
 */
class AuthorizationManager {
  constructor() {
    this.connectors = new Map();
    this.credentialsStore = new Map();
  }

  /**
   * 注册平台连接器
   * @param {string} platform 平台名称
   * @param {Object} connector 连接器实例
   */
  registerConnector(platform, connector) {
    this.connectors.set(platform, connector);
    console.log(`已注册 ${platform} 平台连接器`);
  }

  /**
   * 获取平台连接器
   * @param {string} platform 平台名称
   * @returns {Object|null} 连接器实例
   */
  getConnector(platform) {
    return this.connectors.get(platform) || null;
  }

  /**
   * 检查是否需要授权
   * @param {string} platform 平台名称
   * @param {Array} requiredPermissions 需要的权限列表
   * @returns {Promise<Object>} 授权状态
   */
  async checkAuthorization(platform, requiredPermissions = []) {
    const connector = this.getConnector(platform);
    if (!connector) {
      return {
        success: false,
        needAuthorization: false,
        message: `未注册 ${platform} 平台连接器`
      };
    }

    try {
      // 检查是否已有有效凭证
      const credentials = this.credentialsStore.get(platform);
      if (credentials && this._isCredentialsValid(credentials)) {
        // 检查权限是否满足
        const hasPermissions = await this._checkPermissions(connector, credentials, requiredPermissions);
        if (hasPermissions) {
          return {
            success: true,
            needAuthorization: false,
            credentials: credentials,
            message: '授权已存在且有效'
          };
        }
      }

      // 需要新的授权
      return {
        success: false,
        needAuthorization: true,
        authorizationUrl: connector.getAuthorizationUrl(),
        platform: platform,
        requiredPermissions: requiredPermissions,
        message: `需要 ${platform} 平台授权`
      };
    } catch (error) {
      console.error(`检查 ${platform} 授权出错:`, error);
      return {
        success: false,
        needAuthorization: true,
        authorizationUrl: connector.getAuthorizationUrl(),
        message: `授权检查失败: ${error.message}`
      };
    }
  }

  /**
   * 保存授权凭证
   * @param {string} platform 平台名称
   * @param {Object} credentials 授权凭证
   */
  saveCredentials(platform, credentials) {
    credentials.obtainedAt = Date.now();
    this.credentialsStore.set(platform, credentials);
    console.log(`已保存 ${platform} 平台授权凭证`);
  }

  /**
   * 获取授权凭证
   * @param {string} platform 平台名称
   * @returns {Object|null} 授权凭证
   */
  getCredentials(platform) {
    return this.credentialsStore.get(platform) || null;
  }

  /**
   * 验证凭证是否有效
   * @param {Object} credentials 授权凭证
   * @returns {boolean} 是否有效
   */
  _isCredentialsValid(credentials) {
    if (!credentials || !credentials.expiresAt) return false;
    return credentials.expiresAt > Date.now();
  }

  /**
   * 检查权限是否满足
   * @param {Object} connector 连接器
   * @param {Object} credentials 凭证
   * @param {Array} requiredPermissions 需要的权限
   * @returns {Promise<boolean>} 是否满足
   */
  async _checkPermissions(connector, credentials, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    
    if (connector.checkPermissions) {
      return await connector.checkPermissions(credentials, requiredPermissions);
    }
    
    // 默认认为权限满足
    return true;
  }
}

module.exports = AuthorizationManager;