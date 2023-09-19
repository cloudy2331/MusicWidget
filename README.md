# Music-Widget

## 1.使用说明
---
目前可以使用两种模式，右键托盘图标打开设置面板，可以选择使用api或调用windows的SystemMediaTransportControls获取正在播放的媒体信息。

```
注意：
如果使用api模式，请填写完整的api地址，包括协议，例如"http://localhost:3000"，当前api模式需要使用播放列表面板进行操作，播放列表和播放控件尚未完成。
如果使用smtc模式，播放控件将被禁用。一般情况下，从切换歌曲到加载完成时间约为9秒。
```

## 2.SMTC核心
---
具体信息请参阅 https://github.com/cloudy2331/SmtcNetCore