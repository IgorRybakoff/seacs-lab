import { randomFrom } from "./random.ts";
import type { Action, Classification, Scenario, Service, ServiceId, Snapshot } from "./types.ts";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const healthOf = (service: Service) => clamp(
  1 - Math.max(0, service.latency - 40) / 450
    - service.errors * 1.2
    - Math.max(0, service.load - 0.8) * 0.25,
  0.05,
  1,
);

function classify(services: Record<ServiceId, Service>): Classification {
  const degraded = Object.values(services).filter(
    (service) => service.health < 0.7 || service.errors > 0.1 || service.latency > 170,
  );
  if (degraded.length >= 2 || services.gateway.health < 0.5) return "ACTIVE_CASCADE";
  if (degraded.length === 1 && services.gateway.health < 0.8) return "CASCADE_RISK";
  return degraded.length ? "LOCALIZED_DEGRADATION" : "NORMAL";
}

function aggregate(services: Record<ServiceId, Service>): Snapshot {
  const list = Object.values(services);
  const weight = list.reduce((sum, service) => sum + service.criticality, 0);
  const health = list.reduce((sum, service) => sum + service.health * service.criticality, 0) / weight;
  const errors = list.reduce((sum, service) => sum + service.errors * service.criticality, 0) / weight;
  const latency = Math.max(...list.map((service) => service.latency));
  return {
    services,
    health,
    errors,
    latency: Math.round(latency),
    throughput: Math.max(100, Math.round(1600 * health * (1 - errors))),
    classification: classify(services),
  };
}

export function simulate(scenario: Scenario, load: number, seed: number, actions: Action[] = []): Snapshot {
  const random = randomFrom(seed);
  const jitter = () => (random() - 0.5) * 4;
  const services: Record<ServiceId, Service> = {
    gateway: { id: "gateway", latency: 30 + jitter(), errors: 0.01, load, health: 1, instances: 2, criticality: 1 },
    auth: { id: "auth", latency: 35 + jitter(), errors: 0.01, load: load * 0.7, health: 1, instances: 2, criticality: 0.8 },
    database: { id: "database", latency: 25 + jitter(), errors: 0.01, load: load * 0.8, health: 1, instances: 3, criticality: 0.9 },
    cache: { id: "cache", latency: 10 + jitter(), errors: 0.01, load: load * 0.5, health: 1, instances: 2, criticality: 0.6 },
  };

  if (scenario === "DB_LATENCY_SPIKE") {
    Object.assign(services.database, { latency: 320, errors: 0.08, load: 1.35 });
    services.gateway.latency += 90;
    services.gateway.errors += 0.03;
  } else if (scenario === "AUTH_FAILURE") {
    Object.assign(services.auth, { latency: 120, errors: 0.35, load: 1.1 });
    services.gateway.errors += 0.2;
  } else if (scenario === "GATEWAY_LOAD_SURGE") {
    Object.assign(services.gateway, { latency: 210, errors: 0.15, load: 1.6 });
  } else if (scenario === "CACHE_EVICTION_STORM") {
    Object.assign(services.cache, { latency: 70, errors: 0.55, load: 1.4 });
    Object.assign(services.database, { latency: 160, errors: 0.05, load: 1.3 });
    services.gateway.latency += 50;
  }
  Object.values(services).forEach((service) => { service.health = healthOf(service); });

  if (actions.includes("RATE_LIMIT")) {
    services.gateway.load *= 0.65;
    services.gateway.latency *= 0.6;
    services.gateway.errors *= 0.5;
  }
  if (actions.includes("SCALE_UP")) {
    Object.values(services).forEach((service) => {
      if (service.health < 0.8) {
        service.instances += 1;
        service.load *= 0.7;
        service.latency *= 0.7;
        service.errors *= 0.7;
      }
    });
  }
  if (actions.includes("ISOLATE_SERVICE")) {
    if (scenario === "AUTH_FAILURE") {
      services.auth.errors *= 0.35;
      services.gateway.errors *= 0.5;
    }
    if (scenario === "CACHE_EVICTION_STORM") {
      services.cache.errors *= 0.3;
      services.database.load *= 0.75;
      services.database.latency *= 0.75;
    }
  }
  if (actions.includes("CIRCUIT_BREAKER")) {
    const target = scenario === "DB_LATENCY_SPIKE"
      ? services.database
      : scenario === "AUTH_FAILURE" ? services.auth : services.cache;
    target.latency = Math.min(target.latency, 60);
    target.errors = Math.min(target.errors, 0.04);
    services.gateway.latency *= 0.7;
    services.gateway.errors *= 0.6;
  }

  Object.values(services).forEach((service) => {
    service.health = healthOf(service);
    service.latency = Math.round(service.latency);
    service.errors = Number(service.errors.toFixed(4));
    service.load = Number(service.load.toFixed(3));
  });
  return aggregate(services);
}
