import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, ipcMain as r } from "electron";
import i from "path";
import { fileURLToPath } from "url";
import a from "node:process";
import o from "node:os";
import s from "node:tty";
const __filename = fileURLToPath(import.meta.url);
const __dirname = i.dirname(__filename);
//#region \0rolldown/runtime.js
var c = Object.defineProperty, l = Object.getOwnPropertyDescriptor, u = Object.getOwnPropertyNames, d = Object.prototype.hasOwnProperty, f = (e, t, n) => () => {
	if (n) throw n[0];
	try {
		return e && (t = e(e = 0)), t;
	} catch (e) {
		throw n = [e], e;
	}
}, p = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), m = (e, t) => {
	let n = {};
	for (var r in e) c(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || c(n, Symbol.toStringTag, { value: "Module" }), n;
}, h = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = u(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !d.call(e, s) && s !== n && c(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = l(t, s)) || r.enumerable
	});
	return e;
}, g = (e) => d.call(e, "module.exports") ? e["module.exports"] : h(c({}, "__esModule", { value: !0 }), e), _ = /* @__PURE__ */ e(import.meta.url), v = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ByteLengthParser = void 0;
	var t = _("stream");
	e.ByteLengthParser = class extends t.Transform {
		length;
		position;
		buffer;
		constructor(e) {
			if (super(e), typeof e.length != "number") throw TypeError("\"length\" is not a number");
			if (e.length < 1) throw TypeError("\"length\" is not greater than 0");
			this.length = e.length, this.position = 0, this.buffer = Buffer.alloc(this.length);
		}
		_transform(e, t, n) {
			let r = 0;
			for (; r < e.length;) this.buffer[this.position] = e[r], r++, this.position++, this.position === this.length && (this.push(this.buffer), this.buffer = Buffer.alloc(this.length), this.position = 0);
			n();
		}
		_flush(e) {
			this.push(this.buffer.slice(0, this.position)), this.buffer = Buffer.alloc(this.length), e();
		}
	};
})), y = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.CCTalkParser = void 0;
	var t = _("stream");
	e.CCTalkParser = class extends t.Transform {
		array;
		cursor;
		lastByteFetchTime;
		maxDelayBetweenBytesMs;
		constructor(e = 50) {
			super(), this.array = [], this.cursor = 0, this.lastByteFetchTime = 0, this.maxDelayBetweenBytesMs = e;
		}
		_transform(e, t, n) {
			if (this.maxDelayBetweenBytesMs > 0) {
				let e = Date.now();
				e - this.lastByteFetchTime > this.maxDelayBetweenBytesMs && (this.array = [], this.cursor = 0), this.lastByteFetchTime = e;
			}
			for (this.cursor += e.length, Array.from(e).map((e) => this.array.push(e)); this.cursor > 1 && this.cursor >= this.array[1] + 5;) {
				let e = this.array[1] + 5, t = Buffer.from(this.array.slice(0, e));
				this.array = this.array.slice(t.length, this.array.length), this.cursor -= e, this.push(t);
			}
			n();
		}
	};
})), b = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.DelimiterParser = void 0;
	var t = _("stream");
	e.DelimiterParser = class extends t.Transform {
		includeDelimiter;
		delimiter;
		buffer;
		constructor({ delimiter: e, includeDelimiter: t = !1, ...n }) {
			if (super(n), e === void 0) throw TypeError("\"delimiter\" is not a bufferable object");
			if (e.length === 0) throw TypeError("\"delimiter\" has a 0 or undefined length");
			this.includeDelimiter = t, this.delimiter = Buffer.from(e), this.buffer = Buffer.alloc(0);
		}
		_transform(e, t, n) {
			let r = Buffer.concat([this.buffer, e]), i;
			for (; (i = r.indexOf(this.delimiter)) !== -1;) this.push(r.slice(0, i + (this.includeDelimiter ? this.delimiter.length : 0))), r = r.slice(i + this.delimiter.length);
			this.buffer = r, n();
		}
		_flush(e) {
			this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
		}
	};
})), x = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.InterByteTimeoutParser = void 0;
	var t = _("stream");
	e.InterByteTimeoutParser = class extends t.Transform {
		maxBufferSize;
		currentPacket;
		interval;
		intervalID;
		constructor({ maxBufferSize: e = 65536, interval: t, ...n }) {
			if (super(n), !t) throw TypeError("\"interval\" is required");
			if (typeof t != "number" || Number.isNaN(t)) throw TypeError("\"interval\" is not a number");
			if (t < 1) throw TypeError("\"interval\" is not greater than 0");
			if (typeof e != "number" || Number.isNaN(e)) throw TypeError("\"maxBufferSize\" is not a number");
			if (e < 1) throw TypeError("\"maxBufferSize\" is not greater than 0");
			this.maxBufferSize = e, this.currentPacket = [], this.interval = t;
		}
		_transform(e, t, n) {
			this.intervalID && clearTimeout(this.intervalID);
			for (let t = 0; t < e.length; t++) this.currentPacket.push(e[t]), this.currentPacket.length >= this.maxBufferSize && this.emitPacket();
			this.intervalID = setTimeout(this.emitPacket.bind(this), this.interval), n();
		}
		emitPacket() {
			this.intervalID && clearTimeout(this.intervalID), this.currentPacket.length > 0 && this.push(Buffer.from(this.currentPacket)), this.currentPacket = [];
		}
		_flush(e) {
			this.emitPacket(), e();
		}
	};
})), S = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.PacketLengthParser = void 0;
	var t = _("stream");
	e.PacketLengthParser = class extends t.Transform {
		buffer;
		start;
		opts;
		constructor(e = {}) {
			super(e);
			let { delimiter: t = [170], delimiterBytes: n = 1, packetOverhead: r = 2, lengthBytes: i = 1, lengthOffset: a = 1, maxLen: o = 255 } = e;
			this.opts = {
				delimiter: [].concat(t),
				delimiterBytes: n,
				packetOverhead: r,
				lengthBytes: i,
				lengthOffset: a,
				maxLen: o
			}, this.buffer = Buffer.alloc(0), this.start = !1;
		}
		_transform(e, t, n) {
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (!0 === this.start) {
					if (this.buffer = Buffer.concat([this.buffer, Buffer.from([n])]), this.buffer.length >= this.opts.lengthOffset + this.opts.lengthBytes) {
						let e = this.buffer.readUIntLE(this.opts.lengthOffset, this.opts.lengthBytes);
						(this.buffer.length == e + this.opts.packetOverhead || e > this.opts.maxLen) && (this.push(this.buffer), this.buffer = Buffer.alloc(0), this.start = !1);
					}
				} else if (this.buffer = Buffer.concat([Buffer.from([n]), this.buffer]), this.buffer.length === this.opts.delimiterBytes) {
					let e = this.buffer.readUIntLE(0, this.opts.delimiterBytes);
					this.opts.delimiter.includes(e) ? (this.start = !0, this.buffer = Buffer.from([...this.buffer].reverse())) : this.buffer = Buffer.from(this.buffer.subarray(1, this.buffer.length));
				}
			}
			n();
		}
		_flush(e) {
			this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
		}
	};
})), C = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ReadlineParser = void 0;
	var t = b();
	e.ReadlineParser = class extends t.DelimiterParser {
		constructor(e) {
			let t = {
				delimiter: Buffer.from("\n", "utf8"),
				encoding: "utf8",
				...e
			};
			typeof t.delimiter == "string" && (t.delimiter = Buffer.from(t.delimiter, t.encoding)), super(t);
		}
	};
})), w = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ReadyParser = void 0;
	var t = _("stream");
	e.ReadyParser = class extends t.Transform {
		delimiter;
		readOffset;
		ready;
		constructor({ delimiter: e, ...t }) {
			if (e === void 0) throw TypeError("\"delimiter\" is not a bufferable object");
			if (e.length === 0) throw TypeError("\"delimiter\" has a 0 or undefined length");
			super(t), this.delimiter = Buffer.from(e), this.readOffset = 0, this.ready = !1;
		}
		_transform(e, t, n) {
			if (this.ready) return this.push(e), n();
			let r = this.delimiter, i = 0;
			for (; this.readOffset < r.length && i < e.length;) r[this.readOffset] === e[i] ? this.readOffset++ : this.readOffset = 0, i++;
			if (this.readOffset === r.length) {
				this.ready = !0, this.emit("ready");
				let t = e.slice(i);
				t.length > 0 && this.push(t);
			}
			n();
		}
	};
})), T = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.RegexParser = void 0;
	var t = _("stream");
	e.RegexParser = class extends t.Transform {
		regex;
		data;
		constructor({ regex: e, ...t }) {
			let n = {
				encoding: "utf8",
				...t
			};
			if (e === void 0) throw TypeError("\"options.regex\" must be a regular expression pattern or object");
			e instanceof RegExp || (e = new RegExp(e.toString())), super(n), this.regex = e, this.data = "";
		}
		_transform(e, t, n) {
			let r = (this.data + e).split(this.regex);
			this.data = r.pop() || "", r.forEach((e) => {
				this.push(e);
			}), n();
		}
		_flush(e) {
			this.push(this.data), this.data = "", e();
		}
	};
})), E = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SlipDecoder = void 0;
	var t = _("stream");
	e.SlipDecoder = class extends t.Transform {
		opts;
		buffer;
		escape;
		start;
		constructor(e = {}) {
			super(e);
			let { START: t, ESC: n = 219, END: r = 192, ESC_START: i, ESC_END: a = 220, ESC_ESC: o = 221 } = e;
			this.opts = {
				START: t,
				ESC: n,
				END: r,
				ESC_START: i,
				ESC_END: a,
				ESC_ESC: o
			}, this.buffer = Buffer.alloc(0), this.escape = !1, this.start = !1;
		}
		_transform(e, t, n) {
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (n === this.opts.START) {
					this.start = !0;
					continue;
				} else this.opts.START ?? (this.start = !0);
				if (this.escape) n === this.opts.ESC_START && this.opts.START ? n = this.opts.START : n === this.opts.ESC_ESC ? n = this.opts.ESC : n === this.opts.ESC_END ? n = this.opts.END : (this.escape = !1, this.push(this.buffer), this.buffer = Buffer.alloc(0));
				else {
					if (n === this.opts.ESC) {
						this.escape = !0;
						continue;
					}
					if (n === this.opts.END) {
						this.push(this.buffer), this.buffer = Buffer.alloc(0), this.escape = !1, this.start = !1;
						continue;
					}
				}
				this.escape = !1, this.start && (this.buffer = Buffer.concat([this.buffer, Buffer.from([n])]));
			}
			n();
		}
		_flush(e) {
			this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
		}
	};
})), ee = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SlipEncoder = void 0;
	var t = _("stream");
	e.SlipEncoder = class extends t.Transform {
		opts;
		constructor(e = {}) {
			super(e);
			let { START: t, ESC: n = 219, END: r = 192, ESC_START: i, ESC_END: a = 220, ESC_ESC: o = 221, bluetoothQuirk: s = !1 } = e;
			this.opts = {
				START: t,
				ESC: n,
				END: r,
				ESC_START: i,
				ESC_END: a,
				ESC_ESC: o,
				bluetoothQuirk: s
			};
		}
		_transform(e, t, n) {
			let r = e.length;
			if (this.opts.bluetoothQuirk && r === 0) return n();
			let i = Buffer.alloc(r * 2 + 2), a = 0;
			this.opts.bluetoothQuirk == 1 && (i[a++] = this.opts.END), this.opts.START !== void 0 && (i[a++] = this.opts.START);
			for (let t = 0; t < r; t++) {
				let n = e[t];
				n === this.opts.START && this.opts.ESC_START ? (i[a++] = this.opts.ESC, n = this.opts.ESC_START) : n === this.opts.END ? (i[a++] = this.opts.ESC, n = this.opts.ESC_END) : n === this.opts.ESC && (i[a++] = this.opts.ESC, n = this.opts.ESC_ESC), i[a++] = n;
			}
			i[a++] = this.opts.END, n(null, i.slice(0, a));
		}
	};
})), D = /* @__PURE__ */ p(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__exportStar || function(e, n) {
		for (var r in e) r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), n(E(), e), n(ee(), e);
})), O = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.convertHeaderBufferToObj = e.HEADER_LENGTH = void 0, e.HEADER_LENGTH = 6;
	var t = (e) => {
		let t = Number(e).toString(2);
		for (; t.length < 8;) t = `0${t}`;
		return t;
	};
	e.convertHeaderBufferToObj = (n) => {
		let r = Array.from(n.slice(0, e.HEADER_LENGTH)).reduce((e, n) => `${e}${t(n)}`, ""), i = r.slice(0, 3) === "000" ? 1 : "UNKNOWN_VERSION", a = Number(r[3]), o = Number(r[4]), s = parseInt(r.slice(5, 16), 2), c = parseInt(r.slice(16, 18), 2), l = parseInt(r.slice(18, 32), 2), u = parseInt(r.slice(-16), 2) + 1;
		return {
			versionNumber: i,
			identification: {
				apid: s,
				secondaryHeader: o,
				type: a
			},
			sequenceControl: {
				packetName: l,
				sequenceFlags: c
			},
			dataLength: u
		};
	};
})), te = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SpacePacketParser = void 0;
	var t = _("stream"), n = O();
	e.SpacePacketParser = class extends t.Transform {
		timeCodeFieldLength;
		ancillaryDataFieldLength;
		dataBuffer;
		headerBuffer;
		dataLength;
		expectingHeader;
		dataSlice;
		header;
		constructor(e = {}) {
			super({
				...e,
				objectMode: !0
			}), this.timeCodeFieldLength = e.timeCodeFieldLength || 0, this.ancillaryDataFieldLength = e.ancillaryDataFieldLength || 0, this.dataSlice = this.timeCodeFieldLength + this.ancillaryDataFieldLength, this.dataBuffer = Buffer.alloc(0), this.headerBuffer = Buffer.alloc(0), this.dataLength = 0, this.expectingHeader = !0;
		}
		pushCompletedPacket() {
			if (!this.header) throw Error("Missing header");
			let e = Buffer.from(this.dataBuffer.slice(0, this.timeCodeFieldLength)), t = Buffer.from(this.dataBuffer.slice(this.timeCodeFieldLength, this.timeCodeFieldLength + this.ancillaryDataFieldLength)), r = Buffer.from(this.dataBuffer.slice(this.dataSlice, this.dataLength)), i = {
				header: { ...this.header },
				data: r.toString()
			};
			(e.length > 0 || t.length > 0) && (i.secondaryHeader = {}, e.length && (i.secondaryHeader.timeCode = e.toString()), t.length && (i.secondaryHeader.ancillaryData = t.toString())), this.push(i);
			let a = Buffer.from(this.dataBuffer.slice(this.dataLength));
			a.length >= n.HEADER_LENGTH ? this.extractHeader(a) : (this.headerBuffer = a, this.dataBuffer = Buffer.alloc(0), this.expectingHeader = !0, this.dataLength = 0, this.header = void 0);
		}
		extractHeader(e) {
			let t = Buffer.concat([this.headerBuffer, e]), r = t.slice(n.HEADER_LENGTH);
			t.length >= n.HEADER_LENGTH ? (this.header = (0, n.convertHeaderBufferToObj)(t), this.dataLength = this.header.dataLength, this.headerBuffer = Buffer.alloc(0), this.expectingHeader = !1) : this.headerBuffer = t, r.length > 0 && (this.dataBuffer = Buffer.from(r), this.dataBuffer.length >= this.dataLength && this.pushCompletedPacket());
		}
		_transform(e, t, n) {
			this.expectingHeader ? this.extractHeader(e) : (this.dataBuffer = Buffer.concat([this.dataBuffer, e]), this.dataBuffer.length >= this.dataLength && this.pushCompletedPacket()), n();
		}
		_flush(e) {
			let t = Buffer.concat([this.headerBuffer, this.dataBuffer]), n = Array.from(t);
			this.push(n), e();
		}
	};
})), k = /* @__PURE__ */ p(((e, t) => {
	var n = 1e3, r = n * 60, i = r * 60, a = i * 24, o = a * 7, s = a * 365.25;
	t.exports = function(e, t) {
		t ||= {};
		var n = typeof e;
		if (n === "string" && e.length > 0) return c(e);
		if (n === "number" && isFinite(e)) return t.long ? u(e) : l(e);
		throw Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e));
	};
	function c(e) {
		if (e = String(e), !(e.length > 100)) {
			var t = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);
			if (t) {
				var c = parseFloat(t[1]);
				switch ((t[2] || "ms").toLowerCase()) {
					case "years":
					case "year":
					case "yrs":
					case "yr":
					case "y": return c * s;
					case "weeks":
					case "week":
					case "w": return c * o;
					case "days":
					case "day":
					case "d": return c * a;
					case "hours":
					case "hour":
					case "hrs":
					case "hr":
					case "h": return c * i;
					case "minutes":
					case "minute":
					case "mins":
					case "min":
					case "m": return c * r;
					case "seconds":
					case "second":
					case "secs":
					case "sec":
					case "s": return c * n;
					case "milliseconds":
					case "millisecond":
					case "msecs":
					case "msec":
					case "ms": return c;
					default: return;
				}
			}
		}
	}
	function l(e) {
		var t = Math.abs(e);
		return t >= a ? Math.round(e / a) + "d" : t >= i ? Math.round(e / i) + "h" : t >= r ? Math.round(e / r) + "m" : t >= n ? Math.round(e / n) + "s" : e + "ms";
	}
	function u(e) {
		var t = Math.abs(e);
		return t >= a ? d(e, t, a, "day") : t >= i ? d(e, t, i, "hour") : t >= r ? d(e, t, r, "minute") : t >= n ? d(e, t, n, "second") : e + " ms";
	}
	function d(e, t, n, r) {
		var i = t >= n * 1.5;
		return Math.round(e / n) + " " + r + (i ? "s" : "");
	}
})), ne = /* @__PURE__ */ p(((e, t) => {
	function n(e) {
		n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = s, n.humanize = k(), n.destroy = l, Object.keys(e).forEach((t) => {
			n[t] = e[t];
		}), n.names = [], n.skips = [], n.formatters = {};
		function t(e) {
			let t = 0;
			for (let n = 0; n < e.length; n++) t = (t << 5) - t + e.charCodeAt(n), t |= 0;
			return n.colors[Math.abs(t) % n.colors.length];
		}
		n.selectColor = t;
		function n(e) {
			let t, i = null, a, o;
			function s(...e) {
				if (!s.enabled) return;
				let r = s, i = Number(/* @__PURE__ */ new Date());
				r.diff = i - (t || i), r.prev = t, r.curr = i, t = i, e[0] = n.coerce(e[0]), typeof e[0] != "string" && e.unshift("%O");
				let a = 0;
				e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, i) => {
					if (t === "%%") return "%";
					a++;
					let o = n.formatters[i];
					if (typeof o == "function") {
						let n = e[a];
						t = o.call(r, n), e.splice(a, 1), a--;
					}
					return t;
				}), n.formatArgs.call(r, e), (r.log || n.log).apply(r, e);
			}
			return s.namespace = e, s.useColors = n.useColors(), s.color = n.selectColor(e), s.extend = r, s.destroy = n.destroy, Object.defineProperty(s, "enabled", {
				enumerable: !0,
				configurable: !1,
				get: () => i === null ? (a !== n.namespaces && (a = n.namespaces, o = n.enabled(e)), o) : i,
				set: (e) => {
					i = e;
				}
			}), typeof n.init == "function" && n.init(s), s;
		}
		function r(e, t) {
			let r = n(this.namespace + (t === void 0 ? ":" : t) + e);
			return r.log = this.log, r;
		}
		function i(e) {
			n.save(e), n.namespaces = e, n.names = [], n.skips = [];
			let t = (typeof e == "string" ? e : "").trim().replace(" ", ",").split(",").filter(Boolean);
			for (let e of t) e[0] === "-" ? n.skips.push(e.slice(1)) : n.names.push(e);
		}
		function a(e, t) {
			let n = 0, r = 0, i = -1, a = 0;
			for (; n < e.length;) if (r < t.length && (t[r] === e[n] || t[r] === "*")) t[r] === "*" ? (i = r, a = n, r++) : (n++, r++);
			else if (i !== -1) r = i + 1, a++, n = a;
			else return !1;
			for (; r < t.length && t[r] === "*";) r++;
			return r === t.length;
		}
		function o() {
			let e = [...n.names, ...n.skips.map((e) => "-" + e)].join(",");
			return n.enable(""), e;
		}
		function s(e) {
			for (let t of n.skips) if (a(e, t)) return !1;
			for (let t of n.names) if (a(e, t)) return !0;
			return !1;
		}
		function c(e) {
			return e instanceof Error ? e.stack || e.message : e;
		}
		function l() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		return n.enable(n.load()), n;
	}
	t.exports = n;
})), re = /* @__PURE__ */ p(((e, t) => {
	e.formatArgs = r, e.save = i, e.load = a, e.useColors = n, e.storage = o(), e.destroy = (() => {
		let e = !1;
		return () => {
			e || (e = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
		};
	})(), e.colors = /* @__PURE__ */ "#0000CC.#0000FF.#0033CC.#0033FF.#0066CC.#0066FF.#0099CC.#0099FF.#00CC00.#00CC33.#00CC66.#00CC99.#00CCCC.#00CCFF.#3300CC.#3300FF.#3333CC.#3333FF.#3366CC.#3366FF.#3399CC.#3399FF.#33CC00.#33CC33.#33CC66.#33CC99.#33CCCC.#33CCFF.#6600CC.#6600FF.#6633CC.#6633FF.#66CC00.#66CC33.#9900CC.#9900FF.#9933CC.#9933FF.#99CC00.#99CC33.#CC0000.#CC0033.#CC0066.#CC0099.#CC00CC.#CC00FF.#CC3300.#CC3333.#CC3366.#CC3399.#CC33CC.#CC33FF.#CC6600.#CC6633.#CC9900.#CC9933.#CCCC00.#CCCC33.#FF0000.#FF0033.#FF0066.#FF0099.#FF00CC.#FF00FF.#FF3300.#FF3333.#FF3366.#FF3399.#FF33CC.#FF33FF.#FF6600.#FF6633.#FF9900.#FF9933.#FFCC00.#FFCC33".split(".");
	function n() {
		if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return !0;
		if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return !1;
		let e;
		return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator < "u" && navigator.userAgent && (e = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(e[1], 10) >= 31 || typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	function r(e) {
		if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors) return;
		let n = "color: " + this.color;
		e.splice(1, 0, n, "color: inherit");
		let r = 0, i = 0;
		e[0].replace(/%[a-zA-Z%]/g, (e) => {
			e !== "%%" && (r++, e === "%c" && (i = r));
		}), e.splice(i, 0, n);
	}
	e.log = console.debug || console.log || (() => {});
	function i(t) {
		try {
			t ? e.storage.setItem("debug", t) : e.storage.removeItem("debug");
		} catch {}
	}
	function a() {
		let t;
		try {
			t = e.storage.getItem("debug");
		} catch {}
		return !t && typeof process < "u" && "env" in process && (t = process.env.DEBUG), t;
	}
	function o() {
		try {
			return localStorage;
		} catch {}
	}
	t.exports = ne()(e);
	var { formatters: s } = t.exports;
	s.j = function(e) {
		try {
			return JSON.stringify(e);
		} catch (e) {
			return "[UnexpectedJSONParseError]: " + e.message;
		}
	};
})), A = /* @__PURE__ */ m({
	createSupportsColor: () => M,
	default: () => F
});
function j(e, t = globalThis.Deno ? globalThis.Deno.args : a.argv) {
	let n = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", r = t.indexOf(n + e), i = t.indexOf("--");
	return r !== -1 && (i === -1 || r < i);
}
function ie() {
	if (!("FORCE_COLOR" in N)) return;
	if (N.FORCE_COLOR === "true") return 1;
	if (N.FORCE_COLOR === "false") return 0;
	if (N.FORCE_COLOR.length === 0) return 1;
	let e = Math.min(Number.parseInt(N.FORCE_COLOR, 10), 3);
	if ([
		0,
		1,
		2,
		3
	].includes(e)) return e;
}
function ae(e) {
	return e === 0 ? !1 : {
		level: e,
		hasBasic: !0,
		has256: e >= 2,
		has16m: e >= 3
	};
}
function oe(e, { streamIsTTY: t, sniffFlags: n = !0 } = {}) {
	let r = ie();
	r !== void 0 && (P = r);
	let i = n ? P : r;
	if (i === 0) return 0;
	if (n) {
		if (j("color=16m") || j("color=full") || j("color=truecolor")) return 3;
		if (j("color=256")) return 2;
	}
	if ("TF_BUILD" in N && "AGENT_NAME" in N) return 1;
	if (e && !t && i === void 0) return 0;
	let s = i || 0;
	if (N.TERM === "dumb") return s;
	if (a.platform === "win32") {
		let e = o.release().split(".");
		return Number(e[0]) >= 10 && Number(e[2]) >= 10586 ? Number(e[2]) >= 14931 ? 3 : 2 : 1;
	}
	if ("CI" in N) return [
		"GITHUB_ACTIONS",
		"GITEA_ACTIONS",
		"CIRCLECI"
	].some((e) => e in N) ? 3 : [
		"TRAVIS",
		"APPVEYOR",
		"GITLAB_CI",
		"BUILDKITE",
		"DRONE"
	].some((e) => e in N) || N.CI_NAME === "codeship" ? 1 : s;
	if ("TEAMCITY_VERSION" in N) return +!!/^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(N.TEAMCITY_VERSION);
	if (N.COLORTERM === "truecolor" || N.TERM === "xterm-kitty" || N.TERM === "xterm-ghostty" || N.TERM === "wezterm") return 3;
	if ("TERM_PROGRAM" in N) {
		let e = Number.parseInt((N.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
		switch (N.TERM_PROGRAM) {
			case "iTerm.app": return e >= 3 ? 3 : 2;
			case "Apple_Terminal": return 2;
		}
	}
	return /-256(color)?$/i.test(N.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(N.TERM) || "COLORTERM" in N ? 1 : s;
}
function M(e, t = {}) {
	return ae(oe(e, {
		streamIsTTY: e && e.isTTY,
		...t
	}));
}
var N, P, F, I = f((() => {
	({env: N} = a), j("no-color") || j("no-colors") || j("color=false") || j("color=never") ? P = 0 : (j("color") || j("colors") || j("color=true") || j("color=always")) && (P = 1), F = {
		stdout: M({ isTTY: s.isatty(1) }),
		stderr: M({ isTTY: s.isatty(2) })
	};
})), se = /* @__PURE__ */ p(((e, t) => {
	var n = _("tty"), r = _("util");
	e.init = u, e.log = s, e.formatArgs = a, e.save = c, e.load = l, e.useColors = i, e.destroy = r.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."), e.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		let t = (I(), g(A));
		t && (t.stderr || t).level >= 2 && (e.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		]);
	} catch {}
	e.inspectOpts = Object.keys(process.env).filter((e) => /^debug_/i.test(e)).reduce((e, t) => {
		let n = t.substring(6).toLowerCase().replace(/_([a-z])/g, (e, t) => t.toUpperCase()), r = process.env[t];
		return r = /^(yes|on|true|enabled)$/i.test(r) ? !0 : /^(no|off|false|disabled)$/i.test(r) ? !1 : r === "null" ? null : Number(r), e[n] = r, e;
	}, {});
	function i() {
		return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : n.isatty(process.stderr.fd);
	}
	function a(e) {
		let { namespace: n, useColors: r } = this;
		if (r) {
			let r = this.color, i = "\x1B[3" + (r < 8 ? r : "8;5;" + r), a = `  ${i};1m${n} \u001B[0m`;
			e[0] = a + e[0].split("\n").join("\n" + a), e.push(i + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
		} else e[0] = o() + n + " " + e[0];
	}
	function o() {
		return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	function s(...t) {
		return process.stderr.write(r.formatWithOptions(e.inspectOpts, ...t) + "\n");
	}
	function c(e) {
		e ? process.env.DEBUG = e : delete process.env.DEBUG;
	}
	function l() {
		return process.env.DEBUG;
	}
	function u(t) {
		t.inspectOpts = {};
		let n = Object.keys(e.inspectOpts);
		for (let r = 0; r < n.length; r++) t.inspectOpts[n[r]] = e.inspectOpts[n[r]];
	}
	t.exports = ne()(e);
	var { formatters: d } = t.exports;
	d.o = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts).split("\n").map((e) => e.trim()).join(" ");
	}, d.O = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts);
	};
})), ce = /* @__PURE__ */ p(((e, t) => {
	typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? t.exports = re() : t.exports = se();
})), L = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SerialPortStream = e.DisconnectedError = void 0;
	var n = _("stream"), r = (0, t(ce()).default)("serialport/stream"), i = class extends Error {
		disconnected;
		constructor(e) {
			super(e), this.disconnected = !0;
		}
	};
	e.DisconnectedError = i;
	var a = {
		brk: !1,
		cts: !1,
		dtr: !0,
		rts: !0
	};
	function o(e) {
		let t = Buffer.allocUnsafe(e);
		return t.used = 0, t;
	}
	e.SerialPortStream = class extends n.Duplex {
		port;
		_pool;
		_kMinPoolSpace;
		opening;
		closing;
		settings;
		constructor(e, t) {
			let n = {
				autoOpen: !0,
				endOnClose: !1,
				highWaterMark: 64 * 1024,
				...e
			};
			if (super({ highWaterMark: n.highWaterMark }), !n.binding) throw TypeError("\"Bindings\" is invalid pass it as `options.binding`");
			if (!n.path) throw TypeError(`"path" is not defined: ${n.path}`);
			if (typeof n.baudRate != "number") throw TypeError(`"baudRate" must be a number: ${n.baudRate}`);
			this.settings = n, this.opening = !1, this.closing = !1, this._pool = o(this.settings.highWaterMark), this._kMinPoolSpace = 128, this.settings.autoOpen && this.open(t);
		}
		get path() {
			return this.settings.path;
		}
		get baudRate() {
			return this.settings.baudRate;
		}
		get isOpen() {
			return (this.port?.isOpen ?? !1) && !this.closing;
		}
		_error(e, t) {
			t ? t.call(this, e) : this.emit("error", e);
		}
		_asyncError(e, t) {
			process.nextTick(() => this._error(e, t));
		}
		open(e) {
			if (this.isOpen) return this._asyncError(/* @__PURE__ */ Error("Port is already open"), e);
			if (this.opening) return this._asyncError(/* @__PURE__ */ Error("Port is opening"), e);
			let { highWaterMark: t, binding: n, autoOpen: i, endOnClose: a, ...o } = this.settings;
			this.opening = !0, r("opening", `path: ${this.path}`), this.settings.binding.open(o).then((t) => {
				r("opened", `path: ${this.path}`), this.port = t, this.opening = !1, this.emit("open"), e && e.call(this, null);
			}, (t) => {
				this.opening = !1, r("Binding #open had an error", t), this._error(t, e);
			});
		}
		update(e, t) {
			if (!this.isOpen || !this.port) return r("update attempted, but port is not open"), this._asyncError(/* @__PURE__ */ Error("Port is not open"), t);
			r("update", `baudRate: ${e.baudRate}`), this.port.update(e).then(() => {
				r("binding.update", "finished"), this.settings.baudRate = e.baudRate, t && t.call(this, null);
			}, (e) => (r("binding.update", "error", e), this._error(e, t)));
		}
		write(e, t, n) {
			return Array.isArray(e) && (e = Buffer.from(e)), typeof t == "function" ? super.write(e, t) : super.write(e, t, n);
		}
		_write(e, t, n) {
			if (!this.isOpen || !this.port) {
				this.once("open", () => {
					this._write(e, t, n);
				});
				return;
			}
			r("_write", `${e.length} bytes of data`), this.port.write(e).then(() => {
				r("binding.write", "write finished"), n(null);
			}, (e) => {
				r("binding.write", "error", e), e.canceled || this._disconnected(e), n(e);
			});
		}
		_writev(e, t) {
			r("_writev", `${e.length} chunks of data`);
			let n = e.map((e) => e.chunk);
			this._write(Buffer.concat(n), "binary", t);
		}
		_read(e) {
			if (!this.isOpen || !this.port) {
				r("_read", "queueing _read for after open"), this.once("open", () => {
					this._read(e);
				});
				return;
			}
			(!this._pool || this._pool.length - this._pool.used < this._kMinPoolSpace) && (r("_read", "discarding the read buffer pool because it is below kMinPoolSpace"), this._pool = o(this.settings.highWaterMark));
			let t = this._pool, n = Math.min(t.length - t.used, e), i = t.used;
			r("_read", "reading", {
				start: i,
				toRead: n
			}), this.port.read(t, i, n).then(({ bytesRead: e }) => {
				if (r("binding.read", "finished", { bytesRead: e }), e === 0) {
					r("binding.read", "Zero bytes read closing readable stream"), this.push(null);
					return;
				}
				t.used += e, this.push(t.slice(i, i + e));
			}, (t) => {
				r("binding.read", "error", t), t.canceled || this._disconnected(t), this._read(e);
			});
		}
		_disconnected(e) {
			if (!this.isOpen) {
				r("disconnected aborted because already closed", e);
				return;
			}
			r("disconnected", e), this.close(void 0, new i(e.message));
		}
		close(e, t = null) {
			if (!this.isOpen || !this.port) return r("close attempted, but port is not open"), this._asyncError(/* @__PURE__ */ Error("Port is not open"), e);
			this.closing = !0, r("#close"), this.port.close().then(() => {
				this.closing = !1, r("binding.close", "finished"), this.emit("close", t), this.settings.endOnClose && this.emit("end"), e && e.call(this, t);
			}, (t) => (this.closing = !1, r("binding.close", "had an error", t), this._error(t, e)));
		}
		set(e, t) {
			if (!this.isOpen || !this.port) return r("set attempted, but port is not open"), this._asyncError(/* @__PURE__ */ Error("Port is not open"), t);
			let n = {
				...a,
				...e
			};
			r("#set", n), this.port.set(n).then(() => {
				r("binding.set", "finished"), t && t.call(this, null);
			}, (e) => (r("binding.set", "had an error", e), this._error(e, t)));
		}
		get(e) {
			if (!this.isOpen || !this.port) return r("get attempted, but port is not open"), this._asyncError(/* @__PURE__ */ Error("Port is not open"), e);
			r("#get"), this.port.get().then((t) => {
				r("binding.get", "finished"), e.call(this, null, t);
			}, (t) => (r("binding.get", "had an error", t), this._error(t, e)));
		}
		flush(e) {
			if (!this.isOpen || !this.port) return r("flush attempted, but port is not open"), this._asyncError(/* @__PURE__ */ Error("Port is not open"), e);
			r("#flush"), this.port.flush().then(() => {
				r("binding.flush", "finished"), e && e.call(this, null);
			}, (t) => (r("binding.flush", "had an error", t), this._error(t, e)));
		}
		drain(e) {
			if (r("drain"), !this.isOpen || !this.port) {
				r("drain queuing on port open"), this.once("open", () => {
					this.drain(e);
				});
				return;
			}
			this.port.drain().then(() => {
				r("binding.drain", "finished"), e && e.call(this, null);
			}, (t) => (r("binding.drain", "had an error", t), this._error(t, e)));
		}
	};
})), le = /* @__PURE__ */ p(((e, t) => {
	function n(e) {
		n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = s, n.humanize = k(), n.destroy = l, Object.keys(e).forEach((t) => {
			n[t] = e[t];
		}), n.names = [], n.skips = [], n.formatters = {};
		function t(e) {
			let t = 0;
			for (let n = 0; n < e.length; n++) t = (t << 5) - t + e.charCodeAt(n), t |= 0;
			return n.colors[Math.abs(t) % n.colors.length];
		}
		n.selectColor = t;
		function n(e) {
			let t, i = null, a, o;
			function s(...e) {
				if (!s.enabled) return;
				let r = s, i = Number(/* @__PURE__ */ new Date());
				r.diff = i - (t || i), r.prev = t, r.curr = i, t = i, e[0] = n.coerce(e[0]), typeof e[0] != "string" && e.unshift("%O");
				let a = 0;
				e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, i) => {
					if (t === "%%") return "%";
					a++;
					let o = n.formatters[i];
					if (typeof o == "function") {
						let n = e[a];
						t = o.call(r, n), e.splice(a, 1), a--;
					}
					return t;
				}), n.formatArgs.call(r, e), (r.log || n.log).apply(r, e);
			}
			return s.namespace = e, s.useColors = n.useColors(), s.color = n.selectColor(e), s.extend = r, s.destroy = n.destroy, Object.defineProperty(s, "enabled", {
				enumerable: !0,
				configurable: !1,
				get: () => i === null ? (a !== n.namespaces && (a = n.namespaces, o = n.enabled(e)), o) : i,
				set: (e) => {
					i = e;
				}
			}), typeof n.init == "function" && n.init(s), s;
		}
		function r(e, t) {
			let r = n(this.namespace + (t === void 0 ? ":" : t) + e);
			return r.log = this.log, r;
		}
		function i(e) {
			n.save(e), n.namespaces = e, n.names = [], n.skips = [];
			let t = (typeof e == "string" ? e : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (let e of t) e[0] === "-" ? n.skips.push(e.slice(1)) : n.names.push(e);
		}
		function a(e, t) {
			let n = 0, r = 0, i = -1, a = 0;
			for (; n < e.length;) if (r < t.length && (t[r] === e[n] || t[r] === "*")) t[r] === "*" ? (i = r, a = n, r++) : (n++, r++);
			else if (i !== -1) r = i + 1, a++, n = a;
			else return !1;
			for (; r < t.length && t[r] === "*";) r++;
			return r === t.length;
		}
		function o() {
			let e = [...n.names, ...n.skips.map((e) => "-" + e)].join(",");
			return n.enable(""), e;
		}
		function s(e) {
			for (let t of n.skips) if (a(e, t)) return !1;
			for (let t of n.names) if (a(e, t)) return !0;
			return !1;
		}
		function c(e) {
			return e instanceof Error ? e.stack || e.message : e;
		}
		function l() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		return n.enable(n.load()), n;
	}
	t.exports = n;
})), ue = /* @__PURE__ */ p(((e, t) => {
	e.formatArgs = r, e.save = i, e.load = a, e.useColors = n, e.storage = o(), e.destroy = (() => {
		let e = !1;
		return () => {
			e || (e = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
		};
	})(), e.colors = /* @__PURE__ */ "#0000CC.#0000FF.#0033CC.#0033FF.#0066CC.#0066FF.#0099CC.#0099FF.#00CC00.#00CC33.#00CC66.#00CC99.#00CCCC.#00CCFF.#3300CC.#3300FF.#3333CC.#3333FF.#3366CC.#3366FF.#3399CC.#3399FF.#33CC00.#33CC33.#33CC66.#33CC99.#33CCCC.#33CCFF.#6600CC.#6600FF.#6633CC.#6633FF.#66CC00.#66CC33.#9900CC.#9900FF.#9933CC.#9933FF.#99CC00.#99CC33.#CC0000.#CC0033.#CC0066.#CC0099.#CC00CC.#CC00FF.#CC3300.#CC3333.#CC3366.#CC3399.#CC33CC.#CC33FF.#CC6600.#CC6633.#CC9900.#CC9933.#CCCC00.#CCCC33.#FF0000.#FF0033.#FF0066.#FF0099.#FF00CC.#FF00FF.#FF3300.#FF3333.#FF3366.#FF3399.#FF33CC.#FF33FF.#FF6600.#FF6633.#FF9900.#FF9933.#FFCC00.#FFCC33".split(".");
	function n() {
		if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return !0;
		if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return !1;
		let e;
		return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator < "u" && navigator.userAgent && (e = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(e[1], 10) >= 31 || typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	function r(e) {
		if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors) return;
		let n = "color: " + this.color;
		e.splice(1, 0, n, "color: inherit");
		let r = 0, i = 0;
		e[0].replace(/%[a-zA-Z%]/g, (e) => {
			e !== "%%" && (r++, e === "%c" && (i = r));
		}), e.splice(i, 0, n);
	}
	e.log = console.debug || console.log || (() => {});
	function i(t) {
		try {
			t ? e.storage.setItem("debug", t) : e.storage.removeItem("debug");
		} catch {}
	}
	function a() {
		let t;
		try {
			t = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
		} catch {}
		return !t && typeof process < "u" && "env" in process && (t = process.env.DEBUG), t;
	}
	function o() {
		try {
			return localStorage;
		} catch {}
	}
	t.exports = le()(e);
	var { formatters: s } = t.exports;
	s.j = function(e) {
		try {
			return JSON.stringify(e);
		} catch (e) {
			return "[UnexpectedJSONParseError]: " + e.message;
		}
	};
})), de = /* @__PURE__ */ p(((e, t) => {
	var n = _("tty"), r = _("util");
	e.init = u, e.log = s, e.formatArgs = a, e.save = c, e.load = l, e.useColors = i, e.destroy = r.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."), e.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		let t = (I(), g(A));
		t && (t.stderr || t).level >= 2 && (e.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		]);
	} catch {}
	e.inspectOpts = Object.keys(process.env).filter((e) => /^debug_/i.test(e)).reduce((e, t) => {
		let n = t.substring(6).toLowerCase().replace(/_([a-z])/g, (e, t) => t.toUpperCase()), r = process.env[t];
		return r = /^(yes|on|true|enabled)$/i.test(r) ? !0 : /^(no|off|false|disabled)$/i.test(r) ? !1 : r === "null" ? null : Number(r), e[n] = r, e;
	}, {});
	function i() {
		return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : n.isatty(process.stderr.fd);
	}
	function a(e) {
		let { namespace: n, useColors: r } = this;
		if (r) {
			let r = this.color, i = "\x1B[3" + (r < 8 ? r : "8;5;" + r), a = `  ${i};1m${n} \u001B[0m`;
			e[0] = a + e[0].split("\n").join("\n" + a), e.push(i + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
		} else e[0] = o() + n + " " + e[0];
	}
	function o() {
		return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	function s(...t) {
		return process.stderr.write(r.formatWithOptions(e.inspectOpts, ...t) + "\n");
	}
	function c(e) {
		e ? process.env.DEBUG = e : delete process.env.DEBUG;
	}
	function l() {
		return process.env.DEBUG;
	}
	function u(t) {
		t.inspectOpts = {};
		let n = Object.keys(e.inspectOpts);
		for (let r = 0; r < n.length; r++) t.inspectOpts[n[r]] = e.inspectOpts[n[r]];
	}
	t.exports = le()(e);
	var { formatters: d } = t.exports;
	d.o = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts).split("\n").map((e) => e.trim()).join(" ");
	}, d.O = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts);
	};
})), fe = /* @__PURE__ */ p(((e, t) => {
	typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? t.exports = ue() : t.exports = de();
})), pe = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var t = fe();
	function n(e) {
		return e && typeof e == "object" && "default" in e ? e : { default: e };
	}
	var r = (/* @__PURE__ */ n(t)).default("serialport/binding-mock"), i = {}, a = 0;
	function o() {
		return new Promise((e) => process.nextTick(() => e()));
	}
	var s = class extends Error {
		constructor(e) {
			super(e), this.canceled = !0;
		}
	}, c = {
		reset() {
			i = {}, a = 0;
		},
		createPort(e, t = {}) {
			a++;
			let n = Object.assign({
				echo: !1,
				record: !1,
				manufacturer: "The J5 Robotics Company",
				vendorId: void 0,
				productId: void 0,
				maxReadSize: 1024
			}, t);
			i[e] = {
				data: Buffer.alloc(0),
				echo: n.echo,
				record: n.record,
				readyData: n.readyData,
				maxReadSize: n.maxReadSize,
				info: {
					path: e,
					manufacturer: n.manufacturer,
					serialNumber: `${a}`,
					pnpId: void 0,
					locationId: void 0,
					vendorId: n.vendorId,
					productId: n.productId
				}
			}, r(a, "created port", JSON.stringify({
				path: e,
				opt: t
			}));
		},
		async list() {
			return r(null, "list"), Object.values(i).map((e) => e.info);
		},
		async open(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (!e.path) throw TypeError("\"path\" is not a valid port");
			if (!e.baudRate) throw TypeError("\"baudRate\" is not a valid baudRate");
			let t = Object.assign({
				dataBits: 8,
				lock: !0,
				stopBits: 1,
				parity: "none",
				rtscts: !1,
				xon: !1,
				xoff: !1,
				xany: !1,
				hupcl: !0
			}, e), { path: n } = t;
			r(null, `open: opening path ${n}`);
			let a = i[n];
			if (await o(), !a) throw Error(`Port does not exist - please call MockBinding.createPort('${n}') first`);
			let s = a.info.serialNumber;
			if (a.openOpt?.lock) throw r(s, "open: Port is locked cannot open"), Error("Port is locked cannot open");
			return r(s, `open: opened path ${n}`), a.openOpt = Object.assign({}, t), new l(a, t);
		}
	}, l = class {
		constructor(e, t) {
			if (this.port = e, this.openOptions = t, this.pendingRead = null, this.isOpen = !0, this.lastWrite = null, this.recording = Buffer.alloc(0), this.writeOperation = null, this.serialNumber = e.info.serialNumber, e.readyData) {
				let t = e.readyData;
				process.nextTick(() => {
					this.isOpen && (r(this.serialNumber, "emitting ready data"), this.emitData(t));
				});
			}
		}
		emitData(e) {
			if (!this.isOpen || !this.port) throw Error("Port must be open to pretend to receive data");
			let t = Buffer.isBuffer(e) ? e : Buffer.from(e);
			r(this.serialNumber, "emitting data - pending read:", !!this.pendingRead), this.port.data = Buffer.concat([this.port.data, t]), this.pendingRead &&= (process.nextTick(this.pendingRead), null);
		}
		async close() {
			if (r(this.serialNumber, "close"), !this.isOpen) throw Error("Port is not open");
			let e = this.port;
			if (!e) throw Error("already closed");
			e.openOpt = void 0, e.data = Buffer.alloc(0), r(this.serialNumber, "port is closed"), this.serialNumber = void 0, this.isOpen = !1, this.pendingRead && this.pendingRead(new s("port is closed"));
		}
		async read(e, t, n) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (typeof t != "number" || isNaN(t)) throw TypeError(`"offset" is not an integer got "${isNaN(t) ? "NaN" : typeof t}"`);
			if (typeof n != "number" || isNaN(n)) throw TypeError(`"length" is not an integer got "${isNaN(n) ? "NaN" : typeof n}"`);
			if (e.length < t + n) throw Error("buffer is too small");
			if (!this.isOpen) throw Error("Port is not open");
			if (r(this.serialNumber, "read", n, "bytes"), await o(), !this.isOpen || !this.port) throw new s("Read canceled");
			if (this.port.data.length <= 0) return new Promise((r, i) => {
				this.pendingRead = (a) => {
					if (a) return i(a);
					this.read(e, t, n).then(r, i);
				};
			});
			let i = this.port.maxReadSize > n ? n : this.port.maxReadSize, a = this.port.data.slice(0, i).copy(e, t);
			return this.port.data = this.port.data.slice(i), r(this.serialNumber, "read", a, "bytes"), {
				bytesRead: a,
				buffer: e
			};
		}
		async write(e) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (!this.isOpen || !this.port) throw r("write", "error port is not open"), Error("Port is not open");
			if (r(this.serialNumber, "write", e.length, "bytes"), this.writeOperation) throw Error("Overlapping writes are not supported and should be queued by the serialport object");
			return this.writeOperation = (async () => {
				if (await o(), !this.isOpen || !this.port) throw Error("Write canceled");
				let t = this.lastWrite = Buffer.from(e);
				this.port.record && (this.recording = Buffer.concat([this.recording, t])), this.port.echo && process.nextTick(() => {
					this.isOpen && this.emitData(t);
				}), this.writeOperation = null, r(this.serialNumber, "writing finished");
			})(), this.writeOperation;
		}
		async update(e) {
			if (typeof e != "object") throw TypeError("\"options\" is not an object");
			if (typeof e.baudRate != "number") throw TypeError("\"options.baudRate\" is not a number");
			if (r(this.serialNumber, "update"), !this.isOpen || !this.port) throw Error("Port is not open");
			await o(), this.port.openOpt && (this.port.openOpt.baudRate = e.baudRate);
		}
		async set(e) {
			if (typeof e != "object") throw TypeError("\"options\" is not an object");
			if (r(this.serialNumber, "set"), !this.isOpen) throw Error("Port is not open");
			await o();
		}
		async get() {
			if (r(this.serialNumber, "get"), !this.isOpen) throw Error("Port is not open");
			return await o(), {
				cts: !0,
				dsr: !1,
				dcd: !1
			};
		}
		async getBaudRate() {
			if (r(this.serialNumber, "getBaudRate"), !this.isOpen || !this.port) throw Error("Port is not open");
			if (await o(), !this.port.openOpt?.baudRate) throw Error("Internal Error");
			return { baudRate: this.port.openOpt.baudRate };
		}
		async flush() {
			if (r(this.serialNumber, "flush"), !this.isOpen || !this.port) throw Error("Port is not open");
			await o(), this.port.data = Buffer.alloc(0);
		}
		async drain() {
			if (r(this.serialNumber, "drain"), !this.isOpen) throw Error("Port is not open");
			await this.writeOperation, await o();
		}
	};
	e.CanceledError = s, e.MockBinding = c, e.MockPortBinding = l;
})), me = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SerialPortMock = void 0;
	var t = L(), n = pe();
	e.SerialPortMock = class extends t.SerialPortStream {
		static list = n.MockBinding.list;
		static binding = n.MockBinding;
		constructor(e, t) {
			let r = {
				binding: n.MockBinding,
				...e
			};
			super(r, t);
		}
	};
})), he = /* @__PURE__ */ p(((e, t) => {
	function n(e) {
		n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = s, n.humanize = k(), n.destroy = l, Object.keys(e).forEach((t) => {
			n[t] = e[t];
		}), n.names = [], n.skips = [], n.formatters = {};
		function t(e) {
			let t = 0;
			for (let n = 0; n < e.length; n++) t = (t << 5) - t + e.charCodeAt(n), t |= 0;
			return n.colors[Math.abs(t) % n.colors.length];
		}
		n.selectColor = t;
		function n(e) {
			let t, i = null, a, o;
			function s(...e) {
				if (!s.enabled) return;
				let r = s, i = Number(/* @__PURE__ */ new Date());
				r.diff = i - (t || i), r.prev = t, r.curr = i, t = i, e[0] = n.coerce(e[0]), typeof e[0] != "string" && e.unshift("%O");
				let a = 0;
				e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, i) => {
					if (t === "%%") return "%";
					a++;
					let o = n.formatters[i];
					if (typeof o == "function") {
						let n = e[a];
						t = o.call(r, n), e.splice(a, 1), a--;
					}
					return t;
				}), n.formatArgs.call(r, e), (r.log || n.log).apply(r, e);
			}
			return s.namespace = e, s.useColors = n.useColors(), s.color = n.selectColor(e), s.extend = r, s.destroy = n.destroy, Object.defineProperty(s, "enabled", {
				enumerable: !0,
				configurable: !1,
				get: () => i === null ? (a !== n.namespaces && (a = n.namespaces, o = n.enabled(e)), o) : i,
				set: (e) => {
					i = e;
				}
			}), typeof n.init == "function" && n.init(s), s;
		}
		function r(e, t) {
			let r = n(this.namespace + (t === void 0 ? ":" : t) + e);
			return r.log = this.log, r;
		}
		function i(e) {
			n.save(e), n.namespaces = e, n.names = [], n.skips = [];
			let t = (typeof e == "string" ? e : "").trim().replace(" ", ",").split(",").filter(Boolean);
			for (let e of t) e[0] === "-" ? n.skips.push(e.slice(1)) : n.names.push(e);
		}
		function a(e, t) {
			let n = 0, r = 0, i = -1, a = 0;
			for (; n < e.length;) if (r < t.length && (t[r] === e[n] || t[r] === "*")) t[r] === "*" ? (i = r, a = n, r++) : (n++, r++);
			else if (i !== -1) r = i + 1, a++, n = a;
			else return !1;
			for (; r < t.length && t[r] === "*";) r++;
			return r === t.length;
		}
		function o() {
			let e = [...n.names, ...n.skips.map((e) => "-" + e)].join(",");
			return n.enable(""), e;
		}
		function s(e) {
			for (let t of n.skips) if (a(e, t)) return !1;
			for (let t of n.names) if (a(e, t)) return !0;
			return !1;
		}
		function c(e) {
			return e instanceof Error ? e.stack || e.message : e;
		}
		function l() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		return n.enable(n.load()), n;
	}
	t.exports = n;
})), ge = /* @__PURE__ */ p(((e, t) => {
	e.formatArgs = r, e.save = i, e.load = a, e.useColors = n, e.storage = o(), e.destroy = (() => {
		let e = !1;
		return () => {
			e || (e = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
		};
	})(), e.colors = /* @__PURE__ */ "#0000CC.#0000FF.#0033CC.#0033FF.#0066CC.#0066FF.#0099CC.#0099FF.#00CC00.#00CC33.#00CC66.#00CC99.#00CCCC.#00CCFF.#3300CC.#3300FF.#3333CC.#3333FF.#3366CC.#3366FF.#3399CC.#3399FF.#33CC00.#33CC33.#33CC66.#33CC99.#33CCCC.#33CCFF.#6600CC.#6600FF.#6633CC.#6633FF.#66CC00.#66CC33.#9900CC.#9900FF.#9933CC.#9933FF.#99CC00.#99CC33.#CC0000.#CC0033.#CC0066.#CC0099.#CC00CC.#CC00FF.#CC3300.#CC3333.#CC3366.#CC3399.#CC33CC.#CC33FF.#CC6600.#CC6633.#CC9900.#CC9933.#CCCC00.#CCCC33.#FF0000.#FF0033.#FF0066.#FF0099.#FF00CC.#FF00FF.#FF3300.#FF3333.#FF3366.#FF3399.#FF33CC.#FF33FF.#FF6600.#FF6633.#FF9900.#FF9933.#FFCC00.#FFCC33".split(".");
	function n() {
		if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return !0;
		if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return !1;
		let e;
		return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator < "u" && navigator.userAgent && (e = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(e[1], 10) >= 31 || typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	function r(e) {
		if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors) return;
		let n = "color: " + this.color;
		e.splice(1, 0, n, "color: inherit");
		let r = 0, i = 0;
		e[0].replace(/%[a-zA-Z%]/g, (e) => {
			e !== "%%" && (r++, e === "%c" && (i = r));
		}), e.splice(i, 0, n);
	}
	e.log = console.debug || console.log || (() => {});
	function i(t) {
		try {
			t ? e.storage.setItem("debug", t) : e.storage.removeItem("debug");
		} catch {}
	}
	function a() {
		let t;
		try {
			t = e.storage.getItem("debug");
		} catch {}
		return !t && typeof process < "u" && "env" in process && (t = process.env.DEBUG), t;
	}
	function o() {
		try {
			return localStorage;
		} catch {}
	}
	t.exports = he()(e);
	var { formatters: s } = t.exports;
	s.j = function(e) {
		try {
			return JSON.stringify(e);
		} catch (e) {
			return "[UnexpectedJSONParseError]: " + e.message;
		}
	};
})), _e = /* @__PURE__ */ p(((e, t) => {
	var n = _("tty"), r = _("util");
	e.init = u, e.log = s, e.formatArgs = a, e.save = c, e.load = l, e.useColors = i, e.destroy = r.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."), e.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		let t = (I(), g(A));
		t && (t.stderr || t).level >= 2 && (e.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		]);
	} catch {}
	e.inspectOpts = Object.keys(process.env).filter((e) => /^debug_/i.test(e)).reduce((e, t) => {
		let n = t.substring(6).toLowerCase().replace(/_([a-z])/g, (e, t) => t.toUpperCase()), r = process.env[t];
		return r = /^(yes|on|true|enabled)$/i.test(r) ? !0 : /^(no|off|false|disabled)$/i.test(r) ? !1 : r === "null" ? null : Number(r), e[n] = r, e;
	}, {});
	function i() {
		return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : n.isatty(process.stderr.fd);
	}
	function a(e) {
		let { namespace: n, useColors: r } = this;
		if (r) {
			let r = this.color, i = "\x1B[3" + (r < 8 ? r : "8;5;" + r), a = `  ${i};1m${n} \u001B[0m`;
			e[0] = a + e[0].split("\n").join("\n" + a), e.push(i + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
		} else e[0] = o() + n + " " + e[0];
	}
	function o() {
		return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	function s(...t) {
		return process.stderr.write(r.formatWithOptions(e.inspectOpts, ...t) + "\n");
	}
	function c(e) {
		e ? process.env.DEBUG = e : delete process.env.DEBUG;
	}
	function l() {
		return process.env.DEBUG;
	}
	function u(t) {
		t.inspectOpts = {};
		let n = Object.keys(e.inspectOpts);
		for (let r = 0; r < n.length; r++) t.inspectOpts[n[r]] = e.inspectOpts[n[r]];
	}
	t.exports = he()(e);
	var { formatters: d } = t.exports;
	d.o = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts).split("\n").map((e) => e.trim()).join(" ");
	}, d.O = function(e) {
		return this.inspectOpts.colors = this.useColors, r.inspect(e, this.inspectOpts);
	};
})), R = /* @__PURE__ */ p(((e, t) => {
	typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? t.exports = ge() : t.exports = _e();
})), ve = /* @__PURE__ */ p(((e, t) => {
	var n = _("fs"), r = _("path"), i = _("os"), a = typeof __webpack_require__ == "function" ? __non_webpack_require__ : _, o = process.config && process.config.variables || {}, s = !!process.env.PREBUILDS_ONLY, c = process.versions.modules, l = D() ? "electron" : ee() ? "node-webkit" : "node", u = process.env.npm_config_arch || i.arch(), d = process.env.npm_config_platform || i.platform(), f = process.env.LIBC || (O(d) ? "musl" : "glibc"), p = process.env.ARM_VERSION || (u === "arm64" ? "8" : o.arm_version) || "", m = (process.versions.uv || "").split(".")[0];
	t.exports = h;
	function h(e) {
		return a(h.resolve(e));
	}
	h.resolve = h.path = function(e) {
		e = r.resolve(e || ".");
		try {
			var t = a(r.join(e, "package.json")).name.toUpperCase().replace(/-/g, "_");
			process.env[t + "_PREBUILD"] && (e = process.env[t + "_PREBUILD"]);
		} catch {}
		if (!s) {
			var n = v(r.join(e, "build/Release"), y);
			if (n) return n;
			var i = v(r.join(e, "build/Debug"), y);
			if (i) return i;
		}
		var o = T(e);
		if (o) return o;
		var h = T(r.dirname(process.execPath));
		if (h) return h;
		var _ = [
			"platform=" + d,
			"arch=" + u,
			"runtime=" + l,
			"abi=" + c,
			"uv=" + m,
			p ? "armv=" + p : "",
			"libc=" + f,
			"node=" + process.versions.node,
			process.versions.electron ? "electron=" + process.versions.electron : "",
			typeof __webpack_require__ == "function" ? "webpack=true" : ""
		].filter(Boolean).join(" ");
		throw Error("No native build was found for " + _ + "\n    loaded from: " + e + "\n");
		function T(e) {
			var t = g(r.join(e, "prebuilds")).map(b).filter(x(d, u)).sort(S)[0];
			if (t) {
				var n = r.join(e, "prebuilds", t.name), i = g(n).map(C).filter(w(l, c)).sort(E(l))[0];
				if (i) return r.join(n, i.file);
			}
		}
	};
	function g(e) {
		try {
			return n.readdirSync(e);
		} catch {
			return [];
		}
	}
	function v(e, t) {
		var n = g(e).filter(t);
		return n[0] && r.join(e, n[0]);
	}
	function y(e) {
		return /\.node$/.test(e);
	}
	function b(e) {
		var t = e.split("-");
		if (t.length === 2) {
			var n = t[0], r = t[1].split("+");
			if (n && r.length && r.every(Boolean)) return {
				name: e,
				platform: n,
				architectures: r
			};
		}
	}
	function x(e, t) {
		return function(n) {
			return n == null || n.platform !== e ? !1 : n.architectures.includes(t);
		};
	}
	function S(e, t) {
		return e.architectures.length - t.architectures.length;
	}
	function C(e) {
		var t = e.split("."), n = t.pop(), r = {
			file: e,
			specificity: 0
		};
		if (n === "node") {
			for (var i = 0; i < t.length; i++) {
				var a = t[i];
				if (a === "node" || a === "electron" || a === "node-webkit") r.runtime = a;
				else if (a === "napi") r.napi = !0;
				else if (a.slice(0, 3) === "abi") r.abi = a.slice(3);
				else if (a.slice(0, 2) === "uv") r.uv = a.slice(2);
				else if (a.slice(0, 4) === "armv") r.armv = a.slice(4);
				else if (a === "glibc" || a === "musl") r.libc = a;
				else continue;
				r.specificity++;
			}
			return r;
		}
	}
	function w(e, t) {
		return function(n) {
			return !(n == null || n.runtime && n.runtime !== e && !T(n) || n.abi && n.abi !== t && !n.napi || n.uv && n.uv !== m || n.armv && n.armv !== p || n.libc && n.libc !== f);
		};
	}
	function T(e) {
		return e.runtime === "node" && e.napi;
	}
	function E(e) {
		return function(t, n) {
			return t.runtime === n.runtime ? t.abi === n.abi ? t.specificity === n.specificity ? 0 : t.specificity > n.specificity ? -1 : 1 : t.abi ? -1 : 1 : t.runtime === e ? -1 : 1;
		};
	}
	function ee() {
		return !!(process.versions && process.versions.nw);
	}
	function D() {
		return process.versions && process.versions.electron || process.env.ELECTRON_RUN_AS_NODE ? !0 : typeof window < "u" && window.process && window.process.type === "renderer";
	}
	function O(e) {
		return e === "linux" && n.existsSync("/etc/alpine-release");
	}
	h.parseTags = C, h.matchTags = w, h.compareTags = E, h.parseTuple = b, h.matchTuple = x, h.compareTuples = S;
})), ye = /* @__PURE__ */ p(((e, t) => {
	var n = typeof __webpack_require__ == "function" ? __non_webpack_require__ : _;
	typeof n.addon == "function" ? t.exports = n.addon.bind(n) : t.exports = ve();
})), be = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.binding = void 0;
	var n = _("path");
	e.binding = (0, t(ye()).default)((0, n.join)(__dirname, "../"));
})), z = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.asyncWrite = e.asyncRead = e.asyncUpdate = e.asyncSet = e.asyncOpen = e.asyncList = e.asyncGetBaudRate = e.asyncGet = e.asyncFlush = e.asyncDrain = e.asyncClose = void 0;
	var t = _("util"), n = be();
	e.asyncClose = n.binding.close ? (0, t.promisify)(n.binding.close) : async () => {
		throw Error("\"binding.close\" Method not implemented");
	}, e.asyncDrain = n.binding.drain ? (0, t.promisify)(n.binding.drain) : async () => {
		throw Error("\"binding.drain\" Method not implemented");
	}, e.asyncFlush = n.binding.flush ? (0, t.promisify)(n.binding.flush) : async () => {
		throw Error("\"binding.flush\" Method not implemented");
	}, e.asyncGet = n.binding.get ? (0, t.promisify)(n.binding.get) : async () => {
		throw Error("\"binding.get\" Method not implemented");
	}, e.asyncGetBaudRate = n.binding.getBaudRate ? (0, t.promisify)(n.binding.getBaudRate) : async () => {
		throw Error("\"binding.getBaudRate\" Method not implemented");
	}, e.asyncList = n.binding.list ? (0, t.promisify)(n.binding.list) : async () => {
		throw Error("\"binding.list\" Method not implemented");
	}, e.asyncOpen = n.binding.open ? (0, t.promisify)(n.binding.open) : async () => {
		throw Error("\"binding.open\" Method not implemented");
	}, e.asyncSet = n.binding.set ? (0, t.promisify)(n.binding.set) : async () => {
		throw Error("\"binding.set\" Method not implemented");
	}, e.asyncUpdate = n.binding.update ? (0, t.promisify)(n.binding.update) : async () => {
		throw Error("\"binding.update\" Method not implemented");
	}, e.asyncRead = n.binding.read ? (0, t.promisify)(n.binding.read) : async () => {
		throw Error("\"binding.read\" Method not implemented");
	}, e.asyncWrite = n.binding.write ? (0, t.promisify)(n.binding.write) : async () => {
		throw Error("\"binding.write\" Method not implemented");
	};
})), B = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.BindingsError = void 0, e.BindingsError = class extends Error {
		constructor(e, { canceled: t = !1 } = {}) {
			super(e), this.canceled = t;
		}
	};
})), V = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Poller = e.EVENTS = void 0;
	var n = t(R()), r = _("events"), i = B(), { Poller: a } = be().binding, o = (0, n.default)("serialport/bindings-cpp/poller");
	e.EVENTS = {
		UV_READABLE: 1,
		UV_WRITABLE: 2,
		UV_DISCONNECT: 4
	};
	function s(t, n) {
		if (t) {
			o("error", t), this.emit("readable", t), this.emit("writable", t), this.emit("disconnect", t);
			return;
		}
		n & e.EVENTS.UV_READABLE && (o("received \"readable\""), this.emit("readable", null)), n & e.EVENTS.UV_WRITABLE && (o("received \"writable\""), this.emit("writable", null)), n & e.EVENTS.UV_DISCONNECT && (o("received \"disconnect\""), this.emit("disconnect", null));
	}
	e.Poller = class extends r.EventEmitter {
		constructor(e, t = a) {
			o("Creating poller"), super(), this.poller = new t(e, s.bind(this));
		}
		once(t, n) {
			switch (t) {
				case "readable":
					this.poll(e.EVENTS.UV_READABLE);
					break;
				case "writable":
					this.poll(e.EVENTS.UV_WRITABLE);
					break;
				case "disconnect":
					this.poll(e.EVENTS.UV_DISCONNECT);
					break;
			}
			return super.once(t, n);
		}
		poll(t = 0) {
			t & e.EVENTS.UV_READABLE && o("Polling for \"readable\""), t & e.EVENTS.UV_WRITABLE && o("Polling for \"writable\""), t & e.EVENTS.UV_DISCONNECT && o("Polling for \"disconnect\""), this.poller.poll(t);
		}
		stop() {
			o("Stopping poller"), this.poller.stop(), this.emitCanceled();
		}
		destroy() {
			o("Destroying poller"), this.poller.destroy(), this.emitCanceled();
		}
		emitCanceled() {
			let e = new i.BindingsError("Canceled", { canceled: !0 });
			this.emit("readable", e), this.emit("writable", e), this.emit("disconnect", e);
		}
	};
})), H = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.unixRead = void 0;
	var n = _("util"), r = _("fs"), i = B(), a = (0, t(R()).default)("serialport/bindings-cpp/unixRead"), o = (0, n.promisify)(r.read), s = (e) => new Promise((t, n) => {
		if (!e.poller) throw Error("No poller on bindings");
		e.poller.once("readable", (e) => e ? n(e) : t());
	});
	e.unixRead = async ({ binding: t, buffer: n, offset: r, length: c, fsReadAsync: l = o }) => {
		if (a("Starting read"), !t.isOpen || !t.fd) throw new i.BindingsError("Port is not open", { canceled: !0 });
		try {
			let { bytesRead: i } = await l(t.fd, n, r, c, null);
			return i === 0 ? (0, e.unixRead)({
				binding: t,
				buffer: n,
				offset: r,
				length: c,
				fsReadAsync: l
			}) : (a("Finished read", i, "bytes"), {
				bytesRead: i,
				buffer: n
			});
		} catch (o) {
			if (a("read error", o), o.code === "EAGAIN" || o.code === "EWOULDBLOCK" || o.code === "EINTR") {
				if (!t.isOpen) throw new i.BindingsError("Port is not open", { canceled: !0 });
				return a("waiting for readable because of code:", o.code), await s(t), (0, e.unixRead)({
					binding: t,
					buffer: n,
					offset: r,
					length: c,
					fsReadAsync: l
				});
			}
			throw (o.code === "EBADF" || o.code === "ENXIO" || o.code === "UNKNOWN" || o.errno === -1) && (o.disconnect = !0, a("disconnecting", o)), o;
		}
	};
})), U = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.unixWrite = void 0;
	var n = _("fs"), r = t(R()), i = _("util"), a = (0, r.default)("serialport/bindings-cpp/unixWrite"), o = (0, i.promisify)(n.write), s = (e) => new Promise((t, n) => {
		e.poller.once("writable", (e) => e ? n(e) : t());
	});
	e.unixWrite = async ({ binding: t, buffer: n, offset: r = 0, fsWriteAsync: i = o }) => {
		let c = n.length - r;
		if (a("Starting write", n.length, "bytes offset", r, "bytesToWrite", c), !t.isOpen || !t.fd) throw Error("Port is not open");
		try {
			let { bytesWritten: o } = await i(t.fd, n, r, c);
			if (a("write returned: wrote", o, "bytes"), o + r < n.length) {
				if (!t.isOpen) throw Error("Port is not open");
				return (0, e.unixWrite)({
					binding: t,
					buffer: n,
					offset: o + r,
					fsWriteAsync: i
				});
			}
			a("Finished writing", o + r, "bytes");
		} catch (o) {
			if (a("write errored", o), o.code === "EAGAIN" || o.code === "EWOULDBLOCK" || o.code === "EINTR") {
				if (!t.isOpen) throw Error("Port is not open");
				return a("waiting for writable because of code:", o.code), await s(t), (0, e.unixWrite)({
					binding: t,
					buffer: n,
					offset: r,
					fsWriteAsync: i
				});
			}
			throw (o.code === "EBADF" || o.code === "ENXIO" || o.code === "UNKNOWN" || o.errno === -1) && (o.disconnect = !0, a("disconnecting", o)), a("error", o), o;
		}
	};
})), W = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.DarwinPortBinding = e.DarwinBinding = void 0;
	var n = t(R()), r = z(), i = V(), a = H(), o = U(), s = (0, n.default)("serialport/bindings-cpp");
	e.DarwinBinding = {
		list() {
			return s("list"), (0, r.asyncList)();
		},
		async open(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (!e.path) throw TypeError("\"path\" is not a valid port");
			if (!e.baudRate) throw TypeError("\"baudRate\" is not a valid baudRate");
			s("open");
			let t = Object.assign({
				vmin: 1,
				vtime: 0,
				dataBits: 8,
				lock: !0,
				stopBits: 1,
				parity: "none",
				rtscts: !1,
				xon: !1,
				xoff: !1,
				xany: !1,
				hupcl: !0
			}, e);
			return new c(await (0, r.asyncOpen)(t.path, t), t);
		}
	};
	var c = class {
		constructor(e, t) {
			this.fd = e, this.openOptions = t, this.poller = new i.Poller(e), this.writeOperation = null;
		}
		get isOpen() {
			return this.fd !== null;
		}
		async close() {
			if (s("close"), !this.isOpen) throw Error("Port is not open");
			let e = this.fd;
			this.poller.stop(), this.poller.destroy(), this.fd = null, await (0, r.asyncClose)(e);
		}
		async read(e, t, n) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (typeof t != "number" || isNaN(t)) throw TypeError(`"offset" is not an integer got "${isNaN(t) ? "NaN" : typeof t}"`);
			if (typeof n != "number" || isNaN(n)) throw TypeError(`"length" is not an integer got "${isNaN(n) ? "NaN" : typeof n}"`);
			if (s("read"), e.length < t + n) throw Error("buffer is too small");
			if (!this.isOpen) throw Error("Port is not open");
			return (0, a.unixRead)({
				binding: this,
				buffer: e,
				offset: t,
				length: n
			});
		}
		async write(e) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (s("write", e.length, "bytes"), !this.isOpen) throw s("write", "error port is not open"), Error("Port is not open");
			return this.writeOperation = (async () => {
				e.length !== 0 && (await (0, o.unixWrite)({
					binding: this,
					buffer: e
				}), this.writeOperation = null);
			})(), this.writeOperation;
		}
		async update(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (typeof e.baudRate != "number") throw TypeError("\"options.baudRate\" is not a number");
			if (s("update"), !this.isOpen) throw Error("Port is not open");
			await (0, r.asyncUpdate)(this.fd, e);
		}
		async set(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (s("set", e), !this.isOpen) throw Error("Port is not open");
			await (0, r.asyncSet)(this.fd, e);
		}
		async get() {
			if (s("get"), !this.isOpen) throw Error("Port is not open");
			return (0, r.asyncGet)(this.fd);
		}
		async getBaudRate() {
			throw s("getBaudRate"), this.isOpen ? Error("getBaudRate is not implemented on darwin") : Error("Port is not open");
		}
		async flush() {
			if (s("flush"), !this.isOpen) throw Error("Port is not open");
			await (0, r.asyncFlush)(this.fd);
		}
		async drain() {
			if (s("drain"), !this.isOpen) throw Error("Port is not open");
			await this.writeOperation, await (0, r.asyncDrain)(this.fd);
		}
	};
	e.DarwinPortBinding = c;
})), xe = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.DelimiterParser = void 0;
	var t = _("stream");
	e.DelimiterParser = class extends t.Transform {
		includeDelimiter;
		delimiter;
		buffer;
		constructor({ delimiter: e, includeDelimiter: t = !1, ...n }) {
			if (super(n), e === void 0) throw TypeError("\"delimiter\" is not a bufferable object");
			if (e.length === 0) throw TypeError("\"delimiter\" has a 0 or undefined length");
			this.includeDelimiter = t, this.delimiter = Buffer.from(e), this.buffer = Buffer.alloc(0);
		}
		_transform(e, t, n) {
			let r = Buffer.concat([this.buffer, e]), i;
			for (; (i = r.indexOf(this.delimiter)) !== -1;) this.push(r.slice(0, i + (this.includeDelimiter ? this.delimiter.length : 0))), r = r.slice(i + this.delimiter.length);
			this.buffer = r, n();
		}
		_flush(e) {
			this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
		}
	};
})), Se = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ReadlineParser = void 0;
	var t = xe();
	e.ReadlineParser = class extends t.DelimiterParser {
		constructor(e) {
			let t = {
				delimiter: Buffer.from("\n", "utf8"),
				encoding: "utf8",
				...e
			};
			typeof t.delimiter == "string" && (t.delimiter = Buffer.from(t.delimiter, t.encoding)), super(t);
		}
	};
})), Ce = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.linuxList = s;
	var t = _("child_process"), n = Se();
	function r(e) {
		return /(tty(S|WCH|ACM|USB|AMA|MFD|O|XRUSB)|rfcomm)/.test(e) && e;
	}
	function i(e) {
		return {
			DEVNAME: "path",
			ID_VENDOR_ENC: "manufacturer",
			ID_SERIAL_SHORT: "serialNumber",
			ID_VENDOR_ID: "vendorId",
			ID_MODEL_ID: "productId",
			DEVLINKS: "pnpId",
			ID_USB_VENDOR_ENC: "manufacturer",
			ID_USB_SERIAL_SHORT: "serialNumber",
			ID_USB_VENDOR_ID: "vendorId",
			ID_USB_MODEL_ID: "productId"
		}[e.toUpperCase()];
	}
	function a(e) {
		return e.replace(/\\x([a-fA-F0-9]{2})/g, (e, t) => String.fromCharCode(parseInt(t, 16)));
	}
	function o(e, t) {
		return e === "pnpId" ? t.match(/\/by-id\/([^\s]+)/)?.[1] || void 0 : e === "manufacturer" ? a(t) : /^0x/.test(t) ? t.substr(2) : t;
	}
	function s(e = t.spawn) {
		let a = [], s = e("udevadm", ["info", "-e"]), c = s.stdout.pipe(new n.ReadlineParser()), l = !1, u = {
			path: "",
			manufacturer: void 0,
			serialNumber: void 0,
			pnpId: void 0,
			locationId: void 0,
			vendorId: void 0,
			productId: void 0
		};
		return c.on("data", (e) => {
			let t = e.slice(0, 1), n = e.slice(3);
			if (t === "P") {
				u = {
					path: "",
					manufacturer: void 0,
					serialNumber: void 0,
					pnpId: void 0,
					locationId: void 0,
					vendorId: void 0,
					productId: void 0
				}, l = !1;
				return;
			}
			if (!l) {
				if (t === "N") {
					r(n) ? a.push(u) : l = !0;
					return;
				}
				if (t === "E") {
					let e = n.match(/^(.+)=(.*)/);
					if (!e) return;
					let t = i(e[1]);
					if (!t) return;
					u[t] = o(t, e[2]);
				}
			}
		}), new Promise((e, t) => {
			s.on("close", (e) => {
				e && t(/* @__PURE__ */ Error(`Error listing ports udevadm exited with error code: ${e}`));
			}), s.on("error", t), c.on("error", t), c.on("finish", () => e(a));
		});
	}
})), G = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.LinuxPortBinding = e.LinuxBinding = void 0;
	var n = t(R()), r = Ce(), i = V(), a = H(), o = U(), s = z(), c = (0, n.default)("serialport/bindings-cpp");
	e.LinuxBinding = {
		list() {
			return c("list"), (0, r.linuxList)();
		},
		async open(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (!e.path) throw TypeError("\"path\" is not a valid port");
			if (!e.baudRate) throw TypeError("\"baudRate\" is not a valid baudRate");
			c("open");
			let t = Object.assign({
				vmin: 1,
				vtime: 0,
				dataBits: 8,
				lock: !0,
				stopBits: 1,
				parity: "none",
				rtscts: !1,
				xon: !1,
				xoff: !1,
				xany: !1,
				hupcl: !0
			}, e), n = await (0, s.asyncOpen)(t.path, t);
			return this.fd = n, new l(n, t);
		}
	};
	var l = class {
		constructor(e, t) {
			this.fd = e, this.openOptions = t, this.poller = new i.Poller(e), this.writeOperation = null;
		}
		get isOpen() {
			return this.fd !== null;
		}
		async close() {
			if (c("close"), !this.isOpen) throw Error("Port is not open");
			let e = this.fd;
			this.poller.stop(), this.poller.destroy(), this.fd = null, await (0, s.asyncClose)(e);
		}
		async read(e, t, n) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (typeof t != "number" || isNaN(t)) throw TypeError(`"offset" is not an integer got "${isNaN(t) ? "NaN" : typeof t}"`);
			if (typeof n != "number" || isNaN(n)) throw TypeError(`"length" is not an integer got "${isNaN(n) ? "NaN" : typeof n}"`);
			if (c("read"), e.length < t + n) throw Error("buffer is too small");
			if (!this.isOpen) throw Error("Port is not open");
			return (0, a.unixRead)({
				binding: this,
				buffer: e,
				offset: t,
				length: n
			});
		}
		async write(e) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (c("write", e.length, "bytes"), !this.isOpen) throw c("write", "error port is not open"), Error("Port is not open");
			return this.writeOperation = (async () => {
				e.length !== 0 && (await (0, o.unixWrite)({
					binding: this,
					buffer: e
				}), this.writeOperation = null);
			})(), this.writeOperation;
		}
		async update(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (typeof e.baudRate != "number") throw TypeError("\"options.baudRate\" is not a number");
			if (c("update"), !this.isOpen) throw Error("Port is not open");
			await (0, s.asyncUpdate)(this.fd, e);
		}
		async set(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (c("set"), !this.isOpen) throw Error("Port is not open");
			await (0, s.asyncSet)(this.fd, e);
		}
		async get() {
			if (c("get"), !this.isOpen) throw Error("Port is not open");
			return (0, s.asyncGet)(this.fd);
		}
		async getBaudRate() {
			if (c("getBaudRate"), !this.isOpen) throw Error("Port is not open");
			return (0, s.asyncGetBaudRate)(this.fd);
		}
		async flush() {
			if (c("flush"), !this.isOpen) throw Error("Port is not open");
			await (0, s.asyncFlush)(this.fd);
		}
		async drain() {
			if (c("drain"), !this.isOpen) throw Error("Port is not open");
			await this.writeOperation, await (0, s.asyncDrain)(this.fd);
		}
	};
	e.LinuxPortBinding = l;
})), we = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.serialNumParser = void 0;
	var t = [/USB\\(?:.+)\\(.+)/, /FTDIBUS\\(?:.+)\+(.+?)A?\\.+/];
	e.serialNumParser = (e) => {
		if (!e) return null;
		for (let n of t) {
			let t = e.match(n);
			if (t) return t[1];
		}
		return null;
	};
})), K = /* @__PURE__ */ p(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WindowsPortBinding = e.WindowsBinding = void 0;
	var n = t(R()), r = q(), i = z(), a = we(), o = (0, n.default)("serialport/bindings-cpp");
	e.WindowsBinding = {
		async list() {
			return (await (0, i.asyncList)()).map((e) => {
				if (e.pnpId && !e.serialNumber) {
					let t = (0, a.serialNumParser)(e.pnpId);
					if (t) return Object.assign(Object.assign({}, e), { serialNumber: t });
				}
				return e;
			});
		},
		async open(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (!e.path) throw TypeError("\"path\" is not a valid port");
			if (!e.baudRate) throw TypeError("\"baudRate\" is not a valid baudRate");
			o("open");
			let t = Object.assign({
				dataBits: 8,
				lock: !0,
				stopBits: 1,
				parity: "none",
				rtscts: !1,
				rtsMode: "handshake",
				xon: !1,
				xoff: !1,
				xany: !1,
				hupcl: !0
			}, e);
			return new s(await (0, i.asyncOpen)(t.path, t), t);
		}
	};
	var s = class {
		constructor(e, t) {
			this.fd = e, this.openOptions = t, this.writeOperation = null;
		}
		get isOpen() {
			return this.fd !== null;
		}
		async close() {
			if (o("close"), !this.isOpen) throw Error("Port is not open");
			let e = this.fd;
			this.fd = null, await (0, i.asyncClose)(e);
		}
		async read(e, t, n) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (typeof t != "number" || isNaN(t)) throw TypeError(`"offset" is not an integer got "${isNaN(t) ? "NaN" : typeof t}"`);
			if (typeof n != "number" || isNaN(n)) throw TypeError(`"length" is not an integer got "${isNaN(n) ? "NaN" : typeof n}"`);
			if (o("read"), e.length < t + n) throw Error("buffer is too small");
			if (!this.isOpen) throw Error("Port is not open");
			try {
				return {
					bytesRead: await (0, i.asyncRead)(this.fd, e, t, n),
					buffer: e
				};
			} catch (e) {
				throw this.isOpen ? e : new r.BindingsError(e.message, { canceled: !0 });
			}
		}
		async write(e) {
			if (!Buffer.isBuffer(e)) throw TypeError("\"buffer\" is not a Buffer");
			if (o("write", e.length, "bytes"), !this.isOpen) throw o("write", "error port is not open"), Error("Port is not open");
			return this.writeOperation = (async () => {
				e.length !== 0 && (await (0, i.asyncWrite)(this.fd, e), this.writeOperation = null);
			})(), this.writeOperation;
		}
		async update(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (typeof e.baudRate != "number") throw TypeError("\"options.baudRate\" is not a number");
			if (o("update"), !this.isOpen) throw Error("Port is not open");
			await (0, i.asyncUpdate)(this.fd, e);
		}
		async set(e) {
			if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("\"options\" is not an object");
			if (o("set", e), !this.isOpen) throw Error("Port is not open");
			await (0, i.asyncSet)(this.fd, e);
		}
		async get() {
			if (o("get"), !this.isOpen) throw Error("Port is not open");
			return (0, i.asyncGet)(this.fd);
		}
		async getBaudRate() {
			if (o("getBaudRate"), !this.isOpen) throw Error("Port is not open");
			return (0, i.asyncGetBaudRate)(this.fd);
		}
		async flush() {
			if (o("flush"), !this.isOpen) throw Error("Port is not open");
			await (0, i.asyncFlush)(this.fd);
		}
		async drain() {
			if (o("drain"), !this.isOpen) throw Error("Port is not open");
			await this.writeOperation, await (0, i.asyncDrain)(this.fd);
		}
	};
	e.WindowsPortBinding = s;
})), Te = /* @__PURE__ */ p((() => {})), q = /* @__PURE__ */ p(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__exportStar || function(e, n) {
		for (var r in e) r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
	}, r = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.autoDetect = l;
	var i = r(R()), a = W(), o = G(), s = K(), c = (0, i.default)("serialport/bindings-cpp");
	n(Te(), e), n(W(), e), n(G(), e), n(K(), e), n(B(), e);
	function l() {
		switch (process.platform) {
			case "win32": return c("loading WindowsBinding"), s.WindowsBinding;
			case "darwin": return c("loading DarwinBinding"), a.DarwinBinding;
			default: return c("loading LinuxBinding"), o.LinuxBinding;
		}
	}
})), Ee = /* @__PURE__ */ p(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SerialPort = void 0;
	var t = L(), n = (0, q().autoDetect)();
	e.SerialPort = class extends t.SerialPortStream {
		static list = n.list;
		static binding = n;
		constructor(e, t) {
			let r = {
				binding: n,
				...e
			};
			super(r, t);
		}
	};
})), De = (/* @__PURE__ */ p(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__exportStar || function(e, n) {
		for (var r in e) r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), n(v(), e), n(y(), e), n(b(), e), n(x(), e), n(S(), e), n(C(), e), n(w(), e), n(T(), e), n(D(), e), n(te(), e), n(me(), e), n(Ee(), e);
})))(), J = "/dev/cu.PT-210_ECC5", Oe = 9600, Y = "\x1B", X = {
	INIT: `${Y}\x40`,
	BOLD_ON: `${Y}\x45\x01`,
	BOLD_OFF: `${Y}\x45\x00`,
	ALIGN_CENTER: `${Y}\x61\x01`,
	ALIGN_LEFT: `${Y}\x61\x00`,
	DOUBLE_HEIGHT_ON: `${Y}\x21\x10`,
	DOUBLE_HEIGHT_OFF: `${Y}\x21\x00`,
	CUT: "V\0",
	FEED: (e) => `${Y}\x64${String.fromCharCode(e)}`
}, Z = null;
async function Q(e) {
	try {
		let t = e || J;
		return Z?.isOpen && await ke(), Z = new De.SerialPort({
			path: t,
			baudRate: Oe,
			autoOpen: !1
		}), await new Promise((e, t) => {
			Z.open((n) => {
				n ? t(n) : e();
			});
		}), {
			ok: !0,
			path: t
		};
	} catch (e) {
		return {
			ok: !1,
			error: e instanceof Error ? e.message : "Failed to connect printer"
		};
	}
}
async function ke() {
	Z?.isOpen && await new Promise((e) => Z.close(() => e())), Z = null;
}
function Ae() {
	return {
		connected: Z?.isOpen ?? !1,
		path: Z?.path ?? null
	};
}
async function je() {
	let e = await Q(J);
	e.ok ? console.log("🖨️  Printer ready on", e.path) : console.error("❌ Printer initialisation failed:", e.error);
}
function Me(e, t, n = 32) {
	let r = Math.max(n - e.length - t.length, 1);
	return e + " ".repeat(r) + t;
}
function Ne(e) {
	return `P${e.toFixed(2)}`;
}
function Pe(e, t) {
	let n = [];
	n.push(X.INIT), n.push(X.ALIGN_CENTER), n.push(X.BOLD_ON, X.DOUBLE_HEIGHT_ON), n.push("TAPSILOGAN\n"), n.push(X.DOUBLE_HEIGHT_OFF, X.BOLD_OFF), n.push(`${t}\n`), n.push(X.ALIGN_LEFT), n.push("--------------------------------\n"), n.push(`Order #${e.order_number}\n`), n.push(`${new Date(e.created_at).toLocaleString("en-PH")}\n`), n.push("--------------------------------\n");
	for (let t of e.order_items ?? []) {
		let e = `${t.item_name} x${t.quantity}`;
		n.push(Me(e, Ne(t.subtotal)) + "\n");
	}
	return n.push("--------------------------------\n"), n.push(X.BOLD_ON), n.push(Me("TOTAL", Ne(e.total_amount)) + "\n"), n.push(X.BOLD_OFF), n.push(X.ALIGN_CENTER), n.push("\nSalamat po!\n"), n.push(X.FEED(4)), n.push(X.CUT), n.join("");
}
async function Fe(e, t) {
	if (!Z?.isOpen && !(await Q(J)).ok) return {
		ok: !1,
		error: "Printer not connected"
	};
	try {
		let n = Pe(e, t), r = new TextEncoder(), i = Buffer.from(r.encode(n));
		return await new Promise((e, t) => {
			Z.write(i, (n) => {
				n ? t(n) : Z.drain(() => e());
			});
		}), { ok: !0 };
	} catch (e) {
		return {
			ok: !1,
			error: e instanceof Error ? e.message : "Print failed"
		};
	}
}
//#endregion
//#region electron/ipc/printerHandlers.ts
function Ie() {
	r.handle("printer:connect", async (e, t) => await Q(t)), r.handle("printer:disconnect", async () => (await ke(), { ok: !0 })), r.handle("printer:status", () => Ae()), r.handle("printer:print", async (e, t) => {
		try {
			return await Fe(t.orderData, t.branchName);
		} catch (e) {
			return {
				ok: !1,
				error: e instanceof Error ? e.message : "Print failed"
			};
		}
	});
}
//#endregion
//#region electron/main.ts
var $ = null, Le = process.env.NODE_ENV === "development", Re = "http://localhost:3000";
function ze() {
	$ = new t({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 600,
		webPreferences: {
			preload: i.join(__dirname, "preload.js"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		title: "Tapsilogan POS",
		autoHideMenuBar: !0
	}), Le ? ($.loadURL(Re), $.webContents.openDevTools()) : $.loadFile(i.join(__dirname, "../.output/public/index.html")), $.on("closed", () => {
		$ = null;
	});
}
n.whenReady().then(async () => {
	setTimeout(ze, 1500), Ie(r), je().catch((e) => {
		console.error("Printer init failed:", e);
	});
}), n.on("window-all-closed", () => {
	process.platform !== "darwin" && n.quit();
}), n.on("activate", () => {
	$ === null && ze();
});
//#endregion
export {};
