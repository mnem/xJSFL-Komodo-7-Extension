cls

REM md build\chrome

7z a -tzip "xjsfl.jar" ".\content\"  -mx=0

move xjsfl.jar			build

xcopy apicatalogs		build\apicatalogs		/s /i
xcopy components		build\components		/s /i
xcopy content			build\content			/s /i
xcopy pylib				build\pylib				/s /i
xcopy templates			build\templates			/s /i
xcopy tools				build\tools				/s /i

copy chrome.manifest	build
copy install.rdf		build
copy icon.png			build

cd build

7z a -tzip "xjsfl.xpi" *
move "xjsfl.xpi" ..\

cd..
