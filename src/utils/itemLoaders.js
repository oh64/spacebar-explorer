export function loadClients() {
  const context = require.context('../static/clients', false, /\.json$/);
    return context.keys().filter(k => !/example/i.test(k)).map(key => context(key));
}

export function loadBots() {
  try {
    const context = require.context('../static/bots', false, /\.json$/);
    return context.keys().filter(k => !/example/i.test(k)).map(key => context(key));
  } catch (e) {
    return [];
  }
}

export function loadInstances() {
  const context = require.context('../static/instances', false, /\.json$/);
    return context.keys().filter(k => !/example/i.test(k)).map(key => context(key));
}

export function loadGuilds() {
  try {
     const context = require.context('../static/guilds', false, /\.json$/);
     return context.keys().filter(k => !/example/i.test(k)).map(key => context(key));
  } catch (e) {
    return [];
  }
}
