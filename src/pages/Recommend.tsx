import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { modelsOf } from "../data/api-models";
import { FAMILY_ORDER } from "../data/plans";
import { formatCny } from "../data/shop";
import { FAMILY_LABEL, type Family } from "../data/types";
import { recommend } from "../lib/recommend";
import { DEFAULT_IN_RATIO, usd } from "../lib/worth";

const PRESETS = [
  { label: "轻度 2M", value: 2 },
  { label: "中度 10M", value: 10 },
  { label: "重度 50M", value: 50 },
];

export function RecommendPage() {
  const [family, setFamily] = useState<Family>("claude");
  const familyModels = modelsOf(family);
  const [modelId, setModelId] = useState(familyModels[0]?.id ?? "");
  const [tokensM, setTokensM] = useState(10);
  const [inRatio, setInRatio] = useState(DEFAULT_IN_RATIO);

  const result = useMemo(
    () =>
      recommend({
        family,
        tokensM,
        inRatio,
        modelId,
      }),
    [family, tokensM, inRatio, modelId],
  );

  return (
    <>
      <p className="kicker">按模型和月用量筛选</p>
      <h1 className="page-title">推荐套餐</h1>
      <p className="lede">
        例如：要用 Claude，一个月大概 10M token，看哪一档更接近。推荐用 API 牌价估算，不把未公开配额写成精确数字。
      </p>

      <div className="panel">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fam">模型家族</label>
            <select
              id="fam"
              value={family}
              onChange={(e) => {
                const next = e.target.value as Family;
                setFamily(next);
                setModelId(modelsOf(next)[0]?.id ?? "");
              }}
            >
              {FAMILY_ORDER.map((f) => (
                <option key={f} value={f}>
                  {FAMILY_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rmodel">对照模型</label>
            <select
              id="rmodel"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={familyModels.length === 0}
            >
              {familyModels.length === 0 ? (
                <option>该家族 API 牌价未获取</option>
              ) : (
                familyModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tok">每月 token（百万）</label>
            <input
              id="tok"
              type="number"
              min={0.1}
              step={0.5}
              value={tokensM}
              onChange={(e) => setTokensM(Number(e.target.value))}
            />
            <div className="presets">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`chip ${tokensM === p.value ? "is-on" : ""}`}
                  onClick={() => setTokensM(p.value)}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="mix">输入占比 {Math.round(inRatio * 100)}%</label>
            <div className="range-row">
              <input
                id="mix"
                type="range"
                min={0.3}
                max={0.9}
                step={0.05}
                value={inRatio}
                onChange={(e) => setInRatio(Number(e.target.value))}
              />
            </div>
            <p className="small">其余为输出。默认 70 / 30，可改。</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="headline">{result.headline}</p>
        {result.model ? (
          <p className="small" style={{ marginTop: -4, marginBottom: 16 }}>
            估算 API 成本 {usd(result.apiCost)} · {result.model.name} · 核验{" "}
            {result.model.verifiedAt}
          </p>
        ) : (
          <p className="small">此家族没有已核验的 API 牌价，只按套餐标价和官方额度原文排列。</p>
        )}
        <div className="rank">
          {result.ranked.map((r) => (
            <div className="rank-item" key={r.plan.id}>
              <div>
                <div className="price">{r.plan.priceLabel}</div>
                <div className="small">{r.plan.billing}</div>
              </div>
              <div>
                <h3>
                  {r.plan.product} {r.plan.name}
                </h3>
                <p>{r.reason}</p>
              </div>
              <a className="cta is-ghost" href={r.plan.officialUrl} target="_blank" rel="noreferrer">
                官网
              </a>
            </div>
          ))}
        </div>
      </div>

      {result.shop.length ? (
        <div className="panel">
          <p className="headline">
            推广代充
            <span className="tag is-promo" style={{ marginLeft: 8 }}>
              非官方
            </span>
          </p>
          <p className="disclaimer">
            第三方渠道不能改变地区资格，也不应索取密码。库存来自 EA小铺 2026-10-31 快照。
          </p>
          {result.shop.map((s) => (
            <div className="rank-item" key={s.id}>
              <div className="price">{formatCny(s.priceCny)}</div>
              <div>
                <h3>{s.name}</h3>
                <p>
                  对应 {s.officialEquivalent} · 快照库存 {s.stock}
                </p>
              </div>
              <a className="cta is-promo" href={s.url} target="_blank" rel="noreferrer">
                去店铺
              </a>
            </div>
          ))}
          <p className="small">
            <Link to="/articles/third-party-recharge">代充说明</Link>
            {" · "}
            <Link to="/shop">全部推广商品</Link>
          </p>
        </div>
      ) : null}
    </>
  );
}
