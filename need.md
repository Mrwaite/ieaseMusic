 1. 配置前端的开发环境，配置Nodejs 开发环境，安装相应的npm拓展包，熟悉Nodejs的使用以及相应web应用开发框架； 
 2. 编写爬虫代码对各大音乐排行网站具体排行信息进行爬取并保存到本地的数据库中，并实时的展示到平台首页的热门排行榜这一栏上； 
 3. 编写爬虫代码对各大主流的音乐播放网站的资源接口进行爬取获取歌曲播放接口，对于冷门的歌曲，实施资源在线拉取，保证用户打开的播放歌曲都能正确播放出来； 
 4. 对于众多的歌曲，提供多方位的搜索功能；
 5. 提供像是上下曲，播放模式的变更，等一系列基本的音乐播放功能 
 6. 对于用户的播放习惯，收集大量的数据，对数据进行归类，贴上标签等方法，每日对用户推荐相同类别的歌曲。 
 7. 使用 ant-design搭建响应式的网页，设计网页整体布局设计，并对数据库进行相应的设计； 
 8. 为保证系统的可用性，对整个系统进行数据测试，看是否存在漏洞，进一步完善系统。

Uncaught Exception:
[1] Error: Cannot find module '../NeteaseCloudMusicApi/router/album'
[1]     at Module._resolveFilename (module.js:485:15)
[1]     at Function.Module._resolveFilename (/home/mrwaite/test/ieaseMusic/node_modules/_electron@1.8.6@electron/dist/resources/electron.asar/common/reset-search-paths.js:35:12)
[1]     at Function.Module._load (module.js:437:25)
[1]     at Module.require (module.js:513:17)
[1]     at require (internal/module.js:11:18)
[1]     at Object.<anonymous> (/home/mrwaite/test/ieaseMusic/server/api.js:25:19)
[1]     at Object.<anonymous> (/home/mrwaite/test/ieaseMusic/server/api.js:279:3)
[1]     at Module._compile (module.js:569:30)
[1]     at loader (/home/mrwaite/test/ieaseMusic/node_modules/_babel-register@6.26.0@babel-register/lib/node.js:144:5)
[1]     at Object.require.extensions.(anonymous function) [as .js] (/home/mrwaite/test/ieaseMusic/node_modules/_babel-register@6.26.0@babel-register/lib/node.js:154:7)
