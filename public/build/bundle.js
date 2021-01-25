
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
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (97:2) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let a_href_value;

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[12].title == "") return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			attr_dev(a, "href", a_href_value = "/#/edit/" + /*cat*/ ctx[0] + "/" + /*item*/ ctx[12].id);
    			add_location(a, file$1, 97, 2, 2280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if_block.m(a, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(a, null);
    				}
    			}

    			if (dirty & /*cat, items*/ 3 && a_href_value !== (a_href_value = "/#/edit/" + /*cat*/ ctx[0] + "/" + /*item*/ ctx[12].id)) {
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
    		source: "(97:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#if cat == 'collections'}
    function create_if_block_3(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[12].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/collections/" + /*item*/ ctx[12].id);
    			add_location(a, file$1, 95, 2, 2216);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[12].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*items*/ 2 && a_href_value !== (a_href_value = "/#/collections/" + /*item*/ ctx[12].id)) {
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
    		source: "(95:2) {#if cat == 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (98:64) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*item*/ ctx[12].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[12].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(98:64) {:else}",
    		ctx
    	});

    	return block;
    }

    // (98:36) {#if item.title==''}
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
    		source: "(98:36) {#if item.title==''}",
    		ctx
    	});

    	return block;
    }

    // (102:2) {#if cat !== 'collections'}
    function create_if_block_2(ctx) {
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[9](/*item*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "bi bi-trash");
    			add_location(i, file$1, 102, 83, 2534);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$1, 102, 2, 2453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(102:2) {#if cat !== 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (91:0) {#each items as item}
    function create_each_block(ctx) {
    	let li;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*cat*/ ctx[0] == "collections") return create_if_block_3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*cat*/ ctx[0] !== "collections" && create_if_block_2(ctx);

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
    			add_location(div0, file$1, 93, 2, 2125);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$1, 100, 2, 2390);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$1, 92, 2, 2105);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$1, 91, 2, 2074);
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

    			if (/*cat*/ ctx[0] !== "collections") {
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
    		source: "(91:0) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (112:0) {#if addColl}
    function create_if_block$1(ctx) {
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h5;
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
    	let t9;
    	let div3;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Add Collection";
    			t1 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			b = element("b");
    			b.textContent = "Collection Name";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			div1 = element("div");
    			div1.textContent = "Plural, lowercase, no spaces (e.g. 'entries', 'pages')";
    			t9 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Add Collection";
    			attr_dev(h5, "class", "modal-title");
    			add_location(h5, file$1, 118, 8, 2831);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 120, 10, 2970);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$1, 119, 8, 2883);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$1, 117, 6, 2796);
    			add_location(b, file$1, 130, 2, 3176);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "coll-title");
    			add_location(input, file$1, 131, 6, 3205);
    			attr_dev(div1, "class", "description-sub");
    			add_location(div1, file$1, 132, 10, 3308);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$1, 123, 6, 3082);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$1, 135, 8, 3452);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$1, 134, 6, 3417);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$1, 116, 4, 2762);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$1, 115, 2, 2715);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			add_location(div6, file$1, 114, 0, 2665);
    			attr_dev(div7, "class", "backdrop");
    			add_location(div7, file$1, 112, 0, 2641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h5);
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
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*saveCollection*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*error*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(112:0) {#if addColl}",
    		ctx
    	});

    	return block;
    }

    // (126:0) {#if error}
    function create_if_block_1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*error*/ ctx[3]);
    			attr_dev(div, "class", "alert alert-danger");
    			add_location(div, file$1, 126, 0, 3120);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 8) set_data_dev(t, /*error*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(126:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
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
    	let t4;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*addColl*/ ctx[2] && create_if_block$1(ctx);

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

    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file$1, 81, 0, 1852);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$1, 80, 0, 1832);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$1, 84, 0, 1905);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$1, 83, 0, 1874);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$1, 79, 0, 1807);
    			attr_dev(ul, "class", "list-group entries-list");
    			add_location(ul, file$1, 89, 0, 2013);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$1, 88, 0, 1991);
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
    				dispose = listen_dev(button, "click", /*addItem*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cat*/ 1) set_data_dev(t0, /*cat*/ ctx[0]);

    			if (dirty & /*deleteItem, items, cat*/ 35) {
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

    			if (/*addColl*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
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

    	function addItem() {
    		if (cat == "collections") {
    			$$invalidate(2, addColl = true);
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
    			$$invalidate(7, data[cat] = data[cat].filter(x => x.id !== id), data);
    			(($$invalidate(7, data), $$invalidate(8, params)), $$invalidate(0, cat));
    		}
    	}

    	function saveCollection() {
    		let val = slugifyTitle();

    		if (val.length < 3) {
    			$$invalidate(3, error = "Collection name should be at least 3 characters long");
    		} else if (val in data) {
    			$$invalidate(3, error = "Collection already exists");
    		} else {
    			let newItem = {};
    			newItem.id = Date.now();
    			newItem.title = pluralize.plural(val);
    			newItem.singular = pluralize.singular(val);
    			newItem.fields = [];
    			data.collections.push(newItem);
    			$$invalidate(7, data[val] = [], data);
    			window.renderData(data);
    			window.location = "/#/collections/" + newItem.id;
    		}
    	}

    	const writable_props = ["params", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => deleteItem(item.id);
    	const click_handler_1 = () => $$invalidate(2, addColl = false);
    	const keyup_handler = () => slugifyTitle();

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(8, params = $$props.params);
    		if ("data" in $$props) $$invalidate(7, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		params,
    		data,
    		cat,
    		items,
    		addColl,
    		error,
    		addItem,
    		deleteItem,
    		saveCollection,
    		slugifyTitle
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(8, params = $$props.params);
    		if ("data" in $$props) $$invalidate(7, data = $$props.data);
    		if ("cat" in $$props) $$invalidate(0, cat = $$props.cat);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("addColl" in $$props) $$invalidate(2, addColl = $$props.addColl);
    		if ("error" in $$props) $$invalidate(3, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, cat, data*/ 385) {
    			 if (params.cat) {
    				$$invalidate(0, cat = params.cat);

    				// check if object key exists, else create empty array
    				if (cat in data) {
    					$$invalidate(1, items = data[cat]);
    				} else {
    					$$invalidate(7, data[cat] = [], data);
    					$$invalidate(1, items = data[cat]);
    				}
    			}
    		}
    	};

    	return [
    		cat,
    		items,
    		addColl,
    		error,
    		addItem,
    		deleteItem,
    		saveCollection,
    		data,
    		params,
    		click_handler,
    		click_handler_1,
    		keyup_handler
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 8, data: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[8] === undefined && !("params" in props)) {
    			console.warn("<List> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[7] === undefined && !("data" in props)) {
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
    			add_location(textarea, file$2, 29, 0, 572);
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
    				element: document.getElementById("mde-" + key)
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

    /* src/widgets/Textarea.svelte generated by Svelte v3.31.2 */

    const file$3 = "src/widgets/Textarea.svelte";

    function create_fragment$4(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "class", "form-control");
    			add_location(textarea, file$3, 4, 0, 35);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { val: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Textarea",
    			options,
    			id: create_fragment$4.name
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

    /* src/routes/Edit.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/routes/Edit.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[17] = list;
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (63:0) {#if collection}
    function create_if_block$2(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0;
    	let t1_value = /*collection*/ ctx[3].singular + "";
    	let t1;
    	let t2;
    	let div1;
    	let button;
    	let t3;
    	let t4;
    	let div3;
    	let b;
    	let t6;
    	let input;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*loading*/ ctx[4] && create_if_block_5(ctx);
    	let each_value = /*collection*/ ctx[3].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			button = element("button");
    			if (if_block) if_block.c();
    			t3 = text("  Save");
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

    			add_location(h4, file$4, 67, 0, 1572);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$4, 66, 0, 1552);
    			attr_dev(button, "class", "btn btn-dark btn-add");
    			add_location(button, file$4, 70, 0, 1646);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$4, 69, 0, 1615);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$4, 65, 0, 1527);
    			add_location(b, file$4, 76, 0, 1866);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$4, 77, 2, 1881);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$4, 74, 0, 1843);
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
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t3);
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
    			if ((!current || dirty & /*collection*/ 8) && t1_value !== (t1_value = /*collection*/ ctx[3].singular + "")) set_data_dev(t1, t1_value);

    			if (/*loading*/ ctx[4]) {
    				if (if_block) ; else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(button, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data, cat, index*/ 7 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]].title);
    			}

    			if (dirty & /*collection, data, cat, index*/ 15) {
    				each_value = /*collection*/ ctx[3].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(63:0) {#if collection}",
    		ctx
    	});

    	return block;
    }

    // (71:55) {#if loading}
    function create_if_block_5(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$4, 70, 68, 1714);
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(71:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (83:2) {#if field.description}
    function create_if_block_4$1(ctx) {
    	let div;
    	let t_value = /*field*/ ctx[16].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "description");
    			add_location(div, file$4, 83, 2, 2052);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collection*/ 8 && t_value !== (t_value = /*field*/ ctx[16].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(83:2) {#if field.description}",
    		ctx
    	});

    	return block;
    }

    // (87:2) {#if field.type=='txt'}
    function create_if_block_3$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[9].call(input, /*field*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$4, 87, 2, 2140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, cat, index, collection*/ 15 && input.value !== /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title]) {
    				set_input_value(input, /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title]);
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(87:2) {#if field.type=='txt'}",
    		ctx
    	});

    	return block;
    }

    // (91:2) {#if field.type=='txta'}
    function create_if_block_2$1(ctx) {
    	let textarea;
    	let updating_val;
    	let current;

    	function textarea_val_binding(value) {
    		/*textarea_val_binding*/ ctx[10].call(null, value, /*field*/ ctx[16]);
    	}

    	let textarea_props = {};

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title] !== void 0) {
    		textarea_props.val = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title];
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
    				textarea_changes.val = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title];
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(91:2) {#if field.type=='txta'}",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#if field.type=='mde'}
    function create_if_block_1$1(ctx) {
    	let markdown;
    	let updating_key;
    	let updating_html;
    	let current;

    	function markdown_key_binding(value) {
    		/*markdown_key_binding*/ ctx[11].call(null, value, /*field*/ ctx[16]);
    	}

    	function markdown_html_binding(value) {
    		/*markdown_html_binding*/ ctx[12].call(null, value, /*field*/ ctx[16]);
    	}

    	let markdown_props = {};

    	if (/*field*/ ctx[16].title !== void 0) {
    		markdown_props.key = /*field*/ ctx[16].title;
    	}

    	if (/*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title] !== void 0) {
    		markdown_props.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title];
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
    				markdown_changes.key = /*field*/ ctx[16].title;
    				add_flush_callback(() => updating_key = false);
    			}

    			if (!updating_html && dirty & /*data, cat, index, collection*/ 15) {
    				updating_html = true;
    				markdown_changes.html = /*data*/ ctx[0][/*cat*/ ctx[1]][/*index*/ ctx[2]][/*field*/ ctx[16].title];
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(95:2) {#if field.type=='mde'}",
    		ctx
    	});

    	return block;
    }

    // (80:2) {#each collection.fields as field}
    function create_each_block$1(ctx) {
    	let b;
    	let t0_value = /*field*/ ctx[16].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let if_block3_anchor;
    	let current;
    	let if_block0 = /*field*/ ctx[16].description && create_if_block_4$1(ctx);
    	let if_block1 = /*field*/ ctx[16].type == "txt" && create_if_block_3$1(ctx);
    	let if_block2 = /*field*/ ctx[16].type == "txta" && create_if_block_2$1(ctx);
    	let if_block3 = /*field*/ ctx[16].type == "mde" && create_if_block_1$1(ctx);

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
    			if_block3_anchor = empty();
    			add_location(b, file$4, 81, 2, 2003);
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
    			insert_dev(target, if_block3_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*collection*/ 8) && t0_value !== (t0_value = /*field*/ ctx[16].title + "")) set_data_dev(t0, t0_value);

    			if (/*field*/ ctx[16].description) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*field*/ ctx[16].type == "txt") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*field*/ ctx[16].type == "txta") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2$1(ctx);
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

    			if (/*field*/ ctx[16].type == "mde") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*collection*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			transition_out(if_block3);
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
    			if (detaching) detach_dev(if_block3_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(80:2) {#each collection.fields as field}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*collection*/ ctx[3] && create_if_block$2(ctx);

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
    					if_block = create_if_block$2(ctx);
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
    		opts.content = data;

    		call_api("github/set-data", opts).then(function (res) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Edit> was created with unknown prop '${key}'`);
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

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		Markdown,
    		Textarea,
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
    				$$invalidate(3, collection = data.collections.filter(x => x.title == cat)[0]);
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
    		markdown_html_binding
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 6, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
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

    const { console: console_1$2 } = globals;
    const file$5 = "src/routes/EditCollection.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (82:55) {#if loading}
    function create_if_block_1$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "spinner-border spinner-border-sm");
    			attr_dev(span, "role", "status");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$5, 81, 68, 2027);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(82:55) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#if data.collections[index].fields}
    function create_if_block$3(ctx) {
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			add_location(input, file$5, 106, 23, 2645);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$5, 106, 4, 2626);
    			attr_dev(div1, "class", "description mt-2");
    			add_location(div1, file$5, 107, 23, 2745);
    			attr_dev(div2, "class", "col-8");
    			add_location(div2, file$5, 107, 4, 2726);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$5, 105, 4, 2604);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$5, 104, 4, 2571);
    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$5, 101, 4, 2541);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(101:4) {#if data.collections[index].fields}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#each data.collections[index].fields as field, i}
    function create_each_block$2(ctx) {
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
    	let t5;
    	let div3;
    	let button;
    	let i_1;
    	let t6;
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
    			option2.textContent = "Markdown";
    			t5 = space();
    			div3 = element("div");
    			button = element("button");
    			i_1 = element("i");
    			t6 = space();
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control mb-0");
    			attr_dev(input0, "placeholder", "field name");
    			add_location(input0, file$5, 116, 25, 2984);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$5, 116, 6, 2965);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control mb-0");
    			attr_dev(input1, "placeholder", "field description (optional)");
    			add_location(input1, file$5, 117, 25, 3155);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$5, 117, 6, 3136);
    			option0.__value = "txt";
    			option0.value = option0.__value;
    			add_location(option0, file$5, 120, 6, 3384);
    			option1.__value = "txta";
    			option1.value = option1.__value;
    			add_location(option1, file$5, 121, 6, 3424);
    			option2.__value = "mde";
    			option2.value = option2.__value;
    			add_location(option2, file$5, 122, 6, 3469);
    			attr_dev(select, "class", "form-control mb-0");
    			if (/*field*/ ctx[19].type === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$5, 119, 6, 3317);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file$5, 118, 6, 3291);
    			attr_dev(i_1, "class", "bi bi-trash");
    			add_location(i_1, file$5, 128, 6, 3673);
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			add_location(button, file$5, 127, 6, 3580);
    			attr_dev(div3, "class", "col-2 text-right");
    			add_location(div3, file$5, 126, 6, 3543);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$5, 115, 6, 2941);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$5, 114, 6, 2906);
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
    			select_option(select, /*field*/ ctx[19].type);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, i_1);
    			append_dev(li, t6);

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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(114:4) {#each data.collections[index].fields as field, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let span;
    	let t1;
    	let t2_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "";
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
    	let if_block0 = /*loading*/ ctx[2] && create_if_block_1$2(ctx);
    	let if_block1 = /*data*/ ctx[0].collections[/*index*/ ctx[1]].fields && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			span = element("span");
    			span.textContent = "Edit Collection:";
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
    			div3.textContent = "Fields in this collection";
    			t9 = space();
    			div5 = element("div");
    			button1 = element("button");
    			i = element("i");
    			t10 = text(" Add Field");
    			t11 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "medium-hide");
    			add_location(span, file$5, 78, 4, 1834);
    			add_location(h4, file$5, 78, 0, 1830);
    			attr_dev(div0, "class", "col-6");
    			add_location(div0, file$5, 77, 0, 1810);
    			attr_dev(button0, "class", "btn btn-dark btn-add");
    			add_location(button0, file$5, 81, 0, 1959);
    			attr_dev(div1, "class", "col-6 text-right");
    			add_location(div1, file$5, 80, 0, 1928);
    			attr_dev(div2, "class", "row topnav");
    			add_location(div2, file$5, 76, 0, 1785);
    			add_location(b, file$5, 91, 4, 2225);
    			attr_dev(div3, "class", "description");
    			add_location(div3, file$5, 92, 4, 2243);
    			attr_dev(div4, "class", "col-6");
    			add_location(div4, file$5, 90, 2, 2201);
    			attr_dev(i, "class", "bi bi-plus-circle");
    			add_location(i, file$5, 95, 83, 2425);
    			attr_dev(button1, "class", "btn btn-outline-dark btn-add float-right");
    			add_location(button1, file$5, 95, 4, 2346);
    			attr_dev(div5, "class", "col-6 text-right");
    			add_location(div5, file$5, 94, 2, 2311);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$5, 89, 0, 2181);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$5, 85, 0, 2156);
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
    			if (dirty & /*data, index*/ 3 && t2_value !== (t2_value = /*data*/ ctx[0].collections[/*index*/ ctx[1]].title + "")) set_data_dev(t2, t2_value);

    			if (/*loading*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(button0, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*data*/ ctx[0].collections[/*index*/ ctx[1]].fields) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$3(ctx);
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
    	let loading = false;

    	function save() {
    		$$invalidate(2, loading = true);
    		let opts = {};
    		opts.path = "data.json";
    		opts.type = "json";
    		opts.content = data;

    		call_api("github/set-data", opts).then(function (res) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<EditCollection> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { params: 7, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditCollection",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !("params" in props)) {
    			console_1$2.warn("<EditCollection> was created without expected prop 'params'");
    		}

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1$2.warn("<EditCollection> was created without expected prop 'data'");
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

    const { console: console_1$3 } = globals;
    const file$6 = "src/App.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (153:0) {:else}
    function create_else_block$2(ctx) {
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
    			add_location(img, file$6, 154, 3, 3221);
    			attr_dev(i0, "class", "bi bi-google");
    			add_location(i0, file$6, 155, 85, 3349);
    			attr_dev(button0, "onclick", "login('google');");
    			attr_dev(button0, "class", "btn btn-outline-dark w-100");
    			attr_dev(button0, "id", "log-in");
    			add_location(button0, file$6, 155, 3, 3267);
    			attr_dev(i1, "class", "bi bi-twitter");
    			add_location(i1, file$6, 156, 90, 3497);
    			attr_dev(button1, "onclick", "login('twitter');");
    			attr_dev(button1, "class", "btn btn-outline-dark w-100 mt-2");
    			attr_dev(button1, "id", "log-in");
    			add_location(button1, file$6, 156, 2, 3409);
    			attr_dev(div, "id", "log-in-screen");
    			add_location(div, file$6, 153, 1, 3193);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(153:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (120:25) 
    function create_if_block_1$3(ctx) {
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
    	let a2;
    	let t5;
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
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

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
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "collections";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Log Out";
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(router.$$.fragment);
    			if (img.src !== (img_src_value = "assets/img/rocketlogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			add_location(img, file$6, 124, 86, 2562);
    			attr_dev(a0, "href", "/#/");
    			toggle_class(a0, "selected", /*current*/ ctx[2] === false);
    			add_location(a0, file$6, 124, 0, 2476);
    			attr_dev(div0, "id", "collections-nav");
    			add_location(div0, file$6, 127, 0, 2640);
    			attr_dev(a1, "href", "/#/list/collections");
    			toggle_class(a1, "selected", /*current*/ ctx[2] === "collections");
    			add_location(a1, file$6, 135, 1, 2893);
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$6, 137, 1, 3029);
    			attr_dev(div1, "class", "side-nav");
    			add_location(div1, file$6, 126, 0, 2617);
    			attr_dev(div2, "class", "side");
    			add_location(div2, file$6, 122, 0, 2456);
    			attr_dev(div3, "class", "col-md-2");
    			add_location(div3, file$6, 121, 0, 2433);
    			attr_dev(div4, "class", "main");
    			add_location(div4, file$6, 145, 0, 3121);
    			attr_dev(div5, "class", "col-md-10");
    			add_location(div5, file$6, 143, 0, 3096);
    			attr_dev(div6, "class", "row no-gutters page");
    			add_location(div6, file$6, 120, 0, 2383);
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
    			append_dev(div1, t3);
    			append_dev(div1, a2);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			mount_component(router, div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(a1, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(a2, "click", /*logout*/ ctx[4], false, false, false)
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
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    			destroy_component(router);
    			if (detaching && div6_transition) div6_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(120:25) ",
    		ctx
    	});

    	return block;
    }

    // (108:0) {#if loading}
    function create_if_block$4(ctx) {
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
    			add_location(img, file$6, 111, 0, 2187);
    			attr_dev(div0, "class", "clear");
    			add_location(div0, file$6, 112, 0, 2230);
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$6, 114, 2, 2301);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			add_location(div1, file$6, 113, 0, 2256);
    			attr_dev(div2, "id", "loading");
    			attr_dev(div2, "class", "text-center");
    			add_location(div2, file$6, 109, 0, 2147);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(108:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (130:1) {#if item.title !== 'collections'}
    function create_if_block_2$2(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[9].title + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*item*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "/#/list/" + /*item*/ ctx[9].title);
    			toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[9].title);
    			add_location(a, file$6, 130, 1, 2738);
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
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[9].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "/#/list/" + /*item*/ ctx[9].title)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*current, data*/ 5) {
    				toggle_class(a, "selected", /*current*/ ctx[2] === /*item*/ ctx[9].title);
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
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(130:1) {#if item.title !== 'collections'}",
    		ctx
    	});

    	return block;
    }

    // (129:1) {#each data.collections as item}
    function create_each_block$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*item*/ ctx[9].title !== "collections" && create_if_block_2$2(ctx);

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
    			if (/*item*/ ctx[9].title !== "collections") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(129:1) {#each data.collections as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let link;
    	let script;
    	let script_src_value;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$3, create_else_block$2];
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
    			link = element("link");
    			script = element("script");
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css");
    			add_location(link, file$6, 1, 1, 15);
    			if (script.src !== (script_src_value = "https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$6, 2, 1, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			append_dev(document.head, script);
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
    			detach_dev(link);
    			detach_dev(script);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
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
    	let loading = true;

    	onMount(async () => {
    		firebase.auth().onAuthStateChanged(async function (user) {
    			if (user) {
    				//console.log(user);
    				user.getIdToken().then(async function (idToken) {
    					console.log("Signed in");
    					const res = await fetch(`data.json`);
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
    						// Catch-all
    						// This is optional, but if present it must be the last
    						"*": NotFound
    					});

    					setTimeout(
    						function () {
    							$$invalidate(3, loading = false);
    						},
    						1000
    					);
    				});
    			} else {
    				console.log("User not signed in");

    				setTimeout(
    					function () {
    						$$invalidate(3, loading = false);
    					},
    					1000
    				);
    			}
    		});
    	});

    	function logout() {
    		firebase.auth().signOut().then(() => {
    			// Sign-out successful.
    			console.log("Signed out");

    			$$invalidate(0, data = false);
    			$$invalidate(1, routes = false);
    		}).catch(error => {
    			console.log(error);
    		});
    	}

    	// allows force re-rendering
    	window.renderData = function (mydata) {
    		$$invalidate(0, data = mydata);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, current = false);
    	const click_handler_1 = item => $$invalidate(2, current = item.title);
    	const click_handler_2 = () => $$invalidate(2, current = "collections");

    	$$self.$capture_state = () => ({
    		fade,
    		onMount,
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
    		current,
    		loading,
    		logout
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
    		logout,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
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
