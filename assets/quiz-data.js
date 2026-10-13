/* 泳池水质人格 · 题库与结果模型（从 v1 原型抽取，勿手改结构）
   暴露到 window.PoolQuiz */
(function(global){
'use strict';

const DIMS = {
  A:{ name:'余氯自律度', short:'余氯' },
  B:{ name:'循环持久力', short:'循环' },
  C:{ name:'清澈感知力', short:'清澈' },
  D:{ name:'负荷承载力', short:'负荷' },
  E:{ name:'突发应变力', short:'应变' }
};

/* ---------- 题库：30 道行为题 + 3 道误区识别题 ---------- */
const QUESTIONS = [
/* ===== A 余氯自律度：消毒剂管理的规律性 ===== */
{id:'A1',dim:'A',quick:1,t:'你多久测一次池水的余氯？',o:[
 ['每天开馆前和客流高峰各测一次，有读数记录',3],
 ['每天测一次，大致心里有数',2],
 ['一周测两三次，想起来就测',1],
 ['基本不测，靠眼睛看水清不清',0]]},
{id:'A2',dim:'A',t:'决定"该加药了"的时候，你主要依据什么？',o:[
 ['看检测试剂的读数，或者在线监测仪的数值',3],
 ['按固定周期加，比如每天闭馆后加一次',2],
 ['看水有点不透亮了就补一点',1],
 ['客人说水不太好，才去加',0]]},
{id:'A3',dim:'A',t:'你清楚自己池水的游离余氯大概在什么范围吗？',o:[
 ['清楚，长期稳定在 0.3–1.0 mg/L 之间',3],
 ['大概在 1.0–2.0 之间，宁多不少',2],
 ['波动挺大，说不准',1],
 ['完全不知道',0]]},
{id:'A4',dim:'A',quick:1,t:'消毒剂的投加量，你是怎么定的？',o:[
 ['按池水体积和余氯读数计算投加量，并记在台账上',3],
 ['按平时经验估个大概的量',2],
 ['看还剩多少药，随手倒一些',1],
 ['想起来了就投一点',0]]},
{id:'A5',dim:'A',t:'加药泵、投药设备平时怎么维护？',o:[
 ['有定期保养计划，关键设备有备机',3],
 ['半年左右清理检查一次',2],
 ['出故障了才去管',1],
 ['没装加药泵，全靠人撒药',0]]},
{id:'A6',dim:'A',quick:1,t:'你的池子多久补充一次新水（含反冲洗排水后的补水）？',o:[
 ['每天补水，并定期做部分换水',3],
 ['每周补一两次水',2],
 ['只在蒸发明显、水位下降时才补',1],
 ['基本只补蒸发掉的水，从没主动换过水',0]]},

/* ===== B 循环持久力：水力与过滤系统的持续性 ===== */
{id:'B1',dim:'B',quick:1,t:'循环泵每天开多长时间？',o:[
 ['24 小时连续循环，或按水质自动控制启停',3],
 ['开 10–16 小时，高峰和旺季会延长',2],
 ['开 6–8 小时，白天开、晚上关',1],
 ['有人来游才开',0]]},
{id:'B2',dim:'B',t:'你算过自己池子的循环周期吗（池容积 ÷ 泵流量）？',o:[
 ['算过，能对上国家对循环周期的要求',3],
 ['知道泵的流量和池子水量，心里有数',2],
 ['只记得泵的牌子，别的没管',1],
 ['循环周期是什么？',0]]},
{id:'B3',dim:'B',quick:1,t:'过滤系统的反冲洗，你是怎么安排的？',o:[
 ['看压差表或流量下降就及时反冲，有记录',3],
 ['按固定周期做，比如每周一次',2],
 ['感觉水不太好了就冲一下',1],
 ['一年也冲不了几次',0]]},
{id:'B4',dim:'B',t:'池底、池壁的吸污清洁情况？',o:[
 ['定期用吸污机或水下机器人，池底基本看不到沉积物',3],
 ['一周清一次',2],
 ['水看着浑了才清',1],
 ['基本没管过',0]]},
{id:'B5',dim:'B',quick:1,t:'池内的回水口、布水口、格栅、溢流沟，你关注吗？',o:[
 ['定期检查，没有堵塞，池内水量分布均匀',3],
 ['偶尔清一清',2],
 ['堵了再说',1],
 ['不太注意这些东西在哪',0]]},
{id:'B6',dim:'B',t:'水泵或配电出故障时，你这边是什么情况？',o:[
 ['有备用泵可以切换，巡检也有记录',3],
 ['有备件，坏了直接换',2],
 ['坏了只能停业等维修',1],
 ['先停着，反正最近客流不大',0]]},

/* ===== C 清澈感知力：观察、检测与记录能力 ===== */
{id:'C1',dim:'C',quick:1,t:'"水够不够清"，你靠什么判断？',o:[
 ['用浊度试纸或浊度仪测，知道具体读数',3],
 ['看深水区能不能一眼看清池底最远处的排水口',2],
 ['看水蓝不蓝、亮不亮',1],
 ['没想过这个还能测',0]]},
{id:'C2',dim:'C',quick:1,t:'你知道自己池水的 pH 是多少吗？',o:[
 ['经常测，稳定控制在 7.0–7.8',3],
 ['偶尔测，大概在 7 左右',2],
 ['只知道偏酸偏碱都不好',1],
 ['没测过 pH',0]]},
{id:'C3',dim:'C',t:'水有点变化的苗头，你能提前看出来吗？',o:[
 ['能。我有固定的观察点，比如深水区能见度和水面泡沫',3],
 ['明显变化能看出来',2],
 ['客人说了才知道',1],
 ['平时没留意',0]]},
{id:'C4',dim:'C',t:'关于"水清不清"的标准，你了解多少？',o:[
 ['知道国家对能见度有要求，要能看清池底最深处',3],
 ['知道大概要清，但说不上具体标准',2],
 ['只是凭感觉',1],
 ['不知道还有标准',0]]},
{id:'C5',dim:'C',quick:1,t:'你有水质台账或记录吗？',o:[
 ['有纸质或电子台账，每天记录读数和处理动作',3],
 ['偶尔想起来记一下',2],
 ['只在检查前那几天补一补',1],
 ['没有台账',0]]},
{id:'C6',dim:'C',t:'你说"我这儿水质没问题"，底气来自哪里？',o:[
 ['有第三方检测报告，加上日常自测数据',3],
 ['卫生监督检查都能过',2],
 ['客人从来没投诉过',1],
 ['说实话心里有点没底',0]]},

/* ===== D 负荷承载力：泳客负荷与有机污染的管理 ===== */
{id:'D1',dim:'D',quick:1,t:'你的池子每天接待的泳客量，相对池水体积算多吗？',o:[
 ['远低于设计承载量，很宽松',3],
 ['基本合适',2],
 ['高峰期明显超载',1],
 ['长期超载，夏天尤其严重',0]]},
{id:'D2',dim:'D',quick:1,t:'"先淋浴再下水"这条，执行得怎么样？',o:[
 ['有专人引导或闸机，执行得比较严格',3],
 ['有提示牌，多数人会冲一下',2],
 ['有牌子但基本没人管',1],
 ['没有这个环节',0]]},
{id:'D3',dim:'D',t:'泳客带来的汗液、尿液这些氨氮负荷，你怎么应对？',o:[
 ['靠持续稳定的余氯，加上定期做冲击氯处理',3],
 ['靠定期大量换水稀释',2],
 ['靠多加消毒剂压住',1],
 ['没有专门应对，靠水自己消化',0]]},
{id:'D4',dim:'D',quick:1,t:'户外池用的稳定剂（氰尿酸）问题，你了解吗？',o:[
 ['知道三氯片会让氰尿酸累积，会通过换水稀释控制在合理范围',3],
 ['听说过氰尿酸这个词，但没测过',2],
 ['一直用三氯异氰尿酸片，没考虑过累积的问题',1],
 ['不知道什么是氰尿酸',0]]},
{id:'D5',dim:'D',t:'到了夏季客流高峰，你的做法是？',o:[
 ['提前加大循环量、增加补水、加密检测，并做冲击氯处理',3],
 ['多换一点水',2],
 ['加点药顶一顶',1],
 ['照常运行，撑过去',0]]},
{id:'D6',dim:'D',t:'关于"不该下水的人"的管理（腹泻、皮肤病、婴幼儿如厕等）？',o:[
 ['有明确制度并执行，包括婴幼儿泳裤等要求',3],
 ['有提示但执行不严',2],
 ['全靠泳客自觉',1],
 ['没有这方面的管理',0]]},

/* ===== E 突发应变力：水质事故的处置与复盘 ===== */
{id:'E1',dim:'E',quick:1,t:'池水一夜之间发浑甚至发绿，你第一件事做什么？',o:[
 ['先测余氯、pH 和氰尿酸，判断原因再定方案',3],
 ['立刻做一次冲击氯处理，同时把循环开到最大',2],
 ['先猛加氯，把情况压下去',1],
 ['停业，等专业人员来处理',1]]},
{id:'E2',dim:'E',t:'客人反映"水有味、游完眼睛红"，你怎么处理？',o:[
 ['测结合氯，做折点氯化（冲击处理），同时加强循环和通风换气',3],
 ['加强循环，延长水泵运行时间',2],
 ['加点澄清剂或除味剂压一下',1],
 ['加大氯的投加量，把味道压住',0]]},
{id:'E3',dim:'E',t:'你有书面的水质应急处理预案吗？',o:[
 ['有，涵盖水变绿、设备故障、群体投诉、指标超标等情形',3],
 ['心里有数，没写下来',2],
 ['去年碰到过一次，现场想办法解决的',1],
 ['没想过这个问题',0]]},
{id:'E4',dim:'E',quick:1,t:'冲击氯处理（折点氯化）你做过吗？',o:[
 ['做过，按计算量一次投足，之后检测确认效果',3],
 ['做过，但基本凭感觉投',2],
 ['听说过，没实际操作过',1],
 ['没听说过这个词',0]]},
{id:'E5',dim:'E',t:'水发浑需要沉降处理时，你用什么办法？',o:[
 ['用絮凝剂（如聚合氯化铝）配合静置、吸污，流程规范',3],
 ['只用澄清剂，不做后续吸污',2],
 ['听说过絮凝，没系统地做过',1],
 ['不知道絮凝是怎么回事',0]]},
{id:'E6',dim:'E',quick:1,t:'处理完一次水质问题后，你会复盘吗？',o:[
 ['会记录原因和改进措施，尽量不再犯',3],
 ['事后会想一想，但没有记录',2],
 ['处理完就翻篇了',1],
 ['每次情况都差不多，已经习惯了',0]]}
];

/* ---------- 3 道误区识别题：不计入维度分，单独算"内行指数" ---------- */
const MISTAKES = [
 { id:'M1',
   q:'"池水闻起来有很明显的氯味，说明消毒做得很到位。"这句话对吗？',
   o:[['对，氯味就是消毒味，越浓越干净',1],['不对，那多半是氯胺味，恰恰说明结合氯超标',2],['不一定，得看当天人多不多',0]],
   verdict:'不对。那股味不是"消毒味"，是"氯胺味"。',
   exp:'游离氯和水里的氨（来自汗液、尿液、皮屑）结合，会生成一氯胺、二氯胺、三氯胺。它们的杀菌力只有游离氯的百分之一量级，却对眼睛和呼吸道刺激性更强。所以客人闻到的"泳池味"，其实是水质偏脏的信号，而不是干净的证明。想消除它，不能用"再加点氯"慢慢来——需要做折点氯化（冲击处理），投加量通常要达到结合氯的 8–10 倍，一次投足。投不够反而更臭。' },
 { id:'M2',
   q:'"余氯读数越高，水质就越安全。"这句话对吗？',
   o:[['对，多加点氯总没坏处',1],['不对。余氯长期高于 1.0 mg/L 会刺激皮肤眼睛，还可能推动氯胺生成',2],['看情况，人多的日子高点没关系',0]],
   verdict:'不对。余氯不是越高越好，是"越稳越好"。',
   exp:'国家标准对人工游泳池游离性余氯的要求是 0.3–1.0 mg/L，这个区间的设计逻辑是"够杀菌、又不伤人"。读数长期在 2–3 mg/L，客人会觉得眼睛红、皮肤痒、头发干；同时多余的游离氯会加速与氨氮反应，生成更多氯胺。真正该盯的不是瞬时高低，而是波动幅度——能稳定在 0.5–0.8 之间的池子，才是好水。' },
 { id:'M3',
   q:'"一直用三氯异氰尿酸消毒片，余氯稳定就没问题。"这句话对吗？',
   o:[['对，稳定就说明水质没问题',1],['不完整。三氯片会持续累积氰尿酸，浓度过高会"锁氯"',2],['不知道，没想过这个问题',0]],
   verdict:'不完整。三氯片有个隐藏代价：氰尿酸累积。',
   exp:'三氯异氰尿酸片是国内户外池最常用的消毒剂，它自带氰尿酸（CYA）作为紫外线稳定剂，能让余氯在阳光下不被快速分解，这本身是优点。但 CYA 不会自己消失，只会随着投药不断累积。当它升到 50–100 mg/L 以上，会出现"锁氯"现象：试纸测出的余氯读数正常，实际杀菌能力却大幅下降，水照样会变绿。降 CYA 只有一个办法——换水稀释。所以户外池定期部分换水，不是浪费，是必需。' }
];

/* ---------- 七个结果类型 ---------- */
const TYPES = {
  juanwang:{
    key:'juanwang', name:'水界卷王', sub:'你的池子，比你还自律。',
    accent:'#0E8FA8', accentL:'#E1F4F8',
    portrait:[
      ['自由余氯','长期稳定在 0.3–0.8 mg/L，几乎不波动'],
      ['清澈度','浊度常年低于 0.5 NTU，深水区一眼见底'],
      ['循环','水泵连续运行，过滤系统有保养记录'],
      ['氯胺','基本检测不到，没有"泳池味"'],
      ['管理','有台账、有预案、有复盘']],
    theory:{t:'为什么"稳"比"高"更重要',
      p:['你的池子赢在<b>波动幅度小</b>。很多人把注意力放在"余氯够不够高"，但真正决定水质观感的，是三个量能不能同时稳住：<b>余氯、pH、循环时长</b>。余氯在 0.3–1.0 mg/L 之间平稳运行，说明投药量和池水的氯消耗速度基本匹配；pH 稳在 7.0–7.8，说明总碱度在合理区间，水不容易"翻"。',
         '一个很少被提及的指标是 <b>ORP（氧化还原电位）</b>。它比余氯更能反映真实的杀菌能力，因为余氯读数会被 pH 和氰尿酸影响。行业内一般认为 ORP 维持在 750 mV 以上，消毒能力就是充足的。你这种池子，通常是 ORP 最稳的那一类。']},
    advice:[
      ['把"人盯"升级成"系统盯"','加装在线余氯/pH 监测 + 自动投药，让夜间和节假日也有人替你看着。',''],
      ['开始记录 ORP','有余氯读数还不够，ORP 才能告诉你真实杀菌力。有余力可以配一支手持 ORP 笔。',''],
      ['把数据变成资产','连续 30 天的水质记录，是你对外报价和竞标时最有说服力的材料。','']]},

  buyap:{
    key:'buyap', name:'补药狂魔', sub:'你把泳池养成了药罐子。',
    accent:'#C98A1E', accentL:'#FCF0D6',
    portrait:[
      ['自由余氯','长期高于 1.0 mg/L，经常到 2–3 mg/L'],
      ['客人反馈','眼睛红、皮肤痒、头发干、进馆先闻到味'],
      ['氯胺','结合氯偏高，气味明显'],
      ['管理心态','宁可多投，不能出事'],
      ['真正的问题','把"消毒"当成了唯一手段']],
    theory:{t:'那股"泳池味"，其实是脏的信号',
      p:['<b>余氯不是越多越好。</b>游离氯高于 1.0 mg/L 时，对黏膜和皮肤的刺激会明显上升。但更关键的问题藏在气味里——多余的游离氯会与泳客带入的<b>氨氮</b>（汗液、尿液、皮屑）结合，生成<b>氯胺</b>（一氯胺、二氯胺、三氯胺）。',
         '氯胺的杀菌力只有游离氯的百分之一量级，刺激性却更强，是"游泳后眼睛红、喉咙痒"的主要元凶。所以你闻到的味越重，通常说明水里的有机负荷越高——<b>不是干净，是脏</b>。',
         '要把它去掉，不能靠"一点点加"。正确的做法是<b>折点氯化（冲击处理）</b>：先测结合氯，再投加约其 8–10 倍的游离氯，把氯胺一次性氧化分解掉，然后检测确认。<b>投不够量，反而会生成更多二氯胺和三氯胺，味道更冲。</b>']},
    advice:[
      ['先测"结合氯"，别再只测游离氯','结合氯超过 0.2–0.5 mg/L，就该安排冲击处理了。这一步能立刻解释掉客人的大部分投诉。',''],
      ['做一次真正的折点氯化','按计算量一次投足，投完保持循环，48 小时后复测结合氯。切勿少量多次。',''],
      ['把余氯目标下调到 0.5–0.8','在保证杀菌力的前提下，把目标区间降下来。客人的体感会立刻变好，投诉率跟着降。','free']]},

  laoganbu:{
    key:'laoganbu', name:'老干部池', sub:'不惊艳，但十年没出过事。',
    accent:'#4A8C9E', accentL:'#E7F1F4',
    portrait:[
      ['余氯','基本稳定在 0.5 mg/L 左右，能过检查'],
      ['清澈度','符合要求，但说不上透亮'],
      ['循环','运行规律，老设备但没坏过'],
      ['风格','靠经验和习惯维持，没太多数据'],
      ['评价','没有惊喜，也没有惊吓']],
    theory:{t:'"合格"和"优质"之间，隔着 0.5 NTU',
      p:['国家标准对游泳池水浑浊度的限值是 <b>≤1 NTU</b>——这是<b>底线，不是天花板</b>。很多老池子长期在 0.8–1.0 之间徘徊，检查没问题，但客人一进馆就觉得"这儿的水一般"。把浊度压到 0.5 以下，观感会有质的变化，成本却往往只是把过滤和循环做得更规律一点。',
         '你的池子能稳定这么多年，很可能是因为<b>总碱度</b>和<b>钙硬度</b>恰好落在一个舒服的区间（总碱度一般建议 80–120 mg/L）。碱度像水的"缓冲垫"，它能防止 pH 因为一点药剂就剧烈跳动；这也是为什么有些新池子设备更先进，却反而更容易"翻"——底子没调好。',
         '你缺的不是经验，是<b>把经验变成数据</b>。']},
    advice:[
      ['算一次 LSI（朗格利尔饱和指数）','用 pH、水温、钙硬度、总碱度、TDS 五个数算。它能告诉你池水是偏"结垢"还是偏"腐蚀"——这两个方向都会慢慢毁掉设备和池壁。',''],
      ['把余氯波动压进 ±0.1','现在的稳定是"人稳"，目标是"数值稳"。连续记录两周，你会看到之前没注意到的规律。',''],
      ['做一次过滤系统体检','老池子最大的隐性损失在过滤效率下降，而不是药剂。反冲洗后的初始压差是判断依据。','free']]},

  yishi:{
    key:'yishi', name:'仪式感管家', sub:'设备全套，试纸过期。',
    accent:'#7E6BB5', accentL:'#EFECF8',
    portrait:[
      ['设备','有加药机、有检测仪，投入不少'],
      ['数据','读数说不准，台账只存在于检查前'],
      ['强项','某个维度做得相当好，甚至是全场最强'],
      ['短板','另一个维度几乎完全空白'],
      ['典型表现','拍照发过"水质检测合格"，但没测过氰尿酸']],
    theory:{t:'泳池管理真正的失效点，不在设备，在闭环',
      p:['很多场馆的投入并不少：自动投药机、水质检测仪、循环泵全都有。但水质依旧不稳。原因通常不是设备不行，而是<b>闭环缺了环节</b>。',
         '一个有效的运维闭环只有四步：<b>检测 → 记录 → 调整 → 复测</b>。缺任何一步，设备都只是道具。有投药设备但没有投加量控制，等于没有；有检测仪但没有连着记录，数据就变成了一次性的数字；有记录但不复测，就永远不知道调整有没有效果。',
         '你的优势很明确：<b>你不是不上心，是没形成习惯</b>。而这个差距是七个类型里最容易补上的——不需要花钱，只需要连续 14 天的三个数。']},
    advice:[
      ['只记三个数，连续 14 天','余氯、pH、当天循环小时数。不求全，只求连续。做完你会发现自己的池子有节奏。','free'],
      ['让每一次投药都能被验证','投完药后 30 分钟复测一次，记录变化量。几次之后你就能算出自己池子的"氯消耗速度"，投加量从此不再是估的。',''],
      ['把设备清单变成月度检查表','自动加药机、检测仪、试纸有效期，各列一行，每月打钩。这一步能立刻救回被你闲置的那部分投入。','']]},

  jiuhuo:{
    key:'jiuhuo', name:'打不死的水', sub:'平时躺平，出事凶猛。',
    accent:'#BE5539', accentL:'#FBE9E4',
    portrait:[
      ['日常','检测稀疏，余氯忽高忽低'],
      ['水质','偶尔发白、发浑，波动明显'],
      ['绝活','每次都能在客人投诉前一天救回来'],
      ['依赖','靠冲击氯和换水重置，而不是维持'],
      ['隐藏风险','氰尿酸可能已经累积到很高']],
    theory:{t:'靠"冲击"活着，是在用余量换时间',
      p:['冲击氯处理很有效——它能迅速把藻和细菌压下去。但它的作用是<b>重置</b>，不是<b>维持</b>。反复"出问题—冲击—恢复"的循环里，有两个东西在悄悄累积。',
         '第一是<b>氰尿酸（CYA）</b>。如果用三氯异氰尿酸片消毒，每次投药都在往水里加 CYA，而它<b>不会自己分解</b>。CYA 升到 50–100 mg/L 以上会出现"锁氯"：试纸读数正常，杀菌力却大幅下降，水会越来越容易浑。降 CYA 只有一条路——换水稀释。',
         '第二是<b>磷酸盐</b>。它是藻类的"粮食"，主要来自补水、落叶和泳客带入。磷酸盐高但余氯够时看不出问题，一旦余氯掉下去，藻会爆发得特别快。这也是为什么你的池子总在"最后一刻"出状况——余量刚好用完。']},
    advice:[
      ['立刻测一次氰尿酸','这是你目前最该做的单项检测。如果超过 50 mg/L，做 10%–30% 的部分换水，效果比继续加药明显得多。',''],
      ['从"救火"改成"打底"','把余氯的日常下限守住 0.3 mg/L。下限守住，你就不需要那么频繁地动用冲击处理。',''],
      ['记下每次冲击的原因和时间','三次之后你会看出规律：是人多、是高温、还是补水水质。找到规律，就能提前一天动手。','free']]},

  huntang:{
    key:'huntang', name:'浑水摸鱼', sub:'池如其名。',
    accent:'#7A8A4A', accentL:'#EFF2E2',
    portrait:[
      ['外观','水色发暗，有悬浮物'],
      ['池底','可见沉积物，清洁不及时'],
      ['循环','水泵时开时停，开馆时间随缘'],
      ['余氯','长期在最低线附近徘徊甚至测不出'],
      ['客人','老客在流失，新客留不住']],
    theory:{t:'藻类只需要三个条件，你现在三个都给了',
      p:['藻类的生长条件说起来只有三个：<b>光照、营养（磷酸盐）、低余氯</b>。三个条件缺任何一个，藻都长不起来。<b>你现在是三个全给了</b>，所以一到夏天必然变绿——这不是运气问题，是必然结果。',
         '还有一个更隐蔽的杀手：<b>水泵时开时停</b>。水一旦停止循环超过 4–6 小时，池内就会出现<b>水力死角</b>——水不流动的角落，那里的余氯会最先被耗尽。细菌和藻不是平均地长在池子里，而是<b>从死角开始长</b>。每天开 6–8 小时、晚上关泵的池子，等于每天给藻留出一整夜的安全期。',
         '好消息是：这三个条件里，<b>最容易改的是"低余氯"和"循环"</b>，而这两项的投入主要是电费和习惯，不是设备钱。']},
    advice:[
      ['先做最便宜的一件事：把泵开满','24 小时连续循环。只花电费，一周之内浊度就会有明显变化。这是投入产出比最高的一步。','free'],
      ['冲击氯一次，把基线重建起来','按计算量一次投足，第二天检测余氯。把下限守到 0.3 mg/L 以上，藻就失去了爆发条件。',''],
      ['清一次死角','重点检查回水口、池底排水口、溢流沟、扶梯后面。这些地方清一次，相当于给整个水体降一次负荷。','']]},

  lvshui:{
    key:'lvshui', name:'绿水侠', sub:'恭喜，你的池子已经有了自己的生态系统。',
    accent:'#4F8C3A', accentL:'#E9F3E2', hidden:true,
    portrait:[
      ['外观','夏天必绿，而且绿得很匀称'],
      ['水质','游离余氯长期低于 0.3 mg/L 甚至测不出'],
      ['负荷','泳客负荷高，冲淋环节基本没有'],
      ['循环','水力死角多，局部完全无消毒'],
      ['现状','水里已经有了稳定的浮游生物群']],
    theory:{t:'你正在运行一个自循环的富营养化系统',
      p:['这不是简单的"水没管好"，而是一个会自己加速的闭环：<b>高泳客负荷带来氨氮和磷酸盐 → 水里的"氯需量"激增 → 游离余氯长期低于 0.3 mg/L → 藻类在充足光照下爆发 → 藻的尸体又变成新的有机负荷</b>。转一圈回来，氨氮更多、氯更不够、藻长得更凶。',
         '这个循环最麻烦的地方在于：<b>它自己不会停</b>。而且此时"再加一点氯"是无效的——因为水里的氯在被氨氮大量消耗掉之前，根本轮不到去杀藻。你加的那点氯，其实是给藻"加餐"了。',
         '要打断它，必须打<b>组合拳</b>，而且顺序不能乱：先一次性冲击氯（按远高于日常量的 10 倍氯需量投足）→ 次日常规灭藻 → 絮凝沉淀 → 彻底吸污排掉 → 最后重建余氯基线和循环时长。<b>只有把藻的尸体真正排出池外，这个循环才算断开。</b>']},
    advice:[
      ['不要再一点一点加药','少量多次只会让藻反复。要么不动，要动就按足量一次性冲击。',''],
      ['按顺序执行组合拳','冲击氯 → 灭藻 → 絮凝 → 吸污排出 → 重建基线。顺序错了等于白做，尤其是吸污这一步不能省。',''],
      ['断开营养来源','检查补水水质、清理周边落叶、加装遮阳网减少光照。三要素断掉一个，复发概率就大幅下降。',''],
      ['重建循环时长','把水泵改成 24 小时运行或用定时器覆盖夜间。死角不清掉，下一次爆发只是时间问题。','free']]}
};

/* ---------- 标签 ---------- */
const TALENT = { A:'剂量精准派', B:'循环信仰者', C:'感官雷达', D:'抗压型选手', E:'危机终结者' };
const RISK   = { A:'氯值盲区', B:'水力死角', C:'透明度失察', D:'负荷超载', E:'应变延迟' };


const state = { mode:'full', idx:0, answers:{}, mistakes:{} };

const $ = id => document.getElementById(id);
const app = () => $('app');

function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('on'),1900);
}
function activeQuestions(){
  return state.mode==='quick' ? QUESTIONS.filter(q=>q.quick) : QUESTIONS.slice();
}
function dimMax(){
  const qs = activeQuestions(); const m={A:0,B:0,C:0,D:0,E:0};
  qs.forEach(q=>m[q.dim]+=3); return m;
}


function mascot(key, size){
  const s = size||172, u = 120;
  const ink='#12313A';
  let inner='';
  const face=(cy,dx,mouth)=>`
    <circle cx="${60-dx}" cy="${cy}" r="3.4" fill="${ink}"/>
    <circle cx="${60+dx}" cy="${cy}" r="3.4" fill="${ink}"/>
    ${mouth}`;
  const smile=(cy,w)=>`<path d="M${60-w} ${cy+11} q${w} ${w*0.75} ${w*2} 0" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;

  if(key==='juanwang'){
    inner=`
      <ellipse cx="60" cy="68" rx="36" ry="34" fill="#BFE6EE"/>
      <ellipse cx="60" cy="68" rx="36" ry="34" fill="none" stroke="#0E8FA8" stroke-width="1.6" opacity=".55"/>
      <path d="M36 56 q10 -9 20 -4" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>
      <circle cx="47" cy="68" r="8.5" fill="#fff" stroke="${ink}" stroke-width="2.2"/>
      <circle cx="73" cy="68" r="8.5" fill="#fff" stroke="${ink}" stroke-width="2.2"/>
      <path d="M55.5 68 h9" stroke="${ink}" stroke-width="2.2"/>
      <circle cx="47" cy="68" r="2.6" fill="${ink}"/><circle cx="73" cy="68" r="2.6" fill="${ink}"/>
      ${smile(78,7)}
      <g transform="translate(84,20) rotate(9)">
        <rect x="0" y="0" width="30" height="22" rx="3" fill="#FCF0D6" stroke="#C98A1E" stroke-width="1.6"/>
        <path d="M6 7h18M6 12h18M6 17h11" stroke="#C98A1E" stroke-width="1.6" stroke-linecap="round"/>
      </g>`;
  } else if(key==='buyap'){
    inner=`
      <ellipse cx="60" cy="70" rx="35" ry="33" fill="#CFE9F0"/>
      <ellipse cx="60" cy="70" rx="35" ry="33" fill="none" stroke="#C98A1E" stroke-width="1.6" opacity=".5"/>
      <path d="M41 64 l9 -9M50 64 l-9 -9" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M70 64 l9 -9M79 64 l-9 -9" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M52 84 q8 -7 16 0" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(78,14)">
        <rect x="0" y="6" width="22" height="26" rx="4" fill="#FCF0D6" stroke="#C98A1E" stroke-width="1.8"/>
        <rect x="6" y="0" width="10" height="7" rx="2" fill="#C98A1E"/>
        <path d="M6 17h10M6 23h10" stroke="#C98A1E" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <circle cx="24" cy="34" r="3.6" fill="#FCF0D6" stroke="#C98A1E" stroke-width="1.4"/>
      <circle cx="36" cy="24" r="3.6" fill="#FCF0D6" stroke="#C98A1E" stroke-width="1.4"/>
      <circle cx="20" cy="50" r="3.6" fill="#FCF0D6" stroke="#C98A1E" stroke-width="1.4"/>`;
  } else if(key==='laoganbu'){
    inner=`
      <rect x="18" y="44" width="84" height="52" rx="12" fill="#D7E9EF" stroke="#4A8C9E" stroke-width="1.6"/>
      <path d="M24 62 q12 -6 24 0 t24 0 t24 0" fill="none" stroke="#8FC4D2" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 78 q12 -6 24 0 t24 0 t24 0" fill="none" stroke="#8FC4D2" stroke-width="3" stroke-linecap="round"/>
      <circle cx="45" cy="60" r="7" fill="#fff" stroke="${ink}" stroke-width="2"/>
      <circle cx="75" cy="60" r="7" fill="#fff" stroke="${ink}" stroke-width="2"/>
      <path d="M52 60 h16" stroke="${ink}" stroke-width="2"/>
      <circle cx="45" cy="60" r="2.2" fill="${ink}"/><circle cx="75" cy="60" r="2.2" fill="${ink}"/>
      <path d="M54 76 q6 5 12 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
      <g transform="translate(86,18)">
        <rect x="0" y="8" width="20" height="18" rx="3" fill="#F6EBD9" stroke="#B08A54" stroke-width="1.6"/>
        <path d="M20 13 q7 2 0 8" fill="none" stroke="#B08A54" stroke-width="1.6"/>
        <path d="M4 5 q3 -3 6 0 q3 -3 6 0" fill="none" stroke="#B08A54" stroke-width="1.6" stroke-linecap="round"/>
      </g>`;
  } else if(key==='yishi'){
    inner=`
      <ellipse cx="60" cy="70" rx="34" ry="32" fill="#DCD6F0"/>
      <ellipse cx="60" cy="70" rx="34" ry="32" fill="none" stroke="#7E6BB5" stroke-width="1.6" opacity=".6"/>
      ${face(66,11,smile(76,7))}
      <g transform="translate(78,26)">
        <rect x="0" y="0" width="30" height="22" rx="4" fill="#EFECF8" stroke="#7E6BB5" stroke-width="1.7"/>
        <circle cx="15" cy="11" r="6" fill="#fff" stroke="#7E6BB5" stroke-width="1.7"/>
        <circle cx="15" cy="11" r="2.4" fill="#7E6BB5"/>
        <rect x="24" y="4" width="4" height="3" rx="1" fill="#7E6BB5"/>
      </g>
      <g transform="translate(16,88) rotate(-12)">
        <rect x="0" y="0" width="26" height="14" rx="2" fill="#fff" stroke="#9AA6AE" stroke-width="1.5"/>
        <path d="M3 5 h20 M3 10 h13" stroke="#9AA6AE" stroke-width="1.4" stroke-linecap="round"/>
      </g>`;
  } else if(key==='jiuhuo'){
    inner=`
      <ellipse cx="60" cy="70" rx="34" ry="32" fill="#D9EBF2"/>
      <ellipse cx="60" cy="70" rx="34" ry="32" fill="none" stroke="#BE5539" stroke-width="1.6" opacity=".55"/>
      <path d="M28 60 q6 -6 12 0" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M62 58 q6 -6 12 0" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="36" cy="72" r="3.2" fill="${ink}"/><circle cx="70" cy="72" r="3.2" fill="${ink}"/>
      <path d="M52 84 q8 5 16 -2" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="45" y="44" width="30" height="9" rx="4" transform="rotate(-18 60 48)" fill="#FBE9E4" stroke="#BE5539" stroke-width="1.4"/>
      <path d="M55 44 l10 3M53 51 l10 3" stroke="#BE5539" stroke-width="1.2" transform="rotate(-18 60 48)"/>
      <path d="M96 30 q-6 8 -2 14 q-6 -2 -7 -8 q-3 8 3 14 q-9 -3 -10 -13 q-2 -10 8 -15 q-2 6 2 8 q1 -6 6 -0 z" fill="#F0A24A" stroke="#C97B22" stroke-width="1.2"/>`;
  } else if(key==='huntang'){
    inner=`
      <ellipse cx="60" cy="70" rx="35" ry="33" fill="#DCE4C4"/>
      <ellipse cx="60" cy="70" rx="35" ry="33" fill="none" stroke="#7A8A4A" stroke-width="1.6" opacity=".6"/>
      <circle cx="40" cy="56" r="3" fill="#A8B77E" opacity=".8"/>
      <circle cx="78" cy="52" r="2.4" fill="#A8B77E" opacity=".8"/>
      <circle cx="66" cy="86" r="3.2" fill="#A8B77E" opacity=".8"/>
      <path d="M28 44 q30 -8 62 -3" fill="none" stroke="#7A8A4A" stroke-width="2" opacity=".6"/>
      <path d="M34 68 q7 6 14 0" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M62 68 q7 6 14 0" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="60" cy="85" rx="5" ry="6" fill="${ink}" opacity=".55"/>
      <text x="96" y="40" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="#7A8A4A">z</text>
      <text x="104" y="28" font-family="system-ui,sans-serif" font-size="19" font-weight="600" fill="#7A8A4A">z</text>`;
  } else {
    inner=`
      <ellipse cx="60" cy="72" rx="36" ry="33" fill="#B7D89C"/>
      <ellipse cx="60" cy="72" rx="36" ry="33" fill="none" stroke="#4F8C3A" stroke-width="1.6" opacity=".6"/>
      <circle cx="36" cy="56" r="4" fill="#7FB562" opacity=".85"/>
      <circle cx="82" cy="60" r="3.2" fill="#7FB562" opacity=".85"/>
      <circle cx="58" cy="42" r="3.6" fill="#7FB562" opacity=".85"/>
      <circle cx="72" cy="90" r="4.2" fill="#7FB562" opacity=".85"/>
      <path d="M32 64 h56" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="46" cy="64" r="9" fill="#16323A"/>
      <circle cx="74" cy="64" r="9" fill="#16323A"/>
      <path d="M55 64 h12" stroke="#16323A" stroke-width="4"/>
      <circle cx="43" cy="61" r="2.4" fill="#fff" opacity=".7"/>
      <circle cx="71" cy="61" r="2.4" fill="#fff" opacity=".7"/>
      <path d="M52 86 q9 6 18 -1" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M46 30 l6 -14 l7 10 l9 -13 l6 15 z" fill="#F2C14E" stroke="#C99B22" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  return `<svg viewBox="0 0 ${u} ${u}" width="${s}" height="${s}" role="img" aria-label="${esc(TYPES[key].name)}形象">${inner}</svg>`;
}


function computeScores(){
  const qs = activeQuestions();
  const max = dimMax();
  const raw = {A:0,B:0,C:0,D:0,E:0};
  qs.forEach(q=>{
    const k = state.answers[q.id];
    if(k!==undefined) raw[q.dim] += q.o[k][1];
  });
  const dim = {};
  Object.keys(raw).forEach(k=>{ dim[k] = max[k] ? Math.round(raw[k]/max[k]*100) : 0; });

  let mScore = 0;
  MISTAKES.forEach(m=>{
    const k = state.mistakes[m.id];
    if(k!==undefined) mScore += m.o[k][1];   // 正确=2 满分
  });
  const insider = Math.round(mScore/(MISTAKES.length*2)*100);

  const vals = Object.values(dim);
  const L = vals.reduce((a,b)=>a+b,0)/5;
  const sorted = Object.entries(dim).sort((a,b)=>b[1]-a[1]);
  const top = sorted[0][0], bottom = sorted[4][0];
  const spread = sorted[0][1] - sorted[4][1];

  let key;
  if(dim.A < 35 && dim.D < 35) key = 'lvshui';
  else if(L >= 75 && (dim.D < 50 || dim.E < 50)) key = 'buyap';
  else if(L >= 75) key = 'juanwang';
  else if(L >= 45 && spread <= 25) key = 'laoganbu';
  else if(L >= 45 && spread > 25) key = 'yishi';
  else if(dim.E >= 60) key = 'jiuhuo';
  else key = 'huntang';

  return { dim, insider, L:Math.round(L), top, bottom, spread, key };
}


function radarSVG(dim, size){
  const S = size||230, cx=S/2, cy=S/2+4, R=S*0.33;
  const keys = ['A','B','C','D','E'];
  const n = keys.length;
  const pt = (i,r)=>{
    const ang = -Math.PI/2 + i*2*Math.PI/n;
    return [cx + Math.cos(ang)*r, cy + Math.sin(ang)*r];
  };
  let rings='';
  [0.25,0.5,0.75,1].forEach(f=>{
    const p = keys.map((_,i)=>pt(i,R*f).map(v=>v.toFixed(1)).join(',')).join(' ');
    rings += `<polygon points="${p}" fill="none" stroke="rgba(18,49,58,.10)" stroke-width="1"/>`;
  });
  let spokes='', labels='';
  keys.forEach((k,i)=>{
    const [x,y]=pt(i,R);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(18,49,58,.10)" stroke-width="1"/>`;
    const [lx,ly]=pt(i,R+24);
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central"
      font-family="system-ui,sans-serif" font-size="11.5" fill="#4A6B75">${DIMS[k].short}</text>`;
  });
  const poly = keys.map((k,i)=>{
    const r = R*Math.max(0.06, dim[k]/100);
    return pt(i,r).map(v=>v.toFixed(1)).join(',');
  }).join(' ');
  const dots = keys.map((k,i)=>{
    const r = R*Math.max(0.06, dim[k]/100);
    const [x,y]=pt(i,r);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="#0E8FA8"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="五维水质管理雷达图">
    ${rings}${spokes}
    <polygon points="${poly}" fill="rgba(14,143,168,.22)" stroke="#0E8FA8" stroke-width="2" stroke-linejoin="round"/>
    ${dots}${labels}
  </svg>`;
}



global.PoolQuiz = { DIMS, QUESTIONS, MISTAKES, TYPES, TALENT, RISK, state,
  mascot, mascotInner:null, computeScores, radarSVG, esc, activeQuestions, dimMax, toast };
function mascotInner(key){
  return mascot(key,1).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
}
global.PoolQuiz.mascotInner = mascotInner;
})(window);
