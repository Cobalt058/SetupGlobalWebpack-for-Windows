@echo off
setLocal enableextensions enabledelayedexpansion

set PATH_APPDATA=%appdata:\=/%/
set PATH_GLOBAL_NPM_MODULES=%PATH_APPDATA%npm/node_modules/
set PATH_PROJECT=%~dp1
set PATH_PROJECT=%PATH_PROJECT:\=/%
set PATH_INSTALLER=%~dp2
set PATH_INSTALLER=%PATH_INSTALLER:\=/%
set PATH_PRESETS=%PATH_INSTALLER%presets/

call node --input-type=module -e ^
"import { mkdir, readdir, readFile, stat, writeFile } from 'fs';^
import { basename } from 'path';^
const fixDirPath = (path) =^> path + (path[path.length - 1] === '\\' ? '' : '\\'),^
		presetsPath = fixDirPath('%PATH_PRESETS%'),^
		placeholders =	[^
								{ targetRx: [ '^<^<PATH_APPDATA^>^>', 'gi' ], value: '%PATH_APPDATA%' },^
								{ targetRx: [ '^<^<PATH_GLOBAL_NPM_MODULES^>^>', 'gi' ], value: '%PATH_GLOBAL_NPM_MODULES%' }^
							],^
		placeholdersLength = placeholders.length,^
		configs =	[^
							{^
								path: presetsPath + 'babel.config.json.preset',^
								dst: '%PATH_PROJECT%',^
								renameRx: [ [ '(.*?)\\.preset$', 'i' ], '$1' ]^
							},^
							{^
								path: presetsPath + 'webpack.config.js.preset',^
								dst: '%PATH_PROJECT%',^
								renameRx: [ [ '(.*?)\\.preset$', 'i' ], '$1' ]^
							},^
							{^
								path: presetsPath + 'exec.bat.preset',^
								dst: '%PATH_PROJECT%',^
								renameRx: [ [ '(.*?)\\.preset$', 'i' ], '$1' ]^
							},^
							{^
								path: presetsPath + 'exec-watch.bat.preset',^
								dst: '%PATH_PROJECT%',^
								renameRx: [ [ '(.*?)\\.preset$', 'i' ], '$1' ]^
							}^
						],^
		configsLength = configs.length,^
		confirm = (path, callback, asFile, ...args) =^> {^
			^
			stat(^
				path = asFile ? path : fixDirPath(path),^
				(error, stats) =^> {^
					^
					^^!error ^&^& stats['is' + (asFile ? 'File' : 'Directory')] ?^
						callback(path, ...args) :^
						asFile ^|^| mkdir(path, { recursive: true }, error =^> error ^|^| callback(path, ...args))^
					^
				}^
			);^
			^
		};^
let i, cfg, filePath;^
i = -1;^
while (++i ^< configsLength) {^
	^
	readFile(^
		filePath = (cfg = configs[i]).path,^
		'utf8',^
		((cfg, filePath) =^> (error, file) =^> {^
			^
			if (^^!error) {^
				^
				let i, replaced, placeholder, dst;^
				^
				i = -1, replaced = file;^
				while (++i ^< placeholdersLength)^
					replaced = replaced.replace(new RegExp(...(placeholder = placeholders[i]).targetRx), placeholder.value);^
				^
				confirm(^
					dst = fixDirPath(cfg.dst),^
					(path, cfg, dst) =^>^
						writeFile(dst + basename(filePath).replace(new RegExp(...cfg.renameRx[0]), cfg.renameRx[1]), replaced, ()=^>{}),^
					false,^
					cfg,^
					dst^
				);^
				^
			}^
			^
		})(cfg, filePath)^
	);^
	^
}^
" %~dp0

endlocal
pause
exit