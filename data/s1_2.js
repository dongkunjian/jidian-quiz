// 1.2 机电工程常用设备 —— 合并入口（逐句覆盖版）
// 数据按教材页码分块：A=p12~p14  B=p15~p17  C=p18~p19  D=p20~p22  CASES=实务案例
// 题型：single(单选4选1) / multi(多选5选2~4) / case(案例·背景+选择小问)
window.S1_2 = {
  id: "1.2",
  name: "机电工程常用设备",
  source: "2026官方教材 印刷 p12-22 / PDF p20-30",
  points: [].concat(
    (window.S1_2_A||{points:[]}).points,
    (window.S1_2_B||{points:[]}).points,
    (window.S1_2_C||{points:[]}).points,
    (window.S1_2_D||{points:[]}).points
  ),
  questions: [].concat(
    (window.S1_2_A||{questions:[]}).questions,
    (window.S1_2_B||{questions:[]}).questions,
    (window.S1_2_C||{questions:[]}).questions,
    (window.S1_2_D||{questions:[]}).questions,
    (window.S1_2_CASES||[])
  )
};
