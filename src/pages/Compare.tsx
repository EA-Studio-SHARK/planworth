import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_MODELS, modelsOf } from "../data/api-models";
import { FAMILY_ORDER, plans, plansOf } from "../data/plans";
import { shopOf } from "../data/shop";
import { FAMILY_LABEL, type Family } from "../data/types";
import { DEFAULT_IN_RATIO, mTok, tokensForBudget, usd, worthOfPlan } from "../lib/worth";

export function ComparePage() {
  const [family, setFamily] = useState<Family | "all">("claude");
  const [modelId, setModelId] = useState("sonnet-5.5");
  const model = API_MODELS.find((m) => m.id === modelId) ?? API_MODELS[0];
  const visible = family === "all" ? FAMILY_ORDER : [family];

  const familyModels = family === "all" ? API_MODELS : modelsOf(family);
  const spotlight = useMemo(() => {
    const list =
      family === "all" ? plans.filter((p) => p.family === model.family) : plansOf(family);
    const plus =
      list.find((p) => p.priceUsd === 20) ?? list.find((p) => (p.priceUsd ?? 0) > 0);
    if (!plus || plus.family !== model.family) return null;
    return { plus, w: worthOfPlan(plus, model, DEFAULT_IN_RATIO) };
  }, [family, model]);

  return (
    <>
      <p className="kicker">把会员标价换成 API 牌价</p>
      <h1 className="page-title">订阅对照</h1>
      <p className="lede">
        选一个模型和套餐，看 $20 / $100 / $200 在 API 牌价下相当于多少百万 token。
        网页聊天的精确配额多数官方未公开，自带 API credits 才能写成美元。
      </p>

      <div className="filters" role="tablist" aria-label="产品家族">
        <button
          className={`chip ${family === "all" ? "is-on" : ""}`}
          onClick={() => setFamily("all")}
        >
          全部
        </button>
        {FAMILY_ORDER.map((f) => (
          <button
            key={f}
            className={`chip ${family === f ? "is-on" : ""}`}
            onClick={() => {
              setFamily(f);
              const first = modelsOf(f)[0];
              setModelId(first?.id ?? "");
            }}
          >
            {FAMILY_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="model">用来换算的 API 模型</label>
            <select
              id="model"
              value={familyModels.length ? modelId : ""}
              onChange={(e) => setModelId(e.target.value)}
              disabled={familyModels.length === 0}
            >
              {familyModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · 入 ${m.inputPerMTok} / 出 ${m.outputPerMTok} / MTok
                </option>
              ))}
              {familyModels.length === 0 ? (
                <option value="">该家族 API 牌价未获取</option>
              ) : null}
            </select>
          </div>
          <div className="field">
            <label>混合假设</label>
            <p className="small" style={{ margin: "8px 0 0" }}>
              70% 输入 + 30% 输出。混合单价 {usd(worthOfPlan(plans[0], model, DEFAULT_IN_RATIO).blended)} / MTok。
              核验 {model.verifiedAt}，
              <a href={model.officialUrl} target="_blank" rel="noreferrer"> 官方价目</a>
              。
            </p>
          </div>
        </div>
      </div>

      {spotlight ? (
        <div className="worth-strip">
          <div className="stat">
            <p className="label">{spotlight.plus.product} {spotlight.plus.name}</p>
            <p className="value">{spotlight.plus.priceLabel}</p>
            <p>核验 {spotlight.plus.verifiedAt}</p>
          </div>
          <div className="stat">
            <p className="label">按 {model.name} 牌价，标价约等于</p>
            <p className="value">{mTok(spotlight.w.tokenFromPriceM)} token</p>
            <p>这是「若全部走 API」的换算，不是官方配额。</p>
          </div>
          <div className="stat">
            <p className="label">套餐自带 API credits</p>
            <p className="value">
              {spotlight.plus.apiCreditsUsd != null
                ? usd(spotlight.plus.apiCreditsUsd, 0)
                : "未获取"}
            </p>
            <p>
              {spotlight.plus.apiCreditsUsd
                ? `按同一模型约 ${mTok(tokensForBudget(spotlight.plus.apiCreditsUsd, model, DEFAULT_IN_RATIO))}`
                : "多数 $20 档不附带 API 余额"}
            </p>
          </div>
        </div>
      ) : null}

      {visible.map((f) => {
        const rows = plansOf(f);
        const shop = shopOf(f);
        return (
          <section className="product" key={f}>
            <div className="product-head">
              <h2>{FAMILY_LABEL[f]}</h2>
              <span>
                {shop.length ? (
                  <Link to="/shop" className="tag is-promo">
                    推广代充 {shop.length} 项
                  </Link>
                ) : null}
                <a href={rows[0]?.officialUrl} target="_blank" rel="noreferrer">
                  官方价格页
                </a>
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>套餐</th>
                    <th className="num">标价</th>
                    <th>含哪些模型</th>
                    <th>额度（官方原文）</th>
                    <th className="num">≈ API token</th>
                    <th className="num">API credits</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const w = worthOfPlan(p, model, DEFAULT_IN_RATIO);
                    const sameFamily = p.family === model.family;
                    return (
                      <tr key={p.id}>
                        <td>
                          {p.name}
                          {p.includesCodeAgent ? (
                            <div className="small">含编程代理</div>
                          ) : null}
                        </td>
                        <td className="num">{p.priceLabel}</td>
                        <td className="models">{p.models.join("、")}</td>
                        <td>
                          {p.quotaOfficial}
                          {!p.exactQuotaPublished ? (
                            <div className="small">精确 token 数未公开</div>
                          ) : null}
                        </td>
                        <td className="num">
                          {sameFamily && p.priceUsd
                            ? mTok(w.tokenFromPriceM)
                            : p.priceUsd
                              ? "换模型后重算"
                              : "-"}
                        </td>
                        <td className="num">
                          {p.apiCreditsUsd != null ? usd(p.apiCreditsUsd, 0) : "无"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="small" style={{ padding: "10px 0 14px" }}>
              {rows[0]?.sourceNote}。API 是否单独计费：
              {rows.some((r) => r.apiBilledSeparately) ? "是" : "否"}。
              <Link to="/recommend"> 按月用量推荐套餐</Link>
            </p>
          </section>
        );
      })}
    </>
  );
}
