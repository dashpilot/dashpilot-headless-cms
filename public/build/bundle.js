
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
            const d = program.b - t;
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
                loop(now => {
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

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
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

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

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
    function create_if_block(ctx) {
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
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
    		id: create_fragment.name,
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

    function instance($$self, $$props, $$invalidate) {
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

    	Object_1.keys($$props).forEach(key => {
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

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
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

    const file = "src/routes/Home.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(h4, file, 6, 0, 82);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file, 5, 0, 62);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file, 8, 0, 108);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file, 4, 0, 37);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file, 13, 0, 155);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
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

    /* src/routes/List.svelte generated by Svelte v3.31.2 */

    const file$1 = "src/routes/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (124:0) {:else}
    function create_else_block_2(ctx) {
    	let h4;
    	let t_value = /*curCat*/ ctx[2].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			add_location(h4, file$1, 124, 0, 2659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curCat*/ 4 && t_value !== (t_value = /*curCat*/ ctx[2].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(124:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (122:0) {#if cat=='collections'}
    function create_if_block_6(ctx) {
    	let h4;
    	let t_value = /*data*/ ctx[0].settings.collections_label + "";
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			add_location(h4, file$1, 122, 0, 2608);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].settings.collections_label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(122:0) {#if cat=='collections'}",
    		ctx
    	});

    	return block;
    }

    // (137:0) {#if hasCat[0]}
    function create_if_block_5(ctx) {
    	let div1;
    	let div0;
    	let a;
    	let t1;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*data*/ ctx[0].categories;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "All";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "class", "list-group-item list-group-item-action");
    			toggle_class(a, "selected", /*filterBy*/ ctx[4] === "");
    			add_location(a, file$1, 141, 2, 2956);
    			attr_dev(div0, "class", "list-group list-group-flush categories-list");
    			add_location(div0, file$1, 140, 0, 2896);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file$1, 138, 0, 2872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(div0, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filterBy*/ 16) {
    				toggle_class(a, "selected", /*filterBy*/ ctx[4] === "");
    			}

    			if (dirty & /*filterBy, data*/ 17) {
    				each_value_1 = /*data*/ ctx[0].categories;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(137:0) {#if hasCat[0]}",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#each data.categories as cat}
    function create_each_block_1(ctx) {
    	let a;
    	let t_value = /*cat*/ ctx[5].title + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[15](/*cat*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "list-group-item list-group-item-action");
    			toggle_class(a, "selected", /*filterBy*/ ctx[4] === /*cat*/ ctx[5].slug);
    			add_location(a, file$1, 143, 2, 3117);
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
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*cat*/ ctx[5].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*filterBy, data*/ 17) {
    				toggle_class(a, "selected", /*filterBy*/ ctx[4] === /*cat*/ ctx[5].slug);
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(143:2) {#each data.categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (162:2) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let a_href_value;

    	function select_block_type_2(ctx, dirty) {
    		if (/*item*/ ctx[21].title == "") return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			attr_dev(a, "href", a_href_value = "/#/edit/" + /*cat*/ ctx[5] + "/" + /*item*/ ctx[21].id);
    			add_location(a, file$1, 162, 2, 3588);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if_block.m(a, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(a, null);
    				}
    			}

    			if (dirty & /*cat, items*/ 34 && a_href_value !== (a_href_value = "/#/edit/" + /*cat*/ ctx[5] + "/" + /*item*/ ctx[21].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(162:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (160:2) {#if cat == 'collections'}
    function create_if_block_3(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[21].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/collections/" + /*item*/ ctx[21].id);
    			add_location(a, file$1, 160, 2, 3524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[21].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*items*/ 2 && a_href_value !== (a_href_value = "/#/collections/" + /*item*/ ctx[21].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(160:2) {#if cat == 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (163:64) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*item*/ ctx[21].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[21].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(163:64) {:else}",
    		ctx
    	});

    	return block;
    }

    // (163:36) {#if item.title==''}
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(163:36) {#if item.title==''}",
    		ctx
    	});

    	return block;
    }

    // (167:2) {#if cat !== 'collections'}
    function create_if_block_2(ctx) {
    	let div;
    	let button0;
    	let i0;
    	let t;
    	let button1;
    	let i1;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[16](/*item*/ ctx[21]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[17](/*item*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t = space();
    			button1 = element("button");
    			i1 = element("i");
    			attr_dev(i0, "class", "bi bi-caret-down");
    			add_location(i0, file$1, 168, 90, 3873);
    			attr_dev(button0, "class", "btn btn-outline-secondary w-50");
    			add_location(button0, file$1, 168, 2, 3785);
    			attr_dev(i1, "class", "bi bi-trash");
    			add_location(i1, file$1, 169, 88, 4003);
    			attr_dev(button1, "class", "btn btn-outline-secondary w-50");
    			add_location(button1, file$1, 169, 2, 3917);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$1, 167, 0, 3759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, i0);
    			append_dev(div, t);
    			append_dev(div, button1);
    			append_dev(button1, i1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler_2, false, false, false),
    					listen_dev(button1, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(167:2) {#if cat !== 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (156:0) {#each items as item}
    function create_each_block(ctx) {
    	let li;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;

    	function select_block_type_1(ctx, dirty) {
    		if (/*cat*/ ctx[5] == "collections") return create_if_block_3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*cat*/ ctx[5] !== "collections" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			attr_dev(div0, "class", "col-6 text-truncate d-flex align-items-center");
    			add_location(div0, file$1, 158, 2, 3433);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$1, 165, 2, 3698);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$1, 157, 2, 3413);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$1, 156, 2, 3382);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div2);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
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

    			if (/*cat*/ ctx[5] !== "collections") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(156:0) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (183:0) {#if addColl}
    function create_if_block$1(ctx) {
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h4;
    	let t0;
    	let t1_value = /*data*/ ctx[0].settings.collections_label_singular + "";
    	let t1;
    	let t2;
    	let button0;
    	let span;
    	let t4;
    	let div2;
    	let t5;
    	let b;
    	let t6_value = /*data*/ ctx[0].settings.collections_label_singular + "";
    	let t6;
    	let t7;
    	let t8;
    	let input;
    	let t9;
    	let div1;
    	let t10;
    	let div3;
    	let button1;
    	let t11;
    	let t12_value = /*data*/ ctx[0].settings.collections_label_singular + "";
    	let t12;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[7] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text("Add ");
    			t1 = text(t1_value);
    			t2 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t4 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t5 = space();
    			b = element("b");
    			t6 = text(t6_value);
    			t7 = text(" Name");
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div1 = element("div");
    			t10 = space();
    			div3 = element("div");
    			button1 = element("button");
    			t11 = text("Add ");
    			t12 = text(t12_value);
    			attr_dev(h4, "class", "modal-title");
    			add_location(h4, file$1, 189, 8, 4324);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 191, 10, 4495);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$1, 190, 8, 4408);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$1, 188, 6, 4289);
    			add_location(b, file$1, 201, 2, 4701);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "coll-title");
    			add_location(input, file$1, 202, 6, 4762);
    			attr_dev(div1, "class", "description-sub");
    			add_location(div1, file$1, 203, 10, 4831);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$1, 194, 6, 4607);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$1, 206, 8, 4921);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$1, 205, 6, 4886);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$1, 187, 4, 4255);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$1, 186, 2, 4208);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			add_location(div6, file$1, 185, 0, 4158);
    			attr_dev(div7, "class", "backdrop");
    			add_location(div7, file$1, 183, 0, 4134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(button0, span);
    			append_dev(div4, t4);
    			append_dev(div4, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t5);
    			append_dev(div2, b);
    			append_dev(b, t6);
    			append_dev(b, t7);
    			append_dev(div2, t8);
    			append_dev(div2, input);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(button1, t11);
    			append_dev(button1, t12);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*click_handler_4*/ ctx[18], false, false, false),
    					listen_dev(button1, "click", /*saveCollection*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].settings.collections_label_singular + "")) set_data_dev(t1, t1_value);

    			if (/*error*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div2, t5);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = /*data*/ ctx[0].settings.collections_label_singular + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*data*/ 1 && t12_value !== (t12_value = /*data*/ ctx[0].settings.collections_label_singular + "")) set_data_dev(t12, t12_value);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(183:0) {#if addColl}",
    		ctx
    	});

    	return block;
    }

    // (197:0) {#if error}
    function create_if_block_1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*error*/ ctx[7]);
    			attr_dev(div, "class", "alert alert-danger");
    			add_location(div, file$1, 197, 0, 4645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 128) set_data_dev(t, /*error*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(197:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let button;
    	let t2;
    	let div5;
    	let div4;
    	let t3;
    	let div3;
    	let ul;
    	let t4;
    	let if_block2_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*cat*/ ctx[5] == "collections") return create_if_block_6;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*hasCat*/ ctx[3][0] && create_if_block_5(ctx);
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block2 = /*addColl*/ ctx[6] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			t2 = space();
    			div5 = element("div");
    			div4 = element("div");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$1, 120, 0, 2563);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$1, 129, 0, 2728);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$1, 128, 0, 2697);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$1, 119, 0, 2538);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$1, 154, 0, 3321);
    			attr_dev(div3, "class", /*colW*/ ctx[8]);
    			add_location(div3, file$1, 152, 0, 3299);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$1, 135, 0, 2837);
    			attr_dev(div5, "class", "content");
    			add_location(div5, file$1, 133, 0, 2814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t4, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addItem*/ ctx[9], false, false, false);
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
    					if_block0.m(div0, null);
    				}
    			}

    			if (/*hasCat*/ ctx[3][0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(div4, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*deleteItem, items, moveItemDown, cat*/ 3106) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*colW*/ 256) {
    				attr_dev(div3, "class", /*colW*/ ctx[8]);
    			}

    			if (/*addColl*/ ctx[6]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div5);
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
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

    function slugifyTitle() {
    	let collTitle = document.querySelector("#coll-title");
    	let val = collTitle.value;

    	let slug = val.toString().toLowerCase().replace(/\s+/g, "_").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "_").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    	// Remove all non-word chars
    	// Replace multiple - with single -
    	// Trim - from start of text
    	// Trim - from end of text

    	collTitle.value = slug;
    	return slug;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let items = false;
    	let addColl = false;
    	let error = false;
    	let coll_title = false;
    	let curCat = false;
    	let hasCat = [];
    	let filterBy = "";
    	let selected = false;
    	let colW = "col-md-12";

    	function addItem() {
    		if (cat == "collections") {
    			$$invalidate(6, addColl = true);
    		} else {
    			let newItem = {};
    			newItem.id = Date.now();
    			newItem.title = "";
    			newItem.slug = "";
    			data[cat].unshift(newItem);
    			window.location = "/#/edit/" + cat + "/" + newItem.id;
    		}
    	}

    	function deleteItem(id) {
    		let result = confirm("Are you sure you want to delete this item?");

    		if (result) {
    			$$invalidate(0, data[cat] = data[cat].filter(x => x.id !== id), data);
    			(((((($$invalidate(0, data), $$invalidate(13, params)), $$invalidate(5, cat)), $$invalidate(2, curCat)), $$invalidate(3, hasCat)), $$invalidate(4, filterBy)), $$invalidate(1, items));
    		}
    	}

    	function moveItemDown(id) {
    		let fromIndex = data[cat].findIndex(x => x.id == id);
    		let toIndex = fromIndex + 1;
    		var element = data[cat][fromIndex];
    		data[cat].splice(fromIndex, 1);
    		data[cat].splice(toIndex, 0, element);
    		(((((($$invalidate(0, data), $$invalidate(13, params)), $$invalidate(5, cat)), $$invalidate(2, curCat)), $$invalidate(3, hasCat)), $$invalidate(4, filterBy)), $$invalidate(1, items));
    	}

    	function saveCollection() {
    		let val = document.querySelector("#coll-title").value;
    		let slug = slugifyTitle();

    		if (val.length < 3) {
    			$$invalidate(7, error = "Name should be at least 3 characters long");
    		} else if (val in data) {
    			$$invalidate(7, error = "Name already exists");
    		} else {
    			let newItem = {};
    			newItem.id = Date.now();
    			newItem.title = val;
    			newItem.slug = slug;
    			newItem.fields = [];
    			data.collections.push(newItem);
    			$$invalidate(0, data[val] = [], data);
    			window.renderData(data);
    			window.location = "/#/collections/" + newItem.id;
    		}
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(4, filterBy = "");
    	const click_handler_1 = cat => $$invalidate(4, filterBy = cat.slug);
    	const click_handler_2 = item => moveItemDown(item.id);
    	const click_handler_3 = item => deleteItem(item.id);
    	const click_handler_4 = () => $$invalidate(6, addColl = false);

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(13, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		params,
    		data,
    		cat,
    		items,
    		addColl,
    		error,
    		coll_title,
    		curCat,
    		hasCat,
    		filterBy,
    		selected,
    		colW,
    		addItem,
    		deleteItem,
    		moveItemDown,
    		saveCollection,
    		slugifyTitle
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(13, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(5, cat = $$props.cat);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("addColl" in $$props) $$invalidate(6, addColl = $$props.addColl);
    		if ("error" in $$props) $$invalidate(7, error = $$props.error);
    		if ("coll_title" in $$props) coll_title = $$props.coll_title;
    		if ("curCat" in $$props) $$invalidate(2, curCat = $$props.curCat);
    		if ("hasCat" in $$props) $$invalidate(3, hasCat = $$props.hasCat);
    		if ("filterBy" in $$props) $$invalidate(4, filterBy = $$props.filterBy);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("colW" in $$props) $$invalidate(8, colW = $$props.colW);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, cat, data, curCat, hasCat, filterBy, items*/ 8255) {
    			 if (params.cat) {
    				$$invalidate(5, cat = params.cat);

    				// check if object key exists, else create empty array
    				if (cat in data) {
    					$$invalidate(1, items = data[cat]);
    				} else {
    					$$invalidate(0, data[cat] = [], data);
    					$$invalidate(1, items = data[cat]);
    				}

    				if (cat !== "collections") {
    					$$invalidate(2, curCat = data.collections.filter(x => x.slug == cat)[0]);

    					// check if this collection has a category dropdown
    					$$invalidate(3, hasCat = curCat.fields.filter(x => x.type == "cat"));

    					if (hasCat[0]) {
    						$$invalidate(8, colW = "col-md-8");
    					} else {
    						$$invalidate(8, colW = "col-md-12");
    					}

    					if (hasCat[0] && filterBy) {
    						$$invalidate(1, items = items.filter(x => x.category == filterBy));
    					}
    				}
    			}
    		}
    	};

    	return [
    		data,
    		items,
    		curCat,
    		hasCat,
    		filterBy,
    		cat,
    		addColl,
    		error,
    		colW,
    		addItem,
    		deleteItem,
    		moveItemDown,
    		saveCollection,
    		params,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 13, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[13] === undefined && !("params" in props)) {
    			console.warn("<List> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
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

    /* src/widgets/Markdown.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/widgets/Markdown.svelte";

    function create_fragment$3(ctx) {
    	let textarea;
    	let textarea_id_value;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "id", textarea_id_value = "mde-" + /*key*/ ctx[1]);
    			textarea.value = textarea_value_value = defined(/*html*/ ctx[0]);
    			add_location(textarea, file$2, 29, 0, 593);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function defined(val) {
    	if (typeof val === "undefined") {
    		val = "";
    	}

    	return val;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Markdown", slots, []);
    	let { key } = $$props;
    	let { html } = $$props;
    	let easyMDE = false;

    	onMount(() => {
    		easyMDE = new EasyMDE({
    				element: document.getElementById("mde-" + key),
    				spellChecker: false
    			});

    		easyMDE.codemirror.on("change", function () {
    			// console.log(easyMDE.value());
    			$$invalidate(0, html = easyMDE.value());
    		});
    	});

    	onDestroy(() => {
    		if (easyMDE && easyMDE !== null && typeof easyMDE !== "undefined") {
    			easyMDE.toTextArea();
    			easyMDE = null;
    		}
    	});

    	const writable_props = ["key", "html"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Markdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("html" in $$props) $$invalidate(0, html = $$props.html);
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
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("html" in $$props) $$invalidate(0, html = $$props.html);
    		if ("easyMDE" in $$props) easyMDE = $$props.easyMDE;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [html, key];
    }

    class Markdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { key: 1, html: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Markdown",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<Markdown> was created without expected prop 'key'");
    		}

    		if (/*html*/ ctx[0] === undefined && !("html" in props)) {
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

    /* src/widgets/TextEditor.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/widgets/TextEditor.svelte";

    function create_fragment$4(ctx) {
    	let textarea;
    	let textarea_id_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "name", /*key*/ ctx[1]);
    			attr_dev(textarea, "class", "form-control rich-text-editor");
    			attr_dev(textarea, "id", textarea_id_value = "rte-" + /*key*/ ctx[1]);
    			textarea.value = /*html*/ ctx[0];
    			add_location(textarea, file$3, 42, 0, 1013);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextEditor", slots, []);
    	let { key } = $$props;
    	let { html } = $$props;

    	onMount(async () => {
    		const config = {
    			classes: ["rich-text-editor"],
    			tools: ["b", "i", "u", "a", "x"], // visible tool(s)
    			text: {
    				b: ["Bold", "B", "⌘+B"],
    				i: ["Italic", "I", "⌘+I"],
    				u: ["Underline", "U", "⌘+U"],
    				a: ["Link", "A", "⌘+L"],
    				x: ["Source", "&#x22ef;", "⌘+⇧+X"]
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

    		new RTE(document.getElementById("rte-" + key), config);

    		document.querySelector(".rich-text-editor-view").addEventListener("keyup", function (e) {
    			handleKeyUp();
    		});
    	});

    	function handleKeyUp(e) {
    		let value = document.querySelector(".rich-text-editor-view").innerHTML;
    		$$invalidate(0, html = value);
    	}

    	const writable_props = ["key", "html"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextEditor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("html" in $$props) $$invalidate(0, html = $$props.html);
    	};

    	$$self.$capture_state = () => ({ onMount, key, html, handleKeyUp });

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("html" in $$props) $$invalidate(0, html = $$props.html);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [html, key];
    }

    class TextEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { key: 1, html: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextEditor",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<TextEditor> was created without expected prop 'key'");
    		}

    		if (/*html*/ ctx[0] === undefined && !("html" in props)) {
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

    /* src/widgets/Textarea.svelte generated by Svelte v3.31.2 */

    const file$4 = "src/widgets/Textarea.svelte";

    function create_fragment$5(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "class", "form-control");
    			add_location(textarea, file$4, 4, 0, 35);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Textarea", slots, []);
    	let { val } = $$props;
    	const writable_props = ["val"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Textarea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		val = this.value;
    		$$invalidate(0, val);
    	}

    	$$self.$$set = $$props => {
    		if ("val" in $$props) $$invalidate(0, val = $$props.val);
    	};

    	$$self.$capture_state = () => ({ val });

    	$$self.$inject_state = $$props => {
    		if ("val" in $$props) $$invalidate(0, val = $$props.val);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [val, textarea_input_handler];
    }

    class Textarea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { val: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Textarea",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*val*/ ctx[0] === undefined && !("val" in props)) {
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

    /* src/widgets/Gallery.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/widgets/Gallery.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[10] = list;
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (147:0) {:else}
    function create_else_block$2(ctx) {
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
    			add_location(path0, file$5, 148, 2, 3597);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "d", "M4 2h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1v1a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2h1a1 1 0 0 1 1-1z");
    			add_location(path1, file$5, 149, 2, 3881);
    			attr_dev(svg, "width", "1em");
    			attr_dev(svg, "height", "1em");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", "bi bi-images svelte-ydwqzg");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$5, 147, 0, 3468);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(147:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (145:0) {#if uploading}
    function create_if_block_2$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$5, 145, 0, 3372);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(145:0) {#if uploading}",
    		ctx
    	});

    	return block;
    }

    // (156:0) {#if item[key].length > 0}
    function create_if_block$2(ctx) {
    	let ul;
    	let each_value = /*item*/ ctx[0][/*key*/ ctx[1]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$5, 157, 0, 4087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteImage, key, moveDown, window, item*/ 27) {
    				each_value = /*item*/ ctx[0][/*key*/ ctx[1]];
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(156:0) {#if item[key].length > 0}",
    		ctx
    	});

    	return block;
    }

    // (166:24) {#if window.config.imgTitle}
    function create_if_block_1$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[6].call(input, /*i*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", window.config.imgTitle);
    			add_location(input, file$5, 165, 52, 4342);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[11]].title);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*item, key*/ 3 && input.value !== /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[11]].title) {
    				set_input_value(input, /*item*/ ctx[0][/*key*/ ctx[1]][/*i*/ ctx[11]].title);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(166:24) {#if window.config.imgTitle}",
    		ctx
    	});

    	return block;
    }

    // (160:0) {#each item[key] as img, i}
    function create_each_block$1(ctx) {
    	let li;
    	let div5;
    	let div1;
    	let div0;
    	let t0;
    	let div2;
    	let t1;
    	let div4;
    	let div3;
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
    	let if_block = window.config.imgTitle && create_if_block_1$1(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*i*/ ctx[11]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[8](/*i*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t3 = space();
    			attr_dev(div0, "class", "box svelte-ydwqzg");
    			set_style(div0, "background-image", "url(" + /*img*/ ctx[9].filename + ")");
    			add_location(div0, file$5, 164, 24, 4213);
    			attr_dev(div1, "class", "col-md-1");
    			add_location(div1, file$5, 164, 2, 4191);
    			attr_dev(div2, "class", "col-md-5");
    			add_location(div2, file$5, 165, 2, 4292);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M3.204 5L8 10.481 12.796 5H3.204zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z");
    			add_location(path0, file$5, 172, 2, 4744);
    			attr_dev(svg0, "width", "1em");
    			attr_dev(svg0, "height", "1em");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			attr_dev(svg0, "class", "bi bi-caret-down svelte-ydwqzg");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$5, 171, 0, 4611);
    			attr_dev(button0, "class", "btn btn-outline-secondary svelte-ydwqzg");
    			add_location(button0, file$5, 170, 0, 4532);
    			attr_dev(path1, "d", "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z");
    			add_location(path1, file$5, 179, 4, 5154);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "d", "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z");
    			add_location(path2, file$5, 180, 4, 5330);
    			attr_dev(svg1, "width", "1em");
    			attr_dev(svg1, "height", "1em");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			attr_dev(svg1, "class", "bi bi-trash svelte-ydwqzg");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$5, 178, 2, 5024);
    			attr_dev(button1, "class", "btn btn-outline-secondary svelte-ydwqzg");
    			add_location(button1, file$5, 177, 2, 4940);
    			attr_dev(div3, "class", "btn-group float-right");
    			add_location(div3, file$5, 168, 0, 4495);
    			attr_dev(div4, "class", "col-md-6");
    			add_location(div4, file$5, 166, 2, 4471);
    			attr_dev(div5, "class", "row svelte-ydwqzg");
    			add_location(div5, file$5, 163, 0, 4171);
    			attr_dev(li, "class", "list-group-item svelte-ydwqzg");
    			add_location(li, file$5, 161, 0, 4141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div5);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div5, t0);
    			append_dev(div5, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div3, t2);
    			append_dev(div3, button1);
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

    			if (dirty & /*item, key*/ 3) {
    				set_style(div0, "background-image", "url(" + /*img*/ ctx[9].filename + ")");
    			}

    			if (window.config.imgTitle) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(160:0) {#each item[key] as img, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
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
    		if (/*uploading*/ ctx[2]) return create_if_block_2$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*item*/ ctx[0][/*key*/ ctx[1]].length > 0 && create_if_block$2(ctx);

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
    			add_location(input, file$5, 140, 0, 3175);
    			attr_dev(button, "class", "btn btn-outline-secondary w-25 mb-3 svelte-ydwqzg");
    			add_location(button, file$5, 141, 0, 3265);
    			add_location(br, file$5, 194, 0, 5671);
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
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
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
    					if_block1 = create_if_block$2(ctx);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function clickSelect(mykey) {
    	document.querySelector("#fileInput").click();
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gallery", slots, []);
    	let { key } = $$props;
    	let { item } = $$props;
    	let uploading = false;

    	if (!item[key]) {
    		item[key] = [];
    	}

    	onMount(async () => {
    		document.getElementById("fileInput").addEventListener("change", function (e) {
    			$$invalidate(2, uploading = true);

    			if (typeof config.imgWidth !== "undefined") {
    				var width = config.imgWidth;
    			} else {
    				var width = 800;
    			}

    			var img = new Image();

    			img.onload = function () {
    				var canvas = document.createElement("canvas"),
    					ctx = canvas.getContext("2d"),
    					oc = document.createElement("canvas"),
    					octx = oc.getContext("2d");

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
    				var base64Image = canvas.toDataURL("image/jpeg");
    				console.log(base64Image);
    				let opts = {};
    				opts.filename = "img/" + Date.now() + ".jpg";
    				opts.type = "img";
    				opts.data = base64Image;

    				call_api("api/save", opts).then(function (res) {
    					if (res.ok) {
    						console.log("Saved");
    						let newItem = { "filename": res.filename };
    						item[key].push(newItem);
    						$$invalidate(0, item);
    						$$invalidate(2, uploading = false);
    					} else {
    						console.log("Error saving");

    						setTimeout(
    							function () {
    								$$invalidate(2, uploading = false);
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
    			$$invalidate(2, uploading = true);
    			let opts = {};
    			opts.filename = item[key][i].filename;

    			call_api("api/delete", opts).then(function (res) {
    				if (res.ok) {
    					console.log("Deleted");
    					item[key].splice(i, 1);
    					$$invalidate(0, item);
    					$$invalidate(2, uploading = false);
    				} else {
    					console.log("Error deleting");

    					setTimeout(
    						function () {
    							$$invalidate(2, uploading = false);
    						},
    						1000
    					);
    				}
    			});
    		}
    	}

    	function moveDown(key, index) {
    		var newindex = index + 1;

    		if (typeof item[key][newindex] !== "undefined") {
    			$$invalidate(0, item[key] = move(item[key], index, index + 1), item);
    			$$invalidate(0, item);
    		}
    	}

    	const writable_props = ["key", "item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Gallery> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => clickSelect();

    	function input_input_handler(i) {
    		item[key][i].title = this.value;
    		$$invalidate(0, item);
    		$$invalidate(1, key);
    	}

    	const click_handler_1 = i => moveDown(key, i);
    	const click_handler_2 = i => deleteImage(key, i);

    	$$self.$$set = $$props => {
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		key,
    		item,
    		uploading,
    		clickSelect,
    		deleteImage,
    		move,
    		moveDown
    	});

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("uploading" in $$props) $$invalidate(2, uploading = $$props.uploading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		item,
    		key,
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { key: 1, item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console_1$1.warn("<Gallery> was created without expected prop 'key'");
    		}

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$1.warn("<Gallery> was created without expected prop 'item'");
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
    }

    /* src/routes/Edit.svelte generated by Svelte v3.31.2 */

    const { console: console_1$2 } = globals;
    const file$6 = "src/routes/Edit.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[22] = list;
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (65:0) {#if collection}
    function create_if_block$3(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let div1;
    	let button;
    	let t2;
    	let t3;
    	let div3;
    	let b;
    	let t5;
    	let input;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*loading*/ ctx[4] && create_if_block_8(ctx);
    	let each_value = /*collection*/ ctx[3].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Edit";
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			if (if_block) if_block.c();
    			t2 = text("  Save");
    			t3 = space();
    			div3 = element("div");
    			b = element("b");
    			b.textContent = "Title";
    			t5 = space();
    			input = element("input");
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$6, 69, 0, 1663);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$6, 68, 0, 1643);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$6, 72, 0, 1715);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$6, 71, 0, 1684);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$6, 67, 0, 1618);
    			add_location(b, file$6, 79, 0, 1936);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$6, 80, 0, 1949);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$6, 76, 0, 1912);
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
    			append_dev(div3, b);
    			append_dev(div3, t5);
    			append_dev(div3, input);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title);
    			append_dev(div3, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*save*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*loading*/ ctx[4]) {
    				if (if_block) ; else {
    					if_block = create_if_block_8(ctx);
    					if_block.c();
    					if_block.m(button, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

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
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t3);
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
    		source: "(65:0) {#if collection}",
    		ctx
    	});

    	return block;
    }

    // (73:55) {#if loading}
    function create_if_block_8(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$6, 72, 68, 1783);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(73:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (88:2) {#if field.description}
    function create_if_block_7(ctx) {
    	let div;
    	let t_value = /*field*/ ctx[21].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "description");
    			add_location(div, file$6, 88, 2, 2122);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 8 && t_value !== (t_value = /*field*/ ctx[21].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(88:2) {#if field.description}",
    		ctx
    	});

    	return block;
    }

    // (92:2) {#if field.type=='txt'}
    function create_if_block_6$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[9].call(input, /*field*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$6, 92, 2, 2210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, cat, index, collection*/ 15 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title]) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title]);
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
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(92:2) {#if field.type=='txt'}",
    		ctx
    	});

    	return block;
    }

    // (96:2) {#if field.type=='txta'}
    function create_if_block_5$1(ctx) {
    	let textarea;
    	let updating_val;
    	let current;

    	function textarea_val_binding(value) {
    		/*textarea_val_binding*/ ctx[10].call(null, value, /*field*/ ctx[21]);
    	}

    	let textarea_props = {};

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title] !== void 0) {
    		textarea_props.val = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
    	}

    	textarea = new Textarea({ props: textarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(textarea, "val", textarea_val_binding));

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
    				textarea_changes.val = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
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
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(96:2) {#if field.type=='txta'}",
    		ctx
    	});

    	return block;
    }

    // (100:2) {#if field.type=='mde'}
    function create_if_block_4$1(ctx) {
    	let markdown;
    	let updating_key;
    	let updating_html;
    	let current;

    	function markdown_key_binding(value) {
    		/*markdown_key_binding*/ ctx[11].call(null, value, /*field*/ ctx[21]);
    	}

    	function markdown_html_binding(value) {
    		/*markdown_html_binding*/ ctx[12].call(null, value, /*field*/ ctx[21]);
    	}

    	let markdown_props = {};

    	if (/*field*/ ctx[21].title !== void 0) {
    		markdown_props.key = /*field*/ ctx[21].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title] !== void 0) {
    		markdown_props.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
    	}

    	markdown = new Markdown({ props: markdown_props, $$inline: true });
    	binding_callbacks.push(() => bind(markdown, "key", markdown_key_binding));
    	binding_callbacks.push(() => bind(markdown, "html", markdown_html_binding));

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

    			if (!updating_key && dirty & /*collection*/ 8) {
    				updating_key = true;
    				markdown_changes.key = /*field*/ ctx[21].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_html && dirty & /*data, cat, index, collection*/ 15) {
    				updating_html = true;
    				markdown_changes.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
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
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(100:2) {#if field.type=='mde'}",
    		ctx
    	});

    	return block;
    }

    // (104:2) {#if field.type=='rte'}
    function create_if_block_3$1(ctx) {
    	let texteditor;
    	let updating_key;
    	let updating_html;
    	let current;

    	function texteditor_key_binding(value) {
    		/*texteditor_key_binding*/ ctx[13].call(null, value, /*field*/ ctx[21]);
    	}

    	function texteditor_html_binding(value) {
    		/*texteditor_html_binding*/ ctx[14].call(null, value, /*field*/ ctx[21]);
    	}

    	let texteditor_props = {};

    	if (/*field*/ ctx[21].title !== void 0) {
    		texteditor_props.key = /*field*/ ctx[21].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title] !== void 0) {
    		texteditor_props.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
    	}

    	texteditor = new TextEditor({ props: texteditor_props, $$inline: true });
    	binding_callbacks.push(() => bind(texteditor, "key", texteditor_key_binding));
    	binding_callbacks.push(() => bind(texteditor, "html", texteditor_html_binding));

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

    			if (!updating_key && dirty & /*collection*/ 8) {
    				updating_key = true;
    				texteditor_changes.key = /*field*/ ctx[21].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_html && dirty & /*data, cat, index, collection*/ 15) {
    				updating_html = true;
    				texteditor_changes.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[21].title];
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(104:2) {#if field.type=='rte'}",
    		ctx
    	});

    	return block;
    }

    // (109:2) {#if field.type=='gal'}
    function create_if_block_2$2(ctx) {
    	let gallery;
    	let updating_key;
    	let updating_item;
    	let current;

    	function gallery_key_binding(value) {
    		/*gallery_key_binding*/ ctx[15].call(null, value, /*field*/ ctx[21]);
    	}

    	function gallery_item_binding(value) {
    		/*gallery_item_binding*/ ctx[16].call(null, value);
    	}

    	let gallery_props = {};

    	if (/*field*/ ctx[21].title !== void 0) {
    		gallery_props.key = /*field*/ ctx[21].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]] !== void 0) {
    		gallery_props.item = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]];
    	}

    	gallery = new Gallery({ props: gallery_props, $$inline: true });
    	binding_callbacks.push(() => bind(gallery, "key", gallery_key_binding));
    	binding_callbacks.push(() => bind(gallery, "item", gallery_item_binding));

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

    			if (!updating_key && dirty & /*collection*/ 8) {
    				updating_key = true;
    				gallery_changes.key = /*field*/ ctx[21].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_item && dirty & /*data, cat, index*/ 7) {
    				updating_item = true;
    				gallery_changes.item = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]];
    				add_flush_callback(() => updating_item = false);
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
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(109:2) {#if field.type=='gal'}",
    		ctx
    	});

    	return block;
    }

    // (114:2) {#if field.type=='cat'}
    function create_if_block_1$2(ctx) {
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
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "class", "form-control w-25");
    			if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].category === void 0) add_render_callback(() => /*select_change_handler*/ ctx[17].call(select));
    			add_location(select, file$6, 114, 2, 2762);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].category);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[17]);
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

    			if (dirty & /*data, cat, index*/ 7) {
    				select_option(select, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].category);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(114:2) {#if field.type=='cat'}",
    		ctx
    	});

    	return block;
    }

    // (116:2) {#each data.categories as cat}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[1].title + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[1].slug;
    			option.value = option.__value;
    			add_location(option, file$6, 116, 2, 2873);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*cat*/ ctx[1].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*cat*/ ctx[1].slug)) {
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
    		source: "(116:2) {#each data.categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (84:2) {#each collection.fields as field}
    function create_each_block$2(ctx) {
    	let b;
    	let t0_value = /*field*/ ctx[21].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let if_block6_anchor;
    	let current;
    	let if_block0 = /*field*/ ctx[21].description && create_if_block_7(ctx);
    	let if_block1 = /*field*/ ctx[21].type == "txt" && create_if_block_6$1(ctx);
    	let if_block2 = /*field*/ ctx[21].type == "txta" && create_if_block_5$1(ctx);
    	let if_block3 = /*field*/ ctx[21].type == "mde" && create_if_block_4$1(ctx);
    	let if_block4 = /*field*/ ctx[21].type == "rte" && create_if_block_3$1(ctx);
    	let if_block5 = /*field*/ ctx[21].type == "gal" && create_if_block_2$2(ctx);
    	let if_block6 = /*field*/ ctx[21].type == "cat" && create_if_block_1$2(ctx);

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
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			t6 = space();
    			if (if_block5) if_block5.c();
    			t7 = space();
    			if (if_block6) if_block6.c();
    			if_block6_anchor = empty();
    			add_location(b, file$6, 86, 2, 2073);
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
    			insert_dev(target, t4, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, t7, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert_dev(target, if_block6_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*collection*/ 8) && t0_value !== (t0_value = /*field*/ ctx[21].title + "")) set_data_dev(t0, t0_value);

    			if (/*field*/ ctx[21].description) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*field*/ ctx[21].type == "txt") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6$1(ctx);
    					if_block1.c();
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*field*/ ctx[21].type == "txta") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t4.parentNode, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[21].type == "mde") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t5.parentNode, t5);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[21].type == "rte") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t6.parentNode, t6);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[21].type == "gal") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_2$2(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t7.parentNode, t7);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*field*/ ctx[21].type == "cat") {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_1$2(ctx);
    					if_block6.c();
    					if_block6.m(if_block6_anchor.parentNode, if_block6_anchor);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(t7);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach_dev(if_block6_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(84:2) {#each collection.fields as field}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*collection*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Edit", slots, []);
    	let { params } = $$props;
    	let { data } = $$props;
    	let cat = false;
    	let id = false;
    	let item = false;
    	let index = false;
    	let collection = false;
    	let fields = {};
    	let loading = false;

    	function save() {
    		if (typeof data[cat][index].slug === "undefined" || data[cat][index].slug == "") {
    			slugifyTitle();
    		}

    		$$invalidate(4, loading = true);
    		let opts = {};
    		opts.path = "data.json";
    		opts.type = "json";
    		opts.data = data;

    		call_api("api/save", opts).then(function (res) {
    			if (res.ok) {
    				console.log("Saved");
    				$$invalidate(4, loading = false);
    			} else {
    				console.log("Error saving");

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
    		let slug = data[cat][index].title.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data[cat][index].slug = slug + "-" + Math.floor(Math.random() * 999), data);
    		$$invalidate(0, data);
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Edit> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data[cat][index].title = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, cat), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(7, id));
    		(((($$invalidate(2, index), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	function input_input_handler_1(field) {
    		data[cat][index][field.title] = this.value;
    		$$invalidate(0, data);
    		((($$invalidate(1, cat), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(7, id));
    		(((($$invalidate(2, index), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    		(((($$invalidate(3, collection), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	function textarea_val_binding(value, field) {
    		data[cat][index][field.title] = value;
    		$$invalidate(0, data);
    	}

    	function markdown_key_binding(value, field) {
    		field.title = value;
    		(((($$invalidate(3, collection), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	function markdown_html_binding(value, field) {
    		data[cat][index][field.title] = value;
    		$$invalidate(0, data);
    	}

    	function texteditor_key_binding(value, field) {
    		field.title = value;
    		(((($$invalidate(3, collection), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	function texteditor_html_binding(value, field) {
    		data[cat][index][field.title] = value;
    		$$invalidate(0, data);
    	}

    	function gallery_key_binding(value, field) {
    		field.title = value;
    		(((($$invalidate(3, collection), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	function gallery_item_binding(value) {
    		data[cat][index] = value;
    		$$invalidate(0, data);
    	}

    	function select_change_handler() {
    		data[cat][index].category = select_value(this);
    		$$invalidate(0, data);
    		((($$invalidate(1, cat), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(7, id));
    		(((($$invalidate(2, index), $$invalidate(6, params)), $$invalidate(0, data)), $$invalidate(1, cat)), $$invalidate(7, id));
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
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
    		save,
    		slugifyTitle
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(1, cat = $$props.cat);
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("item" in $$props) item = $$props.item;
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("collection" in $$props) $$invalidate(3, collection = $$props.collection);
    		if ("fields" in $$props) fields = $$props.fields;
    		if ("loading" in $$props) $$invalidate(4, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat, id*/ 195) {
    			 if (params.cat && params.id) {
    				$$invalidate(1, cat = params.cat);
    				$$invalidate(7, id = params.id);
    				item = data[cat].filter(x => x.id == id)[0];
    				$$invalidate(2, index = data[cat].findIndex(x => x.id == id));
    				$$invalidate(3, collection = data.collections.filter(x => x.slug == cat)[0]);
    			}
    		}
    	};

    	return [
    		data,
    		cat,
    		index,
    		collection,
    		loading,
    		save,
    		params,
    		id,
    		input_input_handler,
    		input_input_handler_1,
    		textarea_val_binding,
    		markdown_key_binding,
    		markdown_html_binding,
    		texteditor_key_binding,
    		texteditor_html_binding,
    		gallery_key_binding,
    		gallery_item_binding,
    		select_change_handler
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { params: 6, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console_1$2.warn("<Edit> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1$2.warn("<Edit> was created without expected prop 'data'");
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

    const { console: console_1$3 } = globals;
    const file$7 = "src/routes/EditCollection.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (82:55) {#if loading}
    function create_if_block_1$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$7, 81, 68, 2052);
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
    		source: "(82:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#if data.collections[index].fields}
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
    	let each_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    			add_location(input, file$7, 106, 23, 2702);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$7, 106, 4, 2683);
    			attr_dev(div1, "class", "description mt-2");
    			add_location(div1, file$7, 107, 23, 2802);
    			attr_dev(div2, "class", "col-8");
    			add_location(div2, file$7, 107, 4, 2783);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$7, 105, 4, 2661);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$7, 104, 4, 2628);
    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$7, 101, 4, 2598);
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
    		source: "(101:4) {#if data.collections[index].fields}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#each data.collections[index].fields as field, i}
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
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t8;
    	let div3;
    	let button;
    	let i_1;
    	let t9;
    	let mounted;
    	let dispose;

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[10].call(input0, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function keyup_handler() {
    		return /*keyup_handler*/ ctx[11](/*i*/ ctx[21]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[12].call(input1, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[13].call(select, /*each_value*/ ctx[20], /*i*/ ctx[21]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[14](/*field*/ ctx[19]);
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
    			option5 = element("option");
    			option5.textContent = "Category chooser";
    			t8 = space();
    			div3 = element("div");
    			button = element("button");
    			i_1 = element("i");
    			t9 = space();
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control mb-0");
    			attr_dev(input0, "placeholder", "field name");
    			add_location(input0, file$7, 116, 25, 3041);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$7, 116, 6, 3022);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control mb-0");
    			attr_dev(input1, "placeholder", "field description (optional)");
    			add_location(input1, file$7, 117, 25, 3212);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$7, 117, 6, 3193);
    			option0.__value = "txt";
    			option0.value = option0.__value;
    			add_location(option0, file$7, 120, 6, 3441);
    			option1.__value = "txta";
    			option1.value = option1.__value;
    			add_location(option1, file$7, 121, 6, 3481);
    			option2.__value = "mde";
    			option2.value = option2.__value;
    			add_location(option2, file$7, 122, 6, 3526);
    			option3.__value = "rte";
    			option3.value = option3.__value;
    			add_location(option3, file$7, 123, 6, 3577);
    			option4.__value = "gal";
    			option4.value = option4.__value;
    			add_location(option4, file$7, 124, 6, 3629);
    			option5.__value = "cat";
    			option5.value = option5.__value;
    			add_location(option5, file$7, 125, 6, 3672);
    			attr_dev(select, "class", "form-control mb-0");
    			if (/*field*/ ctx[19].type === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$7, 119, 6, 3374);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file$7, 118, 6, 3348);
    			attr_dev(i_1, "class", "bi bi-trash");
    			add_location(i_1, file$7, 131, 6, 3884);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$7, 130, 6, 3791);
    			attr_dev(div3, "class", "col-2 text-right");
    			add_location(div3, file$7, 129, 6, 3754);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$7, 115, 6, 2998);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$7, 114, 6, 2963);
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
    			append_dev(select, option5);
    			select_option(select, /*field*/ ctx[19].type);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, i_1);
    			append_dev(li, t9);

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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(114:4) {#each data.collections[index].fields as field, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let span;
    	let t0;
    	let t1_value = /*data*/ ctx[0].settings.collections_label_singular + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "";
    	let t4;
    	let t5;
    	let div1;
    	let button0;
    	let t6;
    	let t7;
    	let div7;
    	let div6;
    	let div4;
    	let b;
    	let t9;
    	let div3;
    	let t10;
    	let t11_value = /*data*/ ctx[0].settings.collections_label_singular + "";
    	let t11;
    	let t12;
    	let div5;
    	let button1;
    	let i;
    	let t13;
    	let t14;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[2] && create_if_block_1$3(ctx);
    	let if_block1 = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			span = element("span");
    			t0 = text("Edit ");
    			t1 = text(t1_value);
    			t2 = text(":");
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			button0 = element("button");
    			if (if_block0) if_block0.c();
    			t6 = text("  Save");
    			t7 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			b = element("b");
    			b.textContent = "Fields";
    			t9 = space();
    			div3 = element("div");
    			t10 = text("Fields in this ");
    			t11 = text(t11_value);
    			t12 = space();
    			div5 = element("div");
    			button1 = element("button");
    			i = element("i");
    			t13 = text(" Add Field");
    			t14 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "medium-hide");
    			add_location(span, file$7, 78, 4, 1827);
    			add_location(h4, file$7, 78, 0, 1823);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$7, 77, 0, 1803);
    			attr_dev(button0, "class", "btn btn-dark btn-add");
    			add_location(button0, file$7, 81, 0, 1984);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$7, 80, 0, 1953);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$7, 76, 0, 1778);
    			add_location(b, file$7, 91, 4, 2250);
    			attr_dev(div3, "class", "description");
    			add_location(div3, file$7, 92, 4, 2268);
    			attr_dev(div4, "class", "col-6");
    			add_location(div4, file$7, 90, 2, 2226);
    			attr_dev(i, "class", "bi bi-plus-circle");
    			add_location(i, file$7, 95, 83, 2482);
    			attr_dev(button1, "class", "btn btn-outline-dark btn-add float-right");
    			add_location(button1, file$7, 95, 4, 2403);
    			attr_dev(div5, "class", "col-6 text-right");
    			add_location(div5, file$7, 94, 2, 2368);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$7, 89, 0, 2206);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$7, 85, 0, 2181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(h4, t3);
    			append_dev(h4, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(button0, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, b);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, t10);
    			append_dev(div3, t11);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, button1);
    			append_dev(button1, i);
    			append_dev(button1, t13);
    			append_dev(div7, t14);
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
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].settings.collections_label_singular + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data, index*/ 3 && t4_value !== (t4_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "")) set_data_dev(t4, t4_value);

    			if (/*loading*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(button0, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*data*/ 1 && t11_value !== (t11_value = /*data*/ ctx[0].settings.collections_label_singular + "")) set_data_dev(t11, t11_value);

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
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div7);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
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
    	let loading = false;

    	function save() {
    		$$invalidate(2, loading = true);
    		let opts = {};
    		opts.path = "data.json";
    		opts.type = "json";
    		opts.content = data;

    		call_api("api/save", opts).then(function (res) {
    			if (res.ok) {
    				console.log("Saved");
    				$$invalidate(2, loading = false);
    			} else {
    				console.log("Error saving");

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

    	function slugifyFieldTitle(i) {
    		let slug = data.collections[index].fields[i].title.toString().toLowerCase().replace(/\s+/g, "_").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "_").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    		// Remove all non-word chars
    		// Replace multiple - with single -
    		// Trim - from start of text
    		// Trim - from end of text

    		$$invalidate(0, data.collections[index].fields[i].title = slug, data);
    		$$invalidate(0, data);
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<EditCollection> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler(each_value, i) {
    		each_value[i].title = this.value;
    		$$invalidate(0, data);
    		(((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, cat)), $$invalidate(9, id));
    	}

    	const keyup_handler = i => slugifyFieldTitle(i);

    	function input1_input_handler(each_value, i) {
    		each_value[i].description = this.value;
    		$$invalidate(0, data);
    		(((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, cat)), $$invalidate(9, id));
    	}

    	function select_change_handler(each_value, i) {
    		each_value[i].type = select_value(this);
    		$$invalidate(0, data);
    		(((($$invalidate(1, index), $$invalidate(7, params)), $$invalidate(0, data)), $$invalidate(8, cat)), $$invalidate(9, id));
    	}

    	const click_handler = field => deleteField(field.title);

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
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
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(8, cat = $$props.cat);
    		if ("id" in $$props) $$invalidate(9, id = $$props.id);
    		if ("item" in $$props) item = $$props.item;
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("collection" in $$props) collection = $$props.collection;
    		if ("fields" in $$props) fields = $$props.fields;
    		if ("title" in $$props) title = $$props.title;
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, data, cat, id, index*/ 899) {
    			 if (params.id) {
    				$$invalidate(8, cat = "collections");
    				$$invalidate(9, id = params.id);
    				item = data[cat].filter(x => x.id == id)[0];
    				$$invalidate(1, index = data[cat].findIndex(x => x.id == id));
    				collection = data.collections.filter(x => x.title == cat)[0];
    				title = data.collections[index].title;
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
    		cat,
    		id,
    		input0_input_handler,
    		keyup_handler,
    		input1_input_handler,
    		select_change_handler,
    		click_handler
    	];
    }

    class EditCollection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { params: 7, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditCollection",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !("params" in props)) {
    			console_1$3.warn("<EditCollection> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1$3.warn("<EditCollection> was created without expected prop 'data'");
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

    /* src/routes/Categories.svelte generated by Svelte v3.31.2 */

    const { console: console_1$4 } = globals;
    const file$8 = "src/routes/Categories.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (69:2) {#if cat !== 'collections'}
    function create_if_block_1$4(ctx) {
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*item*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "bi bi-trash");
    			add_location(i, file$8, 69, 83, 1697);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$8, 69, 2, 1616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
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
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(69:2) {#if cat !== 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (60:0) {#each items as item}
    function create_each_block$4(ctx) {
    	let li;
    	let div2;
    	let div0;
    	let t0_value = /*item*/ ctx[9].title + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let if_block = /*cat*/ ctx[2] !== "collections" && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(div0, "class", "col-6 text-truncate d-flex align-items-center");
    			add_location(div0, file$8, 62, 2, 1467);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$8, 67, 2, 1553);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$8, 61, 2, 1447);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$8, 60, 2, 1416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[9].title + "")) set_data_dev(t0, t0_value);
    			if (/*cat*/ ctx[2] !== "collections") if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(60:0) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (79:0) {#if addCat}
    function create_if_block$5(ctx) {
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
    			add_location(h4, file$8, 85, 8, 1993);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$8, 87, 10, 2130);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$8, 86, 8, 2043);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$8, 84, 6, 1958);
    			add_location(b, file$8, 92, 2, 2269);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "new-cat");
    			add_location(input, file$8, 93, 6, 2296);
    			attr_dev(div1, "class", "description-sub");
    			add_location(div1, file$8, 94, 10, 2362);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$8, 90, 6, 2241);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$8, 97, 8, 2452);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$8, 96, 6, 2417);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$8, 83, 4, 1924);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$8, 82, 2, 1877);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			add_location(div6, file$8, 81, 0, 1827);
    			attr_dev(div7, "class", "backdrop");
    			add_location(div7, file$8, 79, 0, 1803);
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
    					listen_dev(span, "click", /*click_handler_2*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*saveCat*/ ctx[4], false, false, false)
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(79:0) {#if addCat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
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
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let if_block = /*addCat*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Categories";
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

    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file$8, 47, 0, 1174);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$8, 46, 0, 1154);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$8, 50, 0, 1232);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$8, 49, 0, 1201);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$8, 45, 0, 1129);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$8, 58, 0, 1355);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$8, 54, 0, 1330);
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
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*deleteItem, items, cat*/ 13) {
    				each_value = /*items*/ ctx[0];
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

    			if (/*addCat*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function slugify(text) {
    	let slug = text.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""); // Replace spaces with -
    	// Remove all non-word chars
    	// Replace multiple - with single -
    	// Trim - from start of text
    	// Trim - from end of text

    	return slug;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Categories", slots, []);
    	let { data } = $$props;
    	let cat = false;
    	let items = false;
    	let addCat = false;
    	items = data.categories;

    	function deleteItem(id) {
    		let result = confirm("Are you sure you want to delete this category?");

    		if (result) {
    			$$invalidate(5, data.categories = data.categories.filter(x => x.id !== id), data);
    			$$invalidate(5, data);
    			$$invalidate(0, items = data.categories);
    		}
    	}

    	function saveCat() {
    		let val = document.querySelector("#new-cat").value;
    		console.log(val);
    		let newItem = {};
    		newItem.id = Date.now();
    		newItem.title = val;
    		newItem.slug = slugify(val);
    		data.categories.push(newItem);
    		$$invalidate(5, data);
    		$$invalidate(0, items = data.categories);
    		console.log(data.categories);
    		$$invalidate(1, addCat = false);
    	}

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<Categories> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, addCat = true);
    	const click_handler_1 = item => deleteItem(item.id);
    	const click_handler_2 = () => $$invalidate(1, addCat = false);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		cat,
    		items,
    		addCat,
    		deleteItem,
    		saveCat,
    		slugify
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(2, cat = $$props.cat);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("addCat" in $$props) $$invalidate(1, addCat = $$props.addCat);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		addCat,
    		cat,
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { data: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Categories",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[5] === undefined && !("data" in props)) {
    			console_1$4.warn("<Categories> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Categories>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Categories>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Settings.svelte generated by Svelte v3.31.2 */

    const { Object: Object_1$1, console: console_1$5 } = globals;
    const file$9 = "src/routes/Settings.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	child_ctx[6] = list;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (34:55) {#if loading}
    function create_if_block$6(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$9, 33, 68, 605);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(34:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#each Object.entries(data.settings) as [key, value]}
    function create_each_block$5(ctx) {
    	let b;
    	let t0_value = /*key*/ ctx[4].replaceAll("_", " ") + "";
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
    			add_location(b, file$9, 41, 0, 812);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control w-25");
    			add_location(input, file$9, 42, 0, 846);
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
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*key*/ ctx[4].replaceAll("_", " ") + "")) set_data_dev(t0, t0_value);

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
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(40:0) {#each Object.entries(data.settings) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    	let if_block = /*loading*/ ctx[1] && create_if_block$6(ctx);
    	let each_value = Object.entries(/*data*/ ctx[0].settings);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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

    			add_location(h4, file$9, 30, 0, 481);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$9, 29, 0, 461);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$9, 33, 0, 537);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$9, 32, 0, 506);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$9, 28, 0, 436);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$9, 37, 0, 734);
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
    					if_block = create_if_block$6(ctx);
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
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Settings", slots, []);
    	let { data } = $$props;
    	let loading = false;

    	function save() {
    		$$invalidate(1, loading = true);
    		let opts = {};
    		opts.path = "data.json";
    		opts.type = "json";
    		opts.data = data;

    		call_api("api/save", opts).then(function (res) {
    			if (res.ok) {
    				console.log("Saved");
    				$$invalidate(1, loading = false);
    			} else {
    				console.log("Error saving");

    				setTimeout(
    					function () {
    						$$invalidate(1, loading = false);
    					},
    					1000
    				);
    			}
    		});
    	}

    	const writable_props = ["data"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(key) {
    		data.settings[key] = this.value;
    		$$invalidate(0, data);
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data, loading, save });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, loading, save, input_input_handler];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1$5.warn("<Settings> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.31.2 */

    function create_fragment$b(ctx) {
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */

    const { console: console_1$6 } = globals;
    const file$a = "src/App.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (154:0) {:else}
    function create_else_block_1$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let button0;
    	let i0;
    	let t1;
    	let t2;
    	let button1;
    	let i1;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			button0 = element("button");
    			i0 = element("i");
    			t1 = text(" Sign In with Google");
    			t2 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t3 = text(" Sign In with Twitter");
    			if (img.src !== (img_src_value = "assets/img/rocket-planet.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$a, 155, 3, 3638);
    			attr_dev(i0, "class", "bi bi-google");
    			add_location(i0, file$a, 156, 103, 3784);
    			attr_dev(button0, "id", "google-signin");
    			attr_dev(button0, "onclick", "login('google');");
    			attr_dev(button0, "class", "btn btn-outline-dark w-100 btn-signin");
    			add_location(button0, file$a, 156, 3, 3684);
    			attr_dev(i1, "class", "bi bi-twitter");
    			add_location(i1, file$a, 157, 109, 3951);
    			attr_dev(button1, "id", "twitter-signin");
    			attr_dev(button1, "onclick", "login('twitter');");
    			attr_dev(button1, "class", "btn btn-outline-dark w-100 mt-2 btn-signin");
    			add_location(button1, file$a, 157, 2, 3844);
    			attr_dev(div, "id", "log-in-screen");
    			add_location(div, file$a, 154, 1, 3610);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(button0, i0);
    			append_dev(button0, t1);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(154:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (110:25) 
    function create_if_block_1$5(ctx) {
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
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let a3;
    	let t10;
    	let br0;
    	let br1;
    	let t11;
    	let a4;
    	let t13;
    	let div5;
    	let div4;
    	let router;
    	let div6_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0].collections;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*data*/ ctx[0].settings.collections_label == "") return create_if_block_2$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

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
    			a1 = element("a");
    			if_block.c();
    			t6 = space();
    			a2 = element("a");
    			a2.textContent = "Categories";
    			t8 = space();
    			a3 = element("a");
    			a3.textContent = "settings";
    			t10 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t11 = space();
    			a4 = element("a");
    			a4.textContent = "Log Out";
    			t13 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(router.$$.fragment);
    			if (img.src !== (img_src_value = "assets/img/rocketlogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			add_location(img, file$a, 114, 86, 2643);
    			attr_dev(a0, "href", "/#/");
    			toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			add_location(a0, file$a, 114, 0, 2557);
    			add_location(h50, file$a, 117, 0, 2721);
    			attr_dev(div0, "id", "collections-nav");
    			add_location(div0, file$a, 118, 0, 2738);
    			add_location(h51, file$a, 127, 0, 2949);
    			attr_dev(a1, "href", "/#/list/collections");
    			toggle_class(a1, "selected", /*current*/ ctx[2] === "collections");
    			add_location(a1, file$a, 130, 1, 2968);
    			attr_dev(a2, "href", "/#/categories");
    			toggle_class(a2, "selected", /*current*/ ctx[2] === "categories");
    			add_location(a2, file$a, 132, 1, 3192);
    			attr_dev(a3, "href", "/#/settings");
    			toggle_class(a3, "selected", /*current*/ ctx[2] === "settings");
    			add_location(a3, file$a, 134, 1, 3319);
    			add_location(br0, file$a, 136, 0, 3437);
    			add_location(br1, file$a, 136, 4, 3441);
    			attr_dev(a4, "href", "/logout");
    			attr_dev(a4, "id", "logout");
    			add_location(a4, file$a, 138, 1, 3448);
    			attr_dev(div1, "class", "side-nav");
    			add_location(div1, file$a, 116, 0, 2698);
    			attr_dev(div2, "class", "side");
    			add_location(div2, file$a, 112, 0, 2537);
    			attr_dev(div3, "class", "col-md-2");
    			add_location(div3, file$a, 111, 0, 2514);
    			attr_dev(div4, "class", "main");
    			add_location(div4, file$a, 146, 0, 3538);
    			attr_dev(div5, "class", "col-md-10");
    			add_location(div5, file$a, 144, 0, 3513);
    			attr_dev(div6, "class", "row no-gutters page");
    			add_location(div6, file$a, 110, 0, 2464);
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
    			append_dev(div1, a1);
    			if_block.m(a1, null);
    			append_dev(div1, t6);
    			append_dev(div1, a2);
    			append_dev(div1, t8);
    			append_dev(div1, a3);
    			append_dev(div1, t10);
    			append_dev(div1, br0);
    			append_dev(div1, br1);
    			append_dev(div1, t11);
    			append_dev(div1, a4);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			mount_component(router, div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(a1, "click", /*click_handler_2*/ ctx[6], false, false, false),
    					listen_dev(a2, "click", /*click_handler_3*/ ctx[7], false, false, false),
    					listen_dev(a3, "click", /*click_handler_4*/ ctx[8], false, false, false)
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
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(a1, null);
    				}
    			}

    			if (dirty & /*current*/ 4) {
    				toggle_class(a1, "selected", /*current*/ ctx[2] === "collections");
    			}

    			if (dirty & /*current*/ 4) {
    				toggle_class(a2, "selected", /*current*/ ctx[2] === "categories");
    			}

    			if (dirty & /*current*/ 4) {
    				toggle_class(a3, "selected", /*current*/ ctx[2] === "settings");
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
    			if_block.d();
    			destroy_component(router);
    			if (detaching && div6_transition) div6_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(110:25) ",
    		ctx
    	});

    	return block;
    }

    // (98:0) {#if loading}
    function create_if_block$7(ctx) {
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
    			if (img.src !== (img_src_value = "assets/img/rocket-planet.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$a, 101, 0, 2268);
    			attr_dev(div0, "class", "clear");
    			add_location(div0, file$a, 102, 0, 2311);
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$a, 104, 2, 2382);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			add_location(div1, file$a, 103, 0, 2337);
    			attr_dev(div2, "id", "loading");
    			attr_dev(div2, "class", "text-center");
    			add_location(div2, file$a, 99, 0, 2228);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(98:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (120:1) {#each data.collections as item}
    function create_each_block$6(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[10].title + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*item*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/list/" + /*item*/ ctx[10].slug);
    			toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[10].title);
    			add_location(a, file$a, 121, 1, 2801);
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
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[10].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "/#/list/" + /*item*/ ctx[10].slug)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*current, data*/ 5) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[10].title);
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
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(120:1) {#each data.collections as item}",
    		ctx
    	});

    	return block;
    }

    // (132:98) {:else}
    function create_else_block$3(ctx) {
    	let t_value = /*data*/ ctx[0].settings.collections_label + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].settings.collections_label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(132:98) {:else}",
    		ctx
    	});

    	return block;
    }

    // (132:44) {#if data.settings.collections_label == ''}
    function create_if_block_2$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("collections");
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
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(132:44) {#if data.settings.collections_label == ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
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
    	const if_block_creators = [create_if_block$7, create_if_block_1$5, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return 0;
    		if (/*routes*/ ctx[1] && /*data*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			script0 = element("script");
    			script1 = element("script");
    			link1 = element("link");
    			script2 = element("script");
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css");
    			add_location(link0, file$a, 1, 1, 15);
    			if (script0.src !== (script0_src_value = "https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$a, 2, 1, 123);
    			if (script1.src !== (script1_src_value = "https://cdn.jsdelivr.net/npm/@taufik-nurrohman/rich-text-editor@1.3.1/rich-text-editor.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$a, 3, 1, 220);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "https://unpkg.com/easymde/dist/easymde.min.css");
    			add_location(link1, file$a, 4, 1, 335);
    			if (script2.src !== (script2_src_value = "https://unpkg.com/easymde/dist/easymde.min.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$a, 5, 1, 414);
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
    			detach_dev(link0);
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(link1);
    			detach_dev(script2);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots("App", slots, []);
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
    			"/": wrap({ component: Home, props: { data } }),
    			"/list/:cat": wrap({ component: List, props: { data } }),
    			"/edit/:cat/:id": wrap({ component: Edit, props: { data } }),
    			"/collections/:id": wrap({
    				component: EditCollection,
    				props: { data }
    			}),
    			"/categories": wrap({ component: Categories, props: { data } }),
    			"/settings": wrap({ component: Settings, props: { data } }),
    			// Catch-all
    			// This is optional, but if present it must be the last
    			"*": NotFound
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, current = false);
    	const click_handler_1 = item => $$invalidate(2, current = item.title);
    	const click_handler_2 = () => $$invalidate(2, current = "collections");
    	const click_handler_3 = () => $$invalidate(2, current = "categories");
    	const click_handler_4 = () => $$invalidate(2, current = "settings");

    	$$self.$capture_state = () => ({
    		fade,
    		onMount,
    		Router,
    		wrap,
    		Home,
    		List,
    		Edit,
    		EditCollection,
    		Categories,
    		Settings,
    		NotFound,
    		data,
    		showApp,
    		routes,
    		current,
    		loading
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("showApp" in $$props) showApp = $$props.showApp;
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("current" in $$props) $$invalidate(2, current = $$props.current);
    		if ("loading" in $$props) $$invalidate(3, loading = $$props.loading);
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
    		click_handler_4
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
