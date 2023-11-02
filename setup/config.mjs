import { mkdirSync, readdir, readFile, readFileSync, statSync, writeFile } from 'fs';
import * as readline from 'readline';
import { basename, dirname, join } from 'path';

class Cascade extends Array {
	
	static $get = Symbol('Cascade.$get');
	static $merge = Symbol('Cascade.$merge');
	
	static get(object, ...keys) {
		
		return	keys.length ?
						object && typeof object === 'object' ? Cascade.get(object[keys[0]], ...keys.slice(1)) : undefined :
						object;
		
	}
	static geti(object, ...keys) {
		
		if (keys.length) {
			
			if (object && typeof object === 'object') {
				
				const propNames = Object.keys(object), propNamesLength = propNames.length, key = keys[0].toLowerCase();
				let i;
				
				i = -1;
				while (++i < propNamesLength && propNames[i].toLowerCase() !== key);
				
				if (i !== propNamesLength) return Cascade.geti(object[propNames[i]], ...keys.slice(1));
				
			}
			
			return undefined;
			
		}
		
		return object;
		
	}
	
	constructor() { super(...arguments); }
	
	get() {
		
		//const { constructor: { get, geti }, ignoresCase, length } = this;
		//let i,v, method;
		//
		//i = -1, method = ignoresCase ? geti : get;
		//while (++i < length) if ((v = method(this[i], ...keys)) !== undefined) return v;
		
		return this[Cascade.$get](Cascade.get, false, arguments);
		
	}
	getAll() {
		
		//const { constructor: { get, geti }, length } = this, values = [];
		//let i,i0, v, method;
		//
		//i = i0 = -1, method = ignoresCase ? geti : get;
		//while (++i < length) (v = method(this[i], ...keys)) !== undefined && (values[++i0] = v);
		//
		//return values;
		
		return this[Cascade.$get](Cascade.get, true, arguments);
		
	}
	geti() {
		
		return this[Cascade.$get](Cascade.geti, false, arguments);
		
	}
	getiAll() {
		
		return this[Cascade.$get](Cascade.geti, true, arguments);
		
	}
	merge() {
		
		//const { iterator } = Symbol, values = this.getAll(...arguments).reverse(), valuesLength = values.length;
		//let i, v;
		//
		//i = -1;
		//while (++i < valuesLength && !((v = values[i]) && typeof v === 'object'));
		//
		//if (i === valuesLength) return v;
		//else if (typeof v[iterator] === 'function') {
		//	
		//	const merged = [];
		//	
		//	i = -1;
		//	while (++i < valuesLength) typeof (v = values[i])[iterator] === 'function' && merged.push(...v);
		//	
		//	return merged;
		//	
		//} else return Object.assign({}, ...values);
		
		return this[Cascade.$merge](this.getAll, arguments);
		
	}
	mergei() {
		
		return this[Cascade.$merge](this.getiAll, arguments);
		
	}
	merger() {
		
		return new Cascade(...this).reverse().merge(...arguments);
		
	}
	mergeri() {
		
		return new Cascade(...this).reverse().mergei(...arguments);
		
	}
	
}
Cascade.prototype[Cascade.$get] = function (method, all, keys) {
	
	if (typeof method === 'function') {
		
		const { length } = this, values = all && [];
		let i,i0,v;
		
		i = i0 = -1;
		while (++i < length) {
			
			if ((v = method(this[i], ...keys)) !== undefined) {
				
				if (!values) return v;
				
				values[++i0] = v;
				
			}
			
		}
		
		return values || undefined;
		
	}
	
},
Cascade.prototype[Cascade.$merge] = function (method, keys) {
	
	if (typeof method === 'function') {
		
		const { iterator } = Symbol, values = method.apply(this, keys).reverse(), valuesLength = values.length;
		let i, v;
		
		i = -1;
		while (++i < valuesLength && !((v = values[i]) && typeof v === 'object'));
		
		if (i === valuesLength) return v;
		else if (typeof v[iterator] === 'function') {
			
			const merged = [];
			
			i = -1;
			while (++i < valuesLength) typeof (v = values[i])[iterator] === 'function' && merged.push(...v);
			
			return merged;
			
		} else return Object.assign({}, ...values);
		
	}
	
};

class Placeholder extends Cascade {
	
	static innerRx = /\s*?\[\s*?([^\s\[\]]+?)\s*?\]\s*?/gm;
	static outerRx = /<\s*?(\[.*?\])\s*?>/gm;
	
	constructor(placeholders, outerRx, innerRx) {
		
		Array.isArray(placeholders) || (placeholders = [ placeholders ]),
		
		super(...placeholders);
		
		const { constructor: { innerRx: irx, outerRx: orx } } = this;
		
		this.outerRx = outerRx instanceof RegExp ? outerRx : orx,
		this.innerRx = innerRx instanceof RegExp ? innerRx : irx;
		
	}
	
	replace(str) {
		
		const { innerRx, outerRx } = this, keys = [];
		let i, v, replaced, lastIndex;
		
		i = -1, replaced = '', lastIndex = 0;
		for (const { 0: outer, 1: outerContent, index: outerIndex } of str.matchAll(outerRx)) {
			
			i = -1, keys.length = 0;
			for (const { 1: innerContent } of outerContent.matchAll(innerRx)) keys[++i] = innerContent?.trim?.();
			
			i === -1 ||	(v = this.geti(...keys)) === undefined ||
				(replaced += str.substring(lastIndex, outerIndex) + v, lastIndex = outerIndex + outer.length);
			
		}
		
		return replaced + str.substring(lastIndex);
		
	}
	
}

class Msg extends Cascade {
	
	constructor(msgs, placeholders, outerRx, innerRx) {
		
		Array.isArray(msgs) || (msgs = [ msgs ]),
		
		super(...msgs);
		
		this.placeholder =
			placeholders instanceof Placeholder ? placeholders : new Placeholder(placeholders, outerRx, innerRx);
		
	}
	
	get() {
		
		return this.placeholder.replace(this[Cascade.$get](Cascade.get, false, arguments));
		
	}
	geti() {
		
		return this.placeholder.replace(this[Cascade.$get](Cascade.geti, false, arguments));
		
	}
	
}

class RL extends Msg {
	
	constructor(rl, ...args) {
		
		super(...args);
		
		this.rl = rl || readline.createInterface({ input: process.stdin, output: process.stdout });
		
	}
	
	close() {
		
		this.rl.close();
		
	}
	q(callback) {
		
		this.rl.question(this.geti('q'), callback);
		
	}
	w() {
		
		this.write(false, arguments);
		
	}
	wi() {
		
		this.write(true, arguments);
		
	}
	write(ignoresCase, keys) {
		
		this.rl.write(this['get' + (ignoresCase ? 'i' : '')](...keys));
		
	}
	
}

const	hi = console.log.bind(console, 'hi'),
		msg = {
			'ja-JP': {
				createdFile: 'ファイルを作成しました: "<[path]>"\n',
				fileExistedPrompt: '\n  "<[path]>"\n\n上記ファイルは既に存在しています。\n\n[別名で新規作成=任意の名前, 作成しない=未入力, 上書き=!]\n',
				fileExistedPromptDefault: '\n "<[path]>"\n\n上記と同名のファイルが既に存在します。\n\n[ファイル名を変更する=任意の名前, 何もしない=未入力, ファイル名を変更しない=!]\n',
				noPresetFile: '\nファイル "<[filePath]>" が存在しません。\n同ファイルを使った新規ファイルの作成は中止されます。',
				q: '>'
			}
		},
		msgData = {},
		rl = new RL(undefined, [ msg['ja-JP'] ], new Placeholder(msgData)),
		path = new Placeholder(JSON.parse(process.argv[3])),
		//place = (target, placeholder, outerRx, innerRx) => {
		//	
		//	placeholder instanceof Cascade || (placeholder = new Cascade(placeholder));
		//	
		//	const keys = [];
		//	let i, replaced, lastIndex;
		//	
		//	i = -1, replaced = '', lastIndex = 0;
		//	for (const matched of target.matchAll(outerRx)) {
		//		
		//		i = -1, keys.length = 0;
		//		for (const matched0 of matched[1].matchAll(innerRx)) keys[++i] = matched0[1].trim();
		//		
		//		i === -1 ||	(v = placeholder.geti(...keys)) === undefined ||
		//			(
		//				replaced += target.substring(lastIndex, matched.index) + v,
		//				lastIndex = matched.index + matched[0].length
		//			);
		//		
		//	}
		//	
		//	return replaced + target.substring(lastIndex);
		//	
		//},
		confirmFile = async (path, option, ...args) => {
			
			typeof option === 'function' && (option = { confirmed: option }),
			(option && typeof option === 'object') || (option = {}),
			option.rl || (option.rl = readline.createInterface({ input: process.stdin, output: process.stdout }));
			
			const	{ confirmed, existed, rj, rl, rs } = option,
					confirming =
						(rs, rj) => {
							
							let stat;
							
							option.rs = rs, option.rj = rj;
							
							try { stat = statSync(path); } catch (error) {}
							
							if (stat?.isFile?.()) {
								
								typeof existed === 'function' ?
									existed(path, option, ...args) :
									(
										rl.wi('fileExistedPromptDefault'),
										rl.q	(
													input =>	input ?
																	input === '!' ?
																		confirmed?.(rl, path, option, ...args) :
																		(
																			rl.close(),
																			confirmFile(join(dirname(path), input), option, ...args)
																		) :
																	rl.close()
												)
									);
								
							} else confirmed?.(path, option, ...args);
							
						};
			
			return rs && rj ? confirming(rs, rj) : new Promise(confirming);
			
		},
		confirmDir =	async (path, callback, ...args) => {
								
								try { mkdirSync(path, { recursive: true }); } catch (error) {}
								
								await callback(path, ...args);
								
							},
		paths = [ process.cwd() ],
		gwPlaceholder = new Placeholder();
let i,l,i0, k,v, filePath, file, preset;

v = paths[i = 0];
while (v !== (v = dirname(v))) paths[++i] = v;
paths[++i] = path.geti('installed');

i = i0 = -1, l = paths.length;
while (++i < l) {
	
	try {
		
		v = JSON.parse(path.replace(readFileSync(join(paths[i], 'gw.placeholder.json'), 'utf8'))),
		(gwPlaceholder[++i0] = v).path = path[0];
		
	} catch (error) {}
	
}

const confirmFileOption = 
			{
				confirmed(path, option, ...args) {
					
					const { rj, rl, rs } = option;
					
					writeFile	(
										msgData.path = path,
										gwPlaceholder.replace(file),
										error => error ?	(console.error(error), rj?.()) :
																(rl.wi('createdFile'), rs?.())
									);
					
				},
				existed(path, option, ...args) {
					
					const { confirmed, rl, rs } = option;
					
					msgData.path = path,
					
					rl.wi('fileExistedPromptDefault'),
					rl.q	(
								input =>	input ?
												input === '!' ?
													confirmed?.(path, option, ...args) :
													confirmFile(join(dirname(path), input), option, ...args) :
												rs?.()
							);
					
				},
				rl
			},
		confirmDirCallback =
			async (path, preset, file) =>
				await confirmFile	(
					join(path, basename(preset.path).replace(new RegExp(...preset.renameRx[0]), preset.renameRx[1])),
					{ ...confirmFileOption }
				),
		gwPreset = gwPlaceholder.merge('preset');

for (k in gwPreset) {
	
	try {
		
		file = readFileSync(msgData.path = (preset = gwPreset[k]).path, 'utf8');
		
	} catch (error) {
		
		rl.wi('noPresetFile');
		
		continue;
		
	}
	
	await confirmDir(preset.dst, confirmDirCallback, preset, file);
	
}

rl.close();