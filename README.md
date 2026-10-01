# portfolio

數值／系統企劃的實作案例：為專案建立 AI 生產工具、AI 驗證工具與 AI 工作流。

- **Project B**　從一句話到可上線關卡 — AI 生產工具 × AI 驗證工具：口語需求產出可直接貼回遊戲的資料表；模擬器跑遊戲本身的戰鬥程式碼
- **Project I**　角色資料的 AI 工作流 — AI 工作流 × AI 驗證工具：做新角色、修 QA 卡、一次改幾十名角色，都交給同一套 skill
- **Project S**　主線難度收斂分析 — 數值設計：580 關、五版迭代的敵方戰力調整與通關成效驗證

網址：<https://gs040664.github.io/portfolio/>

可以直接連到子畫面，例如 `#tooling/sim`（模擬器）、`#pipeline/verify`（驗證流程）。

靜態 HTML／CSS／JavaScript，無建置相依套件。`index.html` 保留各案例與雜湊路由；`assets/site.css` 是原有樣式，`assets/portfolio-redesign.css` 是案例開場樣式。模擬報告的資料、樣式與互動程式只在打開 Project B 模擬器分頁時載入。參數實驗室預設離線；只有在本機網址點選「連接本機引擎」才會嘗試連線。

專案名、關卡名、角色名、資料表 ID、卡號與同仁姓名皆已去識別化；重製示意在頁面上標示。
本站設有 `noindex`，不進搜尋引擎索引。
