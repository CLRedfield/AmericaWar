const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .matchAll(/src="(js\/[^"?]+)\?v=/g)].map(([, filename]) => filename);

function classList(names = '') {
    const classes = new Set(names.split(/\s+/).filter(Boolean));
    return {
        contains: name => classes.has(name),
        add: name => classes.add(name),
        remove: name => classes.delete(name),
        toggle(name, force) {
            const include = force === undefined ? !classes.has(name) : force;
            if (include) classes.add(name);
            else classes.delete(name);
        }
    };
}

function style() {
    return { setProperty(name, value) { this[name] = String(value); } };
}

function createClient() {
    const viewport = { width: 1200, height: 650 };
    const observers = [];
    let current = null;
    class ResizeObserverFixture {
        constructor(callback) {
            this.callback = callback;
            this.targets = new Set();
            observers.push(this);
        }
        observe(target) { this.targets.add(target); }
        disconnect() { this.targets.clear(); }
        // A queued delivery can still arrive after DOM replacement. Exercise
        // the production callback's stale-target guard as well as disconnect.
        deliverQueued(target) { this.callback([{ target }], this); }
    }

    // This fixture represents only the modal elements consumed by App. It
    // deliberately does not emulate browser layout, paint or hit testing.
    function installModal(html) {
        if (current) current.scroller.isConnected = false;
        current = null;
        const canvasTag = html.match(/<div\b[^>]*class="focus-tree-canvas[^>]*>/)?.[0];
        if (!canvasTag) return;
        const baseWidth = Number(canvasTag.match(/data-base-width="([\d.]+)"/)[1]);
        const baseHeight = Number(canvasTag.match(/data-base-height="([\d.]+)"/)[1]);
        const buttonTags = [...html.matchAll(/<button\b[^>]*class="focus-card[^>]*>/g)].map(([tag]) => tag);
        const selected = buttonTags.find(tag => /class="[^"]*\bselected\b/.test(tag)) || buttonTags[0];
        const card = selected ? {
            offsetLeft: Number(selected.match(/left: ([\d.]+)px/)[1]),
            offsetTop: Number(selected.match(/top: ([\d.]+)px/)[1]),
            offsetWidth: 154,
            offsetHeight: 72
        } : null;
        const scroller = {
            isConnected: true,
            clientWidth: viewport.width,
            clientHeight: viewport.height,
            scrollLeft: 0,
            scrollTop: 0,
            classList: classList('focus-tree-scroll'),
            listeners: new Map(),
            addEventListener(type, callback) { this.listeners.set(type, callback); },
            querySelector(selector) { return selector.startsWith('.focus-card') ? card : null; },
            getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
        };
        const canvas = {
            dataset: { baseWidth: String(baseWidth), baseHeight: String(baseHeight), campaignTree: 'true' },
            offsetWidth: baseWidth,
            offsetHeight: baseHeight,
            classList: classList('focus-tree-canvas focus-west-russia'),
            style: style()
        };
        current = { scroller, canvas, stage: { style: style() }, label: { textContent: '' } };
    }

    const document = {
        addEventListener() {},
        getElementById() { return null; },
        querySelectorAll() { return []; },
        body: { classList: classList() },
        querySelector(selector) {
            if (!current) return null;
            return ({
                '.focus-tree-scroll': current.scroller,
                '.focus-tree-canvas': current.canvas,
                '.focus-tree-stage': current.stage,
                '[data-focus-zoom-label]': current.label
            })[selector] || null;
        }
    };
    const context = vm.createContext({
        console, document,
        location: { hash: '', origin: 'http://localhost', pathname: '/' },
        matchMedia: () => ({ matches: false }),
        ResizeObserver: ResizeObserverFixture,
        setTimeout, clearTimeout
    });
    context.window = context;
    for (const filename of scripts) {
        vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
    }
    const { GameState, App } = vm.runInContext('({ GameState, App })', context);
    GameState.initLocalLobby('west-russia');
    GameState.startGameSession();
    App.root = { innerHTML: '', querySelector() { return null; } };
    App.modalRoot = {
        set innerHTML(html) { installModal(html); },
        get firstElementChild() { return current ? {} : null; }
    };
    GameState.subscribe(() => App.render());

    return {
        App, GameState, observers,
        get current() { return current; },
        resize(width, height, target = current?.scroller) {
            viewport.width = width;
            viewport.height = height;
            if (!target) return;
            target.clientWidth = width;
            target.clientHeight = height;
            for (const observer of observers) {
                if (observer.targets.has(target)) observer.deliverQueued(target);
            }
        },
        openOverview(factionId = 'KOM') {
            App.openFocusModal(factionId);
            App.toggleFocusTreeOverview();
            assert.equal(App.focusTreeOverview, true);
        }
    };
}

function measurements(elements) {
    const { stage, canvas } = elements;
    return {
        width: Number.parseFloat(stage.style.width),
        height: Number.parseFloat(stage.style.height),
        scale: Number(canvas.style.transform.match(/^scale\(([^)]+)\)$/)?.[1])
    };
}

function assertFitted(elements) {
    const { width, height, scale } = measurements(elements);
    const { scroller, canvas } = elements;
    assert.ok(Number.isFinite(scale) && scale > 0);
    assert.ok(width <= scroller.clientWidth + 0.01, `Tree width ${width} exceeds viewport ${scroller.clientWidth}`);
    assert.ok(height <= scroller.clientHeight + 0.01, `Tree height ${height} exceeds viewport ${scroller.clientHeight}`);
    assert.ok(Math.max(width / scroller.clientWidth, height / scroller.clientHeight) > 0.9,
        'The fitted overview should use the available space, not shrink to a token-sized tree');
    assert.ok(Math.abs(width - Number(canvas.dataset.baseWidth) * scale) < 0.01);
    assert.ok(Math.abs(height - Number(canvas.dataset.baseHeight) * scale) < 0.01);
    return scale;
}

test('overview refits its written canvas transform and stage dimensions when width or height changes', () => {
    const client = createClient();
    client.openOverview();
    const initial = assertFitted(client.current);

    client.resize(760, 650);
    const narrow = assertFitted(client.current);
    assert.ok(narrow < initial, 'Narrower viewport must reduce the overview scale');

    // Force height to become the limiting dimension even when the campaign's
    // chapter arrangement is wider than it used to be.
    const constrainedHeight = Math.max(1, Math.floor(measurements(client.current).height / 2));
    client.resize(1300, constrainedHeight);
    const short = assertFitted(client.current);
    assert.ok(short < narrow, 'Shorter viewport must fit the height as well as the width');

    client.resize(1600, 800);
    const enlarged = assertFitted(client.current);
    assert.ok(enlarged > initial, 'Expanding the viewport should make the overview readable again');
});

test('rerender observes the replacement viewport and queued events from the old modal have no effect', () => {
    const client = createClient();
    client.openOverview('WRF');
    const oldElements = client.current;
    const oldObserver = client.observers.find(observer => observer.targets.has(oldElements.scroller));
    assert.ok(oldObserver, 'The active overview viewport is observed');

    client.GameState.notify();
    assert.notEqual(client.current.scroller, oldElements.scroller, 'The real render path replaces modal elements');
    assert.equal(oldElements.scroller.isConnected, false);
    assert.equal(oldObserver.targets.size, 0, 'The replaced modal is no longer retained by the observer');
    assert.equal(client.observers.filter(observer => observer.targets.size).length, 1);

    const beforeQueued = measurements(client.current);
    client.current.scroller.clientWidth = 640;
    oldObserver.deliverQueued(oldElements.scroller);
    assert.deepEqual(measurements(client.current), beforeQueued, 'A stale notification must not write to the new modal');

    client.resize(640, 500);
    assertFitted(client.current);
    assert.notDeepEqual(measurements(client.current), beforeQueued, 'The replacement viewport remains responsive');
    assert.equal(oldElements.canvas.style.transform, `scale(${beforeQueued.scale})`);
});

test('closing the focus modal releases the overview observer and reopening refits the current viewport', () => {
    const client = createClient();
    client.openOverview('SAM');
    const oldElements = client.current;
    const oldObserver = client.observers.find(observer => observer.targets.has(oldElements.scroller));
    const oldMeasurements = measurements(oldElements);

    client.App.closeModals();
    assert.equal(client.current, null);
    assert.equal(client.GameState.game.showFocusModal, false);
    assert.equal(client.observers.filter(observer => observer.targets.size).length, 0,
        'Closing must release observed DOM targets, not just suppress their callbacks');
    const closedScale = client.GameState.game.focusTreeViewport.scale;
    oldObserver.deliverQueued(oldElements.scroller);
    assert.equal(client.GameState.game.focusTreeViewport.scale, closedScale);
    assert.deepEqual(measurements(oldElements), oldMeasurements);

    client.resize(680, 360);
    client.openOverview('SAM');
    assertFitted(client.current);
    assert.equal(client.observers.filter(observer => observer.targets.size).length, 1);
});

test('normal-tree manual zoom survives resizing, rerender and stale overview notifications', () => {
    const client = createClient();
    client.openOverview();
    const oldElements = client.current;
    const oldObserver = client.observers.find(observer => observer.targets.has(oldElements.scroller));

    client.App.toggleFocusTreeOverview();
    assert.equal(client.App.focusTreeOverview, false);
    client.App.setFocusTreeScale(1.12);
    const manual = measurements(client.current);
    assert.equal(manual.scale, 1.12);

    client.resize(520, 300);
    oldObserver.deliverQueued(oldElements.scroller);
    assert.deepEqual(measurements(client.current), manual, 'Resizing must not replace a normal-tree manual zoom with autofit');
    client.GameState.notify();
    assert.deepEqual(measurements(client.current), manual, 'Manual zoom must survive a full render');
    assert.equal(client.GameState.game.focusTreeViewport.autoFit, false);
    assert.equal(client.observers.filter(observer => observer.targets.size).length, 0);
});
