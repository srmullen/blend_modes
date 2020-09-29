
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':31245/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    const outroing = new Set();
    let outros;
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var gpuBrowser = createCommonjsModule(function (module, exports) {
    /**
     * gpu.js
     * http://gpu.rocks/
     *
     * GPU Accelerated JavaScript
     *
     * @version 2.9.4
     * @date Sat May 02 2020 11:46:49 GMT-0400 (Eastern Daylight Time)
     *
     * @license MIT
     * The MIT License
     *
     * Copyright (c) 2020 gpu.js Team
     */(function(f){{module.exports=f();}})(function(){return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof commonjsRequire&&commonjsRequire;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t);}return n[i].exports}for(var u="function"==typeof commonjsRequire&&commonjsRequire,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    (function (global, factory) {
      typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
      
      (global = global || self, factory(global.acorn = {}));
    }(this, function (exports) {

      var reservedWords = {
        3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
        5: "class enum extends super const export import",
        6: "enum",
        strict: "implements interface let package private protected public static yield",
        strictBind: "eval arguments"
      };


      var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

      var keywords = {
        5: ecma5AndLessKeywords,
        "5module": ecma5AndLessKeywords + " export import",
        6: ecma5AndLessKeywords + " const class extends export import super"
      };

      var keywordRelationalOperator = /^in(stanceof)?$/;


      var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7c6\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab67\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
      var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

      var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
      var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

      nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;


      var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,14,29,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,28,43,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,14,35,477,28,11,0,9,21,155,22,13,52,76,44,33,24,27,35,30,0,12,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,21,0,33,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,14,0,72,26,230,43,117,63,32,0,161,7,3,38,17,0,2,0,29,0,11,39,8,0,22,0,12,45,20,0,35,56,264,8,2,36,18,0,50,29,113,6,2,1,2,37,22,0,26,5,2,1,2,31,15,0,328,18,270,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,689,63,129,74,6,0,67,12,65,1,2,0,29,6135,9,754,9486,286,50,2,18,3,9,395,2309,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,2357,44,11,6,17,0,370,43,1301,196,60,67,8,0,1205,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,15,7472,3104,541];

      var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,574,3,9,9,525,10,176,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,6,1,45,0,13,2,49,13,9,3,4,9,83,11,7,0,161,11,6,9,7,3,56,1,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,5,0,82,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,243,14,166,9,232,6,3,6,4,0,29,9,41,6,2,3,9,0,10,10,47,15,406,7,2,7,17,9,57,21,2,13,123,5,4,0,2,1,2,6,2,0,9,9,49,4,2,1,2,4,9,9,330,3,19306,9,135,4,60,6,26,9,1014,0,2,54,8,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,262,6,10,9,419,13,1495,6,110,6,6,9,792487,239];

      function isInAstralSet(code, set) {
        var pos = 0x10000;
        for (var i = 0; i < set.length; i += 2) {
          pos += set[i];
          if (pos > code) { return false }
          pos += set[i + 1];
          if (pos >= code) { return true }
        }
      }


      function isIdentifierStart(code, astral) {
        if (code < 65) { return code === 36 }
        if (code < 91) { return true }
        if (code < 97) { return code === 95 }
        if (code < 123) { return true }
        if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
        if (astral === false) { return false }
        return isInAstralSet(code, astralIdentifierStartCodes)
      }


      function isIdentifierChar(code, astral) {
        if (code < 48) { return code === 36 }
        if (code < 58) { return true }
        if (code < 65) { return false }
        if (code < 91) { return true }
        if (code < 97) { return code === 95 }
        if (code < 123) { return true }
        if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
        if (astral === false) { return false }
        return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
      }





      var TokenType = function TokenType(label, conf) {
        if ( conf === void 0 ) conf = {};

        this.label = label;
        this.keyword = conf.keyword;
        this.beforeExpr = !!conf.beforeExpr;
        this.startsExpr = !!conf.startsExpr;
        this.isLoop = !!conf.isLoop;
        this.isAssign = !!conf.isAssign;
        this.prefix = !!conf.prefix;
        this.postfix = !!conf.postfix;
        this.binop = conf.binop || null;
        this.updateContext = null;
      };

      function binop(name, prec) {
        return new TokenType(name, {beforeExpr: true, binop: prec})
      }
      var beforeExpr = {beforeExpr: true}, startsExpr = {startsExpr: true};


      var keywords$1 = {};

      function kw(name, options) {
        if ( options === void 0 ) options = {};

        options.keyword = name;
        return keywords$1[name] = new TokenType(name, options)
      }

      var types = {
        num: new TokenType("num", startsExpr),
        regexp: new TokenType("regexp", startsExpr),
        string: new TokenType("string", startsExpr),
        name: new TokenType("name", startsExpr),
        eof: new TokenType("eof"),

        bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
        bracketR: new TokenType("]"),
        braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
        braceR: new TokenType("}"),
        parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
        parenR: new TokenType(")"),
        comma: new TokenType(",", beforeExpr),
        semi: new TokenType(";", beforeExpr),
        colon: new TokenType(":", beforeExpr),
        dot: new TokenType("."),
        question: new TokenType("?", beforeExpr),
        arrow: new TokenType("=>", beforeExpr),
        template: new TokenType("template"),
        invalidTemplate: new TokenType("invalidTemplate"),
        ellipsis: new TokenType("...", beforeExpr),
        backQuote: new TokenType("`", startsExpr),
        dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),


        eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
        assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
        incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
        prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
        logicalOR: binop("||", 1),
        logicalAND: binop("&&", 2),
        bitwiseOR: binop("|", 3),
        bitwiseXOR: binop("^", 4),
        bitwiseAND: binop("&", 5),
        equality: binop("==/!=/===/!==", 6),
        relational: binop("</>/<=/>=", 7),
        bitShift: binop("<</>>/>>>", 8),
        plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
        modulo: binop("%", 10),
        star: binop("*", 10),
        slash: binop("/", 10),
        starstar: new TokenType("**", {beforeExpr: true}),

        _break: kw("break"),
        _case: kw("case", beforeExpr),
        _catch: kw("catch"),
        _continue: kw("continue"),
        _debugger: kw("debugger"),
        _default: kw("default", beforeExpr),
        _do: kw("do", {isLoop: true, beforeExpr: true}),
        _else: kw("else", beforeExpr),
        _finally: kw("finally"),
        _for: kw("for", {isLoop: true}),
        _function: kw("function", startsExpr),
        _if: kw("if"),
        _return: kw("return", beforeExpr),
        _switch: kw("switch"),
        _throw: kw("throw", beforeExpr),
        _try: kw("try"),
        _var: kw("var"),
        _const: kw("const"),
        _while: kw("while", {isLoop: true}),
        _with: kw("with"),
        _new: kw("new", {beforeExpr: true, startsExpr: true}),
        _this: kw("this", startsExpr),
        _super: kw("super", startsExpr),
        _class: kw("class", startsExpr),
        _extends: kw("extends", beforeExpr),
        _export: kw("export"),
        _import: kw("import", startsExpr),
        _null: kw("null", startsExpr),
        _true: kw("true", startsExpr),
        _false: kw("false", startsExpr),
        _in: kw("in", {beforeExpr: true, binop: 7}),
        _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
        _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
        _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
        _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
      };


      var lineBreak = /\r\n?|\n|\u2028|\u2029/;
      var lineBreakG = new RegExp(lineBreak.source, "g");

      function isNewLine(code, ecma2019String) {
        return code === 10 || code === 13 || (!ecma2019String && (code === 0x2028 || code === 0x2029))
      }

      var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

      var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

      var ref = Object.prototype;
      var hasOwnProperty = ref.hasOwnProperty;
      var toString = ref.toString;


      function has(obj, propName) {
        return hasOwnProperty.call(obj, propName)
      }

      var isArray = Array.isArray || (function (obj) { return (
        toString.call(obj) === "[object Array]"
      ); });

      function wordsRegexp(words) {
        return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
      }


      var Position = function Position(line, col) {
        this.line = line;
        this.column = col;
      };

      Position.prototype.offset = function offset (n) {
        return new Position(this.line, this.column + n)
      };

      var SourceLocation = function SourceLocation(p, start, end) {
        this.start = start;
        this.end = end;
        if (p.sourceFile !== null) { this.source = p.sourceFile; }
      };


      function getLineInfo(input, offset) {
        for (var line = 1, cur = 0;;) {
          lineBreakG.lastIndex = cur;
          var match = lineBreakG.exec(input);
          if (match && match.index < offset) {
            ++line;
            cur = match.index + match[0].length;
          } else {
            return new Position(line, offset - cur)
          }
        }
      }


      var defaultOptions = {
        ecmaVersion: 10,
        sourceType: "script",
        onInsertedSemicolon: null,
        onTrailingComma: null,
        allowReserved: null,
        allowReturnOutsideFunction: false,
        allowImportExportEverywhere: false,
        allowAwaitOutsideFunction: false,
        allowHashBang: false,
        locations: false,
        onToken: null,
        onComment: null,
        ranges: false,
        program: null,
        sourceFile: null,
        directSourceFile: null,
        preserveParens: false
      };


      function getOptions(opts) {
        var options = {};

        for (var opt in defaultOptions)
          { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

        if (options.ecmaVersion >= 2015)
          { options.ecmaVersion -= 2009; }

        if (options.allowReserved == null)
          { options.allowReserved = options.ecmaVersion < 5; }

        if (isArray(options.onToken)) {
          var tokens = options.onToken;
          options.onToken = function (token) { return tokens.push(token); };
        }
        if (isArray(options.onComment))
          { options.onComment = pushComment(options, options.onComment); }

        return options
      }

      function pushComment(options, array) {
        return function(block, text, start, end, startLoc, endLoc) {
          var comment = {
            type: block ? "Block" : "Line",
            value: text,
            start: start,
            end: end
          };
          if (options.locations)
            { comment.loc = new SourceLocation(this, startLoc, endLoc); }
          if (options.ranges)
            { comment.range = [start, end]; }
          array.push(comment);
        }
      }

      var
          SCOPE_TOP = 1,
          SCOPE_FUNCTION = 2,
          SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION,
          SCOPE_ASYNC = 4,
          SCOPE_GENERATOR = 8,
          SCOPE_ARROW = 16,
          SCOPE_SIMPLE_CATCH = 32,
          SCOPE_SUPER = 64,
          SCOPE_DIRECT_SUPER = 128;

      function functionFlags(async, generator) {
        return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
      }

      var
          BIND_NONE = 0, 
          BIND_VAR = 1, 
          BIND_LEXICAL = 2, 
          BIND_FUNCTION = 3, 
          BIND_SIMPLE_CATCH = 4, 
          BIND_OUTSIDE = 5; 

      var Parser = function Parser(options, input, startPos) {
        this.options = options = getOptions(options);
        this.sourceFile = options.sourceFile;
        this.keywords = wordsRegexp(keywords[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
        var reserved = "";
        if (options.allowReserved !== true) {
          for (var v = options.ecmaVersion;; v--)
            { if (reserved = reservedWords[v]) { break } }
          if (options.sourceType === "module") { reserved += " await"; }
        }
        this.reservedWords = wordsRegexp(reserved);
        var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
        this.reservedWordsStrict = wordsRegexp(reservedStrict);
        this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
        this.input = String(input);

        this.containsEsc = false;


        if (startPos) {
          this.pos = startPos;
          this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
          this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
        } else {
          this.pos = this.lineStart = 0;
          this.curLine = 1;
        }

        this.type = types.eof;
        this.value = null;
        this.start = this.end = this.pos;
        this.startLoc = this.endLoc = this.curPosition();

        this.lastTokEndLoc = this.lastTokStartLoc = null;
        this.lastTokStart = this.lastTokEnd = this.pos;

        this.context = this.initialContext();
        this.exprAllowed = true;

        this.inModule = options.sourceType === "module";
        this.strict = this.inModule || this.strictDirective(this.pos);

        this.potentialArrowAt = -1;

        this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
        this.labels = [];
        this.undefinedExports = {};

        if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
          { this.skipLineComment(2); }

        this.scopeStack = [];
        this.enterScope(SCOPE_TOP);

        this.regexpState = null;
      };

      var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true },allowSuper: { configurable: true },allowDirectSuper: { configurable: true },treatFunctionsAsVar: { configurable: true } };

      Parser.prototype.parse = function parse () {
        var node = this.options.program || this.startNode();
        this.nextToken();
        return this.parseTopLevel(node)
      };

      prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };
      prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };
      prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };
      prototypeAccessors.allowSuper.get = function () { return (this.currentThisScope().flags & SCOPE_SUPER) > 0 };
      prototypeAccessors.allowDirectSuper.get = function () { return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0 };
      prototypeAccessors.treatFunctionsAsVar.get = function () { return this.treatFunctionsAsVarInScope(this.currentScope()) };

      Parser.prototype.inNonArrowFunction = function inNonArrowFunction () { return (this.currentThisScope().flags & SCOPE_FUNCTION) > 0 };

      Parser.extend = function extend () {
          var plugins = [], len = arguments.length;
          while ( len-- ) plugins[ len ] = arguments[ len ];

        var cls = this;
        for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
        return cls
      };

      Parser.parse = function parse (input, options) {
        return new this(options, input).parse()
      };

      Parser.parseExpressionAt = function parseExpressionAt (input, pos, options) {
        var parser = new this(options, input, pos);
        parser.nextToken();
        return parser.parseExpression()
      };

      Parser.tokenizer = function tokenizer (input, options) {
        return new this(options, input)
      };

      Object.defineProperties( Parser.prototype, prototypeAccessors );

      var pp = Parser.prototype;


      var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)")/;
      pp.strictDirective = function(start) {
        for (;;) {
          skipWhiteSpace.lastIndex = start;
          start += skipWhiteSpace.exec(this.input)[0].length;
          var match = literal.exec(this.input.slice(start));
          if (!match) { return false }
          if ((match[1] || match[2]) === "use strict") { return true }
          start += match[0].length;

          skipWhiteSpace.lastIndex = start;
          start += skipWhiteSpace.exec(this.input)[0].length;
          if (this.input[start] === ";")
            { start++; }
        }
      };


      pp.eat = function(type) {
        if (this.type === type) {
          this.next();
          return true
        } else {
          return false
        }
      };


      pp.isContextual = function(name) {
        return this.type === types.name && this.value === name && !this.containsEsc
      };


      pp.eatContextual = function(name) {
        if (!this.isContextual(name)) { return false }
        this.next();
        return true
      };


      pp.expectContextual = function(name) {
        if (!this.eatContextual(name)) { this.unexpected(); }
      };


      pp.canInsertSemicolon = function() {
        return this.type === types.eof ||
          this.type === types.braceR ||
          lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
      };

      pp.insertSemicolon = function() {
        if (this.canInsertSemicolon()) {
          if (this.options.onInsertedSemicolon)
            { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
          return true
        }
      };


      pp.semicolon = function() {
        if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
      };

      pp.afterTrailingComma = function(tokType, notNext) {
        if (this.type === tokType) {
          if (this.options.onTrailingComma)
            { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
          if (!notNext)
            { this.next(); }
          return true
        }
      };


      pp.expect = function(type) {
        this.eat(type) || this.unexpected();
      };


      pp.unexpected = function(pos) {
        this.raise(pos != null ? pos : this.start, "Unexpected token");
      };

      function DestructuringErrors() {
        this.shorthandAssign =
        this.trailingComma =
        this.parenthesizedAssign =
        this.parenthesizedBind =
        this.doubleProto =
          -1;
      }

      pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
        if (!refDestructuringErrors) { return }
        if (refDestructuringErrors.trailingComma > -1)
          { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
        var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
        if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
      };

      pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
        if (!refDestructuringErrors) { return false }
        var shorthandAssign = refDestructuringErrors.shorthandAssign;
        var doubleProto = refDestructuringErrors.doubleProto;
        if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
        if (shorthandAssign >= 0)
          { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
        if (doubleProto >= 0)
          { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
      };

      pp.checkYieldAwaitInDefaultParams = function() {
        if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
          { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
        if (this.awaitPos)
          { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
      };

      pp.isSimpleAssignTarget = function(expr) {
        if (expr.type === "ParenthesizedExpression")
          { return this.isSimpleAssignTarget(expr.expression) }
        return expr.type === "Identifier" || expr.type === "MemberExpression"
      };

      var pp$1 = Parser.prototype;



      pp$1.parseTopLevel = function(node) {
        var exports = {};
        if (!node.body) { node.body = []; }
        while (this.type !== types.eof) {
          var stmt = this.parseStatement(null, true, exports);
          node.body.push(stmt);
        }
        if (this.inModule)
          { for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1)
            {
              var name = list[i];

              this.raiseRecoverable(this.undefinedExports[name].start, ("Export '" + name + "' is not defined"));
            } }
        this.adaptDirectivePrologue(node.body);
        this.next();
        node.sourceType = this.options.sourceType;
        return this.finishNode(node, "Program")
      };

      var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

      pp$1.isLet = function(context) {
        if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 91) { return true } 
        if (context) { return false }

        if (nextCh === 123) { return true } 
        if (isIdentifierStart(nextCh, true)) {
          var pos = next + 1;
          while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
          var ident = this.input.slice(next, pos);
          if (!keywordRelationalOperator.test(ident)) { return true }
        }
        return false
      };

      pp$1.isAsyncFunction = function() {
        if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
          { return false }

        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length;
        return !lineBreak.test(this.input.slice(this.pos, next)) &&
          this.input.slice(next, next + 8) === "function" &&
          (next + 8 === this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
      };


      pp$1.parseStatement = function(context, topLevel, exports) {
        var starttype = this.type, node = this.startNode(), kind;

        if (this.isLet(context)) {
          starttype = types._var;
          kind = "let";
        }


        switch (starttype) {
        case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
        case types._debugger: return this.parseDebuggerStatement(node)
        case types._do: return this.parseDoStatement(node)
        case types._for: return this.parseForStatement(node)
        case types._function:
          if ((context && (this.strict || context !== "if" && context !== "label")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
          return this.parseFunctionStatement(node, false, !context)
        case types._class:
          if (context) { this.unexpected(); }
          return this.parseClass(node, true)
        case types._if: return this.parseIfStatement(node)
        case types._return: return this.parseReturnStatement(node)
        case types._switch: return this.parseSwitchStatement(node)
        case types._throw: return this.parseThrowStatement(node)
        case types._try: return this.parseTryStatement(node)
        case types._const: case types._var:
          kind = kind || this.value;
          if (context && kind !== "var") { this.unexpected(); }
          return this.parseVarStatement(node, kind)
        case types._while: return this.parseWhileStatement(node)
        case types._with: return this.parseWithStatement(node)
        case types.braceL: return this.parseBlock(true, node)
        case types.semi: return this.parseEmptyStatement(node)
        case types._export:
        case types._import:
          if (this.options.ecmaVersion > 10 && starttype === types._import) {
            skipWhiteSpace.lastIndex = this.pos;
            var skip = skipWhiteSpace.exec(this.input);
            var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
            if (nextCh === 40) 
              { return this.parseExpressionStatement(node, this.parseExpression()) }
          }

          if (!this.options.allowImportExportEverywhere) {
            if (!topLevel)
              { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
            if (!this.inModule)
              { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
          }
          return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

        default:
          if (this.isAsyncFunction()) {
            if (context) { this.unexpected(); }
            this.next();
            return this.parseFunctionStatement(node, true, !context)
          }

          var maybeName = this.value, expr = this.parseExpression();
          if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
            { return this.parseLabeledStatement(node, maybeName, expr, context) }
          else { return this.parseExpressionStatement(node, expr) }
        }
      };

      pp$1.parseBreakContinueStatement = function(node, keyword) {
        var isBreak = keyword === "break";
        this.next();
        if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
        else if (this.type !== types.name) { this.unexpected(); }
        else {
          node.label = this.parseIdent();
          this.semicolon();
        }

        var i = 0;
        for (; i < this.labels.length; ++i) {
          var lab = this.labels[i];
          if (node.label == null || lab.name === node.label.name) {
            if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
            if (node.label && isBreak) { break }
          }
        }
        if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
        return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
      };

      pp$1.parseDebuggerStatement = function(node) {
        this.next();
        this.semicolon();
        return this.finishNode(node, "DebuggerStatement")
      };

      pp$1.parseDoStatement = function(node) {
        this.next();
        this.labels.push(loopLabel);
        node.body = this.parseStatement("do");
        this.labels.pop();
        this.expect(types._while);
        node.test = this.parseParenExpression();
        if (this.options.ecmaVersion >= 6)
          { this.eat(types.semi); }
        else
          { this.semicolon(); }
        return this.finishNode(node, "DoWhileStatement")
      };


      pp$1.parseForStatement = function(node) {
        this.next();
        var awaitAt = (this.options.ecmaVersion >= 9 && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction)) && this.eatContextual("await")) ? this.lastTokStart : -1;
        this.labels.push(loopLabel);
        this.enterScope(0);
        this.expect(types.parenL);
        if (this.type === types.semi) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
          return this.parseFor(node, null)
        }
        var isLet = this.isLet();
        if (this.type === types._var || this.type === types._const || isLet) {
          var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
          this.next();
          this.parseVar(init$1, true, kind);
          this.finishNode(init$1, "VariableDeclaration");
          if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1) {
            if (this.options.ecmaVersion >= 9) {
              if (this.type === types._in) {
                if (awaitAt > -1) { this.unexpected(awaitAt); }
              } else { node.await = awaitAt > -1; }
            }
            return this.parseForIn(node, init$1)
          }
          if (awaitAt > -1) { this.unexpected(awaitAt); }
          return this.parseFor(node, init$1)
        }
        var refDestructuringErrors = new DestructuringErrors;
        var init = this.parseExpression(true, refDestructuringErrors);
        if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
          if (this.options.ecmaVersion >= 9) {
            if (this.type === types._in) {
              if (awaitAt > -1) { this.unexpected(awaitAt); }
            } else { node.await = awaitAt > -1; }
          }
          this.toAssignable(init, false, refDestructuringErrors);
          this.checkLVal(init);
          return this.parseForIn(node, init)
        } else {
          this.checkExpressionErrors(refDestructuringErrors, true);
        }
        if (awaitAt > -1) { this.unexpected(awaitAt); }
        return this.parseFor(node, init)
      };

      pp$1.parseFunctionStatement = function(node, isAsync, declarationPosition) {
        this.next();
        return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
      };

      pp$1.parseIfStatement = function(node) {
        this.next();
        node.test = this.parseParenExpression();
        node.consequent = this.parseStatement("if");
        node.alternate = this.eat(types._else) ? this.parseStatement("if") : null;
        return this.finishNode(node, "IfStatement")
      };

      pp$1.parseReturnStatement = function(node) {
        if (!this.inFunction && !this.options.allowReturnOutsideFunction)
          { this.raise(this.start, "'return' outside of function"); }
        this.next();


        if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
        else { node.argument = this.parseExpression(); this.semicolon(); }
        return this.finishNode(node, "ReturnStatement")
      };

      pp$1.parseSwitchStatement = function(node) {
        this.next();
        node.discriminant = this.parseParenExpression();
        node.cases = [];
        this.expect(types.braceL);
        this.labels.push(switchLabel);
        this.enterScope(0);


        var cur;
        for (var sawDefault = false; this.type !== types.braceR;) {
          if (this.type === types._case || this.type === types._default) {
            var isCase = this.type === types._case;
            if (cur) { this.finishNode(cur, "SwitchCase"); }
            node.cases.push(cur = this.startNode());
            cur.consequent = [];
            this.next();
            if (isCase) {
              cur.test = this.parseExpression();
            } else {
              if (sawDefault) { this.raiseRecoverable(this.lastTokStart, "Multiple default clauses"); }
              sawDefault = true;
              cur.test = null;
            }
            this.expect(types.colon);
          } else {
            if (!cur) { this.unexpected(); }
            cur.consequent.push(this.parseStatement(null));
          }
        }
        this.exitScope();
        if (cur) { this.finishNode(cur, "SwitchCase"); }
        this.next(); 
        this.labels.pop();
        return this.finishNode(node, "SwitchStatement")
      };

      pp$1.parseThrowStatement = function(node) {
        this.next();
        if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
          { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
        node.argument = this.parseExpression();
        this.semicolon();
        return this.finishNode(node, "ThrowStatement")
      };


      var empty = [];

      pp$1.parseTryStatement = function(node) {
        this.next();
        node.block = this.parseBlock();
        node.handler = null;
        if (this.type === types._catch) {
          var clause = this.startNode();
          this.next();
          if (this.eat(types.parenL)) {
            clause.param = this.parseBindingAtom();
            var simple = clause.param.type === "Identifier";
            this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
            this.checkLVal(clause.param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
            this.expect(types.parenR);
          } else {
            if (this.options.ecmaVersion < 10) { this.unexpected(); }
            clause.param = null;
            this.enterScope(0);
          }
          clause.body = this.parseBlock(false);
          this.exitScope();
          node.handler = this.finishNode(clause, "CatchClause");
        }
        node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
        if (!node.handler && !node.finalizer)
          { this.raise(node.start, "Missing catch or finally clause"); }
        return this.finishNode(node, "TryStatement")
      };

      pp$1.parseVarStatement = function(node, kind) {
        this.next();
        this.parseVar(node, false, kind);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration")
      };

      pp$1.parseWhileStatement = function(node) {
        this.next();
        node.test = this.parseParenExpression();
        this.labels.push(loopLabel);
        node.body = this.parseStatement("while");
        this.labels.pop();
        return this.finishNode(node, "WhileStatement")
      };

      pp$1.parseWithStatement = function(node) {
        if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
        this.next();
        node.object = this.parseParenExpression();
        node.body = this.parseStatement("with");
        return this.finishNode(node, "WithStatement")
      };

      pp$1.parseEmptyStatement = function(node) {
        this.next();
        return this.finishNode(node, "EmptyStatement")
      };

      pp$1.parseLabeledStatement = function(node, maybeName, expr, context) {
        for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1)
          {
          var label = list[i$1];

          if (label.name === maybeName)
            { this.raise(expr.start, "Label '" + maybeName + "' is already declared");
        } }
        var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
        for (var i = this.labels.length - 1; i >= 0; i--) {
          var label$1 = this.labels[i];
          if (label$1.statementStart === node.start) {
            label$1.statementStart = this.start;
            label$1.kind = kind;
          } else { break }
        }
        this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
        node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
        this.labels.pop();
        node.label = expr;
        return this.finishNode(node, "LabeledStatement")
      };

      pp$1.parseExpressionStatement = function(node, expr) {
        node.expression = expr;
        this.semicolon();
        return this.finishNode(node, "ExpressionStatement")
      };


      pp$1.parseBlock = function(createNewLexicalScope, node) {
        if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;
        if ( node === void 0 ) node = this.startNode();

        node.body = [];
        this.expect(types.braceL);
        if (createNewLexicalScope) { this.enterScope(0); }
        while (!this.eat(types.braceR)) {
          var stmt = this.parseStatement(null);
          node.body.push(stmt);
        }
        if (createNewLexicalScope) { this.exitScope(); }
        return this.finishNode(node, "BlockStatement")
      };


      pp$1.parseFor = function(node, init) {
        node.init = init;
        this.expect(types.semi);
        node.test = this.type === types.semi ? null : this.parseExpression();
        this.expect(types.semi);
        node.update = this.type === types.parenR ? null : this.parseExpression();
        this.expect(types.parenR);
        node.body = this.parseStatement("for");
        this.exitScope();
        this.labels.pop();
        return this.finishNode(node, "ForStatement")
      };


      pp$1.parseForIn = function(node, init) {
        var isForIn = this.type === types._in;
        this.next();

        if (
          init.type === "VariableDeclaration" &&
          init.declarations[0].init != null &&
          (
            !isForIn ||
            this.options.ecmaVersion < 8 ||
            this.strict ||
            init.kind !== "var" ||
            init.declarations[0].id.type !== "Identifier"
          )
        ) {
          this.raise(
            init.start,
            ((isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer")
          );
        } else if (init.type === "AssignmentPattern") {
          this.raise(init.start, "Invalid left-hand side in for-loop");
        }
        node.left = init;
        node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
        this.expect(types.parenR);
        node.body = this.parseStatement("for");
        this.exitScope();
        this.labels.pop();
        return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement")
      };


      pp$1.parseVar = function(node, isFor, kind) {
        node.declarations = [];
        node.kind = kind;
        for (;;) {
          var decl = this.startNode();
          this.parseVarId(decl, kind);
          if (this.eat(types.eq)) {
            decl.init = this.parseMaybeAssign(isFor);
          } else if (kind === "const" && !(this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of")))) {
            this.unexpected();
          } else if (decl.id.type !== "Identifier" && !(isFor && (this.type === types._in || this.isContextual("of")))) {
            this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
          } else {
            decl.init = null;
          }
          node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
          if (!this.eat(types.comma)) { break }
        }
        return node
      };

      pp$1.parseVarId = function(decl, kind) {
        decl.id = this.parseBindingAtom();
        this.checkLVal(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
      };

      var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;


      pp$1.parseFunction = function(node, statement, allowExpressionBody, isAsync) {
        this.initFunction(node);
        if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
          if (this.type === types.star && (statement & FUNC_HANGING_STATEMENT))
            { this.unexpected(); }
          node.generator = this.eat(types.star);
        }
        if (this.options.ecmaVersion >= 8)
          { node.async = !!isAsync; }

        if (statement & FUNC_STATEMENT) {
          node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types.name ? null : this.parseIdent();
          if (node.id && !(statement & FUNC_HANGING_STATEMENT))
            { this.checkLVal(node.id, (this.strict || node.generator || node.async) ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION); }
        }

        var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        this.enterScope(functionFlags(node.async, node.generator));

        if (!(statement & FUNC_STATEMENT))
          { node.id = this.type === types.name ? this.parseIdent() : null; }

        this.parseFunctionParams(node);
        this.parseFunctionBody(node, allowExpressionBody, false);

        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
      };

      pp$1.parseFunctionParams = function(node) {
        this.expect(types.parenL);
        node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
        this.checkYieldAwaitInDefaultParams();
      };


      pp$1.parseClass = function(node, isStatement) {
        this.next();

        var oldStrict = this.strict;
        this.strict = true;

        this.parseClassId(node, isStatement);
        this.parseClassSuper(node);
        var classBody = this.startNode();
        var hadConstructor = false;
        classBody.body = [];
        this.expect(types.braceL);
        while (!this.eat(types.braceR)) {
          var element = this.parseClassElement(node.superClass !== null);
          if (element) {
            classBody.body.push(element);
            if (element.type === "MethodDefinition" && element.kind === "constructor") {
              if (hadConstructor) { this.raise(element.start, "Duplicate constructor in the same class"); }
              hadConstructor = true;
            }
          }
        }
        node.body = this.finishNode(classBody, "ClassBody");
        this.strict = oldStrict;
        return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
      };

      pp$1.parseClassElement = function(constructorAllowsSuper) {
        var this$1 = this;

        if (this.eat(types.semi)) { return null }

        var method = this.startNode();
        var tryContextual = function (k, noLineBreak) {
          if ( noLineBreak === void 0 ) noLineBreak = false;

          var start = this$1.start, startLoc = this$1.startLoc;
          if (!this$1.eatContextual(k)) { return false }
          if (this$1.type !== types.parenL && (!noLineBreak || !this$1.canInsertSemicolon())) { return true }
          if (method.key) { this$1.unexpected(); }
          method.computed = false;
          method.key = this$1.startNodeAt(start, startLoc);
          method.key.name = k;
          this$1.finishNode(method.key, "Identifier");
          return false
        };

        method.kind = "method";
        method.static = tryContextual("static");
        var isGenerator = this.eat(types.star);
        var isAsync = false;
        if (!isGenerator) {
          if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
            isAsync = true;
            isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
          } else if (tryContextual("get")) {
            method.kind = "get";
          } else if (tryContextual("set")) {
            method.kind = "set";
          }
        }
        if (!method.key) { this.parsePropertyName(method); }
        var key = method.key;
        var allowsDirectSuper = false;
        if (!method.computed && !method.static && (key.type === "Identifier" && key.name === "constructor" ||
            key.type === "Literal" && key.value === "constructor")) {
          if (method.kind !== "method") { this.raise(key.start, "Constructor can't have get/set modifier"); }
          if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
          if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
          method.kind = "constructor";
          allowsDirectSuper = constructorAllowsSuper;
        } else if (method.static && key.type === "Identifier" && key.name === "prototype") {
          this.raise(key.start, "Classes may not have a static property named prototype");
        }
        this.parseClassMethod(method, isGenerator, isAsync, allowsDirectSuper);
        if (method.kind === "get" && method.value.params.length !== 0)
          { this.raiseRecoverable(method.value.start, "getter should have no params"); }
        if (method.kind === "set" && method.value.params.length !== 1)
          { this.raiseRecoverable(method.value.start, "setter should have exactly one param"); }
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
          { this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
        return method
      };

      pp$1.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
        method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
        return this.finishNode(method, "MethodDefinition")
      };

      pp$1.parseClassId = function(node, isStatement) {
        if (this.type === types.name) {
          node.id = this.parseIdent();
          if (isStatement)
            { this.checkLVal(node.id, BIND_LEXICAL, false); }
        } else {
          if (isStatement === true)
            { this.unexpected(); }
          node.id = null;
        }
      };

      pp$1.parseClassSuper = function(node) {
        node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
      };


      pp$1.parseExport = function(node, exports) {
        this.next();
        if (this.eat(types.star)) {
          this.expectContextual("from");
          if (this.type !== types.string) { this.unexpected(); }
          node.source = this.parseExprAtom();
          this.semicolon();
          return this.finishNode(node, "ExportAllDeclaration")
        }
        if (this.eat(types._default)) { 
          this.checkExport(exports, "default", this.lastTokStart);
          var isAsync;
          if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
            var fNode = this.startNode();
            this.next();
            if (isAsync) { this.next(); }
            node.declaration = this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
          } else if (this.type === types._class) {
            var cNode = this.startNode();
            node.declaration = this.parseClass(cNode, "nullableID");
          } else {
            node.declaration = this.parseMaybeAssign();
            this.semicolon();
          }
          return this.finishNode(node, "ExportDefaultDeclaration")
        }
        if (this.shouldParseExportStatement()) {
          node.declaration = this.parseStatement(null);
          if (node.declaration.type === "VariableDeclaration")
            { this.checkVariableExport(exports, node.declaration.declarations); }
          else
            { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
          node.specifiers = [];
          node.source = null;
        } else { 
          node.declaration = null;
          node.specifiers = this.parseExportSpecifiers(exports);
          if (this.eatContextual("from")) {
            if (this.type !== types.string) { this.unexpected(); }
            node.source = this.parseExprAtom();
          } else {
            for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
              var spec = list[i];

              this.checkUnreserved(spec.local);
              this.checkLocalExport(spec.local);
            }

            node.source = null;
          }
          this.semicolon();
        }
        return this.finishNode(node, "ExportNamedDeclaration")
      };

      pp$1.checkExport = function(exports, name, pos) {
        if (!exports) { return }
        if (has(exports, name))
          { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
        exports[name] = true;
      };

      pp$1.checkPatternExport = function(exports, pat) {
        var type = pat.type;
        if (type === "Identifier")
          { this.checkExport(exports, pat.name, pat.start); }
        else if (type === "ObjectPattern")
          { for (var i = 0, list = pat.properties; i < list.length; i += 1)
            {
              var prop = list[i];

              this.checkPatternExport(exports, prop);
            } }
        else if (type === "ArrayPattern")
          { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
            var elt = list$1[i$1];

              if (elt) { this.checkPatternExport(exports, elt); }
          } }
        else if (type === "Property")
          { this.checkPatternExport(exports, pat.value); }
        else if (type === "AssignmentPattern")
          { this.checkPatternExport(exports, pat.left); }
        else if (type === "RestElement")
          { this.checkPatternExport(exports, pat.argument); }
        else if (type === "ParenthesizedExpression")
          { this.checkPatternExport(exports, pat.expression); }
      };

      pp$1.checkVariableExport = function(exports, decls) {
        if (!exports) { return }
        for (var i = 0, list = decls; i < list.length; i += 1)
          {
          var decl = list[i];

          this.checkPatternExport(exports, decl.id);
        }
      };

      pp$1.shouldParseExportStatement = function() {
        return this.type.keyword === "var" ||
          this.type.keyword === "const" ||
          this.type.keyword === "class" ||
          this.type.keyword === "function" ||
          this.isLet() ||
          this.isAsyncFunction()
      };


      pp$1.parseExportSpecifiers = function(exports) {
        var nodes = [], first = true;
        this.expect(types.braceL);
        while (!this.eat(types.braceR)) {
          if (!first) {
            this.expect(types.comma);
            if (this.afterTrailingComma(types.braceR)) { break }
          } else { first = false; }

          var node = this.startNode();
          node.local = this.parseIdent(true);
          node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local;
          this.checkExport(exports, node.exported.name, node.exported.start);
          nodes.push(this.finishNode(node, "ExportSpecifier"));
        }
        return nodes
      };


      pp$1.parseImport = function(node) {
        this.next();
        if (this.type === types.string) {
          node.specifiers = empty;
          node.source = this.parseExprAtom();
        } else {
          node.specifiers = this.parseImportSpecifiers();
          this.expectContextual("from");
          node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
        }
        this.semicolon();
        return this.finishNode(node, "ImportDeclaration")
      };


      pp$1.parseImportSpecifiers = function() {
        var nodes = [], first = true;
        if (this.type === types.name) {
          var node = this.startNode();
          node.local = this.parseIdent();
          this.checkLVal(node.local, BIND_LEXICAL);
          nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
          if (!this.eat(types.comma)) { return nodes }
        }
        if (this.type === types.star) {
          var node$1 = this.startNode();
          this.next();
          this.expectContextual("as");
          node$1.local = this.parseIdent();
          this.checkLVal(node$1.local, BIND_LEXICAL);
          nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
          return nodes
        }
        this.expect(types.braceL);
        while (!this.eat(types.braceR)) {
          if (!first) {
            this.expect(types.comma);
            if (this.afterTrailingComma(types.braceR)) { break }
          } else { first = false; }

          var node$2 = this.startNode();
          node$2.imported = this.parseIdent(true);
          if (this.eatContextual("as")) {
            node$2.local = this.parseIdent();
          } else {
            this.checkUnreserved(node$2.imported);
            node$2.local = node$2.imported;
          }
          this.checkLVal(node$2.local, BIND_LEXICAL);
          nodes.push(this.finishNode(node$2, "ImportSpecifier"));
        }
        return nodes
      };

      pp$1.adaptDirectivePrologue = function(statements) {
        for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
          statements[i].directive = statements[i].expression.raw.slice(1, -1);
        }
      };
      pp$1.isDirectiveCandidate = function(statement) {
        return (
          statement.type === "ExpressionStatement" &&
          statement.expression.type === "Literal" &&
          typeof statement.expression.value === "string" &&
          (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
        )
      };

      var pp$2 = Parser.prototype;


      pp$2.toAssignable = function(node, isBinding, refDestructuringErrors) {
        if (this.options.ecmaVersion >= 6 && node) {
          switch (node.type) {
          case "Identifier":
            if (this.inAsync && node.name === "await")
              { this.raise(node.start, "Cannot use 'await' as identifier inside an async function"); }
            break

          case "ObjectPattern":
          case "ArrayPattern":
          case "RestElement":
            break

          case "ObjectExpression":
            node.type = "ObjectPattern";
            if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
            for (var i = 0, list = node.properties; i < list.length; i += 1) {
              var prop = list[i];

            this.toAssignable(prop, isBinding);
              if (
                prop.type === "RestElement" &&
                (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
              ) {
                this.raise(prop.argument.start, "Unexpected token");
              }
            }
            break

          case "Property":
            if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
            this.toAssignable(node.value, isBinding);
            break

          case "ArrayExpression":
            node.type = "ArrayPattern";
            if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
            this.toAssignableList(node.elements, isBinding);
            break

          case "SpreadElement":
            node.type = "RestElement";
            this.toAssignable(node.argument, isBinding);
            if (node.argument.type === "AssignmentPattern")
              { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
            break

          case "AssignmentExpression":
            if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
            node.type = "AssignmentPattern";
            delete node.operator;
            this.toAssignable(node.left, isBinding);

          case "AssignmentPattern":
            break

          case "ParenthesizedExpression":
            this.toAssignable(node.expression, isBinding, refDestructuringErrors);
            break

          case "MemberExpression":
            if (!isBinding) { break }

          default:
            this.raise(node.start, "Assigning to rvalue");
          }
        } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        return node
      };


      pp$2.toAssignableList = function(exprList, isBinding) {
        var end = exprList.length;
        for (var i = 0; i < end; i++) {
          var elt = exprList[i];
          if (elt) { this.toAssignable(elt, isBinding); }
        }
        if (end) {
          var last = exprList[end - 1];
          if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
            { this.unexpected(last.argument.start); }
        }
        return exprList
      };


      pp$2.parseSpread = function(refDestructuringErrors) {
        var node = this.startNode();
        this.next();
        node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
        return this.finishNode(node, "SpreadElement")
      };

      pp$2.parseRestBinding = function() {
        var node = this.startNode();
        this.next();

        if (this.options.ecmaVersion === 6 && this.type !== types.name)
          { this.unexpected(); }

        node.argument = this.parseBindingAtom();

        return this.finishNode(node, "RestElement")
      };


      pp$2.parseBindingAtom = function() {
        if (this.options.ecmaVersion >= 6) {
          switch (this.type) {
          case types.bracketL:
            var node = this.startNode();
            this.next();
            node.elements = this.parseBindingList(types.bracketR, true, true);
            return this.finishNode(node, "ArrayPattern")

          case types.braceL:
            return this.parseObj(true)
          }
        }
        return this.parseIdent()
      };

      pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
        var elts = [], first = true;
        while (!this.eat(close)) {
          if (first) { first = false; }
          else { this.expect(types.comma); }
          if (allowEmpty && this.type === types.comma) {
            elts.push(null);
          } else if (allowTrailingComma && this.afterTrailingComma(close)) {
            break
          } else if (this.type === types.ellipsis) {
            var rest = this.parseRestBinding();
            this.parseBindingListItem(rest);
            elts.push(rest);
            if (this.type === types.comma) { this.raise(this.start, "Comma is not permitted after the rest element"); }
            this.expect(close);
            break
          } else {
            var elem = this.parseMaybeDefault(this.start, this.startLoc);
            this.parseBindingListItem(elem);
            elts.push(elem);
          }
        }
        return elts
      };

      pp$2.parseBindingListItem = function(param) {
        return param
      };


      pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
        left = left || this.parseBindingAtom();
        if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
        var node = this.startNodeAt(startPos, startLoc);
        node.left = left;
        node.right = this.parseMaybeAssign();
        return this.finishNode(node, "AssignmentPattern")
      };


      pp$2.checkLVal = function(expr, bindingType, checkClashes) {
        if ( bindingType === void 0 ) bindingType = BIND_NONE;

        switch (expr.type) {
        case "Identifier":
          if (bindingType === BIND_LEXICAL && expr.name === "let")
            { this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name"); }
          if (this.strict && this.reservedWordsStrictBind.test(expr.name))
            { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
          if (checkClashes) {
            if (has(checkClashes, expr.name))
              { this.raiseRecoverable(expr.start, "Argument name clash"); }
            checkClashes[expr.name] = true;
          }
          if (bindingType !== BIND_NONE && bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
          break

        case "MemberExpression":
          if (bindingType) { this.raiseRecoverable(expr.start, "Binding member expression"); }
          break

        case "ObjectPattern":
          for (var i = 0, list = expr.properties; i < list.length; i += 1)
            {
          var prop = list[i];

          this.checkLVal(prop, bindingType, checkClashes);
        }
          break

        case "Property":
          this.checkLVal(expr.value, bindingType, checkClashes);
          break

        case "ArrayPattern":
          for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
            var elem = list$1[i$1];

          if (elem) { this.checkLVal(elem, bindingType, checkClashes); }
          }
          break

        case "AssignmentPattern":
          this.checkLVal(expr.left, bindingType, checkClashes);
          break

        case "RestElement":
          this.checkLVal(expr.argument, bindingType, checkClashes);
          break

        case "ParenthesizedExpression":
          this.checkLVal(expr.expression, bindingType, checkClashes);
          break

        default:
          this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
        }
      };


      var pp$3 = Parser.prototype;


      pp$3.checkPropClash = function(prop, propHash, refDestructuringErrors) {
        if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
          { return }
        if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
          { return }
        var key = prop.key;
        var name;
        switch (key.type) {
        case "Identifier": name = key.name; break
        case "Literal": name = String(key.value); break
        default: return
        }
        var kind = prop.kind;
        if (this.options.ecmaVersion >= 6) {
          if (name === "__proto__" && kind === "init") {
            if (propHash.proto) {
              if (refDestructuringErrors) {
                if (refDestructuringErrors.doubleProto < 0)
                  { refDestructuringErrors.doubleProto = key.start; }
              } else { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
            }
            propHash.proto = true;
          }
          return
        }
        name = "$" + name;
        var other = propHash[name];
        if (other) {
          var redefinition;
          if (kind === "init") {
            redefinition = this.strict && other.init || other.get || other.set;
          } else {
            redefinition = other.init || other[kind];
          }
          if (redefinition)
            { this.raiseRecoverable(key.start, "Redefinition of property"); }
        } else {
          other = propHash[name] = {
            init: false,
            get: false,
            set: false
          };
        }
        other[kind] = true;
      };




      pp$3.parseExpression = function(noIn, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
        if (this.type === types.comma) {
          var node = this.startNodeAt(startPos, startLoc);
          node.expressions = [expr];
          while (this.eat(types.comma)) { node.expressions.push(this.parseMaybeAssign(noIn, refDestructuringErrors)); }
          return this.finishNode(node, "SequenceExpression")
        }
        return expr
      };


      pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
        if (this.isContextual("yield")) {
          if (this.inGenerator) { return this.parseYield(noIn) }
          else { this.exprAllowed = false; }
        }

        var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1;
        if (refDestructuringErrors) {
          oldParenAssign = refDestructuringErrors.parenthesizedAssign;
          oldTrailingComma = refDestructuringErrors.trailingComma;
          refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
        } else {
          refDestructuringErrors = new DestructuringErrors;
          ownDestructuringErrors = true;
        }

        var startPos = this.start, startLoc = this.startLoc;
        if (this.type === types.parenL || this.type === types.name)
          { this.potentialArrowAt = this.start; }
        var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
        if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
        if (this.type.isAssign) {
          var node = this.startNodeAt(startPos, startLoc);
          node.operator = this.value;
          node.left = this.type === types.eq ? this.toAssignable(left, false, refDestructuringErrors) : left;
          if (!ownDestructuringErrors) {
            refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
          }
          if (refDestructuringErrors.shorthandAssign >= node.left.start)
            { refDestructuringErrors.shorthandAssign = -1; } 
          this.checkLVal(left);
          this.next();
          node.right = this.parseMaybeAssign(noIn);
          return this.finishNode(node, "AssignmentExpression")
        } else {
          if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
        }
        if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
        if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
        return left
      };


      pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseExprOps(noIn, refDestructuringErrors);
        if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
        if (this.eat(types.question)) {
          var node = this.startNodeAt(startPos, startLoc);
          node.test = expr;
          node.consequent = this.parseMaybeAssign();
          this.expect(types.colon);
          node.alternate = this.parseMaybeAssign(noIn);
          return this.finishNode(node, "ConditionalExpression")
        }
        return expr
      };


      pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseMaybeUnary(refDestructuringErrors, false);
        if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
        return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
      };


      pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
        var prec = this.type.binop;
        if (prec != null && (!noIn || this.type !== types._in)) {
          if (prec > minPrec) {
            var logical = this.type === types.logicalOR || this.type === types.logicalAND;
            var op = this.value;
            this.next();
            var startPos = this.start, startLoc = this.startLoc;
            var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
            var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
            return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
          }
        }
        return left
      };

      pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
        var node = this.startNodeAt(startPos, startLoc);
        node.left = left;
        node.operator = op;
        node.right = right;
        return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
      };


      pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
        var startPos = this.start, startLoc = this.startLoc, expr;
        if (this.isContextual("await") && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction))) {
          expr = this.parseAwait();
          sawUnary = true;
        } else if (this.type.prefix) {
          var node = this.startNode(), update = this.type === types.incDec;
          node.operator = this.value;
          node.prefix = true;
          this.next();
          node.argument = this.parseMaybeUnary(null, true);
          this.checkExpressionErrors(refDestructuringErrors, true);
          if (update) { this.checkLVal(node.argument); }
          else if (this.strict && node.operator === "delete" &&
                   node.argument.type === "Identifier")
            { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
          else { sawUnary = true; }
          expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
        } else {
          expr = this.parseExprSubscripts(refDestructuringErrors);
          if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
          while (this.type.postfix && !this.canInsertSemicolon()) {
            var node$1 = this.startNodeAt(startPos, startLoc);
            node$1.operator = this.value;
            node$1.prefix = false;
            node$1.argument = expr;
            this.checkLVal(expr);
            this.next();
            expr = this.finishNode(node$1, "UpdateExpression");
          }
        }

        if (!sawUnary && this.eat(types.starstar))
          { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
        else
          { return expr }
      };


      pp$3.parseExprSubscripts = function(refDestructuringErrors) {
        var startPos = this.start, startLoc = this.startLoc;
        var expr = this.parseExprAtom(refDestructuringErrors);
        if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")")
          { return expr }
        var result = this.parseSubscripts(expr, startPos, startLoc);
        if (refDestructuringErrors && result.type === "MemberExpression") {
          if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
          if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
        }
        return result
      };

      pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
        var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
            this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.input.slice(base.start, base.end) === "async";
        while (true) {
          var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow);
          if (element === base || element.type === "ArrowFunctionExpression") { return element }
          base = element;
        }
      };

      pp$3.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow) {
        var computed = this.eat(types.bracketL);
        if (computed || this.eat(types.dot)) {
          var node = this.startNodeAt(startPos, startLoc);
          node.object = base;
          node.property = computed ? this.parseExpression() : this.parseIdent(this.options.allowReserved !== "never");
          node.computed = !!computed;
          if (computed) { this.expect(types.bracketR); }
          base = this.finishNode(node, "MemberExpression");
        } else if (!noCalls && this.eat(types.parenL)) {
          var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
          this.yieldPos = 0;
          this.awaitPos = 0;
          this.awaitIdentPos = 0;
          var exprList = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
          if (maybeAsyncArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            if (this.awaitIdentPos > 0)
              { this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"); }
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            this.awaitIdentPos = oldAwaitIdentPos;
            return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true)
          }
          this.checkExpressionErrors(refDestructuringErrors, true);
          this.yieldPos = oldYieldPos || this.yieldPos;
          this.awaitPos = oldAwaitPos || this.awaitPos;
          this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
          var node$1 = this.startNodeAt(startPos, startLoc);
          node$1.callee = base;
          node$1.arguments = exprList;
          base = this.finishNode(node$1, "CallExpression");
        } else if (this.type === types.backQuote) {
          var node$2 = this.startNodeAt(startPos, startLoc);
          node$2.tag = base;
          node$2.quasi = this.parseTemplate({isTagged: true});
          base = this.finishNode(node$2, "TaggedTemplateExpression");
        }
        return base
      };


      pp$3.parseExprAtom = function(refDestructuringErrors) {
        if (this.type === types.slash) { this.readRegexp(); }

        var node, canBeArrow = this.potentialArrowAt === this.start;
        switch (this.type) {
        case types._super:
          if (!this.allowSuper)
            { this.raise(this.start, "'super' keyword outside a method"); }
          node = this.startNode();
          this.next();
          if (this.type === types.parenL && !this.allowDirectSuper)
            { this.raise(node.start, "super() call outside constructor of a subclass"); }
          if (this.type !== types.dot && this.type !== types.bracketL && this.type !== types.parenL)
            { this.unexpected(); }
          return this.finishNode(node, "Super")

        case types._this:
          node = this.startNode();
          this.next();
          return this.finishNode(node, "ThisExpression")

        case types.name:
          var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
          var id = this.parseIdent(false);
          if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
            { return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true) }
          if (canBeArrow && !this.canInsertSemicolon()) {
            if (this.eat(types.arrow))
              { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
            if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name && !containsEsc) {
              id = this.parseIdent(false);
              if (this.canInsertSemicolon() || !this.eat(types.arrow))
                { this.unexpected(); }
              return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
            }
          }
          return id

        case types.regexp:
          var value = this.value;
          node = this.parseLiteral(value.value);
          node.regex = {pattern: value.pattern, flags: value.flags};
          return node

        case types.num: case types.string:
          return this.parseLiteral(this.value)

        case types._null: case types._true: case types._false:
          node = this.startNode();
          node.value = this.type === types._null ? null : this.type === types._true;
          node.raw = this.type.keyword;
          this.next();
          return this.finishNode(node, "Literal")

        case types.parenL:
          var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
          if (refDestructuringErrors) {
            if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
              { refDestructuringErrors.parenthesizedAssign = start; }
            if (refDestructuringErrors.parenthesizedBind < 0)
              { refDestructuringErrors.parenthesizedBind = start; }
          }
          return expr

        case types.bracketL:
          node = this.startNode();
          this.next();
          node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
          return this.finishNode(node, "ArrayExpression")

        case types.braceL:
          return this.parseObj(false, refDestructuringErrors)

        case types._function:
          node = this.startNode();
          this.next();
          return this.parseFunction(node, 0)

        case types._class:
          return this.parseClass(this.startNode(), false)

        case types._new:
          return this.parseNew()

        case types.backQuote:
          return this.parseTemplate()

        case types._import:
          if (this.options.ecmaVersion >= 11) {
            return this.parseExprImport()
          } else {
            return this.unexpected()
          }

        default:
          this.unexpected();
        }
      };

      pp$3.parseExprImport = function() {
        var node = this.startNode();
        this.next(); 
        switch (this.type) {
        case types.parenL:
          return this.parseDynamicImport(node)
        default:
          this.unexpected();
        }
      };

      pp$3.parseDynamicImport = function(node) {
        this.next(); 

        node.source = this.parseMaybeAssign();

        if (!this.eat(types.parenR)) {
          var errorPos = this.start;
          if (this.eat(types.comma) && this.eat(types.parenR)) {
            this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
          } else {
            this.unexpected(errorPos);
          }
        }

        return this.finishNode(node, "ImportExpression")
      };

      pp$3.parseLiteral = function(value) {
        var node = this.startNode();
        node.value = value;
        node.raw = this.input.slice(this.start, this.end);
        if (node.raw.charCodeAt(node.raw.length - 1) === 110) { node.bigint = node.raw.slice(0, -1); }
        this.next();
        return this.finishNode(node, "Literal")
      };

      pp$3.parseParenExpression = function() {
        this.expect(types.parenL);
        var val = this.parseExpression();
        this.expect(types.parenR);
        return val
      };

      pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
        var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
        if (this.options.ecmaVersion >= 6) {
          this.next();

          var innerStartPos = this.start, innerStartLoc = this.startLoc;
          var exprList = [], first = true, lastIsComma = false;
          var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
          this.yieldPos = 0;
          this.awaitPos = 0;
          while (this.type !== types.parenR) {
            first ? first = false : this.expect(types.comma);
            if (allowTrailingComma && this.afterTrailingComma(types.parenR, true)) {
              lastIsComma = true;
              break
            } else if (this.type === types.ellipsis) {
              spreadStart = this.start;
              exprList.push(this.parseParenItem(this.parseRestBinding()));
              if (this.type === types.comma) { this.raise(this.start, "Comma is not permitted after the rest element"); }
              break
            } else {
              exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
            }
          }
          var innerEndPos = this.start, innerEndLoc = this.startLoc;
          this.expect(types.parenR);

          if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            return this.parseParenArrowList(startPos, startLoc, exprList)
          }

          if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
          if (spreadStart) { this.unexpected(spreadStart); }
          this.checkExpressionErrors(refDestructuringErrors, true);
          this.yieldPos = oldYieldPos || this.yieldPos;
          this.awaitPos = oldAwaitPos || this.awaitPos;

          if (exprList.length > 1) {
            val = this.startNodeAt(innerStartPos, innerStartLoc);
            val.expressions = exprList;
            this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
          } else {
            val = exprList[0];
          }
        } else {
          val = this.parseParenExpression();
        }

        if (this.options.preserveParens) {
          var par = this.startNodeAt(startPos, startLoc);
          par.expression = val;
          return this.finishNode(par, "ParenthesizedExpression")
        } else {
          return val
        }
      };

      pp$3.parseParenItem = function(item) {
        return item
      };

      pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
      };


      var empty$1 = [];

      pp$3.parseNew = function() {
        if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword new"); }
        var node = this.startNode();
        var meta = this.parseIdent(true);
        if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
          node.meta = meta;
          var containsEsc = this.containsEsc;
          node.property = this.parseIdent(true);
          if (node.property.name !== "target" || containsEsc)
            { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
          if (!this.inNonArrowFunction())
            { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
          return this.finishNode(node, "MetaProperty")
        }
        var startPos = this.start, startLoc = this.startLoc, isImport = this.type === types._import;
        node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
        if (isImport && node.callee.type === "ImportExpression") {
          this.raise(startPos, "Cannot use new with import()");
        }
        if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false); }
        else { node.arguments = empty$1; }
        return this.finishNode(node, "NewExpression")
      };


      pp$3.parseTemplateElement = function(ref) {
        var isTagged = ref.isTagged;

        var elem = this.startNode();
        if (this.type === types.invalidTemplate) {
          if (!isTagged) {
            this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
          }
          elem.value = {
            raw: this.value,
            cooked: null
          };
        } else {
          elem.value = {
            raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
            cooked: this.value
          };
        }
        this.next();
        elem.tail = this.type === types.backQuote;
        return this.finishNode(elem, "TemplateElement")
      };

      pp$3.parseTemplate = function(ref) {
        if ( ref === void 0 ) ref = {};
        var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

        var node = this.startNode();
        this.next();
        node.expressions = [];
        var curElt = this.parseTemplateElement({isTagged: isTagged});
        node.quasis = [curElt];
        while (!curElt.tail) {
          if (this.type === types.eof) { this.raise(this.pos, "Unterminated template literal"); }
          this.expect(types.dollarBraceL);
          node.expressions.push(this.parseExpression());
          this.expect(types.braceR);
          node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
        }
        this.next();
        return this.finishNode(node, "TemplateLiteral")
      };

      pp$3.isAsyncProp = function(prop) {
        return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
          (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types.star)) &&
          !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
      };


      pp$3.parseObj = function(isPattern, refDestructuringErrors) {
        var node = this.startNode(), first = true, propHash = {};
        node.properties = [];
        this.next();
        while (!this.eat(types.braceR)) {
          if (!first) {
            this.expect(types.comma);
            if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types.braceR)) { break }
          } else { first = false; }

          var prop = this.parseProperty(isPattern, refDestructuringErrors);
          if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
          node.properties.push(prop);
        }
        return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
      };

      pp$3.parseProperty = function(isPattern, refDestructuringErrors) {
        var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
        if (this.options.ecmaVersion >= 9 && this.eat(types.ellipsis)) {
          if (isPattern) {
            prop.argument = this.parseIdent(false);
            if (this.type === types.comma) {
              this.raise(this.start, "Comma is not permitted after the rest element");
            }
            return this.finishNode(prop, "RestElement")
          }
          if (this.type === types.parenL && refDestructuringErrors) {
            if (refDestructuringErrors.parenthesizedAssign < 0) {
              refDestructuringErrors.parenthesizedAssign = this.start;
            }
            if (refDestructuringErrors.parenthesizedBind < 0) {
              refDestructuringErrors.parenthesizedBind = this.start;
            }
          }
          prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
          if (this.type === types.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
            refDestructuringErrors.trailingComma = this.start;
          }
          return this.finishNode(prop, "SpreadElement")
        }
        if (this.options.ecmaVersion >= 6) {
          prop.method = false;
          prop.shorthand = false;
          if (isPattern || refDestructuringErrors) {
            startPos = this.start;
            startLoc = this.startLoc;
          }
          if (!isPattern)
            { isGenerator = this.eat(types.star); }
        }
        var containsEsc = this.containsEsc;
        this.parsePropertyName(prop);
        if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
          isAsync = true;
          isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
          this.parsePropertyName(prop, refDestructuringErrors);
        } else {
          isAsync = false;
        }
        this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
        return this.finishNode(prop, "Property")
      };

      pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
        if ((isGenerator || isAsync) && this.type === types.colon)
          { this.unexpected(); }

        if (this.eat(types.colon)) {
          prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
          prop.kind = "init";
        } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
          if (isPattern) { this.unexpected(); }
          prop.kind = "init";
          prop.method = true;
          prop.value = this.parseMethod(isGenerator, isAsync);
        } else if (!isPattern && !containsEsc &&
                   this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
                   (prop.key.name === "get" || prop.key.name === "set") &&
                   (this.type !== types.comma && this.type !== types.braceR)) {
          if (isGenerator || isAsync) { this.unexpected(); }
          prop.kind = prop.key.name;
          this.parsePropertyName(prop);
          prop.value = this.parseMethod(false);
          var paramCount = prop.kind === "get" ? 0 : 1;
          if (prop.value.params.length !== paramCount) {
            var start = prop.value.start;
            if (prop.kind === "get")
              { this.raiseRecoverable(start, "getter should have no params"); }
            else
              { this.raiseRecoverable(start, "setter should have exactly one param"); }
          } else {
            if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
              { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
          }
        } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
          if (isGenerator || isAsync) { this.unexpected(); }
          this.checkUnreserved(prop.key);
          if (prop.key.name === "await" && !this.awaitIdentPos)
            { this.awaitIdentPos = startPos; }
          prop.kind = "init";
          if (isPattern) {
            prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
          } else if (this.type === types.eq && refDestructuringErrors) {
            if (refDestructuringErrors.shorthandAssign < 0)
              { refDestructuringErrors.shorthandAssign = this.start; }
            prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
          } else {
            prop.value = prop.key;
          }
          prop.shorthand = true;
        } else { this.unexpected(); }
      };

      pp$3.parsePropertyName = function(prop) {
        if (this.options.ecmaVersion >= 6) {
          if (this.eat(types.bracketL)) {
            prop.computed = true;
            prop.key = this.parseMaybeAssign();
            this.expect(types.bracketR);
            return prop.key
          } else {
            prop.computed = false;
          }
        }
        return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
      };


      pp$3.initFunction = function(node) {
        node.id = null;
        if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
        if (this.options.ecmaVersion >= 8) { node.async = false; }
      };


      pp$3.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
        var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

        this.initFunction(node);
        if (this.options.ecmaVersion >= 6)
          { node.generator = isGenerator; }
        if (this.options.ecmaVersion >= 8)
          { node.async = !!isAsync; }

        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

        this.expect(types.parenL);
        node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
        this.checkYieldAwaitInDefaultParams();
        this.parseFunctionBody(node, false, true);

        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, "FunctionExpression")
      };


      pp$3.parseArrowExpression = function(node, params, isAsync) {
        var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

        this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
        this.initFunction(node);
        if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;

        node.params = this.toAssignableList(params, true);
        this.parseFunctionBody(node, true, false);

        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.finishNode(node, "ArrowFunctionExpression")
      };


      pp$3.parseFunctionBody = function(node, isArrowFunction, isMethod) {
        var isExpression = isArrowFunction && this.type !== types.braceL;
        var oldStrict = this.strict, useStrict = false;

        if (isExpression) {
          node.body = this.parseMaybeAssign();
          node.expression = true;
          this.checkParams(node, false);
        } else {
          var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
          if (!oldStrict || nonSimple) {
            useStrict = this.strictDirective(this.end);
            if (useStrict && nonSimple)
              { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
          }
          var oldLabels = this.labels;
          this.labels = [];
          if (useStrict) { this.strict = true; }

          this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
          node.body = this.parseBlock(false);
          node.expression = false;
          this.adaptDirectivePrologue(node.body.body);
          this.labels = oldLabels;
        }
        this.exitScope();

        if (this.strict && node.id) { this.checkLVal(node.id, BIND_OUTSIDE); }
        this.strict = oldStrict;
      };

      pp$3.isSimpleParamList = function(params) {
        for (var i = 0, list = params; i < list.length; i += 1)
          {
          var param = list[i];

          if (param.type !== "Identifier") { return false
        } }
        return true
      };


      pp$3.checkParams = function(node, allowDuplicates) {
        var nameHash = {};
        for (var i = 0, list = node.params; i < list.length; i += 1)
          {
          var param = list[i];

          this.checkLVal(param, BIND_VAR, allowDuplicates ? null : nameHash);
        }
      };


      pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
        var elts = [], first = true;
        while (!this.eat(close)) {
          if (!first) {
            this.expect(types.comma);
            if (allowTrailingComma && this.afterTrailingComma(close)) { break }
          } else { first = false; }

          var elt = (void 0);
          if (allowEmpty && this.type === types.comma)
            { elt = null; }
          else if (this.type === types.ellipsis) {
            elt = this.parseSpread(refDestructuringErrors);
            if (refDestructuringErrors && this.type === types.comma && refDestructuringErrors.trailingComma < 0)
              { refDestructuringErrors.trailingComma = this.start; }
          } else {
            elt = this.parseMaybeAssign(false, refDestructuringErrors);
          }
          elts.push(elt);
        }
        return elts
      };

      pp$3.checkUnreserved = function(ref) {
        var start = ref.start;
        var end = ref.end;
        var name = ref.name;

        if (this.inGenerator && name === "yield")
          { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
        if (this.inAsync && name === "await")
          { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
        if (this.keywords.test(name))
          { this.raise(start, ("Unexpected keyword '" + name + "'")); }
        if (this.options.ecmaVersion < 6 &&
          this.input.slice(start, end).indexOf("\\") !== -1) { return }
        var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
        if (re.test(name)) {
          if (!this.inAsync && name === "await")
            { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
          this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
        }
      };


      pp$3.parseIdent = function(liberal, isBinding) {
        var node = this.startNode();
        if (this.type === types.name) {
          node.name = this.value;
        } else if (this.type.keyword) {
          node.name = this.type.keyword;

          if ((node.name === "class" || node.name === "function") &&
              (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
            this.context.pop();
          }
        } else {
          this.unexpected();
        }
        this.next(!!liberal);
        this.finishNode(node, "Identifier");
        if (!liberal) {
          this.checkUnreserved(node);
          if (node.name === "await" && !this.awaitIdentPos)
            { this.awaitIdentPos = node.start; }
        }
        return node
      };


      pp$3.parseYield = function(noIn) {
        if (!this.yieldPos) { this.yieldPos = this.start; }

        var node = this.startNode();
        this.next();
        if (this.type === types.semi || this.canInsertSemicolon() || (this.type !== types.star && !this.type.startsExpr)) {
          node.delegate = false;
          node.argument = null;
        } else {
          node.delegate = this.eat(types.star);
          node.argument = this.parseMaybeAssign(noIn);
        }
        return this.finishNode(node, "YieldExpression")
      };

      pp$3.parseAwait = function() {
        if (!this.awaitPos) { this.awaitPos = this.start; }

        var node = this.startNode();
        this.next();
        node.argument = this.parseMaybeUnary(null, false);
        return this.finishNode(node, "AwaitExpression")
      };

      var pp$4 = Parser.prototype;


      pp$4.raise = function(pos, message) {
        var loc = getLineInfo(this.input, pos);
        message += " (" + loc.line + ":" + loc.column + ")";
        var err = new SyntaxError(message);
        err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
        throw err
      };

      pp$4.raiseRecoverable = pp$4.raise;

      pp$4.curPosition = function() {
        if (this.options.locations) {
          return new Position(this.curLine, this.pos - this.lineStart)
        }
      };

      var pp$5 = Parser.prototype;

      var Scope = function Scope(flags) {
        this.flags = flags;
        this.var = [];
        this.lexical = [];
        this.functions = [];
      };


      pp$5.enterScope = function(flags) {
        this.scopeStack.push(new Scope(flags));
      };

      pp$5.exitScope = function() {
        this.scopeStack.pop();
      };

      pp$5.treatFunctionsAsVarInScope = function(scope) {
        return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
      };

      pp$5.declareName = function(name, bindingType, pos) {
        var redeclared = false;
        if (bindingType === BIND_LEXICAL) {
          var scope = this.currentScope();
          redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
          scope.lexical.push(name);
          if (this.inModule && (scope.flags & SCOPE_TOP))
            { delete this.undefinedExports[name]; }
        } else if (bindingType === BIND_SIMPLE_CATCH) {
          var scope$1 = this.currentScope();
          scope$1.lexical.push(name);
        } else if (bindingType === BIND_FUNCTION) {
          var scope$2 = this.currentScope();
          if (this.treatFunctionsAsVar)
            { redeclared = scope$2.lexical.indexOf(name) > -1; }
          else
            { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
          scope$2.functions.push(name);
        } else {
          for (var i = this.scopeStack.length - 1; i >= 0; --i) {
            var scope$3 = this.scopeStack[i];
            if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
                !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
              redeclared = true;
              break
            }
            scope$3.var.push(name);
            if (this.inModule && (scope$3.flags & SCOPE_TOP))
              { delete this.undefinedExports[name]; }
            if (scope$3.flags & SCOPE_VAR) { break }
          }
        }
        if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
      };

      pp$5.checkLocalExport = function(id) {
        if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
            this.scopeStack[0].var.indexOf(id.name) === -1) {
          this.undefinedExports[id.name] = id;
        }
      };

      pp$5.currentScope = function() {
        return this.scopeStack[this.scopeStack.length - 1]
      };

      pp$5.currentVarScope = function() {
        for (var i = this.scopeStack.length - 1;; i--) {
          var scope = this.scopeStack[i];
          if (scope.flags & SCOPE_VAR) { return scope }
        }
      };

      pp$5.currentThisScope = function() {
        for (var i = this.scopeStack.length - 1;; i--) {
          var scope = this.scopeStack[i];
          if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW)) { return scope }
        }
      };

      var Node = function Node(parser, pos, loc) {
        this.type = "";
        this.start = pos;
        this.end = 0;
        if (parser.options.locations)
          { this.loc = new SourceLocation(parser, loc); }
        if (parser.options.directSourceFile)
          { this.sourceFile = parser.options.directSourceFile; }
        if (parser.options.ranges)
          { this.range = [pos, 0]; }
      };


      var pp$6 = Parser.prototype;

      pp$6.startNode = function() {
        return new Node(this, this.start, this.startLoc)
      };

      pp$6.startNodeAt = function(pos, loc) {
        return new Node(this, pos, loc)
      };


      function finishNodeAt(node, type, pos, loc) {
        node.type = type;
        node.end = pos;
        if (this.options.locations)
          { node.loc.end = loc; }
        if (this.options.ranges)
          { node.range[1] = pos; }
        return node
      }

      pp$6.finishNode = function(node, type) {
        return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
      };


      pp$6.finishNodeAt = function(node, type, pos, loc) {
        return finishNodeAt.call(this, node, type, pos, loc)
      };


      var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
        this.token = token;
        this.isExpr = !!isExpr;
        this.preserveSpace = !!preserveSpace;
        this.override = override;
        this.generator = !!generator;
      };

      var types$1 = {
        b_stat: new TokContext("{", false),
        b_expr: new TokContext("{", true),
        b_tmpl: new TokContext("${", false),
        p_stat: new TokContext("(", false),
        p_expr: new TokContext("(", true),
        q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
        f_stat: new TokContext("function", false),
        f_expr: new TokContext("function", true),
        f_expr_gen: new TokContext("function", true, false, null, true),
        f_gen: new TokContext("function", false, false, null, true)
      };

      var pp$7 = Parser.prototype;

      pp$7.initialContext = function() {
        return [types$1.b_stat]
      };

      pp$7.braceIsBlock = function(prevType) {
        var parent = this.curContext();
        if (parent === types$1.f_expr || parent === types$1.f_stat)
          { return true }
        if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
          { return !parent.isExpr }

        if (prevType === types._return || prevType === types.name && this.exprAllowed)
          { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
        if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow)
          { return true }
        if (prevType === types.braceL)
          { return parent === types$1.b_stat }
        if (prevType === types._var || prevType === types._const || prevType === types.name)
          { return false }
        return !this.exprAllowed
      };

      pp$7.inGeneratorContext = function() {
        for (var i = this.context.length - 1; i >= 1; i--) {
          var context = this.context[i];
          if (context.token === "function")
            { return context.generator }
        }
        return false
      };

      pp$7.updateContext = function(prevType) {
        var update, type = this.type;
        if (type.keyword && prevType === types.dot)
          { this.exprAllowed = false; }
        else if (update = type.updateContext)
          { update.call(this, prevType); }
        else
          { this.exprAllowed = type.beforeExpr; }
      };


      types.parenR.updateContext = types.braceR.updateContext = function() {
        if (this.context.length === 1) {
          this.exprAllowed = true;
          return
        }
        var out = this.context.pop();
        if (out === types$1.b_stat && this.curContext().token === "function") {
          out = this.context.pop();
        }
        this.exprAllowed = !out.isExpr;
      };

      types.braceL.updateContext = function(prevType) {
        this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
        this.exprAllowed = true;
      };

      types.dollarBraceL.updateContext = function() {
        this.context.push(types$1.b_tmpl);
        this.exprAllowed = true;
      };

      types.parenL.updateContext = function(prevType) {
        var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
        this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
        this.exprAllowed = true;
      };

      types.incDec.updateContext = function() {
      };

      types._function.updateContext = types._class.updateContext = function(prevType) {
        if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
            !(prevType === types._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) &&
            !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
          { this.context.push(types$1.f_expr); }
        else
          { this.context.push(types$1.f_stat); }
        this.exprAllowed = false;
      };

      types.backQuote.updateContext = function() {
        if (this.curContext() === types$1.q_tmpl)
          { this.context.pop(); }
        else
          { this.context.push(types$1.q_tmpl); }
        this.exprAllowed = false;
      };

      types.star.updateContext = function(prevType) {
        if (prevType === types._function) {
          var index = this.context.length - 1;
          if (this.context[index] === types$1.f_expr)
            { this.context[index] = types$1.f_expr_gen; }
          else
            { this.context[index] = types$1.f_gen; }
        }
        this.exprAllowed = true;
      };

      types.name.updateContext = function(prevType) {
        var allowed = false;
        if (this.options.ecmaVersion >= 6 && prevType !== types.dot) {
          if (this.value === "of" && !this.exprAllowed ||
              this.value === "yield" && this.inGeneratorContext())
            { allowed = true; }
        }
        this.exprAllowed = allowed;
      };


      var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
      var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
      var ecma11BinaryProperties = ecma10BinaryProperties;
      var unicodeBinaryProperties = {
        9: ecma9BinaryProperties,
        10: ecma10BinaryProperties,
        11: ecma11BinaryProperties
      };

      var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

      var ecma9ScriptValues = "Adlam Adlm Ahom Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
      var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
      var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
      var unicodeScriptValues = {
        9: ecma9ScriptValues,
        10: ecma10ScriptValues,
        11: ecma11ScriptValues
      };

      var data = {};
      function buildUnicodeData(ecmaVersion) {
        var d = data[ecmaVersion] = {
          binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
          nonBinary: {
            General_Category: wordsRegexp(unicodeGeneralCategoryValues),
            Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
          }
        };
        d.nonBinary.Script_Extensions = d.nonBinary.Script;

        d.nonBinary.gc = d.nonBinary.General_Category;
        d.nonBinary.sc = d.nonBinary.Script;
        d.nonBinary.scx = d.nonBinary.Script_Extensions;
      }
      buildUnicodeData(9);
      buildUnicodeData(10);
      buildUnicodeData(11);

      var pp$8 = Parser.prototype;

      var RegExpValidationState = function RegExpValidationState(parser) {
        this.parser = parser;
        this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "");
        this.unicodeProperties = data[parser.options.ecmaVersion >= 11 ? 11 : parser.options.ecmaVersion];
        this.source = "";
        this.flags = "";
        this.start = 0;
        this.switchU = false;
        this.switchN = false;
        this.pos = 0;
        this.lastIntValue = 0;
        this.lastStringValue = "";
        this.lastAssertionIsQuantifiable = false;
        this.numCapturingParens = 0;
        this.maxBackReference = 0;
        this.groupNames = [];
        this.backReferenceNames = [];
      };

      RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
        var unicode = flags.indexOf("u") !== -1;
        this.start = start | 0;
        this.source = pattern + "";
        this.flags = flags;
        this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
        this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
      };

      RegExpValidationState.prototype.raise = function raise (message) {
        this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
      };

      RegExpValidationState.prototype.at = function at (i) {
        var s = this.source;
        var l = s.length;
        if (i >= l) {
          return -1
        }
        var c = s.charCodeAt(i);
        if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
          return c
        }
        var next = s.charCodeAt(i + 1);
        return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
      };

      RegExpValidationState.prototype.nextIndex = function nextIndex (i) {
        var s = this.source;
        var l = s.length;
        if (i >= l) {
          return l
        }
        var c = s.charCodeAt(i), next;
        if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
            (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
          return i + 1
        }
        return i + 2
      };

      RegExpValidationState.prototype.current = function current () {
        return this.at(this.pos)
      };

      RegExpValidationState.prototype.lookahead = function lookahead () {
        return this.at(this.nextIndex(this.pos))
      };

      RegExpValidationState.prototype.advance = function advance () {
        this.pos = this.nextIndex(this.pos);
      };

      RegExpValidationState.prototype.eat = function eat (ch) {
        if (this.current() === ch) {
          this.advance();
          return true
        }
        return false
      };

      function codePointToString(ch) {
        if (ch <= 0xFFFF) { return String.fromCharCode(ch) }
        ch -= 0x10000;
        return String.fromCharCode((ch >> 10) + 0xD800, (ch & 0x03FF) + 0xDC00)
      }

      pp$8.validateRegExpFlags = function(state) {
        var validFlags = state.validFlags;
        var flags = state.flags;

        for (var i = 0; i < flags.length; i++) {
          var flag = flags.charAt(i);
          if (validFlags.indexOf(flag) === -1) {
            this.raise(state.start, "Invalid regular expression flag");
          }
          if (flags.indexOf(flag, i + 1) > -1) {
            this.raise(state.start, "Duplicate regular expression flag");
          }
        }
      };

      pp$8.validateRegExpPattern = function(state) {
        this.regexp_pattern(state);

        if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
          state.switchN = true;
          this.regexp_pattern(state);
        }
      };

      pp$8.regexp_pattern = function(state) {
        state.pos = 0;
        state.lastIntValue = 0;
        state.lastStringValue = "";
        state.lastAssertionIsQuantifiable = false;
        state.numCapturingParens = 0;
        state.maxBackReference = 0;
        state.groupNames.length = 0;
        state.backReferenceNames.length = 0;

        this.regexp_disjunction(state);

        if (state.pos !== state.source.length) {
          if (state.eat(0x29 )) {
            state.raise("Unmatched ')'");
          }
          if (state.eat(0x5D ) || state.eat(0x7D )) {
            state.raise("Lone quantifier brackets");
          }
        }
        if (state.maxBackReference > state.numCapturingParens) {
          state.raise("Invalid escape");
        }
        for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
          var name = list[i];

          if (state.groupNames.indexOf(name) === -1) {
            state.raise("Invalid named capture referenced");
          }
        }
      };

      pp$8.regexp_disjunction = function(state) {
        this.regexp_alternative(state);
        while (state.eat(0x7C )) {
          this.regexp_alternative(state);
        }

        if (this.regexp_eatQuantifier(state, true)) {
          state.raise("Nothing to repeat");
        }
        if (state.eat(0x7B )) {
          state.raise("Lone quantifier brackets");
        }
      };

      pp$8.regexp_alternative = function(state) {
        while (state.pos < state.source.length && this.regexp_eatTerm(state))
          { }
      };

      pp$8.regexp_eatTerm = function(state) {
        if (this.regexp_eatAssertion(state)) {
          if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
            if (state.switchU) {
              state.raise("Invalid quantifier");
            }
          }
          return true
        }

        if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
          this.regexp_eatQuantifier(state);
          return true
        }

        return false
      };

      pp$8.regexp_eatAssertion = function(state) {
        var start = state.pos;
        state.lastAssertionIsQuantifiable = false;

        if (state.eat(0x5E ) || state.eat(0x24 )) {
          return true
        }

        if (state.eat(0x5C )) {
          if (state.eat(0x42 ) || state.eat(0x62 )) {
            return true
          }
          state.pos = start;
        }

        if (state.eat(0x28 ) && state.eat(0x3F )) {
          var lookbehind = false;
          if (this.options.ecmaVersion >= 9) {
            lookbehind = state.eat(0x3C );
          }
          if (state.eat(0x3D ) || state.eat(0x21 )) {
            this.regexp_disjunction(state);
            if (!state.eat(0x29 )) {
              state.raise("Unterminated group");
            }
            state.lastAssertionIsQuantifiable = !lookbehind;
            return true
          }
        }

        state.pos = start;
        return false
      };

      pp$8.regexp_eatQuantifier = function(state, noError) {
        if ( noError === void 0 ) noError = false;

        if (this.regexp_eatQuantifierPrefix(state, noError)) {
          state.eat(0x3F );
          return true
        }
        return false
      };

      pp$8.regexp_eatQuantifierPrefix = function(state, noError) {
        return (
          state.eat(0x2A ) ||
          state.eat(0x2B ) ||
          state.eat(0x3F ) ||
          this.regexp_eatBracedQuantifier(state, noError)
        )
      };
      pp$8.regexp_eatBracedQuantifier = function(state, noError) {
        var start = state.pos;
        if (state.eat(0x7B )) {
          var min = 0, max = -1;
          if (this.regexp_eatDecimalDigits(state)) {
            min = state.lastIntValue;
            if (state.eat(0x2C ) && this.regexp_eatDecimalDigits(state)) {
              max = state.lastIntValue;
            }
            if (state.eat(0x7D )) {
              if (max !== -1 && max < min && !noError) {
                state.raise("numbers out of order in {} quantifier");
              }
              return true
            }
          }
          if (state.switchU && !noError) {
            state.raise("Incomplete quantifier");
          }
          state.pos = start;
        }
        return false
      };

      pp$8.regexp_eatAtom = function(state) {
        return (
          this.regexp_eatPatternCharacters(state) ||
          state.eat(0x2E ) ||
          this.regexp_eatReverseSolidusAtomEscape(state) ||
          this.regexp_eatCharacterClass(state) ||
          this.regexp_eatUncapturingGroup(state) ||
          this.regexp_eatCapturingGroup(state)
        )
      };
      pp$8.regexp_eatReverseSolidusAtomEscape = function(state) {
        var start = state.pos;
        if (state.eat(0x5C )) {
          if (this.regexp_eatAtomEscape(state)) {
            return true
          }
          state.pos = start;
        }
        return false
      };
      pp$8.regexp_eatUncapturingGroup = function(state) {
        var start = state.pos;
        if (state.eat(0x28 )) {
          if (state.eat(0x3F ) && state.eat(0x3A )) {
            this.regexp_disjunction(state);
            if (state.eat(0x29 )) {
              return true
            }
            state.raise("Unterminated group");
          }
          state.pos = start;
        }
        return false
      };
      pp$8.regexp_eatCapturingGroup = function(state) {
        if (state.eat(0x28 )) {
          if (this.options.ecmaVersion >= 9) {
            this.regexp_groupSpecifier(state);
          } else if (state.current() === 0x3F ) {
            state.raise("Invalid group");
          }
          this.regexp_disjunction(state);
          if (state.eat(0x29 )) {
            state.numCapturingParens += 1;
            return true
          }
          state.raise("Unterminated group");
        }
        return false
      };

      pp$8.regexp_eatExtendedAtom = function(state) {
        return (
          state.eat(0x2E ) ||
          this.regexp_eatReverseSolidusAtomEscape(state) ||
          this.regexp_eatCharacterClass(state) ||
          this.regexp_eatUncapturingGroup(state) ||
          this.regexp_eatCapturingGroup(state) ||
          this.regexp_eatInvalidBracedQuantifier(state) ||
          this.regexp_eatExtendedPatternCharacter(state)
        )
      };

      pp$8.regexp_eatInvalidBracedQuantifier = function(state) {
        if (this.regexp_eatBracedQuantifier(state, true)) {
          state.raise("Nothing to repeat");
        }
        return false
      };

      pp$8.regexp_eatSyntaxCharacter = function(state) {
        var ch = state.current();
        if (isSyntaxCharacter(ch)) {
          state.lastIntValue = ch;
          state.advance();
          return true
        }
        return false
      };
      function isSyntaxCharacter(ch) {
        return (
          ch === 0x24  ||
          ch >= 0x28  && ch <= 0x2B  ||
          ch === 0x2E  ||
          ch === 0x3F  ||
          ch >= 0x5B  && ch <= 0x5E  ||
          ch >= 0x7B  && ch <= 0x7D 
        )
      }

      pp$8.regexp_eatPatternCharacters = function(state) {
        var start = state.pos;
        var ch = 0;
        while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
          state.advance();
        }
        return state.pos !== start
      };

      pp$8.regexp_eatExtendedPatternCharacter = function(state) {
        var ch = state.current();
        if (
          ch !== -1 &&
          ch !== 0x24  &&
          !(ch >= 0x28  && ch <= 0x2B ) &&
          ch !== 0x2E  &&
          ch !== 0x3F  &&
          ch !== 0x5B  &&
          ch !== 0x5E  &&
          ch !== 0x7C 
        ) {
          state.advance();
          return true
        }
        return false
      };

      pp$8.regexp_groupSpecifier = function(state) {
        if (state.eat(0x3F )) {
          if (this.regexp_eatGroupName(state)) {
            if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
              state.raise("Duplicate capture group name");
            }
            state.groupNames.push(state.lastStringValue);
            return
          }
          state.raise("Invalid group");
        }
      };

      pp$8.regexp_eatGroupName = function(state) {
        state.lastStringValue = "";
        if (state.eat(0x3C )) {
          if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E )) {
            return true
          }
          state.raise("Invalid capture group name");
        }
        return false
      };

      pp$8.regexp_eatRegExpIdentifierName = function(state) {
        state.lastStringValue = "";
        if (this.regexp_eatRegExpIdentifierStart(state)) {
          state.lastStringValue += codePointToString(state.lastIntValue);
          while (this.regexp_eatRegExpIdentifierPart(state)) {
            state.lastStringValue += codePointToString(state.lastIntValue);
          }
          return true
        }
        return false
      };

      pp$8.regexp_eatRegExpIdentifierStart = function(state) {
        var start = state.pos;
        var ch = state.current();
        state.advance();

        if (ch === 0x5C  && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
          ch = state.lastIntValue;
        }
        if (isRegExpIdentifierStart(ch)) {
          state.lastIntValue = ch;
          return true
        }

        state.pos = start;
        return false
      };
      function isRegExpIdentifierStart(ch) {
        return isIdentifierStart(ch, true) || ch === 0x24  || ch === 0x5F 
      }

      pp$8.regexp_eatRegExpIdentifierPart = function(state) {
        var start = state.pos;
        var ch = state.current();
        state.advance();

        if (ch === 0x5C  && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
          ch = state.lastIntValue;
        }
        if (isRegExpIdentifierPart(ch)) {
          state.lastIntValue = ch;
          return true
        }

        state.pos = start;
        return false
      };
      function isRegExpIdentifierPart(ch) {
        return isIdentifierChar(ch, true) || ch === 0x24  || ch === 0x5F  || ch === 0x200C  || ch === 0x200D 
      }

      pp$8.regexp_eatAtomEscape = function(state) {
        if (
          this.regexp_eatBackReference(state) ||
          this.regexp_eatCharacterClassEscape(state) ||
          this.regexp_eatCharacterEscape(state) ||
          (state.switchN && this.regexp_eatKGroupName(state))
        ) {
          return true
        }
        if (state.switchU) {
          if (state.current() === 0x63 ) {
            state.raise("Invalid unicode escape");
          }
          state.raise("Invalid escape");
        }
        return false
      };
      pp$8.regexp_eatBackReference = function(state) {
        var start = state.pos;
        if (this.regexp_eatDecimalEscape(state)) {
          var n = state.lastIntValue;
          if (state.switchU) {
            if (n > state.maxBackReference) {
              state.maxBackReference = n;
            }
            return true
          }
          if (n <= state.numCapturingParens) {
            return true
          }
          state.pos = start;
        }
        return false
      };
      pp$8.regexp_eatKGroupName = function(state) {
        if (state.eat(0x6B )) {
          if (this.regexp_eatGroupName(state)) {
            state.backReferenceNames.push(state.lastStringValue);
            return true
          }
          state.raise("Invalid named reference");
        }
        return false
      };

      pp$8.regexp_eatCharacterEscape = function(state) {
        return (
          this.regexp_eatControlEscape(state) ||
          this.regexp_eatCControlLetter(state) ||
          this.regexp_eatZero(state) ||
          this.regexp_eatHexEscapeSequence(state) ||
          this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
          (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
          this.regexp_eatIdentityEscape(state)
        )
      };
      pp$8.regexp_eatCControlLetter = function(state) {
        var start = state.pos;
        if (state.eat(0x63 )) {
          if (this.regexp_eatControlLetter(state)) {
            return true
          }
          state.pos = start;
        }
        return false
      };
      pp$8.regexp_eatZero = function(state) {
        if (state.current() === 0x30  && !isDecimalDigit(state.lookahead())) {
          state.lastIntValue = 0;
          state.advance();
          return true
        }
        return false
      };

      pp$8.regexp_eatControlEscape = function(state) {
        var ch = state.current();
        if (ch === 0x74 ) {
          state.lastIntValue = 0x09; 
          state.advance();
          return true
        }
        if (ch === 0x6E ) {
          state.lastIntValue = 0x0A; 
          state.advance();
          return true
        }
        if (ch === 0x76 ) {
          state.lastIntValue = 0x0B; 
          state.advance();
          return true
        }
        if (ch === 0x66 ) {
          state.lastIntValue = 0x0C; 
          state.advance();
          return true
        }
        if (ch === 0x72 ) {
          state.lastIntValue = 0x0D; 
          state.advance();
          return true
        }
        return false
      };

      pp$8.regexp_eatControlLetter = function(state) {
        var ch = state.current();
        if (isControlLetter(ch)) {
          state.lastIntValue = ch % 0x20;
          state.advance();
          return true
        }
        return false
      };
      function isControlLetter(ch) {
        return (
          (ch >= 0x41  && ch <= 0x5A ) ||
          (ch >= 0x61  && ch <= 0x7A )
        )
      }

      pp$8.regexp_eatRegExpUnicodeEscapeSequence = function(state) {
        var start = state.pos;

        if (state.eat(0x75 )) {
          if (this.regexp_eatFixedHexDigits(state, 4)) {
            var lead = state.lastIntValue;
            if (state.switchU && lead >= 0xD800 && lead <= 0xDBFF) {
              var leadSurrogateEnd = state.pos;
              if (state.eat(0x5C ) && state.eat(0x75 ) && this.regexp_eatFixedHexDigits(state, 4)) {
                var trail = state.lastIntValue;
                if (trail >= 0xDC00 && trail <= 0xDFFF) {
                  state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
                  return true
                }
              }
              state.pos = leadSurrogateEnd;
              state.lastIntValue = lead;
            }
            return true
          }
          if (
            state.switchU &&
            state.eat(0x7B ) &&
            this.regexp_eatHexDigits(state) &&
            state.eat(0x7D ) &&
            isValidUnicode(state.lastIntValue)
          ) {
            return true
          }
          if (state.switchU) {
            state.raise("Invalid unicode escape");
          }
          state.pos = start;
        }

        return false
      };
      function isValidUnicode(ch) {
        return ch >= 0 && ch <= 0x10FFFF
      }

      pp$8.regexp_eatIdentityEscape = function(state) {
        if (state.switchU) {
          if (this.regexp_eatSyntaxCharacter(state)) {
            return true
          }
          if (state.eat(0x2F )) {
            state.lastIntValue = 0x2F; 
            return true
          }
          return false
        }

        var ch = state.current();
        if (ch !== 0x63  && (!state.switchN || ch !== 0x6B )) {
          state.lastIntValue = ch;
          state.advance();
          return true
        }

        return false
      };

      pp$8.regexp_eatDecimalEscape = function(state) {
        state.lastIntValue = 0;
        var ch = state.current();
        if (ch >= 0x31  && ch <= 0x39 ) {
          do {
            state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 );
            state.advance();
          } while ((ch = state.current()) >= 0x30  && ch <= 0x39 )
          return true
        }
        return false
      };

      pp$8.regexp_eatCharacterClassEscape = function(state) {
        var ch = state.current();

        if (isCharacterClassEscape(ch)) {
          state.lastIntValue = -1;
          state.advance();
          return true
        }

        if (
          state.switchU &&
          this.options.ecmaVersion >= 9 &&
          (ch === 0x50  || ch === 0x70 )
        ) {
          state.lastIntValue = -1;
          state.advance();
          if (
            state.eat(0x7B ) &&
            this.regexp_eatUnicodePropertyValueExpression(state) &&
            state.eat(0x7D )
          ) {
            return true
          }
          state.raise("Invalid property name");
        }

        return false
      };
      function isCharacterClassEscape(ch) {
        return (
          ch === 0x64  ||
          ch === 0x44  ||
          ch === 0x73  ||
          ch === 0x53  ||
          ch === 0x77  ||
          ch === 0x57 
        )
      }

      pp$8.regexp_eatUnicodePropertyValueExpression = function(state) {
        var start = state.pos;

        if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D )) {
          var name = state.lastStringValue;
          if (this.regexp_eatUnicodePropertyValue(state)) {
            var value = state.lastStringValue;
            this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
            return true
          }
        }
        state.pos = start;

        if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
          var nameOrValue = state.lastStringValue;
          this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
          return true
        }
        return false
      };
      pp$8.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
        if (!has(state.unicodeProperties.nonBinary, name))
          { state.raise("Invalid property name"); }
        if (!state.unicodeProperties.nonBinary[name].test(value))
          { state.raise("Invalid property value"); }
      };
      pp$8.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
        if (!state.unicodeProperties.binary.test(nameOrValue))
          { state.raise("Invalid property name"); }
      };

      pp$8.regexp_eatUnicodePropertyName = function(state) {
        var ch = 0;
        state.lastStringValue = "";
        while (isUnicodePropertyNameCharacter(ch = state.current())) {
          state.lastStringValue += codePointToString(ch);
          state.advance();
        }
        return state.lastStringValue !== ""
      };
      function isUnicodePropertyNameCharacter(ch) {
        return isControlLetter(ch) || ch === 0x5F 
      }

      pp$8.regexp_eatUnicodePropertyValue = function(state) {
        var ch = 0;
        state.lastStringValue = "";
        while (isUnicodePropertyValueCharacter(ch = state.current())) {
          state.lastStringValue += codePointToString(ch);
          state.advance();
        }
        return state.lastStringValue !== ""
      };
      function isUnicodePropertyValueCharacter(ch) {
        return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
      }

      pp$8.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
        return this.regexp_eatUnicodePropertyValue(state)
      };

      pp$8.regexp_eatCharacterClass = function(state) {
        if (state.eat(0x5B )) {
          state.eat(0x5E );
          this.regexp_classRanges(state);
          if (state.eat(0x5D )) {
            return true
          }
          state.raise("Unterminated character class");
        }
        return false
      };

      pp$8.regexp_classRanges = function(state) {
        while (this.regexp_eatClassAtom(state)) {
          var left = state.lastIntValue;
          if (state.eat(0x2D ) && this.regexp_eatClassAtom(state)) {
            var right = state.lastIntValue;
            if (state.switchU && (left === -1 || right === -1)) {
              state.raise("Invalid character class");
            }
            if (left !== -1 && right !== -1 && left > right) {
              state.raise("Range out of order in character class");
            }
          }
        }
      };

      pp$8.regexp_eatClassAtom = function(state) {
        var start = state.pos;

        if (state.eat(0x5C )) {
          if (this.regexp_eatClassEscape(state)) {
            return true
          }
          if (state.switchU) {
            var ch$1 = state.current();
            if (ch$1 === 0x63  || isOctalDigit(ch$1)) {
              state.raise("Invalid class escape");
            }
            state.raise("Invalid escape");
          }
          state.pos = start;
        }

        var ch = state.current();
        if (ch !== 0x5D ) {
          state.lastIntValue = ch;
          state.advance();
          return true
        }

        return false
      };

      pp$8.regexp_eatClassEscape = function(state) {
        var start = state.pos;

        if (state.eat(0x62 )) {
          state.lastIntValue = 0x08; 
          return true
        }

        if (state.switchU && state.eat(0x2D )) {
          state.lastIntValue = 0x2D; 
          return true
        }

        if (!state.switchU && state.eat(0x63 )) {
          if (this.regexp_eatClassControlLetter(state)) {
            return true
          }
          state.pos = start;
        }

        return (
          this.regexp_eatCharacterClassEscape(state) ||
          this.regexp_eatCharacterEscape(state)
        )
      };

      pp$8.regexp_eatClassControlLetter = function(state) {
        var ch = state.current();
        if (isDecimalDigit(ch) || ch === 0x5F ) {
          state.lastIntValue = ch % 0x20;
          state.advance();
          return true
        }
        return false
      };

      pp$8.regexp_eatHexEscapeSequence = function(state) {
        var start = state.pos;
        if (state.eat(0x78 )) {
          if (this.regexp_eatFixedHexDigits(state, 2)) {
            return true
          }
          if (state.switchU) {
            state.raise("Invalid escape");
          }
          state.pos = start;
        }
        return false
      };

      pp$8.regexp_eatDecimalDigits = function(state) {
        var start = state.pos;
        var ch = 0;
        state.lastIntValue = 0;
        while (isDecimalDigit(ch = state.current())) {
          state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 );
          state.advance();
        }
        return state.pos !== start
      };
      function isDecimalDigit(ch) {
        return ch >= 0x30  && ch <= 0x39 
      }

      pp$8.regexp_eatHexDigits = function(state) {
        var start = state.pos;
        var ch = 0;
        state.lastIntValue = 0;
        while (isHexDigit(ch = state.current())) {
          state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
          state.advance();
        }
        return state.pos !== start
      };
      function isHexDigit(ch) {
        return (
          (ch >= 0x30  && ch <= 0x39 ) ||
          (ch >= 0x41  && ch <= 0x46 ) ||
          (ch >= 0x61  && ch <= 0x66 )
        )
      }
      function hexToInt(ch) {
        if (ch >= 0x41  && ch <= 0x46 ) {
          return 10 + (ch - 0x41 )
        }
        if (ch >= 0x61  && ch <= 0x66 ) {
          return 10 + (ch - 0x61 )
        }
        return ch - 0x30 
      }

      pp$8.regexp_eatLegacyOctalEscapeSequence = function(state) {
        if (this.regexp_eatOctalDigit(state)) {
          var n1 = state.lastIntValue;
          if (this.regexp_eatOctalDigit(state)) {
            var n2 = state.lastIntValue;
            if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
              state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
            } else {
              state.lastIntValue = n1 * 8 + n2;
            }
          } else {
            state.lastIntValue = n1;
          }
          return true
        }
        return false
      };

      pp$8.regexp_eatOctalDigit = function(state) {
        var ch = state.current();
        if (isOctalDigit(ch)) {
          state.lastIntValue = ch - 0x30; 
          state.advance();
          return true
        }
        state.lastIntValue = 0;
        return false
      };
      function isOctalDigit(ch) {
        return ch >= 0x30  && ch <= 0x37 
      }

      pp$8.regexp_eatFixedHexDigits = function(state, length) {
        var start = state.pos;
        state.lastIntValue = 0;
        for (var i = 0; i < length; ++i) {
          var ch = state.current();
          if (!isHexDigit(ch)) {
            state.pos = start;
            return false
          }
          state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
          state.advance();
        }
        return true
      };


      var Token = function Token(p) {
        this.type = p.type;
        this.value = p.value;
        this.start = p.start;
        this.end = p.end;
        if (p.options.locations)
          { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
        if (p.options.ranges)
          { this.range = [p.start, p.end]; }
      };


      var pp$9 = Parser.prototype;


      pp$9.next = function(ignoreEscapeSequenceInKeyword) {
        if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
          { this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword); }
        if (this.options.onToken)
          { this.options.onToken(new Token(this)); }

        this.lastTokEnd = this.end;
        this.lastTokStart = this.start;
        this.lastTokEndLoc = this.endLoc;
        this.lastTokStartLoc = this.startLoc;
        this.nextToken();
      };

      pp$9.getToken = function() {
        this.next();
        return new Token(this)
      };

      if (typeof Symbol !== "undefined")
        { pp$9[Symbol.iterator] = function() {
          var this$1 = this;

          return {
            next: function () {
              var token = this$1.getToken();
              return {
                done: token.type === types.eof,
                value: token
              }
            }
          }
        }; }


      pp$9.curContext = function() {
        return this.context[this.context.length - 1]
      };


      pp$9.nextToken = function() {
        var curContext = this.curContext();
        if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

        this.start = this.pos;
        if (this.options.locations) { this.startLoc = this.curPosition(); }
        if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

        if (curContext.override) { return curContext.override(this) }
        else { this.readToken(this.fullCharCodeAtPos()); }
      };

      pp$9.readToken = function(code) {
        if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 )
          { return this.readWord() }

        return this.getTokenFromCode(code)
      };

      pp$9.fullCharCodeAtPos = function() {
        var code = this.input.charCodeAt(this.pos);
        if (code <= 0xd7ff || code >= 0xe000) { return code }
        var next = this.input.charCodeAt(this.pos + 1);
        return (code << 10) + next - 0x35fdc00
      };

      pp$9.skipBlockComment = function() {
        var startLoc = this.options.onComment && this.curPosition();
        var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
        if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
        this.pos = end + 2;
        if (this.options.locations) {
          lineBreakG.lastIndex = start;
          var match;
          while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
            ++this.curLine;
            this.lineStart = match.index + match[0].length;
          }
        }
        if (this.options.onComment)
          { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                                 startLoc, this.curPosition()); }
      };

      pp$9.skipLineComment = function(startSkip) {
        var start = this.pos;
        var startLoc = this.options.onComment && this.curPosition();
        var ch = this.input.charCodeAt(this.pos += startSkip);
        while (this.pos < this.input.length && !isNewLine(ch)) {
          ch = this.input.charCodeAt(++this.pos);
        }
        if (this.options.onComment)
          { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                                 startLoc, this.curPosition()); }
      };


      pp$9.skipSpace = function() {
        loop: while (this.pos < this.input.length) {
          var ch = this.input.charCodeAt(this.pos);
          switch (ch) {
          case 32: case 160: 
            ++this.pos;
            break
          case 13:
            if (this.input.charCodeAt(this.pos + 1) === 10) {
              ++this.pos;
            }
          case 10: case 8232: case 8233:
            ++this.pos;
            if (this.options.locations) {
              ++this.curLine;
              this.lineStart = this.pos;
            }
            break
          case 47: 
            switch (this.input.charCodeAt(this.pos + 1)) {
            case 42: 
              this.skipBlockComment();
              break
            case 47:
              this.skipLineComment(2);
              break
            default:
              break loop
            }
            break
          default:
            if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
              ++this.pos;
            } else {
              break loop
            }
          }
        }
      };


      pp$9.finishToken = function(type, val) {
        this.end = this.pos;
        if (this.options.locations) { this.endLoc = this.curPosition(); }
        var prevType = this.type;
        this.type = type;
        this.value = val;

        this.updateContext(prevType);
      };


      pp$9.readToken_dot = function() {
        var next = this.input.charCodeAt(this.pos + 1);
        if (next >= 48 && next <= 57) { return this.readNumber(true) }
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { 
          this.pos += 3;
          return this.finishToken(types.ellipsis)
        } else {
          ++this.pos;
          return this.finishToken(types.dot)
        }
      };

      pp$9.readToken_slash = function() { 
        var next = this.input.charCodeAt(this.pos + 1);
        if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
        if (next === 61) { return this.finishOp(types.assign, 2) }
        return this.finishOp(types.slash, 1)
      };

      pp$9.readToken_mult_modulo_exp = function(code) { 
        var next = this.input.charCodeAt(this.pos + 1);
        var size = 1;
        var tokentype = code === 42 ? types.star : types.modulo;

        if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
          ++size;
          tokentype = types.starstar;
          next = this.input.charCodeAt(this.pos + 2);
        }

        if (next === 61) { return this.finishOp(types.assign, size + 1) }
        return this.finishOp(tokentype, size)
      };

      pp$9.readToken_pipe_amp = function(code) { 
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
        if (next === 61) { return this.finishOp(types.assign, 2) }
        return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
      };

      pp$9.readToken_caret = function() { 
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === 61) { return this.finishOp(types.assign, 2) }
        return this.finishOp(types.bitwiseXOR, 1)
      };

      pp$9.readToken_plus_min = function(code) { 
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === code) {
          if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
              (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
            this.skipLineComment(3);
            this.skipSpace();
            return this.nextToken()
          }
          return this.finishOp(types.incDec, 2)
        }
        if (next === 61) { return this.finishOp(types.assign, 2) }
        return this.finishOp(types.plusMin, 1)
      };

      pp$9.readToken_lt_gt = function(code) { 
        var next = this.input.charCodeAt(this.pos + 1);
        var size = 1;
        if (next === code) {
          size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
          if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
          return this.finishOp(types.bitShift, size)
        }
        if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
            this.input.charCodeAt(this.pos + 3) === 45) {
          this.skipLineComment(4);
          this.skipSpace();
          return this.nextToken()
        }
        if (next === 61) { size = 2; }
        return this.finishOp(types.relational, size)
      };

      pp$9.readToken_eq_excl = function(code) { 
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
        if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { 
          this.pos += 2;
          return this.finishToken(types.arrow)
        }
        return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
      };

      pp$9.getTokenFromCode = function(code) {
        switch (code) {
        case 46: 
          return this.readToken_dot()

        case 40: ++this.pos; return this.finishToken(types.parenL)
        case 41: ++this.pos; return this.finishToken(types.parenR)
        case 59: ++this.pos; return this.finishToken(types.semi)
        case 44: ++this.pos; return this.finishToken(types.comma)
        case 91: ++this.pos; return this.finishToken(types.bracketL)
        case 93: ++this.pos; return this.finishToken(types.bracketR)
        case 123: ++this.pos; return this.finishToken(types.braceL)
        case 125: ++this.pos; return this.finishToken(types.braceR)
        case 58: ++this.pos; return this.finishToken(types.colon)
        case 63: ++this.pos; return this.finishToken(types.question)

        case 96: 
          if (this.options.ecmaVersion < 6) { break }
          ++this.pos;
          return this.finishToken(types.backQuote)

        case 48: 
          var next = this.input.charCodeAt(this.pos + 1);
          if (next === 120 || next === 88) { return this.readRadixNumber(16) } 
          if (this.options.ecmaVersion >= 6) {
            if (next === 111 || next === 79) { return this.readRadixNumber(8) } 
            if (next === 98 || next === 66) { return this.readRadixNumber(2) } 
          }

        case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: 
          return this.readNumber(false)

        case 34: case 39: 
          return this.readString(code)


        case 47: 
          return this.readToken_slash()

        case 37: case 42: 
          return this.readToken_mult_modulo_exp(code)

        case 124: case 38: 
          return this.readToken_pipe_amp(code)

        case 94: 
          return this.readToken_caret()

        case 43: case 45: 
          return this.readToken_plus_min(code)

        case 60: case 62: 
          return this.readToken_lt_gt(code)

        case 61: case 33: 
          return this.readToken_eq_excl(code)

        case 126: 
          return this.finishOp(types.prefix, 1)
        }

        this.raise(this.pos, "Unexpected character '" + codePointToString$1(code) + "'");
      };

      pp$9.finishOp = function(type, size) {
        var str = this.input.slice(this.pos, this.pos + size);
        this.pos += size;
        return this.finishToken(type, str)
      };

      pp$9.readRegexp = function() {
        var escaped, inClass, start = this.pos;
        for (;;) {
          if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
          var ch = this.input.charAt(this.pos);
          if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
          if (!escaped) {
            if (ch === "[") { inClass = true; }
            else if (ch === "]" && inClass) { inClass = false; }
            else if (ch === "/" && !inClass) { break }
            escaped = ch === "\\";
          } else { escaped = false; }
          ++this.pos;
        }
        var pattern = this.input.slice(start, this.pos);
        ++this.pos;
        var flagsStart = this.pos;
        var flags = this.readWord1();
        if (this.containsEsc) { this.unexpected(flagsStart); }

        var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
        state.reset(start, pattern, flags);
        this.validateRegExpFlags(state);
        this.validateRegExpPattern(state);

        var value = null;
        try {
          value = new RegExp(pattern, flags);
        } catch (e) {
        }

        return this.finishToken(types.regexp, {pattern: pattern, flags: flags, value: value})
      };


      pp$9.readInt = function(radix, len) {
        var start = this.pos, total = 0;
        for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
          var code = this.input.charCodeAt(this.pos), val = (void 0);
          if (code >= 97) { val = code - 97 + 10; } 
          else if (code >= 65) { val = code - 65 + 10; } 
          else if (code >= 48 && code <= 57) { val = code - 48; } 
          else { val = Infinity; }
          if (val >= radix) { break }
          ++this.pos;
          total = total * radix + val;
        }
        if (this.pos === start || len != null && this.pos - start !== len) { return null }

        return total
      };

      pp$9.readRadixNumber = function(radix) {
        var start = this.pos;
        this.pos += 2; 
        var val = this.readInt(radix);
        if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
        if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
          val = typeof BigInt !== "undefined" ? BigInt(this.input.slice(start, this.pos)) : null;
          ++this.pos;
        } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
        return this.finishToken(types.num, val)
      };


      pp$9.readNumber = function(startsWithDot) {
        var start = this.pos;
        if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
        var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
        if (octal && this.strict) { this.raise(start, "Invalid number"); }
        var next = this.input.charCodeAt(this.pos);
        if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
          var str$1 = this.input.slice(start, this.pos);
          var val$1 = typeof BigInt !== "undefined" ? BigInt(str$1) : null;
          ++this.pos;
          if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
          return this.finishToken(types.num, val$1)
        }
        if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
        if (next === 46 && !octal) { 
          ++this.pos;
          this.readInt(10);
          next = this.input.charCodeAt(this.pos);
        }
        if ((next === 69 || next === 101) && !octal) { 
          next = this.input.charCodeAt(++this.pos);
          if (next === 43 || next === 45) { ++this.pos; } 
          if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
        }
        if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

        var str = this.input.slice(start, this.pos);
        var val = octal ? parseInt(str, 8) : parseFloat(str);
        return this.finishToken(types.num, val)
      };


      pp$9.readCodePoint = function() {
        var ch = this.input.charCodeAt(this.pos), code;

        if (ch === 123) { 
          if (this.options.ecmaVersion < 6) { this.unexpected(); }
          var codePos = ++this.pos;
          code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
          ++this.pos;
          if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
        } else {
          code = this.readHexChar(4);
        }
        return code
      };

      function codePointToString$1(code) {
        if (code <= 0xFFFF) { return String.fromCharCode(code) }
        code -= 0x10000;
        return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
      }

      pp$9.readString = function(quote) {
        var out = "", chunkStart = ++this.pos;
        for (;;) {
          if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
          var ch = this.input.charCodeAt(this.pos);
          if (ch === quote) { break }
          if (ch === 92) { 
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(false);
            chunkStart = this.pos;
          } else {
            if (isNewLine(ch, this.options.ecmaVersion >= 10)) { this.raise(this.start, "Unterminated string constant"); }
            ++this.pos;
          }
        }
        out += this.input.slice(chunkStart, this.pos++);
        return this.finishToken(types.string, out)
      };


      var INVALID_TEMPLATE_ESCAPE_ERROR = {};

      pp$9.tryReadTemplateToken = function() {
        this.inTemplateElement = true;
        try {
          this.readTmplToken();
        } catch (err) {
          if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
            this.readInvalidTemplateToken();
          } else {
            throw err
          }
        }

        this.inTemplateElement = false;
      };

      pp$9.invalidStringToken = function(position, message) {
        if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
          throw INVALID_TEMPLATE_ESCAPE_ERROR
        } else {
          this.raise(position, message);
        }
      };

      pp$9.readTmplToken = function() {
        var out = "", chunkStart = this.pos;
        for (;;) {
          if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
          var ch = this.input.charCodeAt(this.pos);
          if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { 
            if (this.pos === this.start && (this.type === types.template || this.type === types.invalidTemplate)) {
              if (ch === 36) {
                this.pos += 2;
                return this.finishToken(types.dollarBraceL)
              } else {
                ++this.pos;
                return this.finishToken(types.backQuote)
              }
            }
            out += this.input.slice(chunkStart, this.pos);
            return this.finishToken(types.template, out)
          }
          if (ch === 92) { 
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(true);
            chunkStart = this.pos;
          } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.pos);
            ++this.pos;
            switch (ch) {
            case 13:
              if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
            case 10:
              out += "\n";
              break
            default:
              out += String.fromCharCode(ch);
              break
            }
            if (this.options.locations) {
              ++this.curLine;
              this.lineStart = this.pos;
            }
            chunkStart = this.pos;
          } else {
            ++this.pos;
          }
        }
      };

      pp$9.readInvalidTemplateToken = function() {
        for (; this.pos < this.input.length; this.pos++) {
          switch (this.input[this.pos]) {
          case "\\":
            ++this.pos;
            break

          case "$":
            if (this.input[this.pos + 1] !== "{") {
              break
            }

          case "`":
            return this.finishToken(types.invalidTemplate, this.input.slice(this.start, this.pos))

          }
        }
        this.raise(this.start, "Unterminated template");
      };


      pp$9.readEscapedChar = function(inTemplate) {
        var ch = this.input.charCodeAt(++this.pos);
        ++this.pos;
        switch (ch) {
        case 110: return "\n" 
        case 114: return "\r" 
        case 120: return String.fromCharCode(this.readHexChar(2)) 
        case 117: return codePointToString$1(this.readCodePoint()) 
        case 116: return "\t" 
        case 98: return "\b" 
        case 118: return "\u000b" 
        case 102: return "\f" 
        case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } 
        case 10: 
          if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
          return ""
        case 56:
        case 57:
          if (inTemplate) {
            var codePos = this.pos - 1;

            this.invalidStringToken(
              codePos,
              "Invalid escape sequence in template string"
            );

            return null
          }
        default:
          if (ch >= 48 && ch <= 55) {
            var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
            var octal = parseInt(octalStr, 8);
            if (octal > 255) {
              octalStr = octalStr.slice(0, -1);
              octal = parseInt(octalStr, 8);
            }
            this.pos += octalStr.length - 1;
            ch = this.input.charCodeAt(this.pos);
            if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
              this.invalidStringToken(
                this.pos - 1 - octalStr.length,
                inTemplate
                  ? "Octal literal in template string"
                  : "Octal literal in strict mode"
              );
            }
            return String.fromCharCode(octal)
          }
          if (isNewLine(ch)) {
            return ""
          }
          return String.fromCharCode(ch)
        }
      };


      pp$9.readHexChar = function(len) {
        var codePos = this.pos;
        var n = this.readInt(16, len);
        if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
        return n
      };


      pp$9.readWord1 = function() {
        this.containsEsc = false;
        var word = "", first = true, chunkStart = this.pos;
        var astral = this.options.ecmaVersion >= 6;
        while (this.pos < this.input.length) {
          var ch = this.fullCharCodeAtPos();
          if (isIdentifierChar(ch, astral)) {
            this.pos += ch <= 0xffff ? 1 : 2;
          } else if (ch === 92) { 
            this.containsEsc = true;
            word += this.input.slice(chunkStart, this.pos);
            var escStart = this.pos;
            if (this.input.charCodeAt(++this.pos) !== 117) 
              { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
            ++this.pos;
            var esc = this.readCodePoint();
            if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
              { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
            word += codePointToString$1(esc);
            chunkStart = this.pos;
          } else {
            break
          }
          first = false;
        }
        return word + this.input.slice(chunkStart, this.pos)
      };


      pp$9.readWord = function() {
        var word = this.readWord1();
        var type = types.name;
        if (this.keywords.test(word)) {
          type = keywords$1[word];
        }
        return this.finishToken(type, word)
      };


      var version = "7.1.0";

      Parser.acorn = {
        Parser: Parser,
        version: version,
        defaultOptions: defaultOptions,
        Position: Position,
        SourceLocation: SourceLocation,
        getLineInfo: getLineInfo,
        Node: Node,
        TokenType: TokenType,
        tokTypes: types,
        keywordTypes: keywords$1,
        TokContext: TokContext,
        tokContexts: types$1,
        isIdentifierChar: isIdentifierChar,
        isIdentifierStart: isIdentifierStart,
        Token: Token,
        isNewLine: isNewLine,
        lineBreak: lineBreak,
        lineBreakG: lineBreakG,
        nonASCIIwhitespace: nonASCIIwhitespace
      };


      function parse(input, options) {
        return Parser.parse(input, options)
      }


      function parseExpressionAt(input, pos, options) {
        return Parser.parseExpressionAt(input, pos, options)
      }


      function tokenizer(input, options) {
        return Parser.tokenizer(input, options)
      }

      exports.Node = Node;
      exports.Parser = Parser;
      exports.Position = Position;
      exports.SourceLocation = SourceLocation;
      exports.TokContext = TokContext;
      exports.Token = Token;
      exports.TokenType = TokenType;
      exports.defaultOptions = defaultOptions;
      exports.getLineInfo = getLineInfo;
      exports.isIdentifierChar = isIdentifierChar;
      exports.isIdentifierStart = isIdentifierStart;
      exports.isNewLine = isNewLine;
      exports.keywordTypes = keywords$1;
      exports.lineBreak = lineBreak;
      exports.lineBreakG = lineBreakG;
      exports.nonASCIIwhitespace = nonASCIIwhitespace;
      exports.parse = parse;
      exports.parseExpressionAt = parseExpressionAt;
      exports.tokContexts = types$1;
      exports.tokTypes = types;
      exports.tokenizer = tokenizer;
      exports.version = version;

      Object.defineProperty(exports, '__esModule', { value: true });

    }));

    },{}],2:[function(require,module,exports){

    },{}],3:[function(require,module,exports){
    function glWiretap(gl, options = {}) {
      const {
        contextName = 'gl',
        throwGetError,
        useTrackablePrimitives,
        readPixelsFile,
        recording = [],
        variables = {},
        onReadPixels,
        onUnrecognizedArgumentLookup,
      } = options;
      const proxy = new Proxy(gl, { get: listen });
      const contextVariables = [];
      const entityNames = {};
      let imageCount = 0;
      let indent = '';
      let readPixelsVariableName;
      return proxy;
      function listen(obj, property) {
        switch (property) {
          case 'addComment': return addComment;
          case 'checkThrowError': return checkThrowError;
          case 'getReadPixelsVariableName': return readPixelsVariableName;
          case 'insertVariable': return insertVariable;
          case 'reset': return reset;
          case 'setIndent': return setIndent;
          case 'toString': return toString;
          case 'getContextVariableName': return getContextVariableName;
        }
        if (typeof gl[property] === 'function') {
          return function() { 
            switch (property) {
              case 'getError':
                if (throwGetError) {
                  recording.push(`${indent}if (${contextName}.getError() !== ${contextName}.NONE) throw new Error('error');`);
                } else {
                  recording.push(`${indent}${contextName}.getError();`); 
                }
                return gl.getError();
              case 'getExtension': {
                const variableName = `${contextName}Variables${contextVariables.length}`;
                recording.push(`${indent}const ${variableName} = ${contextName}.getExtension('${arguments[0]}');`);
                const extension = gl.getExtension(arguments[0]);
                if (extension && typeof extension === 'object') {
                  const tappedExtension = glExtensionWiretap(extension, {
                    getEntity,
                    useTrackablePrimitives,
                    recording,
                    contextName: variableName,
                    contextVariables,
                    variables,
                    indent,
                    onUnrecognizedArgumentLookup,
                  });
                  contextVariables.push(tappedExtension);
                  return tappedExtension;
                } else {
                  contextVariables.push(null);
                }
                return extension;
              }
              case 'readPixels':
                const i = contextVariables.indexOf(arguments[6]);
                let targetVariableName;
                if (i === -1) {
                  const variableName = getVariableName(arguments[6]);
                  if (variableName) {
                    targetVariableName = variableName;
                    recording.push(`${indent}${variableName}`);
                  } else {
                    targetVariableName = `${contextName}Variable${contextVariables.length}`;
                    contextVariables.push(arguments[6]);
                    recording.push(`${indent}const ${targetVariableName} = new ${arguments[6].constructor.name}(${arguments[6].length});`);
                  }
                } else {
                  targetVariableName = `${contextName}Variable${i}`;
                }
                readPixelsVariableName = targetVariableName;
                const argumentAsStrings = [
                  arguments[0],
                  arguments[1],
                  arguments[2],
                  arguments[3],
                  getEntity(arguments[4]),
                  getEntity(arguments[5]),
                  targetVariableName
                ];
                recording.push(`${indent}${contextName}.readPixels(${argumentAsStrings.join(', ')});`);
                if (readPixelsFile) {
                  writePPM(arguments[2], arguments[3]);
                }
                if (onReadPixels) {
                  onReadPixels(targetVariableName, argumentAsStrings);
                }
                return gl.readPixels.apply(gl, arguments);
              case 'drawBuffers':
                recording.push(`${indent}${contextName}.drawBuffers([${argumentsToString(arguments[0], { contextName, contextVariables, getEntity, addVariable, variables, onUnrecognizedArgumentLookup } )}]);`);
                return gl.drawBuffers(arguments[0]);
            }
            let result = gl[property].apply(gl, arguments);
            switch (typeof result) {
              case 'undefined':
                recording.push(`${indent}${methodCallToString(property, arguments)};`);
                return;
              case 'number':
              case 'boolean':
                if (useTrackablePrimitives && contextVariables.indexOf(trackablePrimitive(result)) === -1) {
                  recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
                  contextVariables.push(result = trackablePrimitive(result));
                  break;
                }
              default:
                if (result === null) {
                  recording.push(`${methodCallToString(property, arguments)};`);
                } else {
                  recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
                }

                contextVariables.push(result);
            }
            return result;
          }
        }
        entityNames[gl[property]] = property;
        return gl[property];
      }
      function toString() {
        return recording.join('\n');
      }
      function reset() {
        while (recording.length > 0) {
          recording.pop();
        }
      }
      function insertVariable(name, value) {
        variables[name] = value;
      }
      function getEntity(value) {
        const name = entityNames[value];
        if (name) {
          return contextName + '.' + name;
        }
        return value;
      }
      function setIndent(spaces) {
        indent = ' '.repeat(spaces);
      }
      function addVariable(value, source) {
        const variableName = `${contextName}Variable${contextVariables.length}`;
        recording.push(`${indent}const ${variableName} = ${source};`);
        contextVariables.push(value);
        return variableName;
      }
      function writePPM(width, height) {
        const sourceVariable = `${contextName}Variable${contextVariables.length}`;
        const imageVariable = `imageDatum${imageCount}`;
        recording.push(`${indent}let ${imageVariable} = ["P3\\n# ${readPixelsFile}.ppm\\n", ${width}, ' ', ${height}, "\\n255\\n"].join("");`);
        recording.push(`${indent}for (let i = 0; i < ${imageVariable}.length; i += 4) {`);
        recording.push(`${indent}  ${imageVariable} += ${sourceVariable}[i] + ' ' + ${sourceVariable}[i + 1] + ' ' + ${sourceVariable}[i + 2] + ' ';`);
        recording.push(`${indent}}`);
        recording.push(`${indent}if (typeof require !== "undefined") {`);
        recording.push(`${indent}  require('fs').writeFileSync('./${readPixelsFile}.ppm', ${imageVariable});`);
        recording.push(`${indent}}`);
        imageCount++;
      }
      function addComment(value) {
        recording.push(`${indent}// ${value}`);
      }
      function checkThrowError() {
        recording.push(`${indent}(() => {
${indent}const error = ${contextName}.getError();
${indent}if (error !== ${contextName}.NONE) {
${indent}  const names = Object.getOwnPropertyNames(gl);
${indent}  for (let i = 0; i < names.length; i++) {
${indent}    const name = names[i];
${indent}    if (${contextName}[name] === error) {
${indent}      throw new Error('${contextName} threw ' + name);
${indent}    }
${indent}  }
${indent}}
${indent}})();`);
      }
      function methodCallToString(method, args) {
        return `${contextName}.${method}(${argumentsToString(args, { contextName, contextVariables, getEntity, addVariable, variables, onUnrecognizedArgumentLookup })})`;
      }

      function getVariableName(value) {
        if (variables) {
          for (const name in variables) {
            if (variables[name] === value) {
              return name;
            }
          }
        }
        return null;
      }

      function getContextVariableName(value) {
        const i = contextVariables.indexOf(value);
        if (i !== -1) {
          return `${contextName}Variable${i}`;
        }
        return null;
      }
    }

    function glExtensionWiretap(extension, options) {
      const proxy = new Proxy(extension, { get: listen });
      const extensionEntityNames = {};
      const {
        contextName,
        contextVariables,
        getEntity,
        useTrackablePrimitives,
        recording,
        variables,
        indent,
        onUnrecognizedArgumentLookup,
      } = options;
      return proxy;
      function listen(obj, property) {
        if (typeof obj[property] === 'function') {
          return function() {
            switch (property) {
              case 'drawBuffersWEBGL':
                recording.push(`${indent}${contextName}.drawBuffersWEBGL([${argumentsToString(arguments[0], { contextName, contextVariables, getEntity: getExtensionEntity, addVariable, variables, onUnrecognizedArgumentLookup })}]);`);
                return extension.drawBuffersWEBGL(arguments[0]);
            }
            let result = extension[property].apply(extension, arguments);
            switch (typeof result) {
              case 'undefined':
                recording.push(`${indent}${methodCallToString(property, arguments)};`);
                return;
              case 'number':
              case 'boolean':
                if (useTrackablePrimitives && contextVariables.indexOf(trackablePrimitive(result)) === -1) {
                  recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
                  contextVariables.push(result = trackablePrimitive(result));
                } else {
                  recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
                  contextVariables.push(result);
                }
                break;
              default:
                if (result === null) {
                  recording.push(`${methodCallToString(property, arguments)};`);
                } else {
                  recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
                }
                contextVariables.push(result);
            }
            return result;
          };
        }
        extensionEntityNames[extension[property]] = property;
        return extension[property];
      }

      function getExtensionEntity(value) {
        if (extensionEntityNames.hasOwnProperty(value)) {
          return `${contextName}.${extensionEntityNames[value]}`;
        }
        return getEntity(value);
      }

      function methodCallToString(method, args) {
        return `${contextName}.${method}(${argumentsToString(args, { contextName, contextVariables, getEntity: getExtensionEntity, addVariable, variables, onUnrecognizedArgumentLookup })})`;
      }

      function addVariable(value, source) {
        const variableName = `${contextName}Variable${contextVariables.length}`;
        contextVariables.push(value);
        recording.push(`${indent}const ${variableName} = ${source};`);
        return variableName;
      }
    }

    function argumentsToString(args, options) {
      const { variables, onUnrecognizedArgumentLookup } = options;
      return (Array.from(args).map((arg) => {
        const variableName = getVariableName(arg);
        if (variableName) {
          return variableName;
        }
        return argumentToString(arg, options);
      }).join(', '));

      function getVariableName(value) {
        if (variables) {
          for (const name in variables) {
            if (!variables.hasOwnProperty(name)) continue;
            if (variables[name] === value) {
              return name;
            }
          }
        }
        if (onUnrecognizedArgumentLookup) {
          return onUnrecognizedArgumentLookup(value);
        }
        return null;
      }
    }

    function argumentToString(arg, options) {
      const { contextName, contextVariables, getEntity, addVariable, onUnrecognizedArgumentLookup } = options;
      if (typeof arg === 'undefined') {
        return 'undefined';
      }
      if (arg === null) {
        return 'null';
      }
      const i = contextVariables.indexOf(arg);
      if (i > -1) {
        return `${contextName}Variable${i}`;
      }
      switch (arg.constructor.name) {
        case 'String':
          const hasLines = /\n/.test(arg);
          const hasSingleQuotes = /'/.test(arg);
          const hasDoubleQuotes = /"/.test(arg);
          if (hasLines) {
            return '`' + arg + '`';
          } else if (hasSingleQuotes && !hasDoubleQuotes) {
            return '"' + arg + '"';
          } else if (!hasSingleQuotes && hasDoubleQuotes) {
            return "'" + arg + "'";
          } else {
            return '\'' + arg + '\'';
          }
        case 'Number': return getEntity(arg);
        case 'Boolean': return getEntity(arg);
        case 'Array':
          return addVariable(arg, `new ${arg.constructor.name}([${Array.from(arg).join(',')}])`);
        case 'Float32Array':
        case 'Uint8Array':
        case 'Uint16Array':
        case 'Int32Array':
          return addVariable(arg, `new ${arg.constructor.name}(${JSON.stringify(Array.from(arg))})`);
        default:
          if (onUnrecognizedArgumentLookup) {
            const instantiationString = onUnrecognizedArgumentLookup(arg);
            if (instantiationString) {
              return instantiationString;
            }
          }
          throw new Error(`unrecognized argument type ${arg.constructor.name}`);
      }
    }

    function trackablePrimitive(value) {
      return new value.constructor(value);
    }

    if (typeof module !== 'undefined') {
      module.exports = { glWiretap, glExtensionWiretap };
    }

    if (typeof window !== 'undefined') {
      glWiretap.glExtensionWiretap = glExtensionWiretap;
      window.glWiretap = glWiretap;
    }

    },{}],4:[function(require,module,exports){
    function setupArguments(args) {
      const newArguments = new Array(args.length);
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.toArray) {
          newArguments[i] = arg.toArray();
        } else {
          newArguments[i] = arg;
        }
      }
      return newArguments;
    }

    function mock1D() {
      const args = setupArguments(arguments);
      const row = new Float32Array(this.output.x);
      for (let x = 0; x < this.output.x; x++) {
        this.thread.x = x;
        this.thread.y = 0;
        this.thread.z = 0;
        row[x] = this._fn.apply(this, args);
      }
      return row;
    }

    function mock2D() {
      const args = setupArguments(arguments);
      const matrix = new Array(this.output.y);
      for (let y = 0; y < this.output.y; y++) {
        const row = new Float32Array(this.output.x);
        for (let x = 0; x < this.output.x; x++) {
          this.thread.x = x;
          this.thread.y = y;
          this.thread.z = 0;
          row[x] = this._fn.apply(this, args);
        }
        matrix[y] = row;
      }
      return matrix;
    }

    function mock2DGraphical() {
      const args = setupArguments(arguments);
      for (let y = 0; y < this.output.y; y++) {
        for (let x = 0; x < this.output.x; x++) {
          this.thread.x = x;
          this.thread.y = y;
          this.thread.z = 0;
          this._fn.apply(this, args);
        }
      }
    }

    function mock3D() {
      const args = setupArguments(arguments);
      const cube = new Array(this.output.z);
      for (let z = 0; z < this.output.z; z++) {
        const matrix = new Array(this.output.y);
        for (let y = 0; y < this.output.y; y++) {
          const row = new Float32Array(this.output.x);
          for (let x = 0; x < this.output.x; x++) {
            this.thread.x = x;
            this.thread.y = y;
            this.thread.z = z;
            row[x] = this._fn.apply(this, args);
          }
          matrix[y] = row;
        }
        cube[z] = matrix;
      }
      return cube;
    }

    function apiDecorate(kernel) {
      kernel.setOutput = (output) => {
        kernel.output = setupOutput(output);
        if (kernel.graphical) {
          setupGraphical(kernel);
        }
      };
      kernel.toJSON = () => {
        throw new Error('Not usable with gpuMock');
      };
      kernel.setConstants = (flag) => {
        kernel.constants = flag;
        return kernel;
      };
      kernel.setGraphical = (flag) => {
        kernel.graphical = flag;
        return kernel;
      };
      kernel.setCanvas = (flag) => {
        kernel.canvas = flag;
        return kernel;
      };
      kernel.setContext = (flag) => {
        kernel.context = flag;
        return kernel;
      };
      kernel.destroy = () => {};
      kernel.validateSettings = () => {};
      if (kernel.graphical && kernel.output) {
        setupGraphical(kernel);
      }
      kernel.exec = function() {
        return new Promise((resolve, reject) => {
          try {
            resolve(kernel.apply(kernel, arguments));
          } catch(e) {
            reject(e);
          }
        });
      };
      kernel.getPixels = (flip) => {
        const {x, y} = kernel.output;
        return flip ? flipPixels(kernel._imageData.data, x, y) : kernel._imageData.data.slice(0);
      };
      kernel.color = function(r, g, b, a) {
        if (typeof a === 'undefined') {
          a = 1;
        }

        r = Math.floor(r * 255);
        g = Math.floor(g * 255);
        b = Math.floor(b * 255);
        a = Math.floor(a * 255);

        const width = kernel.output.x;
        const height = kernel.output.y;

        const x = kernel.thread.x;
        const y = height - kernel.thread.y - 1;

        const index = x + y * width;

        kernel._colorData[index * 4 + 0] = r;
        kernel._colorData[index * 4 + 1] = g;
        kernel._colorData[index * 4 + 2] = b;
        kernel._colorData[index * 4 + 3] = a;
      };

      const mockMethod = () => kernel;
      const methods = [
        'setWarnVarUsage',
        'setArgumentTypes',
        'setTactic',
        'setOptimizeFloatMemory',
        'setDebug',
        'setLoopMaxIterations',
        'setConstantTypes',
        'setFunctions',
        'setNativeFunctions',
        'setInjectedNative',
        'setPipeline',
        'setPrecision',
        'setOutputToTexture',
        'setImmutable',
        'setStrictIntegers',
        'setDynamicOutput',
        'setHardcodeConstants',
        'setDynamicArguments',
        'setUseLegacyEncoder',
        'setWarnVarUsage',
        'addSubKernel',
      ];
      for (let i = 0; i < methods.length; i++) {
        kernel[methods[i]] = mockMethod;
      }
      return kernel;
    }

    function setupGraphical(kernel) {
      const {x, y} = kernel.output;
      if (kernel.context && kernel.context.createImageData) {
        const data = new Uint8ClampedArray(x * y * 4);
        kernel._imageData = kernel.context.createImageData(x, y);
        kernel._colorData = data;
      } else {
        const data = new Uint8ClampedArray(x * y * 4);
        kernel._imageData = { data };
        kernel._colorData = data;
      }
    }

    function setupOutput(output) {
      let result = null;
      if (output.length) {
        if (output.length === 3) {
          const [x,y,z] = output;
          result = { x, y, z };
        } else if (output.length === 2) {
          const [x,y] = output;
          result = { x, y };
        } else {
          const [x] = output;
          result = { x };
        }
      } else {
        result = output;
      }
      return result;
    }

    function gpuMock(fn, settings = {}) {
      const output = settings.output ? setupOutput(settings.output) : null;
      function kernel() {
        if (kernel.output.z) {
          return mock3D.apply(kernel, arguments);
        } else if (kernel.output.y) {
          if (kernel.graphical) {
            return mock2DGraphical.apply(kernel, arguments);
          }
          return mock2D.apply(kernel, arguments);
        } else {
          return mock1D.apply(kernel, arguments);
        }
      }
      kernel._fn = fn;
      kernel.constants = settings.constants || null;
      kernel.context = settings.context || null;
      kernel.canvas = settings.canvas || null;
      kernel.graphical = settings.graphical || false;
      kernel._imageData = null;
      kernel._colorData = null;
      kernel.output = output;
      kernel.thread = {
        x: 0,
        y: 0,
        z: 0
      };
      return apiDecorate(kernel);
    }

    function flipPixels(pixels, width, height) {
      const halfHeight = height / 2 | 0; 
      const bytesPerRow = width * 4;
      const temp = new Uint8ClampedArray(width * 4);
      const result = pixels.slice(0);
      for (let y = 0; y < halfHeight; ++y) {
        const topOffset = y * bytesPerRow;
        const bottomOffset = (height - y - 1) * bytesPerRow;

        temp.set(result.subarray(topOffset, topOffset + bytesPerRow));

        result.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

        result.set(temp, bottomOffset);
      }
      return result;
    }

    module.exports = {
      gpuMock
    };

    },{}],5:[function(require,module,exports){
    const { utils } = require('./utils');

    function alias(name, source) {
      const fnString = source.toString();
      return new Function(`return function ${ name } (${ utils.getArgumentNamesFromString(fnString).join(', ') }) {
  ${ utils.getFunctionBodyFromString(fnString) }
}`)();
    }

    module.exports = {
      alias
    };
    },{"./utils":114}],6:[function(require,module,exports){
    const { FunctionNode } = require('../function-node');

    class CPUFunctionNode extends FunctionNode {
      astFunction(ast, retArr) {

        if (!this.isRootKernel) {
          retArr.push('function');
          retArr.push(' ');
          retArr.push(this.name);
          retArr.push('(');

          for (let i = 0; i < this.argumentNames.length; ++i) {
            const argumentName = this.argumentNames[i];

            if (i > 0) {
              retArr.push(', ');
            }
            retArr.push('user_');
            retArr.push(argumentName);
          }

          retArr.push(') {\n');
        }

        for (let i = 0; i < ast.body.body.length; ++i) {
          this.astGeneric(ast.body.body[i], retArr);
          retArr.push('\n');
        }

        if (!this.isRootKernel) {
          retArr.push('}\n');
        }
        return retArr;
      }

      astReturnStatement(ast, retArr) {
        const type = this.returnType || this.getType(ast.argument);

        if (!this.returnType) {
          this.returnType = type;
        }

        if (this.isRootKernel) {
          retArr.push(this.leadingReturnStatement);
          this.astGeneric(ast.argument, retArr);
          retArr.push(';\n');
          retArr.push(this.followingReturnStatement);
          retArr.push('continue;\n');
        } else if (this.isSubKernel) {
          retArr.push(`subKernelResult_${ this.name } = `);
          this.astGeneric(ast.argument, retArr);
          retArr.push(';');
          retArr.push(`return subKernelResult_${ this.name };`);
        } else {
          retArr.push('return ');
          this.astGeneric(ast.argument, retArr);
          retArr.push(';');
        }
        return retArr;
      }

      astLiteral(ast, retArr) {

        if (isNaN(ast.value)) {
          throw this.astErrorOutput(
            'Non-numeric literal not supported : ' + ast.value,
            ast
          );
        }

        retArr.push(ast.value);

        return retArr;
      }

      astBinaryExpression(ast, retArr) {
        retArr.push('(');
        this.astGeneric(ast.left, retArr);
        retArr.push(ast.operator);
        this.astGeneric(ast.right, retArr);
        retArr.push(')');
        return retArr;
      }

      astIdentifierExpression(idtNode, retArr) {
        if (idtNode.type !== 'Identifier') {
          throw this.astErrorOutput(
            'IdentifierExpression - not an Identifier',
            idtNode
          );
        }

        switch (idtNode.name) {
          case 'Infinity':
            retArr.push('Infinity');
            break;
          default:
            if (this.constants && this.constants.hasOwnProperty(idtNode.name)) {
              retArr.push('constants_' + idtNode.name);
            } else {
              retArr.push('user_' + idtNode.name);
            }
        }

        return retArr;
      }

      astForStatement(forNode, retArr) {
        if (forNode.type !== 'ForStatement') {
          throw this.astErrorOutput('Invalid for statement', forNode);
        }

        const initArr = [];
        const testArr = [];
        const updateArr = [];
        const bodyArr = [];
        let isSafe = null;

        if (forNode.init) {
          this.pushState('in-for-loop-init');
          this.astGeneric(forNode.init, initArr);
          for (let i = 0; i < initArr.length; i++) {
            if (initArr[i].includes && initArr[i].includes(',')) {
              isSafe = false;
            }
          }
          this.popState('in-for-loop-init');
        } else {
          isSafe = false;
        }

        if (forNode.test) {
          this.astGeneric(forNode.test, testArr);
        } else {
          isSafe = false;
        }

        if (forNode.update) {
          this.astGeneric(forNode.update, updateArr);
        } else {
          isSafe = false;
        }

        if (forNode.body) {
          this.pushState('loop-body');
          this.astGeneric(forNode.body, bodyArr);
          this.popState('loop-body');
        }

        if (isSafe === null) {
          isSafe = this.isSafe(forNode.init) && this.isSafe(forNode.test);
        }

        if (isSafe) {
          retArr.push(`for (${initArr.join('')};${testArr.join('')};${updateArr.join('')}){\n`);
          retArr.push(bodyArr.join(''));
          retArr.push('}\n');
        } else {
          const iVariableName = this.getInternalVariableName('safeI');
          if (initArr.length > 0) {
            retArr.push(initArr.join(''), ';\n');
          }
          retArr.push(`for (let ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
          if (testArr.length > 0) {
            retArr.push(`if (!${testArr.join('')}) break;\n`);
          }
          retArr.push(bodyArr.join(''));
          retArr.push(`\n${updateArr.join('')};`);
          retArr.push('}\n');
        }
        return retArr;
      }

      astWhileStatement(whileNode, retArr) {
        if (whileNode.type !== 'WhileStatement') {
          throw this.astErrorOutput(
            'Invalid while statement',
            whileNode
          );
        }

        retArr.push('for (let i = 0; i < LOOP_MAX; i++) {');
        retArr.push('if (');
        this.astGeneric(whileNode.test, retArr);
        retArr.push(') {\n');
        this.astGeneric(whileNode.body, retArr);
        retArr.push('} else {\n');
        retArr.push('break;\n');
        retArr.push('}\n');
        retArr.push('}\n');

        return retArr;
      }

      astDoWhileStatement(doWhileNode, retArr) {
        if (doWhileNode.type !== 'DoWhileStatement') {
          throw this.astErrorOutput(
            'Invalid while statement',
            doWhileNode
          );
        }

        retArr.push('for (let i = 0; i < LOOP_MAX; i++) {');
        this.astGeneric(doWhileNode.body, retArr);
        retArr.push('if (!');
        this.astGeneric(doWhileNode.test, retArr);
        retArr.push(') {\n');
        retArr.push('break;\n');
        retArr.push('}\n');
        retArr.push('}\n');

        return retArr;

      }

      astAssignmentExpression(assNode, retArr) {
        const declaration = this.getDeclaration(assNode.left);
        if (declaration && !declaration.assignable) {
          throw this.astErrorOutput(`Variable ${assNode.left.name} is not assignable here`, assNode);
        }
        this.astGeneric(assNode.left, retArr);
        retArr.push(assNode.operator);
        this.astGeneric(assNode.right, retArr);
        return retArr;
      }

      astBlockStatement(bNode, retArr) {
        if (this.isState('loop-body')) {
          this.pushState('block-body'); 
          for (let i = 0; i < bNode.body.length; i++) {
            this.astGeneric(bNode.body[i], retArr);
          }
          this.popState('block-body');
        } else {
          retArr.push('{\n');
          for (let i = 0; i < bNode.body.length; i++) {
            this.astGeneric(bNode.body[i], retArr);
          }
          retArr.push('}\n');
        }
        return retArr;
      }

      astVariableDeclaration(varDecNode, retArr) {
        retArr.push(`${varDecNode.kind} `);
        const { declarations } = varDecNode;
        for (let i = 0; i < declarations.length; i++) {
          if (i > 0) {
            retArr.push(',');
          }
          const declaration = declarations[i];
          const info = this.getDeclaration(declaration.id);
          if (!info.valueType) {
            info.valueType = this.getType(declaration.init);
          }
          this.astGeneric(declaration, retArr);
        }
        if (!this.isState('in-for-loop-init')) {
          retArr.push(';');
        }
        return retArr;
      }

      astIfStatement(ifNode, retArr) {
        retArr.push('if (');
        this.astGeneric(ifNode.test, retArr);
        retArr.push(')');
        if (ifNode.consequent.type === 'BlockStatement') {
          this.astGeneric(ifNode.consequent, retArr);
        } else {
          retArr.push(' {\n');
          this.astGeneric(ifNode.consequent, retArr);
          retArr.push('\n}\n');
        }

        if (ifNode.alternate) {
          retArr.push('else ');
          if (ifNode.alternate.type === 'BlockStatement' || ifNode.alternate.type === 'IfStatement') {
            this.astGeneric(ifNode.alternate, retArr);
          } else {
            retArr.push(' {\n');
            this.astGeneric(ifNode.alternate, retArr);
            retArr.push('\n}\n');
          }
        }
        return retArr;

      }

      astSwitchStatement(ast, retArr) {
        const { discriminant, cases } = ast;
        retArr.push('switch (');
        this.astGeneric(discriminant, retArr);
        retArr.push(') {\n');
        for (let i = 0; i < cases.length; i++) {
          if (cases[i].test === null) {
            retArr.push('default:\n');
            this.astGeneric(cases[i].consequent, retArr);
            if (cases[i].consequent && cases[i].consequent.length > 0) {
              retArr.push('break;\n');
            }
            continue;
          }
          retArr.push('case ');
          this.astGeneric(cases[i].test, retArr);
          retArr.push(':\n');
          if (cases[i].consequent && cases[i].consequent.length > 0) {
            this.astGeneric(cases[i].consequent, retArr);
            retArr.push('break;\n');
          }
        }
        retArr.push('\n}');
      }

      astThisExpression(tNode, retArr) {
        retArr.push('_this');
        return retArr;
      }

      astMemberExpression(mNode, retArr) {
        const {
          signature,
          type,
          property,
          xProperty,
          yProperty,
          zProperty,
          name,
          origin
        } = this.getMemberExpressionDetails(mNode);
        switch (signature) {
          case 'this.thread.value':
            retArr.push(`_this.thread.${ name }`);
            return retArr;
          case 'this.output.value':
            switch (name) {
              case 'x':
                retArr.push('outputX');
                break;
              case 'y':
                retArr.push('outputY');
                break;
              case 'z':
                retArr.push('outputZ');
                break;
              default:
                throw this.astErrorOutput('Unexpected expression', mNode);
            }
            return retArr;
          case 'value':
            throw this.astErrorOutput('Unexpected expression', mNode);
          case 'value[]':
          case 'value[][]':
          case 'value[][][]':
          case 'value.value':
            if (origin === 'Math') {
              retArr.push(Math[name]);
              return retArr;
            }
            switch (property) {
              case 'r':
                retArr.push(`user_${ name }[0]`);
                return retArr;
              case 'g':
                retArr.push(`user_${ name }[1]`);
                return retArr;
              case 'b':
                retArr.push(`user_${ name }[2]`);
                return retArr;
              case 'a':
                retArr.push(`user_${ name }[3]`);
                return retArr;
            }
            break;
          case 'value.value[]': 
            if (this.removeIstanbulCoverage) {
              return retArr;
            }
            retArr.push(`${mNode.object.object.name}.${mNode.object.property.name}[${mNode.property.value}]`);
            return retArr;
          case 'value.value[][]': 
            if (this.removeIstanbulCoverage) {
              return retArr;
            }
            retArr.push(`${mNode.object.object.object.name}.${mNode.object.object.property.name}[${mNode.object.property.value}][${mNode.property.value}]`);
            return retArr;
          case 'this.constants.value':
          case 'this.constants.value[]':
          case 'this.constants.value[][]':
          case 'this.constants.value[][][]':
            break;
          case 'fn()[]':
            this.astGeneric(mNode.object, retArr);
            retArr.push('[');
            this.astGeneric(mNode.property, retArr);
            retArr.push(']');
            return retArr;
          default:
            throw this.astErrorOutput('Unexpected expression', mNode);
        }

        if (!mNode.computed) {
          switch (type) {
            case 'Number':
            case 'Integer':
            case 'Float':
            case 'Boolean':
              retArr.push(`${origin}_${name}`);
              return retArr;
          }
        }

        const markupName = `${origin}_${name}`;

        switch (type) {
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
          case 'HTMLImageArray':
          case 'ArrayTexture(1)':
          case 'ArrayTexture(2)':
          case 'ArrayTexture(3)':
          case 'ArrayTexture(4)':
          case 'HTMLImage':
          default:
            let size;
            let isInput;
            if (origin === 'constants') {
              const constant = this.constants[name];
              isInput = this.constantTypes[name] === 'Input';
              size = isInput ? constant.size : null;
            } else {
              isInput = this.isInput(name);
              size = isInput ? this.argumentSizes[this.argumentNames.indexOf(name)] : null;
            }
            retArr.push(`${ markupName }`);
            if (zProperty && yProperty) {
              if (isInput) {
                retArr.push('[(');
                this.astGeneric(zProperty, retArr);
                retArr.push(`*${ this.dynamicArguments ? '(outputY * outputX)' : size[1] * size[0] })+(`);
                this.astGeneric(yProperty, retArr);
                retArr.push(`*${ this.dynamicArguments ? 'outputX' : size[0] })+`);
                this.astGeneric(xProperty, retArr);
                retArr.push(']');
              } else {
                retArr.push('[');
                this.astGeneric(zProperty, retArr);
                retArr.push(']');
                retArr.push('[');
                this.astGeneric(yProperty, retArr);
                retArr.push(']');
                retArr.push('[');
                this.astGeneric(xProperty, retArr);
                retArr.push(']');
              }
            } else if (yProperty) {
              if (isInput) {
                retArr.push('[(');
                this.astGeneric(yProperty, retArr);
                retArr.push(`*${ this.dynamicArguments ? 'outputX' : size[0] })+`);
                this.astGeneric(xProperty, retArr);
                retArr.push(']');
              } else {
                retArr.push('[');
                this.astGeneric(yProperty, retArr);
                retArr.push(']');
                retArr.push('[');
                this.astGeneric(xProperty, retArr);
                retArr.push(']');
              }
            } else if (typeof xProperty !== 'undefined') {
              retArr.push('[');
              this.astGeneric(xProperty, retArr);
              retArr.push(']');
            }
        }
        return retArr;
      }

      astCallExpression(ast, retArr) {
        if (ast.type !== 'CallExpression') {
          throw this.astErrorOutput('Unknown CallExpression', ast);
        }
        let functionName = this.astMemberExpressionUnroll(ast.callee);

        if (this.calledFunctions.indexOf(functionName) < 0) {
          this.calledFunctions.push(functionName);
        }

        const isMathFunction = this.isAstMathFunction(ast);

        if (this.onFunctionCall) {
          this.onFunctionCall(this.name, functionName, ast.arguments);
        }

        retArr.push(functionName);

        retArr.push('(');
        const targetTypes = this.lookupFunctionArgumentTypes(functionName) || [];
        for (let i = 0; i < ast.arguments.length; ++i) {
          const argument = ast.arguments[i];

          let argumentType = this.getType(argument);
          if (!targetTypes[i]) {
            this.triggerImplyArgumentType(functionName, i, argumentType, this);
          }

          if (i > 0) {
            retArr.push(', ');
          }
          this.astGeneric(argument, retArr);
        }
        retArr.push(')');

        return retArr;
      }

      astArrayExpression(arrNode, retArr) {
        const arrLen = arrNode.elements.length;

        retArr.push('new Float32Array([');
        for (let i = 0; i < arrLen; ++i) {
          if (i > 0) {
            retArr.push(', ');
          }
          const subNode = arrNode.elements[i];
          this.astGeneric(subNode, retArr);
        }
        retArr.push('])');

        return retArr;
      }

      astDebuggerStatement(arrNode, retArr) {
        retArr.push('debugger;');
        return retArr;
      }
    }

    module.exports = {
      CPUFunctionNode
    };
    },{"../function-node":10}],7:[function(require,module,exports){
    const { utils } = require('../../utils');

    function constantsToString(constants, types) {
      const results = [];
      for (const name in types) {
        if (!types.hasOwnProperty(name)) continue;
        const type = types[name];
        const constant = constants[name];
        switch (type) {
          case 'Number':
          case 'Integer':
          case 'Float':
          case 'Boolean':
            results.push(`${name}:${constant}`);
            break;
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
            results.push(`${name}:new ${constant.constructor.name}(${JSON.stringify(Array.from(constant))})`);
            break;
        }
      }
      return `{ ${ results.join() } }`;
    }

    function cpuKernelString(cpuKernel, name) {
      const header = [];
      const thisProperties = [];
      const beforeReturn = [];

      const useFunctionKeyword = !/^function/.test(cpuKernel.color.toString());

      header.push(
        '  const { context, canvas, constants: incomingConstants } = settings;',
        `  const output = new Int32Array(${JSON.stringify(Array.from(cpuKernel.output))});`,
        `  const _constantTypes = ${JSON.stringify(cpuKernel.constantTypes)};`,
        `  const _constants = ${constantsToString(cpuKernel.constants, cpuKernel.constantTypes)};`,
      );

      thisProperties.push(
        '    constants: _constants,',
        '    context,',
        '    output,',
        '    thread: {x: 0, y: 0, z: 0},',
      );

      if (cpuKernel.graphical) {
        header.push(`  const _imageData = context.createImageData(${cpuKernel.output[0]}, ${cpuKernel.output[1]});`);
        header.push(`  const _colorData = new Uint8ClampedArray(${cpuKernel.output[0]} * ${cpuKernel.output[1]} * 4);`);

        const colorFn = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel.color.toString(), {
          thisLookup: (propertyName) => {
            switch (propertyName) {
              case '_colorData':
                return '_colorData';
              case '_imageData':
                return '_imageData';
              case 'output':
                return 'output';
              case 'thread':
                return 'this.thread';
            }
            return JSON.stringify(cpuKernel[propertyName]);
          },
          findDependency: (object, name) => {
            return null;
          }
        });

        const getPixelsFn = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel.getPixels.toString(), {
          thisLookup: (propertyName) => {
            switch (propertyName) {
              case '_colorData':
                return '_colorData';
              case '_imageData':
                return '_imageData';
              case 'output':
                return 'output';
              case 'thread':
                return 'this.thread';
            }
            return JSON.stringify(cpuKernel[propertyName]);
          },
          findDependency: () => {
            return null;
          }
        });

        thisProperties.push(
          '    _imageData,',
          '    _colorData,',
          `    color: ${colorFn},`,
        );

        beforeReturn.push(
          `  kernel.getPixels = ${getPixelsFn};`
        );
      }

      const constantTypes = [];
      const constantKeys = Object.keys(cpuKernel.constantTypes);
      for (let i = 0; i < constantKeys.length; i++) {
        constantTypes.push(cpuKernel.constantTypes[constantKeys]);
      }
      if (cpuKernel.argumentTypes.indexOf('HTMLImageArray') !== -1 || constantTypes.indexOf('HTMLImageArray') !== -1) {
        const flattenedImageTo3DArray = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel._imageTo3DArray.toString(), {
          doNotDefine: ['canvas'],
          findDependency: (object, name) => {
            if (object === 'this') {
              return (useFunctionKeyword ? 'function ' : '') + cpuKernel[name].toString();
            }
            return null;
          },
          thisLookup: (propertyName) => {
            switch (propertyName) {
              case 'canvas':
                return;
              case 'context':
                return 'context';
            }
          }
        });
        beforeReturn.push(flattenedImageTo3DArray);
        thisProperties.push(`    _mediaTo2DArray,`);
        thisProperties.push(`    _imageTo3DArray,`);
      } else if (cpuKernel.argumentTypes.indexOf('HTMLImage') !== -1 || constantTypes.indexOf('HTMLImage') !== -1) {
        const flattenedImageTo2DArray = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel._mediaTo2DArray.toString(), {
          findDependency: (object, name) => {
            return null;
          },
          thisLookup: (propertyName) => {
            switch (propertyName) {
              case 'canvas':
                return 'settings.canvas';
              case 'context':
                return 'settings.context';
            }
            throw new Error('unhandled thisLookup');
          }
        });
        beforeReturn.push(flattenedImageTo2DArray);
        thisProperties.push(`    _mediaTo2DArray,`);
      }

      return `function(settings) {
${ header.join('\n') }
  for (const p in _constantTypes) {
    if (!_constantTypes.hasOwnProperty(p)) continue;
    const type = _constantTypes[p];
    switch (type) {
      case 'Number':
      case 'Integer':
      case 'Float':
      case 'Boolean':
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
        if (incomingConstants.hasOwnProperty(p)) {
          console.warn('constant ' + p + ' of type ' + type + ' cannot be resigned');
        }
        continue;
    }
    if (!incomingConstants.hasOwnProperty(p)) {
      throw new Error('constant ' + p + ' not found');
    }
    _constants[p] = incomingConstants[p];
  }
  const kernel = (function() {
${cpuKernel._kernelString}
  })
    .apply({ ${thisProperties.join('\n')} });
  ${ beforeReturn.join('\n') }
  return kernel;
}`;
    }

    module.exports = {
      cpuKernelString
    };
    },{"../../utils":114}],8:[function(require,module,exports){
    const { Kernel } = require('../kernel');
    const { FunctionBuilder } = require('../function-builder');
    const { CPUFunctionNode } = require('./function-node');
    const { utils } = require('../../utils');
    const { cpuKernelString } = require('./kernel-string');

    class CPUKernel extends Kernel {
      static getFeatures() {
        return this.features;
      }
      static get features() {
        return Object.freeze({
          kernelMap: true,
          isIntegerDivisionAccurate: true
        });
      }
      static get isSupported() {
        return true;
      }
      static isContextMatch(context) {
        return false;
      }
      static get mode() {
        return 'cpu';
      }

      static nativeFunctionArguments() {
        return null;
      }

      static nativeFunctionReturnType() {
        throw new Error(`Looking up native function return type not supported on ${this.name}`);
      }

      static combineKernels(combinedKernel) {
        return combinedKernel;
      }

      static getSignature(kernel, argumentTypes) {
        return 'cpu' + (argumentTypes.length > 0 ? ':' + argumentTypes.join(',') : '');
      }

      constructor(source, settings) {
        super(source, settings);
        this.mergeSettings(source.settings || settings);

        this._imageData = null;
        this._colorData = null;
        this._kernelString = null;
        this._prependedString = [];
        this.thread = {
          x: 0,
          y: 0,
          z: 0
        };
        this.translatedSources = null;
      }

      initCanvas() {
        if (typeof document !== 'undefined') {
          return document.createElement('canvas');
        } else if (typeof OffscreenCanvas !== 'undefined') {
          return new OffscreenCanvas(0, 0);
        }
      }

      initContext() {
        if (!this.canvas) return null;
        return this.canvas.getContext('2d');
      }

      initPlugins(settings) {
        return [];
      }

      validateSettings(args) {
        if (!this.output || this.output.length === 0) {
          if (args.length !== 1) {
            throw new Error('Auto output only supported for kernels with only one input');
          }

          const argType = utils.getVariableType(args[0], this.strictIntegers);
          if (argType === 'Array') {
            this.output = utils.getDimensions(argType);
          } else if (argType === 'NumberTexture' || argType === 'ArrayTexture(4)') {
            this.output = args[0].output;
          } else {
            throw new Error('Auto output not supported for input type: ' + argType);
          }
        }

        if (this.graphical) {
          if (this.output.length !== 2) {
            throw new Error('Output must have 2 dimensions on graphical mode');
          }
        }

        this.checkOutput();
      }

      translateSource() {
        this.leadingReturnStatement = this.output.length > 1 ? 'resultX[x] = ' : 'result[x] = ';
        if (this.subKernels) {
          const followingReturnStatement = [];
          for (let i = 0; i < this.subKernels.length; i++) {
            const {
              name
            } = this.subKernels[i];
            followingReturnStatement.push(this.output.length > 1 ? `resultX_${ name }[x] = subKernelResult_${ name };\n` : `result_${ name }[x] = subKernelResult_${ name };\n`);
          }
          this.followingReturnStatement = followingReturnStatement.join('');
        }
        const functionBuilder = FunctionBuilder.fromKernel(this, CPUFunctionNode);
        this.translatedSources = functionBuilder.getPrototypes('kernel');
        if (!this.graphical && !this.returnType) {
          this.returnType = functionBuilder.getKernelResultType();
        }
      }

      build() {
        if (this.built) return;
        this.setupConstants();
        this.setupArguments(arguments);
        this.validateSettings(arguments);
        this.translateSource();

        if (this.graphical) {
          const {
            canvas,
            output
          } = this;
          if (!canvas) {
            throw new Error('no canvas available for using graphical output');
          }
          const width = output[0];
          const height = output[1] || 1;
          canvas.width = width;
          canvas.height = height;
          this._imageData = this.context.createImageData(width, height);
          this._colorData = new Uint8ClampedArray(width * height * 4);
        }

        const kernelString = this.getKernelString();
        this.kernelString = kernelString;

        if (this.debug) {
          console.log('Function output:');
          console.log(kernelString);
        }

        try {
          this.run = new Function([], kernelString).bind(this)();
        } catch (e) {
          console.error('An error occurred compiling the javascript: ', e);
        }
        this.buildSignature(arguments);
        this.built = true;
      }

      color(r, g, b, a) {
        if (typeof a === 'undefined') {
          a = 1;
        }

        r = Math.floor(r * 255);
        g = Math.floor(g * 255);
        b = Math.floor(b * 255);
        a = Math.floor(a * 255);

        const width = this.output[0];
        const height = this.output[1];

        const x = this.thread.x;
        const y = height - this.thread.y - 1;

        const index = x + y * width;

        this._colorData[index * 4 + 0] = r;
        this._colorData[index * 4 + 1] = g;
        this._colorData[index * 4 + 2] = b;
        this._colorData[index * 4 + 3] = a;
      }

      getKernelString() {
        if (this._kernelString !== null) return this._kernelString;

        let kernelThreadString = null;
        let {
          translatedSources
        } = this;
        if (translatedSources.length > 1) {
          translatedSources = translatedSources.filter(fn => {
            if (/^function/.test(fn)) return fn;
            kernelThreadString = fn;
            return false;
          });
        } else {
          kernelThreadString = translatedSources.shift();
        }
        return this._kernelString = `  const LOOP_MAX = ${ this._getLoopMaxString() };
  ${ this.injectedNative || '' }
  const _this = this;
  ${ this._resultKernelHeader() }
  ${ this._processConstants() }
  return (${ this.argumentNames.map(argumentName => 'user_' + argumentName).join(', ') }) => {
    ${ this._prependedString.join('') }
    ${ this._earlyThrows() }
    ${ this._processArguments() }
    ${ this.graphical ? this._graphicalKernelBody(kernelThreadString) : this._resultKernelBody(kernelThreadString) }
    ${ translatedSources.length > 0 ? translatedSources.join('\n') : '' }
  };`;
      }

      toString() {
        return cpuKernelString(this);
      }

      _getLoopMaxString() {
        return (
          this.loopMaxIterations ?
          ` ${ parseInt(this.loopMaxIterations) };` :
          ' 1000;'
        );
      }

      _processConstants() {
        if (!this.constants) return '';

        const result = [];
        for (let p in this.constants) {
          const type = this.constantTypes[p];
          switch (type) {
            case 'HTMLCanvas':
            case 'HTMLImage':
            case 'HTMLVideo':
              result.push(`    const constants_${p} = this._mediaTo2DArray(this.constants.${p});\n`);
              break;
            case 'HTMLImageArray':
              result.push(`    const constants_${p} = this._imageTo3DArray(this.constants.${p});\n`);
              break;
            case 'Input':
              result.push(`    const constants_${p} = this.constants.${p}.value;\n`);
              break;
            default:
              result.push(`    const constants_${p} = this.constants.${p};\n`);
          }
        }
        return result.join('');
      }

      _earlyThrows() {
        if (this.graphical) return '';
        if (this.immutable) return '';
        if (!this.pipeline) return '';
        const arrayArguments = [];
        for (let i = 0; i < this.argumentTypes.length; i++) {
          if (this.argumentTypes[i] === 'Array') {
            arrayArguments.push(this.argumentNames[i]);
          }
        }
        if (arrayArguments.length === 0) return '';
        const checks = [];
        for (let i = 0; i < arrayArguments.length; i++) {
          const argumentName = arrayArguments[i];
          const checkSubKernels = this._mapSubKernels(subKernel => `user_${argumentName} === result_${subKernel.name}`).join(' || ');
          checks.push(`user_${argumentName} === result${checkSubKernels ? ` || ${checkSubKernels}` : ''}`);
        }
        return `if (${checks.join(' || ')}) throw new Error('Source and destination arrays are the same.  Use immutable = true');`;
      }

      _processArguments() {
        const result = [];
        for (let i = 0; i < this.argumentTypes.length; i++) {
          const variableName = `user_${this.argumentNames[i]}`;
          switch (this.argumentTypes[i]) {
            case 'HTMLCanvas':
            case 'HTMLImage':
            case 'HTMLVideo':
              result.push(`    ${variableName} = this._mediaTo2DArray(${variableName});\n`);
              break;
            case 'HTMLImageArray':
              result.push(`    ${variableName} = this._imageTo3DArray(${variableName});\n`);
              break;
            case 'Input':
              result.push(`    ${variableName} = ${variableName}.value;\n`);
              break;
            case 'ArrayTexture(1)':
            case 'ArrayTexture(2)':
            case 'ArrayTexture(3)':
            case 'ArrayTexture(4)':
            case 'NumberTexture':
            case 'MemoryOptimizedNumberTexture':
              result.push(`
    if (${variableName}.toArray) {
      if (!_this.textureCache) {
        _this.textureCache = [];
        _this.arrayCache = [];
      }
      const textureIndex = _this.textureCache.indexOf(${variableName});
      if (textureIndex !== -1) {
        ${variableName} = _this.arrayCache[textureIndex];
      } else {
        _this.textureCache.push(${variableName});
        ${variableName} = ${variableName}.toArray();
        _this.arrayCache.push(${variableName});
      }
    }`);
              break;
          }
        }
        return result.join('');
      }

      _mediaTo2DArray(media) {
        const canvas = this.canvas;
        const width = media.width > 0 ? media.width : media.videoWidth;
        const height = media.height > 0 ? media.height : media.videoHeight;
        if (canvas.width < width) {
          canvas.width = width;
        }
        if (canvas.height < height) {
          canvas.height = height;
        }
        const ctx = this.context;
        ctx.drawImage(media, 0, 0, width, height);
        const pixelsData = ctx.getImageData(0, 0, width, height).data;
        const imageArray = new Array(height);
        let index = 0;
        for (let y = height - 1; y >= 0; y--) {
          const row = imageArray[y] = new Array(width);
          for (let x = 0; x < width; x++) {
            const pixel = new Float32Array(4);
            pixel[0] = pixelsData[index++] / 255; 
            pixel[1] = pixelsData[index++] / 255; 
            pixel[2] = pixelsData[index++] / 255; 
            pixel[3] = pixelsData[index++] / 255; 
            row[x] = pixel;
          }
        }
        return imageArray;
      }

      getPixels(flip) {
        const [width, height] = this.output;
        return flip ? utils.flipPixels(this._imageData.data, width, height) : this._imageData.data.slice(0);
      }

      _imageTo3DArray(images) {
        const imagesArray = new Array(images.length);
        for (let i = 0; i < images.length; i++) {
          imagesArray[i] = this._mediaTo2DArray(images[i]);
        }
        return imagesArray;
      }

      _resultKernelHeader() {
        if (this.graphical) return '';
        if (this.immutable) return '';
        if (!this.pipeline) return '';
        switch (this.output.length) {
          case 1:
            return this._mutableKernel1DResults();
          case 2:
            return this._mutableKernel2DResults();
          case 3:
            return this._mutableKernel3DResults();
        }
      }

      _resultKernelBody(kernelString) {
        switch (this.output.length) {
          case 1:
            return (!this.immutable && this.pipeline ? this._resultMutableKernel1DLoop(kernelString) : this._resultImmutableKernel1DLoop(kernelString)) + this._kernelOutput();
          case 2:
            return (!this.immutable && this.pipeline ? this._resultMutableKernel2DLoop(kernelString) : this._resultImmutableKernel2DLoop(kernelString)) + this._kernelOutput();
          case 3:
            return (!this.immutable && this.pipeline ? this._resultMutableKernel3DLoop(kernelString) : this._resultImmutableKernel3DLoop(kernelString)) + this._kernelOutput();
          default:
            throw new Error('unsupported size kernel');
        }
      }

      _graphicalKernelBody(kernelThreadString) {
        switch (this.output.length) {
          case 2:
            return this._graphicalKernel2DLoop(kernelThreadString) + this._graphicalOutput();
          default:
            throw new Error('unsupported size kernel');
        }
      }

      _graphicalOutput() {
        return `
    this._imageData.data.set(this._colorData);
    this.context.putImageData(this._imageData, 0, 0);
    return;`
      }

      _getKernelResultTypeConstructorString() {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Number':
          case 'Integer':
          case 'Float':
            return 'Float32Array';
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
            return 'Array';
          default:
            if (this.graphical) {
              return 'Float32Array';
            }
            throw new Error(`unhandled returnType ${ this.returnType }`);
        }
      }

      _resultImmutableKernel1DLoop(kernelString) {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const result = new ${constructorString}(outputX);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new ${constructorString}(outputX);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let x = 0; x < outputX; x++) {
      this.thread.x = x;
      this.thread.y = 0;
      this.thread.z = 0;
      ${ kernelString }
    }`;
      }

      _mutableKernel1DResults() {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const result = new ${constructorString}(outputX);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new ${constructorString}(outputX);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }`;
      }

      _resultMutableKernel1DLoop(kernelString) {
        return `  const outputX = _this.output[0];
    for (let x = 0; x < outputX; x++) {
      this.thread.x = x;
      this.thread.y = 0;
      this.thread.z = 0;
      ${ kernelString }
    }`;
      }

      _resultImmutableKernel2DLoop(kernelString) {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const result = new Array(outputY);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputY);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let y = 0; y < outputY; y++) {
      this.thread.z = 0;
      this.thread.y = y;
      const resultX = result[y] = new ${constructorString}(outputX);
      ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = result_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('') }
      for (let x = 0; x < outputX; x++) {
        this.thread.x = x;
        ${ kernelString }
      }
    }`;
      }

      _mutableKernel2DResults() {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const result = new Array(outputY);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputY);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let y = 0; y < outputY; y++) {
      const resultX = result[y] = new ${constructorString}(outputX);
      ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = result_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('') }
    }`;
      }

      _resultMutableKernel2DLoop(kernelString) {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    for (let y = 0; y < outputY; y++) {
      this.thread.z = 0;
      this.thread.y = y;
      const resultX = result[y];
      ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = result_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('') }
      for (let x = 0; x < outputX; x++) {
        this.thread.x = x;
        ${ kernelString }
      }
    }`;
      }

      _graphicalKernel2DLoop(kernelString) {
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    for (let y = 0; y < outputY; y++) {
      this.thread.z = 0;
      this.thread.y = y;
      for (let x = 0; x < outputX; x++) {
        this.thread.x = x;
        ${ kernelString }
      }
    }`;
      }

      _resultImmutableKernel3DLoop(kernelString) {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const outputZ = _this.output[2];
    const result = new Array(outputZ);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputZ);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let z = 0; z < outputZ; z++) {
      this.thread.z = z;
      const resultY = result[z] = new Array(outputY);
      ${ this._mapSubKernels(subKernel => `const resultY_${ subKernel.name } = result_${subKernel.name}[z] = new Array(outputY);\n`).join('      ') }
      for (let y = 0; y < outputY; y++) {
        this.thread.y = y;
        const resultX = resultY[y] = new ${constructorString}(outputX);
        ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = resultY_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('        ') }
        for (let x = 0; x < outputX; x++) {
          this.thread.x = x;
          ${ kernelString }
        }
      }
    }`;
      }

      _mutableKernel3DResults() {
        const constructorString = this._getKernelResultTypeConstructorString();
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const outputZ = _this.output[2];
    const result = new Array(outputZ);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputZ);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let z = 0; z < outputZ; z++) {
      const resultY = result[z] = new Array(outputY);
      ${ this._mapSubKernels(subKernel => `const resultY_${ subKernel.name } = result_${subKernel.name}[z] = new Array(outputY);\n`).join('      ') }
      for (let y = 0; y < outputY; y++) {
        const resultX = resultY[y] = new ${constructorString}(outputX);
        ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = resultY_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('        ') }
      }
    }`;
      }

      _resultMutableKernel3DLoop(kernelString) {
        return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const outputZ = _this.output[2];
    for (let z = 0; z < outputZ; z++) {
      this.thread.z = z;
      const resultY = result[z];
      for (let y = 0; y < outputY; y++) {
        this.thread.y = y;
        const resultX = resultY[y];
        for (let x = 0; x < outputX; x++) {
          this.thread.x = x;
          ${ kernelString }
        }
      }
    }`;
      }

      _kernelOutput() {
        if (!this.subKernels) {
          return '\n    return result;';
        }
        return `\n    return {
      result: result,
      ${ this.subKernels.map(subKernel => `${ subKernel.property }: result_${ subKernel.name }`).join(',\n      ') }
    };`;
      }

      _mapSubKernels(fn) {
        return this.subKernels === null ? [''] :
          this.subKernels.map(fn);
      }

      destroy(removeCanvasReference) {
        if (removeCanvasReference) {
          delete this.canvas;
        }
      }

      static destroyContext(context) {}

      toJSON() {
        const json = super.toJSON();
        json.functionNodes = FunctionBuilder.fromKernel(this, CPUFunctionNode).toJSON();
        return json;
      }

      setOutput(output) {
        super.setOutput(output);
        const [width, height] = this.output;
        if (this.graphical) {
          this._imageData = this.context.createImageData(width, height);
          this._colorData = new Uint8ClampedArray(width * height * 4);
        }
      }

      prependString(value) {
        if (this._kernelString) throw new Error('Kernel already built');
        this._prependedString.push(value);
      }

      hasPrependString(value) {
        return this._prependedString.indexOf(value) > -1;
      }
    }

    module.exports = {
      CPUKernel
    };
    },{"../../utils":114,"../function-builder":9,"../kernel":36,"./function-node":6,"./kernel-string":7}],9:[function(require,module,exports){
    class FunctionBuilder {
      static fromKernel(kernel, FunctionNode, extraNodeOptions) {
        const {
          kernelArguments,
          kernelConstants,
          argumentNames,
          argumentSizes,
          argumentBitRatios,
          constants,
          constantBitRatios,
          debug,
          loopMaxIterations,
          nativeFunctions,
          output,
          optimizeFloatMemory,
          precision,
          plugins,
          source,
          subKernels,
          functions,
          leadingReturnStatement,
          followingReturnStatement,
          dynamicArguments,
          dynamicOutput,
          onIstanbulCoverageVariable,
          removeIstanbulCoverage,
        } = kernel;

        const argumentTypes = new Array(kernelArguments.length);
        const constantTypes = {};

        for (let i = 0; i < kernelArguments.length; i++) {
          argumentTypes[i] = kernelArguments[i].type;
        }

        for (let i = 0; i < kernelConstants.length; i++) {
          const kernelConstant = kernelConstants[i];
          constantTypes[kernelConstant.name] = kernelConstant.type;
        }

        const needsArgumentType = (functionName, index) => {
          return functionBuilder.needsArgumentType(functionName, index);
        };

        const assignArgumentType = (functionName, index, type) => {
          functionBuilder.assignArgumentType(functionName, index, type);
        };

        const lookupReturnType = (functionName, ast, requestingNode) => {
          return functionBuilder.lookupReturnType(functionName, ast, requestingNode);
        };

        const lookupFunctionArgumentTypes = (functionName) => {
          return functionBuilder.lookupFunctionArgumentTypes(functionName);
        };

        const lookupFunctionArgumentName = (functionName, argumentIndex) => {
          return functionBuilder.lookupFunctionArgumentName(functionName, argumentIndex);
        };

        const lookupFunctionArgumentBitRatio = (functionName, argumentName) => {
          return functionBuilder.lookupFunctionArgumentBitRatio(functionName, argumentName);
        };

        const triggerImplyArgumentType = (functionName, i, argumentType, requestingNode) => {
          functionBuilder.assignArgumentType(functionName, i, argumentType, requestingNode);
        };

        const triggerImplyArgumentBitRatio = (functionName, argumentName, calleeFunctionName, argumentIndex) => {
          functionBuilder.assignArgumentBitRatio(functionName, argumentName, calleeFunctionName, argumentIndex);
        };

        const onFunctionCall = (functionName, calleeFunctionName, args) => {
          functionBuilder.trackFunctionCall(functionName, calleeFunctionName, args);
        };

        const onNestedFunction = (ast, returnType) => {
          const argumentNames = [];
          for (let i = 0; i < ast.params.length; i++) {
            argumentNames.push(ast.params[i].name);
          }
          const nestedFunction = new FunctionNode(null, Object.assign({}, nodeOptions, {
            returnType: null,
            ast,
            name: ast.id.name,
            argumentNames,
            lookupReturnType,
            lookupFunctionArgumentTypes,
            lookupFunctionArgumentName,
            lookupFunctionArgumentBitRatio,
            needsArgumentType,
            assignArgumentType,
            triggerImplyArgumentType,
            triggerImplyArgumentBitRatio,
            onFunctionCall,
          }));
          nestedFunction.traceFunctionAST(ast);
          functionBuilder.addFunctionNode(nestedFunction);
        };

        const nodeOptions = Object.assign({
          isRootKernel: false,
          onNestedFunction,
          lookupReturnType,
          lookupFunctionArgumentTypes,
          lookupFunctionArgumentName,
          lookupFunctionArgumentBitRatio,
          needsArgumentType,
          assignArgumentType,
          triggerImplyArgumentType,
          triggerImplyArgumentBitRatio,
          onFunctionCall,
          onIstanbulCoverageVariable: onIstanbulCoverageVariable ? (name) => onIstanbulCoverageVariable(name, kernel) : null,
          removeIstanbulCoverage,
          optimizeFloatMemory,
          precision,
          constants,
          constantTypes,
          constantBitRatios,
          debug,
          loopMaxIterations,
          output,
          plugins,
          dynamicArguments,
          dynamicOutput,
        }, extraNodeOptions || {});

        const rootNodeOptions = Object.assign({}, nodeOptions, {
          isRootKernel: true,
          name: 'kernel',
          argumentNames,
          argumentTypes,
          argumentSizes,
          argumentBitRatios,
          leadingReturnStatement,
          followingReturnStatement,
        });

        if (typeof source === 'object' && source.functionNodes) {
          return new FunctionBuilder().fromJSON(source.functionNodes, FunctionNode);
        }

        const rootNode = new FunctionNode(source, rootNodeOptions);

        let functionNodes = null;
        if (functions) {
          functionNodes = functions.map((fn) => new FunctionNode(fn.source, {
            returnType: fn.returnType,
            argumentTypes: fn.argumentTypes,
            output,
            plugins,
            constants,
            constantTypes,
            constantBitRatios,
            optimizeFloatMemory,
            precision,
            lookupReturnType,
            lookupFunctionArgumentTypes,
            lookupFunctionArgumentName,
            lookupFunctionArgumentBitRatio,
            needsArgumentType,
            assignArgumentType,
            triggerImplyArgumentType,
            triggerImplyArgumentBitRatio,
            onFunctionCall,
            onNestedFunction,
            onIstanbulCoverageVariable: onIstanbulCoverageVariable ? (name) => onIstanbulCoverageVariable(name, kernel) : null,
            removeIstanbulCoverage,
          }));
        }

        let subKernelNodes = null;
        if (subKernels) {
          subKernelNodes = subKernels.map((subKernel) => {
            const { name, source } = subKernel;
            return new FunctionNode(source, Object.assign({}, nodeOptions, {
              name,
              isSubKernel: true,
              isRootKernel: false,
            }));
          });
        }

        const functionBuilder = new FunctionBuilder({
          kernel,
          rootNode,
          functionNodes,
          nativeFunctions,
          subKernelNodes
        });

        return functionBuilder;
      }

      constructor(settings) {
        settings = settings || {};
        this.kernel = settings.kernel;
        this.rootNode = settings.rootNode;
        this.functionNodes = settings.functionNodes || [];
        this.subKernelNodes = settings.subKernelNodes || [];
        this.nativeFunctions = settings.nativeFunctions || [];
        this.functionMap = {};
        this.nativeFunctionNames = [];
        this.lookupChain = [];
        this.functionNodeDependencies = {};
        this.functionCalls = {};

        if (this.rootNode) {
          this.functionMap['kernel'] = this.rootNode;
        }

        if (this.functionNodes) {
          for (let i = 0; i < this.functionNodes.length; i++) {
            this.functionMap[this.functionNodes[i].name] = this.functionNodes[i];
          }
        }

        if (this.subKernelNodes) {
          for (let i = 0; i < this.subKernelNodes.length; i++) {
            this.functionMap[this.subKernelNodes[i].name] = this.subKernelNodes[i];
          }
        }

        if (this.nativeFunctions) {
          for (let i = 0; i < this.nativeFunctions.length; i++) {
            const nativeFunction = this.nativeFunctions[i];
            this.nativeFunctionNames.push(nativeFunction.name);
          }
        }
      }

      addFunctionNode(functionNode) {
        if (!functionNode.name) throw new Error('functionNode.name needs set');
        this.functionMap[functionNode.name] = functionNode;
        if (functionNode.isRootKernel) {
          this.rootNode = functionNode;
        }
      }

      traceFunctionCalls(functionName, retList) {
        functionName = functionName || 'kernel';
        retList = retList || [];

        if (this.nativeFunctionNames.indexOf(functionName) > -1) {
          if (retList.indexOf(functionName) === -1) {
            retList.push(functionName);
          }
          return retList;
        }

        const functionNode = this.functionMap[functionName];
        if (functionNode) {
          const functionIndex = retList.indexOf(functionName);
          if (functionIndex === -1) {
            retList.push(functionName);
            functionNode.toString(); 
            for (let i = 0; i < functionNode.calledFunctions.length; ++i) {
              this.traceFunctionCalls(functionNode.calledFunctions[i], retList);
            }
          } else {
            const dependantFunctionName = retList.splice(functionIndex, 1)[0];
            retList.push(dependantFunctionName);
          }
        }

        return retList;
      }

      getPrototypeString(functionName) {
        return this.getPrototypes(functionName).join('\n');
      }

      getPrototypes(functionName) {
        if (this.rootNode) {
          this.rootNode.toString();
        }
        if (functionName) {
          return this.getPrototypesFromFunctionNames(this.traceFunctionCalls(functionName, []).reverse());
        }
        return this.getPrototypesFromFunctionNames(Object.keys(this.functionMap));
      }

      getStringFromFunctionNames(functionList) {
        const ret = [];
        for (let i = 0; i < functionList.length; ++i) {
          const node = this.functionMap[functionList[i]];
          if (node) {
            ret.push(this.functionMap[functionList[i]].toString());
          }
        }
        return ret.join('\n');
      }

      getPrototypesFromFunctionNames(functionList) {
        const ret = [];
        for (let i = 0; i < functionList.length; ++i) {
          const functionName = functionList[i];
          const functionIndex = this.nativeFunctionNames.indexOf(functionName);
          if (functionIndex > -1) {
            ret.push(this.nativeFunctions[functionIndex].source);
            continue;
          }
          const node = this.functionMap[functionName];
          if (node) {
            ret.push(node.toString());
          }
        }
        return ret;
      }

      toJSON() {
        return this.traceFunctionCalls(this.rootNode.name).reverse().map(name => {
          const nativeIndex = this.nativeFunctions.indexOf(name);
          if (nativeIndex > -1) {
            return {
              name,
              source: this.nativeFunctions[nativeIndex].source
            };
          } else if (this.functionMap[name]) {
            return this.functionMap[name].toJSON();
          } else {
            throw new Error(`function ${ name } not found`);
          }
        });
      }

      fromJSON(jsonFunctionNodes, FunctionNode) {
        this.functionMap = {};
        for (let i = 0; i < jsonFunctionNodes.length; i++) {
          const jsonFunctionNode = jsonFunctionNodes[i];
          this.functionMap[jsonFunctionNode.settings.name] = new FunctionNode(jsonFunctionNode.ast, jsonFunctionNode.settings);
        }
        return this;
      }

      getString(functionName) {
        if (functionName) {
          return this.getStringFromFunctionNames(this.traceFunctionCalls(functionName).reverse());
        }
        return this.getStringFromFunctionNames(Object.keys(this.functionMap));
      }

      lookupReturnType(functionName, ast, requestingNode) {
        if (ast.type !== 'CallExpression') {
          throw new Error(`expected ast type of "CallExpression", but is ${ ast.type }`);
        }
        if (this._isNativeFunction(functionName)) {
          return this._lookupNativeFunctionReturnType(functionName);
        } else if (this._isFunction(functionName)) {
          const node = this._getFunction(functionName);
          if (node.returnType) {
            return node.returnType;
          } else {
            for (let i = 0; i < this.lookupChain.length; i++) {
              if (this.lookupChain[i].ast === ast) {
                if (node.argumentTypes.length === 0 && ast.arguments.length > 0) {
                  const args = ast.arguments;
                  for (let j = 0; j < args.length; j++) {
                    this.lookupChain.push({
                      name: requestingNode.name,
                      ast: args[i],
                      requestingNode
                    });
                    node.argumentTypes[j] = requestingNode.getType(args[j]);
                    this.lookupChain.pop();
                  }
                  return node.returnType = node.getType(node.getJsAST());
                }

                throw new Error('circlical logic detected!');
              }
            }
            this.lookupChain.push({
              name: requestingNode.name,
              ast,
              requestingNode
            });
            const type = node.getType(node.getJsAST());
            this.lookupChain.pop();
            return node.returnType = type;
          }
        }

        return null;
      }

      _getFunction(functionName) {
        if (!this._isFunction(functionName)) ;
        return this.functionMap[functionName];
      }

      _isFunction(functionName) {
        return Boolean(this.functionMap[functionName]);
      }

      _getNativeFunction(functionName) {
        for (let i = 0; i < this.nativeFunctions.length; i++) {
          if (this.nativeFunctions[i].name === functionName) return this.nativeFunctions[i];
        }
        return null;
      }

      _isNativeFunction(functionName) {
        return Boolean(this._getNativeFunction(functionName));
      }

      _lookupNativeFunctionReturnType(functionName) {
        let nativeFunction = this._getNativeFunction(functionName);
        if (nativeFunction) {
          return nativeFunction.returnType;
        }
        throw new Error(`Native function ${ functionName } not found`);
      }

      lookupFunctionArgumentTypes(functionName) {
        if (this._isNativeFunction(functionName)) {
          return this._getNativeFunction(functionName).argumentTypes;
        } else if (this._isFunction(functionName)) {
          return this._getFunction(functionName).argumentTypes;
        }
        return null;
      }

      lookupFunctionArgumentName(functionName, argumentIndex) {
        return this._getFunction(functionName).argumentNames[argumentIndex];
      }

      lookupFunctionArgumentBitRatio(functionName, argumentName) {
        if (!this._isFunction(functionName)) {
          throw new Error('function not found');
        }
        if (this.rootNode.name === functionName) {
          const i = this.rootNode.argumentNames.indexOf(argumentName);
          if (i !== -1) {
            return this.rootNode.argumentBitRatios[i];
          }
        }
        const node = this._getFunction(functionName);
        const i = node.argumentNames.indexOf(argumentName);
        if (i === -1) {
          throw new Error('argument not found');
        }
        const bitRatio = node.argumentBitRatios[i];
        if (typeof bitRatio !== 'number') {
          throw new Error('argument bit ratio not found');
        }
        return bitRatio;
      }

      needsArgumentType(functionName, i) {
        if (!this._isFunction(functionName)) return false;
        const fnNode = this._getFunction(functionName);
        return !fnNode.argumentTypes[i];
      }

      assignArgumentType(functionName, i, argumentType, requestingNode) {
        if (!this._isFunction(functionName)) return;
        const fnNode = this._getFunction(functionName);
        if (!fnNode.argumentTypes[i]) {
          fnNode.argumentTypes[i] = argumentType;
        }
      }

      assignArgumentBitRatio(functionName, argumentName, calleeFunctionName, argumentIndex) {
        const node = this._getFunction(functionName);
        if (this._isNativeFunction(calleeFunctionName)) return null;
        const calleeNode = this._getFunction(calleeFunctionName);
        const i = node.argumentNames.indexOf(argumentName);
        if (i === -1) {
          throw new Error(`Argument ${argumentName} not found in arguments from function ${functionName}`);
        }
        const bitRatio = node.argumentBitRatios[i];
        if (typeof bitRatio !== 'number') {
          throw new Error(`Bit ratio for argument ${argumentName} not found in function ${functionName}`);
        }
        if (!calleeNode.argumentBitRatios) {
          calleeNode.argumentBitRatios = new Array(calleeNode.argumentNames.length);
        }
        const calleeBitRatio = calleeNode.argumentBitRatios[i];
        if (typeof calleeBitRatio === 'number') {
          if (calleeBitRatio !== bitRatio) {
            throw new Error(`Incompatible bit ratio found at function ${functionName} at argument ${argumentName}`);
          }
          return calleeBitRatio;
        }
        calleeNode.argumentBitRatios[i] = bitRatio;
        return bitRatio;
      }

      trackFunctionCall(functionName, calleeFunctionName, args) {
        if (!this.functionNodeDependencies[functionName]) {
          this.functionNodeDependencies[functionName] = new Set();
          this.functionCalls[functionName] = [];
        }
        this.functionNodeDependencies[functionName].add(calleeFunctionName);
        this.functionCalls[functionName].push(args);
      }

      getKernelResultType() {
        return this.rootNode.returnType || this.rootNode.getType(this.rootNode.ast);
      }

      getSubKernelResultType(index) {
        const subKernelNode = this.subKernelNodes[index];
        let called = false;
        for (let functionCallIndex = 0; functionCallIndex < this.rootNode.functionCalls.length; functionCallIndex++) {
          const functionCall = this.rootNode.functionCalls[functionCallIndex];
          if (functionCall.ast.callee.name === subKernelNode.name) {
            called = true;
          }
        }
        if (!called) {
          throw new Error(`SubKernel ${ subKernelNode.name } never called by kernel`);
        }
        return subKernelNode.returnType || subKernelNode.getType(subKernelNode.getJsAST());
      }

      getReturnTypes() {
        const result = {
          [this.rootNode.name]: this.rootNode.getType(this.rootNode.ast),
        };
        const list = this.traceFunctionCalls(this.rootNode.name);
        for (let i = 0; i < list.length; i++) {
          const functionName = list[i];
          const functionNode = this.functionMap[functionName];
          result[functionName] = functionNode.getType(functionNode.ast);
        }
        return result;
      }
    }

    module.exports = {
      FunctionBuilder
    };
    },{}],10:[function(require,module,exports){
    const acorn = require('acorn');
    const { utils } = require('../utils');
    const { FunctionTracer } = require('./function-tracer');

    class FunctionNode {
      constructor(source, settings) {
        if (!source && !settings.ast) {
          throw new Error('source parameter is missing');
        }
        settings = settings || {};
        this.source = source;
        this.ast = null;
        this.name = typeof source === 'string' ? settings.isRootKernel ?
          'kernel' :
          (settings.name || utils.getFunctionNameFromString(source)) : null;
        this.calledFunctions = [];
        this.constants = {};
        this.constantTypes = {};
        this.constantBitRatios = {};
        this.isRootKernel = false;
        this.isSubKernel = false;
        this.debug = null;
        this.functions = null;
        this.identifiers = null;
        this.contexts = null;
        this.functionCalls = null;
        this.states = [];
        this.needsArgumentType = null;
        this.assignArgumentType = null;
        this.lookupReturnType = null;
        this.lookupFunctionArgumentTypes = null;
        this.lookupFunctionArgumentBitRatio = null;
        this.triggerImplyArgumentType = null;
        this.triggerImplyArgumentBitRatio = null;
        this.onNestedFunction = null;
        this.onFunctionCall = null;
        this.optimizeFloatMemory = null;
        this.precision = null;
        this.loopMaxIterations = null;
        this.argumentNames = (typeof this.source === 'string' ? utils.getArgumentNamesFromString(this.source) : null);
        this.argumentTypes = [];
        this.argumentSizes = [];
        this.argumentBitRatios = null;
        this.returnType = null;
        this.output = [];
        this.plugins = null;
        this.leadingReturnStatement = null;
        this.followingReturnStatement = null;
        this.dynamicOutput = null;
        this.dynamicArguments = null;
        this.strictTypingChecking = false;
        this.fixIntegerDivisionAccuracy = null;
        this.onIstanbulCoverageVariable = null;
        this.removeIstanbulCoverage = false;

        if (settings) {
          for (const p in settings) {
            if (!settings.hasOwnProperty(p)) continue;
            if (!this.hasOwnProperty(p)) continue;
            this[p] = settings[p];
          }
        }

        this.literalTypes = {};

        this.validate();
        this._string = null;
        this._internalVariableNames = {};
      }

      validate() {
        if (typeof this.source !== 'string' && !this.ast) {
          throw new Error('this.source not a string');
        }

        if (!this.ast && !utils.isFunctionString(this.source)) {
          throw new Error('this.source not a function string');
        }

        if (!this.name) {
          throw new Error('this.name could not be set');
        }

        if (this.argumentTypes.length > 0 && this.argumentTypes.length !== this.argumentNames.length) {
          throw new Error(`argumentTypes count of ${ this.argumentTypes.length } exceeds ${ this.argumentNames.length }`);
        }

        if (this.output.length < 1) {
          throw new Error('this.output is not big enough');
        }
      }

      isIdentifierConstant(name) {
        if (!this.constants) return false;
        return this.constants.hasOwnProperty(name);
      }

      isInput(argumentName) {
        return this.argumentTypes[this.argumentNames.indexOf(argumentName)] === 'Input';
      }

      pushState(state) {
        this.states.push(state);
      }

      popState(state) {
        if (this.state !== state) {
          throw new Error(`Cannot popState ${ state } when in ${ this.state }`);
        }
        this.states.pop();
      }

      isState(state) {
        return this.state === state;
      }

      get state() {
        return this.states[this.states.length - 1];
      }

      astMemberExpressionUnroll(ast) {
        if (ast.type === 'Identifier') {
          return ast.name;
        } else if (ast.type === 'ThisExpression') {
          return 'this';
        }

        if (ast.type === 'MemberExpression') {
          if (ast.object && ast.property) {
            if (ast.object.hasOwnProperty('name') && ast.object.name[0] === '_') {
              return this.astMemberExpressionUnroll(ast.property);
            }

            return (
              this.astMemberExpressionUnroll(ast.object) +
              '.' +
              this.astMemberExpressionUnroll(ast.property)
            );
          }
        }

        if (ast.hasOwnProperty('expressions')) {
          const firstExpression = ast.expressions[0];
          if (firstExpression.type === 'Literal' && firstExpression.value === 0 && ast.expressions.length === 2) {
            return this.astMemberExpressionUnroll(ast.expressions[1]);
          }
        }

        throw this.astErrorOutput('Unknown astMemberExpressionUnroll', ast);
      }

      getJsAST(inParser) {
        if (this.ast) {
          return this.ast;
        }
        if (typeof this.source === 'object') {
          this.traceFunctionAST(this.source);
          return this.ast = this.source;
        }

        inParser = inParser || acorn;
        if (inParser === null) {
          throw new Error('Missing JS to AST parser');
        }

        const ast = Object.freeze(inParser.parse(`const parser_${ this.name } = ${ this.source };`, {
          locations: true
        }));
        const functionAST = ast.body[0].declarations[0].init;
        this.traceFunctionAST(functionAST);

        if (!ast) {
          throw new Error('Failed to parse JS code');
        }

        return this.ast = functionAST;
      }

      traceFunctionAST(ast) {
        const { contexts, declarations, functions, identifiers, functionCalls } = new FunctionTracer(ast);
        this.contexts = contexts;
        this.identifiers = identifiers;
        this.functionCalls = functionCalls;
        this.functions = functions;
        for (let i = 0; i < declarations.length; i++) {
          const declaration = declarations[i];
          const { ast, inForLoopInit, inForLoopTest } = declaration;
          const { init } = ast;
          const dependencies = this.getDependencies(init);
          let valueType = null;

          if (inForLoopInit && inForLoopTest) {
            valueType = 'Integer';
          } else {
            if (init) {
              const realType = this.getType(init);
              switch (realType) {
                case 'Integer':
                case 'Float':
                case 'Number':
                  if (init.type === 'MemberExpression') {
                    valueType = realType;
                  } else {
                    valueType = 'Number';
                  }
                  break;
                case 'LiteralInteger':
                  valueType = 'Number';
                  break;
                default:
                  valueType = realType;
              }
            }
          }
          declaration.valueType = valueType;
          declaration.dependencies = dependencies;
          declaration.isSafe = this.isSafeDependencies(dependencies);
        }

        for (let i = 0; i < functions.length; i++) {
          this.onNestedFunction(functions[i]);
        }
      }

      getDeclaration(ast) {
        for (let i = 0; i < this.identifiers.length; i++) {
          const identifier = this.identifiers[i];
          if (ast === identifier.ast) {
            return identifier.declaration;
          }
        }
        return null;
      }

      getVariableType(ast) {
        if (ast.type !== 'Identifier') {
          throw new Error(`ast of ${ast.type} not "Identifier"`);
        }
        let type = null;
        const argumentIndex = this.argumentNames.indexOf(ast.name);
        if (argumentIndex === -1) {
          const declaration = this.getDeclaration(ast);
          if (declaration) {
            return declaration.valueType;
          }
        } else {
          const argumentType = this.argumentTypes[argumentIndex];
          if (argumentType) {
            type = argumentType;
          }
        }
        if (!type && this.strictTypingChecking) {
          throw new Error(`Declaration of ${name} not found`);
        }
        return type;
      }

      getLookupType(type) {
        if (!typeLookupMap.hasOwnProperty(type)) {
          throw new Error(`unknown typeLookupMap ${ type }`);
        }
        return typeLookupMap[type];
      }

      getConstantType(constantName) {
        if (this.constantTypes[constantName]) {
          const type = this.constantTypes[constantName];
          if (type === 'Float') {
            return 'Number';
          } else {
            return type;
          }
        }
        throw new Error(`Type for constant "${ constantName }" not declared`);
      }

      toString() {
        if (this._string) return this._string;
        return this._string = this.astGeneric(this.getJsAST(), []).join('').trim();
      }

      toJSON() {
        const settings = {
          source: this.source,
          name: this.name,
          constants: this.constants,
          constantTypes: this.constantTypes,
          isRootKernel: this.isRootKernel,
          isSubKernel: this.isSubKernel,
          debug: this.debug,
          output: this.output,
          loopMaxIterations: this.loopMaxIterations,
          argumentNames: this.argumentNames,
          argumentTypes: this.argumentTypes,
          argumentSizes: this.argumentSizes,
          returnType: this.returnType,
          leadingReturnStatement: this.leadingReturnStatement,
          followingReturnStatement: this.followingReturnStatement,
        };

        return {
          ast: this.ast,
          settings
        };
      }

      getType(ast) {
        if (Array.isArray(ast)) {
          return this.getType(ast[ast.length - 1]);
        }
        switch (ast.type) {
          case 'BlockStatement':
            return this.getType(ast.body);
          case 'ArrayExpression':
            return `Array(${ ast.elements.length })`;
          case 'Literal':
            const literalKey = this.astKey(ast);
            if (this.literalTypes[literalKey]) {
              return this.literalTypes[literalKey];
            }
            if (Number.isInteger(ast.value)) {
              return 'LiteralInteger';
            } else if (ast.value === true || ast.value === false) {
              return 'Boolean';
            } else {
              return 'Number';
            }
            case 'AssignmentExpression':
              return this.getType(ast.left);
            case 'CallExpression':
              if (this.isAstMathFunction(ast)) {
                return 'Number';
              }
              if (!ast.callee || !ast.callee.name) {
                if (ast.callee.type === 'SequenceExpression' && ast.callee.expressions[ast.callee.expressions.length - 1].property.name) {
                  const functionName = ast.callee.expressions[ast.callee.expressions.length - 1].property.name;
                  this.inferArgumentTypesIfNeeded(functionName, ast.arguments);
                  return this.lookupReturnType(functionName, ast, this);
                }
                if (this.getVariableSignature(ast.callee, true) === 'this.color') {
                  return null;
                }
                throw this.astErrorOutput('Unknown call expression', ast);
              }
              if (ast.callee && ast.callee.name) {
                const functionName = ast.callee.name;
                this.inferArgumentTypesIfNeeded(functionName, ast.arguments);
                return this.lookupReturnType(functionName, ast, this);
              }
              throw this.astErrorOutput(`Unhandled getType Type "${ ast.type }"`, ast);
            case 'LogicalExpression':
              return 'Boolean';
            case 'BinaryExpression':
              switch (ast.operator) {
                case '%':
                case '/':
                  if (this.fixIntegerDivisionAccuracy) {
                    return 'Number';
                  } else {
                    break;
                  }
                  case '>':
                  case '<':
                    return 'Boolean';
                  case '&':
                  case '|':
                  case '^':
                  case '<<':
                  case '>>':
                  case '>>>':
                    return 'Integer';
              }
              const type = this.getType(ast.left);
              if (this.isState('skip-literal-correction')) return type;
              if (type === 'LiteralInteger') {
                const rightType = this.getType(ast.right);
                if (rightType === 'LiteralInteger') {
                  if (ast.left.value % 1 === 0) {
                    return 'Integer';
                  } else {
                    return 'Float';
                  }
                }
                return rightType;
              }
              return typeLookupMap[type] || type;
            case 'UpdateExpression':
              return this.getType(ast.argument);
            case 'UnaryExpression':
              if (ast.operator === '~') {
                return 'Integer';
              }
              return this.getType(ast.argument);
            case 'VariableDeclaration': {
              const declarations = ast.declarations;
              let lastType;
              for (let i = 0; i < declarations.length; i++) {
                const declaration = declarations[i];
                lastType = this.getType(declaration);
              }
              if (!lastType) {
                throw this.astErrorOutput(`Unable to find type for declaration`, ast);
              }
              return lastType;
            }
            case 'VariableDeclarator':
              const declaration = this.getDeclaration(ast.id);
              if (!declaration) {
                throw this.astErrorOutput(`Unable to find declarator`, ast);
              }

              if (!declaration.valueType) {
                throw this.astErrorOutput(`Unable to find declarator valueType`, ast);
              }

              return declaration.valueType;
            case 'Identifier':
              if (ast.name === 'Infinity') {
                return 'Number';
              }
              if (this.isAstVariable(ast)) {
                const signature = this.getVariableSignature(ast);
                if (signature === 'value') {
                  return this.getCheckVariableType(ast);
                }
              }
              const origin = this.findIdentifierOrigin(ast);
              if (origin && origin.init) {
                return this.getType(origin.init);
              }
              return null;
            case 'ReturnStatement':
              return this.getType(ast.argument);
            case 'MemberExpression':
              if (this.isAstMathFunction(ast)) {
                switch (ast.property.name) {
                  case 'ceil':
                    return 'Integer';
                  case 'floor':
                    return 'Integer';
                  case 'round':
                    return 'Integer';
                }
                return 'Number';
              }
              if (this.isAstVariable(ast)) {
                const variableSignature = this.getVariableSignature(ast);
                switch (variableSignature) {
                  case 'value[]':
                    return this.getLookupType(this.getCheckVariableType(ast.object));
                  case 'value[][]':
                    return this.getLookupType(this.getCheckVariableType(ast.object.object));
                  case 'value[][][]':
                    return this.getLookupType(this.getCheckVariableType(ast.object.object.object));
                  case 'value[][][][]':
                    return this.getLookupType(this.getCheckVariableType(ast.object.object.object.object));
                  case 'value.thread.value':
                  case 'this.thread.value':
                    return 'Integer';
                  case 'this.output.value':
                    return this.dynamicOutput ? 'Integer' : 'LiteralInteger';
                  case 'this.constants.value':
                    return this.getConstantType(ast.property.name);
                  case 'this.constants.value[]':
                    return this.getLookupType(this.getConstantType(ast.object.property.name));
                  case 'this.constants.value[][]':
                    return this.getLookupType(this.getConstantType(ast.object.object.property.name));
                  case 'this.constants.value[][][]':
                    return this.getLookupType(this.getConstantType(ast.object.object.object.property.name));
                  case 'this.constants.value[][][][]':
                    return this.getLookupType(this.getConstantType(ast.object.object.object.object.property.name));
                  case 'fn()[]':
                  case 'fn()[][]':
                  case 'fn()[][][]':
                    return this.getLookupType(this.getType(ast.object));
                  case 'value.value':
                    if (this.isAstMathVariable(ast)) {
                      return 'Number';
                    }
                    switch (ast.property.name) {
                      case 'r':
                      case 'g':
                      case 'b':
                      case 'a':
                        return this.getLookupType(this.getCheckVariableType(ast.object));
                    }
                    case '[][]':
                      return 'Number';
                }
                throw this.astErrorOutput('Unhandled getType MemberExpression', ast);
              }
              throw this.astErrorOutput('Unhandled getType MemberExpression', ast);
            case 'ConditionalExpression':
              return this.getType(ast.consequent);
            case 'FunctionDeclaration':
            case 'FunctionExpression':
              const lastReturn = this.findLastReturn(ast.body);
              if (lastReturn) {
                return this.getType(lastReturn);
              }
              return null;
            case 'IfStatement':
              return this.getType(ast.consequent);
            case 'SequenceExpression':
              return this.getType(ast.expressions[ast.expressions.length - 1]);
            default:
              throw this.astErrorOutput(`Unhandled getType Type "${ ast.type }"`, ast);
        }
      }

      getCheckVariableType(ast) {
        const type = this.getVariableType(ast);
        if (!type) {
          throw this.astErrorOutput(`${ast.type} is not defined`, ast);
        }
        return type;
      }

      inferArgumentTypesIfNeeded(functionName, args) {
        for (let i = 0; i < args.length; i++) {
          if (!this.needsArgumentType(functionName, i)) continue;
          const type = this.getType(args[i]);
          if (!type) {
            throw this.astErrorOutput(`Unable to infer argument ${i}`, args[i]);
          }
          this.assignArgumentType(functionName, i, type);
        }
      }

      isAstMathVariable(ast) {
        const mathProperties = [
          'E',
          'PI',
          'SQRT2',
          'SQRT1_2',
          'LN2',
          'LN10',
          'LOG2E',
          'LOG10E',
        ];
        return ast.type === 'MemberExpression' &&
          ast.object && ast.object.type === 'Identifier' &&
          ast.object.name === 'Math' &&
          ast.property &&
          ast.property.type === 'Identifier' &&
          mathProperties.indexOf(ast.property.name) > -1;
      }

      isAstMathFunction(ast) {
        const mathFunctions = [
          'abs',
          'acos',
          'acosh',
          'asin',
          'asinh',
          'atan',
          'atan2',
          'atanh',
          'cbrt',
          'ceil',
          'clz32',
          'cos',
          'cosh',
          'expm1',
          'exp',
          'floor',
          'fround',
          'imul',
          'log',
          'log2',
          'log10',
          'log1p',
          'max',
          'min',
          'pow',
          'random',
          'round',
          'sign',
          'sin',
          'sinh',
          'sqrt',
          'tan',
          'tanh',
          'trunc',
        ];
        return ast.type === 'CallExpression' &&
          ast.callee &&
          ast.callee.type === 'MemberExpression' &&
          ast.callee.object &&
          ast.callee.object.type === 'Identifier' &&
          ast.callee.object.name === 'Math' &&
          ast.callee.property &&
          ast.callee.property.type === 'Identifier' &&
          mathFunctions.indexOf(ast.callee.property.name) > -1;
      }

      isAstVariable(ast) {
        return ast.type === 'Identifier' || ast.type === 'MemberExpression';
      }

      isSafe(ast) {
        return this.isSafeDependencies(this.getDependencies(ast));
      }

      isSafeDependencies(dependencies) {
        return dependencies && dependencies.every ? dependencies.every(dependency => dependency.isSafe) : true;
      }

      getDependencies(ast, dependencies, isNotSafe) {
        if (!dependencies) {
          dependencies = [];
        }
        if (!ast) return null;
        if (Array.isArray(ast)) {
          for (let i = 0; i < ast.length; i++) {
            this.getDependencies(ast[i], dependencies, isNotSafe);
          }
          return dependencies;
        }
        switch (ast.type) {
          case 'AssignmentExpression':
            this.getDependencies(ast.left, dependencies, isNotSafe);
            this.getDependencies(ast.right, dependencies, isNotSafe);
            return dependencies;
          case 'ConditionalExpression':
            this.getDependencies(ast.test, dependencies, isNotSafe);
            this.getDependencies(ast.alternate, dependencies, isNotSafe);
            this.getDependencies(ast.consequent, dependencies, isNotSafe);
            return dependencies;
          case 'Literal':
            dependencies.push({
              origin: 'literal',
              value: ast.value,
              isSafe: isNotSafe === true ? false : ast.value > -Infinity && ast.value < Infinity && !isNaN(ast.value)
            });
            break;
          case 'VariableDeclarator':
            return this.getDependencies(ast.init, dependencies, isNotSafe);
          case 'Identifier':
            const declaration = this.getDeclaration(ast);
            if (declaration) {
              dependencies.push({
                name: ast.name,
                origin: 'declaration',
                isSafe: isNotSafe ? false : this.isSafeDependencies(declaration.dependencies),
              });
            } else if (this.argumentNames.indexOf(ast.name) > -1) {
              dependencies.push({
                name: ast.name,
                origin: 'argument',
                isSafe: false,
              });
            } else if (this.strictTypingChecking) {
              throw new Error(`Cannot find identifier origin "${ast.name}"`);
            }
            break;
          case 'FunctionDeclaration':
            return this.getDependencies(ast.body.body[ast.body.body.length - 1], dependencies, isNotSafe);
          case 'ReturnStatement':
            return this.getDependencies(ast.argument, dependencies);
          case 'BinaryExpression':
          case 'LogicalExpression':
            isNotSafe = (ast.operator === '/' || ast.operator === '*');
            this.getDependencies(ast.left, dependencies, isNotSafe);
            this.getDependencies(ast.right, dependencies, isNotSafe);
            return dependencies;
          case 'UnaryExpression':
          case 'UpdateExpression':
            return this.getDependencies(ast.argument, dependencies, isNotSafe);
          case 'VariableDeclaration':
            return this.getDependencies(ast.declarations, dependencies, isNotSafe);
          case 'ArrayExpression':
            dependencies.push({
              origin: 'declaration',
              isSafe: true,
            });
            return dependencies;
          case 'CallExpression':
            dependencies.push({
              origin: 'function',
              isSafe: true,
            });
            return dependencies;
          case 'MemberExpression':
            const details = this.getMemberExpressionDetails(ast);
            switch (details.signature) {
              case 'value[]':
                this.getDependencies(ast.object, dependencies, isNotSafe);
                break;
              case 'value[][]':
                this.getDependencies(ast.object.object, dependencies, isNotSafe);
                break;
              case 'value[][][]':
                this.getDependencies(ast.object.object.object, dependencies, isNotSafe);
                break;
              case 'this.output.value':
                if (this.dynamicOutput) {
                  dependencies.push({
                    name: details.name,
                    origin: 'output',
                    isSafe: false,
                  });
                }
                break;
            }
            if (details) {
              if (details.property) {
                this.getDependencies(details.property, dependencies, isNotSafe);
              }
              if (details.xProperty) {
                this.getDependencies(details.xProperty, dependencies, isNotSafe);
              }
              if (details.yProperty) {
                this.getDependencies(details.yProperty, dependencies, isNotSafe);
              }
              if (details.zProperty) {
                this.getDependencies(details.zProperty, dependencies, isNotSafe);
              }
              return dependencies;
            }
            case 'SequenceExpression':
              return this.getDependencies(ast.expressions, dependencies, isNotSafe);
            default:
              throw this.astErrorOutput(`Unhandled type ${ ast.type } in getDependencies`, ast);
        }
        return dependencies;
      }

      getVariableSignature(ast, returnRawValue) {
        if (!this.isAstVariable(ast)) {
          throw new Error(`ast of type "${ ast.type }" is not a variable signature`);
        }
        if (ast.type === 'Identifier') {
          return 'value';
        }
        const signature = [];
        while (true) {
          if (!ast) break;
          if (ast.computed) {
            signature.push('[]');
          } else if (ast.type === 'ThisExpression') {
            signature.unshift('this');
          } else if (ast.property && ast.property.name) {
            if (
              ast.property.name === 'x' ||
              ast.property.name === 'y' ||
              ast.property.name === 'z'
            ) {
              signature.unshift(returnRawValue ? '.' + ast.property.name : '.value');
            } else if (
              ast.property.name === 'constants' ||
              ast.property.name === 'thread' ||
              ast.property.name === 'output'
            ) {
              signature.unshift('.' + ast.property.name);
            } else {
              signature.unshift(returnRawValue ? '.' + ast.property.name : '.value');
            }
          } else if (ast.name) {
            signature.unshift(returnRawValue ? ast.name : 'value');
          } else if (ast.callee && ast.callee.name) {
            signature.unshift(returnRawValue ? ast.callee.name + '()' : 'fn()');
          } else if (ast.elements) {
            signature.unshift('[]');
          } else {
            signature.unshift('unknown');
          }
          ast = ast.object;
        }

        const signatureString = signature.join('');
        if (returnRawValue) {
          return signatureString;
        }

        const allowedExpressions = [
          'value',
          'value[]',
          'value[][]',
          'value[][][]',
          'value[][][][]',
          'value.value',
          'value.value[]', 
          'value.value[][]', 
          'value.thread.value',
          'this.thread.value',
          'this.output.value',
          'this.constants.value',
          'this.constants.value[]',
          'this.constants.value[][]',
          'this.constants.value[][][]',
          'this.constants.value[][][][]',
          'fn()[]',
          'fn()[][]',
          'fn()[][][]',
          '[][]',
        ];
        if (allowedExpressions.indexOf(signatureString) > -1) {
          return signatureString;
        }
        return null;
      }

      build() {
        return this.toString().length > 0;
      }

      astGeneric(ast, retArr) {
        if (ast === null) {
          throw this.astErrorOutput('NULL ast', ast);
        } else {
          if (Array.isArray(ast)) {
            for (let i = 0; i < ast.length; i++) {
              this.astGeneric(ast[i], retArr);
            }
            return retArr;
          }

          switch (ast.type) {
            case 'FunctionDeclaration':
              return this.astFunctionDeclaration(ast, retArr);
            case 'FunctionExpression':
              return this.astFunctionExpression(ast, retArr);
            case 'ReturnStatement':
              return this.astReturnStatement(ast, retArr);
            case 'Literal':
              return this.astLiteral(ast, retArr);
            case 'BinaryExpression':
              return this.astBinaryExpression(ast, retArr);
            case 'Identifier':
              return this.astIdentifierExpression(ast, retArr);
            case 'AssignmentExpression':
              return this.astAssignmentExpression(ast, retArr);
            case 'ExpressionStatement':
              return this.astExpressionStatement(ast, retArr);
            case 'EmptyStatement':
              return this.astEmptyStatement(ast, retArr);
            case 'BlockStatement':
              return this.astBlockStatement(ast, retArr);
            case 'IfStatement':
              return this.astIfStatement(ast, retArr);
            case 'SwitchStatement':
              return this.astSwitchStatement(ast, retArr);
            case 'BreakStatement':
              return this.astBreakStatement(ast, retArr);
            case 'ContinueStatement':
              return this.astContinueStatement(ast, retArr);
            case 'ForStatement':
              return this.astForStatement(ast, retArr);
            case 'WhileStatement':
              return this.astWhileStatement(ast, retArr);
            case 'DoWhileStatement':
              return this.astDoWhileStatement(ast, retArr);
            case 'VariableDeclaration':
              return this.astVariableDeclaration(ast, retArr);
            case 'VariableDeclarator':
              return this.astVariableDeclarator(ast, retArr);
            case 'ThisExpression':
              return this.astThisExpression(ast, retArr);
            case 'SequenceExpression':
              return this.astSequenceExpression(ast, retArr);
            case 'UnaryExpression':
              return this.astUnaryExpression(ast, retArr);
            case 'UpdateExpression':
              return this.astUpdateExpression(ast, retArr);
            case 'LogicalExpression':
              return this.astLogicalExpression(ast, retArr);
            case 'MemberExpression':
              return this.astMemberExpression(ast, retArr);
            case 'CallExpression':
              return this.astCallExpression(ast, retArr);
            case 'ArrayExpression':
              return this.astArrayExpression(ast, retArr);
            case 'DebuggerStatement':
              return this.astDebuggerStatement(ast, retArr);
            case 'ConditionalExpression':
              return this.astConditionalExpression(ast, retArr);
          }

          throw this.astErrorOutput('Unknown ast type : ' + ast.type, ast);
        }
      }
      astErrorOutput(error, ast) {
        if (typeof this.source !== 'string') {
          return new Error(error);
        }

        const debugString = utils.getAstString(this.source, ast);
        const leadingSource = this.source.substr(ast.start);
        const splitLines = leadingSource.split(/\n/);
        const lineBefore = splitLines.length > 0 ? splitLines[splitLines.length - 1] : 0;
        return new Error(`${error} on line ${ splitLines.length }, position ${ lineBefore.length }:\n ${ debugString }`);
      }

      astDebuggerStatement(arrNode, retArr) {
        return retArr;
      }

      astConditionalExpression(ast, retArr) {
        if (ast.type !== 'ConditionalExpression') {
          throw this.astErrorOutput('Not a conditional expression', ast);
        }
        retArr.push('(');
        this.astGeneric(ast.test, retArr);
        retArr.push('?');
        this.astGeneric(ast.consequent, retArr);
        retArr.push(':');
        this.astGeneric(ast.alternate, retArr);
        retArr.push(')');
        return retArr;
      }

      astFunction(ast, retArr) {
        throw new Error(`"astFunction" not defined on ${ this.constructor.name }`);
      }

      astFunctionDeclaration(ast, retArr) {
        if (this.isChildFunction(ast)) {
          return retArr;
        }
        return this.astFunction(ast, retArr);
      }
      astFunctionExpression(ast, retArr) {
        if (this.isChildFunction(ast)) {
          return retArr;
        }
        return this.astFunction(ast, retArr);
      }
      isChildFunction(ast) {
        for (let i = 0; i < this.functions.length; i++) {
          if (this.functions[i] === ast) {
            return true;
          }
        }
        return false;
      }
      astReturnStatement(ast, retArr) {
        return retArr;
      }
      astLiteral(ast, retArr) {
        this.literalTypes[this.astKey(ast)] = 'Number';
        return retArr;
      }
      astBinaryExpression(ast, retArr) {
        return retArr;
      }
      astIdentifierExpression(ast, retArr) {
        return retArr;
      }
      astAssignmentExpression(ast, retArr) {
        return retArr;
      }
      astExpressionStatement(esNode, retArr) {
        this.astGeneric(esNode.expression, retArr);
        retArr.push(';');
        return retArr;
      }
      astEmptyStatement(eNode, retArr) {
        return retArr;
      }
      astBlockStatement(ast, retArr) {
        return retArr;
      }
      astIfStatement(ast, retArr) {
        return retArr;
      }
      astSwitchStatement(ast, retArr) {
        return retArr;
      }
      astBreakStatement(brNode, retArr) {
        retArr.push('break;');
        return retArr;
      }
      astContinueStatement(crNode, retArr) {
        retArr.push('continue;\n');
        return retArr;
      }
      astForStatement(ast, retArr) {
        return retArr;
      }
      astWhileStatement(ast, retArr) {
        return retArr;
      }
      astDoWhileStatement(ast, retArr) {
        return retArr;
      }
      astVariableDeclarator(iVarDecNode, retArr) {
        this.astGeneric(iVarDecNode.id, retArr);
        if (iVarDecNode.init !== null) {
          retArr.push('=');
          this.astGeneric(iVarDecNode.init, retArr);
        }
        return retArr;
      }
      astThisExpression(ast, retArr) {
        return retArr;
      }
      isIstanbulAST(ast) {
        const variableSignature = this.getVariableSignature(ast);
        return variableSignature === 'value.value[]' || variableSignature === 'value.value[][]';
      }
      astSequenceExpression(sNode, retArr) {
        const { expressions } = sNode;
        const sequenceResult = [];
        for (let i = 0; i < expressions.length; i++) {
          const expression = expressions[i];
          if (this.removeIstanbulCoverage) {
            if (expression.type === 'UpdateExpression' && this.isIstanbulAST(expression.argument)) {
              continue;
            }
          }
          const expressionResult = [];
          this.astGeneric(expression, expressionResult);
          sequenceResult.push(expressionResult.join(''));
        }
        if (sequenceResult.length > 1) {
          retArr.push('(', sequenceResult.join(','), ')');
        } else {
          retArr.push(sequenceResult[0]);
        }
        return retArr;
      }
      astUnaryExpression(uNode, retArr) {
        const unaryResult = this.checkAndUpconvertBitwiseUnary(uNode, retArr);
        if (unaryResult) {
          return retArr;
        }

        if (uNode.prefix) {
          retArr.push(uNode.operator);
          this.astGeneric(uNode.argument, retArr);
        } else {
          this.astGeneric(uNode.argument, retArr);
          retArr.push(uNode.operator);
        }

        return retArr;
      }

      checkAndUpconvertBitwiseUnary(uNode, retArr) {}

      astUpdateExpression(uNode, retArr) {
        if (this.removeIstanbulCoverage) {
          const signature = this.getVariableSignature(uNode.argument);
          if (this.isIstanbulAST(uNode.argument)) {
            return retArr;
          }
        }
        if (uNode.prefix) {
          retArr.push(uNode.operator);
          this.astGeneric(uNode.argument, retArr);
        } else {
          this.astGeneric(uNode.argument, retArr);
          retArr.push(uNode.operator);
        }

        return retArr;
      }
      astLogicalExpression(logNode, retArr) {
        retArr.push('(');
        this.astGeneric(logNode.left, retArr);
        retArr.push(logNode.operator);
        this.astGeneric(logNode.right, retArr);
        retArr.push(')');
        return retArr;
      }
      astMemberExpression(ast, retArr) {
        return retArr;
      }
      astCallExpression(ast, retArr) {
        return retArr;
      }
      astArrayExpression(ast, retArr) {
        return retArr;
      }

      getMemberExpressionDetails(ast) {
        if (ast.type !== 'MemberExpression') {
          throw this.astErrorOutput(`Expression ${ ast.type } not a MemberExpression`, ast);
        }
        let name = null;
        let type = null;
        const variableSignature = this.getVariableSignature(ast);
        switch (variableSignature) {
          case 'value':
            return null;
          case 'value.thread.value':
          case 'this.thread.value':
          case 'this.output.value':
            return {
              signature: variableSignature,
                type: 'Integer',
                name: ast.property.name
            };
          case 'value[]':
            if (typeof ast.object.name !== 'string') {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            name = ast.object.name;
            return {
              name,
              origin: 'user',
                signature: variableSignature,
                type: this.getVariableType(ast.object),
                xProperty: ast.property
            };
          case 'value[][]':
            if (typeof ast.object.object.name !== 'string') {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            name = ast.object.object.name;
            return {
              name,
              origin: 'user',
                signature: variableSignature,
                type: this.getVariableType(ast.object.object),
                yProperty: ast.object.property,
                xProperty: ast.property,
            };
          case 'value[][][]':
            if (typeof ast.object.object.object.name !== 'string') {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            name = ast.object.object.object.name;
            return {
              name,
              origin: 'user',
                signature: variableSignature,
                type: this.getVariableType(ast.object.object.object),
                zProperty: ast.object.object.property,
                yProperty: ast.object.property,
                xProperty: ast.property,
            };
          case 'value[][][][]':
            if (typeof ast.object.object.object.object.name !== 'string') {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            name = ast.object.object.object.object.name;
            return {
              name,
              origin: 'user',
                signature: variableSignature,
                type: this.getVariableType(ast.object.object.object.object),
                zProperty: ast.object.object.property,
                yProperty: ast.object.property,
                xProperty: ast.property,
            };
          case 'value.value':
            if (typeof ast.property.name !== 'string') {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            if (this.isAstMathVariable(ast)) {
              name = ast.property.name;
              return {
                name,
                origin: 'Math',
                type: 'Number',
                signature: variableSignature,
              };
            }
            switch (ast.property.name) {
              case 'r':
              case 'g':
              case 'b':
              case 'a':
                name = ast.object.name;
                return {
                  name,
                  property: ast.property.name,
                    origin: 'user',
                    signature: variableSignature,
                    type: 'Number'
                };
              default:
                throw this.astErrorOutput('Unexpected expression', ast);
            }
            case 'this.constants.value':
              if (typeof ast.property.name !== 'string') {
                throw this.astErrorOutput('Unexpected expression', ast);
              }
              name = ast.property.name;
              type = this.getConstantType(name);
              if (!type) {
                throw this.astErrorOutput('Constant has no type', ast);
              }
              return {
                name,
                type,
                origin: 'constants',
                  signature: variableSignature,
              };
            case 'this.constants.value[]':
              if (typeof ast.object.property.name !== 'string') {
                throw this.astErrorOutput('Unexpected expression', ast);
              }
              name = ast.object.property.name;
              type = this.getConstantType(name);
              if (!type) {
                throw this.astErrorOutput('Constant has no type', ast);
              }
              return {
                name,
                type,
                origin: 'constants',
                  signature: variableSignature,
                  xProperty: ast.property,
              };
            case 'this.constants.value[][]': {
              if (typeof ast.object.object.property.name !== 'string') {
                throw this.astErrorOutput('Unexpected expression', ast);
              }
              name = ast.object.object.property.name;
              type = this.getConstantType(name);
              if (!type) {
                throw this.astErrorOutput('Constant has no type', ast);
              }
              return {
                name,
                type,
                origin: 'constants',
                signature: variableSignature,
                yProperty: ast.object.property,
                xProperty: ast.property,
              };
            }
            case 'this.constants.value[][][]': {
              if (typeof ast.object.object.object.property.name !== 'string') {
                throw this.astErrorOutput('Unexpected expression', ast);
              }
              name = ast.object.object.object.property.name;
              type = this.getConstantType(name);
              if (!type) {
                throw this.astErrorOutput('Constant has no type', ast);
              }
              return {
                name,
                type,
                origin: 'constants',
                signature: variableSignature,
                zProperty: ast.object.object.property,
                yProperty: ast.object.property,
                xProperty: ast.property,
              };
            }
            case 'fn()[]':
            case '[][]':
              return {
                signature: variableSignature,
                  property: ast.property,
              };
            case 'value.value[]': 
              if (this.removeIstanbulCoverage) {
                return { signature: variableSignature };
              }
              if (this.onIstanbulCoverageVariable) {
                this.onIstanbulCoverageVariable(ast.object.object.name);
                return {
                  signature: variableSignature
                };
              }
              case 'value.value[][]': 
                if (this.removeIstanbulCoverage) {
                  return { signature: variableSignature };
                }
                if (this.onIstanbulCoverageVariable) {
                  this.onIstanbulCoverageVariable(ast.object.object.object.name);
                  return {
                    signature: variableSignature
                  };
                }
                default:
                  throw this.astErrorOutput('Unexpected expression', ast);
        }
      }

      findIdentifierOrigin(astToFind) {
        const stack = [this.ast];

        while (stack.length > 0) {
          const atNode = stack[0];
          if (atNode.type === 'VariableDeclarator' && atNode.id && atNode.id.name && atNode.id.name === astToFind.name) {
            return atNode;
          }
          stack.shift();
          if (atNode.argument) {
            stack.push(atNode.argument);
          } else if (atNode.body) {
            stack.push(atNode.body);
          } else if (atNode.declarations) {
            stack.push(atNode.declarations);
          } else if (Array.isArray(atNode)) {
            for (let i = 0; i < atNode.length; i++) {
              stack.push(atNode[i]);
            }
          }
        }
        return null;
      }

      findLastReturn(ast) {
        const stack = [ast || this.ast];

        while (stack.length > 0) {
          const atNode = stack.pop();
          if (atNode.type === 'ReturnStatement') {
            return atNode;
          }
          if (atNode.type === 'FunctionDeclaration') {
            continue;
          }
          if (atNode.argument) {
            stack.push(atNode.argument);
          } else if (atNode.body) {
            stack.push(atNode.body);
          } else if (atNode.declarations) {
            stack.push(atNode.declarations);
          } else if (Array.isArray(atNode)) {
            for (let i = 0; i < atNode.length; i++) {
              stack.push(atNode[i]);
            }
          } else if (atNode.consequent) {
            stack.push(atNode.consequent);
          } else if (atNode.cases) {
            stack.push(atNode.cases);
          }
        }
        return null;
      }

      getInternalVariableName(name) {
        if (!this._internalVariableNames.hasOwnProperty(name)) {
          this._internalVariableNames[name] = 0;
        }
        this._internalVariableNames[name]++;
        if (this._internalVariableNames[name] === 1) {
          return name;
        }
        return name + this._internalVariableNames[name];
      }

      astKey(ast, separator = ',') {
        if (!ast.start || !ast.end) throw new Error('AST start and end needed');
        return `${ast.start}${separator}${ast.end}`;
      }
    }

    const typeLookupMap = {
      'Number': 'Number',
      'Float': 'Float',
      'Integer': 'Integer',
      'Array': 'Number',
      'Array(2)': 'Number',
      'Array(3)': 'Number',
      'Array(4)': 'Number',
      'Array2D': 'Number',
      'Array3D': 'Number',
      'Input': 'Number',
      'HTMLCanvas': 'Array(4)',
      'HTMLImage': 'Array(4)',
      'HTMLVideo': 'Array(4)',
      'HTMLImageArray': 'Array(4)',
      'NumberTexture': 'Number',
      'MemoryOptimizedNumberTexture': 'Number',
      'Array1D(2)': 'Array(2)',
      'Array1D(3)': 'Array(3)',
      'Array1D(4)': 'Array(4)',
      'Array2D(2)': 'Array(2)',
      'Array2D(3)': 'Array(3)',
      'Array2D(4)': 'Array(4)',
      'Array3D(2)': 'Array(2)',
      'Array3D(3)': 'Array(3)',
      'Array3D(4)': 'Array(4)',
      'ArrayTexture(1)': 'Number',
      'ArrayTexture(2)': 'Array(2)',
      'ArrayTexture(3)': 'Array(3)',
      'ArrayTexture(4)': 'Array(4)',
    };

    module.exports = {
      FunctionNode
    };
    },{"../utils":114,"./function-tracer":11,"acorn":1}],11:[function(require,module,exports){
    const { utils } = require('../utils');

    function last(array) {
      return array.length > 0 ? array[array.length - 1] : null;
    }

    const states = {
      trackIdentifiers: 'trackIdentifiers',
      memberExpression: 'memberExpression',
      inForLoopInit: 'inForLoopInit'
    };

    class FunctionTracer {
      constructor(ast) {
        this.runningContexts = [];
        this.functionContexts = [];
        this.contexts = [];
        this.functionCalls = [];
        this.declarations = [];
        this.identifiers = [];
        this.functions = [];
        this.returnStatements = [];
        this.trackedIdentifiers = null;
        this.states = [];
        this.newFunctionContext();
        this.scan(ast);
      }

      isState(state) {
        return this.states[this.states.length - 1] === state;
      }

      hasState(state) {
        return this.states.indexOf(state) > -1;
      }

      pushState(state) {
        this.states.push(state);
      }

      popState(state) {
        if (this.isState(state)) {
          this.states.pop();
        } else {
          throw new Error(`Cannot pop the non-active state "${state}"`);
        }
      }

      get currentFunctionContext() {
        return last(this.functionContexts);
      }

      get currentContext() {
        return last(this.runningContexts);
      }

      newFunctionContext() {
        const newContext = { '@contextType': 'function' };
        this.contexts.push(newContext);
        this.functionContexts.push(newContext);
      }

      newContext(run) {
        const newContext = Object.assign({ '@contextType': 'const/let' }, this.currentContext);
        this.contexts.push(newContext);
        this.runningContexts.push(newContext);
        run();
        const { currentFunctionContext } = this;
        for (const p in currentFunctionContext) {
          if (!currentFunctionContext.hasOwnProperty(p) || newContext.hasOwnProperty(p)) continue;
          newContext[p] = currentFunctionContext[p];
        }
        this.runningContexts.pop();
        return newContext;
      }

      useFunctionContext(run) {
        const functionContext = last(this.functionContexts);
        this.runningContexts.push(functionContext);
        run();
        this.runningContexts.pop();
      }

      getIdentifiers(run) {
        const trackedIdentifiers = this.trackedIdentifiers = [];
        this.pushState(states.trackIdentifiers);
        run();
        this.trackedIdentifiers = null;
        this.popState(states.trackIdentifiers);
        return trackedIdentifiers;
      }

      getDeclaration(name) {
        const { currentContext, currentFunctionContext, runningContexts } = this;
        const declaration = currentContext[name] || currentFunctionContext[name] || null;

        if (
          !declaration &&
          currentContext === currentFunctionContext &&
          runningContexts.length > 0
        ) {
          const previousRunningContext = runningContexts[runningContexts.length - 2];
          if (previousRunningContext[name]) {
            return previousRunningContext[name];
          }
        }

        return declaration;
      }

      scan(ast) {
        if (!ast) return;
        if (Array.isArray(ast)) {
          for (let i = 0; i < ast.length; i++) {
            this.scan(ast[i]);
          }
          return;
        }
        switch (ast.type) {
          case 'Program':
            this.useFunctionContext(() => {
              this.scan(ast.body);
            });
            break;
          case 'BlockStatement':
            this.newContext(() => {
              this.scan(ast.body);
            });
            break;
          case 'AssignmentExpression':
          case 'LogicalExpression':
            this.scan(ast.left);
            this.scan(ast.right);
            break;
          case 'BinaryExpression':
            this.scan(ast.left);
            this.scan(ast.right);
            break;
          case 'UpdateExpression':
            if (ast.operator === '++') {
              const declaration = this.getDeclaration(ast.argument.name);
              if (declaration) {
                declaration.suggestedType = 'Integer';
              }
            }
            this.scan(ast.argument);
            break;
          case 'UnaryExpression':
            this.scan(ast.argument);
            break;
          case 'VariableDeclaration':
            if (ast.kind === 'var') {
              this.useFunctionContext(() => {
                ast.declarations = utils.normalizeDeclarations(ast);
                this.scan(ast.declarations);
              });
            } else {
              ast.declarations = utils.normalizeDeclarations(ast);
              this.scan(ast.declarations);
            }
            break;
          case 'VariableDeclarator': {
            const { currentContext } = this;
            const inForLoopInit = this.hasState(states.inForLoopInit);
            const declaration = {
              ast: ast,
              context: currentContext,
              name: ast.id.name,
              origin: 'declaration',
              inForLoopInit,
              inForLoopTest: null,
              assignable: currentContext === this.currentFunctionContext || (!inForLoopInit && !currentContext.hasOwnProperty(ast.id.name)),
              suggestedType: null,
              valueType: null,
              dependencies: null,
              isSafe: null,
            };
            if (!currentContext[ast.id.name]) {
              currentContext[ast.id.name] = declaration;
            }
            this.declarations.push(declaration);
            this.scan(ast.id);
            this.scan(ast.init);
            break;
          }
          case 'FunctionExpression':
          case 'FunctionDeclaration':
            if (this.runningContexts.length === 0) {
              this.scan(ast.body);
            } else {
              this.functions.push(ast);
            }
            break;
          case 'IfStatement':
            this.scan(ast.test);
            this.scan(ast.consequent);
            if (ast.alternate) this.scan(ast.alternate);
            break;
          case 'ForStatement': {
            let testIdentifiers;
            const context = this.newContext(() => {
              this.pushState(states.inForLoopInit);
              this.scan(ast.init);
              this.popState(states.inForLoopInit);

              testIdentifiers = this.getIdentifiers(() => {
                this.scan(ast.test);
              });

              this.scan(ast.update);
              this.newContext(() => {
                this.scan(ast.body);
              });
            });

            if (testIdentifiers) {
              for (const p in context) {
                if (p === '@contextType') continue;
                if (testIdentifiers.indexOf(p) > -1) {
                  context[p].inForLoopTest = true;
                }
              }
            }
            break;
          }
          case 'DoWhileStatement':
          case 'WhileStatement':
            this.newContext(() => {
              this.scan(ast.body);
              this.scan(ast.test);
            });
            break;
          case 'Identifier': {
            if (this.isState(states.trackIdentifiers)) {
              this.trackedIdentifiers.push(ast.name);
            }
            this.identifiers.push({
              context: this.currentContext,
              declaration: this.getDeclaration(ast.name),
              ast,
            });
            break;
          }
          case 'ReturnStatement':
            this.returnStatements.push(ast);
            this.scan(ast.argument);
            break;
          case 'MemberExpression':
            this.pushState(states.memberExpression);
            this.scan(ast.object);
            this.scan(ast.property);
            this.popState(states.memberExpression);
            break;
          case 'ExpressionStatement':
            this.scan(ast.expression);
            break;
          case 'SequenceExpression':
            this.scan(ast.expressions);
            break;
          case 'CallExpression':
            this.functionCalls.push({
              context: this.currentContext,
              ast,
            });
            this.scan(ast.arguments);
            break;
          case 'ArrayExpression':
            this.scan(ast.elements);
            break;
          case 'ConditionalExpression':
            this.scan(ast.test);
            this.scan(ast.alternate);
            this.scan(ast.consequent);
            break;
          case 'SwitchStatement':
            this.scan(ast.discriminant);
            this.scan(ast.cases);
            break;
          case 'SwitchCase':
            this.scan(ast.test);
            this.scan(ast.consequent);
            break;

          case 'ThisExpression':
          case 'Literal':
          case 'DebuggerStatement':
          case 'EmptyStatement':
          case 'BreakStatement':
          case 'ContinueStatement':
            break;
          default:
            throw new Error(`unhandled type "${ast.type}"`);
        }
      }
    }

    module.exports = {
      FunctionTracer,
    };
    },{"../utils":114}],12:[function(require,module,exports){
    const { glWiretap } = require('gl-wiretap');
    const { utils } = require('../../utils');

    function toStringWithoutUtils(fn) {
      return fn.toString()
        .replace('=>', '')
        .replace(/^function /, '')
        .replace(/utils[.]/g, '/*utils.*/');
    }

    function glKernelString(Kernel, args, originKernel, setupContextString, destroyContextString) {
      if (!originKernel.built) {
        originKernel.build.apply(originKernel, args);
      }
      args = args ? Array.from(args).map(arg => {
        switch (typeof arg) {
          case 'boolean':
            return new Boolean(arg);
          case 'number':
            return new Number(arg);
          default:
            return arg;
        }
      }) : null;
      const postResult = [];
      const context = glWiretap(originKernel.context, {
        useTrackablePrimitives: true,
        onReadPixels: (targetName) => {
          if (kernel.subKernels) {
            if (!subKernelsResultVariableSetup) {
              postResult.push(`    const result = { result: ${getRenderString(targetName, kernel)} };`);
              subKernelsResultVariableSetup = true;
            } else {
              const property = kernel.subKernels[subKernelsResultIndex++].property;
              postResult.push(`    result${isNaN(property) ? '.' + property : `[${property}]`} = ${getRenderString(targetName, kernel)};`);
            }
            if (subKernelsResultIndex === kernel.subKernels.length) {
              postResult.push('    return result;');
            }
            return;
          }
          if (targetName) {
            postResult.push(`    return ${getRenderString(targetName, kernel)};`);
          } else {
            postResult.push(`    return null;`);
          }
        },
        onUnrecognizedArgumentLookup: (argument) => {
          const argumentName = findKernelValue(argument, kernel.kernelArguments, [], context);
          if (argumentName) {
            return argumentName;
          }
          const constantName = findKernelValue(argument, kernel.kernelConstants, constants ? Object.keys(constants).map(key => constants[key]) : [], context);
          if (constantName) {
            return constantName;
          }
          return null;
        }
      });
      let subKernelsResultVariableSetup = false;
      let subKernelsResultIndex = 0;
      const {
        source,
        canvas,
        output,
        pipeline,
        graphical,
        loopMaxIterations,
        constants,
        optimizeFloatMemory,
        precision,
        fixIntegerDivisionAccuracy,
        functions,
        nativeFunctions,
        subKernels,
        immutable,
        argumentTypes,
        constantTypes,
        kernelArguments,
        kernelConstants,
        tactic,
      } = originKernel;
      const kernel = new Kernel(source, {
        canvas,
        context,
        checkContext: false,
        output,
        pipeline,
        graphical,
        loopMaxIterations,
        constants,
        optimizeFloatMemory,
        precision,
        fixIntegerDivisionAccuracy,
        functions,
        nativeFunctions,
        subKernels,
        immutable,
        argumentTypes,
        constantTypes,
        tactic,
      });
      let result = [];
      context.setIndent(2);
      kernel.build.apply(kernel, args);
      result.push(context.toString());
      context.reset();

      kernel.kernelArguments.forEach((kernelArgument, i) => {
        switch (kernelArgument.type) {
          case 'Integer':
          case 'Boolean':
          case 'Number':
          case 'Float':
          case 'Array':
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
          case 'HTMLCanvas':
          case 'HTMLImage':
          case 'HTMLVideo':
            context.insertVariable(`uploadValue_${kernelArgument.name}`, kernelArgument.uploadValue);
            break;
          case 'HTMLImageArray':
            for (let imageIndex = 0; imageIndex < args[i].length; imageIndex++) {
              const arg = args[i];
              context.insertVariable(`uploadValue_${kernelArgument.name}[${imageIndex}]`, arg[imageIndex]);
            }
            break;
          case 'Input':
            context.insertVariable(`uploadValue_${kernelArgument.name}`, kernelArgument.uploadValue);
            break;
          case 'MemoryOptimizedNumberTexture':
          case 'NumberTexture':
          case 'Array1D(2)':
          case 'Array1D(3)':
          case 'Array1D(4)':
          case 'Array2D(2)':
          case 'Array2D(3)':
          case 'Array2D(4)':
          case 'Array3D(2)':
          case 'Array3D(3)':
          case 'Array3D(4)':
          case 'ArrayTexture(1)':
          case 'ArrayTexture(2)':
          case 'ArrayTexture(3)':
          case 'ArrayTexture(4)':
            context.insertVariable(`uploadValue_${kernelArgument.name}`, args[i].texture);
            break;
          default:
            throw new Error(`unhandled kernelArgumentType insertion for glWiretap of type ${kernelArgument.type}`);
        }
      });
      result.push('/** start of injected functions **/');
      result.push(`function ${toStringWithoutUtils(utils.flattenTo)}`);
      result.push(`function ${toStringWithoutUtils(utils.flatten2dArrayTo)}`);
      result.push(`function ${toStringWithoutUtils(utils.flatten3dArrayTo)}`);
      result.push(`function ${toStringWithoutUtils(utils.flatten4dArrayTo)}`);
      result.push(`function ${toStringWithoutUtils(utils.isArray)}`);
      if (kernel.renderOutput !== kernel.renderTexture && kernel.formatValues) {
        result.push(
          `  const renderOutput = function ${toStringWithoutUtils(kernel.formatValues)};`
        );
      }
      result.push('/** end of injected functions **/');
      result.push(`  const innerKernel = function (${kernel.kernelArguments.map(kernelArgument => kernelArgument.varName).join(', ')}) {`);
      context.setIndent(4);
      kernel.run.apply(kernel, args);
      if (kernel.renderKernels) {
        kernel.renderKernels();
      } else if (kernel.renderOutput) {
        kernel.renderOutput();
      }
      result.push('    /** start setup uploads for kernel values **/');
      kernel.kernelArguments.forEach(kernelArgument => {
        result.push('    ' + kernelArgument.getStringValueHandler().split('\n').join('\n    '));
      });
      result.push('    /** end setup uploads for kernel values **/');
      result.push(context.toString());
      if (kernel.renderOutput === kernel.renderTexture) {
        context.reset();
        if (kernel.renderKernels) {
          const results = kernel.renderKernels();
          const textureName = context.getContextVariableName(kernel.texture.texture);
          result.push(`    return {
      result: {
        texture: ${ textureName },
        type: '${ results.result.type }',
        toArray: ${ getToArrayString(results.result, textureName) }
      },`);
          const { subKernels, mappedTextures } = kernel;
          for (let i = 0; i < subKernels.length; i++) {
            const texture = mappedTextures[i];
            const subKernel = subKernels[i];
            const subKernelResult = results[subKernel.property];
            const subKernelTextureName = context.getContextVariableName(texture.texture);
            result.push(`
      ${subKernel.property}: {
        texture: ${ subKernelTextureName },
        type: '${ subKernelResult.type }',
        toArray: ${ getToArrayString(subKernelResult, subKernelTextureName) }
      },`);
          }
          result.push(`    };`);
        } else {
          const rendered = kernel.renderOutput();
          const textureName = context.getContextVariableName(kernel.texture.texture);
          result.push(`    return {
        texture: ${ textureName },
        type: '${ rendered.type }',
        toArray: ${ getToArrayString(rendered, textureName) }
      };`);
        }
      }
      result.push(`    ${destroyContextString ? '\n' + destroyContextString + '    ': ''}`);
      result.push(postResult.join('\n'));
      result.push('  };');
      if (kernel.graphical) {
        result.push(getGetPixelsString(kernel));
        result.push(`  innerKernel.getPixels = getPixels;`);
      }
      result.push('  return innerKernel;');

      let constantsUpload = [];
      kernelConstants.forEach((kernelConstant) => {
        constantsUpload.push(`${  kernelConstant.getStringValueHandler()}`);
      });
      return `function kernel(settings) {
  const { context, constants } = settings;
  ${constantsUpload.join('')}
  ${setupContextString ? setupContextString : ''}
${result.join('\n')}
}`;
    }

    function getRenderString(targetName, kernel) {
      const readBackValue = kernel.precision === 'single' ? targetName : `new Float32Array(${targetName}.buffer)`;
      if (kernel.output[2]) {
        return `renderOutput(${readBackValue}, ${kernel.output[0]}, ${kernel.output[1]}, ${kernel.output[2]})`;
      }
      if (kernel.output[1]) {
        return `renderOutput(${readBackValue}, ${kernel.output[0]}, ${kernel.output[1]})`;
      }

      return `renderOutput(${readBackValue}, ${kernel.output[0]})`;
    }

    function getGetPixelsString(kernel) {
      const getPixels = kernel.getPixels.toString();
      const useFunctionKeyword = !/^function/.test(getPixels);
      return utils.flattenFunctionToString(`${useFunctionKeyword ? 'function ' : ''}${ getPixels }`, {
        findDependency: (object, name) => {
          if (object === 'utils') {
            return `const ${name} = ${utils[name].toString()};`;
          }
          return null;
        },
        thisLookup: (property) => {
          if (property === 'context') {
            return null;
          }
          if (kernel.hasOwnProperty(property)) {
            return JSON.stringify(kernel[property]);
          }
          throw new Error(`unhandled thisLookup ${ property }`);
        }
      });
    }

    function getToArrayString(kernelResult, textureName) {
      const toArray = kernelResult.toArray.toString();
      const useFunctionKeyword = !/^function/.test(toArray);
      const flattenedFunctions = utils.flattenFunctionToString(`${useFunctionKeyword ? 'function ' : ''}${ toArray }`, {
        findDependency: (object, name) => {
          if (object === 'utils') {
            return `const ${name} = ${utils[name].toString()};`;
          } else if (object === 'this') {
            return `${useFunctionKeyword ? 'function ' : ''}${kernelResult[name].toString()}`;
          } else {
            throw new Error('unhandled fromObject');
          }
        },
        thisLookup: (property, isDeclaration) => {
          if (property === 'texture') {
            return textureName;
          }
          if (property === 'context') {
            if (isDeclaration) return null;
            return 'gl';
          }
          if (property === '_framebuffer') {
            return '_framebuffer';
          }
          if (kernelResult.hasOwnProperty(property)) {
            return JSON.stringify(kernelResult[property]);
          }
          throw new Error(`unhandled thisLookup ${ property }`);
        }
      });
      return `() => {
  let _framebuffer;
  ${flattenedFunctions}
  return toArray();
  }`;
    }

    function findKernelValue(argument, kernelValues, values, context, uploadedValues) {
      if (argument === null) return null;
      if (kernelValues === null) return null;
      switch (typeof argument) {
        case 'boolean':
        case 'number':
          return null;
      }
      if (
        typeof HTMLImageElement !== 'undefined' &&
        argument instanceof HTMLImageElement
      ) {
        for (let i = 0; i < kernelValues.length; i++) {
          const kernelValue = kernelValues[i];
          if (kernelValue.type !== 'HTMLImageArray' && kernelValue) continue;
          if (kernelValue.uploadValue !== argument) continue;
          const variableIndex = values[i].indexOf(argument);
          if (variableIndex === -1) continue;
          const variableName = `uploadValue_${kernelValue.name}[${variableIndex}]`;
          context.insertVariable(variableName, argument);
          return variableName;
        }
      }

      for (let i = 0; i < kernelValues.length; i++) {
        const kernelValue = kernelValues[i];
        if (argument !== kernelValue.uploadValue) continue;
        const variable = `uploadValue_${kernelValue.name}`;
        context.insertVariable(variable, kernelValue);
        return variable;
      }
      return null;
    }

    module.exports = {
      glKernelString
    };
    },{"../../utils":114,"gl-wiretap":3}],13:[function(require,module,exports){
    const { Kernel } = require('../kernel');
    const { utils } = require('../../utils');
    const { GLTextureArray2Float } = require('./texture/array-2-float');
    const { GLTextureArray2Float2D } = require('./texture/array-2-float-2d');
    const { GLTextureArray2Float3D } = require('./texture/array-2-float-3d');
    const { GLTextureArray3Float } = require('./texture/array-3-float');
    const { GLTextureArray3Float2D } = require('./texture/array-3-float-2d');
    const { GLTextureArray3Float3D } = require('./texture/array-3-float-3d');
    const { GLTextureArray4Float } = require('./texture/array-4-float');
    const { GLTextureArray4Float2D } = require('./texture/array-4-float-2d');
    const { GLTextureArray4Float3D } = require('./texture/array-4-float-3d');
    const { GLTextureFloat } = require('./texture/float');
    const { GLTextureFloat2D } = require('./texture/float-2d');
    const { GLTextureFloat3D } = require('./texture/float-3d');
    const { GLTextureMemoryOptimized } = require('./texture/memory-optimized');
    const { GLTextureMemoryOptimized2D } = require('./texture/memory-optimized-2d');
    const { GLTextureMemoryOptimized3D } = require('./texture/memory-optimized-3d');
    const { GLTextureUnsigned } = require('./texture/unsigned');
    const { GLTextureUnsigned2D } = require('./texture/unsigned-2d');
    const { GLTextureUnsigned3D } = require('./texture/unsigned-3d');
    const { GLTextureGraphical } = require('./texture/graphical');

    class GLKernel extends Kernel {
      static get mode() {
        return 'gpu';
      }

      static getIsFloatRead() {
        const kernelString = `function kernelFunction() {
      return 1;
    }`;
        const kernel = new this(kernelString, {
          context: this.testContext,
          canvas: this.testCanvas,
          validate: false,
          output: [1],
          precision: 'single',
          returnType: 'Number',
          tactic: 'speed',
        });
        kernel.build();
        kernel.run();
        const result = kernel.renderOutput();
        kernel.destroy(true);
        return result[0] === 1;
      }

      static getIsIntegerDivisionAccurate() {
        function kernelFunction(v1, v2) {
          return v1[this.thread.x] / v2[this.thread.x];
        }
        const kernel = new this(kernelFunction.toString(), {
          context: this.testContext,
          canvas: this.testCanvas,
          validate: false,
          output: [2],
          returnType: 'Number',
          precision: 'unsigned',
          tactic: 'speed',
        });
        const args = [
          [6, 6030401],
          [3, 3991]
        ];
        kernel.build.apply(kernel, args);
        kernel.run.apply(kernel, args);
        const result = kernel.renderOutput();
        kernel.destroy(true);
        return result[0] === 2 && result[1] === 1511;
      }

      static getIsSpeedTacticSupported() {
        function kernelFunction(value) {
          return value[this.thread.x];
        }
        const kernel = new this(kernelFunction.toString(), {
          context: this.testContext,
          canvas: this.testCanvas,
          validate: false,
          output: [4],
          returnType: 'Number',
          precision: 'unsigned',
          tactic: 'speed',
        });
        const args = [
          [0, 1, 2, 3]
        ];
        kernel.build.apply(kernel, args);
        kernel.run.apply(kernel, args);
        const result = kernel.renderOutput();
        kernel.destroy(true);
        return Math.round(result[0]) === 0 && Math.round(result[1]) === 1 && Math.round(result[2]) === 2 && Math.round(result[3]) === 3;
      }

      static get testCanvas() {
        throw new Error(`"testCanvas" not defined on ${ this.name }`);
      }

      static get testContext() {
        throw new Error(`"testContext" not defined on ${ this.name }`);
      }

      static getFeatures() {
        const gl = this.testContext;
        const isDrawBuffers = this.getIsDrawBuffers();
        return Object.freeze({
          isFloatRead: this.getIsFloatRead(),
          isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
          isSpeedTacticSupported: this.getIsSpeedTacticSupported(),
          isTextureFloat: this.getIsTextureFloat(),
          isDrawBuffers,
          kernelMap: isDrawBuffers,
          channelCount: this.getChannelCount(),
          maxTextureSize: this.getMaxTextureSize(),
          lowIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT),
          lowFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
          mediumIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
          mediumFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
          highIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
          highFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
        });
      }

      static setupFeatureChecks() {
        throw new Error(`"setupFeatureChecks" not defined on ${ this.name }`);
      }

      static getSignature(kernel, argumentTypes) {
        return kernel.getVariablePrecisionString() + (argumentTypes.length > 0 ? ':' + argumentTypes.join(',') : '');
      }

      setFixIntegerDivisionAccuracy(fix) {
        this.fixIntegerDivisionAccuracy = fix;
        return this;
      }

      setPrecision(flag) {
        this.precision = flag;
        return this;
      }

      setFloatTextures(flag) {
        utils.warnDeprecated('method', 'setFloatTextures', 'setOptimizeFloatMemory');
        this.floatTextures = flag;
        return this;
      }

      static nativeFunctionArguments(source) {
        const argumentTypes = [];
        const argumentNames = [];
        const states = [];
        const isStartingVariableName = /^[a-zA-Z_]/;
        const isVariableChar = /[a-zA-Z_0-9]/;
        let i = 0;
        let argumentName = null;
        let argumentType = null;
        while (i < source.length) {
          const char = source[i];
          const nextChar = source[i + 1];
          const state = states.length > 0 ? states[states.length - 1] : null;

          if (state === 'FUNCTION_ARGUMENTS' && char === '/' && nextChar === '*') {
            states.push('MULTI_LINE_COMMENT');
            i += 2;
            continue;
          } else if (state === 'MULTI_LINE_COMMENT' && char === '*' && nextChar === '/') {
            states.pop();
            i += 2;
            continue;
          }

          else if (state === 'FUNCTION_ARGUMENTS' && char === '/' && nextChar === '/') {
            states.push('COMMENT');
            i += 2;
            continue;
          } else if (state === 'COMMENT' && char === '\n') {
            states.pop();
            i++;
            continue;
          }

          else if (state === null && char === '(') {
            states.push('FUNCTION_ARGUMENTS');
            i++;
            continue;
          } else if (state === 'FUNCTION_ARGUMENTS') {
            if (char === ')') {
              states.pop();
              break;
            }
            if (char === 'f' && nextChar === 'l' && source[i + 2] === 'o' && source[i + 3] === 'a' && source[i + 4] === 't' && source[i + 5] === ' ') {
              states.push('DECLARE_VARIABLE');
              argumentType = 'float';
              argumentName = '';
              i += 6;
              continue;
            } else if (char === 'i' && nextChar === 'n' && source[i + 2] === 't' && source[i + 3] === ' ') {
              states.push('DECLARE_VARIABLE');
              argumentType = 'int';
              argumentName = '';
              i += 4;
              continue;
            } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '2' && source[i + 4] === ' ') {
              states.push('DECLARE_VARIABLE');
              argumentType = 'vec2';
              argumentName = '';
              i += 5;
              continue;
            } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '3' && source[i + 4] === ' ') {
              states.push('DECLARE_VARIABLE');
              argumentType = 'vec3';
              argumentName = '';
              i += 5;
              continue;
            } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '4' && source[i + 4] === ' ') {
              states.push('DECLARE_VARIABLE');
              argumentType = 'vec4';
              argumentName = '';
              i += 5;
              continue;
            }
          }

          else if (state === 'DECLARE_VARIABLE') {
            if (argumentName === '') {
              if (char === ' ') {
                i++;
                continue;
              }
              if (!isStartingVariableName.test(char)) {
                throw new Error('variable name is not expected string');
              }
            }
            argumentName += char;
            if (!isVariableChar.test(nextChar)) {
              states.pop();
              argumentNames.push(argumentName);
              argumentTypes.push(typeMap[argumentType]);
            }
          }

          i++;
        }
        if (states.length > 0) {
          throw new Error('GLSL function was not parsable');
        }
        return {
          argumentNames,
          argumentTypes,
        };
      }

      static nativeFunctionReturnType(source) {
        return typeMap[source.match(/int|float|vec[2-4]/)[0]];
      }

      static combineKernels(combinedKernel, lastKernel) {
        combinedKernel.apply(null, arguments);
        const {
          texSize,
          context,
          threadDim
        } = lastKernel.texSize;
        let result;
        if (lastKernel.precision === 'single') {
          const w = texSize[0];
          const h = Math.ceil(texSize[1] / 4);
          result = new Float32Array(w * h * 4 * 4);
          context.readPixels(0, 0, w, h * 4, context.RGBA, context.FLOAT, result);
        } else {
          const bytes = new Uint8Array(texSize[0] * texSize[1] * 4);
          context.readPixels(0, 0, texSize[0], texSize[1], context.RGBA, context.UNSIGNED_BYTE, bytes);
          result = new Float32Array(bytes.buffer);
        }

        result = result.subarray(0, threadDim[0] * threadDim[1] * threadDim[2]);

        if (lastKernel.output.length === 1) {
          return result;
        } else if (lastKernel.output.length === 2) {
          return utils.splitArray(result, lastKernel.output[0]);
        } else if (lastKernel.output.length === 3) {
          const cube = utils.splitArray(result, lastKernel.output[0] * lastKernel.output[1]);
          return cube.map(function(x) {
            return utils.splitArray(x, lastKernel.output[0]);
          });
        }
      }

      constructor(source, settings) {
        super(source, settings);
        this.transferValues = null;
        this.formatValues = null;
        this.TextureConstructor = null;
        this.renderOutput = null;
        this.renderRawOutput = null;
        this.texSize = null;
        this.translatedSource = null;
        this.compiledFragmentShader = null;
        this.compiledVertexShader = null;
        this.switchingKernels = null;
        this._textureSwitched = null;
        this._mappedTextureSwitched = null;
      }

      checkTextureSize() {
        const { features } = this.constructor;
        if (this.texSize[0] > features.maxTextureSize || this.texSize[1] > features.maxTextureSize) {
          throw new Error(`Texture size [${this.texSize[0]},${this.texSize[1]}] generated by kernel is larger than supported size [${features.maxTextureSize},${features.maxTextureSize}]`);
        }
      }

      translateSource() {
        throw new Error(`"translateSource" not defined on ${this.constructor.name}`);
      }

      pickRenderStrategy(args) {
        if (this.graphical) {
          this.renderRawOutput = this.readPackedPixelsToUint8Array;
          this.transferValues = (pixels) => pixels;
          this.TextureConstructor = GLTextureGraphical;
          return null;
        }
        if (this.precision === 'unsigned') {
          this.renderRawOutput = this.readPackedPixelsToUint8Array;
          this.transferValues = this.readPackedPixelsToFloat32Array;
          if (this.pipeline) {
            this.renderOutput = this.renderTexture;
            if (this.subKernels !== null) {
              this.renderKernels = this.renderKernelsToTextures;
            }
            switch (this.returnType) {
              case 'LiteralInteger':
              case 'Float':
              case 'Number':
              case 'Integer':
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureUnsigned3D;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureUnsigned2D;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureUnsigned;
                  return null;
                }
                case 'Array(2)':
                case 'Array(3)':
                case 'Array(4)':
                  return this.requestFallback(args);
            }
          } else {
            if (this.subKernels !== null) {
              this.renderKernels = this.renderKernelsToArrays;
            }
            switch (this.returnType) {
              case 'LiteralInteger':
              case 'Float':
              case 'Number':
              case 'Integer':
                this.renderOutput = this.renderValues;
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureUnsigned3D;
                  this.formatValues = utils.erect3DPackedFloat;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureUnsigned2D;
                  this.formatValues = utils.erect2DPackedFloat;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureUnsigned;
                  this.formatValues = utils.erectPackedFloat;
                  return null;
                }
                case 'Array(2)':
                case 'Array(3)':
                case 'Array(4)':
                  return this.requestFallback(args);
            }
          }
        } else if (this.precision === 'single') {
          this.renderRawOutput = this.readFloatPixelsToFloat32Array;
          this.transferValues = this.readFloatPixelsToFloat32Array;
          if (this.pipeline) {
            this.renderOutput = this.renderTexture;
            if (this.subKernels !== null) {
              this.renderKernels = this.renderKernelsToTextures;
            }
            switch (this.returnType) {
              case 'LiteralInteger':
              case 'Float':
              case 'Number':
              case 'Integer': {
                if (this.optimizeFloatMemory) {
                  if (this.output[2] > 0) {
                    this.TextureConstructor = GLTextureMemoryOptimized3D;
                    return null;
                  } else if (this.output[1] > 0) {
                    this.TextureConstructor = GLTextureMemoryOptimized2D;
                    return null;
                  } else {
                    this.TextureConstructor = GLTextureMemoryOptimized;
                    return null;
                  }
                } else {
                  if (this.output[2] > 0) {
                    this.TextureConstructor = GLTextureFloat3D;
                    return null;
                  } else if (this.output[1] > 0) {
                    this.TextureConstructor = GLTextureFloat2D;
                    return null;
                  } else {
                    this.TextureConstructor = GLTextureFloat;
                    return null;
                  }
                }
              }
              case 'Array(2)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray2Float3D;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray2Float2D;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray2Float;
                  return null;
                }
              }
              case 'Array(3)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  return null;
                }
              }
              case 'Array(4)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray4Float3D;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray4Float2D;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray4Float;
                  return null;
                }
              }
            }
          }
          this.renderOutput = this.renderValues;
          if (this.subKernels !== null) {
            this.renderKernels = this.renderKernelsToArrays;
          }
          if (this.optimizeFloatMemory) {
            switch (this.returnType) {
              case 'LiteralInteger':
              case 'Float':
              case 'Number':
              case 'Integer': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureMemoryOptimized3D;
                  this.formatValues = utils.erectMemoryOptimized3DFloat;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureMemoryOptimized2D;
                  this.formatValues = utils.erectMemoryOptimized2DFloat;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureMemoryOptimized;
                  this.formatValues = utils.erectMemoryOptimizedFloat;
                  return null;
                }
              }
              case 'Array(2)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray2Float3D;
                  this.formatValues = utils.erect3DArray2;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray2Float2D;
                  this.formatValues = utils.erect2DArray2;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray2Float;
                  this.formatValues = utils.erectArray2;
                  return null;
                }
              }
              case 'Array(3)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  this.formatValues = utils.erect3DArray3;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  this.formatValues = utils.erect2DArray3;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  this.formatValues = utils.erectArray3;
                  return null;
                }
              }
              case 'Array(4)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray4Float3D;
                  this.formatValues = utils.erect3DArray4;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray4Float2D;
                  this.formatValues = utils.erect2DArray4;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray4Float;
                  this.formatValues = utils.erectArray4;
                  return null;
                }
              }
            }
          } else {
            switch (this.returnType) {
              case 'LiteralInteger':
              case 'Float':
              case 'Number':
              case 'Integer': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureFloat3D;
                  this.formatValues = utils.erect3DFloat;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureFloat2D;
                  this.formatValues = utils.erect2DFloat;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureFloat;
                  this.formatValues = utils.erectFloat;
                  return null;
                }
              }
              case 'Array(2)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray2Float3D;
                  this.formatValues = utils.erect3DArray2;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray2Float2D;
                  this.formatValues = utils.erect2DArray2;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray2Float;
                  this.formatValues = utils.erectArray2;
                  return null;
                }
              }
              case 'Array(3)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  this.formatValues = utils.erect3DArray3;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  this.formatValues = utils.erect2DArray3;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  this.formatValues = utils.erectArray3;
                  return null;
                }
              }
              case 'Array(4)': {
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray4Float3D;
                  this.formatValues = utils.erect3DArray4;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray4Float2D;
                  this.formatValues = utils.erect2DArray4;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray4Float;
                  this.formatValues = utils.erectArray4;
                  return null;
                }
              }
            }
          }
        } else {
          throw new Error(`unhandled precision of "${this.precision}"`);
        }

        throw new Error(`unhandled return type "${this.returnType}"`);
      }

      getKernelString() {
        throw new Error(`abstract method call`);
      }

      getMainResultTexture() {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Integer':
          case 'Number':
            return this.getMainResultNumberTexture();
          case 'Array(2)':
            return this.getMainResultArray2Texture();
          case 'Array(3)':
            return this.getMainResultArray3Texture();
          case 'Array(4)':
            return this.getMainResultArray4Texture();
          default:
            throw new Error(`unhandled returnType type ${ this.returnType }`);
        }
      }

      getMainResultKernelNumberTexture() {
        throw new Error(`abstract method call`);
      }
      getMainResultSubKernelNumberTexture() {
        throw new Error(`abstract method call`);
      }
      getMainResultKernelArray2Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultSubKernelArray2Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultKernelArray3Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultSubKernelArray3Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultKernelArray4Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultSubKernelArray4Texture() {
        throw new Error(`abstract method call`);
      }
      getMainResultGraphical() {
        throw new Error(`abstract method call`);
      }
      getMainResultMemoryOptimizedFloats() {
        throw new Error(`abstract method call`);
      }
      getMainResultPackedPixels() {
        throw new Error(`abstract method call`);
      }

      getMainResultString() {
        if (this.graphical) {
          return this.getMainResultGraphical();
        } else if (this.precision === 'single') {
          if (this.optimizeFloatMemory) {
            return this.getMainResultMemoryOptimizedFloats();
          }
          return this.getMainResultTexture();
        } else {
          return this.getMainResultPackedPixels();
        }
      }

      getMainResultNumberTexture() {
        return utils.linesToString(this.getMainResultKernelNumberTexture()) +
          utils.linesToString(this.getMainResultSubKernelNumberTexture());
      }

      getMainResultArray2Texture() {
        return utils.linesToString(this.getMainResultKernelArray2Texture()) +
          utils.linesToString(this.getMainResultSubKernelArray2Texture());
      }

      getMainResultArray3Texture() {
        return utils.linesToString(this.getMainResultKernelArray3Texture()) +
          utils.linesToString(this.getMainResultSubKernelArray3Texture());
      }

      getMainResultArray4Texture() {
        return utils.linesToString(this.getMainResultKernelArray4Texture()) +
          utils.linesToString(this.getMainResultSubKernelArray4Texture());
      }

      getFloatTacticDeclaration() {
        const variablePrecision = this.getVariablePrecisionString(this.texSize, this.tactic);
        return `precision ${variablePrecision} float;\n`;
      }

      getIntTacticDeclaration() {
        return `precision ${this.getVariablePrecisionString(this.texSize, this.tactic, true)} int;\n`;
      }

      getSampler2DTacticDeclaration() {
        return `precision ${this.getVariablePrecisionString(this.texSize, this.tactic)} sampler2D;\n`;
      }

      getSampler2DArrayTacticDeclaration() {
        return `precision ${this.getVariablePrecisionString(this.texSize, this.tactic)} sampler2DArray;\n`;
      }

      renderTexture() {
        return this.immutable ? this.texture.clone() : this.texture;
      }
      readPackedPixelsToUint8Array() {
        if (this.precision !== 'unsigned') throw new Error('Requires this.precision to be "unsigned"');
        const {
          texSize,
          context: gl
        } = this;
        const result = new Uint8Array(texSize[0] * texSize[1] * 4);
        gl.readPixels(0, 0, texSize[0], texSize[1], gl.RGBA, gl.UNSIGNED_BYTE, result);
        return result;
      }

      readPackedPixelsToFloat32Array() {
        return new Float32Array(this.readPackedPixelsToUint8Array().buffer);
      }

      readFloatPixelsToFloat32Array() {
        if (this.precision !== 'single') throw new Error('Requires this.precision to be "single"');
        const {
          texSize,
          context: gl
        } = this;
        const w = texSize[0];
        const h = texSize[1];
        const result = new Float32Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, result);
        return result;
      }

      getPixels(flip) {
        const {
          context: gl,
          output
        } = this;
        const [width, height] = output;
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return new Uint8ClampedArray((flip ? pixels : utils.flipPixels(pixels, width, height)).buffer);
      }

      renderKernelsToArrays() {
        const result = {
          result: this.renderOutput(),
        };
        for (let i = 0; i < this.subKernels.length; i++) {
          result[this.subKernels[i].property] = this.mappedTextures[i].toArray();
        }
        return result;
      }

      renderKernelsToTextures() {
        const result = {
          result: this.renderOutput(),
        };
        if (this.immutable) {
          for (let i = 0; i < this.subKernels.length; i++) {
            result[this.subKernels[i].property] = this.mappedTextures[i].clone();
          }
        } else {
          for (let i = 0; i < this.subKernels.length; i++) {
            result[this.subKernels[i].property] = this.mappedTextures[i];
          }
        }
        return result;
      }

      resetSwitchingKernels() {
        const existingValue = this.switchingKernels;
        this.switchingKernels = null;
        return existingValue;
      }

      setOutput(output) {
        const newOutput = this.toKernelOutput(output);
        if (this.program) {
          if (!this.dynamicOutput) {
            throw new Error('Resizing a kernel with dynamicOutput: false is not possible');
          }
          const newThreadDim = [newOutput[0], newOutput[1] || 1, newOutput[2] || 1];
          const newTexSize = utils.getKernelTextureSize({
            optimizeFloatMemory: this.optimizeFloatMemory,
            precision: this.precision,
          }, newThreadDim);
          const oldTexSize = this.texSize;
          if (oldTexSize) {
            const oldPrecision = this.getVariablePrecisionString(oldTexSize, this.tactic);
            const newPrecision = this.getVariablePrecisionString(newTexSize, this.tactic);
            if (oldPrecision !== newPrecision) {
              if (this.debug) {
                console.warn('Precision requirement changed, asking GPU instance to recompile');
              }
              this.switchKernels({
                type: 'outputPrecisionMismatch',
                precision: newPrecision,
                needed: output
              });
              return;
            }
          }
          this.output = newOutput;
          this.threadDim = newThreadDim;
          this.texSize = newTexSize;
          const { context: gl } = this;
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
          this.updateMaxTexSize();
          this.framebuffer.width = this.texSize[0];
          this.framebuffer.height = this.texSize[1];
          gl.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
          this.canvas.width = this.maxTexSize[0];
          this.canvas.height = this.maxTexSize[1];
          if (this.texture) {
            this.texture.delete();
          }
          this.texture = null;
          this._setupOutputTexture();
          if (this.mappedTextures && this.mappedTextures.length > 0) {
            for (let i = 0; i < this.mappedTextures.length; i++) {
              this.mappedTextures[i].delete();
            }
            this.mappedTextures = null;
            this._setupSubOutputTextures();
          }
        } else {
          this.output = newOutput;
        }
        return this;
      }
      renderValues() {
        return this.formatValues(
          this.transferValues(),
          this.output[0],
          this.output[1],
          this.output[2]
        );
      }
      switchKernels(reason) {
        if (this.switchingKernels) {
          this.switchingKernels.push(reason);
        } else {
          this.switchingKernels = [reason];
        }
      }
      getVariablePrecisionString(textureSize = this.texSize, tactic = this.tactic, isInt = false) {
        if (!tactic) {
          if (!this.constructor.features.isSpeedTacticSupported) return 'highp';
          const low = this.constructor.features[isInt ? 'lowIntPrecision' : 'lowFloatPrecision'];
          const medium = this.constructor.features[isInt ? 'mediumIntPrecision' : 'mediumFloatPrecision'];
          const high = this.constructor.features[isInt ? 'highIntPrecision' : 'highFloatPrecision'];
          const requiredSize = Math.log2(textureSize[0] * textureSize[1]);
          if (requiredSize <= low.rangeMax) {
            return 'lowp';
          } else if (requiredSize <= medium.rangeMax) {
            return 'mediump';
          } else if (requiredSize <= high.rangeMax) {
            return 'highp';
          } else {
            throw new Error(`The required size exceeds that of the ability of your system`);
          }
        }
        switch (tactic) {
          case 'speed':
            return 'lowp';
          case 'balanced':
            return 'mediump';
          case 'precision':
            return 'highp';
          default:
            throw new Error(`Unknown tactic "${tactic}" use "speed", "balanced", "precision", or empty for auto`);
        }
      }

      updateTextureArgumentRefs(kernelValue, arg) {
        if (!this.immutable) return;
        if (this.texture.texture === arg.texture) {
          const { prevArg } = kernelValue;
          if (prevArg) {
            if (prevArg.texture._refs === 1) {
              this.texture.delete();
              this.texture = prevArg.clone();
              this._textureSwitched = true;
            }
            prevArg.delete();
          }
          kernelValue.prevArg = arg.clone();
        } else if (this.mappedTextures && this.mappedTextures.length > 0) {
          const { mappedTextures } = this;
          for (let i = 0; i < mappedTextures.length; i++) {
            const mappedTexture = mappedTextures[i];
            if (mappedTexture.texture === arg.texture) {
              const { prevArg } = kernelValue;
              if (prevArg) {
                if (prevArg.texture._refs === 1) {
                  mappedTexture.delete();
                  mappedTextures[i] = prevArg.clone();
                  this._mappedTextureSwitched[i] = true;
                }
                prevArg.delete();
              }
              kernelValue.prevArg = arg.clone();
              return;
            }
          }
        }
      }

      onActivate(previousKernel) {
        this._textureSwitched = true;
        this.texture = previousKernel.texture;
        if (this.mappedTextures) {
          for (let i = 0; i < this.mappedTextures.length; i++) {
            this._mappedTextureSwitched[i] = true;
          }
          this.mappedTextures = previousKernel.mappedTextures;
        }
      }

      initCanvas() {}
    }

    const typeMap = {
      int: 'Integer',
      float: 'Number',
      vec2: 'Array(2)',
      vec3: 'Array(3)',
      vec4: 'Array(4)',
    };

    module.exports = {
      GLKernel
    };
    },{"../../utils":114,"../kernel":36,"./texture/array-2-float":16,"./texture/array-2-float-2d":14,"./texture/array-2-float-3d":15,"./texture/array-3-float":19,"./texture/array-3-float-2d":17,"./texture/array-3-float-3d":18,"./texture/array-4-float":22,"./texture/array-4-float-2d":20,"./texture/array-4-float-3d":21,"./texture/float":25,"./texture/float-2d":23,"./texture/float-3d":24,"./texture/graphical":26,"./texture/memory-optimized":30,"./texture/memory-optimized-2d":28,"./texture/memory-optimized-3d":29,"./texture/unsigned":33,"./texture/unsigned-2d":31,"./texture/unsigned-3d":32}],14:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray2Float2D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(2)';
      }
      toArray() {
        return utils.erect2DArray2(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureArray2Float2D
    };
    },{"../../../utils":114,"./float":25}],15:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray2Float3D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(2)';
      }
      toArray() {
        return utils.erect3DArray2(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureArray2Float3D
    };
    },{"../../../utils":114,"./float":25}],16:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray2Float extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(2)';
      }
      toArray() {
        return utils.erectArray2(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureArray2Float
    };
    },{"../../../utils":114,"./float":25}],17:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray3Float2D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(3)';
      }
      toArray() {
        return utils.erect2DArray3(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureArray3Float2D
    };
    },{"../../../utils":114,"./float":25}],18:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray3Float3D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(3)';
      }
      toArray() {
        return utils.erect3DArray3(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureArray3Float3D
    };
    },{"../../../utils":114,"./float":25}],19:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray3Float extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(3)';
      }
      toArray() {
        return utils.erectArray3(this.renderValues(), this.output[0]);
      }
    }

    module.exports = {
      GLTextureArray3Float
    };
    },{"../../../utils":114,"./float":25}],20:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray4Float2D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(4)';
      }
      toArray() {
        return utils.erect2DArray4(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureArray4Float2D
    };
    },{"../../../utils":114,"./float":25}],21:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray4Float3D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(4)';
      }
      toArray() {
        return utils.erect3DArray4(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureArray4Float3D
    };
    },{"../../../utils":114,"./float":25}],22:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureArray4Float extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(4)';
      }
      toArray() {
        return utils.erectArray4(this.renderValues(), this.output[0]);
      }
    }

    module.exports = {
      GLTextureArray4Float
    };
    },{"../../../utils":114,"./float":25}],23:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureFloat2D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(1)';
      }
      toArray() {
        return utils.erect2DFloat(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureFloat2D
    };
    },{"../../../utils":114,"./float":25}],24:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureFloat3D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(1)';
      }
      toArray() {
        return utils.erect3DFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureFloat3D
    };
    },{"../../../utils":114,"./float":25}],25:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTexture } = require('./index');

    class GLTextureFloat extends GLTexture {
      get textureType() {
        return this.context.FLOAT;
      }
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(1)';
      }
      renderRawOutput() {
        const gl = this.context;
        const size = this.size;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer());
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          this.texture,
          0
        );
        const result = new Float32Array(size[0] * size[1] * 4);
        gl.readPixels(0, 0, size[0], size[1], gl.RGBA, gl.FLOAT, result);
        return result;
      }
      renderValues() {
        if (this._deleted) return null;
        return this.renderRawOutput();
      }
      toArray() {
        return utils.erectFloat(this.renderValues(), this.output[0]);
      }
    }

    module.exports = {
      GLTextureFloat
    };
    },{"../../../utils":114,"./index":27}],26:[function(require,module,exports){
    const { GLTextureUnsigned } = require('./unsigned');

    class GLTextureGraphical extends GLTextureUnsigned {
      constructor(settings) {
        super(settings);
        this.type = 'ArrayTexture(4)';
      }
      toArray() {
        return this.renderValues();
      }
    }

    module.exports = {
      GLTextureGraphical
    };
    },{"./unsigned":33}],27:[function(require,module,exports){
    const { Texture } = require('../../../texture');

    class GLTexture extends Texture {
      get textureType() {
        throw new Error(`"textureType" not implemented on ${ this.name }`);
      }

      clone() {
        return new this.constructor(this);
      }

      beforeMutate() {
        if (this.texture._refs > 1) {
          this.newTexture();
          return true;
        }
        return false;
      }

      cloneTexture() {
        this.texture._refs--;
        const { context: gl, size, texture, kernel } = this;
        if (kernel.debug) {
          console.warn('cloning internal texture');
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer());
        selectTexture(gl, texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const target = gl.createTexture();
        selectTexture(gl, target);
        gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, size[0], size[1], 0, this.textureFormat, this.textureType, null);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, size[0], size[1]);
        target._refs = 1;
        this.texture = target;
      }

      newTexture() {
        this.texture._refs--;
        const gl = this.context;
        const size = this.size;
        const kernel = this.kernel;
        if (kernel.debug) {
          console.warn('new internal texture');
        }
        const target = gl.createTexture();
        selectTexture(gl, target);
        gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, size[0], size[1], 0, this.textureFormat, this.textureType, null);
        target._refs = 1;
        this.texture = target;
      }

      clear() {
        if (this.texture._refs) {
          this.texture._refs--;
          const gl = this.context;
          const target = this.texture = gl.createTexture();
          selectTexture(gl, target);
          const size = this.size;
          target._refs = 1;
          gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, size[0], size[1], 0, this.textureFormat, this.textureType, null);
        }
        const { context: gl, texture } = this;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer());
        gl.bindTexture(gl.TEXTURE_2D, texture);
        selectTexture(gl, texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      delete() {
        if (this._deleted) return;
        this._deleted = true;
        if (this.texture._refs) {
          this.texture._refs--;
          if (this.texture._refs) return;
        }
        this.context.deleteTexture(this.texture);
        if (this.texture._refs === 0 && this._framebuffer) {
          this.context.deleteFramebuffer(this._framebuffer);
          this._framebuffer = null;
        }
      }

      framebuffer() {
        if (!this._framebuffer) {
          this._framebuffer = this.context.createFramebuffer();
        }
        this._framebuffer.width = this.size[0];
        this._framebuffer.height = this.size[1];
        return this._framebuffer;
      }
    }

    function selectTexture(gl, texture) {
      gl.activeTexture(gl.TEXTURE15);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    module.exports = { GLTexture };
    },{"../../../texture":113}],28:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureMemoryOptimized2D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'MemoryOptimizedNumberTexture';
      }
      toArray() {
        return utils.erectMemoryOptimized2DFloat(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureMemoryOptimized2D
    };
    },{"../../../utils":114,"./float":25}],29:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureMemoryOptimized3D extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'MemoryOptimizedNumberTexture';
      }
      toArray() {
        return utils.erectMemoryOptimized3DFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureMemoryOptimized3D
    };
    },{"../../../utils":114,"./float":25}],30:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureFloat } = require('./float');

    class GLTextureMemoryOptimized extends GLTextureFloat {
      constructor(settings) {
        super(settings);
        this.type = 'MemoryOptimizedNumberTexture';
      }
      toArray() {
        return utils.erectMemoryOptimizedFloat(this.renderValues(), this.output[0]);
      }
    }

    module.exports = {
      GLTextureMemoryOptimized
    };
    },{"../../../utils":114,"./float":25}],31:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureUnsigned } = require('./unsigned');

    class GLTextureUnsigned2D extends GLTextureUnsigned {
      constructor(settings) {
        super(settings);
        this.type = 'NumberTexture';
      }
      toArray() {
        return utils.erect2DPackedFloat(this.renderValues(), this.output[0], this.output[1]);
      }
    }

    module.exports = {
      GLTextureUnsigned2D
    };
    },{"../../../utils":114,"./unsigned":33}],32:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTextureUnsigned } = require('./unsigned');

    class GLTextureUnsigned3D extends GLTextureUnsigned {
      constructor(settings) {
        super(settings);
        this.type = 'NumberTexture';
      }
      toArray() {
        return utils.erect3DPackedFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
      }
    }

    module.exports = {
      GLTextureUnsigned3D
    };
    },{"../../../utils":114,"./unsigned":33}],33:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { GLTexture } = require('./index');

    class GLTextureUnsigned extends GLTexture {
      get textureType() {
        return this.context.UNSIGNED_BYTE;
      }
      constructor(settings) {
        super(settings);
        this.type = 'NumberTexture';
      }
      renderRawOutput() {
        const { context: gl } = this;
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          this.texture,
          0
        );
        const result = new Uint8Array(this.size[0] * this.size[1] * 4);
        gl.readPixels(0, 0, this.size[0], this.size[1], gl.RGBA, gl.UNSIGNED_BYTE, result);
        return result;
      }
      renderValues() {
        if (this._deleted) return null;
        return new Float32Array(this.renderRawOutput().buffer);
      }
      toArray() {
        return utils.erectPackedFloat(this.renderValues(), this.output[0]);
      }
    }

    module.exports = {
      GLTextureUnsigned
    };
    },{"../../../utils":114,"./index":27}],34:[function(require,module,exports){
    const getContext = require('gl');
    const { WebGLKernel } = require('../web-gl/kernel');
    const { glKernelString } = require('../gl/kernel-string');

    let isSupported = null;
    let testCanvas = null;
    let testContext = null;
    let testExtensions = null;
    let features = null;

    class HeadlessGLKernel extends WebGLKernel {
      static get isSupported() {
        if (isSupported !== null) return isSupported;
        this.setupFeatureChecks();
        isSupported = testContext !== null;
        return isSupported;
      }

      static setupFeatureChecks() {
        testCanvas = null;
        testExtensions = null;
        if (typeof getContext !== 'function') return;
        try { 
          testContext = getContext(2, 2, {
            preserveDrawingBuffer: true
          });
          if (!testContext || !testContext.getExtension) return;
          testExtensions = {
            STACKGL_resize_drawingbuffer: testContext.getExtension('STACKGL_resize_drawingbuffer'),
            STACKGL_destroy_context: testContext.getExtension('STACKGL_destroy_context'),
            OES_texture_float: testContext.getExtension('OES_texture_float'),
            OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
            OES_element_index_uint: testContext.getExtension('OES_element_index_uint'),
            WEBGL_draw_buffers: testContext.getExtension('WEBGL_draw_buffers'),
            WEBGL_color_buffer_float: testContext.getExtension('WEBGL_color_buffer_float'),
          };
          features = this.getFeatures();
        } catch (e) {
          console.warn(e);
        }
      }

      static isContextMatch(context) {
        try {
          return context.getParameter(context.RENDERER) === 'ANGLE';
        } catch (e) {
          return false;
        }
      }

      static getIsTextureFloat() {
        return Boolean(testExtensions.OES_texture_float);
      }

      static getIsDrawBuffers() {
        return Boolean(testExtensions.WEBGL_draw_buffers);
      }

      static getChannelCount() {
        return testExtensions.WEBGL_draw_buffers ?
          testContext.getParameter(testExtensions.WEBGL_draw_buffers.MAX_DRAW_BUFFERS_WEBGL) :
          1;
      }

      static getMaxTextureSize() {
        return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
      }

      static get testCanvas() {
        return testCanvas;
      }

      static get testContext() {
        return testContext;
      }

      static get features() {
        return features;
      }

      initCanvas() {
        return {};
      }

      initContext() {
        return getContext(2, 2, {
          preserveDrawingBuffer: true
        });
      }

      initExtensions() {
        this.extensions = {
          STACKGL_resize_drawingbuffer: this.context.getExtension('STACKGL_resize_drawingbuffer'),
          STACKGL_destroy_context: this.context.getExtension('STACKGL_destroy_context'),
          OES_texture_float: this.context.getExtension('OES_texture_float'),
          OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
          OES_element_index_uint: this.context.getExtension('OES_element_index_uint'),
          WEBGL_draw_buffers: this.context.getExtension('WEBGL_draw_buffers'),
        };
      }

      build() {
        super.build.apply(this, arguments);
        if (!this.fallbackRequested) {
          this.extensions.STACKGL_resize_drawingbuffer.resize(this.maxTexSize[0], this.maxTexSize[1]);
        }
      }

      destroyExtensions() {
        this.extensions.STACKGL_resize_drawingbuffer = null;
        this.extensions.STACKGL_destroy_context = null;
        this.extensions.OES_texture_float = null;
        this.extensions.OES_texture_float_linear = null;
        this.extensions.OES_element_index_uint = null;
        this.extensions.WEBGL_draw_buffers = null;
      }

      static destroyContext(context) {
        const extension = context.getExtension('STACKGL_destroy_context');
        if (extension && extension.destroy) {
          extension.destroy();
        }
      }

      toString() {
        const setupContextString = `const gl = context || require('gl')(1, 1);\n`;
        const destroyContextString = `    if (!context) { gl.getExtension('STACKGL_destroy_context').destroy(); }\n`;
        return glKernelString(this.constructor, arguments, this, setupContextString, destroyContextString);
      }

      setOutput(output) {
        super.setOutput(output);
        if (this.graphical && this.extensions.STACKGL_resize_drawingbuffer) {
          this.extensions.STACKGL_resize_drawingbuffer.resize(this.maxTexSize[0], this.maxTexSize[1]);
        }
        return this;
      }
    }

    module.exports = {
      HeadlessGLKernel
    };
    },{"../gl/kernel-string":12,"../web-gl/kernel":70,"gl":2}],35:[function(require,module,exports){
    class KernelValue {
      constructor(value, settings) {
        const {
          name,
          kernel,
          context,
          checkContext,
          onRequestContextHandle,
          onUpdateValueMismatch,
          origin,
          strictIntegers,
          type,
          tactic,
        } = settings;
        if (!name) {
          throw new Error('name not set');
        }
        if (!type) {
          throw new Error('type not set');
        }
        if (!origin) {
          throw new Error('origin not set');
        }
        if (origin !== 'user' && origin !== 'constants') {
          throw new Error(`origin must be "user" or "constants" value is "${ origin }"`);
        }
        if (!onRequestContextHandle) {
          throw new Error('onRequestContextHandle is not set');
        }
        this.name = name;
        this.origin = origin;
        this.tactic = tactic;
        this.varName = origin === 'constants' ? `constants.${name}` : name;
        this.kernel = kernel;
        this.strictIntegers = strictIntegers;
        this.type = value.type || type;
        this.size = value.size || null;
        this.index = null;
        this.context = context;
        this.checkContext = checkContext !== null && checkContext !== undefined ? checkContext : true;
        this.contextHandle = null;
        this.onRequestContextHandle = onRequestContextHandle;
        this.onUpdateValueMismatch = onUpdateValueMismatch;
        this.forceUploadEachRun = null;
      }

      get id() {
        return `${this.origin}_${name}`;
      }

      getSource() {
        throw new Error(`"getSource" not defined on ${ this.constructor.name }`);
      }

      updateValue(value) {
        throw new Error(`"updateValue" not defined on ${ this.constructor.name }`);
      }
    }

    module.exports = {
      KernelValue
    };
    },{}],36:[function(require,module,exports){
    const { utils } = require('../utils');
    const { Input } = require('../input');

    class Kernel {
      static get isSupported() {
        throw new Error(`"isSupported" not implemented on ${ this.name }`);
      }

      static isContextMatch(context) {
        throw new Error(`"isContextMatch" not implemented on ${ this.name }`);
      }

      static getFeatures() {
        throw new Error(`"getFeatures" not implemented on ${ this.name }`);
      }

      static destroyContext(context) {
        throw new Error(`"destroyContext" called on ${ this.name }`);
      }

      static nativeFunctionArguments() {
        throw new Error(`"nativeFunctionArguments" called on ${ this.name }`);
      }

      static nativeFunctionReturnType() {
        throw new Error(`"nativeFunctionReturnType" called on ${ this.name }`);
      }

      static combineKernels() {
        throw new Error(`"combineKernels" called on ${ this.name }`);
      }

      constructor(source, settings) {
        if (typeof source !== 'object') {
          if (typeof source !== 'string') {
            throw new Error('source not a string');
          }
          if (!utils.isFunctionString(source)) {
            throw new Error('source not a function string');
          }
        }
        this.useLegacyEncoder = false;
        this.fallbackRequested = false;
        this.onRequestFallback = null;

        this.argumentNames = typeof source === 'string' ? utils.getArgumentNamesFromString(source) : null;
        this.argumentTypes = null;
        this.argumentSizes = null;
        this.argumentBitRatios = null;
        this.kernelArguments = null;
        this.kernelConstants = null;
        this.forceUploadKernelConstants = null;


        this.source = source;

        this.output = null;

        this.debug = false;

        this.graphical = false;

        this.loopMaxIterations = 0;

        this.constants = null;

        this.constantTypes = null;

        this.constantBitRatios = null;

        this.dynamicArguments = false;

        this.dynamicOutput = false;

        this.canvas = null;

        this.context = null;

        this.checkContext = null;

        this.gpu = null;

        this.functions = null;

        this.nativeFunctions = null;

        this.injectedNative = null;

        this.subKernels = null;

        this.validate = true;

        this.immutable = false;

        this.pipeline = false;

        this.precision = null;

        this.tactic = null;

        this.plugins = null;

        this.returnType = null;
        this.leadingReturnStatement = null;
        this.followingReturnStatement = null;
        this.optimizeFloatMemory = null;
        this.strictIntegers = false;
        this.fixIntegerDivisionAccuracy = null;
        this.onIstanbulCoverageVariable = null;
        this.removeIstanbulCoverage = false;
        this.built = false;
        this.signature = null;
      }

      mergeSettings(settings) {
        for (let p in settings) {
          if (!settings.hasOwnProperty(p) || !this.hasOwnProperty(p)) continue;
          switch (p) {
            case 'output':
              if (!Array.isArray(settings.output)) {
                this.setOutput(settings.output); 
                continue;
              }
              break;
            case 'functions':
              this.functions = [];
              for (let i = 0; i < settings.functions.length; i++) {
                this.addFunction(settings.functions[i]);
              }
              continue;
            case 'graphical':
              if (settings[p] && !settings.hasOwnProperty('precision')) {
                this.precision = 'unsigned';
              }
              this[p] = settings[p];
              continue;
            case 'removeIstanbulCoverage':
              if (settings[p] !== null) {
                this[p] = settings[p];
              }
              continue;
            case 'nativeFunctions':
              if (!settings.nativeFunctions) continue;
              this.nativeFunctions = [];
              for (let i = 0; i < settings.nativeFunctions.length; i++) {
                const s = settings.nativeFunctions[i];
                const { name, source } = s;
                this.addNativeFunction(name, source, s);
              }
              continue;
          }
          this[p] = settings[p];
        }

        if (!this.canvas) this.canvas = this.initCanvas();
        if (!this.context) this.context = this.initContext();
        if (!this.plugins) this.plugins = this.initPlugins(settings);
      }
      build() {
        throw new Error(`"build" not defined on ${ this.constructor.name }`);
      }

      run() {
        throw new Error(`"run" not defined on ${ this.constructor.name }`)
      }

      initCanvas() {
        throw new Error(`"initCanvas" not defined on ${ this.constructor.name }`);
      }

      initContext() {
        throw new Error(`"initContext" not defined on ${ this.constructor.name }`);
      }

      initPlugins(settings) {
        throw new Error(`"initPlugins" not defined on ${ this.constructor.name }`);
      }

      addFunction(source, settings = {}) {
        if (source.name && source.source && source.argumentTypes && 'returnType' in source) {
          this.functions.push(source);
        } else if ('settings' in source && 'source' in source) {
          this.functions.push(this.functionToIGPUFunction(source.source, source.settings));
        } else if (typeof source === 'string' || typeof source === 'function') {
          this.functions.push(this.functionToIGPUFunction(source, settings));
        } else {
          throw new Error(`function not properly defined`);
        }
        return this;
      }

      addNativeFunction(name, source, settings = {}) {
        const { argumentTypes, argumentNames } = settings.argumentTypes ?
          splitArgumentTypes(settings.argumentTypes) :
          this.constructor.nativeFunctionArguments(source) || {};
        this.nativeFunctions.push({
          name,
          source,
          settings,
          argumentTypes,
          argumentNames,
          returnType: settings.returnType || this.constructor.nativeFunctionReturnType(source)
        });
        return this;
      }

      setupArguments(args) {
        this.kernelArguments = [];
        if (!this.argumentTypes) {
          if (!this.argumentTypes) {
            this.argumentTypes = [];
            for (let i = 0; i < args.length; i++) {
              const argType = utils.getVariableType(args[i], this.strictIntegers);
              const type = argType === 'Integer' ? 'Number' : argType;
              this.argumentTypes.push(type);
              this.kernelArguments.push({
                type
              });
            }
          }
        } else {
          for (let i = 0; i < this.argumentTypes.length; i++) {
            this.kernelArguments.push({
              type: this.argumentTypes[i]
            });
          }
        }

        this.argumentSizes = new Array(args.length);
        this.argumentBitRatios = new Int32Array(args.length);

        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          this.argumentSizes[i] = arg.constructor === Input ? arg.size : null;
          this.argumentBitRatios[i] = this.getBitRatio(arg);
        }

        if (this.argumentNames.length !== args.length) {
          throw new Error(`arguments are miss-aligned`);
        }
      }

      setupConstants() {
        this.kernelConstants = [];
        let needsConstantTypes = this.constantTypes === null;
        if (needsConstantTypes) {
          this.constantTypes = {};
        }
        this.constantBitRatios = {};
        if (this.constants) {
          for (let name in this.constants) {
            if (needsConstantTypes) {
              const type = utils.getVariableType(this.constants[name], this.strictIntegers);
              this.constantTypes[name] = type;
              this.kernelConstants.push({
                name,
                type
              });
            } else {
              this.kernelConstants.push({
                name,
                type: this.constantTypes[name]
              });
            }
            this.constantBitRatios[name] = this.getBitRatio(this.constants[name]);
          }
        }
      }

      setOptimizeFloatMemory(flag) {
        this.optimizeFloatMemory = flag;
        return this;
      }

      toKernelOutput(output) {
        if (output.hasOwnProperty('x')) {
          if (output.hasOwnProperty('y')) {
            if (output.hasOwnProperty('z')) {
              return [output.x, output.y, output.z];
            } else {
              return [output.x, output.y];
            }
          } else {
            return [output.x];
          }
        } else {
          return output;
        }
      }

      setOutput(output) {
        this.output = this.toKernelOutput(output);
        return this;
      }

      setDebug(flag) {
        this.debug = flag;
        return this;
      }

      setGraphical(flag) {
        this.graphical = flag;
        this.precision = 'unsigned';
        return this;
      }

      setLoopMaxIterations(max) {
        this.loopMaxIterations = max;
        return this;
      }

      setConstants(constants) {
        this.constants = constants;
        return this;
      }

      setConstantTypes(constantTypes) {
        this.constantTypes = constantTypes;
        return this;
      }

      setFunctions(functions) {
        for (let i = 0; i < functions.length; i++) {
          this.addFunction(functions[i]);
        }
        return this;
      }

      setNativeFunctions(nativeFunctions) {
        for (let i = 0; i < nativeFunctions.length; i++) {
          const settings = nativeFunctions[i];
          const { name, source } = settings;
          this.addNativeFunction(name, source, settings);
        }
        return this;
      }

      setInjectedNative(injectedNative) {
        this.injectedNative = injectedNative;
        return this;
      }

      setPipeline(flag) {
        this.pipeline = flag;
        return this;
      }

      setPrecision(flag) {
        this.precision = flag;
        return this;
      }

      setDimensions(flag) {
        utils.warnDeprecated('method', 'setDimensions', 'setOutput');
        this.output = flag;
        return this;
      }

      setOutputToTexture(flag) {
        utils.warnDeprecated('method', 'setOutputToTexture', 'setPipeline');
        this.pipeline = flag;
        return this;
      }

      setImmutable(flag) {
        this.immutable = flag;
        return this;
      }

      setCanvas(canvas) {
        this.canvas = canvas;
        return this;
      }

      setStrictIntegers(flag) {
        this.strictIntegers = flag;
        return this;
      }

      setDynamicOutput(flag) {
        this.dynamicOutput = flag;
        return this;
      }

      setHardcodeConstants(flag) {
        utils.warnDeprecated('method', 'setHardcodeConstants');
        this.setDynamicOutput(flag);
        this.setDynamicArguments(flag);
        return this;
      }

      setDynamicArguments(flag) {
        this.dynamicArguments = flag;
        return this;
      }

      setUseLegacyEncoder(flag) {
        this.useLegacyEncoder = flag;
        return this;
      }

      setWarnVarUsage(flag) {
        utils.warnDeprecated('method', 'setWarnVarUsage');
        return this;
      }

      getCanvas() {
        utils.warnDeprecated('method', 'getCanvas');
        return this.canvas;
      }

      getWebGl() {
        utils.warnDeprecated('method', 'getWebGl');
        return this.context;
      }

      setContext(context) {
        this.context = context;
        return this;
      }

      setArgumentTypes(argumentTypes) {
        if (Array.isArray(argumentTypes)) {
          this.argumentTypes = argumentTypes;
        } else {
          this.argumentTypes = [];
          for (const p in argumentTypes) {
            if (!argumentTypes.hasOwnProperty(p)) continue;
            const argumentIndex = this.argumentNames.indexOf(p);
            if (argumentIndex === -1) throw new Error(`unable to find argument ${ p }`);
            this.argumentTypes[argumentIndex] = argumentTypes[p];
          }
        }
        return this;
      }

      setTactic(tactic) {
        this.tactic = tactic;
        return this;
      }

      requestFallback(args) {
        if (!this.onRequestFallback) {
          throw new Error(`"onRequestFallback" not defined on ${ this.constructor.name }`);
        }
        this.fallbackRequested = true;
        return this.onRequestFallback(args);
      }

      validateSettings() {
        throw new Error(`"validateSettings" not defined on ${ this.constructor.name }`);
      }

      addSubKernel(subKernel) {
        if (this.subKernels === null) {
          this.subKernels = [];
        }
        if (!subKernel.source) throw new Error('subKernel missing "source" property');
        if (!subKernel.property && isNaN(subKernel.property)) throw new Error('subKernel missing "property" property');
        if (!subKernel.name) throw new Error('subKernel missing "name" property');
        this.subKernels.push(subKernel);
        return this;
      }

      destroy(removeCanvasReferences) {
        throw new Error(`"destroy" called on ${ this.constructor.name }`);
      }

      getBitRatio(value) {
        if (this.precision === 'single') {
          return 4;
        } else if (Array.isArray(value[0])) {
          return this.getBitRatio(value[0]);
        } else if (value.constructor === Input) {
          return this.getBitRatio(value.value);
        }
        switch (value.constructor) {
          case Uint8ClampedArray:
          case Uint8Array:
          case Int8Array:
            return 1;
          case Uint16Array:
          case Int16Array:
            return 2;
          case Float32Array:
          case Int32Array:
          default:
            return 4;
        }
      }

      getPixels(flip) {
        throw new Error(`"getPixels" called on ${ this.constructor.name }`);
      }

      checkOutput() {
        if (!this.output || !utils.isArray(this.output)) throw new Error('kernel.output not an array');
        if (this.output.length < 1) throw new Error('kernel.output is empty, needs at least 1 value');
        for (let i = 0; i < this.output.length; i++) {
          if (isNaN(this.output[i]) || this.output[i] < 1) {
            throw new Error(`${ this.constructor.name }.output[${ i }] incorrectly defined as \`${ this.output[i] }\`, needs to be numeric, and greater than 0`);
          }
        }
      }

      prependString(value) {
        throw new Error(`"prependString" called on ${ this.constructor.name }`);
      }

      hasPrependString(value) {
        throw new Error(`"hasPrependString" called on ${ this.constructor.name }`);
      }

      toJSON() {
        return {
          settings: {
            output: this.output,
            pipeline: this.pipeline,
            argumentNames: this.argumentNames,
            argumentsTypes: this.argumentTypes,
            constants: this.constants,
            pluginNames: this.plugins ? this.plugins.map(plugin => plugin.name) : null,
            returnType: this.returnType,
          }
        };
      }

      buildSignature(args) {
        const Constructor = this.constructor;
        this.signature = Constructor.getSignature(this, Constructor.getArgumentTypes(this, args));
      }

      static getArgumentTypes(kernel, args) {
        const argumentTypes = new Array(args.length);
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          const type = kernel.argumentTypes[i];
          if (arg.type) {
            argumentTypes[i] = arg.type;
          } else {
            switch (type) {
              case 'Number':
              case 'Integer':
              case 'Float':
              case 'ArrayTexture(1)':
                argumentTypes[i] = utils.getVariableType(arg);
                break;
              default:
                argumentTypes[i] = type;
            }
          }
        }
        return argumentTypes;
      }

      static getSignature(kernel, argumentTypes) {
        throw new Error(`"getSignature" not implemented on ${ this.name }`);
      }

      functionToIGPUFunction(source, settings = {}) {
        if (typeof source !== 'string' && typeof source !== 'function') throw new Error('source not a string or function');
        const sourceString = typeof source === 'string' ? source : source.toString();
        let argumentTypes = [];

        if (Array.isArray(settings.argumentTypes)) {
          argumentTypes = settings.argumentTypes;
        } else if (typeof settings.argumentTypes === 'object') {
          argumentTypes = utils.getArgumentNamesFromString(sourceString)
            .map(name => settings.argumentTypes[name]) || [];
        } else {
          argumentTypes = settings.argumentTypes || [];
        }

        return {
          name: utils.getFunctionNameFromString(sourceString) || null,
          source: sourceString,
          argumentTypes,
          returnType: settings.returnType || null,
        };
      }

      onActivate(previousKernel) {}
    }

    function splitArgumentTypes(argumentTypesObject) {
      const argumentNames = Object.keys(argumentTypesObject);
      const argumentTypes = [];
      for (let i = 0; i < argumentNames.length; i++) {
        const argumentName = argumentNames[i];
        argumentTypes.push(argumentTypesObject[argumentName]);
      }
      return { argumentTypes, argumentNames };
    }

    module.exports = {
      Kernel
    };
    },{"../input":110,"../utils":114}],37:[function(require,module,exports){
    const fragmentShader = `__HEADER__;
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

const int LOOP_MAX = __LOOP_MAX__;

__PLUGINS__;
__CONSTANTS__;

varying vec2 vTexCoord;

float acosh(float x) {
  return log(x + sqrt(x * x - 1.0));
}

float sinh(float x) {
  return (pow(${Math.E}, x) - pow(${Math.E}, -x)) / 2.0;
}

float asinh(float x) {
  return log(x + sqrt(x * x + 1.0));
}

float atan2(float v1, float v2) {
  if (v1 == 0.0 || v2 == 0.0) return 0.0;
  return atan(v1 / v2);
}

float atanh(float x) {
  x = (x + 1.0) / (x - 1.0);
  if (x < 0.0) {
    return 0.5 * log(-x);
  }
  return 0.5 * log(x);
}

float cbrt(float x) {
  if (x >= 0.0) {
    return pow(x, 1.0 / 3.0);
  } else {
    return -pow(x, 1.0 / 3.0);
  }
}

float cosh(float x) {
  return (pow(${Math.E}, x) + pow(${Math.E}, -x)) / 2.0; 
}

float expm1(float x) {
  return pow(${Math.E}, x) - 1.0; 
}

float fround(highp float x) {
  return x;
}

float imul(float v1, float v2) {
  return float(int(v1) * int(v2));
}

float log10(float x) {
  return log2(x) * (1.0 / log2(10.0));
}

float log1p(float x) {
  return log(1.0 + x);
}

float _pow(float v1, float v2) {
  if (v2 == 0.0) return 1.0;
  return pow(v1, v2);
}

float tanh(float x) {
  float e = exp(2.0 * x);
  return (e - 1.0) / (e + 1.0);
}

float trunc(float x) {
  if (x >= 0.0) {
    return floor(x); 
  } else {
    return ceil(x);
  }
}

vec4 _round(vec4 x) {
  return floor(x + 0.5);
}

float _round(float x) {
  return floor(x + 0.5);
}

const int BIT_COUNT = 32;
int modi(int x, int y) {
  return x - y * (x / y);
}

int bitwiseOr(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) || (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseXOR(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) != (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseAnd(int a, int b) {
  int result = 0;
  int n = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 && b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseNot(int a) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if (modi(a, 2) == 0) {
      result += n;    
    }
    a = a / 2;
    n = n * 2;
  }
  return result;
}
int bitwiseZeroFillLeftShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n *= 2;
  }

  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

int bitwiseSignedRightShift(int num, int shifts) {
  return int(floor(float(num) / pow(2.0, float(shifts))));
}

int bitwiseZeroFillRightShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n /= 2;
  }
  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

vec2 integerMod(vec2 x, float y) {
  vec2 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec3 integerMod(vec3 x, float y) {
  vec3 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec4 integerMod(vec4 x, vec4 y) {
  vec4 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

float integerMod(float x, float y) {
  float res = floor(mod(x, y));
  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);
}

int integerMod(int x, int y) {
  return x - (y * int(x / y));
}

__DIVIDE_WITH_INTEGER_CHECK__;

// Here be dragons!
// DO NOT OPTIMIZE THIS CODE
// YOU WILL BREAK SOMETHING ON SOMEBODY\'S MACHINE
// LEAVE IT AS IT IS, LEST YOU WASTE YOUR OWN TIME
const vec2 MAGIC_VEC = vec2(1.0, -256.0);
const vec4 SCALE_FACTOR = vec4(1.0, 256.0, 65536.0, 0.0);
const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536
float decode32(vec4 texel) {
  __DECODE32_ENDIANNESS__;
  texel *= 255.0;
  vec2 gte128;
  gte128.x = texel.b >= 128.0 ? 1.0 : 0.0;
  gte128.y = texel.a >= 128.0 ? 1.0 : 0.0;
  float exponent = 2.0 * texel.a - 127.0 + dot(gte128, MAGIC_VEC);
  float res = exp2(_round(exponent));
  texel.b = texel.b - 128.0 * gte128.x;
  res = dot(texel, SCALE_FACTOR) * exp2(_round(exponent-23.0)) + res;
  res *= gte128.y * -2.0 + 1.0;
  return res;
}

float decode16(vec4 texel, int index) {
  int channel = integerMod(index, 2);
  if (channel == 0) return texel.r * 255.0 + texel.g * 65280.0;
  if (channel == 1) return texel.b * 255.0 + texel.a * 65280.0;
  return 0.0;
}

float decode8(vec4 texel, int index) {
  int channel = integerMod(index, 4);
  if (channel == 0) return texel.r * 255.0;
  if (channel == 1) return texel.g * 255.0;
  if (channel == 2) return texel.b * 255.0;
  if (channel == 3) return texel.a * 255.0;
  return 0.0;
}

vec4 legacyEncode32(float f) {
  float F = abs(f);
  float sign = f < 0.0 ? 1.0 : 0.0;
  float exponent = floor(log2(F));
  float mantissa = (exp2(-exponent) * F);
  // exponent += floor(log2(mantissa));
  vec4 texel = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;
  texel.rg = integerMod(texel.rg, 256.0);
  texel.b = integerMod(texel.b, 128.0);
  texel.a = exponent*0.5 + 63.5;
  texel.ba += vec2(integerMod(exponent+127.0, 2.0), sign) * 128.0;
  texel = floor(texel);
  texel *= 0.003921569; // 1/255
  __ENCODE32_ENDIANNESS__;
  return texel;
}

// https://github.com/gpujs/gpu.js/wiki/Encoder-details
vec4 encode32(float value) {
  if (value == 0.0) return vec4(0, 0, 0, 0);

  float exponent;
  float mantissa;
  vec4  result;
  float sgn;

  sgn = step(0.0, -value);
  value = abs(value);

  exponent = floor(log2(value));

  mantissa = value*pow(2.0, -exponent)-1.0;
  exponent = exponent+127.0;
  result   = vec4(0,0,0,0);

  result.a = floor(exponent/2.0);
  exponent = exponent - result.a*2.0;
  result.a = result.a + 128.0*sgn;

  result.b = floor(mantissa * 128.0);
  mantissa = mantissa - result.b / 128.0;
  result.b = result.b + exponent*128.0;

  result.g = floor(mantissa*32768.0);
  mantissa = mantissa - result.g/32768.0;

  result.r = floor(mantissa*8388608.0);
  return result/255.0;
}
// Dragons end here

int index;
ivec3 threadId;

ivec3 indexTo3D(int idx, ivec3 texDim) {
  int z = int(idx / (texDim.x * texDim.y));
  idx -= z * int(texDim.x * texDim.y);
  int y = int(idx / texDim.x);
  int x = int(integerMod(idx, texDim.x));
  return ivec3(x, y, z);
}

float get32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  return decode32(texel);
}

float get16(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x * 2;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize.x * 2, texSize.y));
  return decode16(texel, index);
}

float get8(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x * 4;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize.x * 4, texSize.y));
  return decode8(texel, index);
}

float getMemoryOptimized32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 4);
  index = index / 4;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  if (channel == 0) return texel.r;
  if (channel == 1) return texel.g;
  if (channel == 2) return texel.b;
  if (channel == 3) return texel.a;
  return 0.0;
}

vec4 getImage2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture2D(tex, st / vec2(texSize));
}

float getFloatFromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return result[0];
}

vec2 getVec2FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec2(result[0], result[1]);
}

vec2 getMemoryOptimizedVec2(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int channel = integerMod(index, 2);
  index = index / 2;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  if (channel == 0) return vec2(texel.r, texel.g);
  if (channel == 1) return vec2(texel.b, texel.a);
  return vec2(0.0, 0.0);
}

vec3 getVec3FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec3(result[0], result[1], result[2]);
}

vec3 getMemoryOptimizedVec3(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int fieldIndex = 3 * (x + texDim.x * (y + texDim.y * z));
  int vectorIndex = fieldIndex / 4;
  int vectorOffset = fieldIndex - vectorIndex * 4;
  int readY = vectorIndex / texSize.x;
  int readX = vectorIndex - readY * texSize.x;
  vec4 tex1 = texture2D(tex, (vec2(readX, readY) + 0.5) / vec2(texSize));
  
  if (vectorOffset == 0) {
    return tex1.xyz;
  } else if (vectorOffset == 1) {
    return tex1.yzw;
  } else {
    readX++;
    if (readX >= texSize.x) {
      readX = 0;
      readY++;
    }
    vec4 tex2 = texture2D(tex, vec2(readX, readY) / vec2(texSize));
    if (vectorOffset == 2) {
      return vec3(tex1.z, tex1.w, tex2.x);
    } else {
      return vec3(tex1.w, tex2.x, tex2.y);
    }
  }
}

vec4 getVec4FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  return getImage2D(tex, texSize, texDim, z, y, x);
}

vec4 getMemoryOptimizedVec4(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  return vec4(texel.r, texel.g, texel.b, texel.a);
}

vec4 actualColor;
void color(float r, float g, float b, float a) {
  actualColor = vec4(r,g,b,a);
}

void color(float r, float g, float b) {
  color(r,g,b,1.0);
}

void color(sampler2D image) {
  actualColor = texture2D(image, vTexCoord);
}

float modulo(float number, float divisor) {
  if (number < 0.0) {
    number = abs(number);
    if (divisor < 0.0) {
      divisor = abs(divisor);
    }
    return -mod(number, divisor);
  }
  if (divisor < 0.0) {
    divisor = abs(divisor);
  }
  return mod(number, divisor);
}

__INJECTED_NATIVE__;
__MAIN_CONSTANTS__;
__MAIN_ARGUMENTS__;
__KERNEL__;

void main(void) {
  index = int(vTexCoord.s * float(uTexSize.x)) + int(vTexCoord.t * float(uTexSize.y)) * uTexSize.x;
  __MAIN_RESULT__;
}`;

    module.exports = {
      fragmentShader
    };
    },{}],38:[function(require,module,exports){
    const { utils } = require('../../utils');
    const { FunctionNode } = require('../function-node');

    class WebGLFunctionNode extends FunctionNode {
      constructor(source, settings) {
        super(source, settings);
        if (settings && settings.hasOwnProperty('fixIntegerDivisionAccuracy')) {
          this.fixIntegerDivisionAccuracy = settings.fixIntegerDivisionAccuracy;
        }
      }

      astConditionalExpression(ast, retArr) {
        if (ast.type !== 'ConditionalExpression') {
          throw this.astErrorOutput('Not a conditional expression', ast);
        }
        const consequentType = this.getType(ast.consequent);
        const alternateType = this.getType(ast.alternate);
        if (consequentType === null && alternateType === null) {
          retArr.push('if (');
          this.astGeneric(ast.test, retArr);
          retArr.push(') {');
          this.astGeneric(ast.consequent, retArr);
          retArr.push(';');
          retArr.push('} else {');
          this.astGeneric(ast.alternate, retArr);
          retArr.push(';');
          retArr.push('}');
          return retArr;
        }
        retArr.push('(');
        this.astGeneric(ast.test, retArr);
        retArr.push('?');
        this.astGeneric(ast.consequent, retArr);
        retArr.push(':');
        this.astGeneric(ast.alternate, retArr);
        retArr.push(')');
        return retArr;
      }

      astFunction(ast, retArr) {
        if (this.isRootKernel) {
          retArr.push('void');
        } else {
          if (!this.returnType) {
            const lastReturn = this.findLastReturn();
            if (lastReturn) {
              this.returnType = this.getType(ast.body);
              if (this.returnType === 'LiteralInteger') {
                this.returnType = 'Number';
              }
            }
          }

          const { returnType } = this;
          if (!returnType) {
            retArr.push('void');
          } else {
            const type = typeMap[returnType];
            if (!type) {
              throw new Error(`unknown type ${returnType}`);
            }
            retArr.push(type);
          }
        }
        retArr.push(' ');
        retArr.push(this.name);
        retArr.push('(');

        if (!this.isRootKernel) {
          for (let i = 0; i < this.argumentNames.length; ++i) {
            const argumentName = this.argumentNames[i];

            if (i > 0) {
              retArr.push(', ');
            }
            let argumentType = this.argumentTypes[this.argumentNames.indexOf(argumentName)];
            if (!argumentType) {
              throw this.astErrorOutput(`Unknown argument ${argumentName} type`, ast);
            }
            if (argumentType === 'LiteralInteger') {
              this.argumentTypes[i] = argumentType = 'Number';
            }
            const type = typeMap[argumentType];
            if (!type) {
              throw this.astErrorOutput('Unexpected expression', ast);
            }
            const name = utils.sanitizeName(argumentName);
            if (type === 'sampler2D' || type === 'sampler2DArray') {
              retArr.push(`${type} user_${name},ivec2 user_${name}Size,ivec3 user_${name}Dim`);
            } else {
              retArr.push(`${type} user_${name}`);
            }
          }
        }

        retArr.push(') {\n');

        for (let i = 0; i < ast.body.body.length; ++i) {
          this.astGeneric(ast.body.body[i], retArr);
          retArr.push('\n');
        }

        retArr.push('}\n');
        return retArr;
      }

      astReturnStatement(ast, retArr) {
        if (!ast.argument) throw this.astErrorOutput('Unexpected return statement', ast);
        this.pushState('skip-literal-correction');
        const type = this.getType(ast.argument);
        this.popState('skip-literal-correction');

        const result = [];

        if (!this.returnType) {
          if (type === 'LiteralInteger' || type === 'Integer') {
            this.returnType = 'Number';
          } else {
            this.returnType = type;
          }
        }

        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Number':
          case 'Float':
            switch (type) {
              case 'Integer':
                result.push('float(');
                this.astGeneric(ast.argument, result);
                result.push(')');
                break;
              case 'LiteralInteger':
                this.castLiteralToFloat(ast.argument, result);

                if (this.getType(ast) === 'Integer') {
                  result.unshift('float(');
                  result.push(')');
                }
                break;
              default:
                this.astGeneric(ast.argument, result);
            }
            break;
          case 'Integer':
            switch (type) {
              case 'Float':
              case 'Number':
                this.castValueToInteger(ast.argument, result);
                break;
              case 'LiteralInteger':
                this.castLiteralToInteger(ast.argument, result);
                break;
              default:
                this.astGeneric(ast.argument, result);
            }
            break;
          case 'Array(4)':
          case 'Array(3)':
          case 'Array(2)':
          case 'Input':
            this.astGeneric(ast.argument, result);
            break;
          default:
            throw this.astErrorOutput(`unhandled return type ${this.returnType}`, ast);
        }

        if (this.isRootKernel) {
          retArr.push(`kernelResult = ${ result.join('') };`);
          retArr.push('return;');
        } else if (this.isSubKernel) {
          retArr.push(`subKernelResult_${ this.name } = ${ result.join('') };`);
          retArr.push(`return subKernelResult_${ this.name };`);
        } else {
          retArr.push(`return ${ result.join('') };`);
        }
        return retArr;
      }

      astLiteral(ast, retArr) {
        if (isNaN(ast.value)) {
          throw this.astErrorOutput(
            'Non-numeric literal not supported : ' + ast.value,
            ast
          );
        }

        const key = this.astKey(ast);
        if (Number.isInteger(ast.value)) {
          if (this.isState('casting-to-integer') || this.isState('building-integer')) {
            this.literalTypes[key] = 'Integer';
            retArr.push(`${ast.value}`);
          } else if (this.isState('casting-to-float') || this.isState('building-float')) {
            this.literalTypes[key] = 'Number';
            retArr.push(`${ast.value}.0`);
          } else {
            this.literalTypes[key] = 'Number';
            retArr.push(`${ast.value}.0`);
          }
        } else if (this.isState('casting-to-integer') || this.isState('building-integer')) {
          this.literalTypes[key] = 'Integer';
          retArr.push(Math.round(ast.value));
        } else {
          this.literalTypes[key] = 'Number';
          retArr.push(`${ast.value}`);
        }
        return retArr;
      }

      astBinaryExpression(ast, retArr) {
        if (this.checkAndUpconvertOperator(ast, retArr)) {
          return retArr;
        }

        if (this.fixIntegerDivisionAccuracy && ast.operator === '/') {
          retArr.push('divWithIntCheck(');
          this.pushState('building-float');
          switch (this.getType(ast.left)) {
            case 'Integer':
              this.castValueToFloat(ast.left, retArr);
              break;
            case 'LiteralInteger':
              this.castLiteralToFloat(ast.left, retArr);
              break;
            default:
              this.astGeneric(ast.left, retArr);
          }
          retArr.push(', ');
          switch (this.getType(ast.right)) {
            case 'Integer':
              this.castValueToFloat(ast.right, retArr);
              break;
            case 'LiteralInteger':
              this.castLiteralToFloat(ast.right, retArr);
              break;
            default:
              this.astGeneric(ast.right, retArr);
          }
          this.popState('building-float');
          retArr.push(')');
          return retArr;
        }

        retArr.push('(');
        const leftType = this.getType(ast.left) || 'Number';
        const rightType = this.getType(ast.right) || 'Number';
        if (!leftType || !rightType) {
          throw this.astErrorOutput(`Unhandled binary expression`, ast);
        }
        const key = leftType + ' & ' + rightType;
        switch (key) {
          case 'Integer & Integer':
            this.pushState('building-integer');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.astGeneric(ast.right, retArr);
            this.popState('building-integer');
            break;
          case 'Number & Float':
          case 'Float & Number':
          case 'Float & Float':
          case 'Number & Number':
            this.pushState('building-float');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.astGeneric(ast.right, retArr);
            this.popState('building-float');
            break;
          case 'LiteralInteger & LiteralInteger':
            if (this.isState('casting-to-integer') || this.isState('building-integer')) {
              this.pushState('building-integer');
              this.astGeneric(ast.left, retArr);
              retArr.push(operatorMap[ast.operator] || ast.operator);
              this.astGeneric(ast.right, retArr);
              this.popState('building-integer');
            } else {
              this.pushState('building-float');
              this.castLiteralToFloat(ast.left, retArr);
              retArr.push(operatorMap[ast.operator] || ast.operator);
              this.castLiteralToFloat(ast.right, retArr);
              this.popState('building-float');
            }
            break;

          case 'Integer & Float':
          case 'Integer & Number':
            if (ast.operator === '>' || ast.operator === '<' && ast.right.type === 'Literal') {
              if (!Number.isInteger(ast.right.value)) {
                this.pushState('building-float');
                this.castValueToFloat(ast.left, retArr);
                retArr.push(operatorMap[ast.operator] || ast.operator);
                this.astGeneric(ast.right, retArr);
                this.popState('building-float');
                break;
              }
            }
            this.pushState('building-integer');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.pushState('casting-to-integer');
            if (ast.right.type === 'Literal') {
              const literalResult = [];
              this.astGeneric(ast.right, literalResult);
              const literalType = this.getType(ast.right);
              if (literalType === 'Integer') {
                retArr.push(literalResult.join(''));
              } else {
                throw this.astErrorOutput(`Unhandled binary expression with literal`, ast);
              }
            } else {
              retArr.push('int(');
              this.astGeneric(ast.right, retArr);
              retArr.push(')');
            }
            this.popState('casting-to-integer');
            this.popState('building-integer');
            break;
          case 'Integer & LiteralInteger':
            this.pushState('building-integer');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.castLiteralToInteger(ast.right, retArr);
            this.popState('building-integer');
            break;

          case 'Number & Integer':
            this.pushState('building-float');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.castValueToFloat(ast.right, retArr);
            this.popState('building-float');
            break;
          case 'Float & LiteralInteger':
          case 'Number & LiteralInteger':
            this.pushState('building-float');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.castLiteralToFloat(ast.right, retArr);
            this.popState('building-float');
            break;
          case 'LiteralInteger & Float':
          case 'LiteralInteger & Number':
            if (this.isState('casting-to-integer')) {
              this.pushState('building-integer');
              this.castLiteralToInteger(ast.left, retArr);
              retArr.push(operatorMap[ast.operator] || ast.operator);
              this.castValueToInteger(ast.right, retArr);
              this.popState('building-integer');
            } else {
              this.pushState('building-float');
              this.astGeneric(ast.left, retArr);
              retArr.push(operatorMap[ast.operator] || ast.operator);
              this.pushState('casting-to-float');
              this.astGeneric(ast.right, retArr);
              this.popState('casting-to-float');
              this.popState('building-float');
            }
            break;
          case 'LiteralInteger & Integer':
            this.pushState('building-integer');
            this.castLiteralToInteger(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.astGeneric(ast.right, retArr);
            this.popState('building-integer');
            break;

          case 'Boolean & Boolean':
            this.pushState('building-boolean');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.astGeneric(ast.right, retArr);
            this.popState('building-boolean');
            break;

          case 'Float & Integer':
            this.pushState('building-float');
            this.astGeneric(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.castValueToFloat(ast.right, retArr);
            this.popState('building-float');
            break;

          default:
            throw this.astErrorOutput(`Unhandled binary expression between ${key}`, ast);
        }
        retArr.push(')');

        return retArr;
      }

      checkAndUpconvertOperator(ast, retArr) {
        const bitwiseResult = this.checkAndUpconvertBitwiseOperators(ast, retArr);
        if (bitwiseResult) {
          return bitwiseResult;
        }
        const upconvertableOperators = {
          '%': this.fixIntegerDivisionAccuracy ? 'integerCorrectionModulo' : 'modulo',
          '**': 'pow',
        };
        const foundOperator = upconvertableOperators[ast.operator];
        if (!foundOperator) return null;
        retArr.push(foundOperator);
        retArr.push('(');
        switch (this.getType(ast.left)) {
          case 'Integer':
            this.castValueToFloat(ast.left, retArr);
            break;
          case 'LiteralInteger':
            this.castLiteralToFloat(ast.left, retArr);
            break;
          default:
            this.astGeneric(ast.left, retArr);
        }
        retArr.push(',');
        switch (this.getType(ast.right)) {
          case 'Integer':
            this.castValueToFloat(ast.right, retArr);
            break;
          case 'LiteralInteger':
            this.castLiteralToFloat(ast.right, retArr);
            break;
          default:
            this.astGeneric(ast.right, retArr);
        }
        retArr.push(')');
        return retArr;
      }

      checkAndUpconvertBitwiseOperators(ast, retArr) {
        const upconvertableOperators = {
          '&': 'bitwiseAnd',
          '|': 'bitwiseOr',
          '^': 'bitwiseXOR',
          '<<': 'bitwiseZeroFillLeftShift',
          '>>': 'bitwiseSignedRightShift',
          '>>>': 'bitwiseZeroFillRightShift',
        };
        const foundOperator = upconvertableOperators[ast.operator];
        if (!foundOperator) return null;
        retArr.push(foundOperator);
        retArr.push('(');
        const leftType = this.getType(ast.left);
        switch (leftType) {
          case 'Number':
          case 'Float':
            this.castValueToInteger(ast.left, retArr);
            break;
          case 'LiteralInteger':
            this.castLiteralToInteger(ast.left, retArr);
            break;
          default:
            this.astGeneric(ast.left, retArr);
        }
        retArr.push(',');
        const rightType = this.getType(ast.right);
        switch (rightType) {
          case 'Number':
          case 'Float':
            this.castValueToInteger(ast.right, retArr);
            break;
          case 'LiteralInteger':
            this.castLiteralToInteger(ast.right, retArr);
            break;
          default:
            this.astGeneric(ast.right, retArr);
        }
        retArr.push(')');
        return retArr;
      }

      checkAndUpconvertBitwiseUnary(ast, retArr) {
        const upconvertableOperators = {
          '~': 'bitwiseNot',
        };
        const foundOperator = upconvertableOperators[ast.operator];
        if (!foundOperator) return null;
        retArr.push(foundOperator);
        retArr.push('(');
        switch (this.getType(ast.argument)) {
          case 'Number':
          case 'Float':
            this.castValueToInteger(ast.argument, retArr);
            break;
          case 'LiteralInteger':
            this.castLiteralToInteger(ast.argument, retArr);
            break;
          default:
            this.astGeneric(ast.argument, retArr);
        }
        retArr.push(')');
        return retArr;
      }

      castLiteralToInteger(ast, retArr) {
        this.pushState('casting-to-integer');
        this.astGeneric(ast, retArr);
        this.popState('casting-to-integer');
        return retArr;
      }

      castLiteralToFloat(ast, retArr) {
        this.pushState('casting-to-float');
        this.astGeneric(ast, retArr);
        this.popState('casting-to-float');
        return retArr;
      }

      castValueToInteger(ast, retArr) {
        this.pushState('casting-to-integer');
        retArr.push('int(');
        this.astGeneric(ast, retArr);
        retArr.push(')');
        this.popState('casting-to-integer');
        return retArr;
      }

      castValueToFloat(ast, retArr) {
        this.pushState('casting-to-float');
        retArr.push('float(');
        this.astGeneric(ast, retArr);
        retArr.push(')');
        this.popState('casting-to-float');
        return retArr;
      }

      astIdentifierExpression(idtNode, retArr) {
        if (idtNode.type !== 'Identifier') {
          throw this.astErrorOutput('IdentifierExpression - not an Identifier', idtNode);
        }

        const type = this.getType(idtNode);

        const name = utils.sanitizeName(idtNode.name);
        if (idtNode.name === 'Infinity') {
          retArr.push('3.402823466e+38');
        } else if (type === 'Boolean') {
          if (this.argumentNames.indexOf(name) > -1) {
            retArr.push(`bool(user_${name})`);
          } else {
            retArr.push(`user_${name}`);
          }
        } else {
          retArr.push(`user_${name}`);
        }

        return retArr;
      }

      astForStatement(forNode, retArr) {
        if (forNode.type !== 'ForStatement') {
          throw this.astErrorOutput('Invalid for statement', forNode);
        }

        const initArr = [];
        const testArr = [];
        const updateArr = [];
        const bodyArr = [];
        let isSafe = null;

        if (forNode.init) {
          const { declarations } = forNode.init;
          if (declarations.length > 1) {
            isSafe = false;
          }
          this.astGeneric(forNode.init, initArr);
          for (let i = 0; i < declarations.length; i++) {
            if (declarations[i].init && declarations[i].init.type !== 'Literal') {
              isSafe = false;
            }
          }
        } else {
          isSafe = false;
        }

        if (forNode.test) {
          this.astGeneric(forNode.test, testArr);
        } else {
          isSafe = false;
        }

        if (forNode.update) {
          this.astGeneric(forNode.update, updateArr);
        } else {
          isSafe = false;
        }

        if (forNode.body) {
          this.pushState('loop-body');
          this.astGeneric(forNode.body, bodyArr);
          this.popState('loop-body');
        }

        if (isSafe === null) {
          isSafe = this.isSafe(forNode.init) && this.isSafe(forNode.test);
        }

        if (isSafe) {
          const initString = initArr.join('');
          const initNeedsSemiColon = initString[initString.length - 1] !== ';';
          retArr.push(`for (${initString}${initNeedsSemiColon ? ';' : ''}${testArr.join('')};${updateArr.join('')}){\n`);
          retArr.push(bodyArr.join(''));
          retArr.push('}\n');
        } else {
          const iVariableName = this.getInternalVariableName('safeI');
          if (initArr.length > 0) {
            retArr.push(initArr.join(''), '\n');
          }
          retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
          if (testArr.length > 0) {
            retArr.push(`if (!${testArr.join('')}) break;\n`);
          }
          retArr.push(bodyArr.join(''));
          retArr.push(`\n${updateArr.join('')};`);
          retArr.push('}\n');
        }
        return retArr;
      }

      astWhileStatement(whileNode, retArr) {
        if (whileNode.type !== 'WhileStatement') {
          throw this.astErrorOutput('Invalid while statement', whileNode);
        }

        const iVariableName = this.getInternalVariableName('safeI');
        retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
        retArr.push('if (!');
        this.astGeneric(whileNode.test, retArr);
        retArr.push(') break;\n');
        this.astGeneric(whileNode.body, retArr);
        retArr.push('}\n');

        return retArr;
      }

      astDoWhileStatement(doWhileNode, retArr) {
        if (doWhileNode.type !== 'DoWhileStatement') {
          throw this.astErrorOutput('Invalid while statement', doWhileNode);
        }

        const iVariableName = this.getInternalVariableName('safeI');
        retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
        this.astGeneric(doWhileNode.body, retArr);
        retArr.push('if (!');
        this.astGeneric(doWhileNode.test, retArr);
        retArr.push(') break;\n');
        retArr.push('}\n');

        return retArr;
      }


      astAssignmentExpression(assNode, retArr) {
        if (assNode.operator === '%=') {
          this.astGeneric(assNode.left, retArr);
          retArr.push('=');
          retArr.push('mod(');
          this.astGeneric(assNode.left, retArr);
          retArr.push(',');
          this.astGeneric(assNode.right, retArr);
          retArr.push(')');
        } else if (assNode.operator === '**=') {
          this.astGeneric(assNode.left, retArr);
          retArr.push('=');
          retArr.push('pow(');
          this.astGeneric(assNode.left, retArr);
          retArr.push(',');
          this.astGeneric(assNode.right, retArr);
          retArr.push(')');
        } else {
          const leftType = this.getType(assNode.left);
          const rightType = this.getType(assNode.right);
          this.astGeneric(assNode.left, retArr);
          retArr.push(assNode.operator);
          if (leftType !== 'Integer' && rightType === 'Integer') {
            retArr.push('float(');
            this.astGeneric(assNode.right, retArr);
            retArr.push(')');
          } else {
            this.astGeneric(assNode.right, retArr);
          }
          return retArr;
        }
      }

      astBlockStatement(bNode, retArr) {
        if (this.isState('loop-body')) {
          this.pushState('block-body'); 
          for (let i = 0; i < bNode.body.length; i++) {
            this.astGeneric(bNode.body[i], retArr);
          }
          this.popState('block-body');
        } else {
          retArr.push('{\n');
          for (let i = 0; i < bNode.body.length; i++) {
            this.astGeneric(bNode.body[i], retArr);
          }
          retArr.push('}\n');
        }
        return retArr;
      }

      astVariableDeclaration(varDecNode, retArr) {
        const declarations = varDecNode.declarations;
        if (!declarations || !declarations[0] || !declarations[0].init) {
          throw this.astErrorOutput('Unexpected expression', varDecNode);
        }
        const result = [];
        let lastType = null;
        const declarationSets = [];
        let declarationSet = [];
        for (let i = 0; i < declarations.length; i++) {
          const declaration = declarations[i];
          const init = declaration.init;
          const info = this.getDeclaration(declaration.id);
          const actualType = this.getType(declaration.init);
          let type = actualType;
          if (type === 'LiteralInteger') {
            if (info.suggestedType === 'Integer') {
              type = 'Integer';
            } else {
              type = 'Number';
            }
          }
          const markupType = typeMap[type];
          if (!markupType) {
            throw this.astErrorOutput(`Markup type ${ markupType } not handled`, varDecNode);
          }
          const declarationResult = [];
          if (actualType === 'Integer' && type === 'Integer') {
            info.valueType = 'Number';
            if (i === 0 || lastType === null) {
              declarationResult.push('float ');
            } else if (type !== lastType) {
              throw new Error('Unhandled declaration');
            }
            lastType = type;
            declarationResult.push(`user_${utils.sanitizeName(declaration.id.name)}=`);
            declarationResult.push('float(');
            this.astGeneric(init, declarationResult);
            declarationResult.push(')');
          } else {
            info.valueType = type;
            if (i === 0 || lastType === null) {
              declarationResult.push(`${markupType} `);
            } else if (type !== lastType) {
              declarationSets.push(declarationSet.join(','));
              declarationSet = [];
              declarationResult.push(`${markupType} `);
            }
            lastType = type;
            declarationResult.push(`user_${utils.sanitizeName(declaration.id.name)}=`);
            if (actualType === 'Number' && type === 'Integer') {
              if (init.left && init.left.type === 'Literal') {
                this.astGeneric(init, declarationResult);
              } else {
                declarationResult.push('int(');
                this.astGeneric(init, declarationResult);
                declarationResult.push(')');
              }
            } else if (actualType === 'LiteralInteger' && type === 'Integer') {
              this.castLiteralToInteger(init, declarationResult);
            } else {
              this.astGeneric(init, declarationResult);
            }
          }
          declarationSet.push(declarationResult.join(''));
        }

        if (declarationSet.length > 0) {
          declarationSets.push(declarationSet.join(','));
        }

        result.push(declarationSets.join(';'));

        retArr.push(result.join(''));
        retArr.push(';');
        return retArr;
      }

      astIfStatement(ifNode, retArr) {
        retArr.push('if (');
        this.astGeneric(ifNode.test, retArr);
        retArr.push(')');
        if (ifNode.consequent.type === 'BlockStatement') {
          this.astGeneric(ifNode.consequent, retArr);
        } else {
          retArr.push(' {\n');
          this.astGeneric(ifNode.consequent, retArr);
          retArr.push('\n}\n');
        }

        if (ifNode.alternate) {
          retArr.push('else ');
          if (ifNode.alternate.type === 'BlockStatement' || ifNode.alternate.type === 'IfStatement') {
            this.astGeneric(ifNode.alternate, retArr);
          } else {
            retArr.push(' {\n');
            this.astGeneric(ifNode.alternate, retArr);
            retArr.push('\n}\n');
          }
        }
        return retArr;
      }

      astSwitchStatement(ast, retArr) {
        if (ast.type !== 'SwitchStatement') {
          throw this.astErrorOutput('Invalid switch statement', ast);
        }
        const { discriminant, cases } = ast;
        const type = this.getType(discriminant);
        const varName = `switchDiscriminant${this.astKey(ast, '_')}`;
        switch (type) {
          case 'Float':
          case 'Number':
            retArr.push(`float ${varName} = `);
            this.astGeneric(discriminant, retArr);
            retArr.push(';\n');
            break;
          case 'Integer':
            retArr.push(`int ${varName} = `);
            this.astGeneric(discriminant, retArr);
            retArr.push(';\n');
            break;
        }
        if (cases.length === 1 && !cases[0].test) {
          this.astGeneric(cases[0].consequent, retArr);
          return retArr;
        }

        let fallingThrough = false;
        let defaultResult = [];
        let movingDefaultToEnd = false;
        let pastFirstIf = false;
        for (let i = 0; i < cases.length; i++) {
          if (!cases[i].test) {
            if (cases.length > i + 1) {
              movingDefaultToEnd = true;
              this.astGeneric(cases[i].consequent, defaultResult);
              continue;
            } else {
              retArr.push(' else {\n');
            }
          } else {
            if (i === 0 || !pastFirstIf) {
              pastFirstIf = true;
              retArr.push(`if (${varName} == `);
            } else {
              if (fallingThrough) {
                retArr.push(`${varName} == `);
                fallingThrough = false;
              } else {
                retArr.push(` else if (${varName} == `);
              }
            }
            if (type === 'Integer') {
              const testType = this.getType(cases[i].test);
              switch (testType) {
                case 'Number':
                case 'Float':
                  this.castValueToInteger(cases[i].test, retArr);
                  break;
                case 'LiteralInteger':
                  this.castLiteralToInteger(cases[i].test, retArr);
                  break;
              }
            } else if (type === 'Float') {
              const testType = this.getType(cases[i].test);
              switch (testType) {
                case 'LiteralInteger':
                  this.castLiteralToFloat(cases[i].test, retArr);
                  break;
                case 'Integer':
                  this.castValueToFloat(cases[i].test, retArr);
                  break;
              }
            } else {
              throw new Error('unhanlded');
            }
            if (!cases[i].consequent || cases[i].consequent.length === 0) {
              fallingThrough = true;
              retArr.push(' || ');
              continue;
            }
            retArr.push(`) {\n`);
          }
          this.astGeneric(cases[i].consequent, retArr);
          retArr.push('\n}');
        }
        if (movingDefaultToEnd) {
          retArr.push(' else {');
          retArr.push(defaultResult.join(''));
          retArr.push('}');
        }
        return retArr;
      }

      astThisExpression(tNode, retArr) {
        retArr.push('this');
        return retArr;
      }

      astMemberExpression(mNode, retArr) {
        const {
          property,
          name,
          signature,
          origin,
          type,
          xProperty,
          yProperty,
          zProperty
        } = this.getMemberExpressionDetails(mNode);
        switch (signature) {
          case 'value.thread.value':
          case 'this.thread.value':
            if (name !== 'x' && name !== 'y' && name !== 'z') {
              throw this.astErrorOutput('Unexpected expression, expected `this.thread.x`, `this.thread.y`, or `this.thread.z`', mNode);
            }
            retArr.push(`threadId.${name}`);
            return retArr;
          case 'this.output.value':
            if (this.dynamicOutput) {
              switch (name) {
                case 'x':
                  if (this.isState('casting-to-float')) {
                    retArr.push('float(uOutputDim.x)');
                  } else {
                    retArr.push('uOutputDim.x');
                  }
                  break;
                case 'y':
                  if (this.isState('casting-to-float')) {
                    retArr.push('float(uOutputDim.y)');
                  } else {
                    retArr.push('uOutputDim.y');
                  }
                  break;
                case 'z':
                  if (this.isState('casting-to-float')) {
                    retArr.push('float(uOutputDim.z)');
                  } else {
                    retArr.push('uOutputDim.z');
                  }
                  break;
                default:
                  throw this.astErrorOutput('Unexpected expression', mNode);
              }
            } else {
              switch (name) {
                case 'x':
                  if (this.isState('casting-to-integer')) {
                    retArr.push(this.output[0]);
                  } else {
                    retArr.push(this.output[0], '.0');
                  }
                  break;
                case 'y':
                  if (this.isState('casting-to-integer')) {
                    retArr.push(this.output[1]);
                  } else {
                    retArr.push(this.output[1], '.0');
                  }
                  break;
                case 'z':
                  if (this.isState('casting-to-integer')) {
                    retArr.push(this.output[2]);
                  } else {
                    retArr.push(this.output[2], '.0');
                  }
                  break;
                default:
                  throw this.astErrorOutput('Unexpected expression', mNode);
              }
            }
            return retArr;
          case 'value':
            throw this.astErrorOutput('Unexpected expression', mNode);
          case 'value[]':
          case 'value[][]':
          case 'value[][][]':
          case 'value[][][][]':
          case 'value.value':
            if (origin === 'Math') {
              retArr.push(Math[name]);
              return retArr;
            }
            const cleanName = utils.sanitizeName(name);
            switch (property) {
              case 'r':
                retArr.push(`user_${ cleanName }.r`);
                return retArr;
              case 'g':
                retArr.push(`user_${ cleanName }.g`);
                return retArr;
              case 'b':
                retArr.push(`user_${ cleanName }.b`);
                return retArr;
              case 'a':
                retArr.push(`user_${ cleanName }.a`);
                return retArr;
            }
            break;
          case 'this.constants.value':
            if (typeof xProperty === 'undefined') {
              switch (type) {
                case 'Array(2)':
                case 'Array(3)':
                case 'Array(4)':
                  retArr.push(`constants_${ utils.sanitizeName(name) }`);
                  return retArr;
              }
            }
            case 'this.constants.value[]':
            case 'this.constants.value[][]':
            case 'this.constants.value[][][]':
            case 'this.constants.value[][][][]':
              break;
            case 'fn()[]':
              this.astCallExpression(mNode.object, retArr);
              retArr.push('[');
              retArr.push(this.memberExpressionPropertyMarkup(property));
              retArr.push(']');
              return retArr;
            case '[][]':
              this.astArrayExpression(mNode.object, retArr);
              retArr.push('[');
              retArr.push(this.memberExpressionPropertyMarkup(property));
              retArr.push(']');
              return retArr;
            case 'value.value[]':
            case 'value.value[][]':
              if (this.removeIstanbulCoverage) {
                return retArr;
              }
              default:
                throw this.astErrorOutput('Unexpected expression', mNode);
        }

        if (mNode.computed === false) {
          switch (type) {
            case 'Number':
            case 'Integer':
            case 'Float':
            case 'Boolean':
              retArr.push(`${origin}_${utils.sanitizeName(name)}`);
              return retArr;
          }
        }

        const markupName = `${origin}_${utils.sanitizeName(name)}`;

        switch (type) {
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
            this.astGeneric(mNode.object, retArr);
            retArr.push('[');
            retArr.push(this.memberExpressionPropertyMarkup(xProperty));
            retArr.push(']');
            break;
          case 'HTMLImageArray':
            retArr.push(`getImage3D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'ArrayTexture(1)':
            retArr.push(`getFloatFromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'Array1D(2)':
          case 'Array2D(2)':
          case 'Array3D(2)':
            retArr.push(`getMemoryOptimizedVec2(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'ArrayTexture(2)':
            retArr.push(`getVec2FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'Array1D(3)':
          case 'Array2D(3)':
          case 'Array3D(3)':
            retArr.push(`getMemoryOptimizedVec3(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'ArrayTexture(3)':
            retArr.push(`getVec3FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'Array1D(4)':
          case 'Array2D(4)':
          case 'Array3D(4)':
            retArr.push(`getMemoryOptimizedVec4(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'ArrayTexture(4)':
          case 'HTMLCanvas':
          case 'HTMLImage':
          case 'HTMLVideo':
            retArr.push(`getVec4FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          case 'NumberTexture':
          case 'Array':
          case 'Array2D':
          case 'Array3D':
          case 'Array4D':
          case 'Input':
          case 'Number':
          case 'Float':
          case 'Integer':
            if (this.precision === 'single') {
              retArr.push(`getMemoryOptimized32(${markupName}, ${markupName}Size, ${markupName}Dim, `);
              this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
              retArr.push(')');
            } else {
              const bitRatio = (origin === 'user' ?
                this.lookupFunctionArgumentBitRatio(this.name, name) :
                this.constantBitRatios[name]
              );
              switch (bitRatio) {
                case 1:
                  retArr.push(`get8(${markupName}, ${markupName}Size, ${markupName}Dim, `);
                  break;
                case 2:
                  retArr.push(`get16(${markupName}, ${markupName}Size, ${markupName}Dim, `);
                  break;
                case 4:
                case 0:
                  retArr.push(`get32(${markupName}, ${markupName}Size, ${markupName}Dim, `);
                  break;
                default:
                  throw new Error(`unhandled bit ratio of ${bitRatio}`);
              }
              this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
              retArr.push(')');
            }
            break;
          case 'MemoryOptimizedNumberTexture':
            retArr.push(`getMemoryOptimized32(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
            this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
            retArr.push(')');
            break;
          default:
            throw new Error(`unhandled member expression "${ type }"`);
        }
        return retArr;
      }

      astCallExpression(ast, retArr) {
        if (!ast.callee) {
          throw this.astErrorOutput('Unknown CallExpression', ast);
        }

        let functionName = null;
        const isMathFunction = this.isAstMathFunction(ast);

        if (isMathFunction || (ast.callee.object && ast.callee.object.type === 'ThisExpression')) {
          functionName = ast.callee.property.name;
        }
        else if (ast.callee.type === 'SequenceExpression' && ast.callee.expressions[0].type === 'Literal' && !isNaN(ast.callee.expressions[0].raw)) {
          functionName = ast.callee.expressions[1].property.name;
        } else {
          functionName = ast.callee.name;
        }

        if (!functionName) {
          throw this.astErrorOutput(`Unhandled function, couldn't find name`, ast);
        }

        switch (functionName) {
          case 'pow':
            functionName = '_pow';
            break;
          case 'round':
            functionName = '_round';
            break;
        }

        if (this.calledFunctions.indexOf(functionName) < 0) {
          this.calledFunctions.push(functionName);
        }

        if (functionName === 'random' && this.plugins && this.plugins.length > 0) {
          for (let i = 0; i < this.plugins.length; i++) {
            const plugin = this.plugins[i];
            if (plugin.functionMatch === 'Math.random()' && plugin.functionReplace) {
              retArr.push(plugin.functionReplace);
              return retArr;
            }
          }
        }

        if (this.onFunctionCall) {
          this.onFunctionCall(this.name, functionName, ast.arguments);
        }

        retArr.push(functionName);

        retArr.push('(');

        if (isMathFunction) {
          for (let i = 0; i < ast.arguments.length; ++i) {
            const argument = ast.arguments[i];
            const argumentType = this.getType(argument);
            if (i > 0) {
              retArr.push(', ');
            }

            switch (argumentType) {
              case 'Integer':
                this.castValueToFloat(argument, retArr);
                break;
              default:
                this.astGeneric(argument, retArr);
                break;
            }
          }
        } else {
          const targetTypes = this.lookupFunctionArgumentTypes(functionName) || [];
          for (let i = 0; i < ast.arguments.length; ++i) {
            const argument = ast.arguments[i];
            let targetType = targetTypes[i];
            if (i > 0) {
              retArr.push(', ');
            }
            const argumentType = this.getType(argument);
            if (!targetType) {
              this.triggerImplyArgumentType(functionName, i, argumentType, this);
              targetType = argumentType;
            }
            switch (argumentType) {
              case 'Boolean':
                this.astGeneric(argument, retArr);
                continue;
              case 'Number':
              case 'Float':
                if (targetType === 'Integer') {
                  retArr.push('int(');
                  this.astGeneric(argument, retArr);
                  retArr.push(')');
                  continue;
                } else if (targetType === 'Number' || targetType === 'Float') {
                  this.astGeneric(argument, retArr);
                  continue;
                } else if (targetType === 'LiteralInteger') {
                  this.castLiteralToFloat(argument, retArr);
                  continue;
                }
                break;
              case 'Integer':
                if (targetType === 'Number' || targetType === 'Float') {
                  retArr.push('float(');
                  this.astGeneric(argument, retArr);
                  retArr.push(')');
                  continue;
                } else if (targetType === 'Integer') {
                  this.astGeneric(argument, retArr);
                  continue;
                }
                break;
              case 'LiteralInteger':
                if (targetType === 'Integer') {
                  this.castLiteralToInteger(argument, retArr);
                  continue;
                } else if (targetType === 'Number' || targetType === 'Float') {
                  this.castLiteralToFloat(argument, retArr);
                  continue;
                } else if (targetType === 'LiteralInteger') {
                  this.astGeneric(argument, retArr);
                  continue;
                }
                break;
              case 'Array(2)':
              case 'Array(3)':
              case 'Array(4)':
                if (targetType === argumentType) {
                  if (argument.type === 'Identifier') {
                    retArr.push(`user_${utils.sanitizeName(argument.name)}`);
                  } else if (argument.type === 'ArrayExpression' || argument.type === 'MemberExpression' || argument.type === 'CallExpression') {
                    this.astGeneric(argument, retArr);
                  } else {
                    throw this.astErrorOutput(`Unhandled argument type ${ argument.type }`, ast);
                  }
                  continue;
                }
                break;
              case 'HTMLCanvas':
              case 'HTMLImage':
              case 'HTMLImageArray':
              case 'HTMLVideo':
              case 'ArrayTexture(1)':
              case 'ArrayTexture(2)':
              case 'ArrayTexture(3)':
              case 'ArrayTexture(4)':
              case 'Array':
              case 'Input':
                if (targetType === argumentType) {
                  if (argument.type !== 'Identifier') throw this.astErrorOutput(`Unhandled argument type ${ argument.type }`, ast);
                  this.triggerImplyArgumentBitRatio(this.name, argument.name, functionName, i);
                  const name = utils.sanitizeName(argument.name);
                  retArr.push(`user_${name},user_${name}Size,user_${name}Dim`);
                  continue;
                }
                break;
            }
            throw this.astErrorOutput(`Unhandled argument combination of ${ argumentType } and ${ targetType } for argument named "${ argument.name }"`, ast);
          }
        }
        retArr.push(')');

        return retArr;
      }

      astArrayExpression(arrNode, retArr) {
        const arrLen = arrNode.elements.length;

        retArr.push('vec' + arrLen + '(');
        for (let i = 0; i < arrLen; ++i) {
          if (i > 0) {
            retArr.push(', ');
          }
          const subNode = arrNode.elements[i];
          this.astGeneric(subNode, retArr);
        }
        retArr.push(')');

        return retArr;
      }

      memberExpressionXYZ(x, y, z, retArr) {
        if (z) {
          retArr.push(this.memberExpressionPropertyMarkup(z), ', ');
        } else {
          retArr.push('0, ');
        }
        if (y) {
          retArr.push(this.memberExpressionPropertyMarkup(y), ', ');
        } else {
          retArr.push('0, ');
        }
        retArr.push(this.memberExpressionPropertyMarkup(x));
        return retArr;
      }

      memberExpressionPropertyMarkup(property) {
        if (!property) {
          throw new Error('Property not set');
        }
        const type = this.getType(property);
        const result = [];
        switch (type) {
          case 'Number':
          case 'Float':
            this.castValueToInteger(property, result);
            break;
          case 'LiteralInteger':
            this.castLiteralToInteger(property, result);
            break;
          default:
            this.astGeneric(property, result);
        }
        return result.join('');
      }
    }

    const typeMap = {
      'Array': 'sampler2D',
      'Array(2)': 'vec2',
      'Array(3)': 'vec3',
      'Array(4)': 'vec4',
      'Array2D': 'sampler2D',
      'Array3D': 'sampler2D',
      'Boolean': 'bool',
      'Float': 'float',
      'Input': 'sampler2D',
      'Integer': 'int',
      'Number': 'float',
      'LiteralInteger': 'float',
      'NumberTexture': 'sampler2D',
      'MemoryOptimizedNumberTexture': 'sampler2D',
      'ArrayTexture(1)': 'sampler2D',
      'ArrayTexture(2)': 'sampler2D',
      'ArrayTexture(3)': 'sampler2D',
      'ArrayTexture(4)': 'sampler2D',
      'HTMLVideo': 'sampler2D',
      'HTMLCanvas': 'sampler2D',
      'HTMLImage': 'sampler2D',
      'HTMLImageArray': 'sampler2DArray',
    };

    const operatorMap = {
      '===': '==',
      '!==': '!='
    };

    module.exports = {
      WebGLFunctionNode
    };
    },{"../../utils":114,"../function-node":10}],39:[function(require,module,exports){
    const { WebGLKernelValueBoolean } = require('./kernel-value/boolean');
    const { WebGLKernelValueFloat } = require('./kernel-value/float');
    const { WebGLKernelValueInteger } = require('./kernel-value/integer');

    const { WebGLKernelValueHTMLImage } = require('./kernel-value/html-image');
    const { WebGLKernelValueDynamicHTMLImage } = require('./kernel-value/dynamic-html-image');

    const { WebGLKernelValueHTMLVideo } = require('./kernel-value/html-video');
    const { WebGLKernelValueDynamicHTMLVideo } = require('./kernel-value/dynamic-html-video');

    const { WebGLKernelValueSingleInput } = require('./kernel-value/single-input');
    const { WebGLKernelValueDynamicSingleInput } = require('./kernel-value/dynamic-single-input');

    const { WebGLKernelValueUnsignedInput } = require('./kernel-value/unsigned-input');
    const { WebGLKernelValueDynamicUnsignedInput } = require('./kernel-value/dynamic-unsigned-input');

    const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('./kernel-value/memory-optimized-number-texture');
    const { WebGLKernelValueDynamicMemoryOptimizedNumberTexture } = require('./kernel-value/dynamic-memory-optimized-number-texture');

    const { WebGLKernelValueNumberTexture } = require('./kernel-value/number-texture');
    const { WebGLKernelValueDynamicNumberTexture } = require('./kernel-value/dynamic-number-texture');

    const { WebGLKernelValueSingleArray } = require('./kernel-value/single-array');
    const { WebGLKernelValueDynamicSingleArray } = require('./kernel-value/dynamic-single-array');

    const { WebGLKernelValueSingleArray1DI } = require('./kernel-value/single-array1d-i');
    const { WebGLKernelValueDynamicSingleArray1DI } = require('./kernel-value/dynamic-single-array1d-i');

    const { WebGLKernelValueSingleArray2DI } = require('./kernel-value/single-array2d-i');
    const { WebGLKernelValueDynamicSingleArray2DI } = require('./kernel-value/dynamic-single-array2d-i');

    const { WebGLKernelValueSingleArray3DI } = require('./kernel-value/single-array3d-i');
    const { WebGLKernelValueDynamicSingleArray3DI } = require('./kernel-value/dynamic-single-array3d-i');

    const { WebGLKernelValueSingleArray2 } = require('./kernel-value/single-array2');
    const { WebGLKernelValueSingleArray3 } = require('./kernel-value/single-array3');
    const { WebGLKernelValueSingleArray4 } = require('./kernel-value/single-array4');

    const { WebGLKernelValueUnsignedArray } = require('./kernel-value/unsigned-array');
    const { WebGLKernelValueDynamicUnsignedArray } = require('./kernel-value/dynamic-unsigned-array');

    const kernelValueMaps = {
      unsigned: {
        dynamic: {
          'Boolean': WebGLKernelValueBoolean,
          'Integer': WebGLKernelValueInteger,
          'Float': WebGLKernelValueFloat,
          'Array': WebGLKernelValueDynamicUnsignedArray,
          'Array(2)': false,
          'Array(3)': false,
          'Array(4)': false,
          'Array1D(2)': false,
          'Array1D(3)': false,
          'Array1D(4)': false,
          'Array2D(2)': false,
          'Array2D(3)': false,
          'Array2D(4)': false,
          'Array3D(2)': false,
          'Array3D(3)': false,
          'Array3D(4)': false,
          'Input': WebGLKernelValueDynamicUnsignedInput,
          'NumberTexture': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(1)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(2)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(3)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(4)': WebGLKernelValueDynamicNumberTexture,
          'MemoryOptimizedNumberTexture': WebGLKernelValueDynamicMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGLKernelValueDynamicHTMLImage,
          'HTMLImage': WebGLKernelValueDynamicHTMLImage,
          'HTMLImageArray': false,
          'HTMLVideo': WebGLKernelValueDynamicHTMLVideo,
        },
        static: {
          'Boolean': WebGLKernelValueBoolean,
          'Float': WebGLKernelValueFloat,
          'Integer': WebGLKernelValueInteger,
          'Array': WebGLKernelValueUnsignedArray,
          'Array(2)': false,
          'Array(3)': false,
          'Array(4)': false,
          'Array1D(2)': false,
          'Array1D(3)': false,
          'Array1D(4)': false,
          'Array2D(2)': false,
          'Array2D(3)': false,
          'Array2D(4)': false,
          'Array3D(2)': false,
          'Array3D(3)': false,
          'Array3D(4)': false,
          'Input': WebGLKernelValueUnsignedInput,
          'NumberTexture': WebGLKernelValueNumberTexture,
          'ArrayTexture(1)': WebGLKernelValueNumberTexture,
          'ArrayTexture(2)': WebGLKernelValueNumberTexture,
          'ArrayTexture(3)': WebGLKernelValueNumberTexture,
          'ArrayTexture(4)': WebGLKernelValueNumberTexture,
          'MemoryOptimizedNumberTexture': WebGLKernelValueMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGLKernelValueHTMLImage,
          'HTMLImage': WebGLKernelValueHTMLImage,
          'HTMLImageArray': false,
          'HTMLVideo': WebGLKernelValueHTMLVideo,
        }
      },
      single: {
        dynamic: {
          'Boolean': WebGLKernelValueBoolean,
          'Integer': WebGLKernelValueInteger,
          'Float': WebGLKernelValueFloat,
          'Array': WebGLKernelValueDynamicSingleArray,
          'Array(2)': WebGLKernelValueSingleArray2,
          'Array(3)': WebGLKernelValueSingleArray3,
          'Array(4)': WebGLKernelValueSingleArray4,
          'Array1D(2)': WebGLKernelValueDynamicSingleArray1DI,
          'Array1D(3)': WebGLKernelValueDynamicSingleArray1DI,
          'Array1D(4)': WebGLKernelValueDynamicSingleArray1DI,
          'Array2D(2)': WebGLKernelValueDynamicSingleArray2DI,
          'Array2D(3)': WebGLKernelValueDynamicSingleArray2DI,
          'Array2D(4)': WebGLKernelValueDynamicSingleArray2DI,
          'Array3D(2)': WebGLKernelValueDynamicSingleArray3DI,
          'Array3D(3)': WebGLKernelValueDynamicSingleArray3DI,
          'Array3D(4)': WebGLKernelValueDynamicSingleArray3DI,
          'Input': WebGLKernelValueDynamicSingleInput,
          'NumberTexture': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(1)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(2)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(3)': WebGLKernelValueDynamicNumberTexture,
          'ArrayTexture(4)': WebGLKernelValueDynamicNumberTexture,
          'MemoryOptimizedNumberTexture': WebGLKernelValueDynamicMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGLKernelValueDynamicHTMLImage,
          'HTMLImage': WebGLKernelValueDynamicHTMLImage,
          'HTMLImageArray': false,
          'HTMLVideo': WebGLKernelValueDynamicHTMLVideo,
        },
        static: {
          'Boolean': WebGLKernelValueBoolean,
          'Float': WebGLKernelValueFloat,
          'Integer': WebGLKernelValueInteger,
          'Array': WebGLKernelValueSingleArray,
          'Array(2)': WebGLKernelValueSingleArray2,
          'Array(3)': WebGLKernelValueSingleArray3,
          'Array(4)': WebGLKernelValueSingleArray4,
          'Array1D(2)': WebGLKernelValueSingleArray1DI,
          'Array1D(3)': WebGLKernelValueSingleArray1DI,
          'Array1D(4)': WebGLKernelValueSingleArray1DI,
          'Array2D(2)': WebGLKernelValueSingleArray2DI,
          'Array2D(3)': WebGLKernelValueSingleArray2DI,
          'Array2D(4)': WebGLKernelValueSingleArray2DI,
          'Array3D(2)': WebGLKernelValueSingleArray3DI,
          'Array3D(3)': WebGLKernelValueSingleArray3DI,
          'Array3D(4)': WebGLKernelValueSingleArray3DI,
          'Input': WebGLKernelValueSingleInput,
          'NumberTexture': WebGLKernelValueNumberTexture,
          'ArrayTexture(1)': WebGLKernelValueNumberTexture,
          'ArrayTexture(2)': WebGLKernelValueNumberTexture,
          'ArrayTexture(3)': WebGLKernelValueNumberTexture,
          'ArrayTexture(4)': WebGLKernelValueNumberTexture,
          'MemoryOptimizedNumberTexture': WebGLKernelValueMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGLKernelValueHTMLImage,
          'HTMLImage': WebGLKernelValueHTMLImage,
          'HTMLImageArray': false,
          'HTMLVideo': WebGLKernelValueHTMLVideo,
        }
      },
    };

    function lookupKernelValueType(type, dynamic, precision, value) {
      if (!type) {
        throw new Error('type missing');
      }
      if (!dynamic) {
        throw new Error('dynamic missing');
      }
      if (!precision) {
        throw new Error('precision missing');
      }
      if (value.type) {
        type = value.type;
      }
      const types = kernelValueMaps[precision][dynamic];
      if (types[type] === false) {
        return null;
      } else if (types[type] === undefined) {
        throw new Error(`Could not find a KernelValue for ${ type }`);
      }
      return types[type];
    }

    module.exports = {
      lookupKernelValueType,
      kernelValueMaps,
    };
    },{"./kernel-value/boolean":41,"./kernel-value/dynamic-html-image":42,"./kernel-value/dynamic-html-video":43,"./kernel-value/dynamic-memory-optimized-number-texture":44,"./kernel-value/dynamic-number-texture":45,"./kernel-value/dynamic-single-array":46,"./kernel-value/dynamic-single-array1d-i":47,"./kernel-value/dynamic-single-array2d-i":48,"./kernel-value/dynamic-single-array3d-i":49,"./kernel-value/dynamic-single-input":50,"./kernel-value/dynamic-unsigned-array":51,"./kernel-value/dynamic-unsigned-input":52,"./kernel-value/float":53,"./kernel-value/html-image":54,"./kernel-value/html-video":55,"./kernel-value/integer":57,"./kernel-value/memory-optimized-number-texture":58,"./kernel-value/number-texture":59,"./kernel-value/single-array":60,"./kernel-value/single-array1d-i":61,"./kernel-value/single-array2":62,"./kernel-value/single-array2d-i":63,"./kernel-value/single-array3":64,"./kernel-value/single-array3d-i":65,"./kernel-value/single-array4":66,"./kernel-value/single-input":67,"./kernel-value/unsigned-array":68,"./kernel-value/unsigned-input":69}],40:[function(require,module,exports){
    const { WebGLKernelValue } = require('./index');
    const { Input } = require('../../../input');

    class WebGLKernelArray extends WebGLKernelValue {
      checkSize(width, height) {
        if (!this.kernel.validate) return;
        const { maxTextureSize } = this.kernel.constructor.features;
        if (width > maxTextureSize || height > maxTextureSize) {
          if (width > height) {
            throw new Error(`Argument texture width of ${width} larger than maximum size of ${maxTextureSize} for your GPU`);
          } else if (width < height) {
            throw new Error(`Argument texture height of ${height} larger than maximum size of ${maxTextureSize} for your GPU`);
          } else {
            throw new Error(`Argument texture height and width of ${height} larger than maximum size of ${maxTextureSize} for your GPU`);
          }
        }
      }

      setup() {
        this.requestTexture();
        this.setupTexture();
        this.defineTexture();
      }

      requestTexture() {
        this.texture = this.onRequestTexture();
      }

      defineTexture() {
        const { context: gl } = this;
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      }

      setupTexture() {
        this.contextHandle = this.onRequestContextHandle();
        this.index = this.onRequestIndex();
        this.dimensionsId = this.id + 'Dim';
        this.sizeId = this.id + 'Size';
      }

      getBitRatio(value) {
        if (Array.isArray(value[0])) {
          return this.getBitRatio(value[0]);
        } else if (value.constructor === Input) {
          return this.getBitRatio(value.value);
        }
        switch (value.constructor) {
          case Uint8ClampedArray:
          case Uint8Array:
          case Int8Array:
            return 1;
          case Uint16Array:
          case Int16Array:
            return 2;
          case Float32Array:
          case Int32Array:
          default:
            return 4;
        }
      }

      destroy() {
        if (this.prevArg) {
          this.prevArg.delete();
        }
        this.context.deleteTexture(this.texture);
      }
    }

    module.exports = {
      WebGLKernelArray
    };
    },{"../../../input":110,"./index":56}],41:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueBoolean extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          return `const bool ${this.id} = ${value};\n`;
        }
        return `uniform bool ${this.id};\n`;
      }

      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform1i(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueBoolean
    };
    },{"../../../utils":114,"./index":56}],42:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueHTMLImage } = require('./html-image');

    class WebGLKernelValueDynamicHTMLImage extends WebGLKernelValueHTMLImage {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        const { width, height } = value;
        this.checkSize(width, height);
        this.dimensions = [width, height, 1];
        this.textureSize = [width, height];
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicHTMLImage
    };
    },{"../../../utils":114,"./html-image":54}],43:[function(require,module,exports){
    const { WebGLKernelValueDynamicHTMLImage } = require('./dynamic-html-image');

    class WebGLKernelValueDynamicHTMLVideo extends WebGLKernelValueDynamicHTMLImage {}

    module.exports = {
      WebGLKernelValueDynamicHTMLVideo
    };
    },{"./dynamic-html-image":42}],44:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('./memory-optimized-number-texture');

    class WebGLKernelValueDynamicMemoryOptimizedNumberTexture extends WebGLKernelValueMemoryOptimizedNumberTexture {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(inputTexture) {
        this.dimensions = inputTexture.dimensions;
        this.checkSize(inputTexture.size[0], inputTexture.size[1]);
        this.textureSize = inputTexture.size;
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(inputTexture);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicMemoryOptimizedNumberTexture
    };
    },{"../../../utils":114,"./memory-optimized-number-texture":58}],45:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueNumberTexture } = require('./number-texture');

    class WebGLKernelValueDynamicNumberTexture extends WebGLKernelValueNumberTexture {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.dimensions = value.dimensions;
        this.checkSize(value.size[0], value.size[1]);
        this.textureSize = value.size;
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicNumberTexture
    };
    },{"../../../utils":114,"./number-texture":59}],46:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray } = require('./single-array');

    class WebGLKernelValueDynamicSingleArray extends WebGLKernelValueSingleArray {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.dimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicSingleArray
    };
    },{"../../../utils":114,"./single-array":60}],47:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray1DI } = require('./single-array1d-i');

    class WebGLKernelValueDynamicSingleArray1DI extends WebGLKernelValueSingleArray1DI {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicSingleArray1DI
    };
    },{"../../../utils":114,"./single-array1d-i":61}],48:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray2DI } = require('./single-array2d-i');

    class WebGLKernelValueDynamicSingleArray2DI extends WebGLKernelValueSingleArray2DI {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicSingleArray2DI
    };
    },{"../../../utils":114,"./single-array2d-i":63}],49:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray3DI } = require('./single-array3d-i');

    class WebGLKernelValueDynamicSingleArray3DI extends WebGLKernelValueSingleArray3DI {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicSingleArray3DI
    };
    },{"../../../utils":114,"./single-array3d-i":65}],50:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleInput } = require('./single-input');

    class WebGLKernelValueDynamicSingleInput extends WebGLKernelValueSingleInput {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        let [w, h, d] = value.size;
        this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicSingleInput
    };
    },{"../../../utils":114,"./single-input":67}],51:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueUnsignedArray } = require('./unsigned-array');

    class WebGLKernelValueDynamicUnsignedArray extends WebGLKernelValueUnsignedArray {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.dimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        const Type = this.getTransferArrayType(value);
        this.preUploadValue = new Type(this.uploadArrayLength);
        this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicUnsignedArray
    };
    },{"../../../utils":114,"./unsigned-array":68}],52:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueUnsignedInput } = require('./unsigned-input');

    class WebGLKernelValueDynamicUnsignedInput extends WebGLKernelValueUnsignedInput {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        let [w, h, d] = value.size;
        this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
        this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        const Type = this.getTransferArrayType(value.value);
        this.preUploadValue = new Type(this.uploadArrayLength);
        this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGLKernelValueDynamicUnsignedInput
    };
    },{"../../../utils":114,"./unsigned-input":69}],53:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueFloat extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          if (Number.isInteger(value)) {
            return `const float ${this.id} = ${value}.0;\n`;
          }
          return `const float ${this.id} = ${value};\n`;
        }
        return `uniform float ${this.id};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform1f(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueFloat
    };
    },{"../../../utils":114,"./index":56}],54:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueHTMLImage extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        const { width, height } = value;
        this.checkSize(width, height);
        this.dimensions = [width, height, 1];
        this.textureSize = [width, height];
        this.uploadValue = value;
      }

      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(inputImage) {
        if (inputImage.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(inputImage.constructor);
          return;
        }
        const { context: gl } = this;
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue = inputImage);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueHTMLImage
    };
    },{"../../../utils":114,"./array":40}],55:[function(require,module,exports){
    const { WebGLKernelValueHTMLImage } = require('./html-image');

    class WebGLKernelValueHTMLVideo extends WebGLKernelValueHTMLImage {}

    module.exports = {
      WebGLKernelValueHTMLVideo
    };
    },{"./html-image":54}],56:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { KernelValue } = require('../../kernel-value');

    class WebGLKernelValue extends KernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.dimensionsId = null;
        this.sizeId = null;
        this.initialValueConstructor = value.constructor;
        this.onRequestTexture = settings.onRequestTexture;
        this.onRequestIndex = settings.onRequestIndex;
        this.uploadValue = null;
        this.textureSize = null;
        this.bitRatio = null;
        this.prevArg = null;
      }

      get id() {
        return `${this.origin}_${utils.sanitizeName(this.name)}`;
      }

      setup() {}

      getTransferArrayType(value) {
        if (Array.isArray(value[0])) {
          return this.getTransferArrayType(value[0]);
        }
        switch (value.constructor) {
          case Array:
          case Int32Array:
          case Int16Array:
          case Int8Array:
            return Float32Array;
          case Uint8ClampedArray:
          case Uint8Array:
          case Uint16Array:
          case Uint32Array:
          case Float32Array:
          case Float64Array:
            return value.constructor;
        }
        console.warn('Unfamiliar constructor type.  Will go ahead and use, but likley this may result in a transfer of zeros');
        return value.constructor;
      }

      getStringValueHandler() {
        throw new Error(`"getStringValueHandler" not implemented on ${this.constructor.name}`);
      }

      getVariablePrecisionString() {
        return this.kernel.getVariablePrecisionString(this.textureSize || undefined, this.tactic || undefined);
      }

      destroy() {}
    }

    module.exports = {
      WebGLKernelValue
    };
    },{"../../../utils":114,"../../kernel-value":35}],57:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueInteger extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          return `const int ${this.id} = ${ parseInt(value) };\n`;
        }
        return `uniform int ${this.id};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform1i(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueInteger
    };
    },{"../../../utils":114,"./index":56}],58:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    const sameError = `Source and destination textures are the same.  Use immutable = true and manually cleanup kernel output texture memory with texture.delete()`;

    class WebGLKernelValueMemoryOptimizedNumberTexture extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        const [width, height] = value.size;
        this.checkSize(width, height);
        this.dimensions = value.dimensions;
        this.textureSize = value.size;
        this.uploadValue = value.texture;
        this.forceUploadEachRun = true;
      }

      setup() {
        this.setupTexture();
      }

      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName}.texture;\n`;
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(inputTexture) {
        if (inputTexture.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(inputTexture.constructor);
          return;
        }
        if (this.checkContext && inputTexture.context !== this.context) {
          throw new Error(`Value ${this.name} (${this.type}) must be from same context`);
        }

        const { kernel, context: gl } = this;
        if (kernel.pipeline) {
          if (kernel.immutable) {
            kernel.updateTextureArgumentRefs(this, inputTexture);
          } else {
            if (kernel.texture.texture === inputTexture.texture) {
              throw new Error(sameError);
            } else if (kernel.mappedTextures) {
              const { mappedTextures } = kernel;
              for (let i = 0; i < mappedTextures.length; i++) {
                if (mappedTextures[i].texture === inputTexture.texture) {
                  throw new Error(sameError);
                }
              }
            }
          }
        }

        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.uploadValue = inputTexture.texture);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueMemoryOptimizedNumberTexture,
      sameError
    };
    },{"../../../utils":114,"./array":40}],59:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');
    const { sameError } = require('./memory-optimized-number-texture');

    class WebGLKernelValueNumberTexture extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        const [width, height] = value.size;
        this.checkSize(width, height);
        const { size: textureSize, dimensions } = value;
        this.bitRatio = this.getBitRatio(value);
        this.dimensions = dimensions;
        this.textureSize = textureSize;
        this.uploadValue = value.texture;
        this.forceUploadEachRun = true;
      }

      setup() {
        this.setupTexture();
      }

      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName}.texture;\n`;
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(inputTexture) {
        if (inputTexture.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(inputTexture.constructor);
          return;
        }
        if (this.checkContext && inputTexture.context !== this.context) {
          throw new Error(`Value ${this.name} (${this.type}) must be from same context`);
        }

        const { kernel, context: gl } = this;
        if (kernel.pipeline) {
          if (kernel.immutable) {
            kernel.updateTextureArgumentRefs(this, inputTexture);
          } else {
            if (kernel.texture.texture === inputTexture.texture) {
              throw new Error(sameError);
            } else if (kernel.mappedTextures) {
              const { mappedTextures } = kernel;
              for (let i = 0; i < mappedTextures.length; i++) {
                if (mappedTextures[i].texture === inputTexture.texture) {
                  throw new Error(sameError);
                }
              }
            }
          }
        }

        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.uploadValue = inputTexture.texture);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueNumberTexture
    };
    },{"../../../utils":114,"./array":40,"./memory-optimized-number-texture":58}],60:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueSingleArray extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = 4;
        this.dimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
          `flattenTo(${this.varName}, uploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray
    };
    },{"../../../utils":114,"./array":40}],61:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueSingleArray1DI extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = 4;
        this.setShape(value);
      }

      setShape(value) {
        const valueDimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
        this.dimensions = new Int32Array([valueDimensions[1], 1, 1]);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
          `flattenTo(${this.varName}, uploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flatten2dArrayTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray1DI
    };
    },{"../../../utils":114,"./array":40}],62:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueSingleArray2 extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          return `const vec2 ${this.id} = vec2(${value[0]},${value[1]});\n`;
        }
        return `uniform vec2 ${this.id};\n`;
      }

      getStringValueHandler() {
        if (this.origin === 'constants') return '';
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform2fv(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray2
    };
    },{"../../../utils":114,"./index":56}],63:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueSingleArray2DI extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = 4;
        this.setShape(value);
      }

      setShape(value) {
        const valueDimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
        this.dimensions = new Int32Array([valueDimensions[1], valueDimensions[2], 1]);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
          `flattenTo(${this.varName}, uploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flatten3dArrayTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray2DI
    };
    },{"../../../utils":114,"./array":40}],64:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueSingleArray3 extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          return `const vec3 ${this.id} = vec3(${value[0]},${value[1]},${value[2]});\n`;
        }
        return `uniform vec3 ${this.id};\n`;
      }

      getStringValueHandler() {
        if (this.origin === 'constants') return '';
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform3fv(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray3
    };
    },{"../../../utils":114,"./index":56}],65:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueSingleArray3DI extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = 4;
        this.setShape(value);
      }

      setShape(value) {
        const valueDimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
        this.dimensions = new Int32Array([valueDimensions[1], valueDimensions[2], valueDimensions[3]]);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
          `flattenTo(${this.varName}, uploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flatten4dArrayTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray3DI
    };
    },{"../../../utils":114,"./array":40}],66:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValue } = require('./index');

    class WebGLKernelValueSingleArray4 extends WebGLKernelValue {
      constructor(value, settings) {
        super(value, settings);
        this.uploadValue = value;
      }
      getSource(value) {
        if (this.origin === 'constants') {
          return `const vec4 ${this.id} = vec4(${value[0]},${value[1]},${value[2]},${value[3]});\n`;
        }
        return `uniform vec4 ${this.id};\n`;
      }

      getStringValueHandler() {
        if (this.origin === 'constants') return '';
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform4fv(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGLKernelValueSingleArray4
    };
    },{"../../../utils":114,"./index":56}],67:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueSingleInput extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = 4;
        let [w, h, d] = value.size;
        this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
          `flattenTo(${this.varName}.value, uploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(input) {
        if (input.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(input.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(input.value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueSingleInput
    };
    },{"../../../utils":114,"./array":40}],68:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueUnsignedArray extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = this.getBitRatio(value);
        this.dimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.TranserArrayType = this.getTransferArrayType(value);
        this.preUploadValue = new this.TranserArrayType(this.uploadArrayLength);
        this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const preUploadValue_${this.name} = new ${this.TranserArrayType.name}(${this.uploadArrayLength})`,
          `const uploadValue_${this.name} = new Uint8Array(preUploadValue_${this.name}.buffer)`,
          `flattenTo(${this.varName}, preUploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.preUploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueUnsignedArray
    };
    },{"../../../utils":114,"./array":40}],69:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('./array');

    class WebGLKernelValueUnsignedInput extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.bitRatio = this.getBitRatio(value);
        const [w, h, d] = value.size;
        this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
        this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.TranserArrayType = this.getTransferArrayType(value.value);
        this.preUploadValue = new this.TranserArrayType(this.uploadArrayLength);
        this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
      }

      getStringValueHandler() {
        return utils.linesToString([
          `const preUploadValue_${this.name} = new ${this.TranserArrayType.name}(${this.uploadArrayLength})`,
          `const uploadValue_${this.name} = new Uint8Array(preUploadValue_${this.name}.buffer)`,
          `flattenTo(${this.varName}.value, preUploadValue_${this.name})`,
        ]);
      }

      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(input) {
        if (input.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(input.value, this.preUploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGLKernelValueUnsignedInput
    };
    },{"../../../utils":114,"./array":40}],70:[function(require,module,exports){
    const { GLKernel } = require('../gl/kernel');
    const { FunctionBuilder } = require('../function-builder');
    const { WebGLFunctionNode } = require('./function-node');
    const { utils } = require('../../utils');
    const mrud = require('../../plugins/math-random-uniformly-distributed');
    const { fragmentShader } = require('./fragment-shader');
    const { vertexShader } = require('./vertex-shader');
    const { glKernelString } = require('../gl/kernel-string');
    const { lookupKernelValueType } = require('./kernel-value-maps');

    let isSupported = null;
    let testCanvas = null;
    let testContext = null;
    let testExtensions = null;
    let features = null;

    const plugins = [mrud];
    const canvases = [];
    const maxTexSizes = {};


    class WebGLKernel extends GLKernel {
      static get isSupported() {
        if (isSupported !== null) {
          return isSupported;
        }
        this.setupFeatureChecks();
        isSupported = this.isContextMatch(testContext);
        return isSupported;
      }

      static setupFeatureChecks() {
        if (typeof document !== 'undefined') {
          testCanvas = document.createElement('canvas');
        } else if (typeof OffscreenCanvas !== 'undefined') {
          testCanvas = new OffscreenCanvas(0, 0);
        }
        if (!testCanvas) return;
        testContext = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        if (!testContext || !testContext.getExtension) return;
        testExtensions = {
          OES_texture_float: testContext.getExtension('OES_texture_float'),
          OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
          OES_element_index_uint: testContext.getExtension('OES_element_index_uint'),
          WEBGL_draw_buffers: testContext.getExtension('WEBGL_draw_buffers'),
        };
        features = this.getFeatures();
      }

      static isContextMatch(context) {
        if (typeof WebGLRenderingContext !== 'undefined') {
          return context instanceof WebGLRenderingContext;
        }
        return false;
      }

      static getIsTextureFloat() {
        return Boolean(testExtensions.OES_texture_float);
      }

      static getIsDrawBuffers() {
        return Boolean(testExtensions.WEBGL_draw_buffers);
      }

      static getChannelCount() {
        return testExtensions.WEBGL_draw_buffers ?
          testContext.getParameter(testExtensions.WEBGL_draw_buffers.MAX_DRAW_BUFFERS_WEBGL) :
          1;
      }

      static getMaxTextureSize() {
        return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
      }

      static lookupKernelValueType(type, dynamic, precision, value) {
        return lookupKernelValueType(type, dynamic, precision, value);
      }

      static get testCanvas() {
        return testCanvas;
      }

      static get testContext() {
        return testContext;
      }

      static get features() {
        return features;
      }

      static get fragmentShader() {
        return fragmentShader;
      }

      static get vertexShader() {
        return vertexShader;
      }

      constructor(source, settings) {
        super(source, settings);
        this.program = null;
        this.pipeline = settings.pipeline;
        this.endianness = utils.systemEndianness();
        this.extensions = {};
        this.argumentTextureCount = 0;
        this.constantTextureCount = 0;
        this.fragShader = null;
        this.vertShader = null;
        this.drawBuffersMap = null;

        this.maxTexSize = null;
        this.onRequestSwitchKernel = null;
        this.removeIstanbulCoverage = true;

        this.texture = null;
        this.mappedTextures = null;
        this.mergeSettings(source.settings || settings);

        this.threadDim = null;
        this.framebuffer = null;
        this.buffer = null;

        this.textureCache = [];
        this.programUniformLocationCache = {};
        this.uniform1fCache = {};
        this.uniform1iCache = {};
        this.uniform2fCache = {};
        this.uniform2fvCache = {};
        this.uniform2ivCache = {};
        this.uniform3fvCache = {};
        this.uniform3ivCache = {};
        this.uniform4fvCache = {};
        this.uniform4ivCache = {};
      }

      initCanvas() {
        if (typeof document !== 'undefined') {
          const canvas = document.createElement('canvas');
          canvas.width = 2;
          canvas.height = 2;
          return canvas;
        } else if (typeof OffscreenCanvas !== 'undefined') {
          return new OffscreenCanvas(0, 0);
        }
      }

      initContext() {
        const settings = {
          alpha: false,
          depth: false,
          antialias: false
        };
        return this.canvas.getContext('webgl', settings) || this.canvas.getContext('experimental-webgl', settings);
      }

      initPlugins(settings) {
        const pluginsToUse = [];
        const { source } = this;
        if (typeof source === 'string') {
          for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (source.match(plugin.functionMatch)) {
              pluginsToUse.push(plugin);
            }
          }
        } else if (typeof source === 'object') {
          if (settings.pluginNames) { 
            for (let i = 0; i < plugins.length; i++) {
              const plugin = plugins[i];
              const usePlugin = settings.pluginNames.some(pluginName => pluginName === plugin.name);
              if (usePlugin) {
                pluginsToUse.push(plugin);
              }
            }
          }
        }
        return pluginsToUse;
      }

      initExtensions() {
        this.extensions = {
          OES_texture_float: this.context.getExtension('OES_texture_float'),
          OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
          OES_element_index_uint: this.context.getExtension('OES_element_index_uint'),
          WEBGL_draw_buffers: this.context.getExtension('WEBGL_draw_buffers'),
          WEBGL_color_buffer_float: this.context.getExtension('WEBGL_color_buffer_float'),
        };
      }

      validateSettings(args) {
        if (!this.validate) {
          this.texSize = utils.getKernelTextureSize({
            optimizeFloatMemory: this.optimizeFloatMemory,
            precision: this.precision,
          }, this.output);
          return;
        }

        const { features } = this.constructor;

        if (this.optimizeFloatMemory === true && !features.isTextureFloat) {
          throw new Error('Float textures are not supported');
        } else if (this.precision === 'single' && !features.isFloatRead) {
          throw new Error('Single precision not supported');
        } else if (!this.graphical && this.precision === null && features.isTextureFloat) {
          this.precision = features.isFloatRead ? 'single' : 'unsigned';
        }

        if (this.subKernels && this.subKernels.length > 0 && !this.extensions.WEBGL_draw_buffers) {
          throw new Error('could not instantiate draw buffers extension');
        }

        if (this.fixIntegerDivisionAccuracy === null) {
          this.fixIntegerDivisionAccuracy = !features.isIntegerDivisionAccurate;
        } else if (this.fixIntegerDivisionAccuracy && features.isIntegerDivisionAccurate) {
          this.fixIntegerDivisionAccuracy = false;
        }

        this.checkOutput();

        if (!this.output || this.output.length === 0) {
          if (args.length !== 1) {
            throw new Error('Auto output only supported for kernels with only one input');
          }

          const argType = utils.getVariableType(args[0], this.strictIntegers);
          switch (argType) {
            case 'Array':
              this.output = utils.getDimensions(argType);
              break;
            case 'NumberTexture':
            case 'MemoryOptimizedNumberTexture':
            case 'ArrayTexture(1)':
            case 'ArrayTexture(2)':
            case 'ArrayTexture(3)':
            case 'ArrayTexture(4)':
              this.output = args[0].output;
              break;
            default:
              throw new Error('Auto output not supported for input type: ' + argType);
          }
        }

        if (this.graphical) {
          if (this.output.length !== 2) {
            throw new Error('Output must have 2 dimensions on graphical mode');
          }

          if (this.precision === 'precision') {
            this.precision = 'unsigned';
            console.warn('Cannot use graphical mode and single precision at the same time');
          }

          this.texSize = utils.clone(this.output);
          return;
        } else if (this.precision === null && features.isTextureFloat) {
          this.precision = 'single';
        }

        this.texSize = utils.getKernelTextureSize({
          optimizeFloatMemory: this.optimizeFloatMemory,
          precision: this.precision,
        }, this.output);

        this.checkTextureSize();
      }

      updateMaxTexSize() {
        const { texSize, canvas } = this;
        if (this.maxTexSize === null) {
          let canvasIndex = canvases.indexOf(canvas);
          if (canvasIndex === -1) {
            canvasIndex = canvases.length;
            canvases.push(canvas);
            maxTexSizes[canvasIndex] = [texSize[0], texSize[1]];
          }
          this.maxTexSize = maxTexSizes[canvasIndex];
        }
        if (this.maxTexSize[0] < texSize[0]) {
          this.maxTexSize[0] = texSize[0];
        }
        if (this.maxTexSize[1] < texSize[1]) {
          this.maxTexSize[1] = texSize[1];
        }
      }

      setupArguments(args) {
        this.kernelArguments = [];
        this.argumentTextureCount = 0;
        const needsArgumentTypes = this.argumentTypes === null;
        if (needsArgumentTypes) {
          this.argumentTypes = [];
        }
        this.argumentSizes = [];
        this.argumentBitRatios = [];

        if (args.length < this.argumentNames.length) {
          throw new Error('not enough arguments for kernel');
        } else if (args.length > this.argumentNames.length) {
          throw new Error('too many arguments for kernel');
        }

        const { context: gl } = this;
        let textureIndexes = 0;

        const onRequestTexture = () => {
          return this.createTexture();
        };
        const onRequestIndex = () => {
          return textureIndexes++;
        };
        const onUpdateValueMismatch = (constructor) => {
          this.switchKernels({
            type: 'argumentMismatch',
            needed: constructor
          });
        };
        const onRequestContextHandle = () => {
          return gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount++;
        };

        for (let index = 0; index < args.length; index++) {
          const value = args[index];
          const name = this.argumentNames[index];
          let type;
          if (needsArgumentTypes) {
            type = utils.getVariableType(value, this.strictIntegers);
            this.argumentTypes.push(type);
          } else {
            type = this.argumentTypes[index];
          }
          const KernelValue = this.constructor.lookupKernelValueType(type, this.dynamicArguments ? 'dynamic' : 'static', this.precision, args[index]);
          if (KernelValue === null) {
            return this.requestFallback(args);
          }
          const kernelArgument = new KernelValue(value, {
            name,
            type,
            tactic: this.tactic,
            origin: 'user',
            context: gl,
            checkContext: this.checkContext,
            kernel: this,
            strictIntegers: this.strictIntegers,
            onRequestTexture,
            onRequestIndex,
            onUpdateValueMismatch,
            onRequestContextHandle,
          });
          this.kernelArguments.push(kernelArgument);
          kernelArgument.setup();
          this.argumentSizes.push(kernelArgument.textureSize);
          this.argumentBitRatios[index] = kernelArgument.bitRatio;
        }
      }

      createTexture() {
        const texture = this.context.createTexture();
        this.textureCache.push(texture);
        return texture;
      }

      setupConstants(args) {
        const { context: gl } = this;
        this.kernelConstants = [];
        this.forceUploadKernelConstants = [];
        let needsConstantTypes = this.constantTypes === null;
        if (needsConstantTypes) {
          this.constantTypes = {};
        }
        this.constantBitRatios = {};
        let textureIndexes = 0;
        for (const name in this.constants) {
          const value = this.constants[name];
          let type;
          if (needsConstantTypes) {
            type = utils.getVariableType(value, this.strictIntegers);
            this.constantTypes[name] = type;
          } else {
            type = this.constantTypes[name];
          }
          const KernelValue = this.constructor.lookupKernelValueType(type, 'static', this.precision, value);
          if (KernelValue === null) {
            return this.requestFallback(args);
          }
          const kernelValue = new KernelValue(value, {
            name,
            type,
            tactic: this.tactic,
            origin: 'constants',
            context: this.context,
            checkContext: this.checkContext,
            kernel: this,
            strictIntegers: this.strictIntegers,
            onRequestTexture: () => {
              return this.createTexture();
            },
            onRequestIndex: () => {
              return textureIndexes++;
            },
            onRequestContextHandle: () => {
              return gl.TEXTURE0 + this.constantTextureCount++;
            }
          });
          this.constantBitRatios[name] = kernelValue.bitRatio;
          this.kernelConstants.push(kernelValue);
          kernelValue.setup();
          if (kernelValue.forceUploadEachRun) {
            this.forceUploadKernelConstants.push(kernelValue);
          }
        }
      }

      build() {
        if (this.built) return;
        this.initExtensions();
        this.validateSettings(arguments);
        this.setupConstants(arguments);
        if (this.fallbackRequested) return;
        this.setupArguments(arguments);
        if (this.fallbackRequested) return;
        this.updateMaxTexSize();
        this.translateSource();
        const failureResult = this.pickRenderStrategy(arguments);
        if (failureResult) {
          return failureResult;
        }
        const { texSize, context: gl, canvas } = this;
        gl.enable(gl.SCISSOR_TEST);
        if (this.pipeline && this.precision === 'single') {
          gl.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
          canvas.width = this.maxTexSize[0];
          canvas.height = this.maxTexSize[1];
        } else {
          gl.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
          canvas.width = this.maxTexSize[0];
          canvas.height = this.maxTexSize[1];
        }
        const threadDim = this.threadDim = Array.from(this.output);
        while (threadDim.length < 3) {
          threadDim.push(1);
        }

        const compiledVertexShader = this.getVertexShader(arguments);
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, compiledVertexShader);
        gl.compileShader(vertShader);
        this.vertShader = vertShader;

        const compiledFragmentShader = this.getFragmentShader(arguments);
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, compiledFragmentShader);
        gl.compileShader(fragShader);
        this.fragShader = fragShader;

        if (this.debug) {
          console.log('GLSL Shader Output:');
          console.log(compiledFragmentShader);
        }

        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
          throw new Error('Error compiling vertex shader: ' + gl.getShaderInfoLog(vertShader));
        }
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
          throw new Error('Error compiling fragment shader: ' + gl.getShaderInfoLog(fragShader));
        }

        const program = this.program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        this.framebuffer = gl.createFramebuffer();
        this.framebuffer.width = texSize[0];
        this.framebuffer.height = texSize[1];

        const vertices = new Float32Array([-1, -1,
          1, -1, -1, 1,
          1, 1
        ]);
        const texCoords = new Float32Array([
          0, 0,
          1, 0,
          0, 1,
          1, 1
        ]);

        const texCoordOffset = vertices.byteLength;

        let buffer = this.buffer;
        if (!buffer) {
          buffer = this.buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength + texCoords.byteLength, gl.STATIC_DRAW);
        } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        }

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);

        const aPosLoc = gl.getAttribLocation(this.program, 'aPos');
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
        const aTexCoordLoc = gl.getAttribLocation(this.program, 'aTexCoord');
        gl.enableVertexAttribArray(aTexCoordLoc);
        gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        let i = 0;
        gl.useProgram(this.program);
        for (let p in this.constants) {
          this.kernelConstants[i++].updateValue(this.constants[p]);
        }

        this._setupOutputTexture();
        if (
          this.subKernels !== null &&
          this.subKernels.length > 0
        ) {
          this._mappedTextureSwitched = {};
          this._setupSubOutputTextures();
        }
        this.buildSignature(arguments);
        this.built = true;
      }

      translateSource() {
        const functionBuilder = FunctionBuilder.fromKernel(this, WebGLFunctionNode, {
          fixIntegerDivisionAccuracy: this.fixIntegerDivisionAccuracy
        });
        this.translatedSource = functionBuilder.getPrototypeString('kernel');
        this.setupReturnTypes(functionBuilder);
      }

      setupReturnTypes(functionBuilder) {
        if (!this.graphical && !this.returnType) {
          this.returnType = functionBuilder.getKernelResultType();
        }

        if (this.subKernels && this.subKernels.length > 0) {
          for (let i = 0; i < this.subKernels.length; i++) {
            const subKernel = this.subKernels[i];
            if (!subKernel.returnType) {
              subKernel.returnType = functionBuilder.getSubKernelResultType(i);
            }
          }
        }
      }

      run() {
        const { kernelArguments, texSize, forceUploadKernelConstants, context: gl } = this;

        gl.useProgram(this.program);
        gl.scissor(0, 0, texSize[0], texSize[1]);
        if (this.dynamicOutput) {
          this.setUniform3iv('uOutputDim', new Int32Array(this.threadDim));
          this.setUniform2iv('uTexSize', texSize);
        }

        this.setUniform2f('ratio', texSize[0] / this.maxTexSize[0], texSize[1] / this.maxTexSize[1]);

        for (let i = 0; i < forceUploadKernelConstants.length; i++) {
          const constant = forceUploadKernelConstants[i];
          constant.updateValue(this.constants[constant.name]);
          if (this.switchingKernels) return;
        }
        for (let i = 0; i < kernelArguments.length; i++) {
          kernelArguments[i].updateValue(arguments[i]);
          if (this.switchingKernels) return;
        }

        if (this.plugins) {
          for (let i = 0; i < this.plugins.length; i++) {
            const plugin = this.plugins[i];
            if (plugin.onBeforeRun) {
              plugin.onBeforeRun(this);
            }
          }
        }

        if (this.graphical) {
          if (this.pipeline) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            if (this.immutable) {
              this._replaceOutputTexture();
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            return this.immutable ? this.texture.clone() : this.texture;
          }
          gl.bindRenderbuffer(gl.RENDERBUFFER, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        if (this.immutable) {
          this._replaceOutputTexture();
        }

        if (this.subKernels !== null) {
          if (this.immutable) {
            this._replaceSubOutputTextures();
          }
          this.drawBuffers();
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      drawBuffers() {
        this.extensions.WEBGL_draw_buffers.drawBuffersWEBGL(this.drawBuffersMap);
      }

      getInternalFormat() {
        return this.context.RGBA;
      }
      getTextureFormat() {
        const { context: gl } = this;
        switch (this.getInternalFormat()) {
          case gl.RGBA:
            return gl.RGBA;
          default:
            throw new Error('Unknown internal format');
        }
      }

      _replaceOutputTexture() {
        if (this.texture.beforeMutate() || this._textureSwitched) {
          const gl = this.context;
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);
          this._textureSwitched = false;
        }
      }

      _setupOutputTexture() {
        const gl = this.context;
        const texSize = this.texSize;
        if (this.texture) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);
          return;
        }
        const texture = this.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const format = this.getInternalFormat();
        if (this.precision === 'single') {
          gl.texImage2D(gl.TEXTURE_2D, 0, format, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, format, texSize[0], texSize[1], 0, format, gl.UNSIGNED_BYTE, null);
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        this.texture = new this.TextureConstructor({
          texture,
          size: texSize,
          dimensions: this.threadDim,
          output: this.output,
          context: this.context,
          internalFormat: this.getInternalFormat(),
          textureFormat: this.getTextureFormat(),
          kernel: this,
        });
      }

      _replaceSubOutputTextures() {
        const gl = this.context;
        for (let i = 0; i < this.mappedTextures.length; i++) {
          const mappedTexture = this.mappedTextures[i];
          if (mappedTexture.beforeMutate() || this._mappedTextureSwitched[i]) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, mappedTexture.texture, 0);
            this._mappedTextureSwitched[i] = false;
          }
        }
      }

      _setupSubOutputTextures() {
        const gl = this.context;
        if (this.mappedTextures) {
          for (let i = 0; i < this.subKernels.length; i++) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, this.mappedTextures[i].texture, 0);
          }
          return;
        }
        const texSize = this.texSize;
        this.drawBuffersMap = [gl.COLOR_ATTACHMENT0];
        this.mappedTextures = [];
        for (let i = 0; i < this.subKernels.length; i++) {
          const texture = this.createTexture();
          this.drawBuffersMap.push(gl.COLOR_ATTACHMENT0 + i + 1);
          gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount + i);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          if (this.precision === 'single') {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
          } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          }
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, texture, 0);

          this.mappedTextures.push(new this.TextureConstructor({
            texture,
            size: texSize,
            dimensions: this.threadDim,
            output: this.output,
            context: this.context,
            internalFormat: this.getInternalFormat(),
            textureFormat: this.getTextureFormat(),
            kernel: this,
          }));
        }
      }

      setUniform1f(name, value) {
        if (this.uniform1fCache.hasOwnProperty(name)) {
          const cache = this.uniform1fCache[name];
          if (value === cache) {
            return;
          }
        }
        this.uniform1fCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform1f(loc, value);
      }

      setUniform1i(name, value) {
        if (this.uniform1iCache.hasOwnProperty(name)) {
          const cache = this.uniform1iCache[name];
          if (value === cache) {
            return;
          }
        }
        this.uniform1iCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform1i(loc, value);
      }

      setUniform2f(name, value1, value2) {
        if (this.uniform2fCache.hasOwnProperty(name)) {
          const cache = this.uniform2fCache[name];
          if (
            value1 === cache[0] &&
            value2 === cache[1]
          ) {
            return;
          }
        }
        this.uniform2fCache[name] = [value1, value2];
        const loc = this.getUniformLocation(name);
        this.context.uniform2f(loc, value1, value2);
      }

      setUniform2fv(name, value) {
        if (this.uniform2fvCache.hasOwnProperty(name)) {
          const cache = this.uniform2fvCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1]
          ) {
            return;
          }
        }
        this.uniform2fvCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform2fv(loc, value);
      }

      setUniform2iv(name, value) {
        if (this.uniform2ivCache.hasOwnProperty(name)) {
          const cache = this.uniform2ivCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1]
          ) {
            return;
          }
        }
        this.uniform2ivCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform2iv(loc, value);
      }

      setUniform3fv(name, value) {
        if (this.uniform3fvCache.hasOwnProperty(name)) {
          const cache = this.uniform3fvCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1] &&
            value[2] === cache[2]
          ) {
            return;
          }
        }
        this.uniform3fvCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform3fv(loc, value);
      }

      setUniform3iv(name, value) {
        if (this.uniform3ivCache.hasOwnProperty(name)) {
          const cache = this.uniform3ivCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1] &&
            value[2] === cache[2]
          ) {
            return;
          }
        }
        this.uniform3ivCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform3iv(loc, value);
      }

      setUniform4fv(name, value) {
        if (this.uniform4fvCache.hasOwnProperty(name)) {
          const cache = this.uniform4fvCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1] &&
            value[2] === cache[2] &&
            value[3] === cache[3]
          ) {
            return;
          }
        }
        this.uniform4fvCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform4fv(loc, value);
      }

      setUniform4iv(name, value) {
        if (this.uniform4ivCache.hasOwnProperty(name)) {
          const cache = this.uniform4ivCache[name];
          if (
            value[0] === cache[0] &&
            value[1] === cache[1] &&
            value[2] === cache[2] &&
            value[3] === cache[3]
          ) {
            return;
          }
        }
        this.uniform4ivCache[name] = value;
        const loc = this.getUniformLocation(name);
        this.context.uniform4iv(loc, value);
      }

      getUniformLocation(name) {
        if (this.programUniformLocationCache.hasOwnProperty(name)) {
          return this.programUniformLocationCache[name];
        }
        return this.programUniformLocationCache[name] = this.context.getUniformLocation(this.program, name);
      }

      _getFragShaderArtifactMap(args) {
        return {
          HEADER: this._getHeaderString(),
          LOOP_MAX: this._getLoopMaxString(),
          PLUGINS: this._getPluginsString(),
          CONSTANTS: this._getConstantsString(),
          DECODE32_ENDIANNESS: this._getDecode32EndiannessString(),
          ENCODE32_ENDIANNESS: this._getEncode32EndiannessString(),
          DIVIDE_WITH_INTEGER_CHECK: this._getDivideWithIntegerCheckString(),
          INJECTED_NATIVE: this._getInjectedNative(),
          MAIN_CONSTANTS: this._getMainConstantsString(),
          MAIN_ARGUMENTS: this._getMainArgumentsString(args),
          KERNEL: this.getKernelString(),
          MAIN_RESULT: this.getMainResultString(),
          FLOAT_TACTIC_DECLARATION: this.getFloatTacticDeclaration(),
          INT_TACTIC_DECLARATION: this.getIntTacticDeclaration(),
          SAMPLER_2D_TACTIC_DECLARATION: this.getSampler2DTacticDeclaration(),
          SAMPLER_2D_ARRAY_TACTIC_DECLARATION: this.getSampler2DArrayTacticDeclaration(),
        };
      }

      _getVertShaderArtifactMap(args) {
        return {
          FLOAT_TACTIC_DECLARATION: this.getFloatTacticDeclaration(),
          INT_TACTIC_DECLARATION: this.getIntTacticDeclaration(),
          SAMPLER_2D_TACTIC_DECLARATION: this.getSampler2DTacticDeclaration(),
          SAMPLER_2D_ARRAY_TACTIC_DECLARATION: this.getSampler2DArrayTacticDeclaration(),
        };
      }

      _getHeaderString() {
        return (
          this.subKernels !== null ?
          '#extension GL_EXT_draw_buffers : require\n' :
          ''
        );
      }

      _getLoopMaxString() {
        return (
          this.loopMaxIterations ?
          ` ${parseInt(this.loopMaxIterations)};\n` :
          ' 1000;\n'
        );
      }

      _getPluginsString() {
        if (!this.plugins) return '\n';
        return this.plugins.map(plugin => plugin.source && this.source.match(plugin.functionMatch) ? plugin.source : '').join('\n');
      }

      _getConstantsString() {
        const result = [];
        const { threadDim, texSize } = this;
        if (this.dynamicOutput) {
          result.push(
            'uniform ivec3 uOutputDim',
            'uniform ivec2 uTexSize'
          );
        } else {
          result.push(
            `ivec3 uOutputDim = ivec3(${threadDim[0]}, ${threadDim[1]}, ${threadDim[2]})`,
            `ivec2 uTexSize = ivec2(${texSize[0]}, ${texSize[1]})`
          );
        }
        return utils.linesToString(result);
      }

      _getTextureCoordinate() {
        const subKernels = this.subKernels;
        if (subKernels === null || subKernels.length < 1) {
          return 'varying vec2 vTexCoord;\n';
        } else {
          return 'out vec2 vTexCoord;\n';
        }
      }

      _getDecode32EndiannessString() {
        return (
          this.endianness === 'LE' ?
          '' :
          '  texel.rgba = texel.abgr;\n'
        );
      }

      _getEncode32EndiannessString() {
        return (
          this.endianness === 'LE' ?
          '' :
          '  texel.rgba = texel.abgr;\n'
        );
      }

      _getDivideWithIntegerCheckString() {
        return this.fixIntegerDivisionAccuracy ?
          `float divWithIntCheck(float x, float y) {
  if (floor(x) == x && floor(y) == y && integerMod(x, y) == 0.0) {
    return float(int(x) / int(y));
  }
  return x / y;
}

float integerCorrectionModulo(float number, float divisor) {
  if (number < 0.0) {
    number = abs(number);
    if (divisor < 0.0) {
      divisor = abs(divisor);
    }
    return -(number - (divisor * floor(divWithIntCheck(number, divisor))));
  }
  if (divisor < 0.0) {
    divisor = abs(divisor);
  }
  return number - (divisor * floor(divWithIntCheck(number, divisor)));
}` :
          '';
      }

      _getMainArgumentsString(args) {
        const results = [];
        const { argumentNames } = this;
        for (let i = 0; i < argumentNames.length; i++) {
          results.push(this.kernelArguments[i].getSource(args[i]));
        }
        return results.join('');
      }

      _getInjectedNative() {
        return this.injectedNative || '';
      }

      _getMainConstantsString() {
        const result = [];
        const { constants } = this;
        if (constants) {
          let i = 0;
          for (const name in constants) {
            if (!this.constants.hasOwnProperty(name)) continue;
            result.push(this.kernelConstants[i++].getSource(this.constants[name]));
          }
        }
        return result.join('');
      }

      getKernelResultDeclaration() {
        switch (this.returnType) {
          case 'Array(2)':
            return 'vec2 kernelResult';
          case 'Array(3)':
            return 'vec3 kernelResult';
          case 'Array(4)':
            return 'vec4 kernelResult';
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            return 'float kernelResult';
          default:
            if (this.graphical) {
              return 'float kernelResult';
            } else {
              throw new Error(`unrecognized output type "${ this.returnType }"`);
            }
        }
      }
      getKernelString() {
        const result = [this.getKernelResultDeclaration()];
        const { subKernels } = this;
        if (subKernels !== null) {
          switch (this.returnType) {
            case 'Number':
            case 'Float':
            case 'Integer':
              for (let i = 0; i < subKernels.length; i++) {
                const subKernel = subKernels[i];
                result.push(
                  subKernel.returnType === 'Integer' ?
                  `int subKernelResult_${ subKernel.name } = 0` :
                  `float subKernelResult_${ subKernel.name } = 0.0`
                );
              }
              break;
            case 'Array(2)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec2 subKernelResult_${ subKernels[i].name }`
                );
              }
              break;
            case 'Array(3)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec3 subKernelResult_${ subKernels[i].name }`
                );
              }
              break;
            case 'Array(4)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec4 subKernelResult_${ subKernels[i].name }`
                );
              }
              break;
          }
        }

        return utils.linesToString(result) + this.translatedSource;
      }

      getMainResultGraphical() {
        return utils.linesToString([
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  gl_FragColor = actualColor',
        ]);
      }

      getMainResultPackedPixels() {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Number':
          case 'Integer':
          case 'Float':
            return this.getMainResultKernelPackedPixels() +
              this.getMainResultSubKernelPackedPixels();
          default:
            throw new Error(`packed output only usable with Numbers, "${this.returnType}" specified`);
        }
      }

      getMainResultKernelPackedPixels() {
        return utils.linesToString([
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          `  gl_FragData[0] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(kernelResult)`
        ]);
      }

      getMainResultSubKernelPackedPixels() {
        const result = [];
        if (!this.subKernels) return '';
        for (let i = 0; i < this.subKernels.length; i++) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  gl_FragData[${i + 1}] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(float(subKernelResult_${this.subKernels[i].name}))`
            );
          } else {
            result.push(
              `  gl_FragData[${i + 1}] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(subKernelResult_${this.subKernels[i].name})`
            );
          }
        }
        return utils.linesToString(result);
      }

      getMainResultMemoryOptimizedFloats() {
        const result = [
          '  index *= 4',
        ];

        switch (this.returnType) {
          case 'Number':
          case 'Integer':
          case 'Float':
            const channels = ['r', 'g', 'b', 'a'];
            for (let i = 0; i < channels.length; i++) {
              const channel = channels[i];
              this.getMainResultKernelMemoryOptimizedFloats(result, channel);
              this.getMainResultSubKernelMemoryOptimizedFloats(result, channel);
              if (i + 1 < channels.length) {
                result.push('  index += 1');
              }
            }
            break;
          default:
            throw new Error(`optimized output only usable with Numbers, ${this.returnType} specified`);
        }

        return utils.linesToString(result);
      }

      getMainResultKernelMemoryOptimizedFloats(result, channel) {
        result.push(
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          `  gl_FragData[0].${channel} = kernelResult`,
        );
      }

      getMainResultSubKernelMemoryOptimizedFloats(result, channel) {
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; i++) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  gl_FragData[${i + 1}].${channel} = float(subKernelResult_${this.subKernels[i].name})`,
            );
          } else {
            result.push(
              `  gl_FragData[${i + 1}].${channel} = subKernelResult_${this.subKernels[i].name}`,
            );
          }
        }
      }

      getMainResultKernelNumberTexture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  gl_FragData[0][0] = kernelResult',
        ];
      }

      getMainResultSubKernelNumberTexture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  gl_FragData[${i + 1}][0] = float(subKernelResult_${subKernel.name})`,
            );
          } else {
            result.push(
              `  gl_FragData[${i + 1}][0] = subKernelResult_${subKernel.name}`,
            );
          }
        }
        return result;
      }

      getMainResultKernelArray2Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  gl_FragData[0][0] = kernelResult[0]',
          '  gl_FragData[0][1] = kernelResult[1]',
        ];
      }

      getMainResultSubKernelArray2Texture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
            `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
          );
        }
        return result;
      }

      getMainResultKernelArray3Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  gl_FragData[0][0] = kernelResult[0]',
          '  gl_FragData[0][1] = kernelResult[1]',
          '  gl_FragData[0][2] = kernelResult[2]',
        ];
      }

      getMainResultSubKernelArray3Texture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
            `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
            `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
          );
        }
        return result;
      }

      getMainResultKernelArray4Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  gl_FragData[0] = kernelResult',
        ];
      }

      getMainResultSubKernelArray4Texture() {
        const result = [];
        if (!this.subKernels) return result;
        switch (this.returnType) {
          case 'Number':
          case 'Float':
          case 'Integer':
            for (let i = 0; i < this.subKernels.length; ++i) {
              const subKernel = this.subKernels[i];
              if (subKernel.returnType === 'Integer') {
                result.push(
                  `  gl_FragData[${i + 1}] = float(subKernelResult_${this.subKernels[i].name})`,
                );
              } else {
                result.push(
                  `  gl_FragData[${i + 1}] = subKernelResult_${this.subKernels[i].name}`,
                );
              }
            }
            break;
          case 'Array(2)':
            for (let i = 0; i < this.subKernels.length; ++i) {
              result.push(
                `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
                `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
              );
            }
            break;
          case 'Array(3)':
            for (let i = 0; i < this.subKernels.length; ++i) {
              result.push(
                `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
                `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
                `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
              );
            }
            break;
          case 'Array(4)':
            for (let i = 0; i < this.subKernels.length; ++i) {
              result.push(
                `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
                `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
                `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
                `  gl_FragData[${i + 1}][3] = subKernelResult_${this.subKernels[i].name}[3]`,
              );
            }
            break;
        }

        return result;
      }

      replaceArtifacts(src, map) {
        return src.replace(/[ ]*__([A-Z]+[0-9]*([_]?[A-Z]*[0-9]?)*)__;\n/g, (match, artifact) => {
          if (map.hasOwnProperty(artifact)) {
            return map[artifact];
          }
          throw `unhandled artifact ${artifact}`;
        });
      }

      getFragmentShader(args) {
        if (this.compiledFragmentShader !== null) {
          return this.compiledFragmentShader;
        }
        return this.compiledFragmentShader = this.replaceArtifacts(this.constructor.fragmentShader, this._getFragShaderArtifactMap(args));
      }

      getVertexShader(args) {
        if (this.compiledVertexShader !== null) {
          return this.compiledVertexShader;
        }
        return this.compiledVertexShader = this.replaceArtifacts(this.constructor.vertexShader, this._getVertShaderArtifactMap(args));
      }

      toString() {
        const setupContextString = utils.linesToString([
          `const gl = context`,
        ]);
        return glKernelString(this.constructor, arguments, this, setupContextString);
      }

      destroy(removeCanvasReferences) {
        if (!this.context) return;
        if (this.buffer) {
          this.context.deleteBuffer(this.buffer);
        }
        if (this.framebuffer) {
          this.context.deleteFramebuffer(this.framebuffer);
        }
        if (this.vertShader) {
          this.context.deleteShader(this.vertShader);
        }
        if (this.fragShader) {
          this.context.deleteShader(this.fragShader);
        }
        if (this.program) {
          this.context.deleteProgram(this.program);
        }
        if (this.texture) {
          this.texture.delete();
          const textureCacheIndex = this.textureCache.indexOf(this.texture.texture);
          if (textureCacheIndex > -1) {
            this.textureCache.splice(textureCacheIndex, 1);
          }
          this.texture = null;
        }
        if (this.mappedTextures && this.mappedTextures.length) {
          for (let i = 0; i < this.mappedTextures.length; i++) {
            const mappedTexture = this.mappedTextures[i];
            mappedTexture.delete();
            const textureCacheIndex = this.textureCache.indexOf(mappedTexture.texture);
            if (textureCacheIndex > -1) {
              this.textureCache.splice(textureCacheIndex, 1);
            }
          }
          this.mappedTextures = null;
        }
        if (this.kernelArguments) {
          for (let i = 0; i < this.kernelArguments.length; i++) {
            this.kernelArguments[i].destroy();
          }
        }
        if (this.kernelConstants) {
          for (let i = 0; i < this.kernelConstants.length; i++) {
            this.kernelConstants[i].destroy();
          }
        }
        while (this.textureCache.length > 0) {
          const texture = this.textureCache.pop();
          this.context.deleteTexture(texture);
        }
        if (removeCanvasReferences) {
          const idx = canvases.indexOf(this.canvas);
          if (idx >= 0) {
            canvases[idx] = null;
            maxTexSizes[idx] = null;
          }
        }
        this.destroyExtensions();
        delete this.context;
        delete this.canvas;
        if (!this.gpu) return;
        const i = this.gpu.kernels.indexOf(this);
        if (i === -1) return;
        this.gpu.kernels.splice(i, 1);
      }

      destroyExtensions() {
        this.extensions.OES_texture_float = null;
        this.extensions.OES_texture_float_linear = null;
        this.extensions.OES_element_index_uint = null;
        this.extensions.WEBGL_draw_buffers = null;
      }

      static destroyContext(context) {
        const extension = context.getExtension('WEBGL_lose_context');
        if (extension) {
          extension.loseContext();
        }
      }

      toJSON() {
        const json = super.toJSON();
        json.functionNodes = FunctionBuilder.fromKernel(this, WebGLFunctionNode).toJSON();
        json.settings.threadDim = this.threadDim;
        return json;
      }
    }

    module.exports = {
      WebGLKernel
    };
    },{"../../plugins/math-random-uniformly-distributed":112,"../../utils":114,"../function-builder":9,"../gl/kernel":13,"../gl/kernel-string":12,"./fragment-shader":37,"./function-node":38,"./kernel-value-maps":39,"./vertex-shader":71}],71:[function(require,module,exports){
    const vertexShader = `__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

attribute vec2 aPos;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;
uniform vec2 ratio;

void main(void) {
  gl_Position = vec4((aPos + vec2(1)) * ratio + vec2(-1), 0, 1);
  vTexCoord = aTexCoord;
}`;

    module.exports = {
      vertexShader
    };
    },{}],72:[function(require,module,exports){
    const fragmentShader = `#version 300 es
__HEADER__;
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;
__SAMPLER_2D_ARRAY_TACTIC_DECLARATION__;

const int LOOP_MAX = __LOOP_MAX__;

__PLUGINS__;
__CONSTANTS__;

in vec2 vTexCoord;

float atan2(float v1, float v2) {
  if (v1 == 0.0 || v2 == 0.0) return 0.0;
  return atan(v1 / v2);
}

float cbrt(float x) {
  if (x >= 0.0) {
    return pow(x, 1.0 / 3.0);
  } else {
    return -pow(x, 1.0 / 3.0);
  }
}

float expm1(float x) {
  return pow(${Math.E}, x) - 1.0; 
}

float fround(highp float x) {
  return x;
}

float imul(float v1, float v2) {
  return float(int(v1) * int(v2));
}

float log10(float x) {
  return log2(x) * (1.0 / log2(10.0));
}

float log1p(float x) {
  return log(1.0 + x);
}

float _pow(float v1, float v2) {
  if (v2 == 0.0) return 1.0;
  return pow(v1, v2);
}

float _round(float x) {
  return floor(x + 0.5);
}


const int BIT_COUNT = 32;
int modi(int x, int y) {
  return x - y * (x / y);
}

int bitwiseOr(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) || (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseXOR(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) != (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseAnd(int a, int b) {
  int result = 0;
  int n = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 && b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseNot(int a) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if (modi(a, 2) == 0) {
      result += n;    
    }
    a = a / 2;
    n = n * 2;
  }
  return result;
}
int bitwiseZeroFillLeftShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n *= 2;
  }

  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

int bitwiseSignedRightShift(int num, int shifts) {
  return int(floor(float(num) / pow(2.0, float(shifts))));
}

int bitwiseZeroFillRightShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n /= 2;
  }
  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

vec2 integerMod(vec2 x, float y) {
  vec2 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec3 integerMod(vec3 x, float y) {
  vec3 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec4 integerMod(vec4 x, vec4 y) {
  vec4 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

float integerMod(float x, float y) {
  float res = floor(mod(x, y));
  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);
}

int integerMod(int x, int y) {
  return x - (y * int(x/y));
}

__DIVIDE_WITH_INTEGER_CHECK__;

// Here be dragons!
// DO NOT OPTIMIZE THIS CODE
// YOU WILL BREAK SOMETHING ON SOMEBODY\'S MACHINE
// LEAVE IT AS IT IS, LEST YOU WASTE YOUR OWN TIME
const vec2 MAGIC_VEC = vec2(1.0, -256.0);
const vec4 SCALE_FACTOR = vec4(1.0, 256.0, 65536.0, 0.0);
const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536
float decode32(vec4 texel) {
  __DECODE32_ENDIANNESS__;
  texel *= 255.0;
  vec2 gte128;
  gte128.x = texel.b >= 128.0 ? 1.0 : 0.0;
  gte128.y = texel.a >= 128.0 ? 1.0 : 0.0;
  float exponent = 2.0 * texel.a - 127.0 + dot(gte128, MAGIC_VEC);
  float res = exp2(round(exponent));
  texel.b = texel.b - 128.0 * gte128.x;
  res = dot(texel, SCALE_FACTOR) * exp2(round(exponent-23.0)) + res;
  res *= gte128.y * -2.0 + 1.0;
  return res;
}

float decode16(vec4 texel, int index) {
  int channel = integerMod(index, 2);
  return texel[channel*2] * 255.0 + texel[channel*2 + 1] * 65280.0;
}

float decode8(vec4 texel, int index) {
  int channel = integerMod(index, 4);
  return texel[channel] * 255.0;
}

vec4 legacyEncode32(float f) {
  float F = abs(f);
  float sign = f < 0.0 ? 1.0 : 0.0;
  float exponent = floor(log2(F));
  float mantissa = (exp2(-exponent) * F);
  // exponent += floor(log2(mantissa));
  vec4 texel = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;
  texel.rg = integerMod(texel.rg, 256.0);
  texel.b = integerMod(texel.b, 128.0);
  texel.a = exponent*0.5 + 63.5;
  texel.ba += vec2(integerMod(exponent+127.0, 2.0), sign) * 128.0;
  texel = floor(texel);
  texel *= 0.003921569; // 1/255
  __ENCODE32_ENDIANNESS__;
  return texel;
}

// https://github.com/gpujs/gpu.js/wiki/Encoder-details
vec4 encode32(float value) {
  if (value == 0.0) return vec4(0, 0, 0, 0);

  float exponent;
  float mantissa;
  vec4  result;
  float sgn;

  sgn = step(0.0, -value);
  value = abs(value);

  exponent = floor(log2(value));

  mantissa = value*pow(2.0, -exponent)-1.0;
  exponent = exponent+127.0;
  result   = vec4(0,0,0,0);

  result.a = floor(exponent/2.0);
  exponent = exponent - result.a*2.0;
  result.a = result.a + 128.0*sgn;

  result.b = floor(mantissa * 128.0);
  mantissa = mantissa - result.b / 128.0;
  result.b = result.b + exponent*128.0;

  result.g = floor(mantissa*32768.0);
  mantissa = mantissa - result.g/32768.0;

  result.r = floor(mantissa*8388608.0);
  return result/255.0;
}
// Dragons end here

int index;
ivec3 threadId;

ivec3 indexTo3D(int idx, ivec3 texDim) {
  int z = int(idx / (texDim.x * texDim.y));
  idx -= z * int(texDim.x * texDim.y);
  int y = int(idx / texDim.x);
  int x = int(integerMod(idx, texDim.x));
  return ivec3(x, y, z);
}

float get32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return decode32(texel);
}

float get16(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 2;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 2, texSize.y));
  return decode16(texel, index);
}

float get8(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 4;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 4, texSize.y));
  return decode8(texel, index);
}

float getMemoryOptimized32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int channel = integerMod(index, 4);
  index = index / 4;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  index = index / 4;
  vec4 texel = texture(tex, st / vec2(texSize));
  return texel[channel];
}

vec4 getImage2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, st / vec2(texSize));
}

vec4 getImage3D(sampler2DArray tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, vec3(st / vec2(texSize), z));
}

float getFloatFromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return result[0];
}

vec2 getVec2FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec2(result[0], result[1]);
}

vec2 getMemoryOptimizedVec2(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  index = index / 2;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  if (channel == 0) return vec2(texel.r, texel.g);
  if (channel == 1) return vec2(texel.b, texel.a);
  return vec2(0.0, 0.0);
}

vec3 getVec3FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec3(result[0], result[1], result[2]);
}

vec3 getMemoryOptimizedVec3(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int fieldIndex = 3 * (x + texDim.x * (y + texDim.y * z));
  int vectorIndex = fieldIndex / 4;
  int vectorOffset = fieldIndex - vectorIndex * 4;
  int readY = vectorIndex / texSize.x;
  int readX = vectorIndex - readY * texSize.x;
  vec4 tex1 = texture(tex, (vec2(readX, readY) + 0.5) / vec2(texSize));

  if (vectorOffset == 0) {
    return tex1.xyz;
  } else if (vectorOffset == 1) {
    return tex1.yzw;
  } else {
    readX++;
    if (readX >= texSize.x) {
      readX = 0;
      readY++;
    }
    vec4 tex2 = texture(tex, vec2(readX, readY) / vec2(texSize));
    if (vectorOffset == 2) {
      return vec3(tex1.z, tex1.w, tex2.x);
    } else {
      return vec3(tex1.w, tex2.x, tex2.y);
    }
  }
}

vec4 getVec4FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  return getImage2D(tex, texSize, texDim, z, y, x);
}

vec4 getMemoryOptimizedVec4(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return vec4(texel.r, texel.g, texel.b, texel.a);
}

vec4 actualColor;
void color(float r, float g, float b, float a) {
  actualColor = vec4(r,g,b,a);
}

void color(float r, float g, float b) {
  color(r,g,b,1.0);
}

float modulo(float number, float divisor) {
  if (number < 0.0) {
    number = abs(number);
    if (divisor < 0.0) {
      divisor = abs(divisor);
    }
    return -mod(number, divisor);
  }
  if (divisor < 0.0) {
    divisor = abs(divisor);
  }
  return mod(number, divisor);
}

__INJECTED_NATIVE__;
__MAIN_CONSTANTS__;
__MAIN_ARGUMENTS__;
__KERNEL__;

void main(void) {
  index = int(vTexCoord.s * float(uTexSize.x)) + int(vTexCoord.t * float(uTexSize.y)) * uTexSize.x;
  __MAIN_RESULT__;
}`;

    module.exports = {
      fragmentShader
    };
    },{}],73:[function(require,module,exports){
    const { utils } = require('../../utils');
    const { WebGLFunctionNode } = require('../web-gl/function-node');

    class WebGL2FunctionNode extends WebGLFunctionNode {

      astIdentifierExpression(idtNode, retArr) {
        if (idtNode.type !== 'Identifier') {
          throw this.astErrorOutput(
            'IdentifierExpression - not an Identifier',
            idtNode
          );
        }

        const type = this.getType(idtNode);

        const name = utils.sanitizeName(idtNode.name);
        if (idtNode.name === 'Infinity') {
          retArr.push('intBitsToFloat(2139095039)');
        } else if (type === 'Boolean') {
          if (this.argumentNames.indexOf(name) > -1) {
            retArr.push(`bool(user_${name})`);
          } else {
            retArr.push(`user_${name}`);
          }
        } else {
          retArr.push(`user_${name}`);
        }

        return retArr;
      }
    }

    module.exports = {
      WebGL2FunctionNode
    };
    },{"../../utils":114,"../web-gl/function-node":38}],74:[function(require,module,exports){
    const { WebGL2KernelValueBoolean } = require('./kernel-value/boolean');
    const { WebGL2KernelValueFloat } = require('./kernel-value/float');
    const { WebGL2KernelValueInteger } = require('./kernel-value/integer');

    const { WebGL2KernelValueHTMLImage } = require('./kernel-value/html-image');
    const { WebGL2KernelValueDynamicHTMLImage } = require('./kernel-value/dynamic-html-image');

    const { WebGL2KernelValueHTMLImageArray } = require('./kernel-value/html-image-array');
    const { WebGL2KernelValueDynamicHTMLImageArray } = require('./kernel-value/dynamic-html-image-array');

    const { WebGL2KernelValueHTMLVideo } = require('./kernel-value/html-video');
    const { WebGL2KernelValueDynamicHTMLVideo } = require('./kernel-value/dynamic-html-video');

    const { WebGL2KernelValueSingleInput } = require('./kernel-value/single-input');
    const { WebGL2KernelValueDynamicSingleInput } = require('./kernel-value/dynamic-single-input');

    const { WebGL2KernelValueUnsignedInput } = require('./kernel-value/unsigned-input');
    const { WebGL2KernelValueDynamicUnsignedInput } = require('./kernel-value/dynamic-unsigned-input');

    const { WebGL2KernelValueMemoryOptimizedNumberTexture } = require('./kernel-value/memory-optimized-number-texture');
    const { WebGL2KernelValueDynamicMemoryOptimizedNumberTexture } = require('./kernel-value/dynamic-memory-optimized-number-texture');

    const { WebGL2KernelValueNumberTexture } = require('./kernel-value/number-texture');
    const { WebGL2KernelValueDynamicNumberTexture } = require('./kernel-value/dynamic-number-texture');

    const { WebGL2KernelValueSingleArray } = require('./kernel-value/single-array');
    const { WebGL2KernelValueDynamicSingleArray } = require('./kernel-value/dynamic-single-array');

    const { WebGL2KernelValueSingleArray1DI } = require('./kernel-value/single-array1d-i');
    const { WebGL2KernelValueDynamicSingleArray1DI } = require('./kernel-value/dynamic-single-array1d-i');

    const { WebGL2KernelValueSingleArray2DI } = require('./kernel-value/single-array2d-i');
    const { WebGL2KernelValueDynamicSingleArray2DI } = require('./kernel-value/dynamic-single-array2d-i');

    const { WebGL2KernelValueSingleArray3DI } = require('./kernel-value/single-array3d-i');
    const { WebGL2KernelValueDynamicSingleArray3DI } = require('./kernel-value/dynamic-single-array3d-i');

    const { WebGL2KernelValueSingleArray2 } = require('./kernel-value/single-array2');
    const { WebGL2KernelValueSingleArray3 } = require('./kernel-value/single-array3');
    const { WebGL2KernelValueSingleArray4 } = require('./kernel-value/single-array4');

    const { WebGL2KernelValueUnsignedArray } = require('./kernel-value/unsigned-array');
    const { WebGL2KernelValueDynamicUnsignedArray } = require('./kernel-value/dynamic-unsigned-array');

    const kernelValueMaps = {
      unsigned: {
        dynamic: {
          'Boolean': WebGL2KernelValueBoolean,
          'Integer': WebGL2KernelValueInteger,
          'Float': WebGL2KernelValueFloat,
          'Array': WebGL2KernelValueDynamicUnsignedArray,
          'Array(2)': false,
          'Array(3)': false,
          'Array(4)': false,
          'Array1D(2)': false,
          'Array1D(3)': false,
          'Array1D(4)': false,
          'Array2D(2)': false,
          'Array2D(3)': false,
          'Array2D(4)': false,
          'Array3D(2)': false,
          'Array3D(3)': false,
          'Array3D(4)': false,
          'Input': WebGL2KernelValueDynamicUnsignedInput,
          'NumberTexture': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(1)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(2)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(3)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(4)': WebGL2KernelValueDynamicNumberTexture,
          'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGL2KernelValueDynamicHTMLImage,
          'HTMLImage': WebGL2KernelValueDynamicHTMLImage,
          'HTMLImageArray': WebGL2KernelValueDynamicHTMLImageArray,
          'HTMLVideo': WebGL2KernelValueDynamicHTMLVideo,
        },
        static: {
          'Boolean': WebGL2KernelValueBoolean,
          'Float': WebGL2KernelValueFloat,
          'Integer': WebGL2KernelValueInteger,
          'Array': WebGL2KernelValueUnsignedArray,
          'Array(2)': false,
          'Array(3)': false,
          'Array(4)': false,
          'Array1D(2)': false,
          'Array1D(3)': false,
          'Array1D(4)': false,
          'Array2D(2)': false,
          'Array2D(3)': false,
          'Array2D(4)': false,
          'Array3D(2)': false,
          'Array3D(3)': false,
          'Array3D(4)': false,
          'Input': WebGL2KernelValueUnsignedInput,
          'NumberTexture': WebGL2KernelValueNumberTexture,
          'ArrayTexture(1)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(2)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(3)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(4)': WebGL2KernelValueNumberTexture,
          'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGL2KernelValueHTMLImage,
          'HTMLImage': WebGL2KernelValueHTMLImage,
          'HTMLImageArray': WebGL2KernelValueHTMLImageArray,
          'HTMLVideo': WebGL2KernelValueHTMLVideo,
        }
      },
      single: {
        dynamic: {
          'Boolean': WebGL2KernelValueBoolean,
          'Integer': WebGL2KernelValueInteger,
          'Float': WebGL2KernelValueFloat,
          'Array': WebGL2KernelValueDynamicSingleArray,
          'Array(2)': WebGL2KernelValueSingleArray2,
          'Array(3)': WebGL2KernelValueSingleArray3,
          'Array(4)': WebGL2KernelValueSingleArray4,
          'Array1D(2)': WebGL2KernelValueDynamicSingleArray1DI,
          'Array1D(3)': WebGL2KernelValueDynamicSingleArray1DI,
          'Array1D(4)': WebGL2KernelValueDynamicSingleArray1DI,
          'Array2D(2)': WebGL2KernelValueDynamicSingleArray2DI,
          'Array2D(3)': WebGL2KernelValueDynamicSingleArray2DI,
          'Array2D(4)': WebGL2KernelValueDynamicSingleArray2DI,
          'Array3D(2)': WebGL2KernelValueDynamicSingleArray3DI,
          'Array3D(3)': WebGL2KernelValueDynamicSingleArray3DI,
          'Array3D(4)': WebGL2KernelValueDynamicSingleArray3DI,
          'Input': WebGL2KernelValueDynamicSingleInput,
          'NumberTexture': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(1)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(2)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(3)': WebGL2KernelValueDynamicNumberTexture,
          'ArrayTexture(4)': WebGL2KernelValueDynamicNumberTexture,
          'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGL2KernelValueDynamicHTMLImage,
          'HTMLImage': WebGL2KernelValueDynamicHTMLImage,
          'HTMLImageArray': WebGL2KernelValueDynamicHTMLImageArray,
          'HTMLVideo': WebGL2KernelValueDynamicHTMLVideo,
        },
        static: {
          'Boolean': WebGL2KernelValueBoolean,
          'Float': WebGL2KernelValueFloat,
          'Integer': WebGL2KernelValueInteger,
          'Array': WebGL2KernelValueSingleArray,
          'Array(2)': WebGL2KernelValueSingleArray2,
          'Array(3)': WebGL2KernelValueSingleArray3,
          'Array(4)': WebGL2KernelValueSingleArray4,
          'Array1D(2)': WebGL2KernelValueSingleArray1DI,
          'Array1D(3)': WebGL2KernelValueSingleArray1DI,
          'Array1D(4)': WebGL2KernelValueSingleArray1DI,
          'Array2D(2)': WebGL2KernelValueSingleArray2DI,
          'Array2D(3)': WebGL2KernelValueSingleArray2DI,
          'Array2D(4)': WebGL2KernelValueSingleArray2DI,
          'Array3D(2)': WebGL2KernelValueSingleArray3DI,
          'Array3D(3)': WebGL2KernelValueSingleArray3DI,
          'Array3D(4)': WebGL2KernelValueSingleArray3DI,
          'Input': WebGL2KernelValueSingleInput,
          'NumberTexture': WebGL2KernelValueNumberTexture,
          'ArrayTexture(1)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(2)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(3)': WebGL2KernelValueNumberTexture,
          'ArrayTexture(4)': WebGL2KernelValueNumberTexture,
          'MemoryOptimizedNumberTexture': WebGL2KernelValueMemoryOptimizedNumberTexture,
          'HTMLCanvas': WebGL2KernelValueHTMLImage,
          'HTMLImage': WebGL2KernelValueHTMLImage,
          'HTMLImageArray': WebGL2KernelValueHTMLImageArray,
          'HTMLVideo': WebGL2KernelValueHTMLVideo,
        }
      },
    };

    function lookupKernelValueType(type, dynamic, precision, value) {
      if (!type) {
        throw new Error('type missing');
      }
      if (!dynamic) {
        throw new Error('dynamic missing');
      }
      if (!precision) {
        throw new Error('precision missing');
      }
      if (value.type) {
        type = value.type;
      }
      const types = kernelValueMaps[precision][dynamic];
      if (types[type] === false) {
        return null;
      } else if (types[type] === undefined) {
        throw new Error(`Could not find a KernelValue for ${ type }`);
      }
      return types[type];
    }

    module.exports = {
      kernelValueMaps,
      lookupKernelValueType
    };
    },{"./kernel-value/boolean":75,"./kernel-value/dynamic-html-image":77,"./kernel-value/dynamic-html-image-array":76,"./kernel-value/dynamic-html-video":78,"./kernel-value/dynamic-memory-optimized-number-texture":79,"./kernel-value/dynamic-number-texture":80,"./kernel-value/dynamic-single-array":81,"./kernel-value/dynamic-single-array1d-i":82,"./kernel-value/dynamic-single-array2d-i":83,"./kernel-value/dynamic-single-array3d-i":84,"./kernel-value/dynamic-single-input":85,"./kernel-value/dynamic-unsigned-array":86,"./kernel-value/dynamic-unsigned-input":87,"./kernel-value/float":88,"./kernel-value/html-image":90,"./kernel-value/html-image-array":89,"./kernel-value/html-video":91,"./kernel-value/integer":92,"./kernel-value/memory-optimized-number-texture":93,"./kernel-value/number-texture":94,"./kernel-value/single-array":95,"./kernel-value/single-array1d-i":96,"./kernel-value/single-array2":97,"./kernel-value/single-array2d-i":98,"./kernel-value/single-array3":99,"./kernel-value/single-array3d-i":100,"./kernel-value/single-array4":101,"./kernel-value/single-input":102,"./kernel-value/unsigned-array":103,"./kernel-value/unsigned-input":104}],75:[function(require,module,exports){
    const { WebGLKernelValueBoolean } = require('../../web-gl/kernel-value/boolean');

    class WebGL2KernelValueBoolean extends WebGLKernelValueBoolean {}

    module.exports = {
      WebGL2KernelValueBoolean
    };
    },{"../../web-gl/kernel-value/boolean":41}],76:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueHTMLImageArray } = require('./html-image-array');

    class WebGL2KernelValueDynamicHTMLImageArray extends WebGL2KernelValueHTMLImageArray {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2DArray ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(images) {
        const { width, height } = images[0];
        this.checkSize(width, height);
        this.dimensions = [width, height, images.length];
        this.textureSize = [width, height];
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(images);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicHTMLImageArray
    };
    },{"../../../utils":114,"./html-image-array":89}],77:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueDynamicHTMLImage } = require('../../web-gl/kernel-value/dynamic-html-image');

    class WebGL2KernelValueDynamicHTMLImage extends WebGLKernelValueDynamicHTMLImage {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicHTMLImage
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/dynamic-html-image":42}],78:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueDynamicHTMLImage } = require('./dynamic-html-image');

    class WebGL2KernelValueDynamicHTMLVideo extends WebGL2KernelValueDynamicHTMLImage {}

    module.exports = {
      WebGL2KernelValueDynamicHTMLVideo
    };
    },{"../../../utils":114,"./dynamic-html-image":77}],79:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueDynamicMemoryOptimizedNumberTexture } = require('../../web-gl/kernel-value/dynamic-memory-optimized-number-texture');

    class WebGL2KernelValueDynamicMemoryOptimizedNumberTexture extends WebGLKernelValueDynamicMemoryOptimizedNumberTexture {
      getSource() {
        return utils.linesToString([
          `uniform sampler2D ${this.id}`,
          `uniform ivec2 ${this.sizeId}`,
          `uniform ivec3 ${this.dimensionsId}`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicMemoryOptimizedNumberTexture
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/dynamic-memory-optimized-number-texture":44}],80:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueDynamicNumberTexture } = require('../../web-gl/kernel-value/dynamic-number-texture');

    class WebGL2KernelValueDynamicNumberTexture extends WebGLKernelValueDynamicNumberTexture {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicNumberTexture
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/dynamic-number-texture":45}],81:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueSingleArray } = require('../../web-gl2/kernel-value/single-array');

    class WebGL2KernelValueDynamicSingleArray extends WebGL2KernelValueSingleArray {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.dimensions = utils.getDimensions(value, true);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicSingleArray
    };
    },{"../../../utils":114,"../../web-gl2/kernel-value/single-array":95}],82:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueSingleArray1DI } = require('../../web-gl2/kernel-value/single-array1d-i');

    class WebGL2KernelValueDynamicSingleArray1DI extends WebGL2KernelValueSingleArray1DI {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicSingleArray1DI
    };
    },{"../../../utils":114,"../../web-gl2/kernel-value/single-array1d-i":96}],83:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueSingleArray2DI } = require('../../web-gl2/kernel-value/single-array2d-i');

    class WebGL2KernelValueDynamicSingleArray2DI extends WebGL2KernelValueSingleArray2DI {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicSingleArray2DI
    };
    },{"../../../utils":114,"../../web-gl2/kernel-value/single-array2d-i":98}],84:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueSingleArray3DI } = require('../../web-gl2/kernel-value/single-array3d-i');

    class WebGL2KernelValueDynamicSingleArray3DI extends WebGL2KernelValueSingleArray3DI {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        this.setShape(value);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicSingleArray3DI
    };
    },{"../../../utils":114,"../../web-gl2/kernel-value/single-array3d-i":100}],85:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueSingleInput } = require('../../web-gl2/kernel-value/single-input');

    class WebGL2KernelValueDynamicSingleInput extends WebGL2KernelValueSingleInput {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }

      updateValue(value) {
        let [w, h, d] = value.size;
        this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
        this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
        this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
        this.checkSize(this.textureSize[0], this.textureSize[1]);
        this.uploadValue = new Float32Array(this.uploadArrayLength);
        this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
        this.kernel.setUniform2iv(this.sizeId, this.textureSize);
        super.updateValue(value);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicSingleInput
    };
    },{"../../../utils":114,"../../web-gl2/kernel-value/single-input":102}],86:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueDynamicUnsignedArray } = require('../../web-gl/kernel-value/dynamic-unsigned-array');

    class WebGL2KernelValueDynamicUnsignedArray extends WebGLKernelValueDynamicUnsignedArray {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicUnsignedArray
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/dynamic-unsigned-array":51}],87:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueDynamicUnsignedInput } = require('../../web-gl/kernel-value/dynamic-unsigned-input');

    class WebGL2KernelValueDynamicUnsignedInput extends WebGLKernelValueDynamicUnsignedInput {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
          `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueDynamicUnsignedInput
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/dynamic-unsigned-input":52}],88:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueFloat } = require('../../web-gl/kernel-value/float');

    class WebGL2KernelValueFloat extends WebGLKernelValueFloat {}

    module.exports = {
      WebGL2KernelValueFloat
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/float":53}],89:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelArray } = require('../../web-gl/kernel-value/array');

    class WebGL2KernelValueHTMLImageArray extends WebGLKernelArray {
      constructor(value, settings) {
        super(value, settings);
        this.checkSize(value[0].width, value[0].height);
        this.dimensions = [value[0].width, value[0].height, value.length];
        this.textureSize = [value[0].width, value[0].height];
      }
      defineTexture() {
        const { context: gl } = this;
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      }

      getStringValueHandler() {
        return `const uploadValue_${this.name} = ${this.varName};\n`;
      }
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2DArray ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(images) {
        const { context: gl } = this;
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage3D(
          gl.TEXTURE_2D_ARRAY,
          0,
          gl.RGBA,
          images[0].width,
          images[0].height,
          images.length,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null
        );
        for (let i = 0; i < images.length; i++) {
          const xOffset = 0;
          const yOffset = 0;
          const imageDepth = 1;
          gl.texSubImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            xOffset,
            yOffset,
            i,
            images[i].width,
            images[i].height,
            imageDepth,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.uploadValue = images[i]
          );
        }
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueHTMLImageArray
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/array":40}],90:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueHTMLImage } = require('../../web-gl/kernel-value/html-image');

    class WebGL2KernelValueHTMLImage extends WebGLKernelValueHTMLImage {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueHTMLImage
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/html-image":54}],91:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGL2KernelValueHTMLImage } = require('./html-image');

    class WebGL2KernelValueHTMLVideo extends WebGL2KernelValueHTMLImage {}

    module.exports = {
      WebGL2KernelValueHTMLVideo
    };
    },{"../../../utils":114,"./html-image":90}],92:[function(require,module,exports){
    const { WebGLKernelValueInteger } = require('../../web-gl/kernel-value/integer');

    class WebGL2KernelValueInteger extends WebGLKernelValueInteger {
      getSource(value) {
        const variablePrecision = this.getVariablePrecisionString();
        if (this.origin === 'constants') {
          return `const ${ variablePrecision } int ${this.id} = ${ parseInt(value) };\n`;
        }
        return `uniform ${ variablePrecision } int ${this.id};\n`;
      }

      updateValue(value) {
        if (this.origin === 'constants') return;
        this.kernel.setUniform1i(this.id, this.uploadValue = value);
      }
    }

    module.exports = {
      WebGL2KernelValueInteger
    };
    },{"../../web-gl/kernel-value/integer":57}],93:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('../../web-gl/kernel-value/memory-optimized-number-texture');

    class WebGL2KernelValueMemoryOptimizedNumberTexture extends WebGLKernelValueMemoryOptimizedNumberTexture {
      getSource() {
        const { id, sizeId, textureSize, dimensionsId, dimensions } = this;
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform sampler2D ${id}`,
          `${ variablePrecision } ivec2 ${sizeId} = ivec2(${textureSize[0]}, ${textureSize[1]})`,
          `${ variablePrecision } ivec3 ${dimensionsId} = ivec3(${dimensions[0]}, ${dimensions[1]}, ${dimensions[2]})`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueMemoryOptimizedNumberTexture
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/memory-optimized-number-texture":58}],94:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueNumberTexture } = require('../../web-gl/kernel-value/number-texture');

    class WebGL2KernelValueNumberTexture extends WebGLKernelValueNumberTexture {
      getSource() {
        const { id, sizeId, textureSize, dimensionsId, dimensions } = this;
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${id}`,
          `${ variablePrecision } ivec2 ${sizeId} = ivec2(${textureSize[0]}, ${textureSize[1]})`,
          `${ variablePrecision } ivec3 ${dimensionsId} = ivec3(${dimensions[0]}, ${dimensions[1]}, ${dimensions[2]})`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueNumberTexture
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/number-texture":59}],95:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray } = require('../../web-gl/kernel-value/single-array');

    class WebGL2KernelValueSingleArray extends WebGLKernelValueSingleArray {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueSingleArray
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/single-array":60}],96:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray1DI } = require('../../web-gl/kernel-value/single-array1d-i');

    class WebGL2KernelValueSingleArray1DI extends WebGLKernelValueSingleArray1DI {
      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueSingleArray1DI
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/single-array1d-i":61}],97:[function(require,module,exports){
    const { WebGLKernelValueSingleArray2 } = require('../../web-gl/kernel-value/single-array2');

    class WebGL2KernelValueSingleArray2 extends WebGLKernelValueSingleArray2 {}

    module.exports = {
      WebGL2KernelValueSingleArray2
    };
    },{"../../web-gl/kernel-value/single-array2":62}],98:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray2DI } = require('../../web-gl/kernel-value/single-array2d-i');

    class WebGL2KernelValueSingleArray2DI extends WebGLKernelValueSingleArray2DI {
      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueSingleArray2DI
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/single-array2d-i":63}],99:[function(require,module,exports){
    const { WebGLKernelValueSingleArray3 } = require('../../web-gl/kernel-value/single-array3');

    class WebGL2KernelValueSingleArray3 extends WebGLKernelValueSingleArray3 {}

    module.exports = {
      WebGL2KernelValueSingleArray3
    };
    },{"../../web-gl/kernel-value/single-array3":64}],100:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleArray3DI } = require('../../web-gl/kernel-value/single-array3d-i');

    class WebGL2KernelValueSingleArray3DI extends WebGLKernelValueSingleArray3DI {
      updateValue(value) {
        if (value.constructor !== this.initialValueConstructor) {
          this.onUpdateValueMismatch(value.constructor);
          return;
        }
        const { context: gl } = this;
        utils.flattenTo(value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueSingleArray3DI
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/single-array3d-i":65}],101:[function(require,module,exports){
    const { WebGLKernelValueSingleArray4 } = require('../../web-gl/kernel-value/single-array4');

    class WebGL2KernelValueSingleArray4 extends WebGLKernelValueSingleArray4 {}

    module.exports = {
      WebGL2KernelValueSingleArray4
    };
    },{"../../web-gl/kernel-value/single-array4":66}],102:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueSingleInput } = require('../../web-gl/kernel-value/single-input');

    class WebGL2KernelValueSingleInput extends WebGLKernelValueSingleInput {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }

      updateValue(input) {
        const { context: gl } = this;
        utils.flattenTo(input.value, this.uploadValue);
        gl.activeTexture(this.contextHandle);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
        this.kernel.setUniform1i(this.id, this.index);
      }
    }

    module.exports = {
      WebGL2KernelValueSingleInput
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/single-input":67}],103:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueUnsignedArray } = require('../../web-gl/kernel-value/unsigned-array');

    class WebGL2KernelValueUnsignedArray extends WebGLKernelValueUnsignedArray {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueUnsignedArray
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/unsigned-array":68}],104:[function(require,module,exports){
    const { utils } = require('../../../utils');
    const { WebGLKernelValueUnsignedInput } = require('../../web-gl/kernel-value/unsigned-input');

    class WebGL2KernelValueUnsignedInput extends WebGLKernelValueUnsignedInput {
      getSource() {
        const variablePrecision = this.getVariablePrecisionString();
        return utils.linesToString([
          `uniform ${ variablePrecision } sampler2D ${this.id}`,
          `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
          `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
        ]);
      }
    }

    module.exports = {
      WebGL2KernelValueUnsignedInput
    };
    },{"../../../utils":114,"../../web-gl/kernel-value/unsigned-input":69}],105:[function(require,module,exports){
    const { WebGLKernel } = require('../web-gl/kernel');
    const { WebGL2FunctionNode } = require('./function-node');
    const { FunctionBuilder } = require('../function-builder');
    const { utils } = require('../../utils');
    const { fragmentShader } = require('./fragment-shader');
    const { vertexShader } = require('./vertex-shader');
    const { lookupKernelValueType } = require('./kernel-value-maps');

    let isSupported = null;
    let testCanvas = null;
    let testContext = null;
    let testExtensions = null;

    let features = null;

    class WebGL2Kernel extends WebGLKernel {
      static get isSupported() {
        if (isSupported !== null) {
          return isSupported;
        }
        this.setupFeatureChecks();
        isSupported = this.isContextMatch(testContext);
        return isSupported;
      }

      static setupFeatureChecks() {
        if (typeof document !== 'undefined') {
          testCanvas = document.createElement('canvas');
        } else if (typeof OffscreenCanvas !== 'undefined') {
          testCanvas = new OffscreenCanvas(0, 0);
        }
        if (!testCanvas) return;
        testContext = testCanvas.getContext('webgl2');
        if (!testContext || !testContext.getExtension) return;
        testExtensions = {
          EXT_color_buffer_float: testContext.getExtension('EXT_color_buffer_float'),
          OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
        };
        features = this.getFeatures();
      }

      static isContextMatch(context) {
        if (typeof WebGL2RenderingContext !== 'undefined') {
          return context instanceof WebGL2RenderingContext;
        }
        return false;
      }

      static getFeatures() {
        const gl = this.testContext;
        return Object.freeze({
          isFloatRead: this.getIsFloatRead(),
          isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
          isSpeedTacticSupported: this.getIsSpeedTacticSupported(),
          kernelMap: true,
          isTextureFloat: true,
          isDrawBuffers: true,
          channelCount: this.getChannelCount(),
          maxTextureSize: this.getMaxTextureSize(),
          lowIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT),
          lowFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
          mediumIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
          mediumFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
          highIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
          highFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
        });
      }

      static getIsTextureFloat() {
        return true;
      }

      static getChannelCount() {
        return testContext.getParameter(testContext.MAX_DRAW_BUFFERS);
      }

      static getMaxTextureSize() {
        return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
      }

      static lookupKernelValueType(type, dynamic, precision, value) {
        return lookupKernelValueType(type, dynamic, precision, value);
      }

      static get testCanvas() {
        return testCanvas;
      }

      static get testContext() {
        return testContext;
      }

      static get features() {
        return features;
      }

      static get fragmentShader() {
        return fragmentShader;
      }
      static get vertexShader() {
        return vertexShader;
      }

      initContext() {
        const settings = {
          alpha: false,
          depth: false,
          antialias: false
        };
        return this.canvas.getContext('webgl2', settings);
      }

      initExtensions() {
        this.extensions = {
          EXT_color_buffer_float: this.context.getExtension('EXT_color_buffer_float'),
          OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
        };
      }

      validateSettings(args) {
        if (!this.validate) {
          this.texSize = utils.getKernelTextureSize({
            optimizeFloatMemory: this.optimizeFloatMemory,
            precision: this.precision,
          }, this.output);
          return;
        }

        const { features } = this.constructor;
        if (this.precision === 'single' && !features.isFloatRead) {
          throw new Error('Float texture outputs are not supported');
        } else if (!this.graphical && this.precision === null) {
          this.precision = features.isFloatRead ? 'single' : 'unsigned';
        }

        if (this.fixIntegerDivisionAccuracy === null) {
          this.fixIntegerDivisionAccuracy = !features.isIntegerDivisionAccurate;
        } else if (this.fixIntegerDivisionAccuracy && features.isIntegerDivisionAccurate) {
          this.fixIntegerDivisionAccuracy = false;
        }

        this.checkOutput();

        if (!this.output || this.output.length === 0) {
          if (args.length !== 1) {
            throw new Error('Auto output only supported for kernels with only one input');
          }

          const argType = utils.getVariableType(args[0], this.strictIntegers);
          switch (argType) {
            case 'Array':
              this.output = utils.getDimensions(argType);
              break;
            case 'NumberTexture':
            case 'MemoryOptimizedNumberTexture':
            case 'ArrayTexture(1)':
            case 'ArrayTexture(2)':
            case 'ArrayTexture(3)':
            case 'ArrayTexture(4)':
              this.output = args[0].output;
              break;
            default:
              throw new Error('Auto output not supported for input type: ' + argType);
          }
        }

        if (this.graphical) {
          if (this.output.length !== 2) {
            throw new Error('Output must have 2 dimensions on graphical mode');
          }

          if (this.precision === 'single') {
            console.warn('Cannot use graphical mode and single precision at the same time');
            this.precision = 'unsigned';
          }

          this.texSize = utils.clone(this.output);
          return;
        } else if (!this.graphical && this.precision === null && features.isTextureFloat) {
          this.precision = 'single';
        }

        this.texSize = utils.getKernelTextureSize({
          optimizeFloatMemory: this.optimizeFloatMemory,
          precision: this.precision,
        }, this.output);

        this.checkTextureSize();
      }

      translateSource() {
        const functionBuilder = FunctionBuilder.fromKernel(this, WebGL2FunctionNode, {
          fixIntegerDivisionAccuracy: this.fixIntegerDivisionAccuracy
        });
        this.translatedSource = functionBuilder.getPrototypeString('kernel');
        this.setupReturnTypes(functionBuilder);
      }

      drawBuffers() {
        this.context.drawBuffers(this.drawBuffersMap);
      }

      getTextureFormat() {
        const { context: gl } = this;
        switch (this.getInternalFormat()) {
          case gl.R32F:
            return gl.RED;
          case gl.RG32F:
            return gl.RG;
          case gl.RGBA32F:
            return gl.RGBA;
          case gl.RGBA:
            return gl.RGBA;
          default:
            throw new Error('Unknown internal format');
        }
      }
      getInternalFormat() {
        const { context: gl } = this;

        if (this.precision === 'single') {
          if (this.pipeline) {
            switch (this.returnType) {
              case 'Number':
              case 'Float':
              case 'Integer':
                if (this.optimizeFloatMemory) {
                  return gl.RGBA32F;
                } else {
                  return gl.R32F;
                }
                case 'Array(2)':
                  return gl.RG32F;
                case 'Array(3)': 
                case 'Array(4)':
                  return gl.RGBA32F;
                default:
                  throw new Error('Unhandled return type');
            }
          }
          return gl.RGBA32F;
        }
        return gl.RGBA;
      }

      _setupOutputTexture() {
        const gl = this.context;
        if (this.texture) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);
          return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        const texture = gl.createTexture();
        const texSize = this.texSize;
        gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const format = this.getInternalFormat();
        if (this.precision === 'single') {
          gl.texStorage2D(gl.TEXTURE_2D, 1, format, texSize[0], texSize[1]);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, format, texSize[0], texSize[1], 0, format, gl.UNSIGNED_BYTE, null);
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        this.texture = new this.TextureConstructor({
          texture,
          size: texSize,
          dimensions: this.threadDim,
          output: this.output,
          context: this.context,
          internalFormat: this.getInternalFormat(),
          textureFormat: this.getTextureFormat(),
          kernel: this,
        });
      }

      _setupSubOutputTextures() {
        const gl = this.context;
        if (this.mappedTextures) {
          for (let i = 0; i < this.subKernels.length; i++) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, this.mappedTextures[i].texture, 0);
          }
          return;
        }
        const texSize = this.texSize;
        this.drawBuffersMap = [gl.COLOR_ATTACHMENT0];
        this.mappedTextures = [];
        for (let i = 0; i < this.subKernels.length; i++) {
          const texture = this.createTexture();
          this.drawBuffersMap.push(gl.COLOR_ATTACHMENT0 + i + 1);
          gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount + i);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          const format = this.getInternalFormat();
          if (this.precision === 'single') {
            gl.texStorage2D(gl.TEXTURE_2D, 1, format, texSize[0], texSize[1]);
          } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          }
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, texture, 0);

          this.mappedTextures.push(new this.TextureConstructor({
            texture,
            size: texSize,
            dimensions: this.threadDim,
            output: this.output,
            context: this.context,
            internalFormat: this.getInternalFormat(),
            textureFormat: this.getTextureFormat(),
            kernel: this,
          }));
        }
      }

      _getHeaderString() {
        return '';
      }

      _getTextureCoordinate() {
        const subKernels = this.subKernels;
        const variablePrecision = this.getVariablePrecisionString(this.texSize, this.tactic);
        if (subKernels === null || subKernels.length < 1) {
          return `in ${ variablePrecision } vec2 vTexCoord;\n`;
        } else {
          return `out ${ variablePrecision } vec2 vTexCoord;\n`;
        }
      }

      _getMainArgumentsString(args) {
        const result = [];
        const argumentNames = this.argumentNames;
        for (let i = 0; i < argumentNames.length; i++) {
          result.push(this.kernelArguments[i].getSource(args[i]));
        }
        return result.join('');
      }

      getKernelString() {
        const result = [this.getKernelResultDeclaration()];
        const subKernels = this.subKernels;
        if (subKernels !== null) {
          result.push(
            'layout(location = 0) out vec4 data0'
          );
          switch (this.returnType) {
            case 'Number':
            case 'Float':
            case 'Integer':
              for (let i = 0; i < subKernels.length; i++) {
                const subKernel = subKernels[i];
                result.push(
                  subKernel.returnType === 'Integer' ?
                  `int subKernelResult_${ subKernel.name } = 0` :
                  `float subKernelResult_${ subKernel.name } = 0.0`,
                  `layout(location = ${ i + 1 }) out vec4 data${ i + 1 }`
                );
              }
              break;
            case 'Array(2)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec2 subKernelResult_${ subKernels[i].name }`,
                  `layout(location = ${ i + 1 }) out vec4 data${ i + 1 }`
                );
              }
              break;
            case 'Array(3)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec3 subKernelResult_${ subKernels[i].name }`,
                  `layout(location = ${ i + 1 }) out vec4 data${ i + 1 }`
                );
              }
              break;
            case 'Array(4)':
              for (let i = 0; i < subKernels.length; i++) {
                result.push(
                  `vec4 subKernelResult_${ subKernels[i].name }`,
                  `layout(location = ${ i + 1 }) out vec4 data${ i + 1 }`
                );
              }
              break;
          }
        } else {
          result.push(
            'out vec4 data0'
          );
        }

        return utils.linesToString(result) + this.translatedSource;
      }

      getMainResultGraphical() {
        return utils.linesToString([
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  data0 = actualColor',
        ]);
      }

      getMainResultPackedPixels() {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Number':
          case 'Integer':
          case 'Float':
            return this.getMainResultKernelPackedPixels() +
              this.getMainResultSubKernelPackedPixels();
          default:
            throw new Error(`packed output only usable with Numbers, "${this.returnType}" specified`);
        }
      }

      getMainResultKernelPackedPixels() {
        return utils.linesToString([
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          `  data0 = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(kernelResult)`
        ]);
      }

      getMainResultSubKernelPackedPixels() {
        const result = [];
        if (!this.subKernels) return '';
        for (let i = 0; i < this.subKernels.length; i++) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  data${i + 1} = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(float(subKernelResult_${this.subKernels[i].name}))`
            );
          } else {
            result.push(
              `  data${i + 1} = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(subKernelResult_${this.subKernels[i].name})`
            );
          }
        }
        return utils.linesToString(result);
      }

      getMainResultKernelMemoryOptimizedFloats(result, channel) {
        result.push(
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          `  data0.${channel} = kernelResult`,
        );
      }

      getMainResultSubKernelMemoryOptimizedFloats(result, channel) {
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; i++) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  data${i + 1}.${channel} = float(subKernelResult_${subKernel.name})`,
            );
          } else {
            result.push(
              `  data${i + 1}.${channel} = subKernelResult_${subKernel.name}`,
            );
          }
        }
      }

      getMainResultKernelNumberTexture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  data0[0] = kernelResult',
        ];
      }

      getMainResultSubKernelNumberTexture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  data${i + 1}[0] = float(subKernelResult_${subKernel.name})`,
            );
          } else {
            result.push(
              `  data${i + 1}[0] = subKernelResult_${subKernel.name}`,
            );
          }
        }
        return result;
      }

      getMainResultKernelArray2Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  data0[0] = kernelResult[0]',
          '  data0[1] = kernelResult[1]',
        ];
      }

      getMainResultSubKernelArray2Texture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          const subKernel = this.subKernels[i];
          result.push(
            `  data${i + 1}[0] = subKernelResult_${subKernel.name}[0]`,
            `  data${i + 1}[1] = subKernelResult_${subKernel.name}[1]`,
          );
        }
        return result;
      }

      getMainResultKernelArray3Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  data0[0] = kernelResult[0]',
          '  data0[1] = kernelResult[1]',
          '  data0[2] = kernelResult[2]',
        ];
      }

      getMainResultSubKernelArray3Texture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          const subKernel = this.subKernels[i];
          result.push(
            `  data${i + 1}[0] = subKernelResult_${subKernel.name}[0]`,
            `  data${i + 1}[1] = subKernelResult_${subKernel.name}[1]`,
            `  data${i + 1}[2] = subKernelResult_${subKernel.name}[2]`,
          );
        }
        return result;
      }

      getMainResultKernelArray4Texture() {
        return [
          '  threadId = indexTo3D(index, uOutputDim)',
          '  kernel()',
          '  data0 = kernelResult',
        ];
      }

      getMainResultSubKernelArray4Texture() {
        const result = [];
        if (!this.subKernels) return result;
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  data${i + 1} = subKernelResult_${this.subKernels[i].name}`,
          );
        }
        return result;
      }

      destroyExtensions() {
        this.extensions.EXT_color_buffer_float = null;
        this.extensions.OES_texture_float_linear = null;
      }

      toJSON() {
        const json = super.toJSON();
        json.functionNodes = FunctionBuilder.fromKernel(this, WebGL2FunctionNode).toJSON();
        json.settings.threadDim = this.threadDim;
        return json;
      }
    }

    module.exports = {
      WebGL2Kernel
    };
    },{"../../utils":114,"../function-builder":9,"../web-gl/kernel":70,"./fragment-shader":72,"./function-node":73,"./kernel-value-maps":74,"./vertex-shader":106}],106:[function(require,module,exports){
    const vertexShader = `#version 300 es
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

in vec2 aPos;
in vec2 aTexCoord;

out vec2 vTexCoord;
uniform vec2 ratio;

void main(void) {
  gl_Position = vec4((aPos + vec2(1)) * ratio + vec2(-1), 0, 1);
  vTexCoord = aTexCoord;
}`;

    module.exports = {
      vertexShader
    };
    },{}],107:[function(require,module,exports){
    const lib = require('./index');
    const GPU = lib.GPU;
    for (const p in lib) {
      if (!lib.hasOwnProperty(p)) continue;
      if (p === 'GPU') continue; 
      GPU[p] = lib[p];
    }

    if (typeof window !== 'undefined') {
      bindTo(window);
    }
    if (typeof self !== 'undefined') {
      bindTo(self);
    }

    function bindTo(target) {
      if (target.GPU) return;
      Object.defineProperty(target, 'GPU', {
        get() {
          return GPU;
        }
      });
    }

    module.exports = lib;
    },{"./index":109}],108:[function(require,module,exports){
    const { gpuMock } = require('gpu-mock.js');
    const { utils } = require('./utils');
    const { Kernel } = require('./backend/kernel');
    const { CPUKernel } = require('./backend/cpu/kernel');
    const { HeadlessGLKernel } = require('./backend/headless-gl/kernel');
    const { WebGL2Kernel } = require('./backend/web-gl2/kernel');
    const { WebGLKernel } = require('./backend/web-gl/kernel');
    const { kernelRunShortcut } = require('./kernel-run-shortcut');


    const kernelOrder = [HeadlessGLKernel, WebGL2Kernel, WebGLKernel];

    const kernelTypes = ['gpu', 'cpu'];

    const internalKernels = {
      'headlessgl': HeadlessGLKernel,
      'webgl2': WebGL2Kernel,
      'webgl': WebGLKernel,
    };

    let validate = true;

    class GPU {
      static disableValidation() {
        validate = false;
      }

      static enableValidation() {
        validate = true;
      }

      static get isGPUSupported() {
        return kernelOrder.some(Kernel => Kernel.isSupported);
      }

      static get isKernelMapSupported() {
        return kernelOrder.some(Kernel => Kernel.isSupported && Kernel.features.kernelMap);
      }

      static get isOffscreenCanvasSupported() {
        return (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') || typeof importScripts !== 'undefined';
      }

      static get isWebGLSupported() {
        return WebGLKernel.isSupported;
      }

      static get isWebGL2Supported() {
        return WebGL2Kernel.isSupported;
      }

      static get isHeadlessGLSupported() {
        return HeadlessGLKernel.isSupported;
      }

      static get isCanvasSupported() {
        return typeof HTMLCanvasElement !== 'undefined';
      }

      static get isGPUHTMLImageArraySupported() {
        return WebGL2Kernel.isSupported;
      }

      static get isSinglePrecisionSupported() {
        return kernelOrder.some(Kernel => Kernel.isSupported && Kernel.features.isFloatRead && Kernel.features.isTextureFloat);
      }

      constructor(settings) {
        settings = settings || {};
        this.canvas = settings.canvas || null;
        this.context = settings.context || null;
        this.mode = settings.mode;
        this.Kernel = null;
        this.kernels = [];
        this.functions = [];
        this.nativeFunctions = [];
        this.injectedNative = null;
        this.onIstanbulCoverageVariable = settings.onIstanbulCoverageVariable || null;
        this.removeIstanbulCoverage = settings.hasOwnProperty('removeIstanbulCoverage') ? settings.removeIstanbulCoverage : null;
        if (this.mode === 'dev') return;
        this.chooseKernel();
        if (settings.functions) {
          for (let i = 0; i < settings.functions.length; i++) {
            this.addFunction(settings.functions[i]);
          }
        }

        if (settings.nativeFunctions) {
          for (const p in settings.nativeFunctions) {
            if (!settings.nativeFunctions.hasOwnProperty(p)) continue;
            const s = settings.nativeFunctions[p];
            const { name, source } = s;
            this.addNativeFunction(name, source, s);
          }
        }
      }

      chooseKernel() {
        if (this.Kernel) return;

        let Kernel = null;

        if (this.context) {
          for (let i = 0; i < kernelOrder.length; i++) {
            const ExternalKernel = kernelOrder[i];
            if (ExternalKernel.isContextMatch(this.context)) {
              if (!ExternalKernel.isSupported) {
                throw new Error(`Kernel type ${ExternalKernel.name} not supported`);
              }
              Kernel = ExternalKernel;
              break;
            }
          }
          if (Kernel === null) {
            throw new Error('unknown Context');
          }
        } else if (this.mode) {
          if (this.mode in internalKernels) {
            if (!validate || internalKernels[this.mode].isSupported) {
              Kernel = internalKernels[this.mode];
            }
          } else if (this.mode === 'gpu') {
            for (let i = 0; i < kernelOrder.length; i++) {
              if (kernelOrder[i].isSupported) {
                Kernel = kernelOrder[i];
                break;
              }
            }
          } else if (this.mode === 'cpu') {
            Kernel = CPUKernel;
          }
          if (!Kernel) {
            throw new Error(`A requested mode of "${this.mode}" and is not supported`);
          }
        } else {
          for (let i = 0; i < kernelOrder.length; i++) {
            if (kernelOrder[i].isSupported) {
              Kernel = kernelOrder[i];
              break;
            }
          }
          if (!Kernel) {
            Kernel = CPUKernel;
          }
        }

        if (!this.mode) {
          this.mode = Kernel.mode;
        }
        this.Kernel = Kernel;
      }

      createKernel(source, settings) {
        if (typeof source === 'undefined') {
          throw new Error('Missing source parameter');
        }
        if (typeof source !== 'object' && !utils.isFunction(source) && typeof source !== 'string') {
          throw new Error('source parameter not a function');
        }

        const kernels = this.kernels;
        if (this.mode === 'dev') {
          const devKernel = gpuMock(source, upgradeDeprecatedCreateKernelSettings(settings));
          kernels.push(devKernel);
          return devKernel;
        }

        source = typeof source === 'function' ? source.toString() : source;
        const switchableKernels = {};
        const settingsCopy = upgradeDeprecatedCreateKernelSettings(settings) || {};
        if (settings && typeof settings.argumentTypes === 'object') {
          settingsCopy.argumentTypes = Object.keys(settings.argumentTypes).map(argumentName => settings.argumentTypes[argumentName]);
        }

        function onRequestFallback(args) {
          console.warn('Falling back to CPU');
          const fallbackKernel = new CPUKernel(source, {
            argumentTypes: kernelRun.argumentTypes,
            constantTypes: kernelRun.constantTypes,
            graphical: kernelRun.graphical,
            loopMaxIterations: kernelRun.loopMaxIterations,
            constants: kernelRun.constants,
            dynamicOutput: kernelRun.dynamicOutput,
            dynamicArgument: kernelRun.dynamicArguments,
            output: kernelRun.output,
            precision: kernelRun.precision,
            pipeline: kernelRun.pipeline,
            immutable: kernelRun.immutable,
            optimizeFloatMemory: kernelRun.optimizeFloatMemory,
            fixIntegerDivisionAccuracy: kernelRun.fixIntegerDivisionAccuracy,
            functions: kernelRun.functions,
            nativeFunctions: kernelRun.nativeFunctions,
            injectedNative: kernelRun.injectedNative,
            subKernels: kernelRun.subKernels,
            strictIntegers: kernelRun.strictIntegers,
            debug: kernelRun.debug,
          });
          fallbackKernel.build.apply(fallbackKernel, args);
          const result = fallbackKernel.run.apply(fallbackKernel, args);
          kernelRun.replaceKernel(fallbackKernel);
          return result;
        }

        function onRequestSwitchKernel(reasons, args, _kernel) {
          if (_kernel.debug) {
            console.warn('Switching kernels');
          }
          let newOutput = null;
          if (_kernel.signature && !switchableKernels[_kernel.signature]) {
            switchableKernels[_kernel.signature] = _kernel;
          }
          if (_kernel.dynamicOutput) {
            for (let i = reasons.length - 1; i >= 0; i--) {
              const reason = reasons[i];
              if (reason.type === 'outputPrecisionMismatch') {
                newOutput = reason.needed;
              }
            }
          }

          const Constructor = _kernel.constructor;
          const argumentTypes = Constructor.getArgumentTypes(_kernel, args);
          const signature = Constructor.getSignature(_kernel, argumentTypes);
          const existingKernel = switchableKernels[signature];
          if (existingKernel) {
            existingKernel.onActivate(_kernel);
            return existingKernel;
          }

          const newKernel = switchableKernels[signature] = new Constructor(source, {
            argumentTypes,
            constantTypes: _kernel.constantTypes,
            graphical: _kernel.graphical,
            loopMaxIterations: _kernel.loopMaxIterations,
            constants: _kernel.constants,
            dynamicOutput: _kernel.dynamicOutput,
            dynamicArgument: _kernel.dynamicArguments,
            context: _kernel.context,
            canvas: _kernel.canvas,
            output: newOutput || _kernel.output,
            precision: _kernel.precision,
            pipeline: _kernel.pipeline,
            immutable: _kernel.immutable,
            optimizeFloatMemory: _kernel.optimizeFloatMemory,
            fixIntegerDivisionAccuracy: _kernel.fixIntegerDivisionAccuracy,
            functions: _kernel.functions,
            nativeFunctions: _kernel.nativeFunctions,
            injectedNative: _kernel.injectedNative,
            subKernels: _kernel.subKernels,
            strictIntegers: _kernel.strictIntegers,
            debug: _kernel.debug,
            gpu: _kernel.gpu,
            validate,
            returnType: _kernel.returnType,
            onIstanbulCoverageVariable: _kernel.onIstanbulCoverageVariable,
            removeIstanbulCoverage: _kernel.removeIstanbulCoverage,
            tactic: _kernel.tactic,
            onRequestFallback,
            onRequestSwitchKernel,
            texture: _kernel.texture,
            mappedTextures: _kernel.mappedTextures,
            drawBuffersMap: _kernel.drawBuffersMap,
          });
          newKernel.build.apply(newKernel, args);
          kernelRun.replaceKernel(newKernel);
          kernels.push(newKernel);
          return newKernel;
        }
        const mergedSettings = Object.assign({
          context: this.context,
          canvas: this.canvas,
          functions: this.functions,
          nativeFunctions: this.nativeFunctions,
          injectedNative: this.injectedNative,
          onIstanbulCoverageVariable: this.onIstanbulCoverageVariable,
          removeIstanbulCoverage: this.removeIstanbulCoverage,
          gpu: this,
          validate,
          onRequestFallback,
          onRequestSwitchKernel
        }, settingsCopy);

        const kernel = new this.Kernel(source, mergedSettings);
        const kernelRun = kernelRunShortcut(kernel);

        if (!this.canvas) {
          this.canvas = kernel.canvas;
        }

        if (!this.context) {
          this.context = kernel.context;
        }

        kernels.push(kernel);

        return kernelRun;
      }

      createKernelMap() {
        let fn;
        let settings;
        const argument2Type = typeof arguments[arguments.length - 2];
        if (argument2Type === 'function' || argument2Type === 'string') {
          fn = arguments[arguments.length - 2];
          settings = arguments[arguments.length - 1];
        } else {
          fn = arguments[arguments.length - 1];
        }

        if (this.mode !== 'dev') {
          if (!this.Kernel.isSupported || !this.Kernel.features.kernelMap) {
            if (this.mode && kernelTypes.indexOf(this.mode) < 0) {
              throw new Error(`kernelMap not supported on ${this.Kernel.name}`);
            }
          }
        }

        const settingsCopy = upgradeDeprecatedCreateKernelSettings(settings);
        if (settings && typeof settings.argumentTypes === 'object') {
          settingsCopy.argumentTypes = Object.keys(settings.argumentTypes).map(argumentName => settings.argumentTypes[argumentName]);
        }

        if (Array.isArray(arguments[0])) {
          settingsCopy.subKernels = [];
          const functions = arguments[0];
          for (let i = 0; i < functions.length; i++) {
            const source = functions[i].toString();
            const name = utils.getFunctionNameFromString(source);
            settingsCopy.subKernels.push({
              name,
              source,
              property: i,
            });
          }
        } else {
          settingsCopy.subKernels = [];
          const functions = arguments[0];
          for (let p in functions) {
            if (!functions.hasOwnProperty(p)) continue;
            const source = functions[p].toString();
            const name = utils.getFunctionNameFromString(source);
            settingsCopy.subKernels.push({
              name: name || p,
              source,
              property: p,
            });
          }
        }
        return this.createKernel(fn, settingsCopy);
      }

      combineKernels() {
        const firstKernel = arguments[0];
        const combinedKernel = arguments[arguments.length - 1];
        if (firstKernel.kernel.constructor.mode === 'cpu') return combinedKernel;
        const canvas = arguments[0].canvas;
        const context = arguments[0].context;
        const max = arguments.length - 1;
        for (let i = 0; i < max; i++) {
          arguments[i]
            .setCanvas(canvas)
            .setContext(context)
            .setPipeline(true);
        }

        return function() {
          const texture = combinedKernel.apply(this, arguments);
          if (texture.toArray) {
            return texture.toArray();
          }
          return texture;
        };
      }

      setFunctions(functions) {
        this.functions = functions;
        return this;
      }

      setNativeFunctions(nativeFunctions) {
        this.nativeFunctions = nativeFunctions;
        return this;
      }

      addFunction(source, settings) {
        this.functions.push({ source, settings });
        return this;
      }

      addNativeFunction(name, source, settings) {
        if (this.kernels.length > 0) {
          throw new Error('Cannot call "addNativeFunction" after "createKernels" has been called.');
        }
        this.nativeFunctions.push(Object.assign({ name, source }, settings));
        return this;
      }

      injectNative(source) {
        this.injectedNative = source;
        return this;
      }

      destroy() {
        return new Promise((resolve, reject) => {
          if (!this.kernels) {
            resolve();
          }
          setTimeout(() => {
            try {
              for (let i = 0; i < this.kernels.length; i++) {
                this.kernels[i].destroy(true); 
              }
              let firstKernel = this.kernels[0];
              if (firstKernel) {
                if (firstKernel.kernel) {
                  firstKernel = firstKernel.kernel;
                }
                if (firstKernel.constructor.destroyContext) {
                  firstKernel.constructor.destroyContext(this.context);
                }
              }
            } catch (e) {
              reject(e);
            }
            resolve();
          }, 0);
        });
      }
    }


    function upgradeDeprecatedCreateKernelSettings(settings) {
      if (!settings) {
        return {};
      }
      const upgradedSettings = Object.assign({}, settings);

      if (settings.hasOwnProperty('floatOutput')) {
        utils.warnDeprecated('setting', 'floatOutput', 'precision');
        upgradedSettings.precision = settings.floatOutput ? 'single' : 'unsigned';
      }
      if (settings.hasOwnProperty('outputToTexture')) {
        utils.warnDeprecated('setting', 'outputToTexture', 'pipeline');
        upgradedSettings.pipeline = Boolean(settings.outputToTexture);
      }
      if (settings.hasOwnProperty('outputImmutable')) {
        utils.warnDeprecated('setting', 'outputImmutable', 'immutable');
        upgradedSettings.immutable = Boolean(settings.outputImmutable);
      }
      if (settings.hasOwnProperty('floatTextures')) {
        utils.warnDeprecated('setting', 'floatTextures', 'optimizeFloatMemory');
        upgradedSettings.optimizeFloatMemory = Boolean(settings.floatTextures);
      }
      return upgradedSettings;
    }

    module.exports = {
      GPU,
      kernelOrder,
      kernelTypes
    };
    },{"./backend/cpu/kernel":8,"./backend/headless-gl/kernel":34,"./backend/kernel":36,"./backend/web-gl/kernel":70,"./backend/web-gl2/kernel":105,"./kernel-run-shortcut":111,"./utils":114,"gpu-mock.js":4}],109:[function(require,module,exports){
    const { GPU } = require('./gpu');
    const { alias } = require('./alias');
    const { utils } = require('./utils');
    const { Input, input } = require('./input');
    const { Texture } = require('./texture');
    const { FunctionBuilder } = require('./backend/function-builder');
    const { FunctionNode } = require('./backend/function-node');
    const { CPUFunctionNode } = require('./backend/cpu/function-node');
    const { CPUKernel } = require('./backend/cpu/kernel');

    const { HeadlessGLKernel } = require('./backend/headless-gl/kernel');

    const { WebGLFunctionNode } = require('./backend/web-gl/function-node');
    const { WebGLKernel } = require('./backend/web-gl/kernel');
    const { kernelValueMaps: webGLKernelValueMaps } = require('./backend/web-gl/kernel-value-maps');

    const { WebGL2FunctionNode } = require('./backend/web-gl2/function-node');
    const { WebGL2Kernel } = require('./backend/web-gl2/kernel');
    const { kernelValueMaps: webGL2KernelValueMaps } = require('./backend/web-gl2/kernel-value-maps');

    const { GLKernel } = require('./backend/gl/kernel');

    const { Kernel } = require('./backend/kernel');

    const { FunctionTracer } = require('./backend/function-tracer');

    const mathRandom = require('./plugins/math-random-uniformly-distributed');

    module.exports = {
      alias,
      CPUFunctionNode,
      CPUKernel,
      GPU,
      FunctionBuilder,
      FunctionNode,
      HeadlessGLKernel,
      Input,
      input,
      Texture,
      utils,

      WebGL2FunctionNode,
      WebGL2Kernel,
      webGL2KernelValueMaps,

      WebGLFunctionNode,
      WebGLKernel,
      webGLKernelValueMaps,

      GLKernel,
      Kernel,
      FunctionTracer,

      plugins: {
        mathRandom
      }
    };
    },{"./alias":5,"./backend/cpu/function-node":6,"./backend/cpu/kernel":8,"./backend/function-builder":9,"./backend/function-node":10,"./backend/function-tracer":11,"./backend/gl/kernel":13,"./backend/headless-gl/kernel":34,"./backend/kernel":36,"./backend/web-gl/function-node":38,"./backend/web-gl/kernel":70,"./backend/web-gl/kernel-value-maps":39,"./backend/web-gl2/function-node":73,"./backend/web-gl2/kernel":105,"./backend/web-gl2/kernel-value-maps":74,"./gpu":108,"./input":110,"./plugins/math-random-uniformly-distributed":112,"./texture":113,"./utils":114}],110:[function(require,module,exports){
    class Input {
      constructor(value, size) {
        this.value = value;
        if (Array.isArray(size)) {
          this.size = size;
        } else {
          this.size = new Int32Array(3);
          if (size.z) {
            this.size = new Int32Array([size.x, size.y, size.z]);
          } else if (size.y) {
            this.size = new Int32Array([size.x, size.y]);
          } else {
            this.size = new Int32Array([size.x]);
          }
        }

        const [w, h, d] = this.size;
        if (d) {
          if (this.value.length !== (w * h * d)) {
            throw new Error(`Input size ${this.value.length} does not match ${w} * ${h} * ${d} = ${(h * w * d)}`);
          }
        } else if (h) {
          if (this.value.length !== (w * h)) {
            throw new Error(`Input size ${this.value.length} does not match ${w} * ${h} = ${(h * w)}`);
          }
        } else {
          if (this.value.length !== w) {
            throw new Error(`Input size ${this.value.length} does not match ${w}`);
          }
        }

      }

      toArray() {
        const { utils } = require('./utils');
        const [w, h, d] = this.size;
        if (d) {
          return utils.erectMemoryOptimized3DFloat(this.value.subarray ? this.value : new Float32Array(this.value), w, h, d);
        } else if (h) {
          return utils.erectMemoryOptimized2DFloat(this.value.subarray ? this.value : new Float32Array(this.value), w, h);
        } else {
          return this.value;
        }
      }
    }

    function input(value, size) {
      return new Input(value, size);
    }

    module.exports = {
      Input,
      input
    };
    },{"./utils":114}],111:[function(require,module,exports){
    const { utils } = require('./utils');

    function kernelRunShortcut(kernel) {
      let run = function() {
        kernel.build.apply(kernel, arguments);
        run = function() {
          let result = kernel.run.apply(kernel, arguments);
          if (kernel.switchingKernels) {
            const reasons = kernel.resetSwitchingKernels();
            const newKernel = kernel.onRequestSwitchKernel(reasons, arguments, kernel);
            shortcut.kernel = kernel = newKernel;
            result = newKernel.run.apply(newKernel, arguments);
          }
          if (kernel.renderKernels) {
            return kernel.renderKernels();
          } else if (kernel.renderOutput) {
            return kernel.renderOutput();
          } else {
            return result;
          }
        };
        return run.apply(kernel, arguments);
      };
      const shortcut = function() {
        return run.apply(kernel, arguments);
      };
      shortcut.exec = function() {
        return new Promise((accept, reject) => {
          try {
            accept(run.apply(this, arguments));
          } catch (e) {
            reject(e);
          }
        });
      };
      shortcut.replaceKernel = function(replacementKernel) {
        kernel = replacementKernel;
        bindKernelToShortcut(kernel, shortcut);
      };

      bindKernelToShortcut(kernel, shortcut);
      return shortcut;
    }

    function bindKernelToShortcut(kernel, shortcut) {
      if (shortcut.kernel) {
        shortcut.kernel = kernel;
        return;
      }
      const properties = utils.allPropertiesOf(kernel);
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (property[0] === '_' && property[1] === '_') continue;
        if (typeof kernel[property] === 'function') {
          if (property.substring(0, 3) === 'add' || property.substring(0, 3) === 'set') {
            shortcut[property] = function() {
              shortcut.kernel[property].apply(shortcut.kernel, arguments);
              return shortcut;
            };
          } else {
            shortcut[property] = function() {
              return shortcut.kernel[property].apply(shortcut.kernel, arguments);
            };
          }
        } else {
          shortcut.__defineGetter__(property, () => shortcut.kernel[property]);
          shortcut.__defineSetter__(property, (value) => {
            shortcut.kernel[property] = value;
          });
        }
      }
      shortcut.kernel = kernel;
    }
    module.exports = {
      kernelRunShortcut
    };
    },{"./utils":114}],112:[function(require,module,exports){
    const source = `// https://www.shadertoy.com/view/4t2SDh
//note: uniformly distributed, normalized rand, [0,1]
highp float randomSeedShift = 1.0;
highp float slide = 1.0;
uniform highp float randomSeed1;
uniform highp float randomSeed2;

highp float nrand(highp vec2 n) {
  highp float result = fract(sin(dot((n.xy + 1.0) * vec2(randomSeed1 * slide, randomSeed2 * randomSeedShift), vec2(12.9898, 78.233))) * 43758.5453);
  randomSeedShift = result;
  if (randomSeedShift > 0.5) {
    slide += 0.00009; 
  } else {
    slide += 0.0009;
  }
  return result;
}`;

    const name = 'math-random-uniformly-distributed';

    const functionMatch = `Math.random()`;

    const functionReplace = `nrand(vTexCoord)`;

    const functionReturnType = 'Number';
    const onBeforeRun = (kernel) => {
      kernel.setUniform1f('randomSeed1', Math.random());
      kernel.setUniform1f('randomSeed2', Math.random());
    };

    const plugin = {
      name,
      onBeforeRun,
      functionMatch,
      functionReplace,
      functionReturnType,
      source
    };

    module.exports = plugin;
    },{}],113:[function(require,module,exports){
    class Texture {
      constructor(settings) {
        const {
          texture,
          size,
          dimensions,
          output,
          context,
          type = 'NumberTexture',
          kernel,
          internalFormat,
          textureFormat
        } = settings;
        if (!output) throw new Error('settings property "output" required.');
        if (!context) throw new Error('settings property "context" required.');
        if (!texture) throw new Error('settings property "texture" required.');
        if (!kernel) throw new Error('settings property "kernel" required.');
        this.texture = texture;
        if (texture._refs) {
          texture._refs++;
        } else {
          texture._refs = 1;
        }
        this.size = size;
        this.dimensions = dimensions;
        this.output = output;
        this.context = context;
        this.kernel = kernel;
        this.type = type;
        this._deleted = false;
        this.internalFormat = internalFormat;
        this.textureFormat = textureFormat;
      }

      toArray() {
        throw new Error(`Not implemented on ${this.constructor.name}`);
      }

      clone() {
        throw new Error(`Not implemented on ${this.constructor.name}`);
      }

      delete() {
        throw new Error(`Not implemented on ${this.constructor.name}`);
      }

      clear() {
        throw new Error(`Not implemented on ${this.constructor.name}`);
      }
    }

    module.exports = {
      Texture
    };
    },{}],114:[function(require,module,exports){
    const acorn = require('acorn');
    const { Input } = require('./input');
    const { Texture } = require('./texture');

    const FUNCTION_NAME = /function ([^(]*)/;
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;

    const utils = {
      systemEndianness() {
        return _systemEndianness;
      },
      getSystemEndianness() {
        const b = new ArrayBuffer(4);
        const a = new Uint32Array(b);
        const c = new Uint8Array(b);
        a[0] = 0xdeadbeef;
        if (c[0] === 0xef) return 'LE';
        if (c[0] === 0xde) return 'BE';
        throw new Error('unknown endianness');
      },

      isFunction(funcObj) {
        return typeof(funcObj) === 'function';
      },

      isFunctionString(fn) {
        if (typeof fn === 'string') {
          return (fn
            .slice(0, 'function'.length)
            .toLowerCase() === 'function');
        }
        return false;
      },

      getFunctionNameFromString(funcStr) {
        const result = FUNCTION_NAME.exec(funcStr);
        if (!result || result.length === 0) return null;
        return result[1].trim();
      },

      getFunctionBodyFromString(funcStr) {
        return funcStr.substring(funcStr.indexOf('{') + 1, funcStr.lastIndexOf('}'));
      },

      getArgumentNamesFromString(fn) {
        const fnStr = fn.replace(STRIP_COMMENTS, '');
        let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if (result === null) {
          result = [];
        }
        return result;
      },

      clone(obj) {
        if (obj === null || typeof obj !== 'object' || obj.hasOwnProperty('isActiveClone')) return obj;

        const temp = obj.constructor(); 

        for (let key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj.isActiveClone = null;
            temp[key] = utils.clone(obj[key]);
            delete obj.isActiveClone;
          }
        }

        return temp;
      },

      isArray(array) {
        return !isNaN(array.length);
      },

      getVariableType(value, strictIntegers) {
        if (utils.isArray(value)) {
          if (value.length > 0 && value[0].nodeName === 'IMG') {
            return 'HTMLImageArray';
          }
          return 'Array';
        }

        switch (value.constructor) {
          case Boolean:
            return 'Boolean';
          case Number:
            if (strictIntegers && Number.isInteger(value)) {
              return 'Integer';
            }
            return 'Float';
          case Texture:
            return value.type;
          case Input:
            return 'Input';
        }
        switch (value.nodeName) {
          case 'IMG':
            return 'HTMLImage';
          case 'CANVAS':
            return 'HTMLImage';
          case 'VIDEO':
            return 'HTMLVideo';
        }
        if (value.hasOwnProperty('type')) {
          return value.type;
        }
        return 'Unknown';
      },

      getKernelTextureSize(settings, dimensions) {
        let [w, h, d] = dimensions;
        let texelCount = (w || 1) * (h || 1) * (d || 1);

        if (settings.optimizeFloatMemory && settings.precision === 'single') {
          w = texelCount = Math.ceil(texelCount / 4);
        }
        if (h > 1 && w * h === texelCount) {
          return new Int32Array([w, h]);
        }
        return utils.closestSquareDimensions(texelCount);
      },

      closestSquareDimensions(length) {
        const sqrt = Math.sqrt(length);
        let high = Math.ceil(sqrt);
        let low = Math.floor(sqrt);
        while (high * low < length) {
          high--;
          low = Math.ceil(length / high);
        }
        return new Int32Array([low, Math.ceil(length / low)]);
      },

      getMemoryOptimizedFloatTextureSize(dimensions, bitRatio) {
        const totalArea = utils.roundTo((dimensions[0] || 1) * (dimensions[1] || 1) * (dimensions[2] || 1) * (dimensions[3] || 1), 4);
        const texelCount = totalArea / bitRatio;
        return utils.closestSquareDimensions(texelCount);
      },

      getMemoryOptimizedPackedTextureSize(dimensions, bitRatio) {
        const [w, h, d] = dimensions;
        const totalArea = utils.roundTo((w || 1) * (h || 1) * (d || 1), 4);
        const texelCount = totalArea / (4 / bitRatio);
        return utils.closestSquareDimensions(texelCount);
      },

      roundTo(n, d) {
        return Math.floor((n + d - 1) / d) * d;
      },
      getDimensions(x, pad) {
        let ret;
        if (utils.isArray(x)) {
          const dim = [];
          let temp = x;
          while (utils.isArray(temp)) {
            dim.push(temp.length);
            temp = temp[0];
          }
          ret = dim.reverse();
        } else if (x instanceof Texture) {
          ret = x.output;
        } else if (x instanceof Input) {
          ret = x.size;
        } else {
          throw new Error(`Unknown dimensions of ${x}`);
        }

        if (pad) {
          ret = Array.from(ret);
          while (ret.length < 3) {
            ret.push(1);
          }
        }

        return new Int32Array(ret);
      },

      flatten2dArrayTo(array, target) {
        let offset = 0;
        for (let y = 0; y < array.length; y++) {
          target.set(array[y], offset);
          offset += array[y].length;
        }
      },

      flatten3dArrayTo(array, target) {
        let offset = 0;
        for (let z = 0; z < array.length; z++) {
          for (let y = 0; y < array[z].length; y++) {
            target.set(array[z][y], offset);
            offset += array[z][y].length;
          }
        }
      },

      flatten4dArrayTo(array, target) {
        let offset = 0;
        for (let l = 0; l < array.length; l++) {
          for (let z = 0; z < array[l].length; z++) {
            for (let y = 0; y < array[l][z].length; y++) {
              target.set(array[l][z][y], offset);
              offset += array[l][z][y].length;
            }
          }
        }
      },

      flattenTo(array, target) {
        if (utils.isArray(array[0])) {
          if (utils.isArray(array[0][0])) {
            if (utils.isArray(array[0][0][0])) {
              utils.flatten4dArrayTo(array, target);
            } else {
              utils.flatten3dArrayTo(array, target);
            }
          } else {
            utils.flatten2dArrayTo(array, target);
          }
        } else {
          target.set(array);
        }
      },

      splitArray(array, part) {
        const result = [];
        for (let i = 0; i < array.length; i += part) {
          result.push(new array.constructor(array.buffer, i * 4 + array.byteOffset, part));
        }
        return result;
      },

      getAstString(source, ast) {
        const lines = Array.isArray(source) ? source : source.split(/\r?\n/g);
        const start = ast.loc.start;
        const end = ast.loc.end;
        const result = [];
        if (start.line === end.line) {
          result.push(lines[start.line - 1].substring(start.column, end.column));
        } else {
          result.push(lines[start.line - 1].slice(start.column));
          for (let i = start.line; i < end.line; i++) {
            result.push(lines[i]);
          }
          result.push(lines[end.line - 1].slice(0, end.column));
        }
        return result.join('\n');
      },

      allPropertiesOf(obj) {
        const props = [];

        do {
          props.push.apply(props, Object.getOwnPropertyNames(obj));
        } while (obj = Object.getPrototypeOf(obj));

        return props;
      },

      linesToString(lines) {
        if (lines.length > 0) {
          return lines.join(';\n') + ';\n';
        } else {
          return '\n';
        }
      },
      warnDeprecated(type, oldName, newName) {
        if (newName) {
          console.warn(`You are using a deprecated ${ type } "${ oldName }". It has been replaced with "${ newName }". Fixing, but please upgrade as it will soon be removed.`);
        } else {
          console.warn(`You are using a deprecated ${ type } "${ oldName }". It has been removed. Fixing, but please upgrade as it will soon be removed.`);
        }
      },
      flipPixels: (pixels, width, height) => {
        const halfHeight = height / 2 | 0; 
        const bytesPerRow = width * 4;
        const temp = new Uint8ClampedArray(width * 4);
        const result = pixels.slice(0);
        for (let y = 0; y < halfHeight; ++y) {
          const topOffset = y * bytesPerRow;
          const bottomOffset = (height - y - 1) * bytesPerRow;

          temp.set(result.subarray(topOffset, topOffset + bytesPerRow));

          result.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

          result.set(temp, bottomOffset);
        }
        return result;
      },
      erectPackedFloat: (array, width) => {
        return array.subarray(0, width);
      },
      erect2DPackedFloat: (array, width, height) => {
        const yResults = new Array(height);
        for (let y = 0; y < height; y++) {
          const xStart = y * width;
          const xEnd = xStart + width;
          yResults[y] = array.subarray(xStart, xEnd);
        }
        return yResults;
      },
      erect3DPackedFloat: (array, width, height, depth) => {
        const zResults = new Array(depth);
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const xStart = (z * height * width) + y * width;
            const xEnd = xStart + width;
            yResults[y] = array.subarray(xStart, xEnd);
          }
          zResults[z] = yResults;
        }
        return zResults;
      },
      erectMemoryOptimizedFloat: (array, width) => {
        return array.subarray(0, width);
      },
      erectMemoryOptimized2DFloat: (array, width, height) => {
        const yResults = new Array(height);
        for (let y = 0; y < height; y++) {
          const offset = y * width;
          yResults[y] = array.subarray(offset, offset + width);
        }
        return yResults;
      },
      erectMemoryOptimized3DFloat: (array, width, height, depth) => {
        const zResults = new Array(depth);
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const offset = (z * height * width) + (y * width);
            yResults[y] = array.subarray(offset, offset + width);
          }
          zResults[z] = yResults;
        }
        return zResults;
      },
      erectFloat: (array, width) => {
        const xResults = new Float32Array(width);
        let i = 0;
        for (let x = 0; x < width; x++) {
          xResults[x] = array[i];
          i += 4;
        }
        return xResults;
      },
      erect2DFloat: (array, width, height) => {
        const yResults = new Array(height);
        let i = 0;
        for (let y = 0; y < height; y++) {
          const xResults = new Float32Array(width);
          for (let x = 0; x < width; x++) {
            xResults[x] = array[i];
            i += 4;
          }
          yResults[y] = xResults;
        }
        return yResults;
      },
      erect3DFloat: (array, width, height, depth) => {
        const zResults = new Array(depth);
        let i = 0;
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const xResults = new Float32Array(width);
            for (let x = 0; x < width; x++) {
              xResults[x] = array[i];
              i += 4;
            }
            yResults[y] = xResults;
          }
          zResults[z] = yResults;
        }
        return zResults;
      },
      erectArray2: (array, width) => {
        const xResults = new Array(width);
        const xResultsMax = width * 4;
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x, x + 2);
        }
        return xResults;
      },
      erect2DArray2: (array, width, height) => {
        const yResults = new Array(height);
        const XResultsMax = width * 4;
        for (let y = 0; y < height; y++) {
          const xResults = new Array(width);
          const offset = y * XResultsMax;
          let i = 0;
          for (let x = 0; x < XResultsMax; x += 4) {
            xResults[i++] = array.subarray(x + offset, x + offset + 2);
          }
          yResults[y] = xResults;
        }
        return yResults;
      },
      erect3DArray2: (array, width, height, depth) => {
        const xResultsMax = width * 4;
        const zResults = new Array(depth);
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const xResults = new Array(width);
            const offset = (z * xResultsMax * height) + (y * xResultsMax);
            let i = 0;
            for (let x = 0; x < xResultsMax; x += 4) {
              xResults[i++] = array.subarray(x + offset, x + offset + 2);
            }
            yResults[y] = xResults;
          }
          zResults[z] = yResults;
        }
        return zResults;
      },
      erectArray3: (array, width) => {
        const xResults = new Array(width);
        const xResultsMax = width * 4;
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x, x + 3);
        }
        return xResults;
      },
      erect2DArray3: (array, width, height) => {
        const xResultsMax = width * 4;
        const yResults = new Array(height);
        for (let y = 0; y < height; y++) {
          const xResults = new Array(width);
          const offset = y * xResultsMax;
          let i = 0;
          for (let x = 0; x < xResultsMax; x += 4) {
            xResults[i++] = array.subarray(x + offset, x + offset + 3);
          }
          yResults[y] = xResults;
        }
        return yResults;
      },
      erect3DArray3: (array, width, height, depth) => {
        const xResultsMax = width * 4;
        const zResults = new Array(depth);
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const xResults = new Array(width);
            const offset = (z * xResultsMax * height) + (y * xResultsMax);
            let i = 0;
            for (let x = 0; x < xResultsMax; x += 4) {
              xResults[i++] = array.subarray(x + offset, x + offset + 3);
            }
            yResults[y] = xResults;
          }
          zResults[z] = yResults;
        }
        return zResults;
      },
      erectArray4: (array, width) => {
        const xResults = new Array(array);
        const xResultsMax = width * 4;
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x, x + 4);
        }
        return xResults;
      },
      erect2DArray4: (array, width, height) => {
        const xResultsMax = width * 4;
        const yResults = new Array(height);
        for (let y = 0; y < height; y++) {
          const xResults = new Array(width);
          const offset = y * xResultsMax;
          let i = 0;
          for (let x = 0; x < xResultsMax; x += 4) {
            xResults[i++] = array.subarray(x + offset, x + offset + 4);
          }
          yResults[y] = xResults;
        }
        return yResults;
      },
      erect3DArray4: (array, width, height, depth) => {
        const xResultsMax = width * 4;
        const zResults = new Array(depth);
        for (let z = 0; z < depth; z++) {
          const yResults = new Array(height);
          for (let y = 0; y < height; y++) {
            const xResults = new Array(width);
            const offset = (z * xResultsMax * height) + (y * xResultsMax);
            let i = 0;
            for (let x = 0; x < xResultsMax; x += 4) {
              xResults[i++] = array.subarray(x + offset, x + offset + 4);
            }
            yResults[y] = xResults;
          }
          zResults[z] = yResults;
        }
        return zResults;
      },

      flattenFunctionToString: (source, settings) => {
        const { findDependency, thisLookup, doNotDefine } = settings;
        let flattened = settings.flattened;
        if (!flattened) {
          flattened = settings.flattened = {};
        }
        const ast = acorn.parse(source);
        const functionDependencies = [];
        let indent = 0;

        function flatten(ast) {
          if (Array.isArray(ast)) {
            const results = [];
            for (let i = 0; i < ast.length; i++) {
              results.push(flatten(ast[i]));
            }
            return results.join('');
          }
          switch (ast.type) {
            case 'Program':
              return flatten(ast.body) + (ast.body[0].type === 'VariableDeclaration' ? ';' : '');
            case 'FunctionDeclaration':
              return `function ${ast.id.name}(${ast.params.map(flatten).join(', ')}) ${ flatten(ast.body) }`;
            case 'BlockStatement': {
              const result = [];
              indent += 2;
              for (let i = 0; i < ast.body.length; i++) {
                const flat = flatten(ast.body[i]);
                if (flat) {
                  result.push(' '.repeat(indent) + flat, ';\n');
                }
              }
              indent -= 2;
              return `{\n${result.join('')}}`;
            }
            case 'VariableDeclaration':
              const declarations = utils.normalizeDeclarations(ast)
                .map(flatten)
                .filter(r => r !== null);
              if (declarations.length < 1) {
                return '';
              } else {
                return `${ast.kind} ${declarations.join(',')}`;
              }
              case 'VariableDeclarator':
                if (ast.init.object && ast.init.object.type === 'ThisExpression') {
                  const lookup = thisLookup(ast.init.property.name, true);
                  if (lookup) {
                    return `${ast.id.name} = ${flatten(ast.init)}`;
                  } else {
                    return null;
                  }
                } else {
                  return `${ast.id.name} = ${flatten(ast.init)}`;
                }
                case 'CallExpression': {
                  if (ast.callee.property.name === 'subarray') {
                    return `${flatten(ast.callee.object)}.${flatten(ast.callee.property)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                  }
                  if (ast.callee.object.name === 'gl' || ast.callee.object.name === 'context') {
                    return `${flatten(ast.callee.object)}.${flatten(ast.callee.property)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                  }
                  if (ast.callee.object.type === 'ThisExpression') {
                    functionDependencies.push(findDependency('this', ast.callee.property.name));
                    return `${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                  } else if (ast.callee.object.name) {
                    const foundSource = findDependency(ast.callee.object.name, ast.callee.property.name);
                    if (foundSource === null) {
                      return `${ast.callee.object.name}.${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                    } else {
                      functionDependencies.push(foundSource);
                      return `${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                    }
                  } else if (ast.callee.object.type === 'MemberExpression') {
                    return `${flatten(ast.callee.object)}.${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                  } else {
                    throw new Error('unknown ast.callee');
                  }
                }
                case 'ReturnStatement':
                  return `return ${flatten(ast.argument)}`;
                case 'BinaryExpression':
                  return `(${flatten(ast.left)}${ast.operator}${flatten(ast.right)})`;
                case 'UnaryExpression':
                  if (ast.prefix) {
                    return `${ast.operator} ${flatten(ast.argument)}`;
                  } else {
                    return `${flatten(ast.argument)} ${ast.operator}`;
                  }
                  case 'ExpressionStatement':
                    return `${flatten(ast.expression)}`;
                  case 'SequenceExpression':
                    return `(${flatten(ast.expressions)})`;
                  case 'ArrowFunctionExpression':
                    return `(${ast.params.map(flatten).join(', ')}) => ${flatten(ast.body)}`;
                  case 'Literal':
                    return ast.raw;
                  case 'Identifier':
                    return ast.name;
                  case 'MemberExpression':
                    if (ast.object.type === 'ThisExpression') {
                      return thisLookup(ast.property.name);
                    }
                    if (ast.computed) {
                      return `${flatten(ast.object)}[${flatten(ast.property)}]`;
                    }
                    return flatten(ast.object) + '.' + flatten(ast.property);
                  case 'ThisExpression':
                    return 'this';
                  case 'NewExpression':
                    return `new ${flatten(ast.callee)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
                  case 'ForStatement':
                    return `for (${flatten(ast.init)};${flatten(ast.test)};${flatten(ast.update)}) ${flatten(ast.body)}`;
                  case 'AssignmentExpression':
                    return `${flatten(ast.left)}${ast.operator}${flatten(ast.right)}`;
                  case 'UpdateExpression':
                    return `${flatten(ast.argument)}${ast.operator}`;
                  case 'IfStatement':
                    return `if (${flatten(ast.test)}) ${flatten(ast.consequent)}`;
                  case 'ThrowStatement':
                    return `throw ${flatten(ast.argument)}`;
                  case 'ObjectPattern':
                    return ast.properties.map(flatten).join(', ');
                  case 'ArrayPattern':
                    return ast.elements.map(flatten).join(', ');
                  case 'DebuggerStatement':
                    return 'debugger;';
                  case 'ConditionalExpression':
                    return `${flatten(ast.test)}?${flatten(ast.consequent)}:${flatten(ast.alternate)}`;
                  case 'Property':
                    if (ast.kind === 'init') {
                      return flatten(ast.key);
                    }
          }
          throw new Error(`unhandled ast.type of ${ ast.type }`);
        }
        const result = flatten(ast);
        if (functionDependencies.length > 0) {
          const flattenedFunctionDependencies = [];
          for (let i = 0; i < functionDependencies.length; i++) {
            const functionDependency = functionDependencies[i];
            if (!flattened[functionDependency]) {
              flattened[functionDependency] = true;
            }
            flattenedFunctionDependencies.push(utils.flattenFunctionToString(functionDependency, settings) + '\n');
          }
          return flattenedFunctionDependencies.join('') + result;
        }
        return result;
      },

      normalizeDeclarations: (ast) => {
        if (ast.type !== 'VariableDeclaration') throw new Error('Ast is not of type "VariableDeclaration"');
        const normalizedDeclarations = [];
        for (let declarationIndex = 0; declarationIndex < ast.declarations.length; declarationIndex++) {
          const declaration = ast.declarations[declarationIndex];
          if (declaration.id && declaration.id.type === 'ObjectPattern' && declaration.id.properties) {
            const { properties } = declaration.id;
            for (let propertyIndex = 0; propertyIndex < properties.length; propertyIndex++) {
              const property = properties[propertyIndex];
              if (property.value.type === 'ObjectPattern' && property.value.properties) {
                for (let subPropertyIndex = 0; subPropertyIndex < property.value.properties.length; subPropertyIndex++) {
                  const subProperty = property.value.properties[subPropertyIndex];
                  if (subProperty.type === 'Property') {
                    normalizedDeclarations.push({
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: subProperty.key.name
                      },
                      init: {
                        type: 'MemberExpression',
                        object: {
                          type: 'MemberExpression',
                          object: declaration.init,
                          property: {
                            type: 'Identifier',
                            name: property.key.name
                          },
                          computed: false
                        },
                        property: {
                          type: 'Identifier',
                          name: subProperty.key.name
                        },
                        computed: false
                      }
                    });
                  } else {
                    throw new Error('unexpected state');
                  }
                }
              } else if (property.value.type === 'Identifier') {
                normalizedDeclarations.push({
                  type: 'VariableDeclarator',
                  id: {
                    type: 'Identifier',
                    name: property.value && property.value.name ? property.value.name : property.key.name
                  },
                  init: {
                    type: 'MemberExpression',
                    object: declaration.init,
                    property: {
                      type: 'Identifier',
                      name: property.key.name
                    },
                    computed: false
                  }
                });
              } else {
                throw new Error('unexpected state');
              }
            }
          } else if (declaration.id && declaration.id.type === 'ArrayPattern' && declaration.id.elements) {
            const { elements } = declaration.id;
            for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
              const element = elements[elementIndex];
              if (element.type === 'Identifier') {
                normalizedDeclarations.push({
                  type: 'VariableDeclarator',
                  id: {
                    type: 'Identifier',
                    name: element.name
                  },
                  init: {
                    type: 'MemberExpression',
                    object: declaration.init,
                    property: {
                      type: 'Literal',
                      value: elementIndex,
                      raw: elementIndex.toString(),
                      start: element.start,
                      end: element.end
                    },
                    computed: true
                  }
                });
              } else {
                throw new Error('unexpected state');
              }
            }
          } else {
            normalizedDeclarations.push(declaration);
          }
        }
        return normalizedDeclarations;
      },

      splitHTMLImageToRGB: (gpu, image) => {
        const rKernel = gpu.createKernel(function(a) {
          const pixel = a[this.thread.y][this.thread.x];
          return pixel.r * 255;
        }, {
          output: [image.width, image.height],
          precision: 'unsigned',
          argumentTypes: { a: 'HTMLImage' },
        });
        const gKernel = gpu.createKernel(function(a) {
          const pixel = a[this.thread.y][this.thread.x];
          return pixel.g * 255;
        }, {
          output: [image.width, image.height],
          precision: 'unsigned',
          argumentTypes: { a: 'HTMLImage' },
        });
        const bKernel = gpu.createKernel(function(a) {
          const pixel = a[this.thread.y][this.thread.x];
          return pixel.b * 255;
        }, {
          output: [image.width, image.height],
          precision: 'unsigned',
          argumentTypes: { a: 'HTMLImage' },
        });
        const aKernel = gpu.createKernel(function(a) {
          const pixel = a[this.thread.y][this.thread.x];
          return pixel.a * 255;
        }, {
          output: [image.width, image.height],
          precision: 'unsigned',
          argumentTypes: { a: 'HTMLImage' },
        });
        const result = [
          rKernel(image),
          gKernel(image),
          bKernel(image),
          aKernel(image),
        ];
        result.rKernel = rKernel;
        result.gKernel = gKernel;
        result.bKernel = bKernel;
        result.aKernel = aKernel;
        result.gpu = gpu;
        return result;
      },

      splitRGBAToCanvases: (gpu, rgba, width, height) => {
        const visualKernelR = gpu.createKernel(function(v) {
          const pixel = v[this.thread.y][this.thread.x];
          this.color(pixel.r / 255, 0, 0, 255);
        }, {
          output: [width, height],
          graphical: true,
          argumentTypes: { v: 'Array2D(4)' }
        });
        visualKernelR(rgba);

        const visualKernelG = gpu.createKernel(function(v) {
          const pixel = v[this.thread.y][this.thread.x];
          this.color(0, pixel.g / 255, 0, 255);
        }, {
          output: [width, height],
          graphical: true,
          argumentTypes: { v: 'Array2D(4)' }
        });
        visualKernelG(rgba);

        const visualKernelB = gpu.createKernel(function(v) {
          const pixel = v[this.thread.y][this.thread.x];
          this.color(0, 0, pixel.b / 255, 255);
        }, {
          output: [width, height],
          graphical: true,
          argumentTypes: { v: 'Array2D(4)' }
        });
        visualKernelB(rgba);

        const visualKernelA = gpu.createKernel(function(v) {
          const pixel = v[this.thread.y][this.thread.x];
          this.color(255, 255, 255, pixel.a / 255);
        }, {
          output: [width, height],
          graphical: true,
          argumentTypes: { v: 'Array2D(4)' }
        });
        visualKernelA(rgba);
        return [
          visualKernelR.canvas,
          visualKernelG.canvas,
          visualKernelB.canvas,
          visualKernelA.canvas,
        ];
      },

      getMinifySafeName: (fn) => {
        try {
          const ast = acorn.parse(`const value = ${fn.toString()}`);
          const { init } = ast.body[0].declarations[0];
          return init.body.name || init.body.body[0].argument.name;
        } catch (e) {
          throw new Error('Unrecognized function type.  Please use `() => yourFunctionVariableHere` or function() { return yourFunctionVariableHere; }');
        }
      },
      sanitizeName: function(name) {
        if (dollarSign.test(name)) {
          name = name.replace(dollarSign, 'S_S');
        }
        if (doubleUnderscore.test(name)) {
          name = name.replace(doubleUnderscore, 'U_U');
        } else if (singleUnderscore.test(name)) {
          name = name.replace(singleUnderscore, 'u_u');
        }
        return name;
      }
    };

    const dollarSign = /\$/;
    const doubleUnderscore = /__/;
    const singleUnderscore = /_/;

    const _systemEndianness = utils.getSystemEndianness();

    module.exports = {
      utils
    };
    },{"./input":110,"./texture":113,"acorn":1}]},{},[107])(107)
    });
    });

    var gpuBrowser$1 = unwrapExports(gpuBrowser);

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root.Date.now();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;

        return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var lodash_throttle = throttle;

    function createCanvas(
      [width, height],
      { hidden = false, el = document.body, id, style, className } = {}
    ) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      if (style) {
        canvas.style = style;
      }
      if (className) {
        canvas.className = className;
      }
      canvas.hidden = hidden;
      if (id) {
        canvas.id = id;
      }
      el.appendChild(canvas);

      return canvas;
    }

    function randomImageURL() {
      const randomString = Math.random().toString(36).substring(2);
      return `https://picsum.photos/1500/1000?_=${randomString}`;
    }

    function saveImage(canvas, { filename = 'blendmode.jpeg' } = {}) {
      const img = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.setAttribute('download', filename);
      link.href = img;
      link.style = 'display: none';
      document.body.appendChild(link);
      link.click();
    }

    /**
     * Functions
     **/

    const minimum = `function minimum(pix) {
  return Math.min(pix[0], Math.min(pix[1], pix[2]));
}`;

    const maximum = `function maximum(pix) {
  return Math.max(pix[0], Math.max(pix[1], pix[2]));
}`;

    // return the [min, mid, max] indices
    const mmm = `function mmm(pix) {
  let min = 0;
  let mid = 0;
  let max = 0;

  if (pix[0] < pix[1] && pix[0] < pix[2]) {
    min = 0;
    if (pix[1] > pix[2]) {
      max = 1;
      mid = 2;
    } else {
      max = 2;
      mid = 1;
    }
  } else if (pix[1] < pix[0] && pix[1] < pix[2]) {
    min = 1;
    if (pix[0] > pix[2]) {
      max = 0;
      mid = 2;
    } else {
      max = 2;
      mid = 0;
    }
  } else {
    min = 2;
    if (pix[0] > pix[1]) {
      max = 0;
      mid = 1;
    } else {
      max = 1;
      mid = 0;
    }
  }
  return [min, mid, max];
}`;

    const lum = `function lum(pix) {
  return 0.3 * pix[0] + 0.59 * pix[1] + 0.11 * pix[2];
}`;

    const clipColor = `function clipColor(pix) {
  const l = lum(pix);
  const n = minimum(pix);
  const x = maximum(pix);

  let c = [pix[0], pix[1], pix[2], 1];

  if (n < 0) {
    c[0] = l + (((pix[0] - l) * l) / (l - n));
    c[1] = l + (((pix[1] - l) * l) / (l - n));
    c[2] = l + (((pix[2] - l) * l) / (l - n));
  }

  if (x > 1) {
    c[0] = l + (((pix[0] - l) * (1 - l)) / (x - l));
    c[1] = l + (((pix[1] - l) * (1 - l)) / (x - l));
    c[2] = l + (((pix[2] - l) * (1 - l)) / (x - l));
  }

  return c;
}`;

    const sat = `function sat(pix) {
  return maximum(pix) - minimum(pix);
}`;

    const setLum = `function setLum(pix, l) {
  const d = l - lum(pix);
  return clipColor([
    pix[0] + d,
    pix[1] + d,
    pix[2] + d,
    1
  ]);
}`;

    const setSat = `function setSat(pix, s) {
  const [min, mid, max] = mmm(pix);
  let c = [pix[0], pix[1], pix[2], 1];
  let c_mid = 0;
  if (!(pix[0] === pix[1] && pix[0] === pix[2])) {
    if (pix[0] < pix[1] && pix[0] < pix[2]) {
      if (pix[1] > pix[2]) {
        c_mid = (((pix[2] - pix[0]) * s) / (pix[1] - pix[0]));
      } else {
        c_mid = (((pix[1] - pix[0]) * s) / (pix[2] - pix[0]));
      }
    } else if (pix[1] < pix[0] && pix[1] < pix[2]) {
      if (pix[0] > pix[2]) {
        c_mid = (((pix[2] - pix[1]) * s) / (pix[0] - pix[1]));
      } else {
        c_mid = (((pix[0] - pix[1]) * s) / (pix[2] - pix[1]));
      }
    } else {
      if (pix[0] > pix[1]) {
        c_mid = (((pix[1] - pix[2]) * s) / (pix[0] - pix[2]));
      } else {
        c_mid = (((pix[0] - pix[2]) * s) / (pix[1] - pix[2]));
      }
    }

    // Set Values
    if (mid === 0) {
      c[0] = c_mid;
    } else if (mid === 1) {
      c[1] = c_mid;
    } else if (mid === 2) {
      c[2] = c_mid;
    }

    if (max === 0) {
      c[0] = s;
    } else if (max === 1) {
      c[1] = s;
    } else if (max === 2) {
      c[2] = s;
    }
  } else {
    if (mid === 0) {
      c[0] = 0;
    } else if (mid === 1) {
      c[1] = 0;
    } else if (mid === 2) {
      c[2] = 0;
    }

    if (max === 0) {
      c[0] = 0;
    } else if (max === 1) {
      c[1] = 0;
    } else if (max === 2) {
      c[2] = 0;
    }
  }

  if (min === 0) {
    c[0] = 0;
  } else if (min === 1) {
    c[1] = 0;
  } else if (min === 2) {
    c[2] = 0;
  }
  return c;
}`;

    const calcAlpha = `function calcAlpha(cb, alphaB, cs, alphaS) {
  return cs * alphaS + cb * alphaB * (1 - alphaS);
}`;

    const applyAlpha = `function applyAlpha(backdrop, source) {
  return [
    calcAlpha(backdrop[0], backdrop[3], source[0], source[3]),
    calcAlpha(backdrop[1], backdrop[3], source[1], source[3]),
    calcAlpha(backdrop[2], backdrop[3], source[2], source[3]),
  ];
}`;

    /**
    * Kernels
    **/

    const normal = `function normal(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix2[0],
    pix2[1],
    pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const add = `function add(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const alpha = pix2[3] + pix1[3] * (1 - pix2[3]);
  const blend = [
    pix1[0] + pix2[0],
    pix1[1] + pix2[1],
    pix1[2] + pix2[2],
    pix2[3]
  ];
  const alphaB = pix1[3];
  const alphaS = pix2[3];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const subtract = `function subtract(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] - pix2[0],
    pix1[1] - pix2[1],
    pix1[2] - pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const darken = `function darken(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    Math.min(pix1[0], pix2[0]),
    Math.min(pix1[1], pix2[1]),
    Math.min(pix1[2], pix2[2]),
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const lighten = `function lighten(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    Math.max(pix1[0], pix2[0]),
    Math.max(pix1[1], pix2[1]),
    Math.max(pix1[2], pix2[2]),
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const multiply = `function multiply(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] * pix2[0],
    pix1[1] * pix2[1],
    pix1[2] * pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const divide = `function divide(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] / pix2[0],
    pix1[1] / pix2[1],
    pix1[2] / pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const screen = `function screen(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    1 - (1 - pix1[0]) * (1 - pix2[0]),
    1 - (1 - pix1[1]) * (1 - pix2[1]),
    1 - (1 - pix1[2]) * (1 - pix2[2]),
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const overlay = `function overlay(img1, img2, cutoff) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let r1 = pix1[0];
  let g1 = pix1[1];
  let b1 = pix1[2];
  let r2 = pix2[0];
  let g2 = pix2[1];
  let b2 = pix2[2];

  let r = 0;
  if (r1 < cutoff) {
    r = r1 * r2 * 2;
  } else {
    r = 1 - 2 * (1 - r1) * (1 - r2);
  }

  let g = 0;
  if (g1 < cutoff) {
    g = g1 * g2 * 2;
  } else {
    g = 1 - 2 * (1 - g1) * (1 - g2);
  }

  let b = 0;
  if (b1 < cutoff) {
    b = b1 * b2 * 2;
  } else {
    b = 1 - 2 * (1 - b1) * (1 - b2);
  }

  const blend = [r, g, b, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const hardLight = `function hardLight(img1, img2) {
  const cutoff = 0.5;
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let r1 = pix1[0];
  let g1 = pix1[1];
  let b1 = pix1[2];
  let r2 = pix2[0];
  let g2 = pix2[1];
  let b2 = pix2[2];

  let r = 0;
  if (r2 < cutoff) {
    r = r1 * r2 * 2;
  } else {
    r = 1 - 2 * (1 - r1) * (1 - r2);
  }

  let g = 0;
  if (g2 < cutoff) {
    g = g1 * g2 * 2;
  } else {
    g = 1 - 2 * (1 - g1) * (1 - g2);
  }

  let b = 0;
  if (b2 < cutoff) {
    b = b1 * b2 * 2;
  } else {
    b = 1 - 2 * (1 - b1) * (1 - b2);
  }

  const blend = [r, g, b, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const colorBurn = `function colorBurn(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    1 - (1 - pix1[0]) / pix2[0],
    1 - (1 - pix1[1]) / pix2[1],
    1 - (1 - pix1[2]) / pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const linearBurn = `function linearBurn(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] + pix2[0] - 1,
    pix1[1] + pix2[1] - 1,
    pix1[2] + pix2[2] - 1,
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const colorDodge = `function colorDodge(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const red = Math.min(1, pix1[0] / (1 - pix2[0]))
  const green = Math.min(1, pix1[1] / (1 - pix2[1]))
  const blue = Math.min(1, pix1[2] / (1 - pix2[2]))
  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const softLight = `function softLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];

  let red = 0;
  if (pix2[0] <= 0.5) {
    red = pix1[0] - (1 - 2 * pix2[0]) * pix1[0] * (1 - pix1[0]);
  } else {
    let d = 0;
    if (pix1[0] <= 0.25) {
      d = ((16 * pix1[0] - 12) * pix1[0] + 4) * pix1[0];
    } else {
      d = Math.sqrt(pix1[0]);
    }
    red = pix1[0] + (2 * pix2[0] - 1) * (d - pix1[0]);
  }

  let green = 0;
  if (pix2[1] <= 0.5) {
    green = pix1[1] - (1 - 2 * pix2[1]) * pix1[1] * (1 - pix1[1]);
  } else {
    let d = 0;
    if (pix1[1] <= 0.25) {
      d = ((16 * pix1[1] - 12) * pix1[1] + 4) * pix1[1];
    } else {
      d = Math.sqrt(pix1[1]);
    }
    green = pix1[1] + (2 * pix2[1] - 1) * (d - pix1[1]);
  }

  let blue = 0;
  if (pix2[2] <= 0.5) {
    blue = pix1[2] - (1 - 2 * pix2[2]) * pix1[2] * (1 - pix1[2]);
  } else {
    let d = 0;
    if (pix1[2] <= 0.25) {
      d = ((16 * pix1[2] - 12) * pix1[2] + 4) * pix1[2];
    } else {
      d = Math.sqrt(pix1[2]);
    }
    blue = pix1[2] + (2 * pix2[2] - 1) * (d - pix1[2]);
  }

  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const difference = `function difference(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    Math.abs(pix1[0] - pix2[0]),
    Math.abs(pix1[1] - pix2[1]),
    Math.abs(pix1[2] - pix2[2]),
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const exclusion = `function exclusion(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] + pix2[0] - 2 * pix1[0] * pix2[0],
    pix1[1] + pix2[1] - 2 * pix1[1] * pix2[1],
    pix1[2] + pix2[2] - 2 * pix1[2] * pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const hardMix = `function hardMix(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const red = (pix1[0] + pix2[0]) > 1.0 ? 1.0 : 0;
  const green = (pix1[1] + pix2[1]) > 1.0 ? 1.0 : 0;
  const blue = (pix1[2] + pix2[2]) > 1.0 ? 1.0 : 0;
  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const lighterColor = `function lighterColor(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const total1 = pix1[0] + pix1[1] + pix1[2];
  const total2 = pix2[0] + pix2[1] + pix2[2];
  const blend = [pix2[0], pix2[1], pix2[2], pix2[3]];
  if (total1 > total2) {
    blend[0] = pix1[0];
    blend[1] = pix1[1];
    blend[2] = pix1[2];
  }
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const darkerColor = `function darkerColor(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const total1 = pix1[0] + pix1[1] + pix1[2];
  const total2 = pix2[0] + pix2[1] + pix2[2];
  const blend = [pix2[0], pix2[1], pix2[2], pix2[3]];
  if (total1 < total2) {
    blend[0] = pix1[0];
    blend[1] = pix1[1];
    blend[2] = pix1[2];
  }
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const pinLight = `function pinLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = pix1[0];
  if (pix2[0] > 0.5) {
    if (pix1[0] < pix2[0]) {
      red = pix2[0];
    }
  } else {
    if (pix1[0] > pix2[0]) {
      red = pix2[0];
    }
  }

  let green = pix1[1];
  if (pix2[1] > 0.5) {
    if (pix1[1] < pix2[1]) {
      green = pix2[1];
    }
  } else {
    if (pix1[1] > pix2[1]) {
      green = pix2[1];
    }
  }

  let blue = pix1[2];
  if (pix2[2] > 0.5) {
    if (pix1[2] < pix2[2]) {
      blue = pix2[2];
    }
  } else {
    if (pix1[2] > pix2[2]) {
      blue = pix2[2];
    }
  }

  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0], 
    composite[1], 
    composite[2], 
    1
  );
}`;

    const vividLight = `function vividLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = 0;
  if (pix2[0] > 0.5) { // dodge
    red = Math.min(1, pix1[0] / (1 - pix2[0]))
  } else { // burn
    red = 1 - (1 - pix1[0]) / pix2[0];
  }

  let green = 0;
  if (pix2[1] > 0.5) {
    green = Math.min(1, pix1[1] / (1 - pix2[1]));
  } else {
    green = 1 - (1 - pix1[1]) / pix2[1];
  }

  let blue = 0;
  if (pix2[2] > 0.5) {
    blue = Math.min(1, pix1[2] / (1 - pix2[2]));
  } else {
    blue = 1 - (1 - pix1[2]) / pix2[2];
  }

  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const linearLight = `function linearLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = 0;
  if (pix2[0] > 0.5) {
    // linear dodge
    red = pix1[0] + pix2[0];
  } else {
    // linear burn
    red = pix1[0] + pix2[0] - 1;
  }

  let green = 0;
  if (pix2[1] > 0.5) {
    green = pix1[1] + pix2[1];
  } else {
    green = pix1[1] + pix2[1] - 1;
  }

  let blue = 0;
  if (pix2[2] > 0.5) {
    blue = pix1[2] + pix2[2];
  } else {
    blue = pix1[2] + pix2[2] - 1;
  }

  const blend = [red, green, blue, pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const hue = `function hue(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const luminosity = lum(pix1);
  const saturation = sat(pix1);
  const newSat = setSat(pix2, saturation);
  const pix = setLum(newSat, luminosity);
  const blend = [pix[0], pix[1], pix[2], pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const saturation = `function saturation(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(setSat(pix1, sat(pix2)), lum(pix1));
  const blend = [pix[0], pix[1], pix[2], pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const color = `function color(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(pix2, lum(pix1));
  const blend = [pix[0], pix[1], pix[2], pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    const luminosity = `function luminosity(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(pix1, lum(pix2));
  const blend = [pix[0], pix[1], pix[2], pix2[3]];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}`;

    /**
     * Similar to disolve mode except no dither pattern is created. Instead random values are generated each time it is
     * run. If the random value is less than the given cutoff the component from the first channel will be used, otherwise
     * the second pixel component will be used.
     * @param {Image} img1 
     * @param {Image} img2 
     * @param {number} cutoff 
     */
    const random_component =  function random_component(img1, img2, cutoff) {
      const pix1 = img1[this.thread.y][this.thread.x];
      const pix2 = img2[this.thread.y][this.thread.x];
      
      const r = Math.random() < cutoff ? pix1[0] : pix2[0];
      const g = Math.random() < cutoff ? pix1[1] : pix2[1];
      const b = Math.random() < cutoff ? pix1[2] : pix2[2];
      this.color(r, g, b, 1);

      // const pix = Math.random() < cutoff ? pix1 : pix2;
      // this.color(pix[0], pix[1], pix[2]);
    };

    var kernels = /*#__PURE__*/Object.freeze({
        __proto__: null,
        minimum: minimum,
        maximum: maximum,
        mmm: mmm,
        lum: lum,
        clipColor: clipColor,
        sat: sat,
        setLum: setLum,
        setSat: setSat,
        calcAlpha: calcAlpha,
        applyAlpha: applyAlpha,
        normal: normal,
        add: add,
        subtract: subtract,
        darken: darken,
        lighten: lighten,
        multiply: multiply,
        divide: divide,
        screen: screen,
        overlay: overlay,
        hardLight: hardLight,
        colorBurn: colorBurn,
        linearBurn: linearBurn,
        colorDodge: colorDodge,
        softLight: softLight,
        difference: difference,
        exclusion: exclusion,
        hardMix: hardMix,
        lighterColor: lighterColor,
        darkerColor: darkerColor,
        pinLight: pinLight,
        vividLight: vividLight,
        linearLight: linearLight,
        hue: hue,
        saturation: saturation,
        color: color,
        luminosity: luminosity,
        random_component: random_component
    });

    /* src/components/Select.svelte generated by Svelte v3.23.2 */

    const file = "src/components/Select.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (11:6) {:else}
    function create_else_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[5].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[5];
    			option.value = option.__value;
    			attr_dev(option, "class", "svelte-1ppzu86");
    			add_location(option, file, 11, 8, 317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[5].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*options*/ 2 && option_value_value !== (option_value_value = /*option*/ ctx[5])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(11:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:6) {#if typeof option === 'string'}
    function create_if_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[5] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[5];
    			option.value = option.__value;
    			attr_dev(option, "class", "svelte-1ppzu86");
    			add_location(option, file, 9, 8, 254);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[5] + "")) set_data_dev(t, t_value);

    			if (dirty & /*options*/ 2 && option_value_value !== (option_value_value = /*option*/ ctx[5])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(9:6) {#if typeof option === 'string'}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#each options as option}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*option*/ ctx[5] === "string") return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:4) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {:else}
    function create_else_block(ctx) {
    	let span;
    	let t_value = /*selected*/ ctx[0].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "value svelte-1ppzu86");
    			add_location(span, file, 18, 4, 492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected*/ 1 && t_value !== (t_value = /*selected*/ ctx[0].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if typeof selected === 'string'}
    function create_if_block(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*selected*/ ctx[0]);
    			attr_dev(span, "class", "value svelte-1ppzu86");
    			add_location(span, file, 16, 4, 440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected*/ 1) set_data_dev(t, /*selected*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:2) {#if typeof selected === 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let span;
    	let select;
    	let t;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (typeof /*selected*/ ctx[0] === "string") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if_block.c();
    			attr_dev(select, "name", "shipping-country");
    			attr_dev(select, "class", "svelte-1ppzu86");
    			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file, 6, 2, 104);
    			attr_dev(span, "class", "select-container svelte-1ppzu86");
    			add_location(span, file, 5, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selected*/ ctx[0]);
    			append_dev(span, t);
    			if_block.m(span, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4]),
    					listen_dev(select, "change", /*change_handler*/ ctx[2], false, false, false),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options*/ 2) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selected, options*/ 3) {
    				select_option(select, /*selected*/ ctx[0]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { options = [] } = $$props;
    	let { selected } = $$props;
    	const writable_props = ["options", "selected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Select", $$slots, []);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(0, selected);
    		$$invalidate(1, options);
    	}

    	$$self.$set = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ options, selected });

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, options, change_handler, blur_handler, select_change_handler];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { options: 1, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<Select> was created without expected prop 'selected'");
    		}
    	}

    	get options() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Image.svelte generated by Svelte v3.23.2 */

    const file$1 = "src/components/Image.svelte";

    function create_fragment$1(ctx) {
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			attr_dev(img0, "class", "visible svelte-1je8bdh");
    			if (img0.src !== (img0_src_value = /*src*/ ctx[1])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", /*alt*/ ctx[2]);
    			attr_dev(img0, "crossorigin", "anonymous");
    			add_location(img0, file$1, 6, 0, 81);
    			attr_dev(img1, "class", "source svelte-1je8bdh");
    			if (img1.src !== (img1_src_value = /*src*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", /*alt*/ ctx[2]);
    			attr_dev(img1, "crossorigin", "anonymous");
    			add_location(img1, file$1, 13, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, img1, anchor);
    			/*img1_binding*/ ctx[4](img1);

    			if (!mounted) {
    				dispose = listen_dev(img1, "load", /*load_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 2 && img0.src !== (img0_src_value = /*src*/ ctx[1])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*alt*/ 4) {
    				attr_dev(img0, "alt", /*alt*/ ctx[2]);
    			}

    			if (dirty & /*src*/ 2 && img1.src !== (img1_src_value = /*src*/ ctx[1])) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty & /*alt*/ 4) {
    				attr_dev(img1, "alt", /*alt*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(img1);
    			/*img1_binding*/ ctx[4](null);
    			mounted = false;
    			dispose();
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
    	let { src } = $$props;
    	let { alt = "" } = $$props;
    	let { image } = $$props;
    	const writable_props = ["src", "alt", "image"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Image> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Image", $$slots, []);

    	function load_handler(event) {
    		bubble($$self, event);
    	}

    	function img1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			image = $$value;
    			$$invalidate(0, image);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("alt" in $$props) $$invalidate(2, alt = $$props.alt);
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    	};

    	$$self.$capture_state = () => ({ src, alt, image });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("alt" in $$props) $$invalidate(2, alt = $$props.alt);
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [image, src, alt, load_handler, img1_binding];
    }

    class Image extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { src: 1, alt: 2, image: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Image",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[1] === undefined && !("src" in props)) {
    			console.warn("<Image> was created without expected prop 'src'");
    		}

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<Image> was created without expected prop 'image'");
    		}
    	}

    	get src() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alt() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/UploadImage.svelte generated by Svelte v3.23.2 */

    const file$2 = "src/components/UploadImage.svelte";

    function create_fragment$2(ctx) {
    	let div0;
    	let label;
    	let t0;
    	let input;
    	let t1;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label = element("label");
    			t0 = text("Choose Image\n    ");
    			input = element("input");
    			t1 = space();
    			div1 = element("div");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "svelte-14qbbm2");
    			add_location(input, file$2, 23, 4, 566);
    			attr_dev(label, "class", "bg-green svelte-14qbbm2");
    			add_location(label, file$2, 21, 2, 520);
    			add_location(div0, file$2, 20, 0, 512);
    			attr_dev(div1, "class", "source svelte-14qbbm2");
    			add_location(div1, file$2, 27, 0, 630);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(label, input);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*onChange*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
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
    	let { onLoad = () => {
    		
    	} } = $$props;

    	// export let img; // HTMLImageElement
    	function onChange() {
    		if (this.files && this.files[0]) {
    			const img = document.createElement("img");
    			const src = URL.createObjectURL(this.files[0]); // set src to blob url
    			img.src = src;
    			img.hidden = true;

    			img.onload = () => {
    				onLoad(src);
    			};

    			img.onerror = onerror;
    			const source = document.querySelector(".source");
    			source.appendChild(img);
    		}
    	}

    	const writable_props = ["onLoad"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UploadImage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("UploadImage", $$slots, []);

    	$$self.$set = $$props => {
    		if ("onLoad" in $$props) $$invalidate(1, onLoad = $$props.onLoad);
    	};

    	$$self.$capture_state = () => ({ onLoad, onChange });

    	$$self.$inject_state = $$props => {
    		if ("onLoad" in $$props) $$invalidate(1, onLoad = $$props.onLoad);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onChange, onLoad];
    }

    class UploadImage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { onLoad: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UploadImage",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get onLoad() {
    		throw new Error("<UploadImage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onLoad(value) {
    		throw new Error("<UploadImage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    var createClass = function () {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();

    var slicedToArray = function () {
      function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
          for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);

            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"]) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }

        return _arr;
      }

      return function (arr, i) {
        if (Array.isArray(arr)) {
          return arr;
        } else if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i);
        } else {
          throw new TypeError("Invalid attempt to destructure non-iterable instance");
        }
      };
    }();

    String.prototype.startsWith = String.prototype.startsWith || function (needle) {
        return this.indexOf(needle) === 0;
    };
    String.prototype.padStart = String.prototype.padStart || function (len, pad) {
        var str = this;while (str.length < len) {
            str = pad + str;
        }return str;
    };

    var colorNames = { cb: '0f8ff', tqw: 'aebd7', q: '-ffff', qmrn: '7fffd4', zr: '0ffff', bg: '5f5dc', bsq: 'e4c4', bck: '---', nch: 'ebcd', b: '--ff', bvt: '8a2be2', brwn: 'a52a2a', brw: 'deb887', ctb: '5f9ea0', hrt: '7fff-', chcT: 'd2691e', cr: '7f50', rnw: '6495ed', crns: '8dc', crms: 'dc143c', cn: '-ffff', Db: '--8b', Dcn: '-8b8b', Dgnr: 'b8860b', Dgr: 'a9a9a9', Dgrn: '-64-', Dkhk: 'bdb76b', Dmgn: '8b-8b', Dvgr: '556b2f', Drng: '8c-', Drch: '9932cc', Dr: '8b--', Dsmn: 'e9967a', Dsgr: '8fbc8f', DsTb: '483d8b', DsTg: '2f4f4f', Dtrq: '-ced1', Dvt: '94-d3', ppnk: '1493', pskb: '-bfff', mgr: '696969', grb: '1e90ff', rbrc: 'b22222', rwht: 'af0', stg: '228b22', chs: '-ff', gnsb: 'dcdcdc', st: '8f8ff', g: 'd7-', gnr: 'daa520', gr: '808080', grn: '-8-0', grnw: 'adff2f', hnw: '0fff0', htpn: '69b4', nnr: 'cd5c5c', ng: '4b-82', vr: '0', khk: '0e68c', vnr: 'e6e6fa', nrb: '0f5', wngr: '7cfc-', mnch: 'acd', Lb: 'add8e6', Lcr: '08080', Lcn: 'e0ffff', Lgnr: 'afad2', Lgr: 'd3d3d3', Lgrn: '90ee90', Lpnk: 'b6c1', Lsmn: 'a07a', Lsgr: '20b2aa', Lskb: '87cefa', LsTg: '778899', Lstb: 'b0c4de', Lw: 'e0', m: '-ff-', mgrn: '32cd32', nn: 'af0e6', mgnt: '-ff', mrn: '8--0', mqm: '66cdaa', mmb: '--cd', mmrc: 'ba55d3', mmpr: '9370db', msg: '3cb371', mmsT: '7b68ee', '': '-fa9a', mtr: '48d1cc', mmvt: 'c71585', mnLb: '191970', ntc: '5fffa', mstr: 'e4e1', mccs: 'e4b5', vjw: 'dead', nv: '--80', c: 'df5e6', v: '808-0', vrb: '6b8e23', rng: 'a5-', rngr: '45-', rch: 'da70d6', pgnr: 'eee8aa', pgrn: '98fb98', ptrq: 'afeeee', pvtr: 'db7093', ppwh: 'efd5', pchp: 'dab9', pr: 'cd853f', pnk: 'c0cb', pm: 'dda0dd', pwrb: 'b0e0e6', prp: '8-080', cc: '663399', r: '--', sbr: 'bc8f8f', rb: '4169e1', sbrw: '8b4513', smn: 'a8072', nbr: '4a460', sgrn: '2e8b57', ssh: '5ee', snn: 'a0522d', svr: 'c0c0c0', skb: '87ceeb', sTb: '6a5acd', sTgr: '708090', snw: 'afa', n: '-ff7f', stb: '4682b4', tn: 'd2b48c', t: '-8080', thst: 'd8bfd8', tmT: '6347', trqs: '40e0d0', vt: 'ee82ee', whT: '5deb3', wht: '', hts: '5f5f5', w: '-', wgrn: '9acd32' };

    function printNum(num) {
        var decs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        var str = decs > 0 ? num.toFixed(decs).replace(/0+$/, '').replace(/\.$/, '') : num.toString();
        return str || '0';
    }

    var Color = function () {
        function Color(r, g, b, a) {
            classCallCheck(this, Color);


            var that = this;
            function parseString(input) {

                if (input.startsWith('hsl')) {
                    var _input$match$map = input.match(/([\-\d\.e]+)/g).map(Number),
                        _input$match$map2 = slicedToArray(_input$match$map, 4),
                        h = _input$match$map2[0],
                        s = _input$match$map2[1],
                        l = _input$match$map2[2],
                        _a = _input$match$map2[3];

                    if (_a === undefined) {
                        _a = 1;
                    }

                    h /= 360;
                    s /= 100;
                    l /= 100;
                    that.hsla = [h, s, l, _a];
                } else if (input.startsWith('rgb')) {
                    var _input$match$map3 = input.match(/([\-\d\.e]+)/g).map(Number),
                        _input$match$map4 = slicedToArray(_input$match$map3, 4),
                        _r = _input$match$map4[0],
                        _g = _input$match$map4[1],
                        _b = _input$match$map4[2],
                        _a2 = _input$match$map4[3];

                    if (_a2 === undefined) {
                        _a2 = 1;
                    }

                    that.rgba = [_r, _g, _b, _a2];
                } else {
                    if (input.startsWith('#')) {
                        that.rgba = Color.hexToRgb(input);
                    } else {
                        that.rgba = Color.nameToRgb(input) || Color.hexToRgb(input);
                    }
                }
            }

            if (r === undefined) ; else if (Array.isArray(r)) {
                this.rgba = r;
            } else if (b === undefined) {
                var color = r && '' + r;
                if (color) {
                    parseString(color.toLowerCase());
                }
            } else {
                this.rgba = [r, g, b, a === undefined ? 1 : a];
            }
        }

        createClass(Color, [{
            key: 'printRGB',
            value: function printRGB(alpha) {
                var rgb = alpha ? this.rgba : this.rgba.slice(0, 3),
                    vals = rgb.map(function (x, i) {
                    return printNum(x, i === 3 ? 3 : 0);
                });

                return alpha ? 'rgba(' + vals + ')' : 'rgb(' + vals + ')';
            }
        }, {
            key: 'printHSL',
            value: function printHSL(alpha) {
                var mults = [360, 100, 100, 1],
                    suff = ['', '%', '%', ''];

                var hsl = alpha ? this.hsla : this.hsla.slice(0, 3),
                    vals = hsl.map(function (x, i) {
                    return printNum(x * mults[i], i === 3 ? 3 : 1) + suff[i];
                });

                return alpha ? 'hsla(' + vals + ')' : 'hsl(' + vals + ')';
            }
        }, {
            key: 'printHex',
            value: function printHex(alpha) {
                var hex = this.hex;
                return alpha ? hex : hex.substring(0, 7);
            }
        }, {
            key: 'rgba',
            get: function get$$1() {
                if (this._rgba) {
                    return this._rgba;
                }
                if (!this._hsla) {
                    throw new Error('No color is set');
                }

                return this._rgba = Color.hslToRgb(this._hsla);
            },
            set: function set$$1(rgb) {
                if (rgb.length === 3) {
                    rgb[3] = 1;
                }

                this._rgba = rgb;
                this._hsla = null;
            }
        }, {
            key: 'rgbString',
            get: function get$$1() {
                return this.printRGB();
            }
        }, {
            key: 'rgbaString',
            get: function get$$1() {
                return this.printRGB(true);
            }
        }, {
            key: 'hsla',
            get: function get$$1() {
                if (this._hsla) {
                    return this._hsla;
                }
                if (!this._rgba) {
                    throw new Error('No color is set');
                }

                return this._hsla = Color.rgbToHsl(this._rgba);
            },
            set: function set$$1(hsl) {
                if (hsl.length === 3) {
                    hsl[3] = 1;
                }

                this._hsla = hsl;
                this._rgba = null;
            }
        }, {
            key: 'hslString',
            get: function get$$1() {
                return this.printHSL();
            }
        }, {
            key: 'hslaString',
            get: function get$$1() {
                return this.printHSL(true);
            }
        }, {
            key: 'hex',
            get: function get$$1() {
                var rgb = this.rgba,
                    hex = rgb.map(function (x, i) {
                    return i < 3 ? x.toString(16) : Math.round(x * 255).toString(16);
                });

                return '#' + hex.map(function (x) {
                    return x.padStart(2, '0');
                }).join('');
            },
            set: function set$$1(hex) {
                this.rgba = Color.hexToRgb(hex);
            }
        }], [{
            key: 'hexToRgb',
            value: function hexToRgb(input) {

                var hex = (input.startsWith('#') ? input.slice(1) : input).replace(/^(\w{3})$/, '$1F').replace(/^(\w)(\w)(\w)(\w)$/, '$1$1$2$2$3$3$4$4').replace(/^(\w{6})$/, '$1FF');

                if (!hex.match(/^([0-9a-fA-F]{8})$/)) {
                    throw new Error('Unknown hex color; ' + input);
                }

                var rgba = hex.match(/^(\w\w)(\w\w)(\w\w)(\w\w)$/).slice(1).map(function (x) {
                    return parseInt(x, 16);
                });

                rgba[3] = rgba[3] / 255;
                return rgba;
            }
        }, {
            key: 'nameToRgb',
            value: function nameToRgb(input) {

                var hash = input.toLowerCase().replace('at', 'T').replace(/[aeiouyldf]/g, '').replace('ght', 'L').replace('rk', 'D').slice(-5, 4),
                    hex = colorNames[hash];
                return hex === undefined ? hex : Color.hexToRgb(hex.replace(/\-/g, '00').padStart(6, 'f'));
            }
        }, {
            key: 'rgbToHsl',
            value: function rgbToHsl(_ref) {
                var _ref2 = slicedToArray(_ref, 4),
                    r = _ref2[0],
                    g = _ref2[1],
                    b = _ref2[2],
                    a = _ref2[3];

                r /= 255;
                g /= 255;
                b /= 255;

                var max = Math.max(r, g, b),
                    min = Math.min(r, g, b);
                var h = void 0,
                    s = void 0,
                    l = (max + min) / 2;

                if (max === min) {
                    h = s = 0;
                } else {
                    var d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r:
                            h = (g - b) / d + (g < b ? 6 : 0);break;
                        case g:
                            h = (b - r) / d + 2;break;
                        case b:
                            h = (r - g) / d + 4;break;
                    }

                    h /= 6;
                }

                return [h, s, l, a];
            }
        }, {
            key: 'hslToRgb',
            value: function hslToRgb(_ref3) {
                var _ref4 = slicedToArray(_ref3, 4),
                    h = _ref4[0],
                    s = _ref4[1],
                    l = _ref4[2],
                    a = _ref4[3];

                var r = void 0,
                    g = void 0,
                    b = void 0;

                if (s === 0) {
                    r = g = b = l;
                } else {
                    var hue2rgb = function hue2rgb(p, q, t) {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                    };

                    var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                        p = 2 * l - q;

                    r = hue2rgb(p, q, h + 1 / 3);
                    g = hue2rgb(p, q, h);
                    b = hue2rgb(p, q, h - 1 / 3);
                }

                var rgba = [r * 255, g * 255, b * 255].map(Math.round);
                rgba[3] = a;

                return rgba;
            }
        }]);
        return Color;
    }();

    var EventBucket = function () {
        function EventBucket() {
            classCallCheck(this, EventBucket);

            this._events = [];
        }

        createClass(EventBucket, [{
            key: 'add',
            value: function add(target, type, handler) {
                target.addEventListener(type, handler, false);
                this._events.push({
                    target: target,
                    type: type,
                    handler: handler
                });
            }
        }, {
            key: 'remove',
            value: function remove(target, type, handler) {
                this._events = this._events.filter(function (e) {
                    var isMatch = true;
                    if (target && target !== e.target) {
                        isMatch = false;
                    }
                    if (type && type !== e.type) {
                        isMatch = false;
                    }
                    if (handler && handler !== e.handler) {
                        isMatch = false;
                    }

                    if (isMatch) {
                        EventBucket._doRemove(e.target, e.type, e.handler);
                    }
                    return !isMatch;
                });
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                this._events.forEach(function (e) {
                    return EventBucket._doRemove(e.target, e.type, e.handler);
                });
                this._events = [];
            }
        }], [{
            key: '_doRemove',
            value: function _doRemove(target, type, handler) {
                target.removeEventListener(type, handler, false);
            }
        }]);
        return EventBucket;
    }();

    function parseHTML(htmlString) {

        var div = document.createElement('div');
        div.innerHTML = htmlString;
        return div.firstElementChild;
    }

    function dragTrack(eventBucket, area, callback) {
        var dragging = false;

        function clamp(val, min, max) {
            return Math.max(min, Math.min(val, max));
        }

        function onMove(e, info, starting) {
            if (starting) {
                dragging = true;
            }
            if (!dragging) {
                return;
            }

            e.preventDefault();

            var bounds = area.getBoundingClientRect(),
                w = bounds.width,
                h = bounds.height,
                x = info.clientX,
                y = info.clientY;

            var relX = clamp(x - bounds.left, 0, w),
                relY = clamp(y - bounds.top, 0, h);

            callback(relX / w, relY / h);
        }

        function onMouse(e, starting) {
            var button = e.buttons === undefined ? e.which : e.buttons;
            if (button === 1) {
                onMove(e, e, starting);
            } else {
                dragging = false;
            }
        }

        function onTouch(e, starting) {
            if (e.touches.length === 1) {
                onMove(e, e.touches[0], starting);
            } else {
                dragging = false;
            }
        }

        eventBucket.add(area, 'mousedown', function (e) {
            onMouse(e, true);
        });
        eventBucket.add(area, 'touchstart', function (e) {
            onTouch(e, true);
        });
        eventBucket.add(window, 'mousemove', onMouse);
        eventBucket.add(area, 'touchmove', onTouch);
        eventBucket.add(window, 'mouseup', function (e) {
            dragging = false;
        });
        eventBucket.add(area, 'touchend', function (e) {
            dragging = false;
        });
        eventBucket.add(area, 'touchcancel', function (e) {
            dragging = false;
        });
    }

    var BG_TRANSP = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'2\' height=\'2\'%3E%3Cpath d=\'M1,0H0V1H2V2H1\' fill=\'lightgrey\'/%3E%3C/svg%3E")';
    var HUES = 360;

    var EVENT_KEY = 'keydown',
        EVENT_CLICK_OUTSIDE = 'mousedown',
        EVENT_TAB_MOVE = 'focusin';

    function $(selector, context) {
        return (context || document).querySelector(selector);
    }

    function stopEvent(e) {

        e.preventDefault();
        e.stopPropagation();
    }
    function onKey(bucket, target, keys, handler, stop) {
        bucket.add(target, EVENT_KEY, function (e) {
            if (keys.indexOf(e.key) >= 0) {
                if (stop) {
                    stopEvent(e);
                }
                handler(e);
            }
        });
    }

    var _style = document.createElement('style');
    _style.textContent = '.picker_wrapper.no_alpha .picker_alpha{display:none}.picker_wrapper.no_editor .picker_editor{position:absolute;z-index:-1;opacity:0}.picker_wrapper.no_cancel .picker_cancel{display:none}.layout_default.picker_wrapper{display:-webkit-box;display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;flex-flow:row wrap;-webkit-box-pack:justify;justify-content:space-between;-webkit-box-align:stretch;align-items:stretch;font-size:10px;width:25em;padding:.5em}.layout_default.picker_wrapper input,.layout_default.picker_wrapper button{font-size:1rem}.layout_default.picker_wrapper>*{margin:.5em}.layout_default.picker_wrapper::before{content:\'\';display:block;width:100%;height:0;-webkit-box-ordinal-group:2;order:1}.layout_default .picker_slider,.layout_default .picker_selector{padding:1em}.layout_default .picker_hue{width:100%}.layout_default .picker_sl{-webkit-box-flex:1;flex:1 1 auto}.layout_default .picker_sl::before{content:\'\';display:block;padding-bottom:100%}.layout_default .picker_editor{-webkit-box-ordinal-group:2;order:1;width:6.5rem}.layout_default .picker_editor input{width:100%;height:100%}.layout_default .picker_sample{-webkit-box-ordinal-group:2;order:1;-webkit-box-flex:1;flex:1 1 auto}.layout_default .picker_done,.layout_default .picker_cancel{-webkit-box-ordinal-group:2;order:1}.picker_wrapper{box-sizing:border-box;background:#f2f2f2;box-shadow:0 0 0 1px silver;cursor:default;font-family:sans-serif;color:#444;pointer-events:auto}.picker_wrapper:focus{outline:none}.picker_wrapper button,.picker_wrapper input{box-sizing:border-box;border:none;box-shadow:0 0 0 1px silver;outline:none}.picker_wrapper button:focus,.picker_wrapper button:active,.picker_wrapper input:focus,.picker_wrapper input:active{box-shadow:0 0 2px 1px dodgerblue}.picker_wrapper button{padding:.4em .6em;cursor:pointer;background-color:whitesmoke;background-image:-webkit-gradient(linear, left bottom, left top, from(gainsboro), to(transparent));background-image:-webkit-linear-gradient(bottom, gainsboro, transparent);background-image:linear-gradient(0deg, gainsboro, transparent)}.picker_wrapper button:active{background-image:-webkit-gradient(linear, left bottom, left top, from(transparent), to(gainsboro));background-image:-webkit-linear-gradient(bottom, transparent, gainsboro);background-image:linear-gradient(0deg, transparent, gainsboro)}.picker_wrapper button:hover{background-color:white}.picker_selector{position:absolute;z-index:1;display:block;-webkit-transform:translate(-50%, -50%);transform:translate(-50%, -50%);border:2px solid white;border-radius:100%;box-shadow:0 0 3px 1px #67b9ff;background:currentColor;cursor:pointer}.picker_slider .picker_selector{border-radius:2px}.picker_hue{position:relative;background-image:-webkit-gradient(linear, left top, right top, from(red), color-stop(yellow), color-stop(lime), color-stop(cyan), color-stop(blue), color-stop(magenta), to(red));background-image:-webkit-linear-gradient(left, red, yellow, lime, cyan, blue, magenta, red);background-image:linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red);box-shadow:0 0 0 1px silver}.picker_sl{position:relative;box-shadow:0 0 0 1px silver;background-image:-webkit-gradient(linear, left top, left bottom, from(white), color-stop(50%, rgba(255,255,255,0))),-webkit-gradient(linear, left bottom, left top, from(black), color-stop(50%, rgba(0,0,0,0))),-webkit-gradient(linear, left top, right top, from(gray), to(rgba(128,128,128,0)));background-image:-webkit-linear-gradient(top, white, rgba(255,255,255,0) 50%),-webkit-linear-gradient(bottom, black, rgba(0,0,0,0) 50%),-webkit-linear-gradient(left, gray, rgba(128,128,128,0));background-image:linear-gradient(180deg, white, rgba(255,255,255,0) 50%),linear-gradient(0deg, black, rgba(0,0,0,0) 50%),linear-gradient(90deg, gray, rgba(128,128,128,0))}.picker_alpha,.picker_sample{position:relative;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'2\' height=\'2\'%3E%3Cpath d=\'M1,0H0V1H2V2H1\' fill=\'lightgrey\'/%3E%3C/svg%3E") left top/contain white;box-shadow:0 0 0 1px silver}.picker_alpha .picker_selector,.picker_sample .picker_selector{background:none}.picker_editor input{font-family:monospace;padding:.2em .4em}.picker_sample::before{content:\'\';position:absolute;display:block;width:100%;height:100%;background:currentColor}.picker_arrow{position:absolute;z-index:-1}.picker_wrapper.popup{position:absolute;z-index:2;margin:1.5em}.picker_wrapper.popup,.picker_wrapper.popup .picker_arrow::before,.picker_wrapper.popup .picker_arrow::after{background:#f2f2f2;box-shadow:0 0 10px 1px rgba(0,0,0,0.4)}.picker_wrapper.popup .picker_arrow{width:3em;height:3em;margin:0}.picker_wrapper.popup .picker_arrow::before,.picker_wrapper.popup .picker_arrow::after{content:"";display:block;position:absolute;top:0;left:0;z-index:-99}.picker_wrapper.popup .picker_arrow::before{width:100%;height:100%;-webkit-transform:skew(45deg);transform:skew(45deg);-webkit-transform-origin:0 100%;transform-origin:0 100%}.picker_wrapper.popup .picker_arrow::after{width:150%;height:150%;box-shadow:none}.popup.popup_top{bottom:100%;left:0}.popup.popup_top .picker_arrow{bottom:0;left:0;-webkit-transform:rotate(-90deg);transform:rotate(-90deg)}.popup.popup_bottom{top:100%;left:0}.popup.popup_bottom .picker_arrow{top:0;left:0;-webkit-transform:rotate(90deg) scale(1, -1);transform:rotate(90deg) scale(1, -1)}.popup.popup_left{top:0;right:100%}.popup.popup_left .picker_arrow{top:0;right:0;-webkit-transform:scale(-1, 1);transform:scale(-1, 1)}.popup.popup_right{top:0;left:100%}.popup.popup_right .picker_arrow{top:0;left:0}';
    document.documentElement.firstElementChild.appendChild(_style);

    var Picker = function () {
        function Picker(options) {
            classCallCheck(this, Picker);


            this.settings = {

                popup: 'right',
                layout: 'default',
                alpha: true,
                editor: true,
                editorFormat: 'hex',
                cancelButton: false,
                defaultColor: '#0cf'
            };

            this._events = new EventBucket();

            this.onChange = null;

            this.onDone = null;

            this.onOpen = null;

            this.onClose = null;

            this.setOptions(options);
        }

        createClass(Picker, [{
            key: 'setOptions',
            value: function setOptions(options) {
                var _this = this;

                if (!options) {
                    return;
                }
                var settings = this.settings;

                function transfer(source, target, skipKeys) {
                    for (var key in source) {
                        if (skipKeys && skipKeys.indexOf(key) >= 0) {
                            continue;
                        }

                        target[key] = source[key];
                    }
                }

                if (options instanceof HTMLElement) {
                    settings.parent = options;
                } else {

                    if (settings.parent && options.parent && settings.parent !== options.parent) {
                        this._events.remove(settings.parent);
                        this._popupInited = false;
                    }

                    transfer(options, settings);

                    if (options.onChange) {
                        this.onChange = options.onChange;
                    }
                    if (options.onDone) {
                        this.onDone = options.onDone;
                    }
                    if (options.onOpen) {
                        this.onOpen = options.onOpen;
                    }
                    if (options.onClose) {
                        this.onClose = options.onClose;
                    }

                    var col = options.color || options.colour;
                    if (col) {
                        this._setColor(col);
                    }
                }

                var parent = settings.parent;
                if (parent && settings.popup && !this._popupInited) {

                    var openProxy = function openProxy(e) {
                        return _this.openHandler(e);
                    };

                    this._events.add(parent, 'click', openProxy);

                    onKey(this._events, parent, [' ', 'Spacebar', 'Enter'], openProxy);

                    this._popupInited = true;
                } else if (options.parent && !settings.popup) {
                    this.show();
                }
            }
        }, {
            key: 'openHandler',
            value: function openHandler(e) {
                if (this.show()) {

                    e && e.preventDefault();

                    this.settings.parent.style.pointerEvents = 'none';

                    var toFocus = e && e.type === EVENT_KEY ? this._domEdit : this.domElement;
                    setTimeout(function () {
                        return toFocus.focus();
                    }, 100);

                    if (this.onOpen) {
                        this.onOpen(this.colour);
                    }
                }
            }
        }, {
            key: 'closeHandler',
            value: function closeHandler(e) {
                var event = e && e.type;
                var doHide = false;

                if (!e) {
                    doHide = true;
                } else if (event === EVENT_CLICK_OUTSIDE || event === EVENT_TAB_MOVE) {

                    var knownTime = (this.__containedEvent || 0) + 100;
                    if (e.timeStamp > knownTime) {
                        doHide = true;
                    }
                } else {

                    stopEvent(e);

                    doHide = true;
                }

                if (doHide && this.hide()) {
                    this.settings.parent.style.pointerEvents = '';

                    if (event !== EVENT_CLICK_OUTSIDE) {
                        this.settings.parent.focus();
                    }

                    if (this.onClose) {
                        this.onClose(this.colour);
                    }
                }
            }
        }, {
            key: 'movePopup',
            value: function movePopup(options, open) {

                this.closeHandler();

                this.setOptions(options);
                if (open) {
                    this.openHandler();
                }
            }
        }, {
            key: 'setColor',
            value: function setColor(color, silent) {
                this._setColor(color, { silent: silent });
            }
        }, {
            key: '_setColor',
            value: function _setColor(color, flags) {
                if (typeof color === 'string') {
                    color = color.trim();
                }
                if (!color) {
                    return;
                }

                flags = flags || {};
                var c = void 0;
                try {

                    c = new Color(color);
                } catch (ex) {
                    if (flags.failSilently) {
                        return;
                    }
                    throw ex;
                }

                if (!this.settings.alpha) {
                    var hsla = c.hsla;
                    hsla[3] = 1;
                    c.hsla = hsla;
                }
                this.colour = this.color = c;
                this._setHSLA(null, null, null, null, flags);
            }
        }, {
            key: 'setColour',
            value: function setColour(colour, silent) {
                this.setColor(colour, silent);
            }
        }, {
            key: 'show',
            value: function show() {
                var parent = this.settings.parent;
                if (!parent) {
                    return false;
                }

                if (this.domElement) {
                    var toggled = this._toggleDOM(true);

                    this._setPosition();

                    return toggled;
                }

                var html = this.settings.template || '<div class="picker_wrapper" tabindex="-1"><div class="picker_arrow"></div><div class="picker_hue picker_slider"><div class="picker_selector"></div></div><div class="picker_sl"><div class="picker_selector"></div></div><div class="picker_alpha picker_slider"><div class="picker_selector"></div></div><div class="picker_editor"><input aria-label="Type a color name or hex value"/></div><div class="picker_sample"></div><div class="picker_done"><button>Ok</button></div><div class="picker_cancel"><button>Cancel</button></div></div>';
                var wrapper = parseHTML(html);

                this.domElement = wrapper;
                this._domH = $('.picker_hue', wrapper);
                this._domSL = $('.picker_sl', wrapper);
                this._domA = $('.picker_alpha', wrapper);
                this._domEdit = $('.picker_editor input', wrapper);
                this._domSample = $('.picker_sample', wrapper);
                this._domOkay = $('.picker_done button', wrapper);
                this._domCancel = $('.picker_cancel button', wrapper);

                wrapper.classList.add('layout_' + this.settings.layout);
                if (!this.settings.alpha) {
                    wrapper.classList.add('no_alpha');
                }
                if (!this.settings.editor) {
                    wrapper.classList.add('no_editor');
                }
                if (!this.settings.cancelButton) {
                    wrapper.classList.add('no_cancel');
                }
                this._ifPopup(function () {
                    return wrapper.classList.add('popup');
                });

                this._setPosition();

                if (this.colour) {
                    this._updateUI();
                } else {
                    this._setColor(this.settings.defaultColor);
                }
                this._bindEvents();

                return true;
            }
        }, {
            key: 'hide',
            value: function hide() {
                return this._toggleDOM(false);
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                this._events.destroy();
                if (this.domElement) {
                    this.settings.parent.removeChild(this.domElement);
                }
            }
        }, {
            key: '_bindEvents',
            value: function _bindEvents() {
                var _this2 = this;

                var that = this,
                    dom = this.domElement,
                    events = this._events;

                function addEvent(target, type, handler) {
                    events.add(target, type, handler);
                }

                addEvent(dom, 'click', function (e) {
                    return e.preventDefault();
                });

                dragTrack(events, this._domH, function (x, y) {
                    return that._setHSLA(x);
                });

                dragTrack(events, this._domSL, function (x, y) {
                    return that._setHSLA(null, x, 1 - y);
                });

                if (this.settings.alpha) {
                    dragTrack(events, this._domA, function (x, y) {
                        return that._setHSLA(null, null, null, 1 - y);
                    });
                }

                var editInput = this._domEdit;
                {
                    addEvent(editInput, 'input', function (e) {
                        that._setColor(this.value, { fromEditor: true, failSilently: true });
                    });

                    addEvent(editInput, 'focus', function (e) {
                        var input = this;

                        if (input.selectionStart === input.selectionEnd) {
                            input.select();
                        }
                    });
                }

                this._ifPopup(function () {

                    var popupCloseProxy = function popupCloseProxy(e) {
                        return _this2.closeHandler(e);
                    };

                    addEvent(window, EVENT_CLICK_OUTSIDE, popupCloseProxy);
                    addEvent(window, EVENT_TAB_MOVE, popupCloseProxy);
                    onKey(events, dom, ['Esc', 'Escape'], popupCloseProxy);

                    var timeKeeper = function timeKeeper(e) {
                        _this2.__containedEvent = e.timeStamp;
                    };
                    addEvent(dom, EVENT_CLICK_OUTSIDE, timeKeeper);

                    addEvent(dom, EVENT_TAB_MOVE, timeKeeper);

                    addEvent(_this2._domCancel, 'click', popupCloseProxy);
                });

                var onDoneProxy = function onDoneProxy(e) {
                    _this2._ifPopup(function () {
                        return _this2.closeHandler(e);
                    });
                    if (_this2.onDone) {
                        _this2.onDone(_this2.colour);
                    }
                };
                addEvent(this._domOkay, 'click', onDoneProxy);
                onKey(events, dom, ['Enter'], onDoneProxy);
            }
        }, {
            key: '_setPosition',
            value: function _setPosition() {
                var parent = this.settings.parent,
                    elm = this.domElement;

                if (parent !== elm.parentNode) {
                    parent.appendChild(elm);
                }

                this._ifPopup(function (popup) {

                    if (getComputedStyle(parent).position === 'static') {
                        parent.style.position = 'relative';
                    }

                    var cssClass = popup === true ? 'popup_right' : 'popup_' + popup;

                    ['popup_top', 'popup_bottom', 'popup_left', 'popup_right'].forEach(function (c) {

                        if (c === cssClass) {
                            elm.classList.add(c);
                        } else {
                            elm.classList.remove(c);
                        }
                    });

                    elm.classList.add(cssClass);
                });
            }
        }, {
            key: '_setHSLA',
            value: function _setHSLA(h, s, l, a, flags) {
                flags = flags || {};

                var col = this.colour,
                    hsla = col.hsla;

                [h, s, l, a].forEach(function (x, i) {
                    if (x || x === 0) {
                        hsla[i] = x;
                    }
                });
                col.hsla = hsla;

                this._updateUI(flags);

                if (this.onChange && !flags.silent) {
                    this.onChange(col);
                }
            }
        }, {
            key: '_updateUI',
            value: function _updateUI(flags) {
                if (!this.domElement) {
                    return;
                }
                flags = flags || {};

                var col = this.colour,
                    hsl = col.hsla,
                    cssHue = 'hsl(' + hsl[0] * HUES + ', 100%, 50%)',
                    cssHSL = col.hslString,
                    cssHSLA = col.hslaString;

                var uiH = this._domH,
                    uiSL = this._domSL,
                    uiA = this._domA,
                    thumbH = $('.picker_selector', uiH),
                    thumbSL = $('.picker_selector', uiSL),
                    thumbA = $('.picker_selector', uiA);

                function posX(parent, child, relX) {
                    child.style.left = relX * 100 + '%';
                }
                function posY(parent, child, relY) {
                    child.style.top = relY * 100 + '%';
                }

                posX(uiH, thumbH, hsl[0]);

                this._domSL.style.backgroundColor = this._domH.style.color = cssHue;

                posX(uiSL, thumbSL, hsl[1]);
                posY(uiSL, thumbSL, 1 - hsl[2]);

                uiSL.style.color = cssHSL;

                posY(uiA, thumbA, 1 - hsl[3]);

                var opaque = cssHSL,
                    transp = opaque.replace('hsl', 'hsla').replace(')', ', 0)'),
                    bg = 'linear-gradient(' + [opaque, transp] + ')';

                this._domA.style.backgroundImage = bg + ', ' + BG_TRANSP;

                if (!flags.fromEditor) {
                    var format = this.settings.editorFormat,
                        alpha = this.settings.alpha;

                    var value = void 0;
                    switch (format) {
                        case 'rgb':
                            value = col.printRGB(alpha);break;
                        case 'hsl':
                            value = col.printHSL(alpha);break;
                        default:
                            value = col.printHex(alpha);
                    }
                    this._domEdit.value = value;
                }

                this._domSample.style.color = cssHSLA;
            }
        }, {
            key: '_ifPopup',
            value: function _ifPopup(actionIf, actionElse) {
                if (this.settings.parent && this.settings.popup) {
                    actionIf && actionIf(this.settings.popup);
                } else {
                    actionElse && actionElse();
                }
            }
        }, {
            key: '_toggleDOM',
            value: function _toggleDOM(toVisible) {
                var dom = this.domElement;
                if (!dom) {
                    return false;
                }

                var displayStyle = toVisible ? '' : 'none',
                    toggle = dom.style.display !== displayStyle;

                if (toggle) {
                    dom.style.display = displayStyle;
                }
                return toggle;
            }
        }], [{
            key: 'StyleElement',
            get: function get$$1() {
                return _style;
            }
        }]);
        return Picker;
    }();

    /* src/components/Button.svelte generated by Svelte v3.23.2 */

    const file$3 = "src/components/Button.svelte";

    function create_fragment$3(ctx) {
    	let button_1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			button_1 = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button_1, "class", "btn svelte-nlvet");
    			toggle_class(button_1, "bg-red", /*color*/ ctx[1] === "red");
    			toggle_class(button_1, "bg-green", /*color*/ ctx[1] === "green");
    			toggle_class(button_1, "bg-blue", /*color*/ ctx[1] === "blue");
    			add_location(button_1, file$3, 5, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button_1, anchor);

    			if (default_slot) {
    				default_slot.m(button_1, null);
    			}

    			/*button_1_binding*/ ctx[5](button_1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button_1, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (dirty & /*color*/ 2) {
    				toggle_class(button_1, "bg-red", /*color*/ ctx[1] === "red");
    			}

    			if (dirty & /*color*/ 2) {
    				toggle_class(button_1, "bg-green", /*color*/ ctx[1] === "green");
    			}

    			if (dirty & /*color*/ 2) {
    				toggle_class(button_1, "bg-blue", /*color*/ ctx[1] === "blue");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button_1);
    			if (default_slot) default_slot.d(detaching);
    			/*button_1_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
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
    	let { color = "red" } = $$props;
    	let { button } = $$props;
    	const writable_props = ["color", "button"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function button_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			button = $$value;
    			$$invalidate(0, button);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("button" in $$props) $$invalidate(0, button = $$props.button);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ color, button });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("button" in $$props) $$invalidate(0, button = $$props.button);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [button, color, $$scope, $$slots, click_handler, button_1_binding];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { color: 1, button: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*button*/ ctx[0] === undefined && !("button" in props)) {
    			console.warn("<Button> was created without expected prop 'button'");
    		}
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get button() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set button(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ColorLayer.svelte generated by Svelte v3.23.2 */

    // (25:0) <Button color='blue' bind:button={parent}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Color");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(25:0) <Button color='blue' bind:button={parent}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let button;
    	let updating_button;
    	let current;

    	function button_button_binding(value) {
    		/*button_button_binding*/ ctx[1].call(null, value);
    	}

    	let button_props = {
    		color: "blue",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*parent*/ ctx[0] !== void 0) {
    		button_props.button = /*parent*/ ctx[0];
    	}

    	button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "button", button_button_binding));

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_button && dirty & /*parent*/ 1) {
    				updating_button = true;
    				button_changes.button = /*parent*/ ctx[0];
    				add_flush_callback(() => updating_button = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
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
    	const dispatch = createEventDispatcher();
    	let parent;
    	let picker;

    	onMount(() => {
    		picker = new Picker({ parent }); // alpha: false

    		picker.onChange = color => {
    			parent.style.setProperty("--selected-color", color.hex);
    			dispatch("change", color);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColorLayer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ColorLayer", $$slots, []);

    	function button_button_binding(value) {
    		parent = value;
    		$$invalidate(0, parent);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		Picker,
    		Button,
    		dispatch,
    		parent,
    		picker
    	});

    	$$self.$inject_state = $$props => {
    		if ("parent" in $$props) $$invalidate(0, parent = $$props.parent);
    		if ("picker" in $$props) picker = $$props.picker;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [parent, button_button_binding];
    }

    class ColorLayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorLayer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const CANVAS_STYLE = 'max-height: 75vh; max-width: 100%;';

    const MODES = [
      {
        name: 'Normal',
        value: 'normal',
        description: 'Uses only the values from the source pixel.'
      },
      { 
        name: 'Add', 
        value: 'add',
        description: 'Add the values from the backdrop and source pixel together. This results in a brighter image.'
      },
      { 
        name: 'Multiply', 
        value: 'multiply',
        description: 'Multiply the values of the backdrop pixel by the source pixel. This results in a brighter image.'
       },
      { 
        name: 'Subtract', 
        value: 'subtract',
        description: 'Subtract the values of the source pixel from the values of the backdrop pixel. This results in a darker image.'
       },
      { 
        name: 'Divide', 
        value: 'divide',
        description: 'Divide the values of the backdrop pixel by the source pixel. This reuslts in a brighter image.'
       },
      { 
        name: 'Darken', 
        value: 'darken',
        description: 'Compare each channel in the backdrop and source pixels and take the smaller values.'
       },
      { 
        name: 'Lighten', 
        value: 'lighten',
        description: 'Compare each channel in the backdrop and source pixels and take the larger values.'
       },
      { 
        name: 'Screen', 
        value: 'screen',
        description: 'The screen mode is meant to provide an opposite effect of multiply. By inverting the pixels before multiplying them and then reinverting the output pixel the image gets lighter rather than darker.'
       },
      { 
        name: 'Overlay', 
        value: 'overlay',
        description: 'A combination of screen and multiply blend modes. For each channel, apply the multiply blend mode if the backdrop channel is less than 0.5, otherwise apply the screen blend mode.'
       },
      { 
        name: 'Hard Light', 
        value: 'hardLight',
        description: 'A combination of screen and multiply blend modes. For each channel, apply the multiply blend mode if the source channel is less than 0.5, otherwise apply the screen blend mode.'
       },
      { 
        name: 'Color Burn', 
        value: 'colorBurn',
        description: 'Darkens the backdrop color by increasing the contrast with the source color.'
       },
      { 
        name: 'Linear Burn', 
        value: 'linearBurn',
        description: 'Darkens the backdrop color based on the brightness of the source pixel.'
       },
      { 
        name: 'Color Dodge', 
        value: 'colorDodge',
        description: 'Brightens the backdrop color by decreasing the contrast with the source color.'
       },
      { 
        name: 'Difference', 
        value: 'difference',
        description: 'For each channel take the absolute value of one channel minus the other channel. Unlike the subtract mode, this operation is commutative (i.e. the order of the pixels does not affect the output).'
       },
      { 
        name: 'Soft Light', 
        value: 'softLight',
        description: 'Related to the Hard Light blend mode because it darkens or lightens based on the source pixel. Dampens the amount of burning or dodging at the extremes to prevent pure black or white.'
       },
      { 
        name: 'Exclusion', 
        value: 'exclusion',
        description: 'If the source channel is at full value it inverts the backdrop channel. As the source channel approaches zero the inversion decreases until the output is equal to just the backdrop channel. The effect is similar to difference but with lower contrast.'
      },
      {
        name: 'Hard Mix',
        value: 'hardMix',
        description: 'For each channel, add the backdrop and source values. If the result is greater than one the channel receives a value of one, otherwise it receives a value of zero.'
      },
      {
        name: 'Lighter Color',
        value: 'lighterColor',
        description: 'Sum the red, green, and blue channels of the backdrop and source pixels. If the backdrop result is greater than the source then the output is the backdrop color, otherwise it is the source color.'
      },
      {
        name: 'Darker Color',
        value: 'darkerColor',
        description: 'Sum the red, green, and blue channels of the backdrop and source pixels. If the backdrop result is less than the source then the output is the backdrop color, otherwise it is the source color.'
      },
      {
        name: 'Pin Light',
        value: 'pinLight',
        description: 'For each channel, use the source value if the backdrop value is between 0.5 and the source value, otherwise use the backdrop value.'
      },
      {
        name: 'Vivid Light',
        value: 'vividLight',
        description: 'For each channel, if the source value is greater than 0.5 apply color dodge, otherwise apply color burn.'
      },
      {
        name: 'Linear Light',
        value: 'linearLight',
        description: 'For each channel, if the source value is greater than 0.5 apply linear dodge (add), otherwise apply linear burn.'
      },
      { 
        name: 'Hue', 
        value: 'hue',
        description: 'Convert the pixel to HSL color mode. Use the hue of the source color and the saturation and luminosity of the backdrop color.'
       },
      { 
        name: 'Saturation', 
        value: 'saturation',
        description: 'Convert the pixel to HSL color mode. Use the saturation of the source color and the hue and luminosity of the backdrop color.'
       },
      { 
        name: 'Luminosity', 
        value: 'luminosity',
        description: 'Convert the pixel to HSL color mode. Use the luminosity of the source color and the hue and saturation of the backdrop color.'
       },
      { 
        name: 'Color', 
        value: 'color',
        description: 'Convert the pixel to HSL color mode. Use the hue and saturation of the source color and the luminosity of the backdrop color.'
      }
    ];

    /* src/App.svelte generated by Svelte v3.23.2 */
    const file$4 = "src/App.svelte";

    // (169:6) <Button         on:click={() => {         url1 = randomImageURL();        }}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Random");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(169:6) <Button         on:click={() => {         url1 = randomImageURL();        }}>",
    		ctx
    	});

    	return block;
    }

    // (197:6) <Button         on:click={() => {         url2 = randomImageURL();        }}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Random");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(197:6) <Button         on:click={() => {         url2 = randomImageURL();        }}>",
    		ctx
    	});

    	return block;
    }

    // (226:4) <Button color='blue' on:click={() => saveImage(canvas)} class="btn bg-blue">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Download");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(226:4) <Button color='blue' on:click={() => saveImage(canvas)} class=\\\"btn bg-blue\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let header;
    	let div0;
    	let h1;
    	let t1;
    	let div17;
    	let div4;
    	let section0;
    	let h2;
    	let t3;
    	let a0;
    	let t5;
    	let script;
    	let script_src_value;
    	let t6;
    	let div1;
    	let t7;
    	let a1;
    	let t9;
    	let a2;
    	let t11;
    	let a3;
    	let t13;
    	let t14;
    	let div3;
    	let label;
    	let h30;
    	let t16;
    	let div2;
    	let select;
    	let updating_selected;
    	let t17;
    	let section1;
    	let t18_value = /*mode*/ ctx[5].description + "";
    	let t18;
    	let t19;
    	let div13;
    	let div8;
    	let h31;
    	let t21;
    	let div7;
    	let div5;
    	let button0;
    	let t22;
    	let uploadimage0;
    	let t23;
    	let div6;
    	let colorlayer0;
    	let t24;
    	let image0;
    	let updating_image;
    	let t25;
    	let div12;
    	let h32;
    	let t27;
    	let div11;
    	let div9;
    	let button1;
    	let t28;
    	let uploadimage1;
    	let t29;
    	let div10;
    	let colorlayer1;
    	let t30;
    	let image1_1;
    	let updating_image_1;
    	let t31;
    	let div16;
    	let h33;
    	let t33;
    	let div14;
    	let button2;
    	let t34;
    	let div15;
    	let current;

    	function select_selected_binding(value) {
    		/*select_selected_binding*/ ctx[8].call(null, value);
    	}

    	let select_props = { options: MODES };

    	if (/*mode*/ ctx[5] !== void 0) {
    		select_props.selected = /*mode*/ ctx[5];
    	}

    	select = new Select({ props: select_props, $$inline: true });
    	binding_callbacks.push(() => bind(select, "selected", select_selected_binding));
    	select.$on("change", /*onModeChange*/ ctx[7]);

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[9]);

    	uploadimage0 = new UploadImage({
    			props: { onLoad: /*func*/ ctx[10] },
    			$$inline: true
    		});

    	colorlayer0 = new ColorLayer({ $$inline: true });

    	colorlayer0.$on("change", function () {
    		if (is_function(lodash_throttle(/*change_handler*/ ctx[11], 50))) lodash_throttle(/*change_handler*/ ctx[11], 50).apply(this, arguments);
    	});

    	function image0_image_binding(value) {
    		/*image0_image_binding*/ ctx[12].call(null, value);
    	}

    	let image0_props = { src: /*url1*/ ctx[0] };

    	if (/*image1*/ ctx[2] !== void 0) {
    		image0_props.image = /*image1*/ ctx[2];
    	}

    	image0 = new Image({ props: image0_props, $$inline: true });
    	binding_callbacks.push(() => bind(image0, "image", image0_image_binding));
    	image0.$on("load", /*onImageLoad*/ ctx[6]);

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[13]);

    	uploadimage1 = new UploadImage({
    			props: { onLoad: /*func_1*/ ctx[14] },
    			$$inline: true
    		});

    	colorlayer1 = new ColorLayer({ $$inline: true });

    	colorlayer1.$on("change", function () {
    		if (is_function(lodash_throttle(/*change_handler_1*/ ctx[15], 50))) lodash_throttle(/*change_handler_1*/ ctx[15], 50).apply(this, arguments);
    	});

    	function image1_1_image_binding(value) {
    		/*image1_1_image_binding*/ ctx[16].call(null, value);
    	}

    	let image1_1_props = { src: /*url2*/ ctx[1] };

    	if (/*image2*/ ctx[3] !== void 0) {
    		image1_1_props.image = /*image2*/ ctx[3];
    	}

    	image1_1 = new Image({ props: image1_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(image1_1, "image", image1_1_image_binding));
    	image1_1.$on("load", /*onImageLoad*/ ctx[6]);

    	button2 = new Button({
    			props: {
    				color: "blue",
    				class: "btn bg-blue",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*click_handler_2*/ ctx[17]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Blend Modes";
    			t1 = space();
    			div17 = element("div");
    			div4 = element("div");
    			section0 = element("section");
    			h2 = element("h2");
    			h2.textContent = "About";
    			t3 = space();
    			a0 = element("a");
    			a0.textContent = "Follow\n\t\t\t\t\t@srmullen";
    			t5 = space();
    			script = element("script");
    			t6 = space();
    			div1 = element("div");
    			t7 = text("Image blending modes are a way of combining two images into one image that maintains characteristics of the original images.\n\t\t\t\t\tThis site implements the blend modes as described in the W3C specification. They are rendered to a canvas using ");
    			a1 = element("a");
    			a1.textContent = "GPU.js";
    			t9 = text(".\n\t\t\t\t\tFor more information you can see the ");
    			a2 = element("a");
    			a2.textContent = "Github repo";
    			t11 = text(" and the ");
    			a3 = element("a");
    			a3.textContent = "blog post";
    			t13 = text(" describing the blend mode implementations.");
    			t14 = space();
    			div3 = element("div");
    			label = element("label");
    			h30 = element("h3");
    			h30.textContent = "Blend Mode";
    			t16 = space();
    			div2 = element("div");
    			create_component(select.$$.fragment);
    			t17 = space();
    			section1 = element("section");
    			t18 = text(t18_value);
    			t19 = space();
    			div13 = element("div");
    			div8 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Backdrop";
    			t21 = space();
    			div7 = element("div");
    			div5 = element("div");
    			create_component(button0.$$.fragment);
    			t22 = space();
    			create_component(uploadimage0.$$.fragment);
    			t23 = space();
    			div6 = element("div");
    			create_component(colorlayer0.$$.fragment);
    			t24 = space();
    			create_component(image0.$$.fragment);
    			t25 = space();
    			div12 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Source";
    			t27 = space();
    			div11 = element("div");
    			div9 = element("div");
    			create_component(button1.$$.fragment);
    			t28 = space();
    			create_component(uploadimage1.$$.fragment);
    			t29 = space();
    			div10 = element("div");
    			create_component(colorlayer1.$$.fragment);
    			t30 = space();
    			create_component(image1_1.$$.fragment);
    			t31 = space();
    			div16 = element("div");
    			h33 = element("h3");
    			h33.textContent = "Output";
    			t33 = space();
    			div14 = element("div");
    			create_component(button2.$$.fragment);
    			t34 = space();
    			div15 = element("div");
    			attr_dev(h1, "class", "svelte-1lobj9");
    			add_location(h1, file$4, 133, 3, 3364);
    			attr_dev(div0, "class", "title svelte-1lobj9");
    			add_location(div0, file$4, 132, 2, 3341);
    			attr_dev(header, "class", "svelte-1lobj9");
    			add_location(header, file$4, 131, 1, 3330);
    			attr_dev(h2, "class", "svelte-1lobj9");
    			add_location(h2, file$4, 139, 4, 3482);
    			attr_dev(a0, "href", "https://twitter.com/srmullen?ref_src=twsrc%5Etfw");
    			attr_dev(a0, "class", "twitter-follow-button");
    			attr_dev(a0, "data-show-count", "false");
    			add_location(a0, file$4, 140, 4, 3501);
    			script.async = true;
    			if (script.src !== (script_src_value = "https://platform.twitter.com/widgets.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "charset", "utf-8");
    			add_location(script, file$4, 143, 4, 3649);
    			attr_dev(a1, "href", "https://gpu.rocks/");
    			add_location(a1, file$4, 146, 117, 3992);
    			attr_dev(a2, "href", "https://github.com/srmullen/blend_modes");
    			add_location(a2, file$4, 147, 42, 4075);
    			attr_dev(a3, "href", "https://srmullen.com/articles/blend-modes");
    			add_location(a3, file$4, 147, 116, 4149);
    			add_location(div1, file$4, 144, 4, 3739);
    			attr_dev(section0, "class", "about svelte-1lobj9");
    			add_location(section0, file$4, 138, 3, 3454);
    			attr_dev(h30, "class", "svelte-1lobj9");
    			add_location(h30, file$4, 152, 5, 4334);
    			attr_dev(div2, "class", "select-container svelte-1lobj9");
    			add_location(div2, file$4, 153, 5, 4359);
    			add_location(label, file$4, 151, 4, 4321);
    			attr_dev(div3, "class", "inputs-container svelte-1lobj9");
    			add_location(div3, file$4, 150, 3, 4286);
    			attr_dev(section1, "class", "description");
    			add_location(section1, file$4, 158, 3, 4507);
    			attr_dev(div4, "class", "text svelte-1lobj9");
    			add_location(div4, file$4, 137, 2, 3432);
    			attr_dev(h31, "class", "svelte-1lobj9");
    			add_location(h31, file$4, 165, 4, 4653);
    			attr_dev(div5, "class", "svelte-1lobj9");
    			add_location(div5, file$4, 167, 5, 4708);
    			attr_dev(div6, "class", "color-picker svelte-1lobj9");
    			add_location(div6, file$4, 178, 5, 4911);
    			attr_dev(div7, "class", "image-buttons svelte-1lobj9");
    			add_location(div7, file$4, 166, 4, 4675);
    			attr_dev(div8, "class", "image-container svelte-1lobj9");
    			add_location(div8, file$4, 164, 3, 4619);
    			attr_dev(h32, "class", "svelte-1lobj9");
    			add_location(h32, file$4, 193, 4, 5309);
    			attr_dev(div9, "class", "svelte-1lobj9");
    			add_location(div9, file$4, 195, 5, 5362);
    			attr_dev(div10, "class", "color-picker svelte-1lobj9");
    			add_location(div10, file$4, 206, 5, 5565);
    			attr_dev(div11, "class", "image-buttons svelte-1lobj9");
    			add_location(div11, file$4, 194, 4, 5329);
    			attr_dev(div12, "class", "image-container svelte-1lobj9");
    			add_location(div12, file$4, 192, 3, 5275);
    			attr_dev(div13, "class", "source-images svelte-1lobj9");
    			add_location(div13, file$4, 163, 2, 4588);
    			attr_dev(h33, "class", "svelte-1lobj9");
    			add_location(h33, file$4, 223, 3, 5962);
    			attr_dev(div14, "class", "download svelte-1lobj9");
    			add_location(div14, file$4, 224, 3, 5981);
    			attr_dev(div15, "class", "canvas-container");
    			add_location(div15, file$4, 227, 3, 6115);
    			attr_dev(div16, "class", "output svelte-1lobj9");
    			add_location(div16, file$4, 222, 2, 5938);
    			attr_dev(div17, "class", "container svelte-1lobj9");
    			add_location(div17, file$4, 136, 1, 3406);
    			attr_dev(main, "class", "svelte-1lobj9");
    			add_location(main, file$4, 130, 0, 3322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, div0);
    			append_dev(div0, h1);
    			append_dev(main, t1);
    			append_dev(main, div17);
    			append_dev(div17, div4);
    			append_dev(div4, section0);
    			append_dev(section0, h2);
    			append_dev(section0, t3);
    			append_dev(section0, a0);
    			append_dev(section0, t5);
    			append_dev(section0, script);
    			append_dev(section0, t6);
    			append_dev(section0, div1);
    			append_dev(div1, t7);
    			append_dev(div1, a1);
    			append_dev(div1, t9);
    			append_dev(div1, a2);
    			append_dev(div1, t11);
    			append_dev(div1, a3);
    			append_dev(div1, t13);
    			append_dev(div4, t14);
    			append_dev(div4, div3);
    			append_dev(div3, label);
    			append_dev(label, h30);
    			append_dev(label, t16);
    			append_dev(label, div2);
    			mount_component(select, div2, null);
    			append_dev(div4, t17);
    			append_dev(div4, section1);
    			append_dev(section1, t18);
    			append_dev(div17, t19);
    			append_dev(div17, div13);
    			append_dev(div13, div8);
    			append_dev(div8, h31);
    			append_dev(div8, t21);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			mount_component(button0, div5, null);
    			append_dev(div7, t22);
    			mount_component(uploadimage0, div7, null);
    			append_dev(div7, t23);
    			append_dev(div7, div6);
    			mount_component(colorlayer0, div6, null);
    			append_dev(div8, t24);
    			mount_component(image0, div8, null);
    			append_dev(div13, t25);
    			append_dev(div13, div12);
    			append_dev(div12, h32);
    			append_dev(div12, t27);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			mount_component(button1, div9, null);
    			append_dev(div11, t28);
    			mount_component(uploadimage1, div11, null);
    			append_dev(div11, t29);
    			append_dev(div11, div10);
    			mount_component(colorlayer1, div10, null);
    			append_dev(div12, t30);
    			mount_component(image1_1, div12, null);
    			append_dev(div17, t31);
    			append_dev(div17, div16);
    			append_dev(div16, h33);
    			append_dev(div16, t33);
    			append_dev(div16, div14);
    			mount_component(button2, div14, null);
    			append_dev(div16, t34);
    			append_dev(div16, div15);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const select_changes = {};

    			if (!updating_selected && dirty & /*mode*/ 32) {
    				updating_selected = true;
    				select_changes.selected = /*mode*/ ctx[5];
    				add_flush_callback(() => updating_selected = false);
    			}

    			select.$set(select_changes);
    			if ((!current || dirty & /*mode*/ 32) && t18_value !== (t18_value = /*mode*/ ctx[5].description + "")) set_data_dev(t18, t18_value);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const uploadimage0_changes = {};
    			if (dirty & /*url1*/ 1) uploadimage0_changes.onLoad = /*func*/ ctx[10];
    			uploadimage0.$set(uploadimage0_changes);
    			const image0_changes = {};
    			if (dirty & /*url1*/ 1) image0_changes.src = /*url1*/ ctx[0];

    			if (!updating_image && dirty & /*image1*/ 4) {
    				updating_image = true;
    				image0_changes.image = /*image1*/ ctx[2];
    				add_flush_callback(() => updating_image = false);
    			}

    			image0.$set(image0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const uploadimage1_changes = {};
    			if (dirty & /*url2*/ 2) uploadimage1_changes.onLoad = /*func_1*/ ctx[14];
    			uploadimage1.$set(uploadimage1_changes);
    			const image1_1_changes = {};
    			if (dirty & /*url2*/ 2) image1_1_changes.src = /*url2*/ ctx[1];

    			if (!updating_image_1 && dirty & /*image2*/ 8) {
    				updating_image_1 = true;
    				image1_1_changes.image = /*image2*/ ctx[3];
    				add_flush_callback(() => updating_image_1 = false);
    			}

    			image1_1.$set(image1_1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(uploadimage0.$$.fragment, local);
    			transition_in(colorlayer0.$$.fragment, local);
    			transition_in(image0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(uploadimage1.$$.fragment, local);
    			transition_in(colorlayer1.$$.fragment, local);
    			transition_in(image1_1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(uploadimage0.$$.fragment, local);
    			transition_out(colorlayer0.$$.fragment, local);
    			transition_out(image0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(uploadimage1.$$.fragment, local);
    			transition_out(colorlayer1.$$.fragment, local);
    			transition_out(image1_1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(select);
    			destroy_component(button0);
    			destroy_component(uploadimage0);
    			destroy_component(colorlayer0);
    			destroy_component(image0);
    			destroy_component(button1);
    			destroy_component(uploadimage1);
    			destroy_component(colorlayer1);
    			destroy_component(image1_1);
    			destroy_component(button2);
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

    function setURLHash(value) {
    	if (value) {
    		window.history.replaceState(undefined, undefined, `#${value}`);
    	}
    }

    async function createBlendLayer(width, height, color) {
    	const canvas = document.createElement("canvas");
    	canvas.width = width;
    	canvas.height = height;
    	canvas.style = "display: none;";
    	const ctx = canvas.getContext("2d");
    	ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    	ctx.fillRect(0, 0, width, height);
    	const img = document.createElement("img");
    	return await canvas.toDataURL("image/png");
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let url1 = randomImageURL();
    	let url2 = randomImageURL();
    	let image1, image2;
    	let kernel;
    	let canvas;
    	let cutoff = 0.5;
    	let gpu;
    	let image1Loaded = false;
    	let image2Loaded = false;
    	let mode = getModeFromURLHash();

    	function getModeFromURLHash() {
    		if (window.location.hash) {
    			const hash = window.location.hash.slice(1);

    			for (let i = 0; i < MODES.length; i++) {
    				const mode = MODES[i];

    				if (mode.value.toLowerCase() === hash.toLowerCase()) {
    					return mode;
    				}
    			}

    			setURLHash();
    			return MODES[0];
    		} else {
    			return MODES[0];
    		}
    	}

    	const runKernel = lodash_throttle(
    		() => {
    			if (!kernel) {
    				return;
    			}

    			if (mode.value === "overlay" || mode.value === "random_component") {
    				kernel(image1, image2, cutoff);
    			} else {
    				kernel(image1, image2);
    			}
    		},
    		50
    	);

    	function onImageLoad(event) {
    		if (event.target === image1) {
    			image1Loaded = true;
    		}

    		if (event.target === image2) {
    			image2Loaded = true;
    		}

    		if (image1Loaded && image2Loaded && !kernel) {
    			const canvasContainer = document.querySelector(".canvas-container");
    			$$invalidate(4, canvas = createCanvas([image1.width, image1.height], { el: canvasContainer, style: CANVAS_STYLE }));

    			gpu = new gpuBrowser$1.GPU({
    					canvas,
    					// mode: 'dev',
    					context: canvas.getContext("webgl", {
    						preserveDrawingBuffer: true,
    						premultipliedAlpha: false
    					})
    				});

    			gpu.addFunction(minimum);
    			gpu.addFunction(maximum);
    			gpu.addFunction(mmm);
    			gpu.addFunction(lum);
    			gpu.addFunction(clipColor);
    			gpu.addFunction(sat);
    			gpu.addFunction(setLum);

    			gpu.addFunction(setSat, {
    				argumentTypes: { pix: "Array(4)", s: "Number" }
    			});

    			gpu.addFunction(calcAlpha);
    			gpu.addFunction(applyAlpha);

    			kernel = gpu.createKernel(kernels[mode.value], {
    				graphical: true,
    				output: [image1.width, image1.height]
    			});
    		}

    		runKernel();
    	}

    	function onModeChange() {
    		setURLHash(mode.value);

    		kernel = gpu.createKernel(kernels[mode.value], {
    			graphical: true,
    			output: [image1.width, image1.height]
    		});

    		runKernel();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function select_selected_binding(value) {
    		mode = value;
    		$$invalidate(5, mode);
    	}

    	const click_handler = () => {
    		$$invalidate(0, url1 = randomImageURL());
    	};

    	const func = src => {
    		$$invalidate(0, url1 = src);
    	};

    	const change_handler = async event => {
    		const color = event.detail;
    		const src = await createBlendLayer(image1.width, image1.height, color.rgba);
    		$$invalidate(0, url1 = src);
    	};

    	function image0_image_binding(value) {
    		image1 = value;
    		$$invalidate(2, image1);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(1, url2 = randomImageURL());
    	};

    	const func_1 = src => {
    		$$invalidate(1, url2 = src);
    	};

    	const change_handler_1 = async event => {
    		const color = event.detail;
    		const src = await createBlendLayer(image1.width, image1.height, color.rgba);
    		$$invalidate(1, url2 = src);
    	};

    	function image1_1_image_binding(value) {
    		image2 = value;
    		$$invalidate(3, image2);
    	}

    	const click_handler_2 = () => saveImage(canvas);

    	$$self.$capture_state = () => ({
    		GPU: gpuBrowser$1.GPU,
    		throttle: lodash_throttle,
    		createCanvas,
    		randomImageURL,
    		saveImage,
    		kernels,
    		Select,
    		Image,
    		UploadImage,
    		ColorLayer,
    		Button,
    		MODES,
    		CANVAS_STYLE,
    		url1,
    		url2,
    		image1,
    		image2,
    		kernel,
    		canvas,
    		cutoff,
    		gpu,
    		image1Loaded,
    		image2Loaded,
    		mode,
    		getModeFromURLHash,
    		setURLHash,
    		runKernel,
    		onImageLoad,
    		onModeChange,
    		createBlendLayer
    	});

    	$$self.$inject_state = $$props => {
    		if ("url1" in $$props) $$invalidate(0, url1 = $$props.url1);
    		if ("url2" in $$props) $$invalidate(1, url2 = $$props.url2);
    		if ("image1" in $$props) $$invalidate(2, image1 = $$props.image1);
    		if ("image2" in $$props) $$invalidate(3, image2 = $$props.image2);
    		if ("kernel" in $$props) kernel = $$props.kernel;
    		if ("canvas" in $$props) $$invalidate(4, canvas = $$props.canvas);
    		if ("cutoff" in $$props) cutoff = $$props.cutoff;
    		if ("gpu" in $$props) gpu = $$props.gpu;
    		if ("image1Loaded" in $$props) image1Loaded = $$props.image1Loaded;
    		if ("image2Loaded" in $$props) image2Loaded = $$props.image2Loaded;
    		if ("mode" in $$props) $$invalidate(5, mode = $$props.mode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		url1,
    		url2,
    		image1,
    		image2,
    		canvas,
    		mode,
    		onImageLoad,
    		onModeChange,
    		select_selected_binding,
    		click_handler,
    		func,
    		change_handler,
    		image0_image_binding,
    		click_handler_1,
    		func_1,
    		change_handler_1,
    		image1_1_image_binding,
    		click_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
