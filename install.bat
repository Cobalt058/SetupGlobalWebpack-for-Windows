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
	echo ���g���̃V�X�e���� Node.js ���C���X�g�[������Ă��Ȃ����A
	echo Node.js �̎��s�ɕK�v�ȃp�X���ݒ肳��Ă��܂���B
	echo �p�X�̓V�X�e���̊��ϐ����A���̃o�b�`�t�@�C�����Ŏw�肷�邱�Ƃ��ł��܂��B
	echo;
	echo [����̃u���E�U�[�� Node.js �̃_�E�����[�h�y�[�W���J��=y]
	set /p openNodeDLPage=^>
	
	if /i "!openNodeDLPage!" == "y" start "" "%NODE_DOWNLOAD_PAGE_URL%"
	
	echo;
	echo [���̃o�b�`�t�@�C�����Ď��s����=y]
	set /p runAgain=^>
	
	if /i "!runAgain!" == "y" goto :begin_process
	
	goto :end_process
	
)

set option=

echo;
echo [�C���X�g�[���I�v�V���������: �w���v��\��=--h]
set /p option=^>
echo;

if "%option%" == "--h" (
	
	call :view_install_modules "%INSTALL_MODULES%"
	echo;
	
	echo �C���X�g�[����͈ȉ��ł��B
	echo;
	echo   "%appdata%\npm\node_modules\"
	echo;
	echo ���ɃC���X�g�[������Ă���ꍇ�A�㏑���C���X�g�[������܂��B
	echo �ȉ��̃C���X�g�[���I�v�V��������͂ł��܂��B
	echo �����͂̏ꍇ�A��L�̃��W���[���������C���X�g�[�����܂��B
	echo;
	echo   �C���X�g�[�����郂�W���[����ǉ�
	echo     --i module0 module1 module2...
	echo;
	echo   ����̃��W���[���̃C���X�g�[���̃X�L�b�v
	echo     --x module0 module1 module2...
	echo;
	echo   ����̃��W���[���̃C���X�g�[�������ׂăX�L�b�v
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
	echo ��낵����� y ����͂��Ă��������B
	echo �����͂��A����ȊO����͂���ƁA�C���X�g�[���𒆎~���ďI�����܂��B
	echo;
	echo [��L�̃��W���[�����C���X�g�[������=y]
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
	echo ���ꂩ��쐬����Z�b�g�A�b�v�p�̃t�@�C���Ɠ����̃t�@�C�������ɑ��݂��܂��B
	echo;
	echo [�㏑������=������, �ʂ̖��O�ŐV�K�쐬����=�C�ӂ̖��O]
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

echo �Z�b�g�A�b�v�p�̃t�@�C�� "!SETUP_BAT_OUTPUT_PATH!" ���쐬���܂����B
echo �v���W�F�N�g��V�K�쐬����ۂɁA
echo ���̃��[�g�t�H���_�[�ɂ��̃t�@�C�����R�s�[���Ď��s���Ă��������B
echo;

:end_process

echo �C���X�g�[�����I�����܂��B�C�ӂ̃L�[�������Ă��������B

endlocal
pause>nul
exit

:view_install_modules
echo �ȉ��̃��W���[�����C���X�g�[�����܂��B
echo;

set values=console.log('%~1'.replace(/\s/g, '\n'));

for /f "usebackq" %%i in (`node -e "%values%"`) do echo   %%i

exit /b