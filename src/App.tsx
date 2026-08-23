import { useMemo, useState } from "react";
import { run as runController } from "./core/controller";
import type { Config, EvidenceProfile, Mode, Scenario } from "./core/types";

type Language = "en" | "ru";

const copy = {
  en: {
    subtitle: "Bounded-Control Research Simulator",
    deterministic: "PUBLIC REFERENCE · DETERMINISTIC",
    overview: "Overview",
    experiments: "Experiments",
    topology: "Topology",
    history: "History",
    settings: "Settings",
    experiment: "Experiment",
    scenario: "Scenario",
    seed: "Seed",
    load: "Load",
    mode: "Operating mode",
    evidenceProfile: "Evidence quality",
    priorTrust: "Prior trust",
    run: "Run experiment",
    trust: "Bounded Trust",
    evidence: "Evidence",
    consensus: "Consensus",
    stability: "Stability",
    gate: "Decision Gate",
    fullProposal: "Full model proposal",
    appliedAction: "Applied inside model",
    none: "None",
    proposed: "Proposed simulation",
    gateReasons: "Gate constraints",
    noHardCap: "No hard cap triggered",
    actionVerified: "MODEL ACTION APPLIED + CHECKED",
    noActionVerified: "NO ACTION REQUIRED IN MODEL",
    noExternalAction: "NO EXTERNAL ACTION",
    topologyTitle: "Service topology",
    beforeAfter: "Evidence states",
    metric: "Metric",
    before: "Before",
    simulated: "Proposed model state",
    observed: "Post-gate model state",
    notExecuted: "Not executed",
    evidenceLog: "Evidence log",
    disclaimer:
      "Public reference simulator only. It uses synthetic states, performs no external actions, and is not a production policy.",
    latency: "Latency",
    errorRate: "Error rate",
    saturation: "Throughput",
    health: "Health",
  },
  ru: {
    subtitle: "Исследовательский симулятор ограниченного управления",
    deterministic: "ПУБЛИЧНАЯ МОДЕЛЬ · ДЕТЕРМИНИРОВАННАЯ",
    overview: "Обзор",
    experiments: "Эксперименты",
    topology: "Топология",
    history: "История",
    settings: "Настройки",
    experiment: "Эксперимент",
    scenario: "Сценарий",
    seed: "Начальное число",
    load: "Нагрузка",
    mode: "Режим работы",
    evidenceProfile: "Качество доказательств",
    priorTrust: "Предыдущее доверие",
    run: "Запустить эксперимент",
    trust: "Ограниченное доверие",
    evidence: "Доказательность",
    consensus: "Согласованность",
    stability: "Стабильность",
    gate: "Шлюз решений",
    fullProposal: "Полное предложение модели",
    appliedAction: "Применено внутри модели",
    none: "Ничего",
    proposed: "Предложенная симуляция",
    gateReasons: "Ограничения допуска",
    noHardCap: "Жёсткие ограничения не сработали",
    actionVerified: "ДЕЙСТВИЕ ПРИМЕНЕНО И ПРОВЕРЕНО В МОДЕЛИ",
    noActionVerified: "ДЕЙСТВИЕ В МОДЕЛИ НЕ ТРЕБУЕТСЯ",
    noExternalAction: "ВНЕШНЕЕ ДЕЙСТВИЕ НЕ ВЫПОЛНЕНО",
    topologyTitle: "Топология сервисов",
    beforeAfter: "Состояния данных",
    metric: "Метрика",
    before: "До",
    simulated: "Предложение модели",
    observed: "Состояние модели после шлюза",
    notExecuted: "Не выполнялось",
    evidenceLog: "Журнал доказательств",
    disclaimer:
      "Только публичный исследовательский симулятор: синтетические состояния, без внешних действий и production-policy.",
    latency: "Задержка",
    errorRate: "Ошибки",
    saturation: "Пропускная способность",
    health: "Состояние",
  },
} as const;

const scenarioLabels: Record<Language, Record<Scenario, string>> = {
  en: {
    STABLE_BASELINE: "Stable baseline",
    DB_LATENCY_SPIKE: "Database latency spike",
    AUTH_FAILURE: "Authentication failure",
    GATEWAY_LOAD_SURGE: "Gateway load surge",
    CACHE_EVICTION_STORM: "Cache eviction storm",
  },
  ru: {
    STABLE_BASELINE: "Стабильная база",
    DB_LATENCY_SPIKE: "Скачок задержки БД",
    AUTH_FAILURE: "Сбой аутентификации",
    GATEWAY_LOAD_SURGE: "Перегрузка шлюза",
    CACHE_EVICTION_STORM: "Шторм вытеснения кэша",
  },
};

const modeLabels: Record<Language, Record<Mode, string>> = {
  en: { PRIMARY: "Primary", FALLBACK: "Fallback", HEURISTIC: "Heuristic" },
  ru: { PRIMARY: "Основной", FALLBACK: "Резервный", HEURISTIC: "Эвристический" },
};

const evidenceLabels: Record<Language, Record<EvidenceProfile, string>> = {
  en: {
    VERIFIED: "Verified",
    DEGRADED: "Degraded",
    CONFLICTED: "Conflicted",
    LOST: "Lost",
  },
  ru: {
    VERIFIED: "Подтверждённые",
    DEGRADED: "Неполные",
    CONFLICTED: "Противоречивые",
    LOST: "Потеряны",
  },
};

const reasonLabels: Record<Language, Record<string, string>> = {
  en: {
    CRITICAL_HEALTH_CAP: "Critical health cap",
    FALLBACK_RELIABILITY_CAP: "Non-primary reliability cap",
    LOW_CONSENSUS_CAP: "Low consensus cap",
    HIGH_ENTROPY_CAP: "High entropy cap",
  },
  ru: {
    CRITICAL_HEALTH_CAP: "Ограничение критического состояния",
    FALLBACK_RELIABILITY_CAP: "Ограничение неосновного режима",
    LOW_CONSENSUS_CAP: "Ограничение низкой согласованности",
    HIGH_ENTROPY_CAP: "Ограничение высокой неопределённости",
  },
};

const initialInput: Config = {
  scenario: "GATEWAY_LOAD_SURGE",
  seed: 42,
  load: 0.72,
  mode: "PRIMARY",
  evidenceProfile: "VERIFIED",
  previousTrust: 0.75,
};

const pct = (value: number) => `${Math.round(value * 100)}%`;

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [input, setInput] = useState(initialInput);
  const [run, setRun] = useState(() => runController(initialInput));
  const t = copy[language];
  const localizedEvents = language === "en"
    ? run.events.map(event => ({ ...event, text: event.message }))
    : [
        { ...run.events[0], text: `Модель отказа определила состояние ${run.before.classification}.` },
        { ...run.events[1], text: `Основной затронутый сервис: ${run.decision.primary}.` },
        { ...run.events[2], text: `${run.decision.actions.join(" + ")} проверено в публичной детерминированной модели: состояние ${pct(run.before.health)} → ${pct(run.proposed.health)}.` },
        { ...run.events[3], text: `${run.trustBefore.gate} при ограниченном доверии ${pct(run.trustBefore.bounded)}.` },
        { ...run.events[4], text: run.applied.length
          ? "Состояние после шлюза проверено внутри той же публичной модели."
          : "Автоматическое действие не выполнялось: нужны дополнительные доказательства или решение человека." },
      ];

  const trustColor =
    run.trustBefore.bounded >= 0.82
      ? "var(--emerald)"
      : run.trustBefore.bounded >= 0.45
        ? "var(--amber)"
        : "var(--danger)";

  const metrics = useMemo(
    () => [
      [t.latency, `${run.before.latency.toFixed(0)} ms`, `${run.proposed.latency.toFixed(0)} ms`, `${run.postGate.latency.toFixed(0)} ms`],
      [t.errorRate, pct(run.before.errors), pct(run.proposed.errors), pct(run.postGate.errors)],
      [t.saturation, run.before.throughput.toFixed(0), run.proposed.throughput.toFixed(0), run.postGate.throughput.toFixed(0)],
      [t.health, pct(run.before.health), pct(run.proposed.health), pct(run.postGate.health)],
    ],
    [run, t],
  );

  return (
    <div className="shell">
      <header>
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SEACS Lab <i>public v0.1</i></strong>
            <small>{t.subtitle}</small>
          </div>
        </div>
        <span className="system-badge"><span />{t.deterministic}</span>
        <div className="language-switch" aria-label="Language">
          {(["en", "ru"] as const).map((value) => (
            <button
              className={language === value ? "active" : ""}
              key={value}
              onClick={() => setLanguage(value)}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <aside>
        <div className="nav-static active"><span>⌁</span>{t.overview}</div>
        <div className="nav-static"><span>◫</span>{t.experiment}</div>
        <div className="nav-static"><span>⌬</span>{t.topology}</div>
        <p className="aside-note">SEACS LAB<br />PUBLIC REFERENCE BUILD</p>
      </aside>

      <main>
        <section className="control-strip panel">
          <div>
            <span className="eyebrow">01 · {t.experiment.toUpperCase()}</span>
            <h1>{scenarioLabels[language][input.scenario]}</h1>
          </div>
          <label>
            {t.scenario}
            <select
              value={input.scenario}
              onChange={(event) =>
                setInput({ ...input, scenario: event.target.value as Scenario })
              }
            >
              {(Object.keys(scenarioLabels.en) as Scenario[]).map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenarioLabels[language][scenario]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.seed}
            <input
              type="number"
              value={input.seed}
              onChange={(event) => setInput({ ...input, seed: Number(event.target.value) })}
            />
          </label>
          <label className="load-control">
            {t.load}: <b>{Math.round(input.load * 100)}%</b>
            <input
              type="range"
              min="10"
              max="100"
              value={input.load * 100}
              onChange={(event) => setInput({ ...input, load: Number(event.target.value) / 100 })}
            />
          </label>
          <label>
            {t.mode}
            <select
              value={input.mode}
              onChange={(event) => setInput({ ...input, mode: event.target.value as Mode })}
            >
              {(Object.keys(modeLabels.en) as Mode[]).map((mode) => (
                <option key={mode} value={mode}>{modeLabels[language][mode]}</option>
              ))}
            </select>
          </label>
          <label>
            {t.evidenceProfile}
            <select
              value={input.evidenceProfile}
              onChange={(event) =>
                setInput({ ...input, evidenceProfile: event.target.value as EvidenceProfile })
              }
            >
              {(Object.keys(evidenceLabels.en) as EvidenceProfile[]).map((profile) => (
                <option key={profile} value={profile}>{evidenceLabels[language][profile]}</option>
              ))}
            </select>
          </label>
          <label className="load-control">
            {t.priorTrust}: <b>{pct(input.previousTrust)}</b>
            <input
              type="range"
              min="0"
              max="100"
              value={input.previousTrust * 100}
              onChange={(event) =>
                setInput({ ...input, previousTrust: Number(event.target.value) / 100 })
              }
            />
          </label>
          <button className="run-button" onClick={() => setRun(runController(input))}>
            {t.run} <span>→</span>
          </button>
        </section>

        <div className="dashboard-grid">
          <section className="panel trust-panel">
            <span className="eyebrow">02 · TRUST ENGINE</span>
            <h2>{t.trust}</h2>
            <div
              className="gauge"
              style={{
                background: `conic-gradient(${trustColor} ${run.trustBefore.bounded * 360}deg, #172b3b 0deg)`,
              }}
            >
              <div><strong>{pct(run.trustBefore.bounded)}</strong><small>{run.trustBefore.gate}</small></div>
            </div>
            <div className="score-bars">
              {[
                [t.evidence, run.trustBefore.components.evidence],
                [t.consensus, run.trustBefore.components.consensus],
                [t.stability, run.trustBefore.components.stability],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}<b>{pct(value as number)}</b></span>
                  <i><em style={{ width: pct(value as number) }} /></i>
                </div>
              ))}
            </div>
          </section>

          <section className="panel gate-panel">
            <span className="eyebrow">03 · POLICY</span>
            <h2>{t.gate}</h2>
            <div className="pipeline">
              {["OBSERVE", "ASSESS", "DECIDE", "VERIFY"].map((stage, index) => (
                <div key={stage}>
                  <span>{index + 1}</span>
                  <b>{stage}</b>
                </div>
              ))}
            </div>
            <div className={`gate-result ${run.trustBefore.gate.toLowerCase()}`}>
              <span>{run.trustBefore.gate.replaceAll("_", " ")}</span>
              <small>
                {run.applied.includes("NO_ACTION")
                  ? t.noActionVerified
                  : run.applied.length ? t.actionVerified : t.noExternalAction}
              </small>
            </div>
            <div className="action-summary">
              <p>{t.fullProposal}: <b>{run.decision.actions.join(" + ")}</b></p>
              <p>{t.appliedAction}: <b>{run.applied.length ? run.applied.join(" + ") : t.none}</b></p>
            </div>
            <div className="gate-reasons">
              <span>{t.gateReasons}:</span>
              {run.trustBefore.reasons.length
                ? run.trustBefore.reasons.map(reason => (
                    <i key={reason}>{reasonLabels[language][reason] ?? reason}</i>
                  ))
                : <i>{t.noHardCap}</i>}
            </div>
          </section>

          <section className="panel topology-panel">
            <span className="eyebrow">04 · SYSTEM MAP</span>
            <h2>{t.topologyTitle}</h2>
            <div className="topology-map">
              <div className="node edge">GATEWAY<br /><small>{Math.round(run.postGate.services.gateway.load * 100)}%</small></div>
              <span />
              <div className="node control">SEACS<br /><small>{run.trustBefore.gate}</small></div>
              <span />
              <div className="node api">AUTH<br /><small>{Math.round(run.postGate.services.auth.latency)}ms</small></div>
              <span />
              <div className="node data">DATABASE<br /><small>{pct(run.postGate.services.database.health)}</small></div>
            </div>
          </section>

          <section className="panel comparison-panel">
            <span className="eyebrow">05 · IMPACT</span>
            <h2>{t.beforeAfter}</h2>
            <table>
              <thead><tr><th>{t.metric}</th><th>{t.before}</th><th>{t.simulated}</th><th>{t.observed}</th></tr></thead>
              <tbody>
                {metrics.map(([label, before, simulated, observed]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{before}</td>
                    <td className="simulated-value">{simulated}</td>
                    <td className={run.applied.length ? "observed-value" : "not-executed"}>
                      {run.applied.length ? observed : `— ${t.notExecuted}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <section className="panel log-panel">
          <span className="eyebrow">06 · AUDIT TRAIL</span>
          <h2>{t.evidenceLog}</h2>
          <div className="log-lines">
            {localizedEvents.map((event, index) => (
              <p key={`${event.stage}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>[{event.stage}] {event.text}</p>
            ))}
          </div>
        </section>

        <footer>{t.disclaimer}</footer>
      </main>
    </div>
  );
}
