# v22 视觉融合更新

品牌样式：assets/css/brand.css，同时用于index.html与concept.html。正文品牌文字保留正常基线，SVG绝对定位于其上方。动态章节标题由site.js的has-brand-name配套样式控制。

视频融合：video-scenes.js为车型创建media-surface（原比例）及后两款车型的media-atmosphere；video.css对真实图像边缘作双轴遮罩。环境底色采用当前邻近静帧的模糊层。新brand-visual各层使用现有--t作轻微位移，阅读/减少动态模式停止位移。

验证及打包入口：work/visual-v22/verify.py、mount-check.cjs、finalize.py。blend-study.cjs是原生构图研究，不代表浏览器渲染验收。

# FULWIN 视频融合开发说明 · v21

直接打开index.html，无构建、服务器或网络依赖。继续使用原生HTML/CSS/JavaScript、固定舞台和唯一滚动时钟，没有引入GSAP或新框架。七个物理层承载十个逻辑ACT；侧栏、键盘左右键、Home/End均按十幕导航。

配置入口：assets/js/cinematic-assets.js。所有新视频路径、移动版、静帧、实际来源、帧率、阶段文案、scrollMap、雷光窗口、尾部收暗、开场范围及混合窗口、章节权重与演示时长集中在此。assets/video/manifest.json是带来源和编码校验信息的审计版本。替换素材时先核对真实内容，不能按名称猜测车型；无对应资产时设为null，保留原场景。修改运行时映射无需重新搭建项目。

控制器：assets/js/scroll-video.js，接口FulwinScrollVideo.create(video,{source,fps,flashWindow,onFrame,onStatus})，返回set(progress,{active,warm,static})、release()、retry()及stats。视频始终暂停，由单个rAF合并最新目标；一次只进行一个seek，seeked后响应最新目标。固定24fps真实源帧时基，避免重复currentTime写入。没有闲置播放循环，解码错误或超时回到静帧；跨雷光窗口倒滚会阻止陈旧雷光再次显示。

场景适配：assets/js/video-scenes.js只消费既有主时间线的进度和可见度。当前镜头激活、下一镜头预热metadata，远离章节后2.2秒移除video src并load释放资源。隐藏页面停止调度，减少动态效果不加载/定位视频。风视频在旧Canvas上方，云、雷及品牌层级递增；现有原生风场作为开场并自然交接到风视频。提供视频时不再额外解码旧云雷序列。车型以contain保持主体，飓风后段用干净遮罩交到原侧面设计参照，不做二维假转车。

原片/转码：work/audit-seedance.py扫描及生成联系表；work/prepare-seedance.py保留源文件、生成短GOP副本与静帧并输出配置。使用本机FFmpeg/ffprobe路径work/qa/remake-environment.json。运行前先根据新文件修改audit脚本中的输入路径及prepare脚本的内容映射，保留所有原片。脚本针对本批121帧/约5秒素材，使用setpts=N/(24*TB)、H.264 CRF18、GOP6、bf0、faststart、无音轨，不进行源分辨率以上放大；新素材若有不同真实时基，需同步调整转码fps与运行配置。

验证：work/verify-seedance.py执行源哈希、完整解码、帧数/格式、关键帧、faststart、正反向随机定位和源帧压缩对比；Native CLI计时包含进程启动，不能当浏览器延迟。work/scroll-video-policy.cjs与work/video-scenes-policy.cjs检查调度、失败、逆向、雷光、预热/释放、读取模式及映射；其余16组保留旧场景、图库和音乐回归。

浏览器工具此前拒绝本地URL，未绕过；本轮没有浏览器真实帧率、触屏和跨浏览器视觉验收，不能宣称已达到60FPS。用户打开本地网页后仍需实机观察快速倒滚、尺寸变更、暗部色带和主体位置。现有图形徽标是之前依用户截图重绘的SVG，不冒称官方母版；中英文原始矢量字标保持。

回滚：v20完整交付备份在E:/FULWIN-local-render-cache/v20-delivery-backup；修改前代码在work/seedance/v20-code。旧原生CG独立研究页仍保留在相邻FULWIN-remake，属于历史资料。新主站不依赖Blender、raw PNG缓存或旧研究页。
