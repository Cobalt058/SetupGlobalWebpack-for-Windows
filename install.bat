@echo off
setLocal enableextensions enabledelayedexpansion

set NODE_PATH=node

set NODE_DOWNLOAD_PAGE_URL=https://nodejs.org/en/download

set SETUP_BAT_INPUT_PATH=setup.bat.preset
set SETUP_BAT_OUTPUT_PATH=setup.bat

set INSTALL_MODULES=webpack webpack-cli babel-loader @babel/core @babel/preset-env core-js

:begin_process

call "%NODE_PATH%" --version > nul 2>&1

if errorlevel 1 (
	
	echo;
	echo お使いのシステムに Node.js がインストールされていないか、
	echo Node.js の実行に必要なパスが設定されていません。
	echo パスはシステムの環境変数か、このバッチファイル内で指定することができます。
	echo;
	echo [既定のブラウザーで Node.js のダウンロードページを開く=y]
	set /p openNodeDLPage=^>
	
	if /i "!openNodeDLPage!" == "y" start "" "%NODE_DOWNLOAD_PAGE_URL%"
	
	echo;
	echo [このバッチファイルを再実行する=y]
	set /p runAgain=^>
	
	if /i "!runAgain!" == "y" goto :begin_process
	
	goto :end_process
	
)

set option=

echo;
echo [インストールオプションを入力: ヘルプを表示=--h]
set /p option=^>
echo;

if "%option%" == "--h" (
	
	call :view_install_modules "%INSTALL_MODULES%"
	echo;
	
	echo インストール先は以下です。
	echo;
	echo   "%appdata%\npm\node_modules\"
	echo;
	echo 既にインストールされている場合、上書きインストールされます。
	echo 以下のインストールオプションを入力できます。
	echo 未入力の場合、上記のモジュールだけをインストールします。
	echo;
	echo   インストールするモジュールを追加
	echo     --i module0 module1 module2...
	echo;
	echo   特定のモジュールのインストールのスキップ
	echo     --x module0 module1 module2...
	echo;
	echo   既定のモジュールのインストールをすべてスキップ
	echo     --x
	
	goto :begin_process
	
)

set installModules=^
const	im = '%option%'.match(/(?:^^^|.*?\s+)--i(?:\s+(.*?)(?:\s*?^|\s+--.*?)$^|$)/)?.[1]?.trim?.()?.split?.(' ') ?? [],^
		xMatched = '%option%'.match(/(?:^^^|.*?\s+)--x(?:\s+(.*?)(?:\s*?^|\s+--.*?)$^|$)/),^
		xm = xMatched ^&^& (xMatched[1] ? xMatched[1].trim().split(' ') : []),^
		im0 = [ ...new Set([ ...(xm ^&^& xm.length === 0 ? [] : '%INSTALL_MODULES%'.split(' ')), ...im ]) ];^
console.log((xm ? im0.filter(v =^> xm.indexOf(v) === -1) : im0).join('\n'));
set modules=
for /f "usebackq" %%i in (`node -e "%installModules%"`) do set modules=!modules! %%i

if defined modules (
	
	call :view_install_modules "%modules%"
	
	echo;
	echo よろしければ y を入力してください。
	echo 未入力か、それ以外を入力すると、インストールを中止して終了します。
	echo;
	echo [上記のモジュールをインストールする=y]
	set /p confirm=^>
	echo;
	
	if /i not "!confirm!" == "y" endlocal&exit
	
	call npm i -g%modules%
	
)
echo;

:create_setup_file

if exist "!SETUP_BAT_OUTPUT_PATH!" (
	
	echo   "!SETUP_BAT_OUTPUT_PATH!"
	echo;
	echo これから作成するセットアップ用のファイルと同名のファイルが既に存在します。
	echo;
	echo [上書きする=未入力, 別の名前で新規作成する=任意の名前]
	set /p setupBatOutputPath=^>
	echo;
	
	if defined setupBatOutputPath set SETUP_BAT_OUTPUT_PATH=setupBatOutputPath&goto :create_setup_file
	
)

node --input-type=module -e ^
"import { readFile, writeFile } from 'fs';^
import { dirname } from 'path';^
readFile(^
	'%SETUP_BAT_INPUT_PATH%',^
	'utf8',^
	(error, file) =^> error ^|^| writeFile('%SETUP_BAT_OUTPUT_PATH%', file.replace(/^<^<INSTALLER_PATH^>^>/g, dirname(process.argv[1]) + '\\'), ()=^>{})^
);" %0

echo セットアップ用のファイル "!SETUP_BAT_OUTPUT_PATH!" を作成しました。
echo プロジェクトを新規作成する際に、
echo そのルートフォルダーにこのファイルをコピーして実行してください。
echo;

:end_process

echo インストールを終了します。任意のキーを押してください。

endlocal
pause>nul
exit

:view_install_modules
echo 以下のモジュールをインストールします。
echo;

set values=console.log('%~1'.replace(/\s/g, '\n'));

for /f "usebackq" %%i in (`node -e "%values%"`) do echo   %%i

exit /b