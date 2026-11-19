// 全书章节目录：3 篇 16 章 55 节。data 字段指向题库数据对象的 key，null 表示尚未录入。
window.CATALOG = {
  parts: [
    {
      name: "第 1 篇 机电工程技术",
      chapters: [
        { no: 1, name: "第 1 章 机电工程常用材料与设备", sections: [
          { id: "1.1", name: "机电工程常用材料", page: "印刷1-12", data: "S1_1", state: "doing" },
          { id: "1.2", name: "机电工程常用设备", page: "印刷12-22", data: "S1_2", state: "doing" }
        ]},
        { no: 2, name: "第 2 章 机电工程专业技术", sections: [
          { id: "2.1", name: "工程测量技术", page: "印刷23", data: null, state: "todo" },
          { id: "2.2", name: "起重技术", page: "印刷30", data: null, state: "todo" },
          { id: "2.3", name: "焊接技术", page: "印刷44", data: null, state: "todo" }
        ]},
        { no: 3, name: "第 3 章 建筑机电工程施工技术", sections: [
          { id: "3.1", name: "建筑给水排水与供暖工程施工技术", page: "印刷57", data: null, state: "todo" },
          { id: "3.2", name: "建筑电气工程施工技术", page: "印刷68", data: null, state: "todo" },
          { id: "3.3", name: "通风与空调工程施工技术", page: "印刷84", data: null, state: "todo" },
          { id: "3.4", name: "智能化系统工程施工技术", page: "印刷103", data: null, state: "todo" },
          { id: "3.5", name: "电梯工程施工技术", page: "印刷113", data: null, state: "todo" },
          { id: "3.6", name: "消防工程施工技术", page: "印刷122", data: null, state: "todo" }
        ]},
        { no: 4, name: "第 4 章 工业机电工程安装技术", sections: [
          { id: "4.1", name: "机械设备安装技术", page: "印刷134", data: null, state: "todo" },
          { id: "4.2", name: "工业管道施工技术", page: "印刷153", data: null, state: "todo" },
          { id: "4.3", name: "电气装置安装技术", page: "印刷168", data: null, state: "todo" },
          { id: "4.4", name: "自动化仪表工程安装技术", page: "印刷185", data: null, state: "todo" },
          { id: "4.5", name: "防腐蚀工程施工技术", page: "印刷196", data: null, state: "todo" },
          { id: "4.6", name: "绝热工程施工技术", page: "印刷205", data: null, state: "todo" },
          { id: "4.7", name: "石油化工设备安装技术", page: "印刷212", data: null, state: "todo" },
          { id: "4.8", name: "发电设备安装技术", page: "印刷231", data: null, state: "todo" },
          { id: "4.9", name: "冶炼设备安装技术", page: "印刷241", data: null, state: "todo" }
        ]}
      ]
    },
    {
      name: "第 2 篇 机电工程相关法规与标准",
      chapters: [
        { no: 5, name: "第 5 章 相关法规", sections: [
          { id: "5.1", name: "计量的规定", page: "印刷259", data: null, state: "todo" },
          { id: "5.2", name: "建设用电及施工的规定", page: "印刷265", data: null, state: "todo" },
          { id: "5.3", name: "特种设备的规定", page: "印刷271", data: null, state: "todo" }
        ]},
        { no: 6, name: "第 6 章 相关标准", sections: [
          { id: "6.1", name: "建筑机电工程设计与施工标准", page: "印刷282", data: null, state: "todo" },
          { id: "6.2", name: "工业机电工程设计与施工标准", page: "印刷297", data: null, state: "todo" }
        ]}
      ]
    },
    {
      name: "第 3 篇 机电工程项目管理实务",
      chapters: [
        { no: 7, name: "第 7 章 机电工程企业资质与施工组织", sections: [
          { id: "7.1", name: "机电工程企业资质", page: "印刷307", data: null, state: "todo" },
          { id: "7.2", name: "施工项目管理机构", page: "印刷311", data: null, state: "todo" },
          { id: "7.3", name: "施工组织设计", page: "印刷317", data: null, state: "todo" }
        ]},
        { no: 8, name: "第 8 章 工程招标投标与合同管理", sections: [
          { id: "8.1", name: "工程招标投标", page: "印刷335", data: null, state: "todo" },
          { id: "8.2", name: "工程合同管理", page: "印刷342", data: null, state: "todo" }
        ]},
        { no: 9, name: "第 9 章 施工进度管理", sections: [
          { id: "9.1", name: "施工进度计划", page: "印刷356", data: null, state: "todo" },
          { id: "9.2", name: "施工进度控制", page: "印刷360", data: null, state: "todo" },
          { id: "9.3", name: "工程费用-进度偏差分析与控制", page: "印刷364", data: null, state: "todo" }
        ]},
        { no: 10, name: "第 10 章 施工质量管理", sections: [
          { id: "10.1", name: "施工质量控制策划", page: "印刷376", data: null, state: "todo" },
          { id: "10.2", name: "施工质量预控", page: "印刷379", data: null, state: "todo" },
          { id: "10.3", name: "施工质量检验", page: "印刷383", data: null, state: "todo" },
          { id: "10.4", name: "施工质量统计与分析", page: "印刷388", data: null, state: "todo" },
          { id: "10.5", name: "施工质量问题和质量事故处理", page: "印刷393", data: null, state: "todo" }
        ]},
        { no: 11, name: "第 11 章 施工成本管理", sections: [
          { id: "11.1", name: "施工图预算", page: "印刷402", data: null, state: "todo" },
          { id: "11.2", name: "施工成本分析与控制", page: "印刷408", data: null, state: "todo" },
          { id: "11.3", name: "项目资金管理", page: "印刷419", data: null, state: "todo" }
        ]},
        { no: 12, name: "第 12 章 施工安全管理", sections: [
          { id: "12.1", name: "安全风险管理策划", page: "印刷434", data: null, state: "todo" },
          { id: "12.2", name: "施工安全管理规定与实施", page: "印刷439", data: null, state: "todo" },
          { id: "12.3", name: "施工安全事故处理与职业健康", page: "印刷446", data: null, state: "todo" }
        ]},
        { no: 13, name: "第 13 章 绿色建造及施工现场环境管理", sections: [
          { id: "13.1", name: "绿色施工", page: "印刷453", data: null, state: "todo" },
          { id: "13.2", name: "施工现场环境管理", page: "印刷460", data: null, state: "todo" }
        ]},
        { no: 14, name: "第 14 章 机电工程项目资源与协调管理", sections: [
          { id: "14.1", name: "人力资源管理", page: "印刷466", data: null, state: "todo" },
          { id: "14.2", name: "工程设备管理", page: "印刷468", data: null, state: "todo" },
          { id: "14.3", name: "工程材料管理", page: "印刷475", data: null, state: "todo" },
          { id: "14.4", name: "施工机械管理", page: "印刷478", data: null, state: "todo" },
          { id: "14.5", name: "施工协调管理", page: "印刷480", data: null, state: "todo" }
        ]},
        { no: 15, name: "第 15 章 机电工程试运行及竣工验收管理", sections: [
          { id: "15.1", name: "试运行管理", page: "印刷490", data: null, state: "todo" },
          { id: "15.2", name: "竣工验收管理", page: "印刷500", data: null, state: "todo" }
        ]},
        { no: 16, name: "第 16 章 机电工程运维与保修管理", sections: [
          { id: "16.1", name: "运维管理", page: "印刷518", data: null, state: "todo" },
          { id: "16.2", name: "保修与回访管理", page: "印刷520", data: null, state: "todo" }
        ]}
      ]
    }
  ]
};
