# 素材来源与授权状态

所有文件在本地处理；本轮没有上传、购买、下载或托管素材。

## 用户提供的概念设计

| 原图 | 站内映射 | 授权状态 |
|---|---|---|
| ChatGPT 图像 2026年10月17日 19_45_58.png | concept-hurricane.png、concept-plate/strip/dark-hurricane.webp | 用户提供供本项目使用；商业传播权利未独立核验 |
| ChatGPT 图像 2026年10月17日 19_46_08.png | concept-nimbus.png、concept-plate/strip/dark-nimbus.webp | 同上 |
| ChatGPT 图像 2026年10月17日 19_46_25.png | concept-thunder.png、concept-plate/strip/dark-thunder.webp | 同上 |

三张完整原图均为 1448×1086，哈希与用户提供文件一致。派生图为旧版侧视裁图；不代表三维模型。图内参数属于概念设定。

## 自然素材与序列

plate-wind.webp、plate-cloud.webp、plate-storm.webp、plate-wind-streams.webp、plate-cloud-plate.webp、plate-cloud-sea.webp 沿用原项目提供的本地文件。项目旧记录称为用户提供，原始版权链未独立核验；不据此声称可公开商用。

v14 的序章前段由 work/flow-field.js 的多频势函数旋度场和同一组风带形变生成，再由 work/bake-flow.cjs 烘焙。风带至云团不靠两张照片互换。后段仍衔接原有雷暴影像，p-098 至 p-143 与 v13 一致。144 帧，1920×1080，约 4.33 MiB。程序化云为二维原型，不能称为真实体积渲染。

闪电几何由旧版 work/bolt.py 在 Blender 中本地生成，再用 bake-bolt.py 合成。源脚本无外部贴图。

## 保留的实车照片

以下出处和 CC0 许可来自旧交接记录，本轮未联网核验，因此授权状态为“历史记录待复核”。用于本地品牌气质参考，不冒充概念车实物。

| 文件 | 原始出处 | 旧记录作者与许可 |
|---|---|---|
| shot-a9l.webp | Wikimedia Commons: Chery Fulwin A9L MY2025 IMG02.jpg | Poprace / CC0（待复核） |
| shot-t11.webp | Wikimedia Commons: Chery Fulwin T11 001.jpg | JustAnotherCarDesigner / CC0（待复核） |
| shot-t7.webp | Wikimedia Commons: Chery Fulwin T7 003.jpg | JustAnotherCarDesigner / CC0（待复核） |
| mood-street.jpg | Wikimedia Commons: Chery Fulwin A9L 001.jpg | JustAnotherCarDesigner / CC0（待复核）；保留回退 |
| hurricane-a9l.jpg | 同 A9L MY2025 IMG02 | Poprace / CC0（待复核）；保留回退 |

## 品牌矢量

本地 fulwin.svg 沿用 v13 保存文件，原记录来源：https://fulwin.chery.cn/assets_Fulwin/images/common/logo.svg 。fulwin-cn.svg 与 fulwin-word.svg 通过 viewBox 分离中文和英文，未重新绘制字形。商标及图形权利归相应权利人；网站为非官方概念探索。

## 音乐

艾拉拉、Luv4《千年之后》，用户提供的本地 MP3。仅在本地离线演示中使用；商业或公开传播许可未核验。音乐默认不播放。

## 其他

风场、粒子与未来的参数化几何源代码均随项目制作，无未知付费素材或远程生成服务。自行编写的代码不等于取得参考设计、音乐或商标的商业授权。

## v16 原图分层

car-*-front.webp / side.webp / lamp-left.webp / lamp-right.webp 共 12 张，直接从用户提供三视图本地裁切并创建透明遮罩；灯组使用原图亮度提取，不改变车型造型。源映射见 cinema-source-crops.json。没有重新生成图像、上传用户素材或采用其他品牌车辆图片。

此前三维研究已停止并本地归档，不是当前站点素材或后续要求。用户给出的公开示例链接未作为站点图像使用。原三视图、实车参考和音乐的版权状态不因拆层而改变。

## v17 SVG 与风场合并

图形徽标：根据用户提供的 codex-clipboard-88fd6ef9-edd6-4f8b-978b-d4ebc7b716f1.png 轮廓本地矢量重绘。非官方规范母版。中文/英文官方字标原文件未改。

新风场：固定 seed 20261018 的程序化矢量流场，与 FULWIN-remake 源码相同；无旧栅格输入。保留的旧云雷、车型素材仍为原型，不宣称全量高清重制。

## v18 云生

全新Blender程序化体积密度与真实相机渲染，无照片、HDRI或外部纹理；EEVEE64采样网页序列、96采样原生检查帧，AgX/sRGB。图形标志与原有字标来源见v17。原始参考和音乐不变。

## v19 雷动

本地Blender程序化体积、固定种子的三维发光分叉路径、4个云内点光源与克制光晕合成。无照片、HDRI、外部纹理或上传。64采样网页序列、96采样原生检查图；原有图片、SVG字标和音乐来源保持。

## v20 云雷多幕

对现有原生体积帧做本地2.5D连续合成：云4幕、雷5幕；相邻帧混合、连续曲线运镜、前景遮罩及薄雾视差。没有重新建模或全4K影片。横竖31秒60fps合并预览及18个分幕视频见assets-remake/weather/previews，浏览器帧率尚未实测。旧制作章节为历史记录。

## v21 视频融合

6种镜头来自用户本地提供的8段视频，按联系表画面匹配，具体原件和SHA见assets/video/manifest.json。原片不改动；网页副本静音、短GOP、原生1080p及720p，不虚构4K或源60个真实运动帧/秒。新风云雷和车型主画面优先使用视频；旧CG、三视图、SVG和音乐保留。已有高分辨率街边、车库实车图替代此前模糊的氛围海报裁切；无新咖啡厅素材。全部处理本地完成，没有用户文件上传。图形徽标和官方字标来源仍见v17。此前v18–v20为历史制作记录。
