export interface ContentOverride { category: string; id: string; name: string; description: string }
export interface LiveConfig { announcement: string; luckBonus: number; eventEndsAt: number; overrides: ContentOverride[] }
export let liveConfig: LiveConfig = { announcement: '', luckBonus: 0, eventEndsAt: 0, overrides: [] };
export function setLiveConfig(config: LiveConfig) { liveConfig = config; }
export function adminLuck(now: number) { return liveConfig.eventEndsAt > now ? liveConfig.luckBonus : 0; }
