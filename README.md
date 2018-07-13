# GreedyStar
## CC游戏案例之 贪吃星球

## 注意: client是客户端代码文件,server是服务端代码文件

# client

## 环境准备

1. 下载安装[cocos creator](http://www.cocos.com/download)v1.8.1或以上版本
2. 可以不更新本项目使用的matchvs插件,如果想需要使用最新的插件,可以在cocos creator中下载插件,
对应的[教程](http://www.matchvs.com/service?page=creatorStart)

## 下载游戏

1. git clone https://github.com/matchvs/GreedyStar.git
2. 用cocos creator打开该项目GreedyStar下的client文件

## 运行游戏

###  web版体验

1. 打开之后,出现以下界面
![snipaste20180713_142203.png](./screenshot/snipaste20180713_142203.png)
2. 点击中上方的三角形按钮,即可运行游戏
3. 就可以愉快的玩耍了 

###  微信版体验

1. 在cocos creator打包输出微信小游戏项目,点击cocos creator上的导航栏中的项目
2. 在构建发布界面中,发布平台为"Wechat Game",填入appid(如果是你自己的项目,你需要在微信开发者平台中申请).
![snipaste20180713_142322.png](./screenshot/snipaste20180713_142322.png)
3. 点击构建,之后发布.
4. 用微信开发者工具打开.
![snipaste20180713_142751.png](./screenshot/snipaste20180713_142751.png)
5. 当我们写好的代码,我们发布到微信小游戏平台中
![snipaste20180713_142555.png](./screenshot/snipaste20180713_142555.png)
5. 就可以愉快的玩耍了

# server

server是使用了matchvs的gameServer,无须自己购买服务器,一键发布上线.

- [参考文档1](http://www.matchvs.com/service?page=jsGsStart)
- [参考文档2](http://www.matchvs.com/service?page=gameServer)