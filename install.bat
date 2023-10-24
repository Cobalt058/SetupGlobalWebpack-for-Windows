@echo off
setLocal enableextensions enabledelayedexpansion

set SETUP_BAT_INPUT_PATH=setup.bat.preset
set SETUP_BAT_OUTPUT_PATH=setup.bat

call npm i -g webpack webpack-cli babel-loader @babel/core @babel/preset-env core-js

node --input-type=module -e ^
"import { readFile, writeFile } from 'fs';^
import { dirname } from 'path';^
readFile(^
	'%SETUP_BAT_INPUT_PATH%',^
	'utf8',^
	(error, file) =^> writeFile('%SETUP_BAT_OUTPUT_PATH%', file.replace(/^<^<INSTALLER_PATH^>^>/g, dirname(process.argv[1]) + '\\'), ()=^>{})^
);" %0

endlocal
pause
exit