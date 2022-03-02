
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function loop$1(callback) {
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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
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
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
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
        loop$1(now => {
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
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop$1(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.3' }, detail), true));
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

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
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
    function wrap$1(args) {
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
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
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

    function parse(str, loose) {
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

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.46.3 */

    const { Error: Error_1, Object: Object_1$1, console: console_1$6 } = globals;

    // (251:0) {:else}
    function create_else_block$3(ctx) {
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$8(ctx) {
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$8, create_else_block$3];
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
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
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

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

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
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
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
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
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
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
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
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
     * @returns {boolean} Returns true if all the conditions succeeded
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

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
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
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
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
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

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
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
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
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$6.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
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
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$d.name
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

    /* src/routes/Home.svelte generated by Svelte v3.46.3 */

    const file$b = "src/routes/Home.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(h4, file$b, 6, 0, 82);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$b, 5, 0, 62);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$b, 8, 0, 108);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$b, 4, 0, 37);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$b, 13, 0, 155);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let { data } = $$props;
    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<Home> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Helpers.svelte generated by Svelte v3.46.3 */

    function slugify(text) {
    	let slug = text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, ''); // Replace spaces with -
    	// Remove all non-word chars
    	// Replace multiple - with single -
    	// Trim - from start of text
    	// Trim - from end of text

    	return slug;
    }

    /* src/routes/Types.svelte generated by Svelte v3.46.3 */
    const file$a = "src/routes/Types.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (56:0) {#each data.types as item}
    function create_each_block$7(ctx) {
    	let li;
    	let div2;
    	let div0;
    	let a;
    	let t0_value = /*item*/ ctx[10].title + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let div1;
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div2 = element("div");
    			div0 = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr_dev(a, "href", a_href_value = "/#/type/" + /*item*/ ctx[10].id);
    			attr_dev(a, "class", "text-truncate");
    			add_location(a, file$a, 60, 2, 1270);
    			attr_dev(div0, "class", "col-6 text-truncate d-flex align-items-center");
    			add_location(div0, file$a, 58, 2, 1207);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$a, 63, 2, 1349);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$a, 57, 2, 1187);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$a, 56, 2, 1156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div2);
    			append_dev(div2, div0);
    			append_dev(div0, a);
    			append_dev(a, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*item*/ ctx[10].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "/#/type/" + /*item*/ ctx[10].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(56:0) {#each data.types as item}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {#if addType}
    function create_if_block$7(ctx) {
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h4;
    	let t1;
    	let button0;
    	let span;
    	let t3;
    	let div2;
    	let t4;
    	let b;
    	let t6;
    	let input;
    	let t7;
    	let div1;
    	let t8;
    	let div3;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[2] && create_if_block_1$6(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Add Post Type";
    			t1 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			b = element("b");
    			b.textContent = "Name";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			div1 = element("div");
    			t8 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Add Post Type";
    			attr_dev(h4, "class", "modal-title");
    			add_location(h4, file$a, 80, 8, 1634);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$a, 82, 10, 1772);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$a, 81, 8, 1685);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$a, 79, 6, 1599);
    			add_location(b, file$a, 92, 2, 1978);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "coll-title");
    			add_location(input, file$a, 93, 6, 1996);
    			attr_dev(div1, "class", "description-sub");
    			add_location(div1, file$a, 94, 10, 2065);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$a, 85, 6, 1884);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$a, 97, 8, 2155);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$a, 96, 6, 2120);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$a, 78, 4, 1565);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$a, 77, 2, 1518);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			add_location(div6, file$a, 76, 0, 1468);
    			attr_dev(div7, "class", "backdrop");
    			add_location(div7, file$a, 74, 0, 1444);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, b);
    			append_dev(div2, t6);
    			append_dev(div2, input);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*saveType*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*error*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$6(ctx);
    					if_block.c();
    					if_block.m(div2, t4);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(74:0) {#if addType}",
    		ctx
    	});

    	return block;
    }

    // (88:0) {#if error}
    function create_if_block_1$6(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*error*/ ctx[2]);
    			attr_dev(div, "class", "alert alert-danger");
    			add_location(div, file$a, 88, 0, 1922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4) set_data_dev(t, /*error*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(88:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let button;
    	let t3;
    	let div3;
    	let ul;
    	let t4;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0].types;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	let if_block = /*addType*/ ctx[1] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Post Types";
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Add Post Type";
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file$a, 43, 0, 898);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$a, 41, 0, 877);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$a, 48, 0, 958);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$a, 47, 0, 927);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$a, 40, 0, 852);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$a, 54, 0, 1090);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$a, 52, 0, 1067);
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
    			append_dev(div1, button);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0].types;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*addType*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
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
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Types', slots, []);
    	let { data } = $$props;
    	let cat = false;
    	let items = false;
    	let addType = false;
    	let error = false;
    	let coll_title = false;

    	function deleteItem(id) {
    		let result = confirm("Are you sure you want to delete this item?");

    		if (result) {
    			$$invalidate(0, data[cat] = data[cat].filter(x => x.id !== id), data);
    			$$invalidate(0, data);
    		}
    	}

    	function saveType() {
    		let val = document.querySelector('#coll-title').value;
    		let slug = slugify(val);

    		if (val.length < 3) {
    			$$invalidate(2, error = "Name should be at least 3 characters long");
    		} else if (val in data) {
    			$$invalidate(2, error = "Name already exists");
    		} else {
    			let newItem = {};
    			newItem.id = Date.now();
    			newItem.title = val;
    			newItem.slug = slug;
    			newItem.fields = [];
    			data.types.push(newItem);
    			window.renderData(data);
    			window.location = "/#/type/" + newItem.id;
    		}
    	}

    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Types> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, addType = true);
    	const click_handler_1 = () => addColl = false;

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		slugify,
    		data,
    		cat,
    		items,
    		addType,
    		error,
    		coll_title,
    		deleteItem,
    		saveType
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('cat' in $$props) cat = $$props.cat;
    		if ('items' in $$props) items = $$props.items;
    		if ('addType' in $$props) $$invalidate(1, addType = $$props.addType);
    		if ('error' in $$props) $$invalidate(2, error = $$props.error);
    		if ('coll_title' in $$props) coll_title = $$props.coll_title;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, addType, error, saveType, click_handler, click_handler_1];
    }

    class Types extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Types",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<Types> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Types>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Types>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/widgets/Markdown.svelte generated by Svelte v3.46.3 */
    const file$9 = "src/widgets/Markdown.svelte";

    function create_fragment$a(ctx) {
    	let textarea;
    	let textarea_id_value;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "id", textarea_id_value = "mde-" + /*key*/ ctx[1]);
    			textarea.value = textarea_value_value = defined(/*html*/ ctx[0]);
    			add_location(textarea, file$9, 29, 0, 593);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2 && textarea_id_value !== (textarea_id_value = "mde-" + /*key*/ ctx[1])) {
    				attr_dev(textarea, "id", textarea_id_value);
    			}

    			if (dirty & /*html*/ 1 && textarea_value_value !== (textarea_value_value = defined(/*html*/ ctx[0]))) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function defined(val) {
    	if (typeof val === 'undefined') {
    		val = '';
    	}

    	return val;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Markdown', slots, []);
    	let { key } = $$props;
    	let { html } = $$props;
    	let easyMDE = false;

    	onMount(() => {
    		easyMDE = new EasyMDE({
    				element: document.getElementById('mde-' + key),
    				spellChecker: false
    			});

    		easyMDE.codemirror.on("change", function () {
    			// console.log(easyMDE.value());
    			$$invalidate(0, html = easyMDE.value());
    		});
    	});

    	onDestroy(() => {
    		if (easyMDE && easyMDE !== null && typeof easyMDE !== 'undefined') {
    			easyMDE.toTextArea();
    			easyMDE = null;
    		}
    	});

    	const writable_props = ['key', 'html'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Markdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('html' in $$props) $$invalidate(0, html = $$props.html);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		key,
    		html,
    		easyMDE,
    		defined
    	});

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('html' in $$props) $$invalidate(0, html = $$props.html);
    		if ('easyMDE' in $$props) easyMDE = $$props.easyMDE;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [html, key];
    }

    class Markdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { key: 1, html: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Markdown",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !('key' in props)) {
    			console.warn("<Markdown> was created without expected prop 'key'");
    		}

    		if (/*html*/ ctx[0] === undefined && !('html' in props)) {
    			console.warn("<Markdown> was created without expected prop 'html'");
    		}
    	}

    	get key() {
    		throw new Error("<Markdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Markdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get html() {
    		throw new Error("<Markdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set html(value) {
    		throw new Error("<Markdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/widgets/TextEditor.svelte generated by Svelte v3.46.3 */
    const file$8 = "src/widgets/TextEditor.svelte";

    function create_fragment$9(ctx) {
    	let textarea;
    	let textarea_id_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "name", /*key*/ ctx[1]);
    			attr_dev(textarea, "class", "form-control rich-text-editor");
    			attr_dev(textarea, "id", textarea_id_value = "rte-" + /*key*/ ctx[1]);
    			textarea.value = /*html*/ ctx[0];
    			add_location(textarea, file$8, 47, 0, 1063);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2) {
    				attr_dev(textarea, "name", /*key*/ ctx[1]);
    			}

    			if (dirty & /*key*/ 2 && textarea_id_value !== (textarea_id_value = "rte-" + /*key*/ ctx[1])) {
    				attr_dev(textarea, "id", textarea_id_value);
    			}

    			if (dirty & /*html*/ 1) {
    				prop_dev(textarea, "value", /*html*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextEditor', slots, []);
    	let { key } = $$props;
    	let { html } = $$props;

    	if (typeof html === 'undefined') {
    		html = '';
    	}

    	onMount(async () => {
    		const config = {
    			classes: ['rich-text-editor'],
    			tools: ['b', 'i', 'u', 'a', 'x'], // visible tool(s)
    			text: {
    				b: ['Bold', 'B', '⌘+B'],
    				i: ['Italic', 'I', '⌘+I'],
    				u: ['Underline', 'U', '⌘+U'],
    				a: ['Link', 'A', '⌘+L'],
    				x: ['Source', '&#x22ef;', '⌘+⇧+X']
    			},
    			tidy: true, // tidy HTML output?
    			enter: true, // set to `false` to automatically submit the closest form on enter key press
    			x(e, node) {
    				
    			}, // on mode change (view/source); set to `false` to disable the source view
    			// on mode change (view/source); set to `false` to disable the source view
    			update(e, node) {
    				
    			}, // on view/source update
    			// on view/source update
    			
    		};

    		new RTE(document.getElementById('rte-' + key), config);

    		document.querySelector('.rich-text-editor-view').addEventListener('keyup', function (e) {
    			handleKeyUp();
    		});
    	});

    	function handleKeyUp(e) {
    		let value = document.querySelector('.rich-text-editor-view').innerHTML;
    		$$invalidate(0, html = value);
    	}

    	const writable_props = ['key', 'html'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextEditor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('html' in $$props) $$invalidate(0, html = $$props.html);
    	};

    	$$self.$capture_state = () => ({ onMount, key, html, handleKeyUp });

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('html' in $$props) $$invalidate(0, html = $$props.html);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [html, key];
    }

    class TextEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { key: 1, html: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextEditor",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !('key' in props)) {
    			console.warn("<TextEditor> was created without expected prop 'key'");
    		}

    		if (/*html*/ ctx[0] === undefined && !('html' in props)) {
    			console.warn("<TextEditor> was created without expected prop 'html'");
    		}
    	}

    	get key() {
    		throw new Error("<TextEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<TextEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get html() {
    		throw new Error("<TextEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set html(value) {
    		throw new Error("<TextEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/widgets/Textarea.svelte generated by Svelte v3.46.3 */

    const file$7 = "src/widgets/Textarea.svelte";

    function create_fragment$8(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "class", "form-control");
    			add_location(textarea, file$7, 4, 0, 35);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*val*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*val*/ 1) {
    				set_input_value(textarea, /*val*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			dispose();
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
    	validate_slots('Textarea', slots, []);
    	let { val } = $$props;
    	const writable_props = ['val'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Textarea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		val = this.value;
    		$$invalidate(0, val);
    	}

    	$$self.$$set = $$props => {
    		if ('val' in $$props) $$invalidate(0, val = $$props.val);
    	};

    	$$self.$capture_state = () => ({ val });

    	$$self.$inject_state = $$props => {
    		if ('val' in $$props) $$invalidate(0, val = $$props.val);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [val, textarea_input_handler];
    }

    class Textarea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { val: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Textarea",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*val*/ ctx[0] === undefined && !('val' in props)) {
    			console.warn("<Textarea> was created without expected prop 'val'");
    		}
    	}

    	get val() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set val(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/widgets/Gallery.svelte generated by Svelte v3.46.3 */

    const { console: console_1$5 } = globals;
    const file$6 = "src/widgets/Gallery.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[11] = list;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (159:0) {:else}
    function create_else_block_2(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M12.002 4h-10a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1zm-10-1a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-10zm4 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z");
    			add_location(path0, file$6, 160, 2, 3782);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "d", "M4 2h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1v1a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2h1a1 1 0 0 1 1-1z");
    			add_location(path1, file$6, 161, 2, 4066);
    			attr_dev(svg, "width", "1em");
    			attr_dev(svg, "height", "1em");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", "bi bi-images svelte-ydwqzg");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$6, 159, 0, 3653);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(159:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (157:0) {#if uploading}
    function create_if_block_4$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$6, 157, 0, 3557);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(157:0) {#if uploading}",
    		ctx
    	});

    	return block;
    }

    // (168:0) {#if item[key].length > 0}
    function create_if_block$6(ctx) {
    	let ul;
    	let each_value = /*item*/ ctx[0][/*key*/ ctx[1]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$6, 169, 0, 4272);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteImage, key, moveDown, window, item, settings, imageExists*/ 55) {
    				each_value = /*item*/ ctx[0][/*key*/ ctx[1]];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(168:0) {#if item[key].length > 0}",
    		ctx
    	});

    	return block;
    }

    // (187:0) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Live URL not configured");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(187:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (179:0) {#if settings.live_url}
    function create_if_block_2$2(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (dirty & /*settings, item, key*/ 7) show_if = null;
    		if (show_if == null) show_if = !!imageExists(/*settings*/ ctx[2].live_url + /*img*/ ctx[10].filename);
    		if (show_if) return create_if_block_3$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_2(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(179:0) {#if settings.live_url}",
    		ctx
    	});

    	return block;
    }

    // (183:2) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Generating thumbnails...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(183:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (181:2) {#if imageExists(settings.live_url+img.filename)}
    function create_if_block_3$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "box svelte-ydwqzg");
    			set_style(div, "background-image", "url(" + (/*settings*/ ctx[2].live_url + /*img*/ ctx[10].filename) + ")");
    			add_location(div, file$6, 181, 4, 4481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings, item, key*/ 7) {
    				set_style(div, "background-image", "url(" + (/*settings*/ ctx[2].live_url + /*img*/ ctx[10].filename) + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(181:2) {#if imageExists(settings.live_url+img.filename)}",
    		ctx
    	});

    	return block;
    }

    // (192:24) {#if window.config.imgTitle}
    function create_if_block_1$5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[7].call(input, /*i*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", window.config.imgTitle);
    			add_location(input, file$6, 191, 52, 4720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[12]].title);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*item, key*/ 3 && input.value !== /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[12]].title) {
    				set_input_value(input, /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[12]].title);
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
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(192:24) {#if window.config.imgTitle}",
    		ctx
    	});

    	return block;
    }

    // (172:0) {#each item[key] as img, i}
    function create_each_block$6(ctx) {
    	let li;
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let div2;
    	let button0;
    	let svg0;
    	let path0;
    	let t2;
    	let button1;
    	let svg1;
    	let path1;
    	let path2;
    	let t3;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*settings*/ ctx[2].live_url) return create_if_block_2$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = window.config.imgTitle && create_if_block_1$5(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*i*/ ctx[12]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[9](/*i*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div4 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t3 = space();
    			attr_dev(div0, "class", "col-md-4");
    			add_location(div0, file$6, 176, 2, 4376);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file$6, 191, 2, 4670);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M3.204 5L8 10.481 12.796 5H3.204zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z");
    			add_location(path0, file$6, 198, 2, 5122);
    			attr_dev(svg0, "width", "1em");
    			attr_dev(svg0, "height", "1em");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			attr_dev(svg0, "class", "bi bi-caret-down svelte-ydwqzg");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$6, 197, 0, 4989);
    			attr_dev(button0, "class", "btn btn-outline-secondary svelte-ydwqzg");
    			add_location(button0, file$6, 196, 0, 4910);
    			attr_dev(path1, "d", "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z");
    			add_location(path1, file$6, 205, 4, 5532);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "d", "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z");
    			add_location(path2, file$6, 206, 4, 5708);
    			attr_dev(svg1, "width", "1em");
    			attr_dev(svg1, "height", "1em");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			attr_dev(svg1, "class", "bi bi-trash svelte-ydwqzg");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$6, 204, 2, 5402);
    			attr_dev(button1, "class", "btn btn-outline-secondary svelte-ydwqzg");
    			add_location(button1, file$6, 203, 2, 5318);
    			attr_dev(div2, "class", "btn-group float-right");
    			add_location(div2, file$6, 194, 0, 4873);
    			attr_dev(div3, "class", "col-md-4");
    			add_location(div3, file$6, 192, 2, 4849);
    			attr_dev(div4, "class", "row svelte-ydwqzg");
    			add_location(div4, file$6, 175, 0, 4356);
    			attr_dev(li, "class", "list-group-item svelte-ydwqzg");
    			add_location(li, file$6, 173, 0, 4326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div4);
    			append_dev(div4, div0);
    			if_block0.m(div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div2, t2);
    			append_dev(div2, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(li, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler_1, false, false, false),
    					listen_dev(button1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (window.config.imgTitle) if_block1.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(172:0) {#each item[key] as img, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let input;
    	let t0;
    	let button;
    	let t1;
    	let t2;
    	let t3;
    	let br;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*uploading*/ ctx[3]) return create_if_block_4$2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*item*/ ctx[0][/*key*/ ctx[1]].length > 0 && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			if_block0.c();
    			t1 = text("\n\n Choose Image");
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			br = element("br");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "fileInput");
    			attr_dev(input, "class", "fileInput svelte-ydwqzg");
    			attr_dev(input, "accept", "image/*");
    			attr_dev(input, "data-name", /*key*/ ctx[1]);
    			add_location(input, file$6, 152, 0, 3360);
    			attr_dev(button, "class", "btn btn-outline-secondary w-25 mb-3 svelte-ydwqzg");
    			add_location(button, file$6, 153, 0, 3450);
    			add_location(br, file$6, 220, 0, 6049);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			if_block0.m(button, null);
    			append_dev(button, t1);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2) {
    				attr_dev(input, "data-name", /*key*/ ctx[1]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, t1);
    				}
    			}

    			if (/*item*/ ctx[0][/*key*/ ctx[1]].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			dispose();
    		}
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

    function clickSelect(mykey) {
    	document.querySelector('#fileInput').click();
    }

    function move(array, from, to) {
    	if (to === from) return array;
    	var target = array[from];
    	var increment = to < from ? -1 : 1;

    	for (var k = from; k != to; k += increment) {
    		array[k] = array[k + increment];
    	}

    	array[to] = target;
    	return array;
    }

    function imageExists(image_url) {
    	var http = new XMLHttpRequest();
    	http.open('HEAD', image_url, false);
    	http.send();
    	return http.status != 404;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gallery', slots, []);
    	let { key } = $$props;
    	let { item } = $$props;
    	let { settings } = $$props;
    	let uploading = false;

    	if (!item[key]) {
    		item[key] = [];
    	}

    	onMount(async () => {
    		document.getElementById('fileInput').addEventListener('change', function (e) {
    			$$invalidate(3, uploading = true);

    			if (typeof settings.image_width !== 'undefined') {
    				var width = settings.image_width;
    			} else {
    				var width = 800;
    			}

    			var img = new Image();

    			img.onload = function () {
    				var canvas = document.createElement('canvas'),
    					ctx = canvas.getContext("2d"),
    					oc = document.createElement('canvas'),
    					octx = oc.getContext('2d');

    				canvas.width = width; // destination canvas size
    				canvas.height = canvas.width * img.height / img.width;

    				var cur = {
    					width: Math.floor(img.width * 0.5),
    					height: Math.floor(img.height * 0.5)
    				};

    				oc.width = cur.width;
    				oc.height = cur.height;
    				octx.drawImage(img, 0, 0, cur.width, cur.height);

    				while (cur.width * 0.5 > width) {
    					cur = {
    						width: Math.floor(cur.width * 0.5),
    						height: Math.floor(cur.height * 0.5)
    					};

    					octx.drawImage(oc, 0, 0, cur.width * 2, cur.height * 2, 0, 0, cur.width, cur.height);
    				}

    				ctx.drawImage(oc, 0, 0, cur.width, cur.height, 0, 0, canvas.width, canvas.height);
    				var base64Image = canvas.toDataURL('image/jpeg');
    				console.log(base64Image);
    				let opts = {};
    				opts.path = 'img/' + Date.now() + ".jpg";
    				opts.type = 'img';
    				opts.data = base64Image;

    				call_api('api/save', opts).then(function (res) {
    					if (res.ok) {
    						console.log('Saved');
    						let newItem = { 'filename': res.path };
    						item[key].push(newItem);
    						$$invalidate(0, item);
    						$$invalidate(3, uploading = false);
    					} else {
    						console.log('Error saving');

    						setTimeout(
    							function () {
    								$$invalidate(3, uploading = false);
    							},
    							1000
    						);
    					}
    				});

    				// cleaning up
    				URL.revokeObjectURL(img.src);
    			};

    			img.src = URL.createObjectURL(e.target.files[0]);
    		});
    	});

    	function deleteImage(key, i) {
    		console.log(key);
    		var r = confirm("Are you sure you want to delete this image?");

    		if (r == true) {
    			$$invalidate(3, uploading = true);
    			let opts = {};
    			opts.path = item[key][i].filename;

    			call_api('api/delete', opts).then(function (res) {
    				if (res.ok) {
    					console.log('Deleted');
    					item[key].splice(i, 1);
    					$$invalidate(0, item);
    					$$invalidate(3, uploading = false);
    				} else {
    					console.log('Error deleting');

    					setTimeout(
    						function () {
    							$$invalidate(3, uploading = false);
    						},
    						1000
    					);
    				}
    			});
    		}
    	}

    	function moveDown(key, index) {
    		var newindex = index + 1;

    		if (typeof item[key][newindex] !== 'undefined') {
    			$$invalidate(0, item[key] = move(item[key], index, index + 1), item);
    			$$invalidate(0, item);
    		}
    	}

    	const writable_props = ['key', 'item', 'settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<Gallery> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => clickSelect();

    	function input_input_handler(i) {
    		item[key][i].title = this.value;
    		$$invalidate(0, item);
    	}

    	const click_handler_1 = i => moveDown(key, i);
    	const click_handler_2 = i => deleteImage(key, i);

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		key,
    		item,
    		settings,
    		uploading,
    		clickSelect,
    		deleteImage,
    		move,
    		moveDown,
    		imageExists
    	});

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    		if ('uploading' in $$props) $$invalidate(3, uploading = $$props.uploading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		item,
    		key,
    		settings,
    		uploading,
    		deleteImage,
    		moveDown,
    		click_handler,
    		input_input_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Gallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { key: 1, item: 0, settings: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !('key' in props)) {
    			console_1$5.warn("<Gallery> was created without expected prop 'key'");
    		}

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console_1$5.warn("<Gallery> was created without expected prop 'item'");
    		}

    		if (/*settings*/ ctx[2] === undefined && !('settings' in props)) {
    			console_1$5.warn("<Gallery> was created without expected prop 'settings'");
    		}
    	}

    	get key() {
    		throw new Error("<Gallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Gallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Gallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Gallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settings() {
    		throw new Error("<Gallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Gallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Edit.svelte generated by Svelte v3.46.3 */

    const { console: console_1$4 } = globals;
    const file$5 = "src/routes/Edit.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[25] = list;
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (76:0) {#if collection}
    function create_if_block$5(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let button;
    	let t3;
    	let t4;
    	let div3;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[4] && create_if_block_10(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*cat*/ ctx[2] == 'categories') return create_if_block_8;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let each_value = /*collection*/ ctx[1].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text("Edit ");
    			t1 = text(/*title*/ ctx[5]);
    			t2 = space();
    			div1 = element("div");
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t3 = text("  Save");
    			t4 = space();
    			div3 = element("div");
    			if_block1.c();
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$5, 81, 0, 1837);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$5, 80, 0, 1817);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$5, 84, 0, 1897);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$5, 83, 0, 1866);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$5, 79, 0, 1792);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$5, 89, 0, 2095);
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
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			if_block1.m(div3, null);
    			append_dev(div3, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*save*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*title*/ 32) set_data_dev(t1, /*title*/ ctx[5]);

    			if (/*loading*/ ctx[4]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					if_block0.m(button, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, t5);
    				}
    			}

    			if (dirty & /*collection, data, cat, index*/ 15) {
    				each_value = /*collection*/ ctx[1].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

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
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			if_block1.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(76:0) {#if collection}",
    		ctx
    	});

    	return block;
    }

    // (85:55) {#if loading}
    function create_if_block_10(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$5, 84, 68, 1965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(85:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (97:0) {:else}
    function create_else_block$1(ctx) {
    	let div2;
    	let div0;
    	let b;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let mounted;
    	let dispose;
    	let if_block = /*cat*/ ctx[2] !== 'categories' && create_if_block_9(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			b = element("b");
    			b.textContent = "Title";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			add_location(b, file$5, 101, 0, 2289);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$5, 102, 0, 2302);
    			attr_dev(div0, "class", "col-md-8");
    			add_location(div0, file$5, 99, 0, 2265);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file$5, 105, 0, 2391);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$5, 98, 0, 2247);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, b);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[11]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, cat, index*/ 13 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title);
    			}

    			if (/*cat*/ ctx[2] !== 'categories') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_9(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(97:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:0) {#if cat=='categories'}
    function create_if_block_8(ctx) {
    	let b;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Title";
    			t1 = space();
    			input = element("input");
    			add_location(b, file$5, 93, 0, 2143);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$5, 94, 0, 2156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[10]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, cat, index*/ 13 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].title);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(93:0) {#if cat=='categories'}",
    		ctx
    	});

    	return block;
    }

    // (108:0) {#if cat !== 'categories'}
    function create_if_block_9(ctx) {
    	let b;
    	let t1;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*data*/ ctx[0].categories;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Category";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(b, file$5, 108, 0, 2442);
    			attr_dev(select, "class", "form-control w-100");
    			if (/*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].category === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
    			add_location(select, file$5, 109, 0, 2458);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].category);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[12]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*data*/ ctx[0].categories;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*data, cat, index*/ 13) {
    				select_option(select, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]].category);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(108:0) {#if cat !== 'categories'}",
    		ctx
    	});

    	return block;
    }

    // (111:0) {#each data.categories as cat}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[2].title + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[2].slug;
    			option.value = option.__value;
    			add_location(option, file$5, 111, 0, 2566);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*cat*/ ctx[2].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*cat*/ ctx[2].slug)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(111:0) {#each data.categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (124:0) {#if field.type !== 'cat'}
    function create_if_block_7(ctx) {
    	let b;
    	let t_value = /*field*/ ctx[24].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			b = element("b");
    			t = text(t_value);
    			add_location(b, file$5, 124, 2, 2728);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			append_dev(b, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 2 && t_value !== (t_value = /*field*/ ctx[24].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(124:0) {#if field.type !== 'cat'}",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#if field.description}
    function create_if_block_6(ctx) {
    	let div;
    	let t_value = /*field*/ ctx[24].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "description");
    			add_location(div, file$5, 128, 2, 2784);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 2 && t_value !== (t_value = /*field*/ ctx[24].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(128:2) {#if field.description}",
    		ctx
    	});

    	return block;
    }

    // (132:2) {#if field.type=='txt'}
    function create_if_block_5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_2() {
    		/*input_input_handler_2*/ ctx[13].call(input, /*field*/ ctx[24]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$5, 132, 2, 2872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_2);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, cat, index, collection*/ 15 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title]) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title]);
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(132:2) {#if field.type=='txt'}",
    		ctx
    	});

    	return block;
    }

    // (136:2) {#if field.type=='txta'}
    function create_if_block_4$1(ctx) {
    	let textarea;
    	let updating_val;
    	let current;

    	function textarea_val_binding(value) {
    		/*textarea_val_binding*/ ctx[14](value, /*field*/ ctx[24]);
    	}

    	let textarea_props = {};

    	if (/*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title] !== void 0) {
    		textarea_props.val = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    	}

    	textarea = new Textarea({ props: textarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(textarea, 'val', textarea_val_binding));

    	const block = {
    		c: function create() {
    			create_component(textarea.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textarea, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const textarea_changes = {};

    			if (!updating_val && dirty & /*data, cat, index, collection*/ 15) {
    				updating_val = true;
    				textarea_changes.val = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    				add_flush_callback(() => updating_val = false);
    			}

    			textarea.$set(textarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textarea, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(136:2) {#if field.type=='txta'}",
    		ctx
    	});

    	return block;
    }

    // (140:2) {#if field.type=='mde'}
    function create_if_block_3$1(ctx) {
    	let markdown;
    	let updating_key;
    	let updating_html;
    	let current;

    	function markdown_key_binding(value) {
    		/*markdown_key_binding*/ ctx[15](value, /*field*/ ctx[24]);
    	}

    	function markdown_html_binding(value) {
    		/*markdown_html_binding*/ ctx[16](value, /*field*/ ctx[24]);
    	}

    	let markdown_props = {};

    	if (/*field*/ ctx[24].title !== void 0) {
    		markdown_props.key = /*field*/ ctx[24].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title] !== void 0) {
    		markdown_props.html = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    	}

    	markdown = new Markdown({ props: markdown_props, $$inline: true });
    	binding_callbacks.push(() => bind(markdown, 'key', markdown_key_binding));
    	binding_callbacks.push(() => bind(markdown, 'html', markdown_html_binding));

    	const block = {
    		c: function create() {
    			create_component(markdown.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(markdown, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const markdown_changes = {};

    			if (!updating_key && dirty & /*collection*/ 2) {
    				updating_key = true;
    				markdown_changes.key = /*field*/ ctx[24].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_html && dirty & /*data, cat, index, collection*/ 15) {
    				updating_html = true;
    				markdown_changes.html = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    				add_flush_callback(() => updating_html = false);
    			}

    			markdown.$set(markdown_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(markdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(markdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(markdown, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(140:2) {#if field.type=='mde'}",
    		ctx
    	});

    	return block;
    }

    // (144:2) {#if field.type=='rte'}
    function create_if_block_2$1(ctx) {
    	let texteditor;
    	let updating_key;
    	let updating_html;
    	let current;

    	function texteditor_key_binding(value) {
    		/*texteditor_key_binding*/ ctx[17](value, /*field*/ ctx[24]);
    	}

    	function texteditor_html_binding(value) {
    		/*texteditor_html_binding*/ ctx[18](value, /*field*/ ctx[24]);
    	}

    	let texteditor_props = {};

    	if (/*field*/ ctx[24].title !== void 0) {
    		texteditor_props.key = /*field*/ ctx[24].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title] !== void 0) {
    		texteditor_props.html = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    	}

    	texteditor = new TextEditor({ props: texteditor_props, $$inline: true });
    	binding_callbacks.push(() => bind(texteditor, 'key', texteditor_key_binding));
    	binding_callbacks.push(() => bind(texteditor, 'html', texteditor_html_binding));

    	const block = {
    		c: function create() {
    			create_component(texteditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(texteditor, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const texteditor_changes = {};

    			if (!updating_key && dirty & /*collection*/ 2) {
    				updating_key = true;
    				texteditor_changes.key = /*field*/ ctx[24].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_html && dirty & /*data, cat, index, collection*/ 15) {
    				updating_html = true;
    				texteditor_changes.html = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]][/*field*/ ctx[24].title];
    				add_flush_callback(() => updating_html = false);
    			}

    			texteditor.$set(texteditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texteditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texteditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(texteditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(144:2) {#if field.type=='rte'}",
    		ctx
    	});

    	return block;
    }

    // (149:2) {#if field.type=='gal'}
    function create_if_block_1$4(ctx) {
    	let gallery;
    	let updating_key;
    	let updating_item;
    	let updating_settings;
    	let current;

    	function gallery_key_binding(value) {
    		/*gallery_key_binding*/ ctx[19](value, /*field*/ ctx[24]);
    	}

    	function gallery_item_binding(value) {
    		/*gallery_item_binding*/ ctx[20](value);
    	}

    	function gallery_settings_binding(value) {
    		/*gallery_settings_binding*/ ctx[21](value);
    	}

    	let gallery_props = {};

    	if (/*field*/ ctx[24].title !== void 0) {
    		gallery_props.key = /*field*/ ctx[24].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]] !== void 0) {
    		gallery_props.item = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]];
    	}

    	if (/*data*/ ctx[0].settings !== void 0) {
    		gallery_props.settings = /*data*/ ctx[0].settings;
    	}

    	gallery = new Gallery({ props: gallery_props, $$inline: true });
    	binding_callbacks.push(() => bind(gallery, 'key', gallery_key_binding));
    	binding_callbacks.push(() => bind(gallery, 'item', gallery_item_binding));
    	binding_callbacks.push(() => bind(gallery, 'settings', gallery_settings_binding));

    	const block = {
    		c: function create() {
    			create_component(gallery.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gallery, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const gallery_changes = {};

    			if (!updating_key && dirty & /*collection*/ 2) {
    				updating_key = true;
    				gallery_changes.key = /*field*/ ctx[24].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_item && dirty & /*data, cat, index*/ 13) {
    				updating_item = true;
    				gallery_changes.item = /*data*/ ctx[0][/*cat*/ ctx[2]][/*index*/ ctx[3]];
    				add_flush_callback(() => updating_item = false);
    			}

    			if (!updating_settings && dirty & /*data*/ 1) {
    				updating_settings = true;
    				gallery_changes.settings = /*data*/ ctx[0].settings;
    				add_flush_callback(() => updating_settings = false);
    			}

    			gallery.$set(gallery_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(149:2) {#if field.type=='gal'}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#each collection.fields as field}
    function create_each_block$5(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let if_block6_anchor;
    	let current;
    	let if_block0 = /*field*/ ctx[24].type !== 'cat' && create_if_block_7(ctx);
    	let if_block1 = /*field*/ ctx[24].description && create_if_block_6(ctx);
    	let if_block2 = /*field*/ ctx[24].type == 'txt' && create_if_block_5(ctx);
    	let if_block3 = /*field*/ ctx[24].type == 'txta' && create_if_block_4$1(ctx);
    	let if_block4 = /*field*/ ctx[24].type == 'mde' && create_if_block_3$1(ctx);
    	let if_block5 = /*field*/ ctx[24].type == 'rte' && create_if_block_2$1(ctx);
    	let if_block6 = /*field*/ ctx[24].type == 'gal' && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			t5 = space();
    			if (if_block6) if_block6.c();
    			if_block6_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert_dev(target, if_block6_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*field*/ ctx[24].type !== 'cat') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*field*/ ctx[24].description) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*field*/ ctx[24].type == 'txt') {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*field*/ ctx[24].type == 'txta') {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*collection*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[24].type == 'mde') {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*collection*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t4.parentNode, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[24].type == 'rte') {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*collection*/ 2) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_2$1(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t5.parentNode, t5);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[24].type == 'gal') {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty & /*collection*/ 2) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_1$4(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(if_block6_anchor.parentNode, if_block6_anchor);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach_dev(if_block6_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(122:2) {#each collection.fields as field}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*collection*/ ctx[1] && create_if_block$5(ctx);

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
    			if (/*collection*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*collection*/ 2) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Edit', slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let id = false;
    	let item = false;
    	let index = false;
    	let collection = false;
    	let fields = {};
    	let loading = false;
    	let title = false;

    	function save() {
    		if (typeof data[cat][index].slug === 'undefined' || data[cat][index].slug == '') {
    			slugifyTitle();
    		}

    		$$invalidate(4, loading = true);
    		let opts = {};
    		opts.path = 'data.json';
    		opts.type = 'json';
    		opts.data = data;

    		call_api('api/save', opts).then(function (res) {
    			window.renderData(data);

    			if (res.ok) {
    				console.log('Saved');
    				$$invalidate(4, loading = false);
    			} else {
    				console.log('Error saving');

    				setTimeout(
    					function () {
    						$$invalidate(4, loading = false);
    					},
    					1000
    				);
    			}
    		});
    	}

    	function slugifyTitle() {
    		let slug = data[cat][index].title.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, ''); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data[cat][index].slug = slug + '-' + Math.floor(Math.random() * 999), data);
    		$$invalidate(0, data);
    	}

    	const writable_props = ['params', 'data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Edit> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data[cat][index].title = this.value;
    		$$invalidate(0, data);
    	}

    	function input_input_handler_1() {
    		data[cat][index].title = this.value;
    		$$invalidate(0, data);
    	}

    	function select_change_handler() {
    		data[cat][index].category = select_value(this);
    		$$invalidate(0, data);
    	}

    	function input_input_handler_2(field) {
    		data[cat][index][field.title] = this.value;
    		$$invalidate(0, data);
    	}

    	function textarea_val_binding(value, field) {
    		if ($$self.$$.not_equal(data[cat][index][field.title], value)) {
    			data[cat][index][field.title] = value;
    			$$invalidate(0, data);
    		}
    	}

    	function markdown_key_binding(value, field) {
    		if ($$self.$$.not_equal(field.title, value)) {
    			field.title = value;
    			((((($$invalidate(1, collection), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(2, cat)), $$invalidate(8, id)), $$invalidate(9, item));
    		}
    	}

    	function markdown_html_binding(value, field) {
    		if ($$self.$$.not_equal(data[cat][index][field.title], value)) {
    			data[cat][index][field.title] = value;
    			$$invalidate(0, data);
    		}
    	}

    	function texteditor_key_binding(value, field) {
    		if ($$self.$$.not_equal(field.title, value)) {
    			field.title = value;
    			((((($$invalidate(1, collection), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(2, cat)), $$invalidate(8, id)), $$invalidate(9, item));
    		}
    	}

    	function texteditor_html_binding(value, field) {
    		if ($$self.$$.not_equal(data[cat][index][field.title], value)) {
    			data[cat][index][field.title] = value;
    			$$invalidate(0, data);
    		}
    	}

    	function gallery_key_binding(value, field) {
    		if ($$self.$$.not_equal(field.title, value)) {
    			field.title = value;
    			((((($$invalidate(1, collection), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(2, cat)), $$invalidate(8, id)), $$invalidate(9, item));
    		}
    	}

    	function gallery_item_binding(value) {
    		if ($$self.$$.not_equal(data[cat][index], value)) {
    			data[cat][index] = value;
    			$$invalidate(0, data);
    		}
    	}

    	function gallery_settings_binding(value) {
    		if ($$self.$$.not_equal(data.settings, value)) {
    			data.settings = value;
    			$$invalidate(0, data);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		Markdown,
    		TextEditor,
    		Textarea,
    		Gallery,
    		params,
    		data,
    		cat,
    		id,
    		item,
    		index,
    		collection,
    		fields,
    		loading,
    		title,
    		save,
    		slugifyTitle
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('cat' in $$props) $$invalidate(2, cat = $$props.cat);
    		if ('id' in $$props) $$invalidate(8, id = $$props.id);
    		if ('item' in $$props) $$invalidate(9, item = $$props.item);
    		if ('index' in $$props) $$invalidate(3, index = $$props.index);
    		if ('collection' in $$props) $$invalidate(1, collection = $$props.collection);
    		if ('fields' in $$props) fields = $$props.fields;
    		if ('loading' in $$props) $$invalidate(4, loading = $$props.loading);
    		if ('title' in $$props) $$invalidate(5, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat, id, item, collection*/ 903) {
    			if (params.cat && params.id) {
    				$$invalidate(2, cat = params.cat);
    				$$invalidate(8, id = params.id);
    				$$invalidate(9, item = data[cat].filter(x => x.id == id)[0]);
    				$$invalidate(3, index = data[cat].findIndex(x => x.id == id));

    				if (cat == 'posts') {
    					$$invalidate(1, collection = data.types.filter(x => x.slug == item.type)[0]);
    					$$invalidate(5, title = collection.title);
    				} else {
    					$$invalidate(1, collection = {});
    					$$invalidate(1, collection.fields = [], collection);
    					$$invalidate(5, title = 'category');
    				}
    			}
    		}
    	};

    	return [
    		data,
    		collection,
    		cat,
    		index,
    		loading,
    		title,
    		save,
    		params,
    		id,
    		item,
    		input_input_handler,
    		input_input_handler_1,
    		select_change_handler,
    		input_input_handler_2,
    		textarea_val_binding,
    		markdown_key_binding,
    		markdown_html_binding,
    		texteditor_key_binding,
    		texteditor_html_binding,
    		gallery_key_binding,
    		gallery_item_binding,
    		gallery_settings_binding
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { params: 7, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !('params' in props)) {
    			console_1$4.warn("<Edit> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console_1$4.warn("<Edit> was created without expected prop 'data'");
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

    /* src/routes/EditType.svelte generated by Svelte v3.46.3 */

    const { console: console_1$3 } = globals;
    const file$4 = "src/routes/EditType.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (79:55) {#if loading}
    function create_if_block_1$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$4, 78, 68, 1878);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(79:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (98:4) {#if data.types[index].fields}
    function create_if_block$4(ctx) {
    	let ul;
    	let li;
    	let div3;
    	let div0;
    	let input;
    	let t0;
    	let div2;
    	let div1;
    	let t2;
    	let each_value = /*data*/ ctx[0].types[/*index*/ ctx[1]].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			div3 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "Each collection has a title field";
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control mb-0");
    			input.value = "title";
    			input.readOnly = true;
    			add_location(input, file$4, 103, 23, 2490);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$4, 103, 4, 2471);
    			attr_dev(div1, "class", "description mt-2");
    			add_location(div1, file$4, 104, 23, 2590);
    			attr_dev(div2, "class", "col-8");
    			add_location(div2, file$4, 104, 4, 2571);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$4, 102, 4, 2449);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$4, 101, 4, 2416);
    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$4, 98, 4, 2386);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			append_dev(li, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(ul, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteField, data, index, slugifyFieldTitle*/ 99) {
    				each_value = /*data*/ ctx[0].types[/*index*/ ctx[1]].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		source: "(98:4) {#if data.types[index].fields}",
    		ctx
    	});

    	return block;
    }

    // (111:4) {#each data.types[index].fields as field, i}
    function create_each_block$4(ctx) {
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
    	let option2;
    	let option3;
    	let option4;
    	let t7;
    	let div3;
    	let button;
    	let i_1;
    	let t8;
    	let mounted;
    	let dispose;

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[9].call(input0, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function keyup_handler() {
    		return /*keyup_handler*/ ctx[10](/*i*/ ctx[21]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[11].call(input1, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[12].call(select, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[13](/*field*/ ctx[19]);
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
    			option1.textContent = "Textarea";
    			option2 = element("option");
    			option2.textContent = "Markdown Editor";
    			option3 = element("option");
    			option3.textContent = "Rich Text Editor";
    			option4 = element("option");
    			option4.textContent = "Gallery";
    			t7 = space();
    			div3 = element("div");
    			button = element("button");
    			i_1 = element("i");
    			t8 = space();
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control mb-0");
    			attr_dev(input0, "placeholder", "field name");
    			add_location(input0, file$4, 113, 25, 2823);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$4, 113, 6, 2804);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control mb-0");
    			attr_dev(input1, "placeholder", "field description (optional)");
    			add_location(input1, file$4, 114, 25, 2994);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$4, 114, 6, 2975);
    			option0.__value = "txt";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 117, 6, 3223);
    			option1.__value = "txta";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 118, 6, 3263);
    			option2.__value = "mde";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 119, 6, 3308);
    			option3.__value = "rte";
    			option3.value = option3.__value;
    			add_location(option3, file$4, 120, 6, 3359);
    			option4.__value = "gal";
    			option4.value = option4.__value;
    			add_location(option4, file$4, 121, 6, 3411);
    			attr_dev(select, "class", "form-control mb-0");
    			if (/*field*/ ctx[19].type === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$4, 116, 6, 3156);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file$4, 115, 6, 3130);
    			attr_dev(i_1, "class", "bi bi-trash");
    			add_location(i_1, file$4, 127, 6, 3614);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$4, 126, 6, 3521);
    			attr_dev(div3, "class", "col-2 text-right");
    			add_location(div3, file$4, 125, 6, 3484);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$4, 112, 6, 2780);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$4, 111, 6, 2745);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div4);
    			append_dev(div4, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*field*/ ctx[19].title);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*field*/ ctx[19].description);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			select_option(select, /*field*/ ctx[19].type);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, i_1);
    			append_dev(li, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input0_input_handler),
    					listen_dev(input0, "keyup", keyup_handler, false, false, false),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(select, "change", select_change_handler),
    					listen_dev(button, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, index*/ 3 && input0.value !== /*field*/ ctx[19].title) {
    				set_input_value(input0, /*field*/ ctx[19].title);
    			}

    			if (dirty & /*data, index*/ 3 && input1.value !== /*field*/ ctx[19].description) {
    				set_input_value(input1, /*field*/ ctx[19].description);
    			}

    			if (dirty & /*data, index*/ 3) {
    				select_option(select, /*field*/ ctx[19].type);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(111:4) {#each data.types[index].fields as field, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let span;
    	let t1;
    	let t2_value = /*data*/ ctx[0].types[/*index*/ ctx[1]].title + "";
    	let t2;
    	let t3;
    	let div1;
    	let button0;
    	let t4;
    	let t5;
    	let div7;
    	let div6;
    	let div4;
    	let b;
    	let t7;
    	let div3;
    	let t9;
    	let div5;
    	let button1;
    	let i;
    	let t10;
    	let t11;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[2] && create_if_block_1$3(ctx);
    	let if_block1 = /*data*/ ctx[0].types[/*index*/ ctx[1]].fields && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			span = element("span");
    			span.textContent = "Edit Post Type:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			if (if_block0) if_block0.c();
    			t4 = text("  Save");
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			b = element("b");
    			b.textContent = "Fields";
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "Fields in this Collection";
    			t9 = space();
    			div5 = element("div");
    			button1 = element("button");
    			i = element("i");
    			t10 = text(" Add Field");
    			t11 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "medium-hide");
    			add_location(span, file$4, 75, 26, 1692);
    			attr_dev(h4, "class", "text-truncate");
    			add_location(h4, file$4, 75, 0, 1666);
    			attr_dev(div0, "class", "col-9");
    			add_location(div0, file$4, 74, 0, 1646);
    			attr_dev(button0, "class", "btn btn-dark btn-add");
    			add_location(button0, file$4, 78, 0, 1810);
    			attr_dev(div1, "class", "col-3 text-right");
    			add_location(div1, file$4, 77, 0, 1779);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$4, 73, 0, 1621);
    			add_location(b, file$4, 88, 4, 2076);
    			attr_dev(div3, "class", "description");
    			add_location(div3, file$4, 89, 4, 2094);
    			attr_dev(div4, "class", "col-6");
    			add_location(div4, file$4, 87, 2, 2052);
    			attr_dev(i, "class", "bi bi-plus-circle");
    			add_location(i, file$4, 92, 83, 2276);
    			attr_dev(button1, "class", "btn btn-outline-dark btn-add float-right");
    			add_location(button1, file$4, 92, 4, 2197);
    			attr_dev(div5, "class", "col-6 text-right");
    			add_location(div5, file$4, 91, 2, 2162);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$4, 86, 0, 2032);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$4, 82, 0, 2007);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, span);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(button0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, b);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, button1);
    			append_dev(button1, i);
    			append_dev(button1, t10);
    			append_dev(div7, t11);
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
    			if (dirty & /*data, index*/ 3 && t2_value !== (t2_value = /*data*/ ctx[0].types[/*index*/ ctx[1]].title + "")) set_data_dev(t2, t2_value);

    			if (/*loading*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(button0, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*data*/ ctx[0].types[/*index*/ ctx[1]].fields) {
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
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div7);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('EditType', slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = 'types';
    	let id = false;
    	let item = false;
    	let index = false;
    	let collection = false;
    	let fields = {};
    	let title = '';
    	let loading = false;

    	function save() {
    		$$invalidate(2, loading = true);
    		let opts = {};
    		opts.path = 'data.json';
    		opts.type = 'json';
    		opts.data = data;

    		call_api('api/save', opts).then(function (res) {
    			if (res.ok) {
    				console.log('Saved');
    				$$invalidate(2, loading = false);
    			} else {
    				console.log('Error saving');

    				setTimeout(
    					function () {
    						$$invalidate(2, loading = false);
    					},
    					1000
    				);
    			}
    		});
    	}

    	function addField() {
    		let newField = {};
    		newField.title = '';
    		newField.description = '';
    		newField.type = 'txt';
    		data.types[index].fields.push(newField);
    		$$invalidate(0, data);
    	}

    	function deleteField(title) {
    		let result = confirm("Are you sure you want to delete this field?");

    		if (result) {
    			$$invalidate(0, data.types[index].fields = data.types[index].fields.filter(x => x.title !== title), data);
    			$$invalidate(0, data);
    		}
    	}

    	function slugifyFieldTitle(i) {
    		let slug = data.types[index].fields[i].title.toString().toLowerCase().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '_').replace(/^-+/, '').replace(/-+$/, ''); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data.types[index].fields[i].title = slug, data);
    		$$invalidate(0, data);
    	}

    	const writable_props = ['params', 'data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<EditType> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler(each_value, i) {
    		each_value[i].title = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, id));
    	}

    	const keyup_handler = i => slugifyFieldTitle(i);

    	function input1_input_handler(each_value, i) {
    		each_value[i].description = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, id));
    	}

    	function select_change_handler(each_value, i) {
    		each_value[i].type = select_value(this);
    		$$invalidate(0, data);
    		((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, id));
    	}

    	const click_handler = field => deleteField(field.title);

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		params,
    		data,
    		cat,
    		id,
    		item,
    		index,
    		collection,
    		fields,
    		title,
    		loading,
    		save,
    		addField,
    		deleteField,
    		slugifyFieldTitle
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('cat' in $$props) cat = $$props.cat;
    		if ('id' in $$props) $$invalidate(8, id = $$props.id);
    		if ('item' in $$props) item = $$props.item;
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('collection' in $$props) collection = $$props.collection;
    		if ('fields' in $$props) fields = $$props.fields;
    		if ('title' in $$props) title = $$props.title;
    		if ('loading' in $$props) $$invalidate(2, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, id*/ 385) {
    			if (params.id) {
    				$$invalidate(8, id = params.id);
    				item = data.types.filter(x => x.id == id)[0];
    				$$invalidate(1, index = data.types.findIndex(x => x.id == id));
    			}
    		}
    	};

    	return [
    		data,
    		index,
    		loading,
    		save,
    		addField,
    		deleteField,
    		slugifyFieldTitle,
    		params,
    		id,
    		input0_input_handler,
    		keyup_handler,
    		input1_input_handler,
    		select_change_handler,
    		click_handler
    	];
    }

    class EditType extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 7, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditType",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !('params' in props)) {
    			console_1$3.warn("<EditType> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console_1$3.warn("<EditType> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<EditType>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditType>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<EditType>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<EditType>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function flip(node, { from, to }, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
        const dx = (from.left + from.width * ox / to.width) - (to.left + ox);
        const dy = (from.top + from.height * oy / to.height) - (to.top + oy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
            easing,
            css: (t, u) => {
                const x = u * dx;
                const y = u * dy;
                const sx = t + u * from.width / to.width;
                const sy = t + u * from.height / to.height;
                return `transform: ${transform} translate(${x}px, ${y}px) scale(${sx}, ${sy});`;
            }
        };
    }

    // external events
    const FINALIZE_EVENT_NAME = "finalize";
    const CONSIDER_EVENT_NAME = "consider";

    /**
     * @typedef {Object} Info
     * @property {string} trigger
     * @property {string} id
     * @property {string} source
     * @param {Node} el
     * @param {Array} items
     * @param {Info} info
     */
    function dispatchFinalizeEvent(el, items, info) {
        el.dispatchEvent(
            new CustomEvent(FINALIZE_EVENT_NAME, {
                detail: {items, info}
            })
        );
    }

    /**
     * Dispatches a consider event
     * @param {Node} el
     * @param {Array} items
     * @param {Info} info
     */
    function dispatchConsiderEvent(el, items, info) {
        el.dispatchEvent(
            new CustomEvent(CONSIDER_EVENT_NAME, {
                detail: {items, info}
            })
        );
    }

    // internal events
    const DRAGGED_ENTERED_EVENT_NAME = "draggedEntered";
    const DRAGGED_LEFT_EVENT_NAME = "draggedLeft";
    const DRAGGED_OVER_INDEX_EVENT_NAME = "draggedOverIndex";
    const DRAGGED_LEFT_DOCUMENT_EVENT_NAME = "draggedLeftDocument";

    const DRAGGED_LEFT_TYPES = {
        LEFT_FOR_ANOTHER: "leftForAnother",
        OUTSIDE_OF_ANY: "outsideOfAny"
    };

    function dispatchDraggedElementEnteredContainer(containerEl, indexObj, draggedEl) {
        containerEl.dispatchEvent(
            new CustomEvent(DRAGGED_ENTERED_EVENT_NAME, {
                detail: {indexObj, draggedEl}
            })
        );
    }

    /**
     * @param containerEl - the dropzone the element left
     * @param draggedEl - the dragged element
     * @param theOtherDz - the new dropzone the element entered
     */
    function dispatchDraggedElementLeftContainerForAnother(containerEl, draggedEl, theOtherDz) {
        containerEl.dispatchEvent(
            new CustomEvent(DRAGGED_LEFT_EVENT_NAME, {
                detail: {draggedEl, type: DRAGGED_LEFT_TYPES.LEFT_FOR_ANOTHER, theOtherDz}
            })
        );
    }

    function dispatchDraggedElementLeftContainerForNone(containerEl, draggedEl) {
        containerEl.dispatchEvent(
            new CustomEvent(DRAGGED_LEFT_EVENT_NAME, {
                detail: {draggedEl, type: DRAGGED_LEFT_TYPES.OUTSIDE_OF_ANY}
            })
        );
    }
    function dispatchDraggedElementIsOverIndex(containerEl, indexObj, draggedEl) {
        containerEl.dispatchEvent(
            new CustomEvent(DRAGGED_OVER_INDEX_EVENT_NAME, {
                detail: {indexObj, draggedEl}
            })
        );
    }
    function dispatchDraggedLeftDocument(draggedEl) {
        window.dispatchEvent(
            new CustomEvent(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, {
                detail: {draggedEl}
            })
        );
    }

    const TRIGGERS = {
        DRAG_STARTED: "dragStarted",
        DRAGGED_ENTERED: DRAGGED_ENTERED_EVENT_NAME,
        DRAGGED_ENTERED_ANOTHER: "dragEnteredAnother",
        DRAGGED_OVER_INDEX: DRAGGED_OVER_INDEX_EVENT_NAME,
        DRAGGED_LEFT: DRAGGED_LEFT_EVENT_NAME,
        DRAGGED_LEFT_ALL: "draggedLeftAll",
        DROPPED_INTO_ZONE: "droppedIntoZone",
        DROPPED_INTO_ANOTHER: "droppedIntoAnother",
        DROPPED_OUTSIDE_OF_ANY: "droppedOutsideOfAny",
        DRAG_STOPPED: "dragStopped"
    };

    const SOURCES = {
        POINTER: "pointer",
        KEYBOARD: "keyboard"
    };

    const SHADOW_ITEM_MARKER_PROPERTY_NAME = "isDndShadowItem";
    const SHADOW_ELEMENT_ATTRIBUTE_NAME = "data-is-dnd-shadow-item";
    const SHADOW_PLACEHOLDER_ITEM_ID = "id:dnd-shadow-placeholder-0000";
    const DRAGGED_ELEMENT_ID = "dnd-action-dragged-el";

    let ITEM_ID_KEY = "id";
    let activeDndZoneCount = 0;
    function incrementActiveDropZoneCount() {
        activeDndZoneCount++;
    }
    function decrementActiveDropZoneCount() {
        if (activeDndZoneCount === 0) {
            throw new Error("Bug! trying to decrement when there are no dropzones");
        }
        activeDndZoneCount--;
    }

    const isOnServer = typeof window === "undefined";

    // This is based off https://stackoverflow.com/questions/27745438/how-to-compute-getboundingclientrect-without-considering-transforms/57876601#57876601
    // It removes the transforms that are potentially applied by the flip animations
    /**
     * Gets the bounding rect but removes transforms (ex: flip animation)
     * @param {HTMLElement} el
     * @return {{top: number, left: number, bottom: number, right: number}}
     */
    function getBoundingRectNoTransforms(el) {
        let ta;
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const tx = style.transform;

        if (tx) {
            let sx, sy, dx, dy;
            if (tx.startsWith("matrix3d(")) {
                ta = tx.slice(9, -1).split(/, /);
                sx = +ta[0];
                sy = +ta[5];
                dx = +ta[12];
                dy = +ta[13];
            } else if (tx.startsWith("matrix(")) {
                ta = tx.slice(7, -1).split(/, /);
                sx = +ta[0];
                sy = +ta[3];
                dx = +ta[4];
                dy = +ta[5];
            } else {
                return rect;
            }

            const to = style.transformOrigin;
            const x = rect.x - dx - (1 - sx) * parseFloat(to);
            const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(" ") + 1));
            const w = sx ? rect.width / sx : el.offsetWidth;
            const h = sy ? rect.height / sy : el.offsetHeight;
            return {
                x: x,
                y: y,
                width: w,
                height: h,
                top: y,
                right: x + w,
                bottom: y + h,
                left: x
            };
        } else {
            return rect;
        }
    }

    /**
     * Gets the absolute bounding rect (accounts for the window's scroll position and removes transforms)
     * @param {HTMLElement} el
     * @return {{top: number, left: number, bottom: number, right: number}}
     */
    function getAbsoluteRectNoTransforms(el) {
        const rect = getBoundingRectNoTransforms(el);
        return {
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX
        };
    }

    /**
     * Gets the absolute bounding rect (accounts for the window's scroll position)
     * @param {HTMLElement} el
     * @return {{top: number, left: number, bottom: number, right: number}}
     */
    function getAbsoluteRect(el) {
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX
        };
    }

    /**
     * finds the center :)
     * @typedef {Object} Rect
     * @property {number} top
     * @property {number} bottom
     * @property {number} left
     * @property {number} right
     * @param {Rect} rect
     * @return {{x: number, y: number}}
     */
    function findCenter(rect) {
        return {
            x: (rect.left + rect.right) / 2,
            y: (rect.top + rect.bottom) / 2
        };
    }

    /**
     * @typedef {Object} Point
     * @property {number} x
     * @property {number} y
     * @param {Point} pointA
     * @param {Point} pointB
     * @return {number}
     */
    function calcDistance(pointA, pointB) {
        return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    }

    /**
     * @param {Point} point
     * @param {Rect} rect
     * @return {boolean|boolean}
     */
    function isPointInsideRect(point, rect) {
        return point.y <= rect.bottom && point.y >= rect.top && point.x >= rect.left && point.x <= rect.right;
    }

    /**
     * find the absolute coordinates of the center of a dom element
     * @param el {HTMLElement}
     * @returns {{x: number, y: number}}
     */
    function findCenterOfElement(el) {
        return findCenter(getAbsoluteRect(el));
    }

    /**
     * @param {HTMLElement} elA
     * @param {HTMLElement} elB
     * @return {boolean}
     */
    function isCenterOfAInsideB(elA, elB) {
        const centerOfA = findCenterOfElement(elA);
        const rectOfB = getAbsoluteRectNoTransforms(elB);
        return isPointInsideRect(centerOfA, rectOfB);
    }

    /**
     * @param {HTMLElement|ChildNode} elA
     * @param {HTMLElement|ChildNode} elB
     * @return {number}
     */
    function calcDistanceBetweenCenters(elA, elB) {
        const centerOfA = findCenterOfElement(elA);
        const centerOfB = findCenterOfElement(elB);
        return calcDistance(centerOfA, centerOfB);
    }

    /**
     * @param {HTMLElement} el - the element to check
     * @returns {boolean} - true if the element in its entirety is off screen including the scrollable area (the normal dom events look at the mouse rather than the element)
     */
    function isElementOffDocument(el) {
        const rect = getAbsoluteRect(el);
        return rect.right < 0 || rect.left > document.documentElement.scrollWidth || rect.bottom < 0 || rect.top > document.documentElement.scrollHeight;
    }

    /**
     * If the point is inside the element returns its distances from the sides, otherwise returns null
     * @param {Point} point
     * @param {HTMLElement} el
     * @return {null|{top: number, left: number, bottom: number, right: number}}
     */
    function calcInnerDistancesBetweenPointAndSidesOfElement(point, el) {
        const rect = getAbsoluteRect(el);
        if (!isPointInsideRect(point, rect)) {
            return null;
        }
        return {
            top: point.y - rect.top,
            bottom: rect.bottom - point.y,
            left: point.x - rect.left,
            // TODO - figure out what is so special about right (why the rect is too big)
            right: Math.min(rect.right, document.documentElement.clientWidth) - point.x
        };
    }

    let dzToShadowIndexToRect;

    /**
     * Resets the cache that allows for smarter "would be index" resolution. Should be called after every drag operation
     */
    function resetIndexesCache() {
        dzToShadowIndexToRect = new Map();
    }
    resetIndexesCache();

    /**
     * Resets the cache that allows for smarter "would be index" resolution for a specific dropzone, should be called after the zone was scrolled
     * @param {HTMLElement} dz
     */
    function resetIndexesCacheForDz(dz) {
        dzToShadowIndexToRect.delete(dz);
    }

    /**
     * Caches the coordinates of the shadow element when it's in a certain index in a certain dropzone.
     * Helpful in order to determine "would be index" more effectively
     * @param {HTMLElement} dz
     * @return {number} - the shadow element index
     */
    function cacheShadowRect(dz) {
        const shadowElIndex = Array.from(dz.children).findIndex(child => child.getAttribute(SHADOW_ELEMENT_ATTRIBUTE_NAME));
        if (shadowElIndex >= 0) {
            if (!dzToShadowIndexToRect.has(dz)) {
                dzToShadowIndexToRect.set(dz, new Map());
            }
            dzToShadowIndexToRect.get(dz).set(shadowElIndex, getAbsoluteRectNoTransforms(dz.children[shadowElIndex]));
            return shadowElIndex;
        }
        return undefined;
    }

    /**
     * @typedef {Object} Index
     * @property {number} index - the would be index
     * @property {boolean} isProximityBased - false if the element is actually over the index, true if it is not over it but this index is the closest
     */
    /**
     * Find the index for the dragged element in the list it is dragged over
     * @param {HTMLElement} floatingAboveEl
     * @param {HTMLElement} collectionBelowEl
     * @returns {Index|null} -  if the element is over the container the Index object otherwise null
     */
    function findWouldBeIndex(floatingAboveEl, collectionBelowEl) {
        if (!isCenterOfAInsideB(floatingAboveEl, collectionBelowEl)) {
            return null;
        }
        const children = collectionBelowEl.children;
        // the container is empty, floating element should be the first
        if (children.length === 0) {
            return {index: 0, isProximityBased: true};
        }
        const shadowElIndex = cacheShadowRect(collectionBelowEl);

        // the search could be more efficient but keeping it simple for now
        // a possible improvement: pass in the lastIndex it was found in and check there first, then expand from there
        for (let i = 0; i < children.length; i++) {
            if (isCenterOfAInsideB(floatingAboveEl, children[i])) {
                const cachedShadowRect = dzToShadowIndexToRect.has(collectionBelowEl) && dzToShadowIndexToRect.get(collectionBelowEl).get(i);
                if (cachedShadowRect) {
                    if (!isPointInsideRect(findCenterOfElement(floatingAboveEl), cachedShadowRect)) {
                        return {index: shadowElIndex, isProximityBased: false};
                    }
                }
                return {index: i, isProximityBased: false};
            }
        }
        // this can happen if there is space around the children so the floating element has
        //entered the container but not any of the children, in this case we will find the nearest child
        let minDistanceSoFar = Number.MAX_VALUE;
        let indexOfMin = undefined;
        // we are checking all of them because we don't know whether we are dealing with a horizontal or vertical container and where the floating element entered from
        for (let i = 0; i < children.length; i++) {
            const distance = calcDistanceBetweenCenters(floatingAboveEl, children[i]);
            if (distance < minDistanceSoFar) {
                minDistanceSoFar = distance;
                indexOfMin = i;
            }
        }
        return {index: indexOfMin, isProximityBased: true};
    }

    const SCROLL_ZONE_PX = 25;

    function makeScroller() {
        let scrollingInfo;
        function resetScrolling() {
            scrollingInfo = {directionObj: undefined, stepPx: 0};
        }
        resetScrolling();
        // directionObj {x: 0|1|-1, y:0|1|-1} - 1 means down in y and right in x
        function scrollContainer(containerEl) {
            const {directionObj, stepPx} = scrollingInfo;
            if (directionObj) {
                containerEl.scrollBy(directionObj.x * stepPx, directionObj.y * stepPx);
                window.requestAnimationFrame(() => scrollContainer(containerEl));
            }
        }
        function calcScrollStepPx(distancePx) {
            return SCROLL_ZONE_PX - distancePx;
        }

        /**
         * If the pointer is next to the sides of the element to scroll, will trigger scrolling
         * Can be called repeatedly with updated pointer and elementToScroll values without issues
         * @return {boolean} - true if scrolling was needed
         */
        function scrollIfNeeded(pointer, elementToScroll) {
            if (!elementToScroll) {
                return false;
            }
            const distances = calcInnerDistancesBetweenPointAndSidesOfElement(pointer, elementToScroll);
            if (distances === null) {
                resetScrolling();
                return false;
            }
            const isAlreadyScrolling = !!scrollingInfo.directionObj;
            let [scrollingVertically, scrollingHorizontally] = [false, false];
            // vertical
            if (elementToScroll.scrollHeight > elementToScroll.clientHeight) {
                if (distances.bottom < SCROLL_ZONE_PX) {
                    scrollingVertically = true;
                    scrollingInfo.directionObj = {x: 0, y: 1};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.bottom);
                } else if (distances.top < SCROLL_ZONE_PX) {
                    scrollingVertically = true;
                    scrollingInfo.directionObj = {x: 0, y: -1};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.top);
                }
                if (!isAlreadyScrolling && scrollingVertically) {
                    scrollContainer(elementToScroll);
                    return true;
                }
            }
            // horizontal
            if (elementToScroll.scrollWidth > elementToScroll.clientWidth) {
                if (distances.right < SCROLL_ZONE_PX) {
                    scrollingHorizontally = true;
                    scrollingInfo.directionObj = {x: 1, y: 0};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.right);
                } else if (distances.left < SCROLL_ZONE_PX) {
                    scrollingHorizontally = true;
                    scrollingInfo.directionObj = {x: -1, y: 0};
                    scrollingInfo.stepPx = calcScrollStepPx(distances.left);
                }
                if (!isAlreadyScrolling && scrollingHorizontally) {
                    scrollContainer(elementToScroll);
                    return true;
                }
            }
            resetScrolling();
            return false;
        }

        return {
            scrollIfNeeded,
            resetScrolling
        };
    }

    /**
     * @param {Object} object
     * @return {string}
     */
    function toString(object) {
        return JSON.stringify(object, null, 2);
    }

    /**
     * Finds the depth of the given node in the DOM tree
     * @param {HTMLElement} node
     * @return {number} - the depth of the node
     */
    function getDepth(node) {
        if (!node) {
            throw new Error("cannot get depth of a falsy node");
        }
        return _getDepth(node, 0);
    }
    function _getDepth(node, countSoFar = 0) {
        if (!node.parentElement) {
            return countSoFar - 1;
        }
        return _getDepth(node.parentElement, countSoFar + 1);
    }

    /**
     * A simple util to shallow compare objects quickly, it doesn't validate the arguments so pass objects in
     * @param {Object} objA
     * @param {Object} objB
     * @return {boolean} - true if objA and objB are shallow equal
     */
    function areObjectsShallowEqual(objA, objB) {
        if (Object.keys(objA).length !== Object.keys(objB).length) {
            return false;
        }
        for (const keyA in objA) {
            if (!{}.hasOwnProperty.call(objB, keyA) || objB[keyA] !== objA[keyA]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Shallow compares two arrays
     * @param arrA
     * @param arrB
     * @return {boolean} - whether the arrays are shallow equal
     */
    function areArraysShallowEqualSameOrder(arrA, arrB) {
        if (arrA.length !== arrB.length) {
            return false;
        }
        for (let i = 0; i < arrA.length; i++) {
            if (arrA[i] !== arrB[i]) {
                return false;
            }
        }
        return true;
    }

    const INTERVAL_MS$1 = 200;
    const TOLERANCE_PX = 10;
    const {scrollIfNeeded: scrollIfNeeded$1, resetScrolling: resetScrolling$1} = makeScroller();
    let next$1;

    /**
     * Tracks the dragged elements and performs the side effects when it is dragged over a drop zone (basically dispatching custom-events scrolling)
     * @param {Set<HTMLElement>} dropZones
     * @param {HTMLElement} draggedEl
     * @param {number} [intervalMs = INTERVAL_MS]
     */
    function observe(draggedEl, dropZones, intervalMs = INTERVAL_MS$1) {
        // initialization
        let lastDropZoneFound;
        let lastIndexFound;
        let lastIsDraggedInADropZone = false;
        let lastCentrePositionOfDragged;
        // We are sorting to make sure that in case of nested zones of the same type the one "on top" is considered first
        const dropZonesFromDeepToShallow = Array.from(dropZones).sort((dz1, dz2) => getDepth(dz2) - getDepth(dz1));

        /**
         * The main function in this module. Tracks where everything is/ should be a take the actions
         */
        function andNow() {
            const currentCenterOfDragged = findCenterOfElement(draggedEl);
            const scrolled = scrollIfNeeded$1(currentCenterOfDragged, lastDropZoneFound);
            // we only want to make a new decision after the element was moved a bit to prevent flickering
            if (
                !scrolled &&
                lastCentrePositionOfDragged &&
                Math.abs(lastCentrePositionOfDragged.x - currentCenterOfDragged.x) < TOLERANCE_PX &&
                Math.abs(lastCentrePositionOfDragged.y - currentCenterOfDragged.y) < TOLERANCE_PX
            ) {
                next$1 = window.setTimeout(andNow, intervalMs);
                return;
            }
            if (isElementOffDocument(draggedEl)) {
                dispatchDraggedLeftDocument(draggedEl);
                return;
            }

            lastCentrePositionOfDragged = currentCenterOfDragged;
            // this is a simple algorithm, potential improvement: first look at lastDropZoneFound
            let isDraggedInADropZone = false;
            for (const dz of dropZonesFromDeepToShallow) {
                if (scrolled) resetIndexesCacheForDz(lastDropZoneFound);
                const indexObj = findWouldBeIndex(draggedEl, dz);
                if (indexObj === null) {
                    // it is not inside
                    continue;
                }
                const {index} = indexObj;
                isDraggedInADropZone = true;
                // the element is over a container
                if (dz !== lastDropZoneFound) {
                    lastDropZoneFound && dispatchDraggedElementLeftContainerForAnother(lastDropZoneFound, draggedEl, dz);
                    dispatchDraggedElementEnteredContainer(dz, indexObj, draggedEl);
                    lastDropZoneFound = dz;
                } else if (index !== lastIndexFound) {
                    dispatchDraggedElementIsOverIndex(dz, indexObj, draggedEl);
                    lastIndexFound = index;
                }
                // we handle looping with the 'continue' statement above
                break;
            }
            // the first time the dragged element is not in any dropzone we need to notify the last dropzone it was in
            if (!isDraggedInADropZone && lastIsDraggedInADropZone && lastDropZoneFound) {
                dispatchDraggedElementLeftContainerForNone(lastDropZoneFound, draggedEl);
                lastDropZoneFound = undefined;
                lastIndexFound = undefined;
                lastIsDraggedInADropZone = false;
            } else {
                lastIsDraggedInADropZone = true;
            }
            next$1 = window.setTimeout(andNow, intervalMs);
        }
        andNow();
    }

    // assumption - we can only observe one dragged element at a time, this could be changed in the future
    function unobserve() {
        clearTimeout(next$1);
        resetScrolling$1();
        resetIndexesCache();
    }

    const INTERVAL_MS = 300;
    let mousePosition;

    /**
     * Do not use this! it is visible for testing only until we get over the issue Cypress not triggering the mousemove listeners
     * // TODO - make private (remove export)
     * @param {{clientX: number, clientY: number}} e
     */
    function updateMousePosition(e) {
        const c = e.touches ? e.touches[0] : e;
        mousePosition = {x: c.clientX, y: c.clientY};
    }
    const {scrollIfNeeded, resetScrolling} = makeScroller();
    let next;

    function loop() {
        if (mousePosition) {
            const scrolled = scrollIfNeeded(mousePosition, document.documentElement);
            if (scrolled) resetIndexesCache();
        }
        next = window.setTimeout(loop, INTERVAL_MS);
    }

    /**
     * will start watching the mouse pointer and scroll the window if it goes next to the edges
     */
    function armWindowScroller() {
        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("touchmove", updateMousePosition);
        loop();
    }

    /**
     * will stop watching the mouse pointer and won't scroll the window anymore
     */
    function disarmWindowScroller() {
        window.removeEventListener("mousemove", updateMousePosition);
        window.removeEventListener("touchmove", updateMousePosition);
        mousePosition = undefined;
        window.clearTimeout(next);
        resetScrolling();
    }

    const TRANSITION_DURATION_SECONDS = 0.2;

    /**
     * private helper function - creates a transition string for a property
     * @param {string} property
     * @return {string} - the transition string
     */
    function trs(property) {
        return `${property} ${TRANSITION_DURATION_SECONDS}s ease`;
    }
    /**
     * clones the given element and applies proper styles and transitions to the dragged element
     * @param {HTMLElement} originalElement
     * @param {Point} [positionCenterOnXY]
     * @return {Node} - the cloned, styled element
     */
    function createDraggedElementFrom(originalElement, positionCenterOnXY) {
        const rect = originalElement.getBoundingClientRect();
        const draggedEl = originalElement.cloneNode(true);
        copyStylesFromTo(originalElement, draggedEl);
        draggedEl.id = DRAGGED_ELEMENT_ID;
        draggedEl.style.position = "fixed";
        let elTopPx = rect.top;
        let elLeftPx = rect.left;
        draggedEl.style.top = `${elTopPx}px`;
        draggedEl.style.left = `${elLeftPx}px`;
        if (positionCenterOnXY) {
            const center = findCenter(rect);
            elTopPx -= center.y - positionCenterOnXY.y;
            elLeftPx -= center.x - positionCenterOnXY.x;
            window.setTimeout(() => {
                draggedEl.style.top = `${elTopPx}px`;
                draggedEl.style.left = `${elLeftPx}px`;
            }, 0);
        }
        draggedEl.style.margin = "0";
        // we can't have relative or automatic height and width or it will break the illusion
        draggedEl.style.boxSizing = "border-box";
        draggedEl.style.height = `${rect.height}px`;
        draggedEl.style.width = `${rect.width}px`;
        draggedEl.style.transition = `${trs("top")}, ${trs("left")}, ${trs("background-color")}, ${trs("opacity")}, ${trs("color")} `;
        // this is a workaround for a strange browser bug that causes the right border to disappear when all the transitions are added at the same time
        window.setTimeout(() => (draggedEl.style.transition += `, ${trs("width")}, ${trs("height")}`), 0);
        draggedEl.style.zIndex = "9999";
        draggedEl.style.cursor = "grabbing";

        return draggedEl;
    }

    /**
     * styles the dragged element to a 'dropped' state
     * @param {HTMLElement} draggedEl
     */
    function moveDraggedElementToWasDroppedState(draggedEl) {
        draggedEl.style.cursor = "grab";
    }

    /**
     * Morphs the dragged element style, maintains the mouse pointer within the element
     * @param {HTMLElement} draggedEl
     * @param {HTMLElement} copyFromEl - the element the dragged element should look like, typically the shadow element
     * @param {number} currentMouseX
     * @param {number} currentMouseY
     * @param {function} transformDraggedElement - function to transform the dragged element, does nothing by default.
     */
    function morphDraggedElementToBeLike(draggedEl, copyFromEl, currentMouseX, currentMouseY, transformDraggedElement) {
        const newRect = copyFromEl.getBoundingClientRect();
        const draggedElRect = draggedEl.getBoundingClientRect();
        const widthChange = newRect.width - draggedElRect.width;
        const heightChange = newRect.height - draggedElRect.height;
        if (widthChange || heightChange) {
            const relativeDistanceOfMousePointerFromDraggedSides = {
                left: (currentMouseX - draggedElRect.left) / draggedElRect.width,
                top: (currentMouseY - draggedElRect.top) / draggedElRect.height
            };
            draggedEl.style.height = `${newRect.height}px`;
            draggedEl.style.width = `${newRect.width}px`;
            draggedEl.style.left = `${parseFloat(draggedEl.style.left) - relativeDistanceOfMousePointerFromDraggedSides.left * widthChange}px`;
            draggedEl.style.top = `${parseFloat(draggedEl.style.top) - relativeDistanceOfMousePointerFromDraggedSides.top * heightChange}px`;
        }

        /// other properties
        copyStylesFromTo(copyFromEl, draggedEl);
        transformDraggedElement();
    }

    /**
     * @param {HTMLElement} copyFromEl
     * @param {HTMLElement} copyToEl
     */
    function copyStylesFromTo(copyFromEl, copyToEl) {
        const computedStyle = window.getComputedStyle(copyFromEl);
        Array.from(computedStyle)
            .filter(
                s =>
                    s.startsWith("background") ||
                    s.startsWith("padding") ||
                    s.startsWith("font") ||
                    s.startsWith("text") ||
                    s.startsWith("align") ||
                    s.startsWith("justify") ||
                    s.startsWith("display") ||
                    s.startsWith("flex") ||
                    s.startsWith("border") ||
                    s === "opacity" ||
                    s === "color" ||
                    s === "list-style-type"
            )
            .forEach(s => copyToEl.style.setProperty(s, computedStyle.getPropertyValue(s), computedStyle.getPropertyPriority(s)));
    }

    /**
     * makes the element compatible with being draggable
     * @param {HTMLElement} draggableEl
     * @param {boolean} dragDisabled
     */
    function styleDraggable(draggableEl, dragDisabled) {
        draggableEl.draggable = false;
        draggableEl.ondragstart = () => false;
        if (!dragDisabled) {
            draggableEl.style.userSelect = "none";
            draggableEl.style.WebkitUserSelect = "none";
            draggableEl.style.cursor = "grab";
        } else {
            draggableEl.style.userSelect = "";
            draggableEl.style.WebkitUserSelect = "";
            draggableEl.style.cursor = "";
        }
    }

    /**
     * Hides the provided element so that it can stay in the dom without interrupting
     * @param {HTMLElement} dragTarget
     */
    function hideOriginalDragTarget(dragTarget) {
        dragTarget.style.display = "none";
        dragTarget.style.position = "fixed";
        dragTarget.style.zIndex = "-5";
    }

    /**
     * styles the shadow element
     * @param {HTMLElement} shadowEl
     */
    function decorateShadowEl(shadowEl) {
        shadowEl.style.visibility = "hidden";
        shadowEl.setAttribute(SHADOW_ELEMENT_ATTRIBUTE_NAME, "true");
    }

    /**
     * undo the styles the shadow element
     * @param {HTMLElement} shadowEl
     */
    function unDecorateShadowElement(shadowEl) {
        shadowEl.style.visibility = "";
        shadowEl.removeAttribute(SHADOW_ELEMENT_ATTRIBUTE_NAME);
    }

    /**
     * will mark the given dropzones as visually active
     * @param {Array<HTMLElement>} dropZones
     * @param {Function} getStyles - maps a dropzone to a styles object (so the styles can be removed)
     * @param {Function} getClasses - maps a dropzone to a classList
     */
    function styleActiveDropZones(dropZones, getStyles = () => {}, getClasses = () => []) {
        dropZones.forEach(dz => {
            const styles = getStyles(dz);
            Object.keys(styles).forEach(style => {
                dz.style[style] = styles[style];
            });
            getClasses(dz).forEach(c => dz.classList.add(c));
        });
    }

    /**
     * will remove the 'active' styling from given dropzones
     * @param {Array<HTMLElement>} dropZones
     * @param {Function} getStyles - maps a dropzone to a styles object
     * @param {Function} getClasses - maps a dropzone to a classList
     */
    function styleInactiveDropZones(dropZones, getStyles = () => {}, getClasses = () => []) {
        dropZones.forEach(dz => {
            const styles = getStyles(dz);
            Object.keys(styles).forEach(style => {
                dz.style[style] = "";
            });
            getClasses(dz).forEach(c => dz.classList.contains(c) && dz.classList.remove(c));
        });
    }

    /**
     * will prevent the provided element from shrinking by setting its minWidth and minHeight to the current width and height values
     * @param {HTMLElement} el
     * @return {function(): void} - run this function to undo the operation and restore the original values
     */
    function preventShrinking(el) {
        const originalMinHeight = el.style.minHeight;
        el.style.minHeight = window.getComputedStyle(el).getPropertyValue("height");
        const originalMinWidth = el.style.minWidth;
        el.style.minWidth = window.getComputedStyle(el).getPropertyValue("width");
        return function undo() {
            el.style.minHeight = originalMinHeight;
            el.style.minWidth = originalMinWidth;
        };
    }

    const DEFAULT_DROP_ZONE_TYPE$1 = "--any--";
    const MIN_OBSERVATION_INTERVAL_MS = 100;
    const MIN_MOVEMENT_BEFORE_DRAG_START_PX = 3;
    const DEFAULT_DROP_TARGET_STYLE$1 = {
        outline: "rgba(255, 255, 102, 0.7) solid 2px"
    };

    let originalDragTarget;
    let draggedEl;
    let draggedElData;
    let draggedElType;
    let originDropZone;
    let originIndex;
    let shadowElData;
    let shadowElDropZone;
    let dragStartMousePosition;
    let currentMousePosition;
    let isWorkingOnPreviousDrag = false;
    let finalizingPreviousDrag = false;
    let unlockOriginDzMinDimensions;
    let isDraggedOutsideOfAnyDz = false;

    // a map from type to a set of drop-zones
    const typeToDropZones$1 = new Map();
    // important - this is needed because otherwise the config that would be used for everyone is the config of the element that created the event listeners
    const dzToConfig$1 = new Map();
    // this is needed in order to be able to cleanup old listeners and avoid stale closures issues (as the listener is defined within each zone)
    const elToMouseDownListener = new WeakMap();

    /* drop-zones registration management */
    function registerDropZone$1(dropZoneEl, type) {
        if (!typeToDropZones$1.has(type)) {
            typeToDropZones$1.set(type, new Set());
        }
        if (!typeToDropZones$1.get(type).has(dropZoneEl)) {
            typeToDropZones$1.get(type).add(dropZoneEl);
            incrementActiveDropZoneCount();
        }
    }
    function unregisterDropZone$1(dropZoneEl, type) {
        typeToDropZones$1.get(type).delete(dropZoneEl);
        decrementActiveDropZoneCount();
        if (typeToDropZones$1.get(type).size === 0) {
            typeToDropZones$1.delete(type);
        }
    }

    /* functions to manage observing the dragged element and trigger custom drag-events */
    function watchDraggedElement() {
        armWindowScroller();
        const dropZones = typeToDropZones$1.get(draggedElType);
        for (const dz of dropZones) {
            dz.addEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
            dz.addEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
            dz.addEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
        }
        window.addEventListener(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, handleDrop$1);
        // it is important that we don't have an interval that is faster than the flip duration because it can cause elements to jump bach and forth
        const observationIntervalMs = Math.max(
            MIN_OBSERVATION_INTERVAL_MS,
            ...Array.from(dropZones.keys()).map(dz => dzToConfig$1.get(dz).dropAnimationDurationMs)
        );
        observe(draggedEl, dropZones, observationIntervalMs * 1.07);
    }
    function unWatchDraggedElement() {
        disarmWindowScroller();
        const dropZones = typeToDropZones$1.get(draggedElType);
        for (const dz of dropZones) {
            dz.removeEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
            dz.removeEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
            dz.removeEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
        }
        window.removeEventListener(DRAGGED_LEFT_DOCUMENT_EVENT_NAME, handleDrop$1);
        unobserve();
    }

    // finds the initial placeholder that is placed there on drag start
    function findShadowPlaceHolderIdx(items) {
        return items.findIndex(item => item[ITEM_ID_KEY] === SHADOW_PLACEHOLDER_ITEM_ID);
    }
    function findShadowElementIdx(items) {
        // checking that the id is not the placeholder's for Dragula like usecases
        return items.findIndex(item => !!item[SHADOW_ITEM_MARKER_PROPERTY_NAME] && item[ITEM_ID_KEY] !== SHADOW_PLACEHOLDER_ITEM_ID);
    }

    /* custom drag-events handlers */
    function handleDraggedEntered(e) {
        let {items, dropFromOthersDisabled} = dzToConfig$1.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone) {
            return;
        }
        isDraggedOutsideOfAnyDz = false;
        // this deals with another race condition. in rare occasions (super rapid operations) the list hasn't updated yet
        items = items.filter(item => item[ITEM_ID_KEY] !== shadowElData[ITEM_ID_KEY]);

        if (originDropZone !== e.currentTarget) {
            const originZoneItems = dzToConfig$1.get(originDropZone).items;
            const newOriginZoneItems = originZoneItems.filter(item => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
            dispatchConsiderEvent(originDropZone, newOriginZoneItems, {
                trigger: TRIGGERS.DRAGGED_ENTERED_ANOTHER,
                id: draggedElData[ITEM_ID_KEY],
                source: SOURCES.POINTER
            });
        } else {
            const shadowPlaceHolderIdx = findShadowPlaceHolderIdx(items);
            if (shadowPlaceHolderIdx !== -1) {
                items.splice(shadowPlaceHolderIdx, 1);
            }
        }

        const {index, isProximityBased} = e.detail.indexObj;
        const shadowElIdx = isProximityBased && index === e.currentTarget.children.length - 1 ? index + 1 : index;
        shadowElDropZone = e.currentTarget;
        items.splice(shadowElIdx, 0, shadowElData);
        dispatchConsiderEvent(e.currentTarget, items, {trigger: TRIGGERS.DRAGGED_ENTERED, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
    }

    function handleDraggedLeft(e) {
        // dealing with a rare race condition on extremely rapid clicking and dropping
        if (!isWorkingOnPreviousDrag) return;
        const {items, dropFromOthersDisabled} = dzToConfig$1.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone && e.currentTarget !== shadowElDropZone) {
            return;
        }
        const shadowElIdx = findShadowElementIdx(items);
        const shadowItem = items.splice(shadowElIdx, 1)[0];
        shadowElDropZone = undefined;
        const {type, theOtherDz} = e.detail;
        if (
            type === DRAGGED_LEFT_TYPES.OUTSIDE_OF_ANY ||
            (type === DRAGGED_LEFT_TYPES.LEFT_FOR_ANOTHER && theOtherDz !== originDropZone && dzToConfig$1.get(theOtherDz).dropFromOthersDisabled)
        ) {
            isDraggedOutsideOfAnyDz = true;
            shadowElDropZone = originDropZone;
            const originZoneItems = dzToConfig$1.get(originDropZone).items;
            originZoneItems.splice(originIndex, 0, shadowItem);
            dispatchConsiderEvent(originDropZone, originZoneItems, {
                trigger: TRIGGERS.DRAGGED_LEFT_ALL,
                id: draggedElData[ITEM_ID_KEY],
                source: SOURCES.POINTER
            });
        }
        // for the origin dz, when the dragged is outside of any, this will be fired in addition to the previous. this is for simplicity
        dispatchConsiderEvent(e.currentTarget, items, {
            trigger: TRIGGERS.DRAGGED_LEFT,
            id: draggedElData[ITEM_ID_KEY],
            source: SOURCES.POINTER
        });
    }
    function handleDraggedIsOverIndex(e) {
        const {items, dropFromOthersDisabled} = dzToConfig$1.get(e.currentTarget);
        if (dropFromOthersDisabled && e.currentTarget !== originDropZone) {
            return;
        }
        isDraggedOutsideOfAnyDz = false;
        const {index} = e.detail.indexObj;
        const shadowElIdx = findShadowElementIdx(items);
        items.splice(shadowElIdx, 1);
        items.splice(index, 0, shadowElData);
        dispatchConsiderEvent(e.currentTarget, items, {trigger: TRIGGERS.DRAGGED_OVER_INDEX, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});
    }

    // Global mouse/touch-events handlers
    function handleMouseMove(e) {
        e.preventDefault();
        const c = e.touches ? e.touches[0] : e;
        currentMousePosition = {x: c.clientX, y: c.clientY};
        draggedEl.style.transform = `translate3d(${currentMousePosition.x - dragStartMousePosition.x}px, ${
        currentMousePosition.y - dragStartMousePosition.y
    }px, 0)`;
    }

    function handleDrop$1() {
        finalizingPreviousDrag = true;
        // cleanup
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleMouseMove);
        window.removeEventListener("mouseup", handleDrop$1);
        window.removeEventListener("touchend", handleDrop$1);
        unWatchDraggedElement();
        moveDraggedElementToWasDroppedState(draggedEl);

        if (!shadowElDropZone) {
            shadowElDropZone = originDropZone;
        }
        let {items, type} = dzToConfig$1.get(shadowElDropZone);
        styleInactiveDropZones(
            typeToDropZones$1.get(type),
            dz => dzToConfig$1.get(dz).dropTargetStyle,
            dz => dzToConfig$1.get(dz).dropTargetClasses
        );
        let shadowElIdx = findShadowElementIdx(items);
        // the handler might remove the shadow element, ex: dragula like copy on drag
        if (shadowElIdx === -1) shadowElIdx = originIndex;
        items = items.map(item => (item[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? draggedElData : item));
        function finalizeWithinZone() {
            unlockOriginDzMinDimensions();
            dispatchFinalizeEvent(shadowElDropZone, items, {
                trigger: isDraggedOutsideOfAnyDz ? TRIGGERS.DROPPED_OUTSIDE_OF_ANY : TRIGGERS.DROPPED_INTO_ZONE,
                id: draggedElData[ITEM_ID_KEY],
                source: SOURCES.POINTER
            });
            if (shadowElDropZone !== originDropZone) {
                // letting the origin drop zone know the element was permanently taken away
                dispatchFinalizeEvent(originDropZone, dzToConfig$1.get(originDropZone).items, {
                    trigger: TRIGGERS.DROPPED_INTO_ANOTHER,
                    id: draggedElData[ITEM_ID_KEY],
                    source: SOURCES.POINTER
                });
            }
            unDecorateShadowElement(shadowElDropZone.children[shadowElIdx]);
            cleanupPostDrop();
        }
        animateDraggedToFinalPosition(shadowElIdx, finalizeWithinZone);
    }

    // helper function for handleDrop
    function animateDraggedToFinalPosition(shadowElIdx, callback) {
        const shadowElRect = getBoundingRectNoTransforms(shadowElDropZone.children[shadowElIdx]);
        const newTransform = {
            x: shadowElRect.left - parseFloat(draggedEl.style.left),
            y: shadowElRect.top - parseFloat(draggedEl.style.top)
        };
        const {dropAnimationDurationMs} = dzToConfig$1.get(shadowElDropZone);
        const transition = `transform ${dropAnimationDurationMs}ms ease`;
        draggedEl.style.transition = draggedEl.style.transition ? draggedEl.style.transition + "," + transition : transition;
        draggedEl.style.transform = `translate3d(${newTransform.x}px, ${newTransform.y}px, 0)`;
        window.setTimeout(callback, dropAnimationDurationMs);
    }

    /* cleanup */
    function cleanupPostDrop() {
        draggedEl.remove();
        originalDragTarget.remove();
        draggedEl = undefined;
        originalDragTarget = undefined;
        draggedElData = undefined;
        draggedElType = undefined;
        originDropZone = undefined;
        originIndex = undefined;
        shadowElData = undefined;
        shadowElDropZone = undefined;
        dragStartMousePosition = undefined;
        currentMousePosition = undefined;
        isWorkingOnPreviousDrag = false;
        finalizingPreviousDrag = false;
        unlockOriginDzMinDimensions = undefined;
        isDraggedOutsideOfAnyDz = false;
    }

    function dndzone$2(node, options) {
        const config = {
            items: undefined,
            type: undefined,
            flipDurationMs: 0,
            dragDisabled: false,
            morphDisabled: false,
            dropFromOthersDisabled: false,
            dropTargetStyle: DEFAULT_DROP_TARGET_STYLE$1,
            dropTargetClasses: [],
            transformDraggedElement: () => {},
            centreDraggedOnCursor: false
        };
        let elToIdx = new Map();

        function addMaybeListeners() {
            window.addEventListener("mousemove", handleMouseMoveMaybeDragStart, {passive: false});
            window.addEventListener("touchmove", handleMouseMoveMaybeDragStart, {passive: false, capture: false});
            window.addEventListener("mouseup", handleFalseAlarm, {passive: false});
            window.addEventListener("touchend", handleFalseAlarm, {passive: false});
        }
        function removeMaybeListeners() {
            window.removeEventListener("mousemove", handleMouseMoveMaybeDragStart);
            window.removeEventListener("touchmove", handleMouseMoveMaybeDragStart);
            window.removeEventListener("mouseup", handleFalseAlarm);
            window.removeEventListener("touchend", handleFalseAlarm);
        }
        function handleFalseAlarm() {
            removeMaybeListeners();
            originalDragTarget = undefined;
            dragStartMousePosition = undefined;
            currentMousePosition = undefined;
        }

        function handleMouseMoveMaybeDragStart(e) {
            e.preventDefault();
            const c = e.touches ? e.touches[0] : e;
            currentMousePosition = {x: c.clientX, y: c.clientY};
            if (
                Math.abs(currentMousePosition.x - dragStartMousePosition.x) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX ||
                Math.abs(currentMousePosition.y - dragStartMousePosition.y) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX
            ) {
                removeMaybeListeners();
                handleDragStart();
            }
        }
        function handleMouseDown(e) {
            // on safari clicking on a select element doesn't fire mouseup at the end of the click and in general this makes more sense
            if (e.target !== e.currentTarget && (e.target.value !== undefined || e.target.isContentEditable)) {
                return;
            }
            // prevents responding to any button but left click which equals 0 (which is falsy)
            if (e.button) {
                return;
            }
            if (isWorkingOnPreviousDrag) {
                return;
            }
            e.stopPropagation();
            const c = e.touches ? e.touches[0] : e;
            dragStartMousePosition = {x: c.clientX, y: c.clientY};
            currentMousePosition = {...dragStartMousePosition};
            originalDragTarget = e.currentTarget;
            addMaybeListeners();
        }

        function handleDragStart() {
            isWorkingOnPreviousDrag = true;

            // initialising globals
            const currentIdx = elToIdx.get(originalDragTarget);
            originIndex = currentIdx;
            originDropZone = originalDragTarget.parentElement;
            /** @type {ShadowRoot | HTMLDocument} */
            const rootNode = originDropZone.getRootNode();
            const originDropZoneRoot = rootNode.body || rootNode;
            const {items, type, centreDraggedOnCursor} = config;
            draggedElData = {...items[currentIdx]};
            draggedElType = type;
            shadowElData = {...draggedElData, [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true};
            // The initial shadow element. We need a different id at first in order to avoid conflicts and timing issues
            const placeHolderElData = {...shadowElData, [ITEM_ID_KEY]: SHADOW_PLACEHOLDER_ITEM_ID};

            // creating the draggable element
            draggedEl = createDraggedElementFrom(originalDragTarget, centreDraggedOnCursor && currentMousePosition);
            // We will keep the original dom node in the dom because touch events keep firing on it, we want to re-add it after the framework removes it
            function keepOriginalElementInDom() {
                if (!draggedEl.parentElement) {
                    originDropZoneRoot.appendChild(draggedEl);
                    // to prevent the outline from disappearing
                    draggedEl.focus();
                    watchDraggedElement();
                    hideOriginalDragTarget(originalDragTarget);
                    originDropZoneRoot.appendChild(originalDragTarget);
                } else {
                    window.requestAnimationFrame(keepOriginalElementInDom);
                }
            }
            window.requestAnimationFrame(keepOriginalElementInDom);

            styleActiveDropZones(
                Array.from(typeToDropZones$1.get(config.type)).filter(dz => dz === originDropZone || !dzToConfig$1.get(dz).dropFromOthersDisabled),
                dz => dzToConfig$1.get(dz).dropTargetStyle,
                dz => dzToConfig$1.get(dz).dropTargetClasses
            );

            // removing the original element by removing its data entry
            items.splice(currentIdx, 1, placeHolderElData);
            unlockOriginDzMinDimensions = preventShrinking(originDropZone);

            dispatchConsiderEvent(originDropZone, items, {trigger: TRIGGERS.DRAG_STARTED, id: draggedElData[ITEM_ID_KEY], source: SOURCES.POINTER});

            // handing over to global handlers - starting to watch the element
            window.addEventListener("mousemove", handleMouseMove, {passive: false});
            window.addEventListener("touchmove", handleMouseMove, {passive: false, capture: false});
            window.addEventListener("mouseup", handleDrop$1, {passive: false});
            window.addEventListener("touchend", handleDrop$1, {passive: false});
        }

        function configure({
            items = undefined,
            flipDurationMs: dropAnimationDurationMs = 0,
            type: newType = DEFAULT_DROP_ZONE_TYPE$1,
            dragDisabled = false,
            morphDisabled = false,
            dropFromOthersDisabled = false,
            dropTargetStyle = DEFAULT_DROP_TARGET_STYLE$1,
            dropTargetClasses = [],
            transformDraggedElement = () => {},
            centreDraggedOnCursor = false
        }) {
            config.dropAnimationDurationMs = dropAnimationDurationMs;
            if (config.type && newType !== config.type) {
                unregisterDropZone$1(node, config.type);
            }
            config.type = newType;
            registerDropZone$1(node, newType);

            config.items = [...items];
            config.dragDisabled = dragDisabled;
            config.morphDisabled = morphDisabled;
            config.transformDraggedElement = transformDraggedElement;
            config.centreDraggedOnCursor = centreDraggedOnCursor;

            // realtime update for dropTargetStyle
            if (
                isWorkingOnPreviousDrag &&
                !finalizingPreviousDrag &&
                (!areObjectsShallowEqual(dropTargetStyle, config.dropTargetStyle) ||
                    !areArraysShallowEqualSameOrder(dropTargetClasses, config.dropTargetClasses))
            ) {
                styleInactiveDropZones(
                    [node],
                    () => config.dropTargetStyle,
                    () => dropTargetClasses
                );
                styleActiveDropZones(
                    [node],
                    () => dropTargetStyle,
                    () => dropTargetClasses
                );
            }
            config.dropTargetStyle = dropTargetStyle;
            config.dropTargetClasses = [...dropTargetClasses];

            // realtime update for dropFromOthersDisabled
            function getConfigProp(dz, propName) {
                return dzToConfig$1.get(dz) ? dzToConfig$1.get(dz)[propName] : config[propName];
            }
            if (isWorkingOnPreviousDrag && config.dropFromOthersDisabled !== dropFromOthersDisabled) {
                if (dropFromOthersDisabled) {
                    styleInactiveDropZones(
                        [node],
                        dz => getConfigProp(dz, "dropTargetStyle"),
                        dz => getConfigProp(dz, "dropTargetClasses")
                    );
                } else {
                    styleActiveDropZones(
                        [node],
                        dz => getConfigProp(dz, "dropTargetStyle"),
                        dz => getConfigProp(dz, "dropTargetClasses")
                    );
                }
            }
            config.dropFromOthersDisabled = dropFromOthersDisabled;

            dzToConfig$1.set(node, config);
            const shadowElIdx = findShadowElementIdx(config.items);
            for (let idx = 0; idx < node.children.length; idx++) {
                const draggableEl = node.children[idx];
                styleDraggable(draggableEl, dragDisabled);
                if (idx === shadowElIdx) {
                    if (!morphDisabled) {
                        morphDraggedElementToBeLike(draggedEl, draggableEl, currentMousePosition.x, currentMousePosition.y, () =>
                            config.transformDraggedElement(draggedEl, draggedElData, idx)
                        );
                    }
                    decorateShadowEl(draggableEl);
                    continue;
                }
                draggableEl.removeEventListener("mousedown", elToMouseDownListener.get(draggableEl));
                draggableEl.removeEventListener("touchstart", elToMouseDownListener.get(draggableEl));
                if (!dragDisabled) {
                    draggableEl.addEventListener("mousedown", handleMouseDown);
                    draggableEl.addEventListener("touchstart", handleMouseDown);
                    elToMouseDownListener.set(draggableEl, handleMouseDown);
                }
                // updating the idx
                elToIdx.set(draggableEl, idx);
            }
        }
        configure(options);

        return {
            update: newOptions => {
                configure(newOptions);
            },
            destroy: () => {
                unregisterDropZone$1(node, config.type);
                dzToConfig$1.delete(node);
            }
        };
    }

    const INSTRUCTION_IDs$1 = {
        DND_ZONE_ACTIVE: "dnd-zone-active",
        DND_ZONE_DRAG_DISABLED: "dnd-zone-drag-disabled"
    };
    const ID_TO_INSTRUCTION = {
        [INSTRUCTION_IDs$1.DND_ZONE_ACTIVE]: "Tab to one the items and press space-bar or enter to start dragging it",
        [INSTRUCTION_IDs$1.DND_ZONE_DRAG_DISABLED]: "This is a disabled drag and drop list"
    };

    const ALERT_DIV_ID = "dnd-action-aria-alert";
    let alertsDiv;

    function initAriaOnBrowser() {
        // setting the dynamic alerts
        alertsDiv = document.createElement("div");
        (function initAlertsDiv() {
            alertsDiv.id = ALERT_DIV_ID;
            // tab index -1 makes the alert be read twice on chrome for some reason
            //alertsDiv.tabIndex = -1;
            alertsDiv.style.position = "fixed";
            alertsDiv.style.bottom = "0";
            alertsDiv.style.left = "0";
            alertsDiv.style.zIndex = "-5";
            alertsDiv.style.opacity = "0";
            alertsDiv.style.height = "0";
            alertsDiv.style.width = "0";
            alertsDiv.setAttribute("role", "alert");
        })();
        document.body.prepend(alertsDiv);

        // setting the instructions
        Object.entries(ID_TO_INSTRUCTION).forEach(([id, txt]) => document.body.prepend(instructionToHiddenDiv(id, txt)));
    }

    /**
     * Initializes the static aria instructions so they can be attached to zones
     * @return {{DND_ZONE_ACTIVE: string, DND_ZONE_DRAG_DISABLED: string} | null} - the IDs for static aria instruction (to be used via aria-describedby) or null on the server
     */
    function initAria() {
        if (isOnServer) return null;
        if (document.readyState === "complete") {
            initAriaOnBrowser();
        } else {
            window.addEventListener("DOMContentLoaded", initAriaOnBrowser);
        }
        return {...INSTRUCTION_IDs$1};
    }
    function instructionToHiddenDiv(id, txt) {
        const div = document.createElement("div");
        div.id = id;
        div.innerHTML = `<p>${txt}</p>`;
        div.style.display = "none";
        div.style.position = "fixed";
        div.style.zIndex = "-5";
        return div;
    }

    /**
     * Will make the screen reader alert the provided text to the user
     * @param {string} txt
     */
    function alertToScreenReader(txt) {
        alertsDiv.innerHTML = "";
        const alertText = document.createTextNode(txt);
        alertsDiv.appendChild(alertText);
        // this is needed for Safari
        alertsDiv.style.display = "none";
        alertsDiv.style.display = "inline";
    }

    const DEFAULT_DROP_ZONE_TYPE = "--any--";
    const DEFAULT_DROP_TARGET_STYLE = {
        outline: "rgba(255, 255, 102, 0.7) solid 2px"
    };

    let isDragging = false;
    let draggedItemType;
    let focusedDz;
    let focusedDzLabel = "";
    let focusedItem;
    let focusedItemId;
    let focusedItemLabel = "";
    const allDragTargets = new WeakSet();
    const elToKeyDownListeners = new WeakMap();
    const elToFocusListeners = new WeakMap();
    const dzToHandles = new Map();
    const dzToConfig = new Map();
    const typeToDropZones = new Map();

    /* TODO (potentially)
     * what's the deal with the black border of voice-reader not following focus?
     * maybe keep focus on the last dragged item upon drop?
     */

    const INSTRUCTION_IDs = initAria();

    /* drop-zones registration management */
    function registerDropZone(dropZoneEl, type) {
        if (typeToDropZones.size === 0) {
            window.addEventListener("keydown", globalKeyDownHandler);
            window.addEventListener("click", globalClickHandler);
        }
        if (!typeToDropZones.has(type)) {
            typeToDropZones.set(type, new Set());
        }
        if (!typeToDropZones.get(type).has(dropZoneEl)) {
            typeToDropZones.get(type).add(dropZoneEl);
            incrementActiveDropZoneCount();
        }
    }
    function unregisterDropZone(dropZoneEl, type) {
        if (focusedDz === dropZoneEl) {
            handleDrop();
        }
        typeToDropZones.get(type).delete(dropZoneEl);
        decrementActiveDropZoneCount();
        if (typeToDropZones.get(type).size === 0) {
            typeToDropZones.delete(type);
        }
        if (typeToDropZones.size === 0) {
            window.removeEventListener("keydown", globalKeyDownHandler);
            window.removeEventListener("click", globalClickHandler);
        }
    }

    function globalKeyDownHandler(e) {
        if (!isDragging) return;
        switch (e.key) {
            case "Escape": {
                handleDrop();
                break;
            }
        }
    }

    function globalClickHandler() {
        if (!isDragging) return;
        if (!allDragTargets.has(document.activeElement)) {
            handleDrop();
        }
    }

    function handleZoneFocus(e) {
        if (!isDragging) return;
        const newlyFocusedDz = e.currentTarget;
        if (newlyFocusedDz === focusedDz) return;

        focusedDzLabel = newlyFocusedDz.getAttribute("aria-label") || "";
        const {items: originItems} = dzToConfig.get(focusedDz);
        const originItem = originItems.find(item => item[ITEM_ID_KEY] === focusedItemId);
        const originIdx = originItems.indexOf(originItem);
        const itemToMove = originItems.splice(originIdx, 1)[0];
        const {items: targetItems, autoAriaDisabled} = dzToConfig.get(newlyFocusedDz);
        if (
            newlyFocusedDz.getBoundingClientRect().top < focusedDz.getBoundingClientRect().top ||
            newlyFocusedDz.getBoundingClientRect().left < focusedDz.getBoundingClientRect().left
        ) {
            targetItems.push(itemToMove);
            if (!autoAriaDisabled) {
                alertToScreenReader(`Moved item ${focusedItemLabel} to the end of the list ${focusedDzLabel}`);
            }
        } else {
            targetItems.unshift(itemToMove);
            if (!autoAriaDisabled) {
                alertToScreenReader(`Moved item ${focusedItemLabel} to the beginning of the list ${focusedDzLabel}`);
            }
        }
        const dzFrom = focusedDz;
        dispatchFinalizeEvent(dzFrom, originItems, {trigger: TRIGGERS.DROPPED_INTO_ANOTHER, id: focusedItemId, source: SOURCES.KEYBOARD});
        dispatchFinalizeEvent(newlyFocusedDz, targetItems, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
        focusedDz = newlyFocusedDz;
    }

    function triggerAllDzsUpdate() {
        dzToHandles.forEach(({update}, dz) => update(dzToConfig.get(dz)));
    }

    function handleDrop(dispatchConsider = true) {
        if (!dzToConfig.get(focusedDz).autoAriaDisabled) {
            alertToScreenReader(`Stopped dragging item ${focusedItemLabel}`);
        }
        if (allDragTargets.has(document.activeElement)) {
            document.activeElement.blur();
        }
        if (dispatchConsider) {
            dispatchConsiderEvent(focusedDz, dzToConfig.get(focusedDz).items, {
                trigger: TRIGGERS.DRAG_STOPPED,
                id: focusedItemId,
                source: SOURCES.KEYBOARD
            });
        }
        styleInactiveDropZones(
            typeToDropZones.get(draggedItemType),
            dz => dzToConfig.get(dz).dropTargetStyle,
            dz => dzToConfig.get(dz).dropTargetClasses
        );
        focusedItem = null;
        focusedItemId = null;
        focusedItemLabel = "";
        draggedItemType = null;
        focusedDz = null;
        focusedDzLabel = "";
        isDragging = false;
        triggerAllDzsUpdate();
    }
    //////
    function dndzone$1(node, options) {
        const config = {
            items: undefined,
            type: undefined,
            dragDisabled: false,
            zoneTabIndex: 0,
            dropFromOthersDisabled: false,
            dropTargetStyle: DEFAULT_DROP_TARGET_STYLE,
            dropTargetClasses: [],
            autoAriaDisabled: false
        };

        function swap(arr, i, j) {
            if (arr.length <= 1) return;
            arr.splice(j, 1, arr.splice(i, 1, arr[j])[0]);
        }

        function handleKeyDown(e) {
            switch (e.key) {
                case "Enter":
                case " ": {
                    // we don't want to affect nested input elements or clickable elements
                    if ((e.target.disabled !== undefined || e.target.href || e.target.isContentEditable) && !allDragTargets.has(e.target)) {
                        return;
                    }
                    e.preventDefault(); // preventing scrolling on spacebar
                    e.stopPropagation();
                    if (isDragging) {
                        // TODO - should this trigger a drop? only here or in general (as in when hitting space or enter outside of any zone)?
                        handleDrop();
                    } else {
                        // drag start
                        handleDragStart(e);
                    }
                    break;
                }
                case "ArrowDown":
                case "ArrowRight": {
                    if (!isDragging) return;
                    e.preventDefault(); // prevent scrolling
                    e.stopPropagation();
                    const {items} = dzToConfig.get(node);
                    const children = Array.from(node.children);
                    const idx = children.indexOf(e.currentTarget);
                    if (idx < children.length - 1) {
                        if (!config.autoAriaDisabled) {
                            alertToScreenReader(`Moved item ${focusedItemLabel} to position ${idx + 2} in the list ${focusedDzLabel}`);
                        }
                        swap(items, idx, idx + 1);
                        dispatchFinalizeEvent(node, items, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
                    }
                    break;
                }
                case "ArrowUp":
                case "ArrowLeft": {
                    if (!isDragging) return;
                    e.preventDefault(); // prevent scrolling
                    e.stopPropagation();
                    const {items} = dzToConfig.get(node);
                    const children = Array.from(node.children);
                    const idx = children.indexOf(e.currentTarget);
                    if (idx > 0) {
                        if (!config.autoAriaDisabled) {
                            alertToScreenReader(`Moved item ${focusedItemLabel} to position ${idx} in the list ${focusedDzLabel}`);
                        }
                        swap(items, idx, idx - 1);
                        dispatchFinalizeEvent(node, items, {trigger: TRIGGERS.DROPPED_INTO_ZONE, id: focusedItemId, source: SOURCES.KEYBOARD});
                    }
                    break;
                }
            }
        }
        function handleDragStart(e) {
            setCurrentFocusedItem(e.currentTarget);
            focusedDz = node;
            draggedItemType = config.type;
            isDragging = true;
            const dropTargets = Array.from(typeToDropZones.get(config.type)).filter(dz => dz === focusedDz || !dzToConfig.get(dz).dropFromOthersDisabled);
            styleActiveDropZones(
                dropTargets,
                dz => dzToConfig.get(dz).dropTargetStyle,
                dz => dzToConfig.get(dz).dropTargetClasses
            );
            if (!config.autoAriaDisabled) {
                let msg = `Started dragging item ${focusedItemLabel}. Use the arrow keys to move it within its list ${focusedDzLabel}`;
                if (dropTargets.length > 1) {
                    msg += `, or tab to another list in order to move the item into it`;
                }
                alertToScreenReader(msg);
            }
            dispatchConsiderEvent(node, dzToConfig.get(node).items, {trigger: TRIGGERS.DRAG_STARTED, id: focusedItemId, source: SOURCES.KEYBOARD});
            triggerAllDzsUpdate();
        }

        function handleClick(e) {
            if (!isDragging) return;
            if (e.currentTarget === focusedItem) return;
            e.stopPropagation();
            handleDrop(false);
            handleDragStart(e);
        }
        function setCurrentFocusedItem(draggableEl) {
            const {items} = dzToConfig.get(node);
            const children = Array.from(node.children);
            const focusedItemIdx = children.indexOf(draggableEl);
            focusedItem = draggableEl;
            focusedItem.tabIndex = 0;
            focusedItemId = items[focusedItemIdx][ITEM_ID_KEY];
            focusedItemLabel = children[focusedItemIdx].getAttribute("aria-label") || "";
        }

        function configure({
            items = [],
            type: newType = DEFAULT_DROP_ZONE_TYPE,
            dragDisabled = false,
            zoneTabIndex = 0,
            dropFromOthersDisabled = false,
            dropTargetStyle = DEFAULT_DROP_TARGET_STYLE,
            dropTargetClasses = [],
            autoAriaDisabled = false
        }) {
            config.items = [...items];
            config.dragDisabled = dragDisabled;
            config.dropFromOthersDisabled = dropFromOthersDisabled;
            config.zoneTabIndex = zoneTabIndex;
            config.dropTargetStyle = dropTargetStyle;
            config.dropTargetClasses = dropTargetClasses;
            config.autoAriaDisabled = autoAriaDisabled;
            if (!autoAriaDisabled) {
                node.setAttribute("aria-disabled", dragDisabled);
                node.setAttribute("role", "list");
                node.setAttribute("aria-describedby", dragDisabled ? INSTRUCTION_IDs.DND_ZONE_DRAG_DISABLED : INSTRUCTION_IDs.DND_ZONE_ACTIVE);
            }
            if (config.type && newType !== config.type) {
                unregisterDropZone(node, config.type);
            }
            config.type = newType;
            registerDropZone(node, newType);
            dzToConfig.set(node, config);

            if (isDragging) {
                node.tabIndex =
                    node === focusedDz ||
                    focusedItem.contains(node) ||
                    config.dropFromOthersDisabled ||
                    (focusedDz && config.type !== dzToConfig.get(focusedDz).type)
                    ? -1
                    : 0;
            } else {
                node.tabIndex = config.zoneTabIndex;
            }

            node.addEventListener("focus", handleZoneFocus);

            for (let i = 0; i < node.children.length; i++) {
                const draggableEl = node.children[i];
                allDragTargets.add(draggableEl);
                draggableEl.tabIndex = isDragging ? -1 : 0;
                if (!autoAriaDisabled) {
                    draggableEl.setAttribute("role", "listitem");
                }
                draggableEl.removeEventListener("keydown", elToKeyDownListeners.get(draggableEl));
                draggableEl.removeEventListener("click", elToFocusListeners.get(draggableEl));
                if (!dragDisabled) {
                    draggableEl.addEventListener("keydown", handleKeyDown);
                    elToKeyDownListeners.set(draggableEl, handleKeyDown);
                    draggableEl.addEventListener("click", handleClick);
                    elToFocusListeners.set(draggableEl, handleClick);
                }
                if (isDragging && config.items[i][ITEM_ID_KEY] === focusedItemId) {
                    // if it is a nested dropzone, it was re-rendered and we need to refresh our pointer
                    focusedItem = draggableEl;
                    focusedItem.tabIndex = 0;
                    // without this the element loses focus if it moves backwards in the list
                    draggableEl.focus();
                }
            }
        }
        configure(options);

        const handles = {
            update: newOptions => {
                configure(newOptions);
            },
            destroy: () => {
                unregisterDropZone(node, config.type);
                dzToConfig.delete(node);
                dzToHandles.delete(node);
            }
        };
        dzToHandles.set(node, handles);
        return handles;
    }

    /**
     * A custom action to turn any container to a dnd zone and all of its direct children to draggables
     * Supports mouse, touch and keyboard interactions.
     * Dispatches two events that the container is expected to react to by modifying its list of items,
     * which will then feed back in to this action via the update function
     *
     * @typedef {object} Options
     * @property {array} items - the list of items that was used to generate the children of the given node (the list used in the #each block
     * @property {string} [type] - the type of the dnd zone. children dragged from here can only be dropped in other zones of the same type, default to a base type
     * @property {number} [flipDurationMs] - if the list animated using flip (recommended), specifies the flip duration such that everything syncs with it without conflict, defaults to zero
     * @property {boolean} [dragDisabled]
     * @property {boolean} [morphDisabled] - whether dragged element should morph to zone dimensions
     * @property {boolean} [dropFromOthersDisabled]
     * @property {number} [zoneTabIndex] - set the tabindex of the list container when not dragging
     * @property {object} [dropTargetStyle]
     * @property {string[]} [dropTargetClasses]
     * @property {function} [transformDraggedElement]
     * @param {HTMLElement} node - the element to enhance
     * @param {Options} options
     * @return {{update: function, destroy: function}}
     */
    function dndzone(node, options) {
        validateOptions(options);
        const pointerZone = dndzone$2(node, options);
        const keyboardZone = dndzone$1(node, options);
        return {
            update: newOptions => {
                validateOptions(newOptions);
                pointerZone.update(newOptions);
                keyboardZone.update(newOptions);
            },
            destroy: () => {
                pointerZone.destroy();
                keyboardZone.destroy();
            }
        };
    }

    function validateOptions(options) {
        /*eslint-disable*/
        const {
            items,
            flipDurationMs,
            type,
            dragDisabled,
            morphDisabled,
            dropFromOthersDisabled,
            zoneTabIndex,
            dropTargetStyle,
            dropTargetClasses,
            transformDraggedElement,
            autoAriaDisabled,
            centreDraggedOnCursor,
            ...rest
        } = options;
        /*eslint-enable*/
        if (Object.keys(rest).length > 0) {
            console.warn(`dndzone will ignore unknown options`, rest);
        }
        if (!items) {
            throw new Error("no 'items' key provided to dndzone");
        }
        const itemWithMissingId = items.find(item => !{}.hasOwnProperty.call(item, ITEM_ID_KEY));
        if (itemWithMissingId) {
            throw new Error(`missing '${ITEM_ID_KEY}' property for item ${toString(itemWithMissingId)}`);
        }
        if (dropTargetClasses && !Array.isArray(dropTargetClasses)) {
            throw new Error(`dropTargetClasses should be an array but instead it is a ${typeof dropTargetClasses}, ${toString(dropTargetClasses)}`);
        }
        if (zoneTabIndex && !isInt(zoneTabIndex)) {
            throw new Error(`zoneTabIndex should be a number but instead it is a ${typeof zoneTabIndex}, ${toString(zoneTabIndex)}`);
        }
    }

    function isInt(value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
    }

    /* src/routes/Categories.svelte generated by Svelte v3.46.3 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/routes/Categories.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (69:2) {#if item.slug !== 'home'}
    function create_if_block_1$2(ctx) {
    	let div;
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*item*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "bi bi-trash");
    			add_location(i, file$3, 70, 83, 1897);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$3, 70, 2, 1816);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$3, 69, 2, 1790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(69:2) {#if item.slug !== 'home'}",
    		ctx
    	});

    	return block;
    }

    // (60:0) {#each items as item(item.id)}
    function create_each_block$3(key_1, ctx) {
    	let li;
    	let div2;
    	let div0;
    	let a1;
    	let t0_value = /*item*/ ctx[11].title + "";
    	let t0;
    	let a0;
    	let a1_href_value;
    	let t1;
    	let div1;
    	let t2;
    	let rect;
    	let stop_animation = noop;
    	let if_block = /*item*/ ctx[11].slug !== 'home' && create_if_block_1$2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			div2 = element("div");
    			div0 = element("div");
    			a1 = element("a");
    			t0 = text(t0_value);
    			a0 = element("a");
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();
    			add_location(a0, file$3, 64, 51, 1712);
    			attr_dev(a1, "href", a1_href_value = "/#/edit/categories/" + /*item*/ ctx[11].id);
    			add_location(a1, file$3, 64, 0, 1661);
    			attr_dev(div0, "class", "col-6 text-truncate d-flex align-items-center");
    			add_location(div0, file$3, 62, 2, 1600);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$3, 67, 2, 1728);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 61, 2, 1580);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$3, 60, 2, 1505);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div2);
    			append_dev(div2, div0);
    			append_dev(div0, a1);
    			append_dev(a1, t0);
    			append_dev(a1, a0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(li, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[11].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*items*/ 1 && a1_href_value !== (a1_href_value = "/#/edit/categories/" + /*item*/ ctx[11].id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (/*item*/ ctx[11].slug !== 'home') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: flipDurationMs$1 });
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(60:0) {#each items as item(item.id)}",
    		ctx
    	});

    	return block;
    }

    // (81:0) {#if addCat}
    function create_if_block$3(ctx) {
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h4;
    	let t1;
    	let button0;
    	let span;
    	let t3;
    	let div2;
    	let b;
    	let t5;
    	let input;
    	let t6;
    	let div1;
    	let t7;
    	let div3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Add Category";
    			t1 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			b = element("b");
    			b.textContent = "Category Name";
    			t5 = space();
    			input = element("input");
    			t6 = space();
    			div1 = element("div");
    			t7 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Add Category";
    			attr_dev(h4, "class", "modal-title");
    			add_location(h4, file$3, 87, 8, 2202);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$3, 89, 10, 2339);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$3, 88, 8, 2252);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$3, 86, 6, 2167);
    			add_location(b, file$3, 94, 6, 2482);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "new-cat");
    			add_location(input, file$3, 95, 6, 2509);
    			attr_dev(div1, "class", "description-sub");
    			add_location(div1, file$3, 96, 10, 2575);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$3, 92, 6, 2450);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$3, 99, 8, 2665);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$3, 98, 6, 2630);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$3, 85, 4, 2133);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$3, 84, 2, 2086);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			add_location(div6, file$3, 83, 0, 2036);
    			attr_dev(div7, "class", "backdrop");
    			add_location(div7, file$3, 81, 0, 2012);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, b);
    			append_dev(div2, t5);
    			append_dev(div2, input);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*click_handler_2*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*saveCat*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(81:0) {#if addCat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let button;
    	let t3;
    	let div3;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let dndzone_action;
    	let t4;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[11].id;
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	let if_block = /*addCat*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Categories";
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Add Category";
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file$3, 49, 0, 1139);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$3, 48, 0, 1119);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$3, 52, 0, 1197);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$3, 51, 0, 1166);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$3, 47, 0, 1094);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$3, 58, 0, 1327);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$3, 56, 0, 1304);
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
    			append_dev(div1, button);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false),
    					action_destroyer(dndzone_action = dndzone.call(null, ul, { items: /*items*/ ctx[0], flipDurationMs: flipDurationMs$1 })),
    					listen_dev(ul, "consider", /*handleDndConsider*/ ctx[2], false, false, false),
    					listen_dev(ul, "finalize", /*handleDndFinalize*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*deleteItem, items*/ 17) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_destroy_block, create_each_block$3, null, get_each_context$3);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items*/ 1) dndzone_action.update.call(null, { items: /*items*/ ctx[0], flipDurationMs: flipDurationMs$1 });

    			if (/*addCat*/ ctx[1]) {
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
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
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

    const flipDurationMs$1 = 300;

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Categories', slots, []);
    	let { data } = $$props;
    	let cat = false;
    	let items = false;
    	let addCat = false;
    	items = data.categories;

    	function handleDndConsider(e) {
    		$$invalidate(0, items = e.detail.items);
    	}

    	function handleDndFinalize(e) {
    		$$invalidate(0, items = e.detail.items);
    		$$invalidate(6, data.categories = items, data);
    		renderData(data); // force re-render
    	}

    	function deleteItem(what, id) {
    		let result = confirm("Are you sure you want to delete this item?");

    		if (result) {
    			$$invalidate(6, data.categories = data.categories.filter(x => x.id !== id), data);
    			$$invalidate(6, data);
    			$$invalidate(0, items = data.categories);
    			renderData(data); // force re-render
    		}
    	}

    	function saveCat() {
    		let val = document.querySelector('#new-cat').value;
    		console.log(val);
    		let newItem = {};
    		newItem.id = Date.now();
    		newItem.title = val;
    		newItem.slug = slugify(val);
    		data.categories.push(newItem);
    		$$invalidate(6, data);
    		$$invalidate(0, items = data.categories);
    		console.log(data.categories);
    		$$invalidate(1, addCat = false);
    	}

    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Categories> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, addCat = true);
    	const click_handler_1 = item => deleteItem(item.id);
    	const click_handler_2 = () => $$invalidate(1, addCat = false);

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(6, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		flip,
    		dndzone,
    		slugify,
    		data,
    		cat,
    		items,
    		addCat,
    		flipDurationMs: flipDurationMs$1,
    		handleDndConsider,
    		handleDndFinalize,
    		deleteItem,
    		saveCat
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(6, data = $$props.data);
    		if ('cat' in $$props) cat = $$props.cat;
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('addCat' in $$props) $$invalidate(1, addCat = $$props.addCat);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		addCat,
    		handleDndConsider,
    		handleDndFinalize,
    		deleteItem,
    		saveCat,
    		data,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Categories extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Categories",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[6] === undefined && !('data' in props)) {
    			console_1$2.warn("<Categories> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Categories>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Categories>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Posts.svelte generated by Svelte v3.46.3 */
    const file$2 = "src/routes/Posts.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (73:86) {:else}
    function create_else_block(ctx) {
    	let t_value = /*item*/ ctx[14].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[14].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(73:86) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:58) {#if item.title==''}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Untitled");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(73:58) {#if item.title==''}",
    		ctx
    	});

    	return block;
    }

    // (68:0) {#each items as item(item.id)}
    function create_each_block_1(key_1, ctx) {
    	let li;
    	let div3;
    	let div0;
    	let a;
    	let a_href_value;
    	let t0;
    	let div2;
    	let div1;
    	let button;
    	let i;
    	let t1;
    	let rect;
    	let stop_animation = noop;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[14].title == '') return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[11](/*item*/ ctx[14]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			div3 = element("div");
    			div0 = element("div");
    			a = element("a");
    			if_block.c();
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button = element("button");
    			i = element("i");
    			t1 = space();
    			attr_dev(a, "href", a_href_value = "/#/edit/posts/" + /*item*/ ctx[14].id);
    			attr_dev(a, "class", "text-truncate");
    			add_location(a, file$2, 72, 2, 1654);
    			attr_dev(div0, "class", "col-6 text-truncate d-flex align-items-center");
    			add_location(div0, file$2, 70, 2, 1591);
    			attr_dev(i, "class", "bi bi-trash");
    			add_location(i, file$2, 78, 88, 1925);
    			attr_dev(button, "class", "btn btn-outline-secondary w-50");
    			add_location(button, file$2, 78, 2, 1839);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$2, 77, 2, 1813);
    			attr_dev(div2, "class", "col-6 text-right");
    			add_location(div2, file$2, 75, 2, 1779);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$2, 69, 2, 1571);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$2, 68, 2, 1496);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div3);
    			append_dev(div3, div0);
    			append_dev(div0, a);
    			if_block.m(a, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(button, i);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(a, null);
    				}
    			}

    			if (dirty & /*items*/ 2 && a_href_value !== (a_href_value = "/#/edit/posts/" + /*item*/ ctx[14].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: flipDurationMs });
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(68:0) {#each items as item(item.id)}",
    		ctx
    	});

    	return block;
    }

    // (90:0) {#if addPost}
    function create_if_block$2(ctx) {
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let h4;
    	let t1;
    	let button;
    	let span;
    	let t3;
    	let div2;
    	let b;
    	let t5;
    	let div1;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0].types;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Add Post";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			b = element("b");
    			b.textContent = "Type of post:";
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h4, "class", "modal-title");
    			add_location(h4, file$2, 96, 8, 2225);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$2, 98, 10, 2358);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$2, 97, 8, 2271);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$2, 95, 6, 2190);
    			add_location(b, file$2, 103, 0, 2496);
    			attr_dev(div1, "class", "list-group list-group-flush");
    			add_location(div1, file$2, 104, 0, 2517);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$2, 101, 6, 2470);
    			attr_dev(div3, "class", "modal-content");
    			add_location(div3, file$2, 94, 4, 2156);
    			attr_dev(div4, "class", "modal-dialog");
    			attr_dev(div4, "role", "document");
    			add_location(div4, file$2, 93, 2, 2109);
    			attr_dev(div5, "class", "modal");
    			attr_dev(div5, "tabindex", "-1");
    			attr_dev(div5, "role", "dialog");
    			add_location(div5, file$2, 92, 0, 2059);
    			attr_dev(div6, "class", "backdrop");
    			add_location(div6, file$2, 90, 0, 2035);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, b);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler_2*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addItem, data*/ 65) {
    				each_value = /*data*/ ctx[0].types;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(90:0) {#if addPost}",
    		ctx
    	});

    	return block;
    }

    // (106:2) {#each data.types as item}
    function create_each_block$2(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[14].title + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[13](/*item*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "list-group-item list-group-item-action text-capitalize");
    			add_location(div, file$2, 106, 2, 2590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[14].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(106:2) {#each data.types as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0_value = /*curCat*/ ctx[2].title + "";
    	let t0;
    	let t1;
    	let div1;
    	let button;
    	let t3;
    	let div3;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let dndzone_action;
    	let t4;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*items*/ ctx[1];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*item*/ ctx[14].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	let if_block = /*addPost*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Add Post";
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file$2, 56, 0, 1128);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$2, 55, 0, 1108);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$2, 59, 0, 1190);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$2, 58, 0, 1159);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$2, 54, 0, 1083);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$2, 66, 0, 1318);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$2, 63, 0, 1294);
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

    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false),
    					action_destroyer(dndzone_action = dndzone.call(null, ul, { items: /*items*/ ctx[1], flipDurationMs })),
    					listen_dev(ul, "consider", /*handleDndConsider*/ ctx[4], false, false, false),
    					listen_dev(ul, "finalize", /*handleDndFinalize*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*curCat*/ 4 && t0_value !== (t0_value = /*curCat*/ ctx[2].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*deleteItem, items*/ 130) {
    				each_value_1 = /*items*/ ctx[1];
    				validate_each_argument(each_value_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, ul, fix_and_destroy_block, create_each_block_1, null, get_each_context_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}

    			if (dndzone_action && is_function(dndzone_action.update) && dirty & /*items*/ 2) dndzone_action.update.call(null, { items: /*items*/ ctx[1], flipDurationMs });

    			if (/*addPost*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
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
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
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

    const flipDurationMs = 300;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Posts', slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let items = false;
    	let curCat = false;
    	let addPost = false;

    	function handleDndConsider(e) {
    		$$invalidate(1, items = e.detail.items);
    	}

    	function handleDndFinalize(e) {
    		$$invalidate(1, items = e.detail.items);

    		// get items not in this cat
    		let nothere = data.posts.filter(x => x.category !== cat);

    		$$invalidate(0, data.posts = items.concat(nothere), data);
    	}

    	function addItem(type) {
    		let newItem = {};
    		newItem.id = Date.now();
    		newItem.title = "";
    		newItem.slug = "";
    		newItem.category = cat;
    		newItem.type = type;
    		data.posts.unshift(newItem);
    		window.location = "/#/edit/posts/" + newItem.id;
    	}

    	function deleteItem(id) {
    		let result = confirm("Are you sure you want to delete this item?");

    		if (result) {
    			$$invalidate(0, data.posts = data.posts.filter(x => x.id !== id), data);
    			$$invalidate(0, data);
    		}
    	}

    	const writable_props = ['params', 'data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Posts> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, addPost = true);
    	const click_handler_1 = item => deleteItem(item.id);
    	const click_handler_2 = () => $$invalidate(3, addPost = false);
    	const click_handler_3 = item => addItem(item.slug);

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(8, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		flip,
    		dndzone,
    		params,
    		data,
    		cat,
    		items,
    		curCat,
    		addPost,
    		flipDurationMs,
    		handleDndConsider,
    		handleDndFinalize,
    		addItem,
    		deleteItem
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(8, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('cat' in $$props) $$invalidate(9, cat = $$props.cat);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    		if ('curCat' in $$props) $$invalidate(2, curCat = $$props.curCat);
    		if ('addPost' in $$props) $$invalidate(3, addPost = $$props.addPost);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat*/ 769) {
    			if (params.cat) {
    				$$invalidate(9, cat = params.cat);
    				$$invalidate(2, curCat = data.categories.filter(x => x.slug == cat)[0]);
    				$$invalidate(1, items = data.posts.filter(x => x.category == cat));
    			}
    		}
    	};

    	return [
    		data,
    		items,
    		curCat,
    		addPost,
    		handleDndConsider,
    		handleDndFinalize,
    		addItem,
    		deleteItem,
    		params,
    		cat,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Posts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 8, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Posts",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[8] === undefined && !('params' in props)) {
    			console.warn("<Posts> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<Posts> was created without expected prop 'data'");
    		}
    	}

    	get params() {
    		throw new Error("<Posts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Posts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Posts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Posts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Settings.svelte generated by Svelte v3.46.3 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$1 = "src/routes/Settings.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	child_ctx[6] = list;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (34:55) {#if loading}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 33, 68, 605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(34:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#each Object.entries(data.settings) as [key, value]}
    function create_each_block$1(ctx) {
    	let b;
    	let t0_value = /*key*/ ctx[4].replaceAll('_', ' ') + "";
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[3].call(input, /*key*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			add_location(b, file$1, 41, 0, 812);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control w-50");
    			add_location(input, file$1, 42, 0, 846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			append_dev(b, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0].settings[/*key*/ ctx[4]]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*key*/ ctx[4].replaceAll('_', ' ') + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data, Object*/ 1 && input.value !== /*data*/ ctx[0].settings[/*key*/ ctx[4]]) {
    				set_input_value(input, /*data*/ ctx[0].settings[/*key*/ ctx[4]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(40:0) {#each Object.entries(data.settings) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let button;
    	let t2;
    	let t3;
    	let div3;
    	let mounted;
    	let dispose;
    	let if_block = /*loading*/ ctx[1] && create_if_block$1(ctx);
    	let each_value = Object.entries(/*data*/ ctx[0].settings);
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
    			h4.textContent = "Settings";
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			if (if_block) if_block.c();
    			t2 = text("  Save");
    			t3 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$1, 30, 0, 481);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$1, 29, 0, 461);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$1, 33, 0, 537);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$1, 32, 0, 506);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$1, 28, 0, 436);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$1, 37, 0, 734);
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
    			append_dev(div1, button);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*save*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loading*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(button, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data, Object*/ 1) {
    				each_value = Object.entries(/*data*/ ctx[0].settings);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { data } = $$props;
    	let loading = false;

    	function save() {
    		$$invalidate(1, loading = true);
    		let opts = {};
    		opts.path = 'data.json';
    		opts.type = 'json';
    		opts.data = data;

    		call_api('api/save', opts).then(function (res) {
    			if (res.ok) {
    				console.log('Saved');
    				$$invalidate(1, loading = false);
    			} else {
    				console.log('Error saving');

    				setTimeout(
    					function () {
    						$$invalidate(1, loading = false);
    					},
    					1000
    				);
    			}
    		});
    	}

    	const writable_props = ['data'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(key) {
    		data.settings[key] = this.value;
    		$$invalidate(0, data);
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data, loading, save });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, loading, save, input_input_handler];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console_1$1.warn("<Settings> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.46.3 */

    function create_fragment$1(ctx) {
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.3 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (118:25) 
    function create_if_block_1(ctx) {
    	let div6;
    	let div3;
    	let div2;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h50;
    	let t2;
    	let div0;
    	let t3;
    	let h51;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let br0;
    	let br1;
    	let t9;
    	let a1;
    	let t11;
    	let a2;
    	let t13;
    	let div5;
    	let div4;
    	let router;
    	let div6_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0].categories;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*data*/ ctx[0].permissions.categories && create_if_block_4(ctx);
    	let if_block1 = /*data*/ ctx[0].permissions.types && create_if_block_3(ctx);
    	let if_block2 = /*data*/ ctx[0].permissions.settings && create_if_block_2(ctx);

    	router = new Router({
    			props: { routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Content";
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			h51 = element("h5");
    			h51.textContent = "Manage";
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t9 = space();
    			a1 = element("a");
    			a1.textContent = "Debug";
    			t11 = space();
    			a2 = element("a");
    			a2.textContent = "Log Out";
    			t13 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(router.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "assets/img/rocketlogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			add_location(img, file, 122, 86, 2771);
    			attr_dev(a0, "href", "/#/");
    			toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			add_location(a0, file, 122, 0, 2685);
    			add_location(h50, file, 127, 0, 2851);
    			attr_dev(div0, "id", "collections-nav");
    			add_location(div0, file, 128, 0, 2868);
    			add_location(h51, file, 140, 0, 3100);
    			add_location(br0, file, 156, 0, 3587);
    			add_location(br1, file, 156, 4, 3591);
    			add_location(a1, file, 157, 0, 3596);
    			attr_dev(a2, "href", "/logout");
    			attr_dev(a2, "id", "logout");
    			add_location(a2, file, 158, 1, 3647);
    			attr_dev(div1, "class", "side-nav");
    			add_location(div1, file, 124, 0, 2826);
    			attr_dev(div2, "class", "side");
    			add_location(div2, file, 120, 0, 2665);
    			attr_dev(div3, "class", "col-md-2");
    			add_location(div3, file, 119, 0, 2642);
    			attr_dev(div4, "class", "main");
    			add_location(div4, file, 166, 0, 3737);
    			attr_dev(div5, "class", "col-md-10");
    			add_location(div5, file, 164, 0, 3712);
    			attr_dev(div6, "class", "row no-gutters page");
    			add_location(div6, file, 118, 0, 2592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, a0);
    			append_dev(a0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h50);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t3);
    			append_dev(div1, h51);
    			append_dev(div1, t5);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t6);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t7);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t8);
    			append_dev(div1, br0);
    			append_dev(div1, br1);
    			append_dev(div1, t9);
    			append_dev(div1, a1);
    			append_dev(div1, t11);
    			append_dev(div1, a2);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			mount_component(router, div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(a1, "click", /*click_handler_5*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 4) {
    				toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			}

    			if (dirty & /*data, current*/ 5) {
    				each_value = /*data*/ ctx[0].categories;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*data*/ ctx[0].permissions.categories) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div1, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*data*/ ctx[0].permissions.types) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div1, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*data*/ ctx[0].permissions.settings) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(div1, t8);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			const router_changes = {};
    			if (dirty & /*routes*/ 2) router_changes.routes = /*routes*/ ctx[1];
    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div6_transition) div6_transition = create_bidirectional_transition(div6, fade, {}, true);
    				div6_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			if (!div6_transition) div6_transition = create_bidirectional_transition(div6, fade, {}, false);
    			div6_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(router);
    			if (detaching && div6_transition) div6_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(118:25) ",
    		ctx
    	});

    	return block;
    }

    // (106:0) {#if loading}
    function create_if_block(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let span;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			if (!src_url_equal(img.src, img_src_value = "assets/img/rocket-planet.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 109, 0, 2396);
    			attr_dev(div0, "class", "clear");
    			add_location(div0, file, 110, 0, 2439);
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file, 112, 2, 2510);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			add_location(div1, file, 111, 0, 2465);
    			attr_dev(div2, "id", "loading");
    			attr_dev(div2, "class", "text-center");
    			add_location(div2, file, 107, 0, 2356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(106:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (131:0) {#each data.categories as item}
    function create_each_block(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[11].title + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*item*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/posts/" + /*item*/ ctx[11].slug);
    			attr_dev(a, "class", "text-truncate");
    			toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[11].title);
    			add_location(a, file, 132, 0, 2929);
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
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[11].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "/#/posts/" + /*item*/ ctx[11].slug)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*current, data*/ 5) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[11].title);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(131:0) {#each data.categories as item}",
    		ctx
    	});

    	return block;
    }

    // (143:0) {#if data.permissions.categories}
    function create_if_block_4(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Categories";
    			attr_dev(a, "href", "/#/categories");
    			toggle_class(a, "selected", /*current*/ ctx[2] === 'categories');
    			add_location(a, file, 143, 0, 3151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_2*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 4) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === 'categories');
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(143:0) {#if data.permissions.categories}",
    		ctx
    	});

    	return block;
    }

    // (148:0) {#if data.permissions.types}
    function create_if_block_3(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Post Types";
    			attr_dev(a, "href", "/#/types");
    			toggle_class(a, "selected", /*current*/ ctx[2] === 'types');
    			add_location(a, file, 148, 0, 3312);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_3*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 4) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === 'types');
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(148:0) {#if data.permissions.types}",
    		ctx
    	});

    	return block;
    }

    // (153:0) {#if data.permissions.settings}
    function create_if_block_2(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "settings";
    			attr_dev(a, "href", "/#/settings");
    			toggle_class(a, "selected", /*current*/ ctx[2] === 'settings');
    			add_location(a, file, 153, 1, 3463);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_4*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 4) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === 'settings');
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(153:0) {#if data.permissions.settings}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link0;
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let link1;
    	let script2;
    	let script2_src_value;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return 0;
    		if (/*routes*/ ctx[1] && /*data*/ ctx[0]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			script0 = element("script");
    			script1 = element("script");
    			link1 = element("link");
    			script2 = element("script");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css");
    			add_location(link0, file, 1, 1, 15);
    			if (!src_url_equal(script0.src, script0_src_value = "https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file, 2, 1, 123);
    			if (!src_url_equal(script1.src, script1_src_value = "https://cdn.jsdelivr.net/npm/@taufik-nurrohman/rich-text-editor@1.3.1/rich-text-editor.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file, 3, 1, 220);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "https://unpkg.com/easymde/dist/easymde.min.css");
    			add_location(link1, file, 4, 1, 335);
    			if (!src_url_equal(script2.src, script2_src_value = "https://unpkg.com/easymde/dist/easymde.min.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file, 5, 1, 414);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, link1);
    			append_dev(document.head, script2);
    			insert_dev(target, t, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			detach_dev(link0);
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(link1);
    			detach_dev(script2);
    			if (detaching) detach_dev(t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let data = false;
    	let showApp = false;
    	let routes = false;
    	let current = false;
    	let loading = true;

    	onMount(async () => {
    		const res = await fetch(config.dataPath);
    		$$invalidate(0, data = await res.json());
    		console.log(data);

    		$$invalidate(1, routes = {
    			// Exact path
    			'/': wrap$1({ component: Home, props: { data } }),
    			'/posts/:cat': wrap$1({ component: Posts, props: { data } }),
    			'/edit/:cat/:id': wrap$1({ component: Edit, props: { data } }),
    			'/types': wrap$1({ component: Types, props: { data } }),
    			'/type/:id': wrap$1({ component: EditType, props: { data } }),
    			'/categories': wrap$1({ component: Categories, props: { data } }),
    			'/settings': wrap$1({ component: Settings, props: { data } }),
    			// Catch-all
    			// This is optional, but if present it must be the last
    			'*': NotFound
    		});

    		setTimeout(
    			function () {
    				$$invalidate(3, loading = false);
    			},
    			500
    		);
    	});

    	// allows force re-rendering
    	window.renderData = function (mydata) {
    		$$invalidate(0, data = mydata);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, current = false);
    	const click_handler_1 = item => $$invalidate(2, current = item.title);
    	const click_handler_2 = () => $$invalidate(2, current = 'categories');
    	const click_handler_3 = () => $$invalidate(2, current = 'types');
    	const click_handler_4 = () => $$invalidate(2, current = 'settings');
    	const click_handler_5 = () => console.log(data);

    	$$self.$capture_state = () => ({
    		fade,
    		onMount,
    		Router,
    		wrap: wrap$1,
    		Home,
    		Types,
    		Edit,
    		EditType,
    		Categories,
    		Posts,
    		Settings,
    		NotFound,
    		data,
    		showApp,
    		routes,
    		current,
    		loading
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('showApp' in $$props) showApp = $$props.showApp;
    		if ('routes' in $$props) $$invalidate(1, routes = $$props.routes);
    		if ('current' in $$props) $$invalidate(2, current = $$props.current);
    		if ('loading' in $$props) $$invalidate(3, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		routes,
    		current,
    		loading,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
