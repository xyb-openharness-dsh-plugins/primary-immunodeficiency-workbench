/* 演示数据（唯一源）· 两组合成档案 · 原发性免疫缺陷病（PID）
 * A：刚确诊、记录少、多处未知；B：替代治疗维持多年、感染与输注与化验都多。
 * 全部为合成示例，不冒充真实病历；页面不写死数字，一切从这里读。
 * 术语：免疫球蛋白「替代治疗」（replacement therapy）；参考范围一律不出现在此（阈值【待核】）。
 * 本文件只放数据，不放逻辑；TODAY 由 app.js 固定。
 */
window.DEMO_DATA = {
  TODAY: '2026-11-12',
  /* 指标元数据（唯一源）：app.js 与服务端 metric_defs 都从这里读；阈值一律不在此出现 */
  metricDefs: [
    { key: 'IGG', db: 'igg', title: '免疫球蛋白 IgG（谷浓度）', category: 'immun', unit: 'g/L', color: '#38696b', ord: 0 },
    { key: 'IGA', db: 'iga', title: '免疫球蛋白 IgA', category: 'immun', unit: 'g/L', color: '#b0682f', ord: 1 },
    { key: 'IGM', db: 'igm', title: '免疫球蛋白 IgM', category: 'immun', unit: 'g/L', color: '#6b5b95', ord: 2 },
    { key: 'CD4', db: 'cd4', title: 'CD4 T 细胞绝对数', category: 'subsets', unit: 'cells/µL', color: '#2e7d5b', ord: 3 },
    { key: 'CD19', db: 'cd19', title: 'CD19 B 细胞绝对数', category: 'subsets', unit: 'cells/µL', color: '#a3405e', ord: 4 },
    { key: 'WBC', db: 'wbc', title: '白细胞（WBC）', category: 'hemogram', unit: '×10⁹/L', color: '#3a7ca5', ord: 5 }
  ],
  metricGroups: [
    { key: 'immun', title: '免疫球蛋白', items: ['IGG', 'IGA', 'IGM'] },
    { key: 'subsets', title: '淋巴细胞亚群', items: ['CD4', 'CD19'] },
    { key: 'hemogram', title: '血象', items: ['WBC'] }
  ],
  profiles: [
    {
      id: 'demo-a',
      name: '示例档案 A · 刚确诊',
      tag: '刚确诊 · 记录少 · 多处未知',
      profile: {
        '代记视角': '家长代记',
        '出生年份': '2019',
        '诊断依据（医生原话）': '「临床符合反复严重感染病史，结合免疫功能检查与基因检测，诊断方向考虑原发性免疫缺陷病，具体分型待基因报告回报后由免疫科随诊确定。」（2026-10 合成示例）',
        '基因检测': '已采样，报告未回（未知）',
        '医生行动计划原话': null,
        '建档日期': '2026-10-20'
      },
      infections: [
        { id: 'a-inf-1', start: '2026-09-05', end: '2026-09-19', site: '肺', pathogen: null, meds: '（住院期间用药，家长记不全，待补）', note: '肺炎住院；出院小结已登记到资料页', private: false },
        { id: 'a-inf-2', start: '2026-10-11', end: null, site: '中耳', pathogen: null, meds: '（医生开的滴耳液，名字待核对）', note: '中耳炎复诊中', private: false },
        { id: 'a-inf-3', start: '2026-08-02', end: '2026-08-10', site: '皮肤', pathogen: null, meds: '', note: '（这条想留着不给医生看）', private: true }
      ],
      infusions: [],
      labs: [
        { id: 'a-lab-1', metric: 'IGG', date: '2026-10-15', value: 2.1, unit: 'g/L', method: '免疫比浊', org: '示例市儿童医院', private: false },
        { id: 'a-lab-2', metric: 'WBC', date: '2026-10-15', value: 12.3, unit: '×10⁹/L', method: '血球仪', org: '示例市儿童医院', private: false }
      ],
      vaccines: [],
      meds: [],
      reports: [
        { id: 'a-rep-1', title: '出院小结（肺炎）', date: '2026-09-19', kind: '病历', source: '原件已登记', keydesc: '出院医嘱原文已拍照留存', private: false },
        { id: 'a-rep-2', title: '免疫功能检验单', date: '2026-10-15', kind: '化验', source: '未取得原件', keydesc: '只有手机翻拍', private: false }
      ],
      questions: [
        { id: 'a-q-1', q: '基因报告什么时候出？需要挂哪个科看结果？', addedOn: '2026-11-01', answered: false, private: false },
        { id: 'a-q-2', q: '下次免疫球蛋白复查要空腹吗？', addedOn: '2026-11-05', answered: false, private: false }
      ],
      hospitals: [
        { id: 'a-h-1', name: '示例市儿童医院', dept: '免疫科（周三上午门诊）', contact: '导诊台 0XX-XXXX-XXXX（出处：挂号单）', ver: 1 }
      ],
      mind: {
        feel: [
          { d: '2026-11-03', text: '等基因报告的这段时间心里没底，不知道孩子到底是什么类型。', author: '妈妈（家长代记）', private: true }
        ],
        family: [
          { d: '2026-10-25', text: '奶奶帮忙接送上学，这几个月拜托她了。', author: '妈妈', private: false }
        ]
      }
    },
    {
      id: 'demo-b',
      name: '示例档案 B · 维持期多年',
      tag: '替代治疗维持 4 年 · 感染与化验都多',
      profile: {
        '代记视角': '本人（成人患者）',
        '出生年份': '1990',
        '诊断依据（医生原话）': '「CVID（常见变异型免疫缺陷病），2022 年起规律 IVIG 替代治疗。」（合成示例，只记医生给的诊断，不自算分型）',
        '基因检测': '未做（医生未安排）',
        '医生行动计划原话': '「若发热超过 38.5℃ 持续两天，或出现气促，直接联系免疫科值班，不用等下一次预约。」（2026-06 复诊录音整理，合成示例）',
        '建档日期': '2022-04-08'
      },
      infections: [
        { id: 'b-inf-1', start: '2022-06-10', end: '2022-06-30', site: '鼻窦', pathogen: null, meds: '阿莫西林克拉维酸钾（处方照录）', note: '鼻窦炎第一年比较频繁', private: false },
        { id: 'b-inf-2', start: '2023-02-14', end: '2023-03-02', site: '肺', pathogen: '未检出（痰培养阴性）', meds: '左氧氟沙星（处方照录）', note: '咳嗽迁延，胸片随诊', private: false },
        { id: 'b-inf-3', start: '2023-11-08', end: '2023-11-20', site: '中耳', pathogen: null, meds: '（药店买的滴耳液，名字忘了——日期未知条目见下）', note: '这条开始日期记不清了', private: false },
        { id: 'b-inf-4', start: '2024-03-05', end: '2024-03-18', site: '肺', pathogen: '肺炎链球菌（痰培养）', meds: '青霉素（皮试阳性，换用替代方案——医嘱原话待补）', note: '住院 5 天', private: false },
        { id: 'b-inf-5', start: '2024-12-20', end: '2025-01-05', site: '鼻窦', pathogen: null, meds: '阿莫西林克拉维酸钾（处方照录）', note: '冬季常规发作', private: false },
        { id: 'b-inf-6', start: '2026-09-12', end: '2026-09-25', site: '肺', pathogen: null, meds: '（社区输液，药名待补）', note: '这条不想让导出带出去', private: true },
        { id: 'b-inf-7', start: '2026-05-30', end: '2026-06-11', site: '皮肤软组织', pathogen: null, meds: '头孢（处方照录）', note: '外伤后局部感染', private: false },
        { id: 'b-inf-8', start: '2026-10-28', end: null, site: '肺', pathogen: '未检出', meds: '莫西沙星（处方照录）', note: '目前还在随访中，未停药', private: false }
      ],
      infusions: [
        { id: 'b-iv-1', date: '2026-08-14', kind: 'IVIG 输注', name: 'IVIG 10% 30g（0.4g/kg 照医嘱），示例市一院日间输液', note: '输注中轻微头痛，减慢滴速后缓解（自述）', private: false },
        { id: 'b-iv-2', date: '2026-09-11', kind: 'IVIG 输注', name: 'IVIG 10% 30g，示例市一院日间输液', note: '', private: false },
        { id: 'b-iv-3', date: '2026-10-09', kind: 'IVIG 输注', name: 'IVIG 10% 30g，示例市一院日间输液', note: '无不适', private: false },
        { id: 'b-iv-4', date: '2026-11-06', kind: 'IVIG 输注', name: 'IVIG 10% 30g，示例市一院日间输液', note: '输注前 IgG 谷浓度化验同日（见化验页）', private: false },
        { id: 'b-iv-5', date: '2026-10-20', kind: '复诊', name: '免疫科复诊（医生调整随访间隔原话见档案）', note: '', private: false }
      ],
      labs: [
        { id: 'b-lab-1', metric: 'IGG', date: '2026-02-06', value: 7.8, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-2', metric: 'IGG', date: '2026-05-08', value: 8.4, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-3', metric: 'IGG', date: '2026-08-12', value: 7.9, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-4', metric: 'IGG', date: '2026-08-13', value: 810, unit: 'mg/dL', method: '散射比浊', org: '示例医学检验中心', private: false },
        { id: 'b-lab-5', metric: 'IGG', date: '2026-11-06', value: 8.6, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-6', metric: 'IGA', date: '2026-08-12', value: 0.31, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-12', metric: 'IGA', date: '2026-02-06', value: 0.28, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-7', metric: 'IGM', date: '2026-08-12', value: 0.42, unit: 'g/L', method: '免疫比浊', org: '示例市一院', private: false },
        { id: 'b-lab-8', metric: 'CD4', date: '2026-08-12', value: 410, unit: 'cells/µL', method: '流式细胞术', org: '示例市一院', private: false },
        { id: 'b-lab-9', metric: 'CD19', date: '2026-08-12', value: 62, unit: 'cells/µL', method: '流式细胞术', org: '示例市一院', private: false },
        { id: 'b-lab-10', metric: 'WBC', date: '2026-11-06', value: 6.8, unit: '×10⁹/L', method: '血球仪', org: '示例市一院', private: false },
        { id: 'b-lab-11', metric: 'WBC', date: '2026-10-30', value: 11.2, unit: '×10⁹/L', method: '血球仪', org: '示例市一院', private: true }
      ],
      vaccines: [
        { id: 'b-vx-1', date: '2026-06-20', who: '免疫科李医生（复诊）', words: '「你这种情况，流感灭活疫苗可以打，具体安排听社区；家人也建议打。」（录音整理，合成示例）', private: false }
      ],
      meds: [
        { name: '复方磺胺甲噁唑（预防性，医生口径）', since: '2024-04', schedule: '医生原话：「每周一三五各一次，先吃到今年年底再评估。」（合成示例）', note: '剂量以处方原件为准，本台不录剂量判定' }
      ],
      reports: [
        { id: 'b-rep-1', title: '2026-11-06 化验单（IgG 谷浓度）', date: '2026-11-06', kind: '化验', source: '原件已登记', keydesc: '输注前采血', private: false },
        { id: 'b-rep-2', title: '免疫科门诊病历 2026-10-20', date: '2026-10-20', kind: '病历', source: '原件已登记', keydesc: '含行动计划原话', private: false },
        { id: 'b-rep-3', title: '2022 年诊断证明', date: '2022-04-08', kind: '病历', source: '未取得原件', keydesc: '原件在医院档案室，未调出', private: false },
        { id: 'b-rep-4', title: '胸部 CT 报告（2026-10-30）', date: '2026-10-30', kind: '影像', source: '仅题录', keydesc: '（报告内容不想展示）', private: true },
        { id: 'b-rep-5', title: '出院小结（2024-03）', date: '2024-03-18', kind: '病历', source: '原件已登记', keydesc: '扫描件在资料目录', private: false }
      ],
      questions: [
        { id: 'b-q-1', q: '下次输注间隔要不要从 4 周改成 3 周？（医生上次说再看看）', addedOn: '2026-11-08', answered: false, private: false },
        { id: 'b-q-2', q: 'SCIG 自己在家打是否适合我？', addedOn: '2026-11-08', answered: false, private: false },
        { id: 'b-q-3', q: '孩子以后要不要做基因检查？', addedOn: '2026-10-20', answered: true, private: false }
      ],
      hospitals: [
        { id: 'b-h-1', name: '示例市第一医院', dept: '免疫科', contact: '0XX-XXXX-XXXX（出处：门诊病历封面）', ver: 2 },
        { id: 'b-h-2', name: '示例大学附属医院', dept: '呼吸与危重症（会诊用）', contact: '会诊单上的电话（出处引用）', ver: 1 }
      ],
      mind: {
        feel: [
          { d: '2026-11-07', text: '每次输完那一周感觉还行，到第四周就开始担心下一次感染。', author: '本人', private: false },
          { d: '2026-10-22', text: '同事问为什么每个月要请假半天，解释起来很累。', author: '本人', private: true }
        ],
        family: [
          { d: '2026-09-15', text: '爱人负责每次输注日开车接送。', author: '本人', private: false }
        ]
      }
    }
  ]
}
