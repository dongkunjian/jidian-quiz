// 1.1 机电工程常用材料 —— 合并入口（逐句覆盖版）
// 数据按教材页码分块：A=p1~p3  B=p4~p6  C=p7~p9  D=p10~p12  CASES=实务案例
// 题型：single(单选4选1) / multi(多选5选2~4) / case(案例·背景+选择小问)
window.S1_1 = {
  id: "1.1",
  name: "机电工程常用材料",
  source: "2026官方教材 印刷 p1-12 / PDF p9-20",
  points: [].concat(
    (window.S1_1_A||{points:[]}).points,
    (window.S1_1_B||{points:[]}).points,
    (window.S1_1_C||{points:[]}).points,
    (window.S1_1_D||{points:[]}).points
  ),
  questions: [].concat(
    (window.S1_1_A||{questions:[]}).questions,
    (window.S1_1_B||{questions:[]}).questions,
    (window.S1_1_C||{questions:[]}).questions,
    (window.S1_1_D||{questions:[]}).questions,
    (window.S1_1_CASES||[])
  )
};
