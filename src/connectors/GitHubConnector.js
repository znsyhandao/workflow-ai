/**
 * GitHub连接器 - 作为GitHub API的访问接口
 */
const axios = require('../utils/axiosConfig');

class GitHubConnector {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/github/callback';
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * 获取GitHub授权链接
   * @returns {string} 授权链接
   */
  getAuthorizationUrl() {
    const baseUrl = 'https://github.com/login/oauth/authorize';
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo user'
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
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
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data.access_token) {
        return {
          accessToken: response.data.access_token,
          tokenType: response.data.token_type,
          scope: response.data.scope,
          expiresAt: Date.now() + 3600 * 1000 * 24 * 30 // 假设30天有效期
        };
      } else {
        throw new Error('获取GitHub访问令牌失败');
      }
    } catch (error) {
      console.error('获取GitHub访问令牌出错:', error);
      throw new Error(`获取GitHub访问令牌失败: ${error.message}`);
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
      // 验证令牌有效性
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `token ${credentials.accessToken}`
        }
      });

      // 检查是否有权限访问所需资源
      return response.status === 200;
    } catch (error) {
      console.error('检查GitHub权限出错:', error);
      return false;
    }
  }

  /**
   * 获取仓库信息
   * @param {Object} credentials 凭证
   * @param {string} owner 仓库所有者
   * @param {string} repo 仓库名称
   * @returns {Promise<Object>} 仓库信息
   */
  async getRepositoryInfo(credentials, owner, repo) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${credentials.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('获取GitHub仓库信息出错:', error);
      throw new Error(`获取GitHub仓库信息失败: ${error.message}`);
    }
  }

  /**
   * 获取仓库贡献者
   * @param {Object} credentials 凭证
   * @param {string} owner 仓库所有者
   * @param {string} repo 仓库名称
   * @returns {Promise<Array>} 贡献者列表
   */
  async getContributors(credentials, owner, repo) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contributors`, {
        headers: {
          'Authorization': `token ${credentials.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('获取GitHub贡献者出错:', error);
      throw new Error(`获取GitHub贡献者失败: ${error.message}`);
    }
  }
}

module.exports = GitHubConnector;