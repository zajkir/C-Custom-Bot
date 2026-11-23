const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ACCOUNT_KEYS, SIGNUP_KEYS, PRODUCTS, quote, money,
  panel, orderButtons, rateText, TOMORROWLAND_RATES
} = require('../src/branding');
const { CHANNELS, CATEGORY_NAMES, announceTomorrowlandOnce, TOMORROWLAND_NOTICE_MARKER } = require('../src/setup');

test('all requested account generators share the same pricing bands', () => {
  assert.deepEqual(ACCOUNT_KEYS, ['ticketmaster', 'axs', 'eventim', 'fnac', 'ticketone', 'tomorrowland']);
  for (const service of ACCOUNT_KEYS.filter((key) => key !== 'tomorrowland')) {
    for (const [quantity, cents] of [[1,80], [50,80], [51,75], [200,75], [201,65], [1000,65]]) {
      assert.deepEqual(quote(service, quantity), {
        unitCents: cents,
        totalCents: quantity * cents
      });
    }
  }
});

test('Tomorrowland has independent account pricing at exact tier boundaries', () => {
  assert.deepEqual(TOMORROWLAND_RATES, [
    { min: 1, max: 100, cents: 20 },
    { min: 101, max: 400, cents: 17 },
    { min: 401, max: 999999, cents: 15 }
  ]);
  for (const [quantity, cents] of [[1,20],[99,20],[100,20],[101,17],[399,17],
    [400,17],[401,15],[500,15],[999999,15]]) {
    assert.deepEqual(quote('tomorrowland', quantity), {
      unitCents: cents, totalCents: quantity * cents
    });
  }
  assert.throws(() => quote('tomorrowland', 0), /whole-number/);
  assert.throws(() => quote('tomorrowland', 1.5), /whole-number/);
  assert.throws(() => quote('tomorrowland', 1000000), /whole-number/);
  assert.match(rateText('account','tomorrowland'), /101–400/);
  const product = panel('product-tomorrowland');
  assert.match(product.embeds[0].data.description, /€0.20/);
  assert.match(product.embeds[0].data.description, /€0.17/);
  assert.match(product.embeds[0].data.description, /€0.15/);
  assert.match(product.components[0].components[0].data.custom_id, /cc:order:tomorrowland/);
  const menu = orderButtons()[0].components[0].data.options;
  assert.ok(menu.some((opt) => opt.value === 'tomorrowland'));
});

test('all requested signups share the same pricing bands', () => {
  assert.deepEqual(SIGNUP_KEYS, ['seated', 'laylo', 'bsthydepark', 'cobrand']);
  for (const service of SIGNUP_KEYS) {
    for (const [quantity, cents] of [[1,35], [100,35], [101,28], [200,28], [1000,28]]) {
      assert.deepEqual(quote(service, quantity), {
        unitCents: cents, totalCents: quantity * cents
      });
    }
  }
});

test('quotes validate quantities and return EUR-formatted totals', () => {
  assert.equal(money(32500), '€325.00');
  assert.throws(() => quote('ticketmaster', 1001), /whole-number/);
  assert.throws(() => quote('laylo', 0), /whole-number/);
  assert.throws(() => quote('axs', 1.5), /whole-number/);
  assert.throws(() => quote('unknown', 1), /Unknown/);
});

test('all ten products have their own English service channel', () => {
  assert.equal(Object.keys(CATEGORY_NAMES).length, 8);
  assert.equal(CHANNELS.length, 29);
  const names = CHANNELS.map((c) => c.name);
  const keys = CHANNELS.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(names).size, names.length);
  for (const key of [...ACCOUNT_KEYS, ...SIGNUP_KEYS]) {
    assert.ok(PRODUCTS[key]);
    assert.ok(CHANNELS.some((c) => c.key === key && c.panel === 'product-' + key));
  }
});

test('every panel and menu meets standard Discord component limits', () => {
  const panels = CHANNELS.filter((c) => c.panel).map((c) => c.panel);
  for (const key of panels) {
    const data = panel(key);
    for (const e of data.embeds) {
      assert.ok(e.data.description.length <= 4096, 'Description too long: ' + key);
      assert.ok(e.data.title.length <= 256, 'Title too long: ' + key);
    }
    for (const row of (data.components || [])) {
      assert.ok(row.components.length <= 5, 'Too many controls in: ' + key);
    }
  }
  assert.equal(orderButtons().length, 3);
});

test('Tomorrowland launch notice appears in announcements exactly once per server', async () => {
  const sent = [];
  const channel = {
    topic: 'c-custom:channel:announcements | Managed by C CUSTOM BOT',
    messages: { fetch: async () => ({ find: (predicate) => sent.find(predicate) }) },
    send: async (payload) => {
      sent.push({
        author: { id: 'bot' },
        embeds: payload.embeds.map((e) => ({ footer: { text: e.data.footer.text } }))
      });
    },
    client: { user: { id: 'bot' } },
    setTopic: async function (text) { this.topic = text; }
  };
  assert.equal(await announceTomorrowlandOnce(channel, {}), true);
  assert.equal(sent.length, 1);
  assert.match(channel.topic, /c-custom:notice:tomorrowland-launch-v1/);
  assert.equal(await announceTomorrowlandOnce(channel, {}), false);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].embeds[0].footer.text, 'C CUSTOM | PANEL:tomorrowlandLaunch');
  assert.equal(TOMORROWLAND_NOTICE_MARKER, 'c-custom:notice:tomorrowland-launch-v1');
  const announcement = panel('tomorrowlandLaunch');
  assert.match(announcement.embeds[0].data.description, /€0.20/);
  assert.match(announcement.embeds[0].data.description, /€0.17/);
  assert.match(announcement.embeds[0].data.description, /€0.15/);
});
