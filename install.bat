@echo off
setLocal enableextensions enabledelayedexpansion

rem 理由はわからないが、システムの環境変数に設定した npm を想定して "npm" で実行すると、
rem npm で読み込むモジュールを npm が存在するフォルダー配下ではなく、
rem このバッチの実行フォルダー配下にあるものとして読み込もうとして実行に失敗する。
rem そのため、このバッチ中では以下の環境変数 NPM を使う際は常に二重引用符 (") を使わずに展開するため、
rem 以下の環境変数 NPM に任意のパスを指定する時に、そのパスに**空白が含まれる場合**は
rem 以下のように必ず自分自身でパスの前後を二重引用符で囲うこと。
rem set NPM="C:\\a\b c\d\npm"
rem node はそうした動作はしないようだが、統一性を持たせるため NPM と同じ仕様にしている。
set NODE=node
set NPM=npm

set NODE_DOWNLOAD_PAGE_URL=https://nodejs.org/en/download

set SETUP_BAT_INPUT_PATH=gw.setup.bat.preset
set SETUP_BAT_OUTPUT_PATH=gw.setup.bat

set DEFAULT_INSTALL_MODULES=webpack webpack-cli babel-loader @babel/core @babel/preset-env core-js

:begin_process

call %NODE% --version > nul 2>&1

if errorlevel 1 (
	
	echo;
	echo お使いのシステムに Node.js がインストールされていないか、
	echo Node.js の実行に必要なパスが設定されていません。
	echo パスはシステムの環境変数か、このバッチファイル内で指定することができます。
	echo;
	call :require_node "%NODE_DOWNLOAD_PAGE_URL%"
	
	if "!requiresNode!" == "1" goto :begin_process
	
	goto :end_process
	
)

call %NPM% -version > nul 2>&1

if errorlevel 1 (
	
	echo;
	echo お使いのシステムに NPM がインストールされていないか、
	echo NPM の実行に必要なパスが設定されていません。
	echo Node.js のインストールが不十分である可能性があります。
	echo;
	call :require_node "%NODE_DOWNLOAD_PAGE_URL%"
	
	if "!requiresNode!" == "1" goto :begin_process
	
	goto :end_process
	
)

set option=

echo;
echo [インストールオプションを入力: ヘルプを表示=--h]
set /p option=^>
echo;

if "%option%" == "--h" (
	
	echo 以下は規定でインストールされるモジュールです。
	echo;
	
	call :view_install_modules "%DEFAULT_INSTALL_MODULES%"
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
		im0 = [ ...new Set([ ...(xm ^&^& xm.length === 0 ? [] : '%DEFAULT_INSTALL_MODULES%'.split(' ')), ...im ]) ];^
console.log((xm ? im0.filter(v =^> xm.indexOf(v) === -1) : im0).join('\n'));
set modules=
for /f "usebackq" %%i in (`call %NODE% -e "%installModules%"`) do set modules=!modules! %%i

if defined modules (
	
	echo 以下のモジュールがインストールされます。
	echo;
	
	call :view_install_modules "%modules%"
	
	echo;
	echo よろしければ y を入力してください。
	echo 未入力か、それ以外を入力すると、インストールを中止して終了します。
	echo;
	echo [上記のモジュールをインストールする=y]
	set /p confirm=^>
	echo;
	
	if /i not "!confirm!" == "y" endlocal&exit
	
	call %NPM% i -g%modules%
	
)
echo;

:create_setup_file

if exist "!SETUP_BAT_OUTPUT_PATH!" (
	
	echo これから作成するセットアップ用のファイル "!SETUP_BAT_OUTPUT_PATH!" と
	echo 同名のファイルが既に存在します。
	echo;
	echo [上書きする=未入力, 別の名前で新規作成する=任意の名前]
	set /p setupBatOutputPath=^>
	echo;
	
	if defined setupBatOutputPath set SETUP_BAT_OUTPUT_PATH=setupBatOutputPath&goto :create_setup_file
	
)

call %NODE% --input-type=module -e ^
"import { readFile, writeFile } from 'fs';^
import { dirname } from 'path';^
const { argv: { 1: installed, 2: node, 3: npm } } = process;^
readFile(^
	'%SETUP_BAT_INPUT_PATH%',^
	'utf8',^
	(error, file) =^> error ^|^| writeFile('%SETUP_BAT_OUTPUT_PATH%', file.replace(/^<\[path\]\[installed\]^>/gi, dirname(installed) + '\\').replace(/^<\[path\]\[node\]^>/gi, node).replace(/^<\[path\]\[npm\]^>/gi, npm), ()=^>{})^
);" %0 %NODE% %NPM%

echo セットアップ用のファイル "!SETUP_BAT_OUTPUT_PATH!" を作成しました。
echo プロジェクトを新規作成する際は、その都度
echo プロジェクトのルートフォルダーにこのファイルをコピーして実行してください。
echo;

:end_process

echo インストールを終了します。任意のキーを押してください。

endlocal
pause>nul
exit

:view_install_modules

set values=console.log('%~1'.replace(/\s/g, '\n'));

for /f %%i in ('call %NODE% -e "%values%"') do echo   %%i

exit /b

:require_node

echo [既定のブラウザーで Node.js のダウンロードページを開く=y]
set /p openNodeDLPage=^>

if /i "!openNodeDLPage!" == "y" start "" %1

echo;
echo [このバッチファイルを再実行する=y]
set /p runAgain=^>

if /i "!runAgain!" == "y" set requiresNode=1

exit /b