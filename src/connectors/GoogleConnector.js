/**
 * Google连接器 - 提供Google账户授权登录功能
 */
const axios = require('../utils/axiosConfig');

class GoogleConnector {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    this.baseUrl = 'https://www.googleapis.com';
  }

  /**
   * 获取Google授权链接
   * @param {Array} scopes 授权范围列表
   * @returns {string} 授权链接
   */
  getAuthorizationUrl(scopes = ['profile', 'email']) {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${baseUrl}?${queryString}`;
  }

  /**
   * 使用授权码获取访问令牌
   * @param {string} code 授权码
   * @returns {Promise<Object>} 访问令牌信息
   */
  async getAccessToken(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      });

      if (response.data.access_token) {
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          idToken: response.data.id_token,
          tokenType: response.data.token_type,
          expiresAt: Date.now() + response.data.expires_in * 1000
        };
      } else {
        throw new Error('获取Google访问令牌失败');
      }
    } catch (error) {
      console.error('获取Google访问令牌出错:', error);
      throw new Error(`获取Google访问令牌失败: ${error.message}`);
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken 刷新令牌
   * @returns {Promise<Object>} 新的访问令牌信息
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      if (response.data.access_token) {
        return {
          accessToken: response.data.access_token,
          tokenType: response.data.token_type,
          expiresAt: Date.now() + response.data.expires_in * 1000
        };
      } else {
        throw new Error('刷新Google访问令牌失败');
      }
    } catch (error) {
      console.error('刷新Google访问令牌出错:', error);
      throw new Error(`刷新Google访问令牌失败: ${error.message}`);
    }
  }

  /**
   * 检查权限
   * @param {Object} credentials 凭证
   * @param {Array} requiredPermissions 需要的权限
   * @returns {Promise<boolean>} 是否满足
   */
  async checkPermissions(credentials, requiredPermissions) {
    try {
      // 使用访问令牌调用Google API验证权限
      const response = await axios.get(`${this.baseUrl}/oauth2/v3/userinfo`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('检查Google权限出错:', error);
      return false;
    }
  }

  /**
   * 获取用户信息
   * @param {Object} credentials 凭证
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(credentials) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth2/v3/userinfo`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('获取Google用户信息出错:', error);
      throw new Error(`获取Google用户信息失败: ${error.message}`);
    }
  }
}

module.exports = GoogleConnector;