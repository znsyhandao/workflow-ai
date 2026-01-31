/**
 * 微信公众号工具 - 负责获取微信公众号数据
 */
const axios = require('axios');

class WechatTools {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    // 修复URL格式问题，移除多余的反引号
    this.baseUrl = process.env.WECHAT_BASE_URL || 'https://api.weixin.qq.com';
    this.accessToken = null;
    this.tokenExpireTime = 0;
    
    // 添加微信开发者平台相关配置
    this.developerPlatformBaseUrl = process.env.WECHAT_DEVELOPER_PLATFORM_URL || 'https://open.weixin.qq.com';
    
    // 添加回调地址配置
    this.redirectUri = process.env.WECHAT_REDIRECT_URI || 'https://example.com/wechat/callback';
    
    // 开发模式配置
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * 获取微信公众号访问令牌
   * @returns {Promise<string>} 访问令牌
   */
  async getAccessToken() {
    try {
      // 开发模式：使用模拟的访问令牌
      if (this.isDevelopment) {
        console.log('开发模式：使用模拟的微信访问令牌');
        return 'mock_access_token';
      }

      // 如果已有令牌且未过期，直接使用
      if (this.accessToken && this.tokenExpireTime > Date.now()) {
        return this.accessToken;
      }

      // 从微信服务器获取新令牌
      const response = await axios.get(`${this.baseUrl}/cgi-bin/token`, {
        params: {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret
        },
        timeout: 10000
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 令牌有效期通常为2小时，提前5分钟刷新
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
        
        console.log('成功获取微信公众号访问令牌');
        return this.accessToken;
      } else {
        throw new Error('获取访问令牌失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('获取微信公众号访问令牌出错:', error);
      throw new Error(`获取微信公众号访问令牌失败: ${error.message}`);
    }
  }

  /**
   * 获取公众号文章列表
   * @param {number} offset 偏移量
   * @param {number} count 数量
   * @returns {Promise<Object>} 文章列表
   */
  async getArticleList(offset = 0, count = 10) {
    try {
      // 开发模式：返回模拟数据
      if (this.isDevelopment) {
        console.log('开发模式：返回模拟的公众号文章列表');
        return {
          total_count: 2,
          item_count: 2,
          item: [
            {
              media_id: 'media_001',
              content: {
                news_item: [
                  {
                    title: 'AI生命算法研究的最新进展',
                    author: 'AI生命算法研究',
                    digest: '探讨AI与生命科学的融合',
                    content: '这是一篇关于AI生命算法研究的文章...',
                    url: 'https://example.com/article/1',
                    thumb_media_id: 'thumb_001'
                  }
                ]
              },
              update_time: 1769568579
            },
            {
              media_id: 'media_002',
              content: {
                news_item: [
                  {
                    title: 'AI如何影响生命科学研究',
                    author: 'AI生命算法研究',
                    digest: '分析AI在生命科学领域的应用',
                    content: '这是一篇关于AI在生命科学领域应用的文章...',
                    url: 'https://example.com/article/2',
                    thumb_media_id: 'thumb_002'
                  }
                ]
              },
              update_time: 1769568579
            }
          ]
        };
      }

      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/cgi-bin/material/batchget_material`, {
        type: 'news',
        offset,
        count
      }, {
        params: { access_token: token },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('获取公众号文章列表出错:', error);
      throw new Error(`获取公众号文章列表失败: ${error.message}`);
    }
  }

  /**
   * 获取文章统计数据
   * @param {string} articleId 文章ID
   * @param {string} startDate 开始日期 (YYYY-MM-DD)
   * @param {string} endDate 结束日期 (YYYY-MM-DD)
   * @returns {Promise<Object>} 统计数据
   */
  async getArticleStatistics(articleId, startDate, endDate) {
    try {
      // 开发模式：返回模拟数据
      if (this.isDevelopment) {
        console.log('开发模式：返回模拟的文章统计数据');
        return {
          list: [
            {
              ref_date: startDate.replace(/-/g, ''),
              msgid: articleId,
              title: 'AI生命算法研究的最新进展',
              int_page_read_user: 1500,
              int_page_read_count: 2800,
              share_user: 350,
              share_count: 520,
              add_to_fav_user: 80,
              add_to_fav_count: 120
            }
          ]
        };
      }

      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/datacube/getarticlesummary`, {
        begin_date: startDate.replace(/-/g, ''),
        end_date: endDate.replace(/-/g, '')
      }, {
        params: { access_token: token },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('获取文章统计数据出错:', error);
      throw new Error(`获取文章统计数据失败: ${error.message}`);
    }
  }

  /**
   * 获取公众号用户数据
   * @param {string} startDate 开始日期 (YYYY-MM-DD)
   * @param {string} endDate 结束日期 (YYYY-MM-DD)
   * @returns {Promise<Object>} 用户数据
   */
  async getUserStatistics(startDate, endDate) {
    try {
      // 开发模式：返回模拟数据
      if (this.isDevelopment) {
        console.log('开发模式：返回模拟的用户统计数据');
        return {
          list: [
            {
              ref_date: startDate.replace(/-/g, ''),
              cumulate_user: 8500
            },
            {
              ref_date: endDate.replace(/-/g, ''),
              cumulate_user: 9200
            }
          ]
        };
      }

      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/datacube/getusercumulate`, {
        begin_date: startDate.replace(/-/g, ''),
        end_date: endDate.replace(/-/g, '')
      }, {
        params: { access_token: token },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('获取用户统计数据出错:', error);
      throw new Error(`获取用户统计数据失败: ${error.message}`);
    }
  }

  /**
   * 搜索微信公众号文章
   * @param {string} keyword 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  async searchArticles(keyword) {
    try {
      // 注意：微信公众号API不支持直接搜索文章，这里使用模拟数据
      console.log(`搜索微信公众号文章: ${keyword}`);
      
      // 返回模拟数据
      return {
        articles: [
          {
            title: `关于${keyword}的文章`,
            author: '测试公众号',
            publish_time: '2024-01-01 10:00:00',
            read_count: 1000,
            like_count: 50,
            comment_count: 10
          },
          {
            title: `${keyword}最新研究`,
            author: '测试公众号',
            publish_time: '2024-01-02 14:30:00',
            read_count: 1500,
            like_count: 80,
            comment_count: 20
          }
        ]
      };
    } catch (error) {
      console.error('搜索文章出错:', error);
      throw new Error(`搜索文章失败: ${error.message}`);
    }
  }

  /**
   * 获取公众号基本信息
   * @returns {Promise<Object>} 公众号信息
   */
  async getAccountInfo() {
    try {
      // 开发模式：返回模拟数据
      if (this.isDevelopment) {
        console.log('开发模式：返回模拟的公众号基本信息');
        return {
          accountName: 'AI生命算法研究',
          originalId: 'gh_1234567890abc',
          appId: this.appId,
          avatarUrl: 'https://example.com/avatar.jpg',
          description: '研究AI与生命科学交叉领域的最新进展',
          qrCodeUrl: 'https://example.com/qrcode.jpg',
          verified: true,
          verifiedType: 1, // 1: 认证媒体 2: 认证企业 3: 认证政府
          serviceType: 0 // 0: 订阅号 1: 服务号
        };
      }

      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseUrl}/cgi-bin/account/getaccountbasicinfo`, {
        params: {
          access_token: token
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('获取公众号基本信息出错:', error);
      throw new Error(`获取公众号基本信息失败: ${error.message}`);
    }
  }

  /**
   * 获取微信开发者平台管理链接
   * @returns {string} 开发者平台管理链接
   */
  getDeveloperPlatformUrl() {
    return `${this.developerPlatformBaseUrl}/cp/frame?t=cp/wxopen/widgetlink`;
  }

  /**
    * 获取微信公众号授权链接
    * @param {string} redirectUri 授权回调地址
    * @param {string} scope 授权范围
    * @param {string} state 状态参数
    * @returns {string} 授权链接
    */
   getAuthorizationUrl(redirectUri = this.redirectUri, scope = 'snsapi_base', state = 'default_state') {
     const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';
     const params = {
       appid: this.appId,
       redirect_uri: encodeURIComponent(redirectUri),
       response_type: 'code',
       scope: scope,
       state: state
     };
     
     const queryString = Object.entries(params)
       .map(([key, value]) => `${key}=${value}`)
       .join('&');
     
     return `${baseUrl}?${queryString}#wechat_redirect`;
   }

   /**
    * 通过授权码获取访问令牌
    * @param {string} code 授权码
    * @returns {Promise<Object>} 访问令牌信息
    */
   async getAccessTokenByCode(code) {
     try {
       const response = await axios.get(`${this.baseUrl}/sns/oauth2/access_token`, {
         params: {
           appid: this.appId,
           secret: this.appSecret,
           code: code,
           grant_type: 'authorization_code'
         },
         timeout: 10000
       });

       if (response.data && response.data.access_token) {
         // 保存访问令牌
         this.accessToken = response.data.access_token;
         this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
         
         return {
           access_token: response.data.access_token,
           refresh_token: response.data.refresh_token,
           openid: response.data.openid,
           scope: response.data.scope,
           expires_in: response.data.expires_in,
           expiresAt: this.tokenExpireTime
         };
       } else {
         throw new Error('获取访问令牌失败: ' + JSON.stringify(response.data));
       }
     } catch (error) {
       console.error('通过授权码获取访问令牌出错:', error);
       throw new Error(`通过授权码获取访问令牌失败: ${error.message}`);
     }
   }

   /**
    * 检查API权限状态
    * @returns {Promise<Object>} 权限状态
    */
   async checkApiPermissions() {
    try {
      // 开发模式：直接返回权限已通过
      if (this.isDevelopment) {
        return {
          success: true,
          message: '开发模式：跳过权限检查',
          needAuthorization: false
        };
      }

      // 如果没有配置AppID和AppSecret，直接返回需要授权
      if (!this.appId || !this.appSecret) {
        return {
          success: false,
          message: '缺少微信公众号配置',
          needAuthorization: true,
          authorizationUrl: this.getAuthorizationUrl(),
          recommendation: '请配置微信公众号AppID和AppSecret'
        };
      }

      const token = await this.getAccessToken();
      
      // 调用获取接口权限列表API（需要相应权限）
      const response = await axios.get(`${this.baseUrl}/cgi-bin/get_api_authority_info`, {
        params: {
          access_token: token
        },
        timeout: 10000
      });

      // 检查是否有权限获取文章数据
      if (response.data && response.data.api_authority_infos) {
        const hasArticlePermission = response.data.api_authority_infos.some(
          api => api.api_name === 'getarticlesummary' && api.status === 1
        );

        if (!hasArticlePermission) {
          return {
            success: false,
            message: '缺少微信公众号文章数据权限',
            needAuthorization: true,
            authorizationUrl: this.getAuthorizationUrl(),
            developerPlatformUrl: this.getDeveloperPlatformUrl(),
            recommendation: '请在微信开发者平台申请文章数据接口权限'
          };
        }
      }

      return {
        success: true,
        message: 'API权限检查通过',
        data: response.data
      };
    } catch (error) {
      console.error('检查API权限状态出错:', error);
      
      // 根据错误类型提供不同的处理建议
      let message = 'API权限检查失败';
      let needAuthorization = false;
      
      if (error.message.includes('40013') || error.message.includes('invalid appid')) {
        message = '无效的微信公众号AppID';
        needAuthorization = true;
      } else if (error.message.includes('40001') || error.message.includes('invalid credential')) {
        message = '无效的微信公众号AppSecret';
        needAuthorization = true;
      } else if (error.message.includes('48001') || error.message.includes('api unauthorized')) {
        message = '微信公众号API权限不足';
        needAuthorization = true;
      }
      
      return {
        success: false,
        message: message,
        error: error.message,
        needAuthorization: needAuthorization,
        authorizationUrl: needAuthorization ? this.getAuthorizationUrl() : undefined,
        developerPlatformUrl: this.getDeveloperPlatformUrl(),
        recommendation: needAuthorization ? '请检查微信公众号配置或申请相应权限' : '请检查网络连接或稍后重试'
      };
    }
  }
}

module.exports = WechatTools;