@echo off
setLocal enableextensions enabledelayedexpansion

set PATH_APPDATA=%appdata:\=/%/
set PATH_PROJECT=%~dp1
set PATH_PROJECT=%PATH_PROJECT:\=/%
set PATH_INSTALLED=%~dp2
set PATH_INSTALLED=%PATH_INSTALLED:\=/%
set PATH_SETUP=%~dp0
set PATH_SETUP=%PATH_SETUP:\=/%
set PATH_CONFIG=%PATH_SETUP%config/
set NODE=%~3
set NPM=%~4
set SOURCES_DIR_NAME=gw
set IMPORT_FILE_NAME=index.js
set BUNDLED_FILE_NAME=%SOURCES_DIR_NAME%.js

set pathJSON={^
	\"appdata\": \"%PATH_APPDATA%\",^
	\"bundledFileName\": \"%BUNDLED_FILE_NAME%\",^
	\"config\": \"%PATH_CONFIG%\",^
	\"configLangs\": \"%PATH_CONFIG%langs/\",^
	\"globalNPM\": \"%PATH_APPDATA%npm/\",^
	\"globalNPMModules\": \"%PATH_APPDATA%npm/node_modules/\",^
	\"importFileName\": \"%IMPORT_FILE_NAME%\",^
	\"installed\": \"%PATH_INSTALLED%\",^
	\"node\": \"%NODE:\=/%\",^
	\"npm\": \"%NPM:\=/%\",^
	\"project\": \"%PATH_PROJECT%\",^
	\"presets\": \"%PATH_INSTALLED%presets/\",^
	\"setup\": \"%PATH_SETUP%\",^
	\"sources\": \"%PATH_PROJECT%%SOURCES_DIR_NAME%/\",^
	\"sourcesDirName\": \"%SOURCES_DIR_NAME%\"^
}

call %3 "%~dp2\setup\config\config.mjs" "%pathJSON%"

endlocal
pause
exit