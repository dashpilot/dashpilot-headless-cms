
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const createToast = () => {
      const { subscribe, update } = writable([]);
      let count = 0;
      let defaults = {};
      const push = (msg, opts = {}) => {
        const entry = { id: ++count, msg: msg, ...defaults, ...opts, theme: { ...defaults.theme, ...opts.theme } };
        update(n => entry.reversed ? [...n, entry] : [entry, ...n]);
        return count
      };
      const pop = id => {
        update(n => id ? n.filter(i => i.id !== id) : n.splice(1));
      };
      const set = (id, obj) => {
        update(n => {
          const idx = n.findIndex(i => i.id === id);
          if (idx > -1) {
            n[idx] = { ...n[idx], ...obj };
          }
          return n
        });
      };
      const _opts = (obj = {}) => {
        defaults = { ...defaults, ...obj, theme: { ...defaults.theme, ...obj.theme } };
        return defaults
      };
      return { subscribe, push, pop, set, _opts }
    };

    const toast = createToast();

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* node_modules/@zerodevx/svelte-toast/src/ToastItem.svelte generated by Svelte v3.31.2 */
    const file = "node_modules/@zerodevx/svelte-toast/src/ToastItem.svelte";

    // (80:2) {#if item.dismissable}
    function create_if_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "✕";
    			attr_dev(div, "class", "_toastBtn svelte-vfz6wa");
    			attr_dev(div, "role", "button");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 80, 2, 1871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(80:2) {#if item.dismissable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*item*/ ctx[0].msg + "";
    	let t0;
    	let t1;
    	let t2;
    	let progress_1;
    	let if_block = /*item*/ ctx[0].dismissable && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			progress_1 = element("progress");
    			attr_dev(div0, "class", "_toastMsg svelte-vfz6wa");
    			add_location(div0, file, 77, 2, 1803);
    			attr_dev(progress_1, "class", "_toastBar svelte-vfz6wa");
    			progress_1.value = /*$progress*/ ctx[1];
    			add_location(progress_1, file, 83, 2, 1977);
    			attr_dev(div1, "class", "_toastItem svelte-vfz6wa");
    			add_location(div1, file, 76, 0, 1776);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, progress_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].msg + "")) set_data_dev(t0, t0_value);

    			if (/*item*/ ctx[0].dismissable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$progress*/ 2) {
    				prop_dev(progress_1, "value", /*$progress*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ToastItem", slots, []);
    	let { item } = $$props;
    	const progress = tweened(item.initial, { duration: item.duration, easing: identity });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(1, $progress = value));
    	let prevProgress = item.initial;
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToastItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toast.pop(item.id);

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		tweened,
    		linear: identity,
    		toast,
    		item,
    		progress,
    		prevProgress,
    		$progress
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("prevProgress" in $$props) $$invalidate(3, prevProgress = $$props.prevProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prevProgress, item*/ 9) {
    			 if (prevProgress !== item.progress) {
    				if (item.progress === 1 || item.progress === 0) {
    					progress.set(item.progress).then(() => toast.pop(item.id));
    				} else {
    					progress.set(item.progress);
    				}

    				$$invalidate(3, prevProgress = item.progress);
    			}
    		}
    	};

    	return [item, $progress, progress, prevProgress, click_handler];
    }

    class ToastItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastItem",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<ToastItem> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<ToastItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<ToastItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@zerodevx/svelte-toast/src/SvelteToast.svelte generated by Svelte v3.31.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "node_modules/@zerodevx/svelte-toast/src/SvelteToast.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (39:2) {#each $toast as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let toastitem;
    	let t;
    	let li_style_value;
    	let li_intro;
    	let li_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	toastitem = new ToastItem({
    			props: { item: /*item*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(toastitem.$$.fragment);
    			t = space();
    			attr_dev(li, "style", li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme));
    			add_location(li, file$1, 39, 2, 830);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(toastitem, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const toastitem_changes = {};
    			if (dirty & /*$toast*/ 1) toastitem_changes.item = /*item*/ ctx[4];
    			toastitem.$set(toastitem_changes);

    			if (!current || dirty & /*$toast*/ 1 && li_style_value !== (li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme))) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    			add_transform(li, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: 200 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastitem.$$.fragment, local);

    			add_render_callback(() => {
    				if (li_outro) li_outro.end(1);
    				if (!li_intro) li_intro = create_in_transition(li, fly, /*item*/ ctx[4].intro);
    				li_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastitem.$$.fragment, local);
    			if (li_intro) li_intro.invalidate();
    			li_outro = create_out_transition(li, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(toastitem);
    			if (detaching && li_outro) li_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:2) {#each $toast as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$toast*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-ivwmun");
    			add_location(ul, file$1, 37, 0, 788);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*getCss, $toast*/ 3) {
    				each_value = /*$toast*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $toast;
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(0, $toast = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvelteToast", slots, []);
    	let { options = {} } = $$props;

    	const defaults = {
    		duration: 4000,
    		dismissable: true,
    		initial: 1,
    		progress: 0,
    		reversed: false,
    		intro: { x: 256 },
    		theme: {}
    	};

    	toast._opts(defaults);
    	const getCss = theme => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, "");
    	const writable_props = ["options"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvelteToast> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		flip,
    		toast,
    		ToastItem,
    		options,
    		defaults,
    		getCss,
    		$toast
    	});

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options*/ 4) {
    			 toast._opts(options);
    		}
    	};

    	return [$toast, getCss, options];
    }

    class SvelteToast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvelteToast",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get options() {
    		throw new Error("<SvelteToast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<SvelteToast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.31.2 */

    const { Error: Error_1, Object: Object_1$1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.31.2 */

    const file$2 = "src/routes/Home.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let t2;
    	let div3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Dashboard";
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div3 = element("div");
    			div3.textContent = "Choose a category from the left";
    			add_location(h4, file$2, 7, 0, 101);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$2, 6, 0, 81);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$2, 9, 0, 127);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$2, 5, 0, 56);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$2, 14, 0, 174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ params, data });

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, data];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 0, data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !("params" in props)) {
    			console.warn("<Home> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
    			console.warn("<Home> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/List.svelte generated by Svelte v3.31.2 */

    const file$3 = "src/routes/List.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (54:2) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[5].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/edit/" + /*cat*/ ctx[0] + "/" + /*item*/ ctx[5].id);
    			add_location(a, file$3, 54, 2, 1026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[5].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*cat, items*/ 3 && a_href_value !== (a_href_value = "/#/edit/" + /*cat*/ ctx[0] + "/" + /*item*/ ctx[5].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(54:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:2) {#if cat == 'collections'}
    function create_if_block$2(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[5].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/collections/" + /*item*/ ctx[5].id);
    			add_location(a, file$3, 52, 2, 962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[5].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*items*/ 2 && a_href_value !== (a_href_value = "/#/collections/" + /*item*/ ctx[5].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(52:2) {#if cat == 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (50:0) {#each items as item}
    function create_each_block$1(ctx) {
    	let li;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*cat*/ ctx[0] == "collections") return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$3, 50, 2, 902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if_block.m(li, null);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li, t);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(50:0) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0;
    	let t1;
    	let div1;
    	let button;
    	let t3;
    	let div3;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(/*cat*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$3, 40, 0, 680);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$3, 39, 0, 660);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$3, 43, 0, 733);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$3, 42, 0, 702);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$3, 38, 0, 635);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$3, 48, 0, 841);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$3, 47, 0, 819);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addItem*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cat*/ 1) set_data_dev(t0, /*cat*/ ctx[0]);

    			if (dirty & /*items, cat*/ 3) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let items = false;

    	function addItem() {
    		let newItem = {};
    		newItem.id = Date.now();
    		newItem.title = "untitled";

    		if (cat == "collections") {
    			newItem.fields = [];
    		} else {
    			newItem.slug = "";
    		}

    		data[cat].push(newItem);

    		if (cat == "collections") {
    			window.location = "/#/collections/" + newItem.id;
    		} else {
    			window.location = "/#/edit/" + cat + "/" + newItem.id;
    		}
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(4, params = $$props.params);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ params, data, cat, items, addItem });

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(4, params = $$props.params);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(0, cat = $$props.cat);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, cat, data*/ 25) {
    			 if (params.cat) {
    				$$invalidate(0, cat = params.cat);

    				// check if object key exists, else create empty array
    				if (cat in data) {
    					$$invalidate(1, items = data[cat]);
    				} else {
    					$$invalidate(3, data[cat] = [], data);
    					$$invalidate(1, items = data[cat]);
    				}
    			}
    		}
    	};

    	return [cat, items, addItem, data, params];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { params: 4, data: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[4] === undefined && !("params" in props)) {
    			console.warn("<List> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<List> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Edit.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/routes/Edit.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[12] = list;
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (38:0) {#if collection}
    function create_if_block$3(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0;
    	let t1_value = pluralize.singular(/*collection*/ ctx[3].title) + "";
    	let t1;
    	let t2;
    	let div1;
    	let button;
    	let t4;
    	let div3;
    	let b;
    	let t6;
    	let input;
    	let t7;
    	let mounted;
    	let dispose;
    	let each_value = /*collection*/ ctx[3].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text("Edit ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Save";
    			t4 = space();
    			div3 = element("div");
    			b = element("b");
    			b.textContent = "Title";
    			t6 = space();
    			input = element("input");
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$4, 42, 0, 803);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$4, 41, 0, 783);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$4, 45, 0, 894);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$4, 44, 0, 863);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$4, 40, 0, 758);
    			add_location(b, file$4, 51, 0, 1001);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$4, 52, 2, 1016);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$4, 49, 0, 978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, b);
    			append_dev(div3, t6);
    			append_dev(div3, input);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title);
    			append_dev(div3, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*save*/ ctx[4], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 8 && t1_value !== (t1_value = pluralize.singular(/*collection*/ ctx[3].title) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data, cat, index*/ 7 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title);
    			}

    			if (dirty & /*data, cat, index, collection*/ 15) {
    				each_value = /*collection*/ ctx[3].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(38:0) {#if collection}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if field.description}
    function create_if_block_3(ctx) {
    	let div;
    	let t_value = /*field*/ ctx[11].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "description");
    			add_location(div, file$4, 58, 2, 1187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 8 && t_value !== (t_value = /*field*/ ctx[11].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(58:2) {#if field.description}",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#if field.type=='txt'}
    function create_if_block_2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[8].call(input, /*field*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$4, 62, 2, 1275);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[11].title]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, cat, index, collection*/ 15 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[11].title]) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[11].title]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:2) {#if field.type=='txt'}",
    		ctx
    	});

    	return block;
    }

    // (66:2) {#if field.type=='mde'}
    function create_if_block_1(ctx) {
    	let textarea;
    	let textarea_value_value;
    	let t0;
    	let script;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			t0 = space();
    			script = element("script");
    			script.textContent = "window.easyMDE = new EasyMDE({element: document.getElementById('my-text-area')});\n    ";
    			attr_dev(textarea, "id", "my-text-area");
    			textarea.value = textarea_value_value = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[11].title];
    			add_location(textarea, file$4, 66, 2, 1400);
    			add_location(script, file$4, 67, 4, 1475);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, script, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, cat, index, collection*/ 15 && textarea_value_value !== (textarea_value_value = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[11].title])) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(script);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(66:2) {#if field.type=='mde'}",
    		ctx
    	});

    	return block;
    }

    // (55:2) {#each collection.fields as field}
    function create_each_block$2(ctx) {
    	let b;
    	let t0_value = /*field*/ ctx[11].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block2_anchor;
    	let if_block0 = /*field*/ ctx[11].description && create_if_block_3(ctx);
    	let if_block1 = /*field*/ ctx[11].type == "txt" && create_if_block_2(ctx);
    	let if_block2 = /*field*/ ctx[11].type == "mde" && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			add_location(b, file$4, 56, 2, 1138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			append_dev(b, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 8 && t0_value !== (t0_value = /*field*/ ctx[11].title + "")) set_data_dev(t0, t0_value);

    			if (/*field*/ ctx[11].description) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*field*/ ctx[11].type == "txt") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*field*/ ctx[11].type == "mde") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(55:2) {#each collection.fields as field}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*collection*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*collection*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Edit", slots, []);

    	onDestroy(() => {
    		console.log("destroy called");

    		if (window.easyMDE !== null && typeof window.easyMDE !== "undefined") {
    			window.easyMDE.toTextArea();
    			window.easyMDE = null;
    			console.log("destroyed");
    		}
    	});

    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let id = false;
    	let item = false;
    	let index = false;
    	let collection = false;
    	let fields = {};

    	function save() {
    		alert(JSON.stringify(data));
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Edit> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data[cat][index].title = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, cat), $$invalidate(5, params)), $$invalidate(0, data)), $$invalidate(6, id));
    		(((($$invalidate(2, index), $$invalidate(5, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(6, id));
    	}

    	function input_input_handler_1(field) {
    		data[cat][index][field.title] = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, cat), $$invalidate(5, params)), $$invalidate(0, data)), $$invalidate(6, id));
    		(((($$invalidate(2, index), $$invalidate(5, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(6, id));
    		(((($$invalidate(3, collection), $$invalidate(5, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(6, id));
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		afterUpdate,
    		onDestroy,
    		params,
    		data,
    		cat,
    		id,
    		item,
    		index,
    		collection,
    		fields,
    		save
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(1, cat = $$props.cat);
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("item" in $$props) item = $$props.item;
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("collection" in $$props) $$invalidate(3, collection = $$props.collection);
    		if ("fields" in $$props) fields = $$props.fields;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat, id*/ 99) {
    			 if (params.cat && params.id) {
    				$$invalidate(1, cat = params.cat);
    				$$invalidate(6, id = params.id);
    				item = data[cat].filter(x => x.id == id)[0];
    				$$invalidate(2, index = data[cat].findIndex(x => x.id == id));
    				$$invalidate(3, collection = data.collections.filter(x => x.title == cat)[0]);
    			}
    		}
    	};

    	return [
    		data,
    		cat,
    		index,
    		collection,
    		save,
    		params,
    		id,
    		input_input_handler,
    		input_input_handler_1
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 5, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[5] === undefined && !("params" in props)) {
    			console_1$1.warn("<Edit> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1$1.warn("<Edit> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<Edit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Edit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Edit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Edit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/EditCollection.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/routes/EditCollection.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[24] = list;
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (116:4) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Plural, lowercase, no spaces (e.g. 'entries', 'pages')";
    			t1 = space();
    			input = element("input");
    			attr_dev(div, "class", "description");
    			add_location(div, file$5, 116, 4, 2959);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$5, 117, 4, 3049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0].collections[/*index*/ ctx[1]].title);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[13]),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[14], false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, index*/ 3 && input.value !== /*data*/ ctx[0].collections[/*index*/ ctx[1]].title) {
    				set_input_value(input, /*data*/ ctx[0].collections[/*index*/ ctx[1]].title);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(116:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#if title in data}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "mb-3");
    			set_style(div, "margin-top", "-5px");
    			add_location(div, file$5, 114, 4, 2861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, index*/ 3 && t_value !== (t_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(114:4) {#if title in data}",
    		ctx
    	});

    	return block;
    }

    // (132:4) {#if data.collections[index].fields}
    function create_if_block$4(ctx) {
    	let ul;
    	let each_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$5, 132, 4, 3586);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteField, data, index, slugifyFieldTitle*/ 163) {
    				each_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(132:4) {#if data.collections[index].fields}",
    		ctx
    	});

    	return block;
    }

    // (134:4) {#each data.collections[index].fields as field, i}
    function create_each_block$3(ctx) {
    	let li;
    	let div4;
    	let div0;
    	let input0;
    	let t0;
    	let div1;
    	let input1;
    	let t1;
    	let div2;
    	let select;
    	let option0;
    	let option1;
    	let t4;
    	let div3;
    	let button;
    	let i_1;
    	let t5;
    	let mounted;
    	let dispose;

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[16].call(input0, /*each_value*/ ctx[24], /*i*/ ctx[25]);
    	}

    	function keyup_handler_1() {
    		return /*keyup_handler_1*/ ctx[17](/*i*/ ctx[25]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[18].call(input1, /*each_value*/ ctx[24], /*i*/ ctx[25]);
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[19].call(select, /*each_value*/ ctx[24], /*i*/ ctx[25]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[20](/*field*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div4 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Text";
    			option1 = element("option");
    			option1.textContent = "Markdown";
    			t4 = space();
    			div3 = element("div");
    			button = element("button");
    			i_1 = element("i");
    			t5 = space();
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control mb-0");
    			attr_dev(input0, "placeholder", "field name");
    			add_location(input0, file$5, 136, 28, 3752);
    			attr_dev(div0, "class", "col-md-4");
    			add_location(div0, file$5, 136, 6, 3730);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control mb-0");
    			attr_dev(input1, "placeholder", "field description (optional)");
    			add_location(input1, file$5, 137, 28, 3926);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file$5, 137, 6, 3904);
    			option0.__value = "txt";
    			option0.value = option0.__value;
    			add_location(option0, file$5, 140, 6, 4158);
    			option1.__value = "mde";
    			option1.value = option1.__value;
    			add_location(option1, file$5, 141, 6, 4198);
    			attr_dev(select, "class", "form-control mb-0");
    			if (/*field*/ ctx[23].type === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$5, 139, 6, 4091);
    			attr_dev(div2, "class", "col-md-3");
    			add_location(div2, file$5, 138, 6, 4062);
    			attr_dev(i_1, "class", "bi bi-trash");
    			add_location(i_1, file$5, 147, 6, 4405);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$5, 146, 6, 4312);
    			attr_dev(div3, "class", "col-md-1 text-right");
    			add_location(div3, file$5, 145, 6, 4272);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$5, 135, 6, 3706);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$5, 134, 6, 3671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div4);
    			append_dev(div4, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*field*/ ctx[23].title);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*field*/ ctx[23].description);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*field*/ ctx[23].type);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, i_1);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input0_input_handler),
    					listen_dev(input0, "keyup", keyup_handler_1, false, false, false),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(select, "change", select_change_handler),
    					listen_dev(button, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, index*/ 3 && input0.value !== /*field*/ ctx[23].title) {
    				set_input_value(input0, /*field*/ ctx[23].title);
    			}

    			if (dirty & /*data, index*/ 3 && input1.value !== /*field*/ ctx[23].description) {
    				set_input_value(input1, /*field*/ ctx[23].description);
    			}

    			if (dirty & /*data, index*/ 3) {
    				select_option(select, /*field*/ ctx[23].type);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(134:4) {#each data.collections[index].fields as field, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let button0;
    	let t3;
    	let div7;
    	let b0;
    	let t5;
    	let t6;
    	let div6;
    	let div4;
    	let b1;
    	let t8;
    	let div3;
    	let t10;
    	let div5;
    	let button1;
    	let i;
    	let t11;
    	let t12;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*title*/ ctx[2] in /*data*/ ctx[0]) return create_if_block_1$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Edit Collection";
    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Save";
    			t3 = space();
    			div7 = element("div");
    			b0 = element("b");
    			b0.textContent = "Title";
    			t5 = space();
    			if_block0.c();
    			t6 = space();
    			div6 = element("div");
    			div4 = element("div");
    			b1 = element("b");
    			b1.textContent = "Fields";
    			t8 = space();
    			div3 = element("div");
    			div3.textContent = "Fields in this collection";
    			t10 = space();
    			div5 = element("div");
    			button1 = element("button");
    			i = element("i");
    			t11 = text(" Add Field");
    			t12 = space();
    			if (if_block1) if_block1.c();
    			add_location(h4, file$5, 95, 0, 2467);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$5, 94, 0, 2447);
    			attr_dev(button0, "class", "btn btn-dark btn-add");
    			add_location(button0, file$5, 98, 0, 2530);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$5, 97, 0, 2499);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$5, 93, 0, 2422);
    			add_location(b0, file$5, 112, 4, 2820);
    			add_location(b1, file$5, 122, 4, 3270);
    			attr_dev(div3, "class", "description");
    			add_location(div3, file$5, 123, 4, 3288);
    			attr_dev(div4, "class", "col-6");
    			add_location(div4, file$5, 121, 2, 3246);
    			attr_dev(i, "class", "bi bi-plus-circle");
    			add_location(i, file$5, 126, 83, 3470);
    			attr_dev(button1, "class", "btn btn-outline-dark btn-add float-right");
    			add_location(button1, file$5, 126, 4, 3391);
    			attr_dev(div5, "class", "col-6 text-right");
    			add_location(div5, file$5, 125, 2, 3356);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$5, 120, 0, 3226);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$5, 102, 0, 2614);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, b0);
    			append_dev(div7, t5);
    			if_block0.m(div7, null);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, b1);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, button1);
    			append_dev(button1, i);
    			append_dev(button1, t11);
    			append_dev(div7, t12);
    			if (if_block1) if_block1.m(div7, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*save*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*addField*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div7, t6);
    				}
    			}

    			if (/*data*/ ctx[0].collections[/*index*/ ctx[1]].fields) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div7, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div7);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EditCollection", slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let id = false;
    	let item = false;
    	let index = false;
    	let collection = false;
    	let fields = {};
    	let title = "";

    	function save() {
    		if (checkLength("title")) {
    			window.renderData(data);
    			alert(JSON.stringify(data));
    		}
    	}

    	function addField() {
    		let newField = {};
    		newField.title = "";
    		newField.description = "";
    		newField.type = "txt";
    		data.collections[index].fields.push(newField);
    		$$invalidate(0, data);
    	}

    	function deleteField(title) {
    		let result = confirm("Are you sure you want to delete this field?");

    		if (result) {
    			$$invalidate(0, data.collections[index].fields = data.collections[index].fields.filter(x => x.title !== title), data);
    			$$invalidate(0, data);
    		}
    	}

    	function slugifyTitle(key) {
    		let slug = data.collections[index][key].toString().toLowerCase().replace(/\s+/g, "_").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "_").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data.collections[index][key] = slug, data);
    		$$invalidate(0, data);
    	}

    	function slugifyFieldTitle(i) {
    		let slug = data.collections[index].fields[i].title.toString().toLowerCase().replace(/\s+/g, "_").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "_").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data.collections[index].fields[i].title = slug, data);
    		$$invalidate(0, data);
    	}

    	function checkLength(key) {
    		if (data.collections[index][key].length < 3) {
    			toast.push("Title should be a least 3 characters long", {
    				theme: {
    					"--toastBackground": "#F56565",
    					"--toastProgressBackground": "#C53030",
    					"--toastWidth": "22em"
    				}
    			});

    			return false;
    		} else {
    			return true;
    		}
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditCollection> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data.collections[index].title = this.value;
    		$$invalidate(0, data);
    		((((($$invalidate(1, index), $$invalidate(9, params)), $$invalidate(0, data)), $$invalidate(10, cat)), $$invalidate(11, id)), $$invalidate(12, item));
    	}

    	const keyup_handler = () => slugifyTitle("title");
    	const blur_handler = () => checkLength("title");

    	function input0_input_handler(each_value, i) {
    		each_value[i].title = this.value;
    		$$invalidate(0, data);
    		((((($$invalidate(1, index), $$invalidate(9, params)), $$invalidate(0, data)), $$invalidate(10, cat)), $$invalidate(11, id)), $$invalidate(12, item));
    	}

    	const keyup_handler_1 = i => slugifyFieldTitle(i);

    	function input1_input_handler(each_value, i) {
    		each_value[i].description = this.value;
    		$$invalidate(0, data);
    		((((($$invalidate(1, index), $$invalidate(9, params)), $$invalidate(0, data)), $$invalidate(10, cat)), $$invalidate(11, id)), $$invalidate(12, item));
    	}

    	function select_change_handler(each_value, i) {
    		each_value[i].type = select_value(this);
    		$$invalidate(0, data);
    		((((($$invalidate(1, index), $$invalidate(9, params)), $$invalidate(0, data)), $$invalidate(10, cat)), $$invalidate(11, id)), $$invalidate(12, item));
    	}

    	const click_handler = field => deleteField(field.title);

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(9, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		toast,
    		params,
    		data,
    		cat,
    		id,
    		item,
    		index,
    		collection,
    		fields,
    		title,
    		save,
    		addField,
    		deleteField,
    		slugifyTitle,
    		slugifyFieldTitle,
    		checkLength
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(9, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(10, cat = $$props.cat);
    		if ("id" in $$props) $$invalidate(11, id = $$props.id);
    		if ("item" in $$props) $$invalidate(12, item = $$props.item);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("collection" in $$props) collection = $$props.collection;
    		if ("fields" in $$props) fields = $$props.fields;
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat, id, item, index*/ 7683) {
    			 if (params.id) {
    				$$invalidate(10, cat = "collections");
    				$$invalidate(11, id = params.id);
    				$$invalidate(12, item = data[cat].filter(x => x.id == id)[0]);

    				if (!item) {
    					// not found, redirect
    					window.location = "/";
    				}

    				$$invalidate(1, index = data[cat].findIndex(x => x.id == id));
    				collection = data.collections.filter(x => x.title == cat)[0];
    				$$invalidate(2, title = data.collections[index].title);
    			}
    		}
    	};

    	return [
    		data,
    		index,
    		title,
    		save,
    		addField,
    		deleteField,
    		slugifyTitle,
    		slugifyFieldTitle,
    		checkLength,
    		params,
    		cat,
    		id,
    		item,
    		input_input_handler,
    		keyup_handler,
    		blur_handler,
    		input0_input_handler,
    		keyup_handler_1,
    		input1_input_handler,
    		select_change_handler,
    		click_handler
    	];
    }

    class EditCollection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { params: 9, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditCollection",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[9] === undefined && !("params" in props)) {
    			console.warn("<EditCollection> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<EditCollection> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<EditCollection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditCollection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<EditCollection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<EditCollection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.31.2 */

    function create_fragment$7(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$6 = "src/App.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (67:1) {#if routes}
    function create_if_block$5(ctx) {
    	let div6;
    	let div3;
    	let div2;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let a1;
    	let t3;
    	let div5;
    	let div4;
    	let router;
    	let t4;
    	let sveltetoast;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0].collections;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	router = new Router({
    			props: { routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	sveltetoast = new SvelteToast({ $$inline: true });

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "collections";
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(router.$$.fragment);
    			t4 = space();
    			create_component(sveltetoast.$$.fragment);
    			if (img.src !== (img_src_value = "assets/img/rocketlogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			add_location(img, file$6, 71, 86, 1436);
    			attr_dev(a0, "href", "/#/");
    			toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			add_location(a0, file$6, 71, 0, 1350);
    			attr_dev(div0, "id", "collections-nav");
    			add_location(div0, file$6, 74, 0, 1514);
    			attr_dev(a1, "href", "/#/list/collections");
    			toggle_class(a1, "selected", /*current*/ ctx[2] === "collections");
    			add_location(a1, file$6, 82, 1, 1761);
    			attr_dev(div1, "class", "side-nav");
    			add_location(div1, file$6, 73, 0, 1491);
    			attr_dev(div2, "class", "side");
    			add_location(div2, file$6, 69, 0, 1330);
    			attr_dev(div3, "class", "col-md-2");
    			add_location(div3, file$6, 68, 0, 1307);
    			attr_dev(div4, "class", "main");
    			add_location(div4, file$6, 91, 0, 1944);
    			attr_dev(div5, "class", "col-md-10");
    			add_location(div5, file$6, 89, 0, 1919);
    			attr_dev(div6, "class", "row no-gutters page");
    			add_location(div6, file$6, 67, 0, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, a0);
    			append_dev(a0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t1);
    			append_dev(div1, a1);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			mount_component(router, div4, null);
    			insert_dev(target, t4, anchor);
    			mount_component(sveltetoast, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(a1, "click", /*click_handler_2*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 4) {
    				toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			}

    			if (dirty & /*data, current*/ 5) {
    				each_value = /*data*/ ctx[0].collections;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*current*/ 4) {
    				toggle_class(a1, "selected", /*current*/ ctx[2] === "collections");
    			}

    			const router_changes = {};
    			if (dirty & /*routes*/ 2) router_changes.routes = /*routes*/ ctx[1];
    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			transition_in(sveltetoast.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			transition_out(sveltetoast.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			destroy_component(router);
    			if (detaching) detach_dev(t4);
    			destroy_component(sveltetoast, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(67:1) {#if routes}",
    		ctx
    	});

    	return block;
    }

    // (77:1) {#if item.title !== 'collections'}
    function create_if_block_1$2(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[7].title + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*item*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/list/" + /*item*/ ctx[7].title);
    			toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[7]);
    			add_location(a, file$6, 77, 1, 1612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[7].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "/#/list/" + /*item*/ ctx[7].title)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*current, data*/ 5) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(77:1) {#if item.title !== 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (76:1) {#each data.collections as item}
    function create_each_block$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*item*/ ctx[7].title !== "collections" && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[7].title !== "collections") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(76:1) {#each data.collections as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*routes*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*routes*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*routes*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let data = false;
    	let showApp = false;
    	let routes = false;
    	let current = false;

    	onMount(async () => {
    		const res = await fetch(`data.json`);
    		$$invalidate(0, data = await res.json());

    		$$invalidate(1, routes = {
    			// Exact path
    			"/": wrap({ component: Home, props: { data } }),
    			"/list/:cat": wrap({ component: List, props: { data } }),
    			"/edit/:cat/:id": wrap({ component: Edit, props: { data } }),
    			"/collections/:id": wrap({
    				component: EditCollection,
    				props: { data }
    			}),
    			// Catch-all
    			// This is optional, but if present it must be the last
    			"*": NotFound
    		});
    	});

    	// allows force re-rendering
    	window.renderData = function (mydata) {
    		$$invalidate(0, data = mydata);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, current = false);
    	const click_handler_1 = item => $$invalidate(2, current = item.title);
    	const click_handler_2 = () => $$invalidate(2, current = "collections");

    	$$self.$capture_state = () => ({
    		onMount,
    		SvelteToast,
    		Router,
    		wrap,
    		Home,
    		List,
    		Edit,
    		EditCollection,
    		NotFound,
    		data,
    		showApp,
    		routes,
    		current
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("showApp" in $$props) showApp = $$props.showApp;
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("current" in $$props) $$invalidate(2, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, routes, current, click_handler, click_handler_1, click_handler_2];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
