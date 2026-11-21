const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ACCOUNT_KEYS, SIGNUP_KEYS, PRODUCTS, quote, money,
  panel, orderButtons
} = require('../src/branding');
const { CHANNELS, CATEGORY_NAMES } = require('../src/setup');

test('all requested account generators share the same pricing bands', () => {
  assert.deepEqual(ACCOUNT_KEYS, ['ticketmaster', 'axs', 'eventim', 'fnac', 'ticketone']);
  for (const service of ACCOUNT_KEYS) {
    for (const [quantity, cents] of [[1,80], [50,80], [51,75], [200,75], [201,65], [1000,65]]) {
      assert.deepEqual(quote(service, quantity), {
        unitCents: cents,
        totalCents: quantity * cents
      });
    }
  }
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

test('all nine products have their own English service channel', () => {
  assert.equal(Object.keys(CATEGORY_NAMES).length, 8);
  assert.equal(CHANNELS.length, 28);
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
