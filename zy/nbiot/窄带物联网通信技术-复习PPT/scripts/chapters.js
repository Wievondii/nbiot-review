// ===== 知识点章节数据 =====
const chapters = [
{id:1,title:"第1章 移动通信概述",sections:[
{title:"1.1 移动通信的概念与组成",points:[
{t:"p",c:"移动通信是指通信双方有一方或两方处于移动状态中的通信。移动体可以是人、汽车、火车、飞机、轮船等。"},
{t:"hl",c:"移动通信系统的四大子系统：<strong>用户子系统</strong>（移动终端）→ <strong>基站子系统</strong>（无线管理）→ <strong>交换子系统</strong>（核心网）→ <strong>传输子系统</strong>（有线/无线中继）"},
{t:"svg",id:"arch"},

{t:"h4",c:"移动通信的7大特点"},
{t:"ul",c:["通信方具有移动性","利用无线电波进行信息传输","电波传播条件复杂、信道特性差","系统中噪声和干扰严重","频谱资源有限","系统网络结构复杂、设备性能要求高","具备很强的管理和控制功能"]}
]},
{title:"1.2 工作方式：单工 / 半双工 / 全双工",points:[
{t:"svg",id:"duplex"},
{t:"hl",c:"<strong>单工制</strong>：数据单向传输（如广播电台、打印机）。<strong>半双工制</strong>：可双向但不能同时（如对讲机）。<strong>全双工制</strong>：任意时刻双向传输，分为 FDD（频分双工）和 TDD（时分双工）。"},
{t:"table",h:["特性","FDD","TDD"],r:[
["频谱","需要成对频率","不需要成对频率"],
["非对称业务频谱利用率","约60%","灵活控制，利用率高"],
["最高移动速度","500km/h","120km/h"],
["智能天线","难以采用","适于运用（同一频率）"],
["抗干扰","较好（2项干扰）","较差（4项干扰）"]
]},
{t:"p",c:"<strong>关键结论</strong>：FDD适合高速移动场景（如高铁），TDD适合不对称业务（如互联网下行多上行少）。"}
]},
{title:"1.3 多址方式",points:[
{t:"h4",c:"正交多址（用户间无干扰）"},
{t:"ul",c:["FDMA — 频分多址：不同用户用不同频率","TDMA — 时分多址：不同用户用不同时隙","CDMA — 码分多址：不同用户用不同码序列","SDMA — 空分多址：不同用户用不同空间方向"]},
{t:"h4",c:"非正交多址（NOMA）"},
{t:"table",h:["技术","复用域","特点"],r:[
["PD-NOMA","功率域","实现最简单"],
["SCMA","码域","误码率最小，性能最优"],
["MUSA","复数多元码","与PDMA性能相近"],
["PDMA","非正交特征图样","与MUSA性能相近"]
]},
{t:"hl",c:"NOMA是5G-mMTC上行场景的重要候选方案，通过功率域/码域拓展无线传输带宽。"}
]},
{title:"1.4 标准化组织",points:[
{t:"p",c:"<strong>ITU</strong>（国际电信联盟）：联合国专门机构，负责全球频谱管理、卫星轨道分配、电信标准制定。赵厚麟为首位中国籍秘书长。"},
{t:"hl",c:"<strong>3GPP</strong> 由6个组织组成：ETSI(欧)、ARIB(日)、TTC(日)、CCSA(中)、TTA(韩)、ATIS(北美)。三级架构：PCG → TSG → WG。工作流程：早期研发 → 项目提案 → 可行性研究 → 技术规范 → 商用。"},
{t:"p",c:"文档命名：3GPP TS/TR XX.YYY V x.y.z（TS=技术规范，TR=技术报告）"}
]}
]},
{id:2,title:"第2章 5G移动通信技术",sections:[
{title:"2.1 5G技术演进",points:[
{t:"hl",c:"5G演进三大维度：<strong>①频谱效率提升</strong> ②<strong>工作带宽增大</strong> ③<strong>频段向高频扩展</strong>"},
{t:"svg",id:"5g-evolution"},
{t:"p",c:"高阶调制：QPSK(2bit) → 16QAM(4bit) → 64QAM(6bit) → 256QAM(8bit)，每符号携带bit数 = log₂(M)，M为调制阶数。"},
{t:"p",c:"多天线：MIMO 2×2 → 4×4 → 8×8 → 64×64 → Massive MIMO 256。频谱利用率越来越接近香农极限。"},
{t:"hl",c:"<strong>核心规律</strong>：频率越高 → 带宽越大 → 速率越高，但传播损耗越大、穿透力越差、覆盖范围越小。"}
]},
{title:"2.2 三大应用场景与核心指标",points:[
{t:"table",h:["场景","全称","核心需求","典型应用"],r:[
["eMBB","增强移动宽带","超高传输速率 >10Gbps","4K/8K、全息、AR/VR"],
["mMTC","大规模物联网","海量连接、超低功耗","远程抄表、物流跟踪"],
["URLLC","超可靠低时延","超低时延、超高可靠性","无人驾驶、远程医疗"]
]},
{t:"table",h:["指标","值"],r:[
["峰值速率","DL:20Gbps, UL:10Gbps"],
["用户面时延","URLLC:0.5ms / eMBB:1ms"],
["可靠性","URLLC: BLER≤0.001%(1ms)"],
["覆盖","mMTC:164dB / eMBB:115dB"],
["移动性中断时间","0ms"]
]}
]},
{title:"2.3 关键技术",points:[
{t:"p",c:"<strong>3D-MIMO</strong>：在MIMO基础上增加垂直维度，波束三维赋型。<strong>毫米波</strong>（>20GHz）：频谱资源丰富，适合Massive MIMO部署。<strong>新型编码</strong>：LDPC码（长码）、Polar码（短码）。"},
{t:"hl",c:"5GC三大网元：<strong>AMF</strong>（接入和移动管理）+ <strong>UPF</strong>（用户面功能）+ <strong>SMF</strong>（会话管理功能）。控制面与用户面完全分离，SBA（基于服务的架构）。"},
{t:"svg",id:"5gc-arch"},
{t:"table",h:["接口","功能"],r:[
["N1","UE ↔ AMF，NAS层信令"],
["N2","gNB ↔ AMF，控制面"],
["N3","RAN ↔ UPF，用户面数据"],
["N6","5GC ↔ 外部数据网络(DN)"],
["N22","网络切片选择功能(NSSF)"]
]},
{t:"h4",c:"NSA vs SA 组网"},
{t:"p",c:"<strong>NSA</strong>（非独立组网）：利用4G基础设施部署5G，控制信令走4G。<strong>SA</strong>（独立组网）：全新5G网络（新基站+新核心网）。选项2（5G基站+5G核心网）是最终模式。"},
{t:"img",src:"images/exam/c176260c8493807c0c8333beaa906e2243a6427e5e51f5ff79452f72b1d53b68.jpg",alt:"5G与4G网络架构区分"}
]}
]},
{id:3,title:"第3章 dBm与dB（信号强度）",sections:[
{title:"3.1 单位定义与换算教学",points:[
{t:"svg",id:"dbm-scale"},
{t:"hl",c:"<strong>dB</strong>：相对值，无单位。公式：10lg(甲/乙)。功率翻倍 = +3dB。<strong>dBm</strong>：绝对值，以1mW为基准。公式：10lg(P/1mW)。1W = 30dBm。<strong>dBi/dBd</strong>：天线增益。dBi = dBd + 2.15。"},
{t:"calc",title:"dBm 计算教学",steps:[
{label:"记住基准",text:"1mW = 0dBm，1W = 30dBm（10lg1000）"},
{label:"功率→dBm",text:"dBm = 10 × lg(功率mW数)。例：40W = 40000mW → 10lg40000 = 10×(4+4) = 46dBm"},
{label:"快速心算",text:"功率每翻倍，dBm加3。1→2→4→8W 对应 30→33→36→39dBm"},
{label:"dBm→功率",text:"功率(mW) = 10^(dBm/10)。例：20dBm → 10^2 = 100mW = 0.1W"}
],formula:"A(W) = 10 × lg( A / 1mW ) [dBm]",note:"lg2≈0.3, lg4≈0.6, lg8≈0.9, lg10=1"},
{t:"table",h:["功率","dBm"],r:[
["100W","50dBm"],["10W","40dBm"],["1W","30dBm"],
["0.1W","20dBm"],["0.01W","10dBm"],["0.001W","0dBm"],
["0.1mW","-10dBm"],["0.01mW","-20dBm"]
]},
{t:"h4",c:"单位间的运算规则"},
{t:"hl",c:"<strong>dBm - dBm = dB</strong>（两功率相除=信噪比SINR）。例：30dBm - 0dBm = 30dB。<strong>dBm + dBm</strong> = 两功率相乘（工程中很少用）。dBm和dBm之间只有加减，没有乘除。"}
]}
]},
{id:4,title:"第4章 物联网介绍",sections:[
{title:"4.1 NB-IoT六大特性",points:[
{t:"table",h:["特性","指标","说明"],r:[
["超强覆盖","MCL=164dB","覆盖增强20dB"],
["超大容量","100k终端/200kHz小区","大规模连接"],
["超低功耗","10年电池寿命","PSM省电模式"],
["超低成本","5~10美元/终端","芯片简化"],
["较低速率","10~100kbps","小数据包场景"],
["时延容忍","1~10s","非实时业务"]
]},
{t:"h4",c:"LPWAN（低功耗广域网）技术分类"},
{t:"svg",id:"iot-classify"},
{t:"p",c:"<strong>授权频谱</strong>（3GPP标准）：NB-IoT、LTE-M(eMTC)。可靠性高、QoS有保障。<strong>非授权频谱</strong>（ISM频段）：LoRa、Sigfox。成本低、可部署专用网络。"}
]}
]},
{id:5,title:"第5章 NB-IoT概述",sections:[
{title:"5.1 三种部署模式",points:[
{t:"svg",id:"nb-iot-deploy"},
{t:"table",h:["模式","频段","带宽","特点"],r:[
["独立(Standalone)","GSM频段重耕","180kHz+保护间隔","不依赖LTE，完全解耦"],
["保护带(Guard Band)","LTE边缘保护带","180kHz","不占LTE资源，需LTE≥10MHz"],
["带内(In-Band)","LTE PRB资源","占用1个RB","需LTE≥3MHz(产品≥5MHz)，可同PCI"]
]},
{t:"hl",c:"NB-IoT仅支持<strong>FDD半双工</strong>（HD-FDD）：不必同时收发，更省电。下行OFDMA，上行SC-FDMA。"}
]},
{title:"5.2 物理信道与覆盖功耗",points:[
{t:"h4",c:"下行物理信道与信号"},
{t:"table",h:["信道/信号","功能"],r:[
["NPBCH","窄带物理广播信道，承载MIB-NB"],
["NPDCCH","窄带物理下行控制信道，调度信息"],
["NPDSCH","窄带物理下行共享信道，数据+SIB1"],
["NPSS","主同步信号，时间频率同步（不含PCI）"],
["NSSS","辅同步信号，携带PCI（504个）"],
["NRS","窄带参考信号/导频，信道估计"]
]},
{t:"h4",c:"上行物理信道"},
{t:"p",c:"<strong>NPUSCH</strong>（上行共享信道）、<strong>NPRACH</strong>（随机接入信道，单频3.75kHz传输）、<strong>DMRS</strong>（上行解调参考信号）。NB-IoT去掉了PMCH（不支持多媒体广播）。"},
{t:"h4",c:"深度覆盖与低功耗技术"},
{t:"ul",c:["覆盖增强：时域重复发送（最大下行2048次/上行128次）、低阶调制(BPSK/QPSK)、窄带高频谱密度","低功耗：FDD半双工、PSM休眠模式（发完数据即休眠不监听网络）、低速率低带宽降低芯片复杂度"]}
]},
{title:"5.3 增强演进（R14）",points:[
{t:"ul",c:["<strong>定位增强</strong>：R13无PRS/SRS仅E-CID低精度定位，R14增强","<strong>多播功能</strong>：R14增加Multi-Cast，批量下发数据","<strong>移动性增强</strong>：R13仅空闲模式重选，R14支持RRC连接模式切换","<strong>语音</strong>：NB-IoT无法支持VoLTE（速率低+时延大），eMTC可支持"]}
]}
]},
{id:6,title:"第6章 NB-IoT物理层",sections:[
{title:"6.1 物理层技术参数",points:[
{t:"table",h:["技术","下行","上行"],r:[
["多址技术","OFDMA","SC-FDMA"],
["子载波带宽","15kHz","3.75kHz / 15kHz"],
["子载波个数","12","1, 3, 6, 12"],
["发射功率","43dBm","23dBm"],
["子帧长度","1ms","1ms"],
["TTI长度","1ms","1ms / 8ms"],
["调制技术","QPSK","BPSK / QPSK"],
["最大重复次数","2048","128"]
]},
{t:"h4",c:"物理信号"},
{t:"hl",c:"<strong>NPSS</strong>：固定ZC序列，仅时间频率同步，不含PCI。<strong>NSSS</strong>：周期20ms，携带PCI（504个），仅NSSS即可确定PCI（LTE需PSS+SSS联合）。<strong>NRS</strong>：导频信号，用于信道质量测量和解调。"},
{t:"h4",c:"物理信道"},
{t:"ul",c:["NPBCH：子帧#0，TTI=640ms，承载MIB-NB","NPDCCH：承载调度信息、HARQ确认、寻呼指示","NPRACH：重新设计（LTE的1.08MHz太宽），单频3.75kHz传输，一次Preamble含4个Symbol Group","NB-IoT信号必须避免映射到LTE已使用的RE，保持正交性"]}
]}
]},
{id:7,title:"第7章 NB-IoT基本过程",sections:[
{title:"7.1 移动性管理与小区重选",points:[
{t:"p",c:"LTE小区重选：UE在空闲模式下监测信号质量，选择最佳小区。触发条件：<strong>S准则</strong>（RSRP>门限）和<strong>R准则</strong>（邻区信号持续优于服务小区）。"},
{t:"hl",c:"NB-IoT驻留条件：Squal = Qqualmeas - q-QualMin-r13 > 0 <strong>且</strong> Srxlev = Qrxlevmeas - q-RxLevMin-r13 > 0。缺省值：q-QualMin=-34dB，q-RxLevMin=-140dBm。"}
]},
{title:"7.2 RRC连接管理",points:[
{t:"p",c:"RRC状态：空闲态 ↔ 连接态。用户面优化引入<strong>RRC连接暂停</strong>（Suspend）和<strong>RRC连接恢复</strong>（Resume）流程。"},
{t:"h4",c:"附着过程（8步）"},
{t:"p",c:"① RRC连接建立 → ② 鉴权 → ③ NAS安全模式 → ④ PDN连接建立(可选) → ⑤ EPS承载激活 → ⑥ 附着接受 → ⑦ 附着完成 → ⑧ RRC连接释放"}
]},
{title:"7.3 系统信息与随机接入",points:[
{t:"h4",c:"SIB类型"},
{t:"table",h:["SIB","内容"],r:[
["SIB1","小区选择、接入、SI调度"],
["SIB2","RACH、接入限制、UL频率"],
["SIB3","同频小区重选"],
["SIB4","同频邻小区"],
["SIB5","异频邻小区"]
]},
{t:"h4",c:"随机接入 — 覆盖等级(CEL)"},
{t:"table",h:["等级","RSRP条件","Preamble重复次数"],r:[
["CEL0（最优）","> RSRPTH1","最少（可配1次）"],
["CEL1（中等）","RSRPTH2~RSRPTH1","居中（如4/8次）"],
["CEL2（最差）","< RSRPTH2","最大（可配32次）"]
]},
{t:"p",c:"<strong>基于竞争</strong>：UE自行选Preamble，可能冲突。<strong>基于非竞争</strong>：基站指定Preamble，无冲突。"}
]}
]},
{id:8,title:"第8章 NB-IoT数据传输",sections:[
{title:"8.1 传输模式概述",points:[
{t:"hl",c:"<strong>控制面优化</strong>（强制支持）：数据封装在NAS PDU中，通过RRC消息传输，MME提取转发。<strong>用户面优化</strong>（可选支持）：传统LTE用户面传输，引入RRC暂停/恢复。"},
{t:"table",h:["方式","路径","适用数据"],r:[
["控制面方式1","UE→eNB→MME→T6a→SCEF→应用服务器","仅Non-IP"],
["控制面方式2","UE→eNB→MME→S11-U→SGW→PGW→应用","IP + Non-IP"],
["用户面方式1","UE→eNB→SGW→T6b→SCEF→应用","仅Non-IP"],
["用户面方式2","UE→eNB→SGW→PGW→应用","IP数据"],
["SMS","SMS over SGs(电路域) / SGd(MME直连)","少量数据"]
]},
{t:"h4",c:"控制面上行数据传输（核心流程）"},
{t:"p",c:"① NAS触发ControlPlaneServiceRequest → ② RRC连接建立 → ③ NAS加密数据封装在RRCConnectionSetupComplete → ④ 基站发S1AP InitialUEMessage → ⑤ MME解密后通过S11-U/SGW/PGW转发到应用服务器。"}
]},
{title:"8.2 数据调度",points:[
{t:"hl",c:"<strong>NPDCCH和NPDSCH不能在同一子帧出现</strong>，有调度时延，降低终端解码成本。调度时延要求：NPDCCH起始晚于上一个NPDCCH结束后≥4ms；NPDSCH起始晚于NPDCCH结束后≥4ms。"}
]}
]},
{id:9,title:"第9章 OFDM与无线帧结构",sections:[
{title:"9.1 OFDM技术原理",points:[
{t:"svg",id:"ofdm-principle"},
{t:"p",c:"OFDM（正交频分复用）：将宽带分割为多个窄带正交子载波。各载波正交，频谱零点重叠，避免载波间干扰。"},
{t:"table",h:["优点","缺点"],r:[
["频谱效率高","PAPR(峰均比)高"],
["带宽扩展性强","对频率偏移敏感"],
["抗多径衰落","同频干扰严重"],
["实现MIMO简单","上行需用SC-FDMA降低PAPR"]
]}
]},
{title:"9.2 LTE帧结构",points:[
{t:"svg",id:"lte-frame"},
{t:"p",c:"<strong>类型1（FDD）</strong>：10子帧下行+10子帧上行/10ms，频域分开。<strong>类型2（TDD）</strong>：支持5ms和10ms周期，灵活上下行配比。"},
{t:"hl",c:"TDD三个特殊时隙：<strong>DwPTS</strong>（下行导频）、<strong>GP</strong>（保护间隔）、<strong>UpPTS</strong>（上行导频）。GP大小决定TDD最大小区半径，由GP、PRACH的GT、OFDM的CP三者取最小值。"}
]},
{title:"9.3 5G NR帧结构（Numerology）",points:[
{t:"hl",c:"5G NR引入 <strong>Numerology</strong>：子载波间隔 = 2^μ × 15kHz，μ∈{0,1,2,3,4}。固定架构：无线帧10ms = 10子帧×1ms。灵活架构：不同μ下每子帧时隙数不同。"},
{t:"svg",id:"nr-frame"},
{t:"table",h:["μ","子载波间隔","每子帧时隙","每帧时隙","符号数/时隙"],r:[
["0","15kHz","1","10","14"],
["1","30kHz","2","20","14"],
["2","60kHz","4","40","14(12扩展)"],
["3","120kHz","8","80","14"],
["4","240kHz","16","160","14"]
]},
{t:"hl",c:"时隙符号分三类：<strong>D</strong>（下行）、<strong>U</strong>（上行）、<strong>X</strong>（灵活，含转换点）。NR上下行可在符号间转换（LTE在子帧交替时转换）。<strong>核心结论</strong>：子载波间隔越大→时隙越短→时隙数越多。子帧长度始终1ms。"}
]},
{title:"9.4 物理资源：RE / RB / CCE",points:[
{t:"svg",id:"resource-grid"},
{t:"table",h:["资源单位","定义","用途"],r:[
["RE（资源单元）","1符号×1子载波，最小单位","所有信道"],
["REG（资源单元组）","4个RE","PCFICH/PHICH"],
["CCE（控制信道单元）","9个REG = 36RE","PDCCH"],
["RB（资源块）","LTE：1时隙×12子载波\n5G：频域12子载波(时域未定义)","业务信道"]
]},
{t:"h4",c:"LTE vs 5G 关键对比"},
{t:"table",h:["特性","LTE","5G"],r:[
["每秒帧数","100","100"],
["每帧时隙数","固定10子帧","30kHz下20时隙"],
["子帧配比","2:2 / 3:1","按周期占比计算"],
["RB数","20M带宽100个","100M带宽273个"],
["每RB资源","12子载波×7符号","12子载波×14符号"],
["调制方式","最大64QAM","最大256QAM"],
["天线","下行最大2/上行最大1","下行最大4/上行最大2"],
["信令开销","25%（用户面75%）","20%（用户面80%）"]
]}
]}
]},
{id:10,title:"第10章 信号覆盖与CQI",sections:[
{title:"10.1 RSRP信号覆盖等级",points:[
{t:"hl",c:"RSRP（参考信号接收功率）是衡量无线覆盖质量的核心指标，单位dBm。"},
{t:"img",src:"images/exam/e2b6a3b60a714b010d5350dd92c92d3e95aa785f61abfea0667cd50fd4eb2372.jpg",alt:"RSRP覆盖等级图"},
{t:"table",h:["RSRP范围","覆盖等级","状态","速率能力"],r:[
["-75dBm以上","极好","信号极强","高速率"],
["-75 ~ -85dBm","好","信号强","高速率"],
["-85 ~ -95dBm","中等","信号中等","中速率"],
["-95 ~ -105dBm","较差","信号弱","低速率"],
["-105 ~ -119dBm","差","信号很弱","极低速率，可能解调"],
["-119dBm以下","无覆盖","无法解调","无法通信"]
]},
{t:"hl",c:"<strong>NB-IoT最低边缘信号强度</strong>：-164dBm（MCL=164dB），远低于普通LTE的-120dBm左右。"},
{t:"p",c:"<strong>实际应用</strong>：高速公路上车速快，信号变化剧烈，需关注-95dBm以下的弱覆盖区域；城市核心区建筑密集，存在大量阴影衰落，需关注-105dBm以下的盲区。"}
]},
{title:"10.2 CQI索引表（信道质量指示）",points:[
{t:"p",c:"CQI（Channel Quality Indicator）由UE测量后上报给基站，基站根据CQI选择调制方式和编码速率，决定MCS（调制编码方案）。"},
{t:"h4",c:"LTE CQI索引表（部分关键值）"},
{t:"img",src:"images/exam/160719bacc73104fd71bdbdf728ec11b46c99b8f3cf65baf581f989518eb82f6.jpg",alt:"LTE CQI索引表"},
{t:"table",h:["CQI","调制方式","码率×1024","频谱效率"],r:[
["0","—","—","Out of range"],
["1~6","QPSK","8~602","0.15~1.18"],
["7~9","16QAM","378~616","1.48~2.41"],
["10~15","64QAM","466~948","2.73~5.55"]
]},
{t:"h4",c:"5G NR CQI索引表（部分关键值）"},
{t:"img",src:"images/exam/aa4bb20c3a07da1abf44c72bd88462b667c8e067b6064b0ab91f8eb6c9096070.jpg",alt:"5G NR CQI索引表"},
{t:"table",h:["CQI","调制方式","码率×1024","频谱效率"],r:[
["0","—","—","Out of range"],
["1~3","QPSK","78~449","0.15~0.88"],
["4~6","16QAM","378~616","1.48~2.41"],
["7~11","64QAM","466~873","2.73~5.12"],
["12~15","256QAM","711~948","5.55~7.41"]
]},
{t:"hl",c:"<strong>关键区别</strong>：5G NR支持256QAM（CQI 12~15），LTE最高仅64QAM（CQI 10~15）。5G频谱效率最高7.41，LTE最高5.55。"}
]},
{title:"10.3 MIMO天线模式与应用场景",points:[
{t:"h4",c:"LTE/5G四种主要天线模式"},
{t:"table",h:["天线模式","适用场景","特点"],r:[
["发射分集","小区边缘、高速移动、低SINR","提高可靠性，不提高速率"],
["开环空间复用","高速移动、高SINR","不需要反馈，适合快速变化信道"],
["闭环空间复用","低速/静止、高SINR","需要反馈，速率最高"],
["闭环Rank=1","低速移动、中低SINR","单流传输，兼顾速率和可靠性"]
]},
{t:"hl",c:"<strong>RANK（秩）</strong>：LTE中最大为2，5G中目前最大为4。上行LTE为1，5G为2。RANK值越高，同时传输的数据流越多，峰值速率越高。"},
{t:"img",src:"images/exam/0287931039634aaddc5e6335f9eedbd59d3a428214d6d93bc73d41baded9374b.jpg",alt:"MIMO天线模式与场景"},
{t:"h4",c:"场景与天线模式对应"},
{t:"table",h:["场景","移动速度","小区位置","天线模式","子帧配比"],r:[
["高速公路","高速（≤500km/h）","边缘→中心","发射分集→开环空间复用","3:1 / 3:9:2"],
["城市核心商业","低速/静止","中心","闭环空间复用","2:2 / 10:2:2"],
["一般城区","中低速","中心","开环/闭环空间复用","3:1 / 10:2:2"]
]},
{t:"p",c:"<strong>5G最高阶调制</strong>：256QAM（8bit/符号）。城市核心商业区采用2:2配比，因为部分场景上行速率需求较高。"},
{t:"h4",c:"典型场景图"},
{t:"img",src:"images/exam/047d9e9e941cb9db3332f118cf9e246be6b6908aa37854aa840f335ae0afda36.jpg",alt:"高速公路场景"},
{t:"img",src:"images/exam/a41a3a6fd682a8377fcea170308583d201555336a6d1ccb89d2ae3ed3e15c390.jpg",alt:"城市核心商业区场景"},
{t:"img",src:"images/exam/cb5a537a052ce65b936d83481bd89023d2269c02d6f72af5b87f55d28f45bac3.jpg",alt:"一般城区场景"}
]},
{title:"10.4 测量事件（A1-A5 / B1-B2）",points:[
{t:"h4",c:"系统内测量事件（同频/异频）"},
{t:"table",h:["事件","触发条件","用途"],r:[
["A1","服务小区好于绝对门限","关闭某些小区间测量"],
["A2","服务小区差于绝对门限","开启某些小区间测量"],
["A3","邻区好于服务小区","触发切换判决（现网常用）"],
["A4","邻区好于绝对门限","触发切换"],
["A5","服务小区差于门限1且邻区好于门限2","触发切换"]
]},
{t:"h4",c:"系统间测量事件（异系统）"},
{t:"table",h:["事件","触发条件","用途"],r:[
["B1","异系统邻区质量高于门限","启动异系统切换请求"],
["B2","服务小区差于门限1且异系统邻区好于门限2","异系统切换"]
]},
{t:"hl",c:"<strong>现网使用A3事件触发切换</strong>。eNB用于停止测量消息上传的事件为<strong>A2</strong>（服务小区变差时停止上传）。"}
]},
{title:"10.5 切换流程（X2/S1）",points:[
{t:"h4",c:"X2切换流程（基站间直接切换，13步）"},
{t:"p",c:"<strong>准备阶段（1-7步）</strong>：①源eNB下发测量控制 → ②UE完成测量配置 → ③UE上报测量报告 → ④源eNB判决切换 → ⑤源eNB发HANDOVER REQUEST → ⑥目标小区资源准入 → ⑦目标发HANDOVER REQUEST ACKNOWLEDGE"},
{t:"p",c:"<strong>执行阶段（8-9步）</strong>：⑧源eNB发RRC Connection Reconfiguration命令UE切换 → ⑨UE向目标eNB发送Reconfiguration Complete"},
{t:"p",c:"<strong>完成阶段（10-13步）</strong>：⑩目标eNB发PATH SWITCH REQUEST → ⑪MME更新数据通道 → ⑫目标发UE CONTEXT RELEASE → ⑬源eNB释放资源"},
{t:"h4",c:"S1切换流程（通过MME中转，16步）"},
{t:"p",c:"<strong>准备阶段（1-9步）</strong>：类似X2，但通过MME中转。源eNB发HANDOVER REQUIRED → MME发HANDOVER REQUEST给目标 → 目标分配资源发ACKNOWLEDGE → MME发HANDOVER COMMAND给源eNB。"},
{t:"p",c:"<strong>执行阶段（10-11步）</strong>：源eNB发RRC Reconfiguration → UE接入目标 → PDCP序号通过MME传递。"},
{t:"p",c:"<strong>完成阶段（12-16步）</strong>：目标发PATH SWITCH REQUEST → MME更新通道 → 目标发HANDOVER NOTIFY → 源eNB释放资源。"},
{t:"hl",c:"<strong>X2 vs S1区别</strong>：X2是基站间直连切换（更快），S1需经过MME中转（更慢，用于无X2接口时）。"},
{t:"img",src:"images/exam/50d4fc8a5fa52e352294eb4a1f02754a37a4c269d5360491da2ea31d15192b74.jpg",alt:"S1切换流程图"},
{t:"img",src:"images/exam/743e8008952f3c6b55fb7a7b201c1b18d541c615eafca936f6082f9332e13ace.jpg",alt:"切换流程详细图"}
]},
{title:"10.6 NB-IoT资源开销",points:[
{t:"h4",c:"NB-IoT下行信道资源占用"},
{t:"table",h:["资源名称","出现位置","资源占用比"],r:[
["NRS","忽略不计","0%"],
["NPSS","每1个无线帧中的子帧5","10%"],
["NSSS","每2个无线帧中的子帧9","5%"],
["NPBCH(MIB-NB)","每1个无线帧中的子帧0","10%"],
["SIB1-NB","每256个无线帧中的32个子帧","1.25%~5%"],
["SIBx-NB","每64个无线帧中的8个子帧","1.25%"],
["Paging","暂不支持","0%"]
]},
{t:"hl",c:"<strong>总开销</strong>：NPSS(10%) + NSSS(5%) + NPBCH(10%) + SIB1(~2.5%) + SIBx(1.25%) ≈ <strong>27.5%~31.25%</strong>。用户可用资源约70%左右。"},
{t:"img",src:"images/exam/38c18e7e51e1351baac74713d69635fecae086c65538901e4e05e8a55ea03c16.jpg",alt:"NB-IoT资源占用比例表"},
{t:"h4",c:"NB-IoT速率计算示例"},
{t:"p",c:"下行：100帧/秒 × 20时隙/帧 × 12×7 RE/时隙 × 2bit(QPSK) × 2天线 × 0.7(数据占比) ≈ <strong>0.5Mbit/s</strong>（约62.5KB/s）"},
{t:"p",c:"上行：100帧/秒 × 20时隙/帧 × 12×7 RE/时隙 × 1bit(BPSK) × 1天线 × 0.7(数据占比) ≈ <strong>0.13Mbit/s</strong>（约16.25KB/s）"},
{t:"img",src:"images/exam/4010cd088aa2c6c987765cbec41aa87059a891da773cc47f2d4f4b612e632a99.jpg",alt:"NB-IoT速率计算参数表"}
]}
]},{id:11,title:"第11章 5G峰值速率计算",sections:[
{title:"10.1 计算公式与教学",points:[
{t:"calc",title:"5G 峰值速率计算公式拆解",steps:[
{label:"公式",text:"峰值速率 = 每秒时隙数 × 上下行符号占比 × 每RB资源 × RB数 × 调制bit × 天线数 × 用户面占比"},
{label:"① 每秒时隙数",text:"1s=1000ms=100帧=1000子帧。5G 30kHz下每子帧2时隙，共2000时隙/秒。LTE为1000子帧/秒。"},
{label:"② 符号占比",text:"5G固定：(7×14+6)/140（10个时隙中7个全下行+1个特殊时隙含6个下行符号）。LTE根据子帧配比计算。"},
{label:"③ 每RB资源",text:"12子载波×14符号 = 168个RE/RB（5G）。LTE为12×7=84。"},
{label:"④ RB数",text:"5G：100MHz×98.28%÷(30kHz×12) = 273个RB。LTE：20MHz÷(15kHz×12) ≈ 100个RB。"},
{label:"⑤ 调制bit",text:"由CQI决定。256QAM=8bit，64QAM=6bit，16QAM=4bit，QPSK=2bit。"},
{label:"⑥ 天线(RANK)",text:"5G下行最大4/上行最大2（SA 2T4R，NSA 1T4R）。LTE下行最大2/上行最大1。"},
{label:"⑦ 用户面占比",text:"5G=80%（信令开销20%），LTE=75%（信令开销25%）。"}
],formula:"100 × 20 × [(7×14+6)/140] × 273 × 12 × 14 × 8 × 4 × 80% ≈ 1700Mbps",note:"此为5G NSA下行峰值速率（100MHz, 30kHz, 8:2配比, 256QAM, RANK=4）"},
{t:"svg",id:"rate-calc"},
{t:"img",src:"images/exam/259f9fecddd83739f850146794edebfe7d78882283d9950f35e3bd9b65d3bc46.jpg",alt:"5G/LTE速率计算参数对比表"}
]},
{title:"10.2 LTE子帧配比计算示例",points:[
{t:"calc",title:"LTE TDD 子帧配比换算",steps:[
{label:"配比3:1",text:"特殊子帧3:9:2 → 下行：(6×14)/140 = 84/140，上行：(2×14)/140 = 28/140"},
{label:"配比2:2",text:"特殊子帧10:2:2 → 下行：(4×14+10)/140 = 66/140，上行：(4×14)/140 = 56/140"},
{label:"FDD",text:"上下行对称，均为10（10个子帧下行+10个子帧上行/10ms）"}
],formula:"",note:"特殊子帧中DwPTS部分可传输下行数据，需计入下行符号数"},
{t:"h4",c:"影响速率的5大因素"},
{t:"table",h:["因素","说明","不达标原因"],r:[
["时隙调度(GRANT)","移动8:2→下行1600次/s","终端异常、配比错误、传输受限"],
["RB调度","100M带宽273个RB","用户争抢、BWP配置小、参数问题"],
["MCS阶数","由CQI决定(0-15)","无线环境差、干扰、256QAM未开"],
["RANK","受限于终端能力","多径效果差、参数固定、频繁切换"],
["BLER","要求<10%","弱覆盖、重叠覆盖、上行干扰"]
]},
{t:"hl",c:"一般建议 <strong>RANK × MCS > 72</strong>。RANK越高MCS越低（流间干扰），需寻求最优组合。NSA和SA速率区别主要在上行（NSA 1T4R，SA 2T4R）。"}
]}
]}
];
