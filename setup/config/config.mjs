import { mkdirSync, readdirSync, readFile, readFileSync, statSync, writeFile } from 'fs';
import * as readline from 'readline';
import { basename, dirname, join } from 'path';
import { default as Cascade, Placeholder, RL } from './cascade.mjs';

const	hi = console.log.bind(console, 'hi'),
		path = new Placeholder(JSON.parse(process.argv[2])),
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
		gwPlaceholder = new Placeholder(),
		langPath = path.get('configLangs'),
		langFileNames = readdirSync(langPath, { encoding: 'utf8' });
let i,l,i0, k,v, file, preset, langs;

v = paths[i = 0];
while (v !== (v = dirname(v))) paths[++i] = v;
paths[++i] = path.get('installed');

i = i0 = -1, l = paths.length;
while (++i < l) {
	
	try {
		
		v = JSON.parse(path.replace(readFileSync(join(paths[i], 'gw.placeholder.json'), 'utf8'))),
		(gwPlaceholder[++i0] = v).path = path[0];
		
	} catch (error) {}
	
}

Array.isArray(langs = gwPlaceholder.geti('setting', 'setup', 'config.bat', 'langs')) || (langs = [ langs ]);


i = -1, l = langs.length;
while (++i < l)	(i0 = langFileNames.indexOf((v = langs[i]) + '.json')) === -1 ?
							(langs.splice(i--, 1), --l) :
							(langs[i] = JSON.parse(readFileSync(join(langPath, langFileNames[i0]), 'utf8')));

const msgData = {}, rl = new RL(undefined, langs, new Placeholder(msgData));

const confirmFileOption = 
			{
				confirmed(path, option, ...args) {
					
					const { rj, rl, rs } = option;
					
					writeFile	(
										msgData.path = path,
										gwPlaceholder.replace(file),
										error => error ? (console.error(error), rj?.()) : (rl.wi('createdFile'), rs?.())
									);
					
				},
				existed(path, option, ...args) {
					
					const { confirmed, rl, rs } = option;
					
					msgData.path = path,
					
					rl.wi('fileExistedPrompt'),
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